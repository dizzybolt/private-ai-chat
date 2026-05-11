"use client";

import { useState } from "react";
import { supabase } from "../../../lib/supabase";

export default function NewWorldviewPage() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    setting: "",
    rules: "",
  });

  const [saving, setSaving] = useState(false);

  function updateField(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function saveWorldview() {
    if (!form.title.trim()) {
      alert("세계관 이름은 필수입니다.");
      return;
    }

    setSaving(true);

    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      window.location.href = "/login";
      return;
    }

    const { error } = await supabase.from("worldviews").insert({
      user_id: userData.user.id,
      ...form,
    });

    setSaving(false);

    if (error) {
      console.error(error);
      alert("저장 중 오류가 발생했습니다.");
      return;
    }

    window.location.href = "/worldviews";
  }

  return (
    <WorldviewForm
      title="새 세계관 생성"
      form={form}
      saving={saving}
      onChange={updateField}
      onSave={saveWorldview}
      saveLabel="저장하기"
    />
  );
}

function WorldviewForm({
  title,
  form,
  saving,
  onChange,
  onSave,
  saveLabel,
}: {
  title: string;
  form: Record<string, string>;
  saving: boolean;
  onChange: (key: string, value: string) => void;
  onSave: () => void;
  saveLabel: string;
}) {
  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-3xl mx-auto space-y-5">
        <h1 className="text-2xl font-bold">{title}</h1>

        <Input
          label="세계관 이름"
          value={form.title}
          onChange={(v) => onChange("title", v)}
        />

        <Textarea
          label="세계관 설명"
          value={form.description}
          onChange={(v) => onChange("description", v)}
          placeholder="예: 현대 도시를 배경으로 한 일상 판타지"
        />

        <Textarea
          label="배경 설정"
          value={form.setting}
          onChange={(v) => onChange("setting", v)}
          placeholder="시대, 장소, 분위기, 주요 세력, 사회 구조 등을 작성하세요."
        />

        <Textarea
          label="세계관 규칙"
          value={form.rules}
          onChange={(v) => onChange("rules", v)}
          placeholder="이 세계에서 반드시 지켜야 할 규칙, 금지 설정, 말하면 안 되는 설정 등을 작성하세요."
        />

        <div className="flex gap-3">
          <button
            onClick={onSave}
            disabled={saving}
            className="bg-blue-600 px-5 py-3 rounded-xl disabled:bg-zinc-700"
          >
            {saving ? "저장 중..." : saveLabel}
          </button>

          <a href="/worldviews" className="bg-zinc-800 px-5 py-3 rounded-xl">
            취소
          </a>
        </div>
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm text-zinc-300">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 outline-none"
      />
    </label>
  );
}

function Textarea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm text-zinc-300">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={5}
        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 outline-none resize-none"
      />
    </label>
  );
}