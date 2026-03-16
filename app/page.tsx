"use client";

import { useState } from "react";
import InputForm, { LayoutFormData } from "@/components/InputForm";
import ResultDisplay from "@/components/ResultDisplay";
import CTAButton from "@/components/CTAButton";

const DEMO_TEXT = `## 1. 物件評価サマリー

**山田商事株式会社 様 向け 物件評価レポート**

対象物件：渋谷区〇〇1-2-3 〇〇ビル 8F｜**50坪（約166㎡）**

1名あたりの面積は **約3.3㎡（約1坪）** となり、一般的なオフィス基準（2〜3㎡/名）を満たしています。席数30名に対して十分なゆとりがあり、快適な執務環境の実現が見込まれます。会議室・ラウンジ・テレフォンブースを組み込んでも面積的に余裕のある優良物件です。

**総合評価：★★★★☆（4.0/5.0）**

---

## 2. 推奨レイアウトプラン

**「ハイブリッドワーク対応型」レイアウトプラン**

エントランスから奥に向けてゾーニングを設計し、来訪者導線と執務エリアを明確に分離します。

- **エントランス〜ラウンジゾーン**：入口付近に開放的なラウンジを配置し、訪問者へのブランディング効果を演出
- **会議室ゾーン**：中央部に2室を集約し、内部からのアクセスを容易に
- **執務ゾーン**：奥側に30席を島型・フリーアドレス混合で配置
- **集中ブースゾーン**：執務エリア隣接にテレフォンブース2基を設置

---

## 3. 座席・スペース配分の目安

| エリア | 坪数 | 面積（㎡） | 備考 |
|--------|------|-----------|------|
| 執務スペース（30席） | 22坪 | 73㎡ | 島型＋フリーアドレス混合 |
| 会議室A（8名用） | 6坪 | 20㎡ | ホワイトボード・モニター設置 |
| 会議室B（4名用） | 4坪 | 13㎡ | 小会議・面談用 |
| ラウンジ | 7坪 | 23㎡ | ソファ・カフェカウンター |
| テレフォンブース×2 | 2坪 | 7㎡ | 防音仕様推奨 |
| エントランス・通路 | 5坪 | 17㎡ | — |
| サーバー・収納 | 4坪 | 13㎡ | — |
| **合計** | **50坪** | **166㎡** | |

---

## 4. このプランのポイント

- **来訪者体験を重視した導線設計**：ラウンジを前面に配置することで、クライアントへのブランド訴求力が高まり、商談・採用面接での好印象につながります
- **集中と協働のゾーン分離**：執務エリアと会議・コミュニケーションエリアを明確に分けることで、集中作業時のノイズを最小化し、生産性向上が期待できます
- **将来の増員にも対応可能**：現在30席ですが、ラウンジの一部をフレキシブルシートとして活用することで、最大40名程度まで拡張が可能です

---

## 5. 注意点・検討事項

- **内装工事の確認**：会議室の間仕切り設置、テレフォンブースの防音工事については、ビル管理規約の確認が必要です
- **電気容量・LAN配線**：フリーアドレス導入に伴い、床下配線やOAフロアの設置を事前に検討することを推奨します
- **空調ゾーニング**：ラウンジと執務室で使用時間帯が異なるため、個別空調対応の有無をオーナーに確認してください
- **移転コスト見積もり**：内装工事費の概算は**800万〜1,200万円**程度を想定（原状回復・造作工事含む）

---

## 6. 次のステップ

山田商事株式会社 様に向け、以下のアクションをご提案します。

1. **現地内覧の実施**（〜2週間以内）：今回のゾーニング案を持参し、柱・窓位置・設備位置を現場で確認
2. **概算見積もりの取得**（〜1ヶ月以内）：提携インテリア会社へ本プランをベースに工事費用の試算を依頼
3. **詳細図面の作成**：内覧後のフィードバックをもとに、家具レイアウト図・電気系統図を含む詳細プランを作成
4. **オーナー交渉・契約**：工事内容が確定次第、ビルオーナーとの工事承認・契約手続きへ

ご不明な点はいつでもお気軽にご相談ください。`;

export default function Home() {
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState("");
  const [lastFormData, setLastFormData] = useState<LayoutFormData | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // メール送信ヘルパー
  const sendEmail = async (
    type: "form_submit" | "cta_click",
    formData: LayoutFormData,
    aiResult?: string
  ) => {
    try {
      await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          companyName: formData.companyName,
          clientName: formData.clientName,
          newAddress: formData.newAddress,
          buildingName: formData.buildingName,
          tsubo: formData.tsubo,
          seats: formData.seats,
          meetingRooms: formData.meetingRooms,
          phoneBooths: formData.phoneBooths,
          lounge: formData.lounge,
          aiResult,
        }),
      });
    } catch {
      // メール失敗はサイレントに無視
    }
  };

  // デモ表示（タイプライター風）
  const handleDemo = async () => {
    setResult("");
    setError("");
    setIsDone(false);
    setIsLoading(true);
    setIsStreaming(false);
    setIsDemoMode(true);

    await new Promise((r) => setTimeout(r, 800));
    setIsLoading(false);
    setIsStreaming(true);

    const chunkSize = 8;
    for (let i = 0; i < DEMO_TEXT.length; i += chunkSize) {
      const chunk = DEMO_TEXT.slice(i, i + chunkSize);
      setResult((prev) => prev + chunk);
      await new Promise((r) => setTimeout(r, 18));
    }

    setIsStreaming(false);
    setIsDone(true);
  };

  const handleSubmit = async (data: LayoutFormData) => {
    setResult("");
    setError("");
    setIsDone(false);
    setIsLoading(true);
    setIsStreaming(false);
    setIsDemoMode(false);
    setLastFormData(data);

    // ① フォーム送信時メール（バックグラウンドで）
    sendEmail("form_submit", data);

    try {
      const fd = new FormData();
      fd.append("tsubo", data.tsubo);
      fd.append("companyName", data.companyName);
      fd.append("newAddress", data.newAddress);
      fd.append("buildingName", data.buildingName);
      fd.append("clientName", data.clientName);
      fd.append("seats", data.seats);
      fd.append("meetingRooms", JSON.stringify(data.meetingRooms));
      fd.append("phoneBooths", data.phoneBooths);
      fd.append("lounge", String(data.lounge));
      if (data.floorPlanImage) {
        fd.append("floorPlanImage", data.floorPlanImage);
      }

      const response = await fetch("/api/layout", {
        method: "POST",
        body: fd,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "エラーが発生しました");
      }

      setIsLoading(false);
      setIsStreaming(true);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("ストリームの読み取りに失敗しました");

      let fullText = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        setResult((prev) => prev + chunk);
      }

      setIsStreaming(false);
      setIsDone(true);
      setLastFormData({ ...data, _aiResult: fullText } as LayoutFormData & { _aiResult: string });
    } catch (err: unknown) {
      setIsLoading(false);
      setIsStreaming(false);
      setError(err instanceof Error ? err.message : "予期しないエラーが発生しました");
    }
  };

  // ② CTAボタン押下時メール
  const handleCTAClick = () => {
    if (!lastFormData) return;
    const aiResult = (lastFormData as LayoutFormData & { _aiResult?: string })._aiResult;
    sendEmail("cta_click", lastFormData, aiResult);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#1a3a5c" }}>

      {/* ヘッダー */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-lg"
              style={{ background: "linear-gradient(135deg, #2563eb, #1d4ed8)" }}
            >
              AI
            </div>
            <div>
              <h1 className="text-white font-bold text-sm leading-none tracking-tight">
                オフィスレイアウトAI診断
              </h1>
              <p className="text-gray-400 text-xs mt-0.5">
                図面をアップロードしてレイアウト提案書を即生成
              </p>
            </div>
          </div>
          {/* デモボタン */}
          <button
            onClick={handleDemo}
            disabled={isLoading || isStreaming}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-400/20 border border-yellow-400/40 text-yellow-300 text-xs font-semibold hover:bg-yellow-400/30 transition disabled:opacity-40"
          >
            <span>▶</span> デモを見る
          </button>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-2xl mx-auto px-4 py-6 pb-20">

        {/* カード */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6">
          <InputForm onSubmit={handleSubmit} isLoading={isLoading} />
        </div>

        {/* エラー */}
        {error && (
          <div className="mb-4 p-4 rounded-xl bg-red-500/20 border border-red-400/30 text-red-300 text-sm flex gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* 結果 */}
        {result || isStreaming ? (
          <>
            {isDemoMode && (
              <div className="mb-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-400/10 border border-yellow-400/30">
                <span className="text-yellow-300 text-xs">🎬</span>
                <span className="text-yellow-300 text-xs font-semibold">
                  これはデモ表示です。実際はAIが物件情報をもとにリアルタイム生成します。
                </span>
              </div>
            )}
            <ResultDisplay result={result} isStreaming={isStreaming} />
          </>
        ) : null}

        {/* CTA */}
        <CTAButton show={isDone} onCTAClick={handleCTAClick} />
      </main>

      {/* フッター */}
      <footer className="border-t border-white/10 py-4 text-center">
        <p className="text-gray-600 text-xs">
          Powered by Claude AI · 生成内容はAIによる参考情報です
        </p>
      </footer>
    </div>
  );
}
