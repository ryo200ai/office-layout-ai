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
      meetingRooms: prev.meetingRooms.map((r) =>
        r.id === id ? { ...r, capacity } : r
      ),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  const isValid = form.tsubo && form.companyName && form.clientName && form.seats;

  const inputClass =
    "w-full rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition text-sm";
  const labelClass = "block text-sm font-semibold text-gray-200 mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* ── 図面アップロード ── */}
      <div>
        <label className={labelClass}>
          図面アップロード
          <span className="text-gray-400 font-normal ml-2 text-xs">（1/100スケール推奨）</span>
        </label>
        <div
          className={`relative rounded-xl border-2 border-dashed transition cursor-pointer select-none ${
            isDragging
              ? "border-blue-400 bg-blue-400/10"
              : "border-white/25 bg-white/5 hover:bg-white/10"
          }`}
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
            <div className="relative">
              {preview === "pdf" ? (
                <div className="h-32 flex flex-col items-center justify-center gap-2">
                  <span className="text-4xl">📄</span>
                  <p className="text-gray-300 text-sm">{form.floorPlanImage?.name}</p>
                </div>
              ) : (
                <img
                  src={preview}
                  alt="図面プレビュー"
                  className="w-full h-52 object-contain rounded-xl"
                />
              )}
              {/* 削除ボタン */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setPreview(null);
                  setForm((prev) => ({ ...prev, floorPlanImage: undefined }));
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-7 h-7 text-sm flex items-center justify-center shadow-lg"
              >
                ✕
              </button>
              {preview !== "pdf" && (
                <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full max-w-[80%] truncate">
                  {form.floorPlanImage?.name}
                </div>
              )}
            </div>
          ) : (
            <div className="py-10 flex flex-col items-center gap-2">
              <div className="text-4xl">📐</div>
              <p className="text-gray-200 text-sm font-semibold">タップして図面を選択</p>
              <p className="text-gray-500 text-xs">またはドラッグ＆ドロップ</p>
              <p className="text-gray-500 text-xs mt-1">PNG / JPG / PDF 対応</p>
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>

      {/* ── 坪数 ── */}
      <div>
        <label className={labelClass}>
          坪数<span className="text-red-400 ml-1">*</span>
        </label>
        <div className="relative">
          <input
            type="number"
            min={1}
            value={form.tsubo}
            onChange={(e) => setForm((prev) => ({ ...prev, tsubo: e.target.value }))}
            placeholder="例：45"
            className={inputClass + " pr-12"}
            required
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
            坪
          </span>
        </div>
        {form.tsubo && (
          <p className="text-xs text-gray-500 mt-1">
            ≈ {Math.round(Number(form.tsubo) * 3.31)}㎡
          </p>
        )}
      </div>

      {/* ── 物件・クライアント情報 ── */}
      <div className="border-t border-white/10 pt-5 space-y-4">
        <p className="text-xs text-blue-300 font-semibold uppercase tracking-wider">
          物件・クライアント情報
        </p>

        {/* 貴社名 */}
        <div>
          <label className={labelClass}>
            貴社名<span className="text-red-400 ml-1">*</span>
          </label>
          <input
            type="text"
            value={form.companyName}
            onChange={(e) => setForm((prev) => ({ ...prev, companyName: e.target.value }))}
            placeholder="例：株式会社〇〇不動産"
            className={inputClass}
            required
          />
        </div>

        {/* 移転先住所 */}
        <div>
          <label className={labelClass}>移転先住所</label>
          <input
            type="text"
            value={form.newAddress}
            onChange={(e) => setForm((prev) => ({ ...prev, newAddress: e.target.value }))}
            placeholder="例：東京都渋谷区〇〇1-2-3"
            className={inputClass}
          />
        </div>

        {/* ビル名 */}
        <div>
          <label className={labelClass}>ビル名</label>
          <input
            type="text"
            value={form.buildingName}
            onChange={(e) => setForm((prev) => ({ ...prev, buildingName: e.target.value }))}
            placeholder="例：〇〇ビル 5F"
            className={inputClass}
          />
        </div>

        {/* クライアント名 */}
        <div>
          <label className={labelClass}>
            クライアント名<span className="text-red-400 ml-1">*</span>
          </label>
          <input
            type="text"
            value={form.clientName}
            onChange={(e) => setForm((prev) => ({ ...prev, clientName: e.target.value }))}
            placeholder="例：山田 太郎 様"
            className={inputClass}
            required
          />
        </div>
      </div>

      {/* ── スペース要件 ── */}
      <div className="border-t border-white/10 pt-5 space-y-4">
        <p className="text-xs text-blue-300 font-semibold uppercase tracking-wider">
          スペース要件
        </p>

        {/* 席数 */}
        <div>
          <label className={labelClass}>
            席数<span className="text-red-400 ml-1">*</span>
          </label>
          <div className="relative">
            <input
              type="number"
              min={1}
              value={form.seats}
              onChange={(e) => setForm((prev) => ({ ...prev, seats: e.target.value }))}
              placeholder="例：30"
              className={inputClass + " pr-12"}
              required
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
              席
            </span>
          </div>
        </div>

        {/* 会議室 */}
        <div>
          <label className={labelClass}>
            会議室
            <span className="text-gray-400 font-normal ml-2 text-xs">（各室の定員を入力）</span>
          </label>
          <div className="space-y-2">
            {form.meetingRooms.map((room, index) => (
              <div key={room.id} className="flex gap-2 items-center">
                <span className="text-gray-400 text-xs min-w-[40px] text-right">
                  第{index + 1}室
                </span>
                <div className="relative flex-1">
                  <input
                    type="number"
                    min={1}
                    value={room.capacity}
                    onChange={(e) => updateMeetingRoom(room.id, e.target.value)}
                    placeholder="8"
                    className={inputClass + " pr-14"}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
                    名用
                  </span>
                </div>
                {form.meetingRooms.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMeetingRoom(room.id)}
                    className="w-9 h-9 flex-shrink-0 rounded-lg bg-red-500/20 border border-red-400/30 text-red-400 text-base flex items-center justify-center hover:bg-red-500/30 transition"
                  >
                    −
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addMeetingRoom}
              className="w-full py-2.5 rounded-lg border border-dashed border-white/20 text-gray-400 text-sm hover:bg-white/5 transition"
            >
              ＋ 会議室を追加
            </button>
          </div>
        </div>

        {/* テレフォンブース数 */}
        <div>
          <label className={labelClass}>テレフォンブース数</label>
          <div className="relative">
            <input
              type="number"
              min={0}
              value={form.phoneBooths}
              onChange={(e) => setForm((prev) => ({ ...prev, phoneBooths: e.target.value }))}
              placeholder="0"
              className={inputClass + " pr-20"}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
              ブース
            </span>
          </div>
        </div>
      </div>

      {/* 送信ボタン */}
      <button
        type="submit"
        disabled={!isValid || isLoading}
        className="w-full py-4 rounded-xl font-bold text-white text-base transition-all bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-blue-900/30"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            AIが診断中...
          </span>
        ) : (
          "AIレイアウト診断を開始する →"
        )}
      </button>
    </form>
  );
}
