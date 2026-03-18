import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

type ValidImageType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

// ── 建築基準定数（mm）──────────────────────────────────────────
const DESK_W = 1200;
const DESK_D = 700;
const AISLE_MAIN = 1200;
const AISLE_SUB = 600;
const WALL_MARGIN = 150;

// ── Phase 1: 図面から実寸を抽出 ──────────────────────────────────
async function extractFloorDimensions(
  fileBuffer: ArrayBuffer,
  mediaType: string
): Promise<{ width_mm: number; height_mm: number; area_tsubo: number; shape: string; notes: string }> {
  type ExtractBlock =
    | { type: "image"; source: { type: "base64"; media_type: ValidImageType; data: string } }
    | { type: "document"; source: { type: "base64"; media_type: "application/pdf"; data: string } }
    | { type: "text"; text: string };

  const base64 = Buffer.from(fileBuffer).toString("base64");
  const content: ExtractBlock[] = [];

  if (mediaType === "application/pdf") {
    content.push({
      type: "document",
      source: { type: "base64", media_type: "application/pdf", data: base64 },
    });
  } else {
    content.push({
      type: "image",
      source: { type: "base64", media_type: mediaType as ValidImageType, data: base64 },
    });
  }

  content.push({
    type: "text",
    text: `この建築平面図を解析し、以下のJSONのみを返してください（説明不要）。
1/100スケール図面を前提とします。

{
  "width_mm": 外形幅（mm、整数）,
  "height_mm": 外形奥行き（mm、整数）,
  "area_tsubo": 有効面積（坪、小数第1位、1坪=3.305㎡）,
  "shape": "rectangle" | "L-shape" | "U-shape" | "irregular",
  "notes": "柱・段差・障害物など特記事項（なければ空文字）"
}

測定できない場合は width_mm=0, height_mm=0 として返してください。`,
  });

  const response = await client.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 512,
    stream: false,
    messages: [{ role: "user", content: content as Parameters<typeof client.messages.create>[0]["messages"][0]["content"] }],
  });

  const raw = (response.content[0] as { type: string; text: string }).text.trim();
  const jsonStr = raw.includes("```")
    ? raw.split("```json").pop()?.split("```")[0]?.trim() ?? raw
    : raw;

  try {
    return JSON.parse(jsonStr);
  } catch {
    return { width_mm: 0, height_mm: 0, area_tsubo: 0, shape: "rectangle", notes: "" };
  }
}

// ── ゾーン計算（実寸・要件ベース）────────────────────────────────
function calcZones(
  tsubo: number,
  seats: number,
  meetingRooms: { id: string; capacity: string }[],
  loungeNeeded: boolean,
  phoneBooths: number
): { label: string; x: number; y: number; w: number; h: number; color: string }[] {
  const filledRooms = meetingRooms.filter((r) => r.capacity);
  const meetingCount = filledRooms.length;

  // 各エリアの坪数算出
  const deskTsubo = Math.ceil((seats * DESK_W * (DESK_D + AISLE_SUB)) / 1e6 / 3.305);
  const meetingTsubo = filledRooms.reduce((sum, r) => {
    const cap = Number(r.capacity) || 4;
    return sum + Math.ceil((cap * 2.0) / 3.305); // 1人2㎡基準
  }, meetingCount > 0 ? meetingCount * 0.5 : 0);
  const boothTsubo = phoneBooths * 1.5;
  const loungeTsubo = loungeNeeded ? Math.min(Math.round(tsubo * 0.12), 10) : 0;
  const entranceTsubo = Math.max(Math.round(tsubo * 0.07), 2);
  const execTsubo = Math.max(tsubo - meetingTsubo - boothTsubo - loungeTsubo - entranceTsubo, deskTsubo);

  const total = execTsubo + meetingTsubo + boothTsubo + loungeTsubo + entranceTsubo;

  // 横幅を面積比で割り振り（上段：執務+会議、下段：ブース+ラウンジ+通路）
  const hasBottom = phoneBooths > 0 || loungeNeeded;
  const topH = hasBottom ? 58 : 88;
  const bottomH = 28;
  const topY = 5;
  const bottomY = topY + topH + 2;
  const startX = 5;
  const totalW = 90;

  const execW = Math.max(Math.round((execTsubo / total) * totalW), 30);
  const meetW = totalW - execW;

  const zones: { label: string; x: number; y: number; w: number; h: number; color: string }[] = [
    {
      label: `執務スペース（${seats}席）`,
      x: startX, y: topY,
      w: execW, h: topH,
      color: "#3B82F6",
    },
  ];

  if (meetingCount > 0) {
    zones.push({
      label: `会議室（${filledRooms.map((r) => `${r.capacity}名`).join("・")}）`,
      x: startX + execW, y: topY,
      w: meetW, h: topH,
      color: "#10B981",
    });
  }

  if (hasBottom) {
    const bottomTotal = boothTsubo + loungeTsubo + entranceTsubo;
    let curX = startX;

    if (phoneBooths > 0) {
      const w = Math.round((boothTsubo / bottomTotal) * totalW);
      zones.push({
        label: `テレフォンブース×${phoneBooths}`,
        x: curX, y: bottomY,
        w, h: bottomH,
        color: "#8B5CF6",
      });
      curX += w;
    }

    if (loungeNeeded) {
      const w = Math.round((loungeTsubo / bottomTotal) * totalW);
      zones.push({
        label: "ラウンジ",
        x: curX, y: bottomY,
        w, h: bottomH,
        color: "#F59E0B",
      });
      curX += w;
    }

    const remainW = startX + totalW - curX;
    if (remainW > 5) {
      zones.push({
        label: "エントランス・通路",
        x: curX, y: bottomY,
        w: remainW, h: bottomH,
        color: "#6B7280",
      });
    }
  }

  return zones;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const tsubo = Number(formData.get("tsubo") as string);
    const companyName = formData.get("companyName") as string;
    const newAddress = formData.get("newAddress") as string;
    const buildingName = formData.get("buildingName") as string;
    const clientName = formData.get("clientName") as string;
    const seats = Number(formData.get("seats") as string);
    const meetingRoomsJson = formData.get("meetingRooms") as string;
    const phoneBooths = Number(formData.get("phoneBooths") as string) || 0;
    const lounge = formData.get("lounge") === "true";
    const floorPlanFile = formData.get("floorPlanImage") as File | null;

    if (!tsubo || !companyName || !clientName || !seats) {
      return new Response(JSON.stringify({ error: "必須項目が不足しています" }), {
        status: 400, headers: { "Content-Type": "application/json" },
      });
    }

    const meetingRooms = JSON.parse(meetingRoomsJson || "[]") as { id: string; capacity: string }[];
    const filledRooms = meetingRooms.filter((r) => r.capacity);
    const meetingRoomsSummary = filledRooms.length > 0
      ? filledRooms.map((r, i) => `第${i + 1}室（${r.capacity}名用）`).join("、")
      : "なし";

    const sqm = Math.round(tsubo * 3.305);
    const sqmPerPerson = (sqm / seats).toFixed(1);

    // ── Phase 1: 図面解析 ──────────────────────────────────────
    let floorDims = { width_mm: 0, height_mm: 0, area_tsubo: 0, shape: "rectangle", notes: "" };
    let hasFloorPlan = false;
    let floorPlanBase64 = "";
    let floorPlanMediaType = "";

    if (floorPlanFile && floorPlanFile.size > 0) {
      hasFloorPlan = true;
      const buf = await floorPlanFile.arrayBuffer();
      floorPlanBase64 = Buffer.from(buf).toString("base64");
      floorPlanMediaType = floorPlanFile.type || "image/jpeg";

      try {
        floorDims = await extractFloorDimensions(buf, floorPlanMediaType);
        console.log(`[Phase1] 解析結果: ${JSON.stringify(floorDims)}`);
      } catch (e) {
        console.warn("[Phase1] 図面解析スキップ:", e);
      }
    }

    // 面積は図面解析値を優先、なければ入力値
    const effectiveTsubo = floorDims.area_tsubo > 0 ? floorDims.area_tsubo : tsubo;
    const effectiveSqm = Math.round(effectiveTsubo * 3.305);

    // ── ゾーン計算 ────────────────────────────────────────────
    const zones = calcZones(effectiveTsubo, seats, meetingRooms, lounge, phoneBooths);
    const zonesJson = JSON.stringify({ zones });

    // ── Phase 2: 提案書生成 ───────────────────────────────────
    const systemPrompt = `あなたは一級建築士資格を持つオフィスデザイン専門家です。
不動産仲介担当者が商談その場でクライアントに提示する「オフィスレイアウト提案書」を作成します。

【設計基準（必ず数値を提案書に反映）】
- 1人あたり推奨面積: 3.0〜5.0㎡（法的最低: 2.0㎡/人）
- 執務デスク標準: W${DESK_W}×D${DESK_D}mm
- メイン通路: ${AISLE_MAIN}mm以上（車椅子対応の場合1800mm）
- デスク間通路: ${AISLE_SUB}mm以上
- 壁からのクリアランス: ${WALL_MARGIN}mm以上
- 会議室面積目安: 定員×2.0㎡（例：8名=16㎡=4.8坪）
- テレフォンブース: 1基あたり1.2m×1.2m=1.44㎡（約0.44坪）
- ラウンジ: 全体の10〜15%を目安

提案書は数値を豊富に含め、抽象的表現を避け、即クライアントに見せられるクオリティで。`;

    const dimensionNote = floorDims.width_mm > 0
      ? `\n【図面AI解析結果】\n- 実測外形: ${floorDims.width_mm}mm × ${floorDims.height_mm}mm\n- 解析面積: ${floorDims.area_tsubo}坪（入力値${tsubo}坪）\n- フロア形状: ${floorDims.shape}\n- 図面特記: ${floorDims.notes || "なし"}\n`
      : "";

    const userPrompt = `${companyName}の担当者として、${clientName}への提案書を作成してください。

【物件情報】
- ビル名：${buildingName || "未記入"}
- 住所：${newAddress || "未記入"}
- 面積：${tsubo}坪（約${sqm}㎡）、有効面積${effectiveTsubo}坪（${effectiveSqm}㎡）
- 1人あたり：${sqmPerPerson}㎡/人${dimensionNote}
【スペース要件】
- 席数：${seats}席
- 会議室：${meetingRoomsSummary}
- テレフォンブース：${phoneBooths}基
- ラウンジ：${lounge ? "必要" : "不要"}
${hasFloorPlan ? "- ※添付図面をAI解析済み。実寸データを提案に反映してください。" : ""}

【提案書構成】

## 1. 物件評価サマリー
- ${clientName}様へのこの物件の総合評価（★〜★★★★★）
- 1人あたり${sqmPerPerson}㎡の業界基準比較（一般オフィス3〜5㎡/人）
- 強み・課題を端的に2〜3点

## 2. 推奨レイアウトプラン
- プラン名と設計コンセプト（1文）
- ゾーニングの考え方（動線・採光・音環境）
- 各エリアの配置根拠${hasFloorPlan ? "（図面の形状・柱位置を考慮した具体的な記述）" : ""}

## 3. 座席・スペース配分の目安
表形式で記載。合計が${effectiveTsubo}坪/${effectiveSqm}㎡になること。
| エリア | 坪数 | 面積（㎡） | 内容・補足 |
会議室は各室（${meetingRoomsSummary}）を別行で記載、定員×2㎡で面積を計算。

## 4. このプランのポイント
箇条書き3点。各点に具体的な数値・効果を含めること。

## 5. 注意点・検討事項
- 内装工事での確認事項（間仕切り・電気・空調）
- 概算工事費（${effectiveTsubo}坪規模の相場: A工事/B工事/C工事）
- ビル管理規約・オーナー承認が必要な項目

## 6. 次のステップ
${clientName}様が今日から動ける具体的アクション（期限付き4ステップ）`;

    // ── コンテンツ組み立て ────────────────────────────────────
    type ContentBlock =
      | { type: "image"; source: { type: "base64"; media_type: ValidImageType; data: string } }
      | { type: "document"; source: { type: "base64"; media_type: "application/pdf"; data: string } }
      | { type: "text"; text: string };

    const content: ContentBlock[] = [];

    if (hasFloorPlan && floorPlanBase64) {
      if (floorPlanMediaType === "application/pdf") {
        content.push({
          type: "document",
          source: { type: "base64", media_type: "application/pdf", data: floorPlanBase64 },
        });
      } else {
        content.push({
          type: "image",
          source: {
            type: "base64",
            media_type: floorPlanMediaType as ValidImageType,
            data: floorPlanBase64,
          },
        });
      }
    }

    content.push({ type: "text", text: userPrompt });

    const stream = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 3500,
      system: systemPrompt,
      stream: true,
      messages: [{ role: "user", content }],
    });

    // ── ストリーミングレスポンス ──────────────────────────────
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          // ゾーンJSONを先頭に送出
          controller.enqueue(encoder.encode(`[[ZONES:${zonesJson}]]\n`));

          for await (const event of stream) {
            if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "X-Content-Type-Options": "nosniff",
      },
    });

  } catch (error) {
    console.error("API Error:", error);
    return new Response(
      JSON.stringify({ error: "診断の生成中にエラーが発生しました。APIキーを確認してください。" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
