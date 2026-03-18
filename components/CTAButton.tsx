"use client";

import { useEffect, useState } from "react";

type Props = {
  show: boolean;
  onCTAClick?: () => void;
};

export default function CTAButton({ show, onCTAClick }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      const t = setTimeout(() => setVisible(true), 300);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
    }
  }, [show]);

  if (!show) return null;

  const ctaUrl = process.env.NEXT_PUBLIC_CTA_URL || "#";

  return (
    <div
      style={{
        marginTop: "2rem",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(16px)",
        transition: "opacity 0.6s ease, transform 0.6s ease",
      }}
    >
      {/* 外枠：パルスグロー */}
      <div
        style={{
          position: "relative",
          borderRadius: "1.25rem",
          padding: "2px",
          background: "linear-gradient(135deg, #C7A23D, #D4B55A, #A8862E, #C7A23D)",
          boxShadow: "0 0 40px rgba(199,162,61,0.35), 0 0 80px rgba(199,162,61,0.15)",
          animation: "ctaGlow 3s ease-in-out infinite",
        }}
      >
        <div
          style={{
            borderRadius: "1.1rem",
            padding: "2rem 1.75rem",
            background: "linear-gradient(160deg, #1A2D55 0%, #111E3A 60%, #1a2540 100%)",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* 背景装飾 */}
          <div style={{
            position: "absolute", top: "-50%", left: "-20%",
            width: "60%", height: "200%",
            background: "radial-gradient(ellipse, rgba(199,162,61,0.06) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />
          <div style={{
            position: "absolute", bottom: "-30%", right: "-10%",
            width: "50%", height: "150%",
            background: "radial-gradient(ellipse, rgba(199,162,61,0.04) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />

          {/* バッジ */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.375rem",
              padding: "0.25rem 0.875rem",
              borderRadius: "9999px",
              background: "rgba(199,162,61,0.15)",
              border: "1px solid rgba(199,162,61,0.5)",
              color: "#D4B55A",
              fontSize: "0.7rem",
              fontWeight: 700,
              letterSpacing: "0.12em",
              fontFamily: "Inter, sans-serif",
            }}>
              <span style={{
                width: "6px", height: "6px", borderRadius: "50%",
                backgroundColor: "#C7A23D",
                boxShadow: "0 0 6px #C7A23D",
                animation: "pulse 1.5s infinite",
              }} />
              無料サービス
            </span>
          </div>

          {/* メインコピー */}
          <p style={{
            color: "#F0EDE6",
            fontWeight: 700,
            fontSize: "1.2rem",
            marginBottom: "0.5rem",
            letterSpacing: "0.03em",
            lineHeight: 1.5,
          }}>
            このプランを持って、<br />
            <span style={{ color: "#C7A23D" }}>今日の商談をクロージングへ</span>
          </p>
          <p style={{
            color: "rgba(240,237,230,0.6)",
            fontSize: "0.82rem",
            marginBottom: "1.75rem",
            lineHeight: 1.6,
          }}>
            現地調査・詳細図面作成・概算見積まで<br />一級建築士が無料でサポートします
          </p>

          {/* CTAボタン */}
          <a
            href={ctaUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onCTAClick}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              width: "100%",
              padding: "1.15rem 2rem",
              borderRadius: "0.875rem",
              background: "linear-gradient(135deg, #C7A23D 0%, #D4B55A 40%, #C7A23D 100%)",
              color: "#111E3A",
              fontWeight: 800,
              fontSize: "1.05rem",
              textDecoration: "none",
              letterSpacing: "0.04em",
              boxShadow: "0 6px 30px rgba(199,162,61,0.5), 0 2px 8px rgba(0,0,0,0.3)",
              transition: "all 0.2s",
              fontFamily: "inherit",
              position: "relative",
              overflow: "hidden",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 8px 40px rgba(199,162,61,0.7), 0 2px 8px rgba(0,0,0,0.3)";
              (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 6px 30px rgba(199,162,61,0.5), 0 2px 8px rgba(0,0,0,0.3)";
              (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)";
            }}
          >
            <span style={{ fontSize: "1.2rem" }}>📋</span>
            無料で詳細提案を依頼する
            <span style={{ fontSize: "1rem", marginLeft: "0.25rem" }}>→</span>
          </a>

          {/* 安心バッジ */}
          <div style={{
            display: "flex",
            justifyContent: "center",
            gap: "1.25rem",
            marginTop: "1rem",
            flexWrap: "wrap",
          }}>
            {[
              { icon: "✓", text: "登録不要" },
              { icon: "✓", text: "完全無料" },
              { icon: "✓", text: "一級建築士が対応" },
            ].map(({ icon, text }) => (
              <span key={text} style={{
                color: "rgba(212,181,90,0.7)",
                fontSize: "0.72rem",
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
                fontFamily: "Inter, sans-serif",
              }}>
                <span style={{ color: "#C7A23D", fontWeight: 700 }}>{icon}</span> {text}
              </span>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes ctaGlow {
          0%, 100% { box-shadow: 0 0 40px rgba(199,162,61,0.35), 0 0 80px rgba(199,162,61,0.15); }
          50% { box-shadow: 0 0 60px rgba(199,162,61,0.55), 0 0 100px rgba(199,162,61,0.25); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
