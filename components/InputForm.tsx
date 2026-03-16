"use client";

import { useState } from "react";

export type FormData = {
  area: string;
  headcount: string;
  purpose: string;
  budget: string;
  timeline: string;
};

type Props = {
  onSubmit: (data: FormData) => void;
  isLoading: boolean;
};

const purposeOptions = [
  { value: "執務中心", label: "執務中心" },
  { value: "会議室多め", label: "会議室多め" },
  { value: "フリーアドレス", label: "フリーアドレス" },
  { value: "ショールーム併設", label: "ショールーム併設" },
];

const budgetOptions = [
  { value: "〜500万", label: "〜500万" },
  { value: "500〜1000万", label: "500〜1000万" },
  { value: "1000〜3000万", label: "1000〜3000万" },
  { value: "3000万〜", label: "3000万〜" },
  { value: "未定", label: "未定" },
];

const timelineOptions = [
  { value: "1〜3ヶ月", label: "1〜3ヶ月" },
  { value: "3〜6ヶ月", label: "3〜6ヶ月" },
  { value: "6〜12ヶ月", label: "6〜12ヶ月" },
  { value: "1年以上", label: "1年以上" },
  { value: "未定", label: "未定" },
];

export default function InputForm({ onSubmit, isLoading }: Props) {
  const [form, setForm] = useState<FormData>({
    area: "",
    headcount: "",
    purpose: "",
    budget: "",
    timeline: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  const isValid =
    form.area && form.headcount && form.purpose && form.budget && form.timeline;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* 面積 */}
      <div>
        <label className="block text-sm font-semibold text-gray-200 mb-1">
          面積（㎡）<span className="text-red-400 ml-1">*</span>
        </label>
        <input
          type="number"
          min={1}
          value={form.area}
          onChange={(e) => setForm({ ...form, area: e.target.value })}
          placeholder="例：150"
          className="w-full rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
          required
        />
      </div>

      {/* 希望人数 */}
      <div>
        <label className="block text-sm font-semibold text-gray-200 mb-1">
          希望人数（名）<span className="text-red-400 ml-1">*</span>
        </label>
        <input
          type="number"
          min={1}
          value={form.headcount}
          onChange={(e) => setForm({ ...form, headcount: e.target.value })}
          placeholder="例：20"
          className="w-full rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
          required
        />
      </div>

      {/* 用途 */}
      <div>
        <label className="block text-sm font-semibold text-gray-200 mb-1">
          用途<span className="text-red-400 ml-1">*</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {purposeOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setForm({ ...form, purpose: opt.value })}
              className={`rounded-lg px-3 py-2 text-sm font-medium border transition ${
                form.purpose === opt.value
                  ? "bg-blue-500 border-blue-400 text-white"
                  : "bg-white/10 border-white/20 text-gray-200 hover:bg-white/20"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 予算感 */}
      <div>
        <label className="block text-sm font-semibold text-gray-200 mb-1">
          予算感<span className="text-red-400 ml-1">*</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {budgetOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setForm({ ...form, budget: opt.value })}
              className={`rounded-lg px-3 py-2 text-sm font-medium border transition ${
                form.budget === opt.value
                  ? "bg-blue-500 border-blue-400 text-white"
                  : "bg-white/10 border-white/20 text-gray-200 hover:bg-white/20"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 移転時期 */}
      <div>
        <label className="block text-sm font-semibold text-gray-200 mb-1">
          移転時期<span className="text-red-400 ml-1">*</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {timelineOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setForm({ ...form, timeline: opt.value })}
              className={`rounded-lg px-3 py-2 text-sm font-medium border transition ${
                form.timeline === opt.value
                  ? "bg-blue-500 border-blue-400 text-white"
                  : "bg-white/10 border-white/20 text-gray-200 hover:bg-white/20"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={!isValid || isLoading}
        className="w-full py-4 rounded-xl font-bold text-white text-base transition-all bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
      >
        {isLoading ? "AIが診断中..." : "AIレイアウト診断を開始する"}
      </button>
    </form>
  );
}
