"use client";

import { useState, useRef } from "react";

export type MeetingRoom = {
  id: string;
  capacity: string;
};

export type LayoutFormData = {
  tsubo: string;
  companyName: string;
  newAddress: string;
  buildingName: string;
  clientName: string;
  seats: string;
  meetingRooms: MeetingRoom[];
  phoneBooths: string;
  lounge: boolean;
  floorPlanImage?: File;
};

type Props = {
  onSubmit: (data: LayoutFormData) => void;
  isLoading: boolean;
};

export default function InputForm({ onSubmit, isLoading }: Props) {
  const [form, setForm] = useState<LayoutFormData>({
    tsubo: "",
    companyName: "",
    newAddress: "",
    buildingName: "",
    clientName: "",
    seats: "",
    meetingRooms: [{ id: "1", capacity: "" }],
    phoneBooths: "",
    lounge: false,
    floorPlanImage: undefined,
  });
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (file && (file.type.startsWith("image/") || file.type === "application/pdf")) {
      setForm((prev) => ({ ...prev, floorPlanImage: file }));
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target?.result as string);
        reader.readAsDataURL(file);
      } else {
        setPreview("pdf");
      }
    }
  };

  const addMeetingRoom = () => {
    setForm((prev) => ({
      ...prev,
      meetingRooms: [...prev.meetingRooms, { id: Date.now().toString(), capacity: "" }],
    }));
  };

  const removeMeetingRoom = (id: string) => {
    setForm((prev) => ({
      ...prev,
      meetingRooms: prev.meetingRooms.filter((r) => r.id !== id),
    }));
  };

  const updateMeetingRoom = (id: string, capacity: string) => {
    setForm((prev) => ({
      ...prev,
      meetingRooms: prev.meetingRooms.map((r) => (r.id === id ? { ...r, capacity } : r)),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  const isValid = form.tsubo && form.companyName && form.clientName && form.seats;

  const GOLD = "#C7A23D";
  const GOLD_DIM = "rgba(199,162,61,0.7)";
  const NAVY_INPUT = "rgba(10,20,45,0.85)";
  const BORDER = "rgba(199,162,61,0.35)";

  const inputStyle: React.CSSProperties = {
    width: "100%",
    backgroundColor: NAVY_INPUT,
    border: `1px solid ${BORDER}`,
    color: "#F5F2EC",
    borderRadius: "0.5rem",
    padding: "0.75rem 1rem",
    fontSize: "0.9rem",
    outline: "none",
    fontFamily: "Inter, sans-serif",
    transition: "border-color 0.2s",
  };

  const labelStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    fontSize: "0.85rem",
    fontWeight: 700,
    color: "#F0EDE6",
    marginBottom: "0.5rem",
    letterSpacing: "0.04em",
  };

  const sectionHeaderStyle: React.CSSProperties = {
    fontSize: "0.72rem",
    color: "#C7A23D",
    letterSpacing: "0.18em",
    fontFamily: "Inter, sans-serif",
    fontWeight: 700,
    textTransform: "uppercase" as const,
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    paddingBottom: "0.5rem",
    borderBottom: "1px solid rgba(199,162,61,0.2)",
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* ── 図面アップロード ── */}
      <div>
        <label style={labelStyle}>
          図面アップロード
          <span style={{ color: "rgba(199,162,61,0.5)", fontWeight: 400, marginLeft: "0.5rem", fontSize: "0.7rem" }}>
            （1/100スケール推奨）
          </span>
        </label>
        <div
          style={{
            borderRadius: "0.75rem",
            border: `2px dashed ${isDragging ? GOLD : BORDER}`,
            backgroundColor: isDragging ? "rgba(199,162,61,0.08)" : "rgba(17,30,58,0.5)",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer.files[0];
            if (file) handleFile(file);
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          {preview ? (
            <div style={{ position: "relative" }}>
              {preview === "pdf" ? (
                <div style={{ height: "8rem", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "2.5rem" }}>📄</span>
                  <p style={{ color: "#F0EDE6", fontSize: "0.875rem" }}>{form.floorPlanImage?.name}</p>
                </div>
              ) : (
                <img src={preview} alt="図面プレビュー" style={{ width: "100%", height: "13rem", objectFit: "contain", borderRadius: "0.75rem" }} />
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setPreview(null);
                  setForm((prev) => ({ ...prev, floorPlanImage: undefined }));
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                style={{
                  position: "absolute", top: "0.5rem", right: "0.5rem",
                  backgroundColor: "#DC2626", color: "white",
                  borderRadius: "50%", width: "1.75rem", height: "1.75rem",
                  fontSize: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center",
                  border: "none", cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>
          ) : (
            <div style={{ padding: "2.5rem 1rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
              <div style={{ fontSize: "2.5rem" }}>📐</div>
              <p style={{ color: "#F0EDE6", fontSize: "0.875rem", fontWeight: 600 }}>タップして図面を選択</p>
              <p style={{ color: GOLD_DIM, fontSize: "0.75rem" }}>またはドラッグ＆ドロップ</p>
              <p style={{ color: "rgba(199,162,61,0.4)", fontSize: "0.7rem" }}>PNG / JPG / PDF 対応</p>
            </div>
          )}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*,.pdf" style={{ display: "none" }}
          onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFile(file); }}
        />
      </div>

      {/* ── 坪数 ── */}
      <div>
        <label style={labelStyle}>
          坪数<span style={{ color: "#F87171", marginLeft: "0.25rem" }}>*</span>
        </label>
        <div style={{ position: "relative" }}>
          <input
            type="number" min={1}
            value={form.tsubo}
            onChange={(e) => setForm((prev) => ({ ...prev, tsubo: e.target.value }))}
            placeholder="例：45"
            style={{ ...inputStyle, paddingRight: "3rem" }}
            required
          />
          <span style={{ position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)", color: GOLD_DIM, fontSize: "0.875rem", pointerEvents: "none" }}>
            坪
          </span>
        </div>
        {form.tsubo && (
          <p style={{ fontSize: "0.7rem", color: GOLD_DIM, marginTop: "0.25rem", fontFamily: "Inter, sans-serif" }}>
            ≈ {Math.round(Number(form.tsubo) * 3.31)}㎡
          </p>
        )}
      </div>

      {/* ── 物件・クライアント情報 ── */}
      <div style={{ borderTop: `1px solid rgba(199,162,61,0.2)`, paddingTop: "1.25rem" }} className="space-y-4">
        <p style={sectionHeaderStyle}>物件・クライアント情報</p>

        {[
          { label: "貴社名", key: "companyName", placeholder: "例：株式会社〇〇不動産", required: true },
          { label: "移転先住所", key: "newAddress", placeholder: "例：東京都渋谷区〇〇1-2-3", required: false },
          { label: "ビル名", key: "buildingName", placeholder: "例：〇〇ビル 5F", required: false },
          { label: "クライアント名", key: "clientName", placeholder: "例：山田 太郎 様", required: true },
        ].map(({ label, key, placeholder, required }) => (
          <div key={key}>
            <label style={labelStyle}>
              {label}{required && <span style={{ color: "#F87171", marginLeft: "0.25rem" }}>*</span>}
            </label>
            <input
              type="text"
              value={form[key as keyof LayoutFormData] as string}
              onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
              placeholder={placeholder}
              style={inputStyle}
              required={required}
            />
          </div>
        ))}
      </div>

      {/* ── スペース要件 ── */}
      <div style={{ borderTop: `1px solid rgba(199,162,61,0.2)`, paddingTop: "1.25rem" }} className="space-y-4">
        <p style={sectionHeaderStyle}>スペース要件</p>

        {/* ラウンジ */}
        <div>
          <label style={labelStyle}>ラウンジ</label>
          <button
            type="button"
            onClick={() => setForm((prev) => ({ ...prev, lounge: !prev.lounge }))}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.75rem 1rem",
              borderRadius: "0.5rem",
              border: `1px solid ${form.lounge ? "rgba(199,162,61,0.6)" : BORDER}`,
              backgroundColor: form.lounge ? "rgba(199,162,61,0.1)" : NAVY_INPUT,
              color: form.lounge ? GOLD : "#9CA3AF",
              fontSize: "0.875rem",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "1.1rem" }}>{form.lounge ? "🛋️" : "🪑"}</span>
              <span>{form.lounge ? "ラウンジあり" : "ラウンジなし"}</span>
            </span>
            <div style={{
              position: "relative", width: "2.75rem", height: "1.5rem",
              borderRadius: "9999px",
              backgroundColor: form.lounge ? GOLD : "rgba(255,255,255,0.15)",
              transition: "background-color 0.2s",
            }}>
              <div style={{
                position: "absolute", top: "0.125rem",
                left: form.lounge ? "1.375rem" : "0.125rem",
                width: "1.25rem", height: "1.25rem",
                backgroundColor: "white",
                borderRadius: "50%",
                boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                transition: "left 0.2s",
              }} />
            </div>
          </button>
        </div>

        {/* 席数 */}
        <div>
          <label style={labelStyle}>
            席数<span style={{ color: "#F87171", marginLeft: "0.25rem" }}>*</span>
          </label>
          <div style={{ position: "relative" }}>
            <input
              type="number" min={1}
              value={form.seats}
              onChange={(e) => setForm((prev) => ({ ...prev, seats: e.target.value }))}
              placeholder="例：30"
              style={{ ...inputStyle, paddingRight: "3rem" }}
              required
            />
            <span style={{ position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)", color: GOLD_DIM, fontSize: "0.875rem", pointerEvents: "none" }}>
              席
            </span>
          </div>
        </div>

        {/* 会議室 */}
        <div>
          <label style={labelStyle}>
            会議室
            <span style={{ color: "rgba(199,162,61,0.5)", fontWeight: 400, marginLeft: "0.5rem", fontSize: "0.7rem" }}>（各室の定員を入力）</span>
          </label>
          <div className="space-y-2">
            {form.meetingRooms.map((room, index) => (
              <div key={room.id} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <span style={{ color: GOLD_DIM, fontSize: "0.75rem", minWidth: "40px", textAlign: "right", fontFamily: "Inter, sans-serif" }}>
                  第{index + 1}室
                </span>
                <div style={{ position: "relative", flex: 1 }}>
                  <input
                    type="number" min={1}
                    value={room.capacity}
                    onChange={(e) => updateMeetingRoom(room.id, e.target.value)}
                    placeholder="8"
                    style={{ ...inputStyle, paddingRight: "3.5rem" }}
                  />
                  <span style={{ position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)", color: GOLD_DIM, fontSize: "0.875rem", pointerEvents: "none" }}>
                    名用
                  </span>
                </div>
                {form.meetingRooms.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMeetingRoom(room.id)}
                    style={{
                      width: "2.25rem", height: "2.25rem", flexShrink: 0,
                      borderRadius: "0.5rem",
                      backgroundColor: "rgba(220,38,38,0.15)",
                      border: "1px solid rgba(220,38,38,0.3)",
                      color: "#FCA5A5",
                      fontSize: "1rem",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer",
                    }}
                  >
                    −
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addMeetingRoom}
              style={{
                width: "100%", padding: "0.625rem",
                borderRadius: "0.5rem",
                border: `1px dashed ${BORDER}`,
                color: GOLD_DIM,
                fontSize: "0.875rem",
                backgroundColor: "transparent",
                cursor: "pointer",
                transition: "background-color 0.2s",
              }}
            >
              ＋ 会議室を追加
            </button>
          </div>
        </div>

        {/* テレフォンブース */}
        <div>
          <label style={labelStyle}>テレフォンブース数</label>
          <div style={{ position: "relative" }}>
            <input
              type="number" min={0}
              value={form.phoneBooths}
              onChange={(e) => setForm((prev) => ({ ...prev, phoneBooths: e.target.value }))}
              placeholder="0"
              style={{ ...inputStyle, paddingRight: "4.5rem" }}
            />
            <span style={{ position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)", color: GOLD_DIM, fontSize: "0.875rem", pointerEvents: "none" }}>
              ブース
            </span>
          </div>
        </div>
      </div>

      {/* 送信ボタン */}
      <button
        type="submit"
        disabled={!isValid || isLoading}
        style={{
          width: "100%",
          padding: "1rem",
          borderRadius: "0.75rem",
          fontWeight: 700,
          fontSize: "0.9rem",
          color: "#1A2D55",
          background: (!isValid || isLoading) ? "rgba(199,162,61,0.3)" : "linear-gradient(135deg, #C7A23D, #D4B55A, #A8862E)",
          border: "none",
          cursor: (!isValid || isLoading) ? "not-allowed" : "pointer",
          transition: "all 0.2s",
          letterSpacing: "0.05em",
          boxShadow: (!isValid || isLoading) ? "none" : "0 4px 20px rgba(199,162,61,0.3)",
          fontFamily: "inherit",
        }}
      >
        {isLoading ? (
          <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
            <svg style={{ animation: "spin 1s linear infinite", width: "1rem", height: "1rem" }} viewBox="0 0 24 24" fill="none">
              <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            AIが診断中...
          </span>
        ) : (
          "AIレイアウト診断を開始する →"
        )}
      </button>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </form>
  );
}
