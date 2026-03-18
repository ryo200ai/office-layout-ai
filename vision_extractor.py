"""
vision_extractor.py — 建築図面PDF → Claude Vision API → floor_outline JSON
Priority 1 実装

使い方:
    python3 vision_extractor.py <図面PDFパス> [出力JSONパス]

出力:
    floor_outline.json
    {
      "outline": [[x1,y1],[x2,y2],...],  # mm単位（1/100スケール前提）
      "scale": 100,
      "width_mm": 12000,
      "height_mm": 8000,
      "area_tsubo": 60.5
    }
"""

import os
import sys
import json
import base64
import tempfile
from pathlib import Path

try:
    import anthropic
except ImportError:
    print("ERROR: anthropic パッケージが必要です。pip install anthropic")
    sys.exit(1)

try:
    from pdf2image import convert_from_path
except ImportError:
    print("ERROR: pdf2image が必要です。pip install pdf2image")
    sys.exit(1)


SYSTEM_PROMPT = """あなたは建築図面解析の専門AIです。
建築平面図PDFのPNG画像を受け取り、壁の内側輪郭座標をJSONで返します。

ルール：
- 1/100スケール図面を前提とする（画像上1mm = 実寸100mm）
- 座標はmm単位（実寸）で返す
- 座標は左上原点(0,0)、右方向がX+、下方向がY+
- 輪郭は時計回りで返す
- 柱・壁厚は含めない（内法寸法）
- L字・凹形状など複雑な形状にも対応する
- 必ずJSONのみを返す（説明文不要）
"""

USER_PROMPT = """この建築平面図から、フロア全体の内壁輪郭座標をmm単位のJSONで出力してください。

出力形式（JSONのみ、説明不要）:
{
  "outline": [[0,0],[12000,0],[12000,8000],[0,8000]],
  "scale": 100,
  "width_mm": 12000,
  "height_mm": 8000,
  "area_tsubo": 60.5,
  "notes": "特記事項があれば記載（柱位置・段差等）"
}

- outline: 内壁輪郭の頂点座標リスト（mm、時計回り）
- width_mm / height_mm: 外形寸法（mm）
- area_tsubo: 有効面積（坪、1坪=3.305㎡）
- L字・凹形状の場合は頂点を増やして正確に表現すること
"""


def pdf_to_png(pdf_path: str, dpi: int = 300) -> list:
    """PDFをPNG画像リストに変換（300dpi）"""
    print(f"[1/3] PDF→PNG変換中: {pdf_path} (DPI={dpi})")
    images = convert_from_path(pdf_path, dpi=dpi, fmt="PNG")
    print(f"  → {len(images)}ページ検出")
    return images


def image_to_base64(image) -> str:
    """PIL ImageをBase64文字列に変換"""
    import io
    buf = io.BytesIO()
    image.save(buf, format="PNG")
    buf.seek(0)
    return base64.standard_b64encode(buf.read()).decode("utf-8")


def extract_floor_outline(pdf_path: str, page: int = 0) -> dict:
    """
    メイン処理: PDF図面 → Claude Vision → floor_outline JSON

    Args:
        pdf_path: PDFファイルパス
        page: 解析対象ページ番号（0始まり）

    Returns:
        floor_outline dict
    """
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise ValueError("環境変数 ANTHROPIC_API_KEY が設定されていません")

    # Step 1: PDF → PNG
    images = pdf_to_png(pdf_path)
    if page >= len(images):
        raise ValueError(f"ページ {page} は存在しません（全{len(images)}ページ）")

    target_image = images[page]
    print(f"  → ページ {page+1} を解析対象に選択")
    print(f"  → 画像サイズ: {target_image.width}x{target_image.height}px")

    # Step 2: Base64エンコード
    print("[2/3] Claude Vision APIに送信中...")
    image_b64 = image_to_base64(target_image)

    # Step 3: Claude Vision API呼び出し
    client = anthropic.Anthropic(api_key=api_key)

    message = client.messages.create(
        model="claude-opus-4-5",
        max_tokens=2048,
        system=SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": "image/png",
                            "data": image_b64,
                        },
                    },
                    {
                        "type": "text",
                        "text": USER_PROMPT,
                    }
                ],
            }
        ],
    )

    raw_text = message.content[0].text.strip()
    print("[3/3] レスポンス受信")
    print(f"  → Raw: {raw_text[:200]}...")

    # Step 4: JSONパース
    # コードブロックがある場合は除去
    if "```json" in raw_text:
        raw_text = raw_text.split("```json")[1].split("```")[0].strip()
    elif "```" in raw_text:
        raw_text = raw_text.split("```")[1].split("```")[0].strip()

    floor_outline = json.loads(raw_text)

    # バリデーション
    assert "outline" in floor_outline, "outline キーが必要です"
    assert len(floor_outline["outline"]) >= 4, "輪郭は4点以上必要です"

    print(f"\n✅ 輪郭抽出成功!")
    print(f"  頂点数: {len(floor_outline['outline'])}")
    print(f"  有効面積: {floor_outline.get('area_tsubo', '?')} 坪")
    print(f"  外形: {floor_outline.get('width_mm','?')}mm × {floor_outline.get('height_mm','?')}mm")

    return floor_outline


def main():
    if len(sys.argv) < 2:
        print("使い方: python3 vision_extractor.py <図面PDF> [出力JSON]")
        print("例:    python3 vision_extractor.py floor_plan.pdf floor_outline.json")
        sys.exit(1)

    pdf_path = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else "floor_outline.json"

    if not Path(pdf_path).exists():
        print(f"ERROR: ファイルが見つかりません: {pdf_path}")
        sys.exit(1)

    try:
        result = extract_floor_outline(pdf_path)

        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, indent=2)

        print(f"\n💾 保存完了: {output_path}")
        print(json.dumps(result, ensure_ascii=False, indent=2))

    except Exception as e:
        print(f"\n❌ エラー: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
