"use client";

import { useState } from "react";
import InputForm, { FormData } from "@/components/InputForm";
import ResultDisplay from "@/components/ResultDisplay";
import CTAButton from "@/components/CTAButton";

export default function Home() {
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (data: FormData) => {
    setResult("");
    setError("");
    setIsDone(false);
    setIsLoading(true);
    setIsStreaming(false);

    try {
      const response = await fetch("/api/layout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
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
        const text = decoder.decode(value, { stream: true });
        setResult((prev) => prev + text);
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
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
            AI
          </div>
          <div>
            <h1 className="text-white font-bold text-sm leading-none">
              オフィスレイアウトAI診断
            </h1>
            <p className="text-gray-400 text-xs mt-0.5">
              物件情報を入力するだけで提案書を自動生成
            </p>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-2xl mx-auto px-4 py-6 pb-16">
        {/* リード文 */}
        <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
          <p className="text-gray-300 text-sm leading-relaxed">
            物件情報を入力するだけで、AIがその場でオフィスレイアウト提案書を生成します。
            <span className="text-blue-300 font-semibold">ログイン不要・完全無料</span>
            でご利用いただけます。
          </p>
        </div>

        {/* フォーム */}
        <InputForm onSubmit={handleSubmit} isLoading={isLoading} />

        {/* エラー */}
        {error && (
          <div className="mt-4 p-4 rounded-xl bg-red-500/20 border border-red-400/30 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* 結果表示 */}
        <ResultDisplay result={result} isStreaming={isStreaming} />

        {/* CTA */}
        <CTAButton show={isDone} />
      </main>

      {/* フッター */}
      <footer className="border-t border-white/10 py-4 text-center">
        <p className="text-gray-500 text-xs">
          Powered by Claude AI · 生成結果はAIによるものであり参考情報です
        </p>
      </footer>
    </div>
  );
}
