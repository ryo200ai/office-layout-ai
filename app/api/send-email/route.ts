import { Resend } from "resend";

const TO_EMAIL = "ryo_takaishi@sinkodo.co.jp";

type MeetingRoom = { id: string; capacity: string };

type EmailPayload = {
  type: "form_submit" | "cta_click";
  companyName: string;
  clientName: string;
  newAddress?: string;
  buildingName?: string;
  tsubo: string;
  seats: string;
  meetingRooms: MeetingRoom[];
  phoneBooths: string;
  lounge: boolean;
  aiResult?: string;
};

function buildInfoTable(data: EmailPayload): string {
  const filledRooms = data.meetingRooms.filter((r) => r.capacity);
  const meetingSummary =
    filledRooms.length > 0
      ? filledRooms.map((r, i) => `第${i + 1}室（${r.capacity}名用）`).join("、")
      : "なし";

  const sqm = Math.round(Number(data.tsubo) * 3.31);

  const rows = [
    ["貴社名", data.companyName],
    ["クライアント名", data.clientName],
    ["移転先住所", data.newAddress || "—"],
    ["ビル名", data.buildingName || "—"],
    ["坪数", `${data.tsubo}坪（約${sqm}㎡）`],
    ["席数", `${data.seats}席`],
    ["会議室", meetingSummary],
    ["テレフォンブース", `${data.phoneBooths || "0"}ブース`],
    ["ラウンジ", data.lounge ? "必要" : "不要"],
  ]
    .map(
      ([label, value]) => `
      <tr>
        <td style="padding:8px 12px;background:#f1f5f9;font-weight:600;color:#1e3a5f;white-space:nowrap;border:1px solid #e2e8f0;font-size:13px;">
          ${label}
        </td>
        <td style="padding:8px 12px;color:#334155;border:1px solid #e2e8f0;font-size:13px;">
          ${value}
        </td>
      </tr>`
    )
    .join("");

  return `<table style="width:100%;border-collapse:collapse;">${rows}</table>`;
}

function buildHtml(data: EmailPayload, now: string): string {
  const isFormSubmit = data.type === "form_submit";
  const badge = isFormSubmit
    ? `<span style="background:#2563eb;color:#fff;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:700;">新規診断リクエスト</span>`
    : `<span style="background:#16a34a;color:#fff;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:700;">詳細提案依頼</span>`;

  const heading = isFormSubmit
    ? `AI診断が実行されました`
    : `詳細提案の依頼が届きました`;

  const description = isFormSubmit
    ? `以下のクライアント情報でオフィスレイアウトAI診断が実行されました。`
    : `AI診断結果を確認後、詳細提案を希望するリクエストが届きました。`;

  const aiSection =
    !isFormSubmit && data.aiResult
      ? `
      <div style="margin-top:24px;">
        <h3 style="font-size:14px;font-weight:700;color:#1e3a5f;margin:0 0 8px;">📄 AI生成提案書（抜粋）</h3>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;font-size:12px;color:#475569;white-space:pre-wrap;max-height:400px;overflow:hidden;line-height:1.7;">
${data.aiResult.slice(0, 1500)}${data.aiResult.length > 1500 ? "\n\n…（以下省略）" : ""}
        </div>
      </div>`
      : "";

  return `
<!DOCTYPE html>
<html lang="ja">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Hiragino Kaku Gothic ProN',sans-serif;">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

    <!-- ヘッダー -->
    <div style="background:linear-gradient(135deg,#1a3a5c,#2563eb);padding:28px 32px;">
      <p style="margin:0 0 8px;color:rgba(255,255,255,0.7);font-size:12px;">オフィスレイアウトAI診断</p>
      <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">${heading}</h1>
      <p style="margin:8px 0 0;color:rgba(255,255,255,0.7);font-size:12px;">${now}</p>
    </div>

    <!-- 本文 -->
    <div style="padding:28px 32px;">
      <div style="margin-bottom:16px;">${badge}</div>
      <p style="font-size:14px;color:#475569;margin:0 0 20px;line-height:1.7;">${description}</p>

      <!-- 情報テーブル -->
      <h3 style="font-size:14px;font-weight:700;color:#1e3a5f;margin:0 0 8px;">📋 入力情報</h3>
      ${buildInfoTable(data)}

      ${aiSection}
    </div>

    <!-- フッター -->
    <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 32px;text-align:center;">
      <p style="margin:0;font-size:11px;color:#94a3b8;">このメールはオフィスレイアウトAI診断ツールから自動送信されています</p>
    </div>
  </div>
</body>
</html>`;
}

export async function POST(request: Request) {
  try {
    if (!process.env.RESEND_API_KEY) {
      // APIキー未設定の場合はスキップ（エラーにしない）
      return Response.json({ ok: true, skipped: true });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const data: EmailPayload = await request.json();
    const now = new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });

    const subject =
      data.type === "form_submit"
        ? `【AI診断】新規リクエスト｜${data.clientName}様・${data.companyName}`
        : `【詳細提案依頼】${data.clientName}様・${data.companyName}`;

    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: TO_EMAIL,
      subject,
      html: buildHtml(data, now),
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Email error:", error);
    // メール送信失敗は握りつぶす（メインフローに影響させない）
    return Response.json({ ok: false, error: String(error) });
  }
}
