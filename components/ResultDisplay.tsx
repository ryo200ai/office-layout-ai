"use client";

type Props = {
  result: string;
  isStreaming: boolean;
};

export default function ResultDisplay({ result, isStreaming }: Props) {
  if (!result && !isStreaming) return null;

  // セクション見出しを太字にするための簡易フォーマット
  const formatContent = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, i) => {
      // 見出し行（数字ドット始まり or ##始まり）
      if (/^#{1,3}\s/.test(line)) {
        return (
          <h3 key={i} className="text-blue-300 font-bold text-base mt-5 mb-2">
            {line.replace(/^#{1,3}\s/, "")}
          </h3>
        );
      }
      // 番号付き見出し
      if (/^\d+\.\s\*\*/.test(line) || /^\d+\.\s【/.test(line)) {
        return (
          <h3 key={i} className="text-blue-300 font-bold text-base mt-5 mb-2">
            {line.replace(/\*\*/g, "")}
          </h3>
        );
      }
      // 箇条書き
      if (/^[-・•]\s/.test(line)) {
        return (
          <li key={i} className="ml-4 text-gray-200 text-sm leading-relaxed list-disc">
            {line.replace(/^[-・•]\s/, "").replace(/\*\*/g, "")}
          </li>
        );
      }
      // 太字テキスト
      if (/\*\*.*\*\*/.test(line)) {
        const parts = line.split(/\*\*(.*?)\*\*/g);
        return (
          <p key={i} className="text-gray-200 text-sm leading-relaxed">
            {parts.map((part, j) =>
              j % 2 === 1 ? (
                <strong key={j} className="text-white font-semibold">
                  {part}
                </strong>
              ) : (
                part
              )
            )}
          </p>
        );
      }
      // 空行
      if (line.trim() === "") {
        return <div key={i} className="h-2" />;
      }
      // 通常テキスト
      return (
        <p key={i} className="text-gray-200 text-sm leading-relaxed">
          {line}
        </p>
      );
    });
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mt-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
        <span className="text-blue-300 text-sm font-semibold">
          {isStreaming ? "AIが提案書を生成中..." : "AIレイアウト提案書"}
        </span>
      </div>
      <div className="space-y-1">{formatContent(result)}</div>
      {isStreaming && (
        <span className="inline-block w-2 h-4 bg-blue-400 animate-pulse ml-1 align-middle" />
      )}
    </div>
  );
}
