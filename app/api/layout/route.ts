import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

type ValidMediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const tsubo = formData.get("tsubo") as string;
    const companyName = formData.get("companyName") as string;
    const newAddress = formData.get("newAddress") as string;
    const buildingName = formData.get("buildingName") as string;
    const clientName = formData.get("clientName") as string;
    const seats = formData.get("seats") as string;
    const meetingRoomsJson = formData.get("meetingRooms") as string;
    const phoneBooths = formData.get("phoneBooths") as string;
    const floorPlanFile = formData.get("floorPlanImage") as File | null;

    if (!tsubo || !companyName || !clientName || !seats) {
      return new Response(JSON.stringify({ error: "必須項目が不足しています" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const meetingRooms = JSON.parse(meetingRoomsJson || "[]") as {
      id: string;
      capacity: string;
    }[];
    const filledRooms = meetingRooms.filter((r) => r.capacity);
    const meetingRoomsSummary =
      filledRooms.length > 0
        ? filledRooms.map((r, i) => `第${i + 1}室（${r.capacity}名用）`).join("、")
        : "なし";

    const sqm = Math.round(Number(tsubo) * 3.31);

    const prompt = `あなたは経験豊富なオフィスデザイン・レイアウトの専門家です。
以下の情報をもとに、不動産仲介担当者が${clientName}に提案できる「オフィスレイアウト提案書」を日本語で作成してください。

【物件・クライアント情報】
- 貴社名：${companyName}
- クライアント名：${clientName}
${newAddress ? `- 移転先住所：${newAddress}` : ""}
${buildingName ? `- ビル名：${buildingName}` : ""}

【スペース情報】
- 面積：${tsubo}坪（約${sqm}㎡）
- 席数：${seats}席
- 会議室：${meetingRoomsSummary}
- テレフォンブース：${phoneBooths || "0"}ブース
${floorPlanFile ? "\n※添付の図面をもとに、具体的なゾーニング・レイアウトを提案してください。" : ""}

以下6つのセクションで構成されたプロフェッショナルな提案書を作成してください：

## 1. 物件評価サマリー
${clientName}にとってこの物件が適切かどうかの総合評価（1名あたりの坪数・㎡計算を含む）

## 2. 推奨レイアウトプラン
席数・会議室・ブース数に最適化したレイアウトプランの提案${floorPlanFile ? "（添付図面に基づきゾーニングを具体的に提案）" : ""}

## 3. 座席・スペース配分の目安
各エリアの坪数・㎡数を具体的な数字で示す（合計が${tsubo}坪／${sqm}㎡と一致するよう）

## 4. このプランのポイント
箇条書きで3点、このレイアウトの強みや特徴

## 5. 注意点・検討事項
このプランを進める上での注意点・確認事項

## 6. 次のステップ
${clientName}が次にとるべき具体的な行動の提案

実用的かつ具体的な数値を含め、クライアントへの説明資料として即使えるクオリティで作成してください。`;

    // メッセージコンテンツを構築（画像がある場合はvisionを利用）
    type ContentBlock =
      | { type: "text"; text: string }
      | {
          type: "image";
          source: {
            type: "base64";
            media_type: ValidMediaType;
            data: string;
          };
        };

    const content: ContentBlock[] = [];

    if (floorPlanFile && floorPlanFile.type.startsWith("image/")) {
      const buf = await floorPlanFile.arrayBuffer();
      const base64 = Buffer.from(buf).toString("base64");
      const mediaType = (floorPlanFile.type || "image/jpeg") as ValidMediaType;
      content.push({
        type: "image",
        source: { type: "base64", media_type: mediaType, data: base64 },
      });
    }

    content.push({ type: "text", text: prompt });

    const stream = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 2500,
      stream: true,
      messages: [{ role: "user", content }],
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
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
      JSON.stringify({ error: "診断の生成中にエラーが発生しました" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
