"use client";

import { useState } from "react";
import InputForm, { LayoutFormData } from "@/components/InputForm";
import ResultDisplay from "@/components/ResultDisplay";
import CTAButton from "@/components/CTAButton";

export default function Home() {
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (data: LayoutFormData) => {
    setResult("");
    setError("");
    setIsDone(false);
    setIsLoading(true);
    setIsStreaming(false);

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

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setResult((prev) => prev + decoder.decode(value, { stream: true }));
      }

      setIsStreaming(false);
      setIsDone(true);
    } catch (err: unknown) {
      setIsLoading(false);
      setIsStreaming(false);
      setError(err instanceof Error ? err.message : "予期しないエラーが発生しました");
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#1a3a5c" }}>

      {/* ヘッダー */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
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
        <ResultDisplay result={result} isStreaming={isStreaming} />

        {/* CTA */}
        <CTAButton show={isDone} />
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
