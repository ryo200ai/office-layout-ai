"""
layout_generator.py — floor_outline + 要件 → Claude API → furniture[] JSON
Priority 2 実装

使い方:
    python3 layout_generator.py <floor_outline.json> [要件JSON or オプション]

出力:
    furniture_layout.json
    {
      "furniture": [
        {"type":"desk","x":500,"y":500,"w":1200,"h":700,"angle":0,"label":"執務A-1"},
        {"type":"meeting_table","x":5000,"y":500,"w":3600,"h":1800,"angle":0,"label":"会議室A"},
        ...
      ],
      "zones": [
        {"label":"執務スペース","x":0,"y":0,"w":60,"h":50,"color":"#3B82F6"},
        ...
      ],
      "summary": "レイアウトサマリー（日本語）"
    }
"""

import os
import sys
import json
from pathlib import Path

try:
    import anthropic
except ImportError:
    print("ERROR: anthropic パッケージが必要です。pip install anthropic")
    sys.exit(1)


# 標準家具サイズ（mm）
FURNITURE_SIZES = {
    "desk":            {"w": 1200, "h": 700,  "label": "執務デスク"},
    "desk_large":      {"w": 1400, "h": 700,  "label": "大型デスク"},
    "meeting_2":       {"w": 1200, "h": 600,  "label": "2名用テーブル"},
    "meeting_4":       {"w": 1800, "h": 900,  "label": "4名用テーブル"},
    "meeting_6":       {"w": 2400, "h": 1200, "label": "6名用テーブル"},
    "meeting_8":       {"w": 3000, "h": 1500, "label": "8名用テーブル"},
    "meeting_10":      {"w": 3600, "h": 1500, "label": "10名用テーブル"},
    "phone_booth":     {"w": 1200, "h": 1200, "label": "テレフォンブース"},
    "lounge_sofa":     {"w": 1800, "h": 800,  "label": "ソファ"},
    "lounge_table":    {"w": 800,  "h": 500,  "label": "ラウンジテーブル"},
    "storage":         {"w": 900,  "h": 450,  "label": "収納"},
    "printer":         {"w": 600,  "h": 600,  "label": "プリンター"},
}

# 通路確保ルール（mm）
AISLE_MAIN  = 1200   # メイン通路
AISLE_SUB   = 600    # サブ通路（デスク間）
WALL_MARGIN = 150    # 壁からの距離

SYSTEM_PROMPT = """あなたはオフィスレイアウト設計の専門AIです。
建築内法輪郭（mm座標）と要件を受け取り、最適な家具配置JSONを返します。

設計ルール:
- 全家具は offset_polygon(floor_outline, 150mm) の内側に収めること
- メイン通路: 1200mm以上確保
- デスク間サブ通路: 600mm以上確保
- 家具は壁から150mm以上離す
- 会議室はできるだけまとめて配置（ゾーン化）
- テレフォンブースは執務エリア隣接配置
- ラウンジはエントランス付近に配置
- 座席は島型（4〜6席単位）またはフリーアドレスで配置

出力形式（JSONのみ、説明不要）:
{
  "furniture": [
    {"type":"desk","x":数値,"y":数値,"w":数値,"h":数値,"angle":0,"label":"執務A-1"},
    ...
  ],
  "zones": [
    {"label":"執務スペース","x":0〜100,"y":0〜100,"w":幅%,"h":高さ%,"color":"#3B82F6"},
    ...
  ],
  "summary": "レイアウトの特徴・ポイント（日本語200字以内）"
}

注意:
- furniture の座標はmm単位（floor_outlineと同じ座標系）
- zones の座標は%単位（0〜100）
- angle は度数（0=水平、90=縦置き）
- 必ずJSONのみを返す
"""


def build_user_prompt(floor_outline: dict, requirements: dict, rag_examples: list = None) -> str:
    """Claude に渡すユーザープロンプトを構築"""

    outline_str = json.dumps(floor_outline.get("outline", []), ensure_ascii=False)
    area = floor_outline.get("area_tsubo", "不明")
    width = floor_outline.get("width_mm", "不明")
    height = floor_outline.get("height_mm", "不明")

    seats = requirements.get("seats", 0)
    meeting_rooms = requirements.get("meetingRooms", [])
    phone_booths = requirements.get("phoneBooths", 0)
    lounge = requirements.get("lounge", False)
    notes = requirements.get("notes", "")

    # 会議室リスト整形
    meeting_str = ""
    for i, room in enumerate(meeting_rooms):
        cap = room.get("capacity", "?")
        meeting_str += f"  - 会議室{i+1}: {cap}名用\n"
    if not meeting_str:
        meeting_str = "  - なし\n"

    # RAG過去事例
    rag_str = ""
    if rag_examples:
        rag_str = "\n## 類似過去事例（参考）\n"
        for ex in rag_examples[:3]:
            rag_str += f"- {ex.get('description','')}\n"

    prompt = f"""## フロア情報
- 内法輪郭（mm）: {outline_str}
- 有効面積: {area} 坪
- 外形寸法: {width}mm × {height}mm
- 壁厚マージン: {WALL_MARGIN}mm（この内側に家具を配置）

## 配置要件
- 席数: {seats} 席
- 会議室:
{meeting_str}- テレフォンブース: {phone_booths} 基
- ラウンジ: {"あり" if lounge else "なし"}
- 特記事項: {notes or "なし"}

## 標準家具サイズ（参考、mm）
{json.dumps(FURNITURE_SIZES, ensure_ascii=False, indent=2)}
{rag_str}
上記仕様に従い、最適な家具配置JSONを返してください。"""

    return prompt


def generate_layout(
    floor_outline: dict,
    requirements: dict,
    rag_examples: list = None,
) -> dict:
    """
    メイン処理: floor_outline + 要件 → Claude API → furniture[] JSON

    Args:
        floor_outline: vision_extractor.py の出力
        requirements: {seats, meetingRooms, phoneBooths, lounge, notes}
        rag_examples: 過去事例リスト（オプション）

    Returns:
        layout dict {furniture, zones, summary}
    """
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise ValueError("環境変数 ANTHROPIC_API_KEY が設定されていません")

    client = anthropic.Anthropic(api_key=api_key)

    print("[1/2] Claude APIにレイアウト生成を依頼中...")
    user_prompt = build_user_prompt(floor_outline, requirements, rag_examples)

    message = client.messages.create(
        model="claude-opus-4-5",
        max_tokens=4096,
        system=SYSTEM_PROMPT,
        messages=[
            {"role": "user", "content": user_prompt}
        ],
    )

    raw_text = message.content[0].text.strip()
    print(f"[2/2] レスポンス受信 ({len(raw_text)} chars)")

    # JSONパース
    if "```json" in raw_text:
        raw_text = raw_text.split("```json")[1].split("```")[0].strip()
    elif "```" in raw_text:
        raw_text = raw_text.split("```")[1].split("```")[0].strip()

    layout = json.loads(raw_text)

    # バリデーション
    assert "furniture" in layout, "furniture キーが必要です"
    assert "zones" in layout, "zones キーが必要です"

    n = len(layout["furniture"])
    print(f"\n✅ レイアウト生成成功!")
    print(f"  家具数: {n}")
    print(f"  ゾーン数: {len(layout['zones'])}")
    print(f"  サマリー: {layout.get('summary','')[:80]}...")

    return layout


def main():
    if len(sys.argv) < 2:
        print("使い方: python3 layout_generator.py <floor_outline.json> [requirements.json]")
        print("例:    python3 layout_generator.py floor_outline.json requirements.json")
        print()
        print("requirements.json の形式:")
        sample_req = {
            "seats": 30,
            "meetingRooms": [{"capacity": "8"}, {"capacity": "4"}],
            "phoneBooths": 2,
            "lounge": True,
            "notes": ""
        }
        print(json.dumps(sample_req, ensure_ascii=False, indent=2))
        sys.exit(1)

    outline_path = sys.argv[1]
    req_path = sys.argv[2] if len(sys.argv) > 2 else None
    output_path = "furniture_layout.json"

    # floor_outline 読み込み
    if not Path(outline_path).exists():
        print(f"ERROR: {outline_path} が見つかりません")
        sys.exit(1)

    with open(outline_path, "r", encoding="utf-8") as f:
        floor_outline = json.load(f)

    # requirements 読み込み（なければデフォルト）
    if req_path and Path(req_path).exists():
        with open(req_path, "r", encoding="utf-8") as f:
            requirements = json.load(f)
    else:
        print("⚠️  requirements.json が指定されていないため、デフォルト値を使用します")
        requirements = {
            "seats": 20,
            "meetingRooms": [{"capacity": "6"}],
            "phoneBooths": 1,
            "lounge": False,
            "notes": ""
        }

    try:
        layout = generate_layout(floor_outline, requirements)

        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(layout, f, ensure_ascii=False, indent=2)

        print(f"\n💾 保存完了: {output_path}")

    except Exception as e:
        print(f"\n❌ エラー: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
