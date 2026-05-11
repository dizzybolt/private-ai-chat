"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function EditWorldviewPage() {
  const params = useParams();
  const worldviewId = params.id as string;

  const [form, setForm] = useState({
    title: "",
    description: "",
    setting: "",
    rules: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (worldviewId) {
      loadWorldview();
    }
  }, [worldviewId]);

  async function loadWorldview() {
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      window.location.href = "/login";
      return;
    }

    const { data, error } = await supabase
      .from("worldviews")
      .select("*")
      .eq("id", worldviewId)
      .eq("user_id", userData.user.id)
      .single();

    if (error || !data) {
      console.error(error);
      alert("세계관을 찾을 수 없습니다.");
      window.location.href = "/worldviews";
      return;
    }

    setForm({
      title: data.title || "",
      description: data.description || "",
      setting: data.setting || "",
      rules: data.rules || "",
    });

    setLoading(false);
  }

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

    const { error } = await supabase
      .from("worldviews")
      .update({
        ...form,
        updated_at: new Date().toISOString(),
      })
      .eq("id", worldviewId)
      .eq("user_id", userData.user.id);

    setSaving(false);

    if (error) {
      console.error(error);
      alert("수정 중 오류가 발생했습니다.");
      return;
    }

    window.location.href = "/worldviews";
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        불러오는 중...
      </div>
    );
  }

  return (
    <WorldviewForm
      title="세계관 수정"
      form={form}
      saving={saving}
      onChange={updateField}
      onSave={saveWorldview}
      saveLabel="수정하기"
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
        />

        <Textarea
          label="배경 설정"
          value={form.setting}
          onChange={(v) => onChange("setting", v)}
        />

        <Textarea
          label="세계관 규칙"
          value={form.rules}
          onChange={(v) => onChange("rules", v)}
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
        rows={5}
        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 outline-none resize-none"
      />
    </label>
  );
}