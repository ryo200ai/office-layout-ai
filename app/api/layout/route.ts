import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { area, headcount, purpose, budget, timeline } = body;

    if (!area || !headcount || !purpose || !budget || !timeline) {
      return new Response(JSON.stringify({ error: "必須項目が不足しています" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const prompt = `あなたは経験豊富なオフィスデザイン・レイアウトの専門家です。
以下の物件情報をもとに、不動産仲介担当者が顧客に提案できる「オフィスレイアウト提案書」を作成してください。

【物件情報】
- 面積：${area}㎡
- 希望人数：${headcount}名
- 用途：${purpose}
- 予算感：${budget}
- 移転時期：${timeline}

以下の6つのセクションで構成された、プロフェッショナルな提案書を日本語で作成してください：

## 1. 物件評価サマリー
この物件が該当企業にとって適切かどうかの総合評価（1人あたりの面積計算含む）

## 2. 推奨レイアウトプラン
用途・人数・予算に合わせた最適なレイアウトプランの提案

## 3. 座席・スペース配分の目安
各エリアの㎡数を具体的な数字で示す（合計が面積と一致するよう）

## 4. このプランのポイント
箇条書きで3点、このレイアウトの強みや特徴

## 5. 注意点・検討事項
このプランを進める上での注意点や確認すべき事項

## 6. 次のステップ
顧客が次にとるべき行動の提案

実用的で具体的な数値を含め、クライアントへの説明資料として即使えるクオリティで作成してください。`;

    const stream = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 2000,
      stream: true,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
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
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
