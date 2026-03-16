"use client";

type Props = {
  show: boolean;
  onCTAClick?: () => void;
};

export default function CTAButton({ show, onCTAClick }: Props) {
  if (!show) return null;

  const ctaUrl = process.env.NEXT_PUBLIC_CTA_URL || "#";

  return (
    <div className="mt-8 text-center">
      <div className="bg-gradient-to-r from-blue-600/30 to-cyan-600/30 border border-blue-400/40 rounded-2xl p-6">
        <p className="text-gray-300 text-sm mb-1">
          このレイアウト案をベースに、専門家がより詳細なプランをご提案します
        </p>
        <p className="text-white font-bold text-base mb-4">
          現地調査・詳細図面作成まで無料でご対応
        </p>
        <a
          href={ctaUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onCTAClick}
          className="inline-block w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold text-base shadow-lg hover:from-blue-400 hover:to-cyan-400 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
        >
          無料で詳細提案を依頼する →
        </a>
        <p className="text-gray-400 text-xs mt-3">
          ※ 登録不要・完全無料・担当者が直接ご連絡します
        </p>
      </div>
    </div>
  );
}
