"use client";

import { useState } from "react";
import { supabase } from "../../../lib/supabase";

export default function NewPersonaPage() {
  const [form, setForm] = useState({
    name: "",
    avatar_url: "",
    description: "",
    personality: "",
    speaking_style: "",
    appearance: "",
    background: "",
    relationship_style: "",
    additional_settings: "",
    is_default: false,
  });

  const [saving, setSaving] = useState(false);

  function updateField(key: string, value: string | boolean) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  async function savePersona() {
    if (!form.name.trim()) {
      alert("페르소나 이름은 필수입니다.");
      return;
    }

    setSaving(true);

    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      window.location.href = "/login";
      return;
    }

    if (form.is_default) {
      await supabase
        .from("user_personas")
        .update({ is_default: false })
        .eq("user_id", userData.user.id);
    }

    const { error } = await supabase.from("user_personas").insert({
      user_id: userData.user.id,
      ...form,
    });

    setSaving(false);

    if (error) {
      console.error(error);
      alert("저장 중 오류가 발생했습니다.");
      return;
    }

    window.location.href = "/personas";
  }

  return (
    <PersonaForm
      title="새 페르소나 생성"
      form={form}
      saving={saving}
      onChange={updateField}
      onSave={savePersona}
      saveLabel="저장하기"
    />
  );
}

function PersonaForm({
  title,
  form,
  saving,
  onChange,
  onSave,
  saveLabel,
}: {
  title: string;
  form: Record<string, string | boolean>;
  saving: boolean;
  onChange: (key: string, value: string | boolean) => void;
  onSave: () => void;
  saveLabel: string;
}) {
  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-3xl mx-auto space-y-5">
        <h1 className="text-2xl font-bold">{title}</h1>

        <Input label="페르소나 이름" value={String(form.name)} onChange={(v) => onChange("name", v)} />
        <Input label="프로필 이미지 URL" value={String(form.avatar_url)} onChange={(v) => onChange("avatar_url", v)} />
        <Textarea label="설명" value={String(form.description)} onChange={(v) => onChange("description", v)} />
        <Textarea label="성격" value={String(form.personality)} onChange={(v) => onChange("personality", v)} />
        <Textarea label="말투" value={String(form.speaking_style)} onChange={(v) => onChange("speaking_style", v)} />
        <Textarea label="외형 / 분위기" value={String(form.appearance)} onChange={(v) => onChange("appearance", v)} />
        <Textarea label="배경 설정" value={String(form.background)} onChange={(v) => onChange("background", v)} />
        <Textarea label="관계 스타일" value={String(form.relationship_style)} onChange={(v) => onChange("relationship_style", v)} />
        <Textarea label="추가 설정" value={String(form.additional_settings)} onChange={(v) => onChange("additional_settings", v)} />

        <label className="flex items-center gap-3 bg-zinc-950 border border-zinc-800 rounded-xl p-4">
          <input
            type="checkbox"
            checked={Boolean(form.is_default)}
            onChange={(e) => onChange("is_default", e.target.checked)}
          />
          <span className="text-sm text-zinc-300">기본 페르소나로 설정</span>
        </label>

        <div className="flex gap-3">
          <button
            onClick={onSave}
            disabled={saving}
            className="bg-blue-600 px-5 py-3 rounded-xl disabled:bg-zinc-700"
          >
            {saving ? "저장 중..." : saveLabel}
          </button>

          <a href="/personas" className="bg-zinc-800 px-5 py-3 rounded-xl">
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm text-zinc-300">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 outline-none resize-none"
      />
    </label>
  );
}