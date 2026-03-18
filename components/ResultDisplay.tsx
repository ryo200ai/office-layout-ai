"use client";

import { useState, useRef, useEffect } from "react";
import ZoneOverlay, { Zone } from "./ZoneOverlay";

type Props = {
  result: string;
  isStreaming: boolean;
  floorPlanPreview?: string | null;
  zones?: Zone[];
};

export default function ResultDisplay({ result, isStreaming, floorPlanPreview, zones = [] }: Props) {
  if (!result && !isStreaming) return null;

  const GOLD = "#C7A23D";
  const GOLD_DIM = "rgba(199,162,61,0.6)";

  const formatContent = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, i) => {
      if (/^#{1,3}\s/.test(line)) {
        return (
          <h3 key={i} style={{ color: GOLD, fontWeight: 700, fontSize: "0.95rem", marginTop: "1.25rem", marginBottom: "0.5rem", letterSpacing: "0.03em" }}>
            {line.replace(/^#{1,3}\s/, "")}
          </h3>
        );
      }
      if (/^\d+\.\s\*\*/.test(line) || /^\d+\.\s【/.test(line)) {
        return (
          <h3 key={i} style={{ color: GOLD, fontWeight: 700, fontSize: "0.95rem", marginTop: "1.25rem", marginBottom: "0.5rem" }}>
            {line.replace(/\*\*/g, "")}
          </h3>
        );
      }
      if (/^\|/.test(line)) {
        const cells = line.split("|").filter((_, idx) => idx > 0 && idx < line.split("|").length - 1);
        const isHeader = /^[-|: ]+$/.test(line.replace(/\|/g, ""));
        if (isHeader) return <div key={i} style={{ height: "1px", backgroundColor: "rgba(199,162,61,0.2)", margin: "0.25rem 0" }} />;
        return (
          <div key={i} style={{ display: "flex", gap: "0.5rem", padding: "0.375rem 0", borderBottom: "1px solid rgba(199,162,61,0.1)", flexWrap: "wrap" }}>
            {cells.map((cell, j) => (
              <span key={j} style={{ color: j === 0 ? "#F0EDE6" : GOLD_DIM, fontSize: "0.8rem", flex: "1 1 0", minWidth: "60px", fontFamily: j > 0 ? "Inter, sans-serif" : "inherit" }}>
                {cell.trim().replace(/\*\*/g, "")}
              </span>
            ))}
          </div>
        );
      }
      if (/^[-・•]\s/.test(line)) {
        const content = line.replace(/^[-・•]\s/, "");
        const parts = content.split(/\*\*(.*?)\*\*/g);
        return (
          <li key={i} style={{ marginLeft: "1rem", color: "#D4C9B8", fontSize: "0.875rem", lineHeight: 1.7, listStyle: "none", paddingLeft: "0.5rem", borderLeft: `2px solid rgba(199,162,61,0.3)`, marginBottom: "0.375rem" }}>
            {parts.map((part, j) => j % 2 === 1 ? <strong key={j} style={{ color: "#F0EDE6", fontWeight: 600 }}>{part}</strong> : part)}
          </li>
        );
      }
      if (/\*\*.*\*\*/.test(line)) {
        const parts = line.split(/\*\*(.*?)\*\*/g);
        return (
          <p key={i} style={{ color: "#D4C9B8", fontSize: "0.875rem", lineHeight: 1.75 }}>
            {parts.map((part, j) => j % 2 === 1 ? <strong key={j} style={{ color: GOLD, fontWeight: 600 }}>{part}</strong> : part)}
          </p>
        );
      }
      if (/^---$/.test(line.trim())) {
        return <div key={i} style={{ height: "1px", backgroundColor: "rgba(199,162,61,0.2)", margin: "0.75rem 0" }} />;
      }
      if (line.trim() === "") return <div key={i} style={{ height: "0.5rem" }} />;
      return (
        <p key={i} style={{ color: "#D4C9B8", fontSize: "0.875rem", lineHeight: 1.75 }}>{line}</p>
      );
    });
  };

  return (
    <div
      style={{
        backgroundColor: "rgba(26,45,85,0.6)",
        border: "1px solid rgba(199,162,61,0.25)",
        borderRadius: "1rem",
        padding: "1.5rem",
        marginTop: "1.5rem",
        boxShadow: "0 4px 30px rgba(0,0,0,0.3)",
      }}
    >
      {/* ヘッダー */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
        <div style={{
          width: "0.5rem", height: "0.5rem", borderRadius: "50%",
          backgroundColor: GOLD,
          boxShadow: `0 0 8px ${GOLD}`,
          animation: isStreaming ? "pulse 1.5s infinite" : "none",
        }} />
        <span style={{ color: GOLD, fontSize: "0.875rem", fontWeight: 600, letterSpacing: "0.05em" }}>
          {isStreaming ? "AIが提案書を生成中..." : "AIレイアウト提案書"}
        </span>
        {!isStreaming && (
          <div style={{ marginLeft: "auto", fontSize: "0.7rem", color: GOLD_DIM, fontFamily: "Inter, sans-serif" }}>完成</div>
        )}
      </div>

      <div style={{ height: "1px", backgroundColor: "rgba(199,162,61,0.2)", marginBottom: "1.25rem" }} />

      {/* 図面 + ゾーンオーバーレイ */}
      {floorPlanPreview && floorPlanPreview !== "pdf" && (
        <div style={{ marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
            <p style={{ fontSize: "0.75rem", color: GOLD_DIM, fontWeight: 600, display: "flex", alignItems: "center", gap: "0.25rem" }}>
              <span>📐</span> ゾーニング図
            </p>
            {zones.length > 0 && (
              <span style={{ fontSize: "0.65rem", color: GOLD_DIM, fontFamily: "Inter, sans-serif" }}>
                {zones.length}ゾーン
              </span>
            )}
          </div>

          {/* 図面コンテナ */}
          <div style={{ position: "relative", borderRadius: "0.75rem", overflow: "hidden", border: "1px solid rgba(199,162,61,0.3)", backgroundColor: "rgba(17,30,58,0.8)" }}>
            <FloorPlanWithOverlay src={floorPlanPreview} zones={zones} />
            <div style={{ position: "absolute", bottom: "0.5rem", left: "0.75rem", fontSize: "0.7rem", color: "rgba(199,162,61,0.8)", fontWeight: 600, fontFamily: "Inter, sans-serif" }}>
              1/100スケール図面
            </div>
          </div>

          {/* 凡例 */}
          {zones.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.75rem" }}>
              {zones.map((zone, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                  <div style={{ width: "0.75rem", height: "0.75rem", borderRadius: "2px", backgroundColor: zone.color, opacity: 0.8 }} />
                  <span style={{ fontSize: "0.7rem", color: GOLD_DIM }}>{zone.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {floorPlanPreview === "pdf" && (
        <div style={{ marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem", borderRadius: "0.75rem", backgroundColor: "rgba(17,30,58,0.5)", border: "1px solid rgba(199,162,61,0.2)" }}>
          <span style={{ fontSize: "2rem" }}>📄</span>
          <div>
            <p style={{ color: "#F0EDE6", fontSize: "0.875rem", fontWeight: 600 }}>PDF図面をもとに診断しました</p>
            <p style={{ color: GOLD_DIM, fontSize: "0.75rem" }}>アップロードされた図面をAIが解析しました</p>
          </div>
        </div>
      )}

      {/* 本文 */}
      <div style={{ lineHeight: 1.75 }}>{formatContent(result)}</div>
      {isStreaming && (
        <span style={{ display: "inline-block", width: "0.5rem", height: "1rem", backgroundColor: GOLD, animation: "pulse 1s infinite", marginLeft: "0.25rem", verticalAlign: "middle" }} />
      )}

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
    </div>
  );
}

// objectFit:contain の実際のレンダリング位置を計算してオーバーレイを正確に重ねる
function FloorPlanWithOverlay({ src, zones }: { src: string; zones: Zone[] }) {
  const [natural, setNatural] = useState({ w: 800, h: 560 });
  const [overlay, setOverlay] = useState({ left: 0, top: 0, w: 0, h: 0 });
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const calcOverlay = () => {
    const img = imgRef.current;
    const container = containerRef.current;
    if (!img || !container || !img.naturalWidth) return;

    const natW = img.naturalWidth;
    const natH = img.naturalHeight;
    const contW = container.clientWidth;
    const contH = container.clientHeight;

    // objectFit: contain の実サイズ計算
    const scale = Math.min(contW / natW, contH / natH);
    const rendW = natW * scale;
    const rendH = natH * scale;
    const left = (contW - rendW) / 2;
    const top = (contH - rendH) / 2;

    setNatural({ w: natW, h: natH });
    setOverlay({ left, top, w: rendW, h: rendH });
  };

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    if (img.complete && img.naturalWidth) calcOverlay();
    img.addEventListener("load", calcOverlay);
    window.addEventListener("resize", calcOverlay);
    return () => {
      img.removeEventListener("load", calcOverlay);
      window.removeEventListener("resize", calcOverlay);
    };
  }, [src]);

  return (
    <div ref={containerRef} style={{ position: "relative", display: "flex", justifyContent: "center", alignItems: "center", maxHeight: "22rem", overflow: "hidden" }}>
      <img
        ref={imgRef}
        src={src}
        alt="アップロード図面"
        style={{ width: "100%", objectFit: "contain", maxHeight: "22rem", display: "block" }}
      />
      {zones.length > 0 && overlay.w > 0 && (
        <div style={{ position: "absolute", left: overlay.left, top: overlay.top, width: overlay.w, height: overlay.h, pointerEvents: "none" }}>
          <ZoneOverlay zones={zones} imageWidth={natural.w} imageHeight={natural.h} />
        </div>
      )}
    </div>
  );
}
