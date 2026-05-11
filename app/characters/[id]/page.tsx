"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function EditCharacterPage() {
  const params = useParams();
  const characterId = params.id as string;

  const [form, setForm] = useState({
    name: "",
    description: "",
    personality: "",
    speaking_style: "",
    relationship: "",
    first_message: "",
    avatar_url: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (characterId) {
      loadCharacter();
    }
  }, [characterId]);

  async function loadCharacter() {
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      window.location.href = "/login";
      return;
    }

    const { data, error } = await supabase
      .from("characters")
      .select("*")
      .eq("id", characterId)
      .eq("user_id", userData.user.id)
      .single();

    if (error || !data) {
      console.error("캐릭터 조회 오류:", error);
      alert("캐릭터를 찾을 수 없습니다.");
      window.location.href = "/characters";
      return;
    }

    setForm({
      name: data.name || "",
      description: data.description || "",
      personality: data.personality || "",
      speaking_style: data.speaking_style || "",
      relationship: data.relationship || "",
      first_message: data.first_message || "",
      avatar_url: data.avatar_url || "",
    });

    setLoading(false);
  }

  function updateField(key: string, value: string) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  async function saveCharacter() {
    if (!form.name.trim()) {
      alert("캐릭터 이름은 필수입니다.");
      return;
    }

    setSaving(true);

    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      window.location.href = "/login";
      return;
    }

    const { error } = await supabase
      .from("characters")
      .update({
        ...form,
        updated_at: new Date().toISOString(),
      })
      .eq("id", characterId)
      .eq("user_id", userData.user.id);

    setSaving(false);

    if (error) {
      console.error("캐릭터 수정 오류:", error);
      alert("수정 중 오류가 발생했습니다.");
      return;
    }

    window.location.href = "/characters";
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        불러오는 중...
      </div>
    );
  }

  return (
    <CharacterForm
      title="캐릭터 수정"
      form={form}
      saving={saving}
      onChange={updateField}
      onSave={saveCharacter}
    />
  );
}

function CharacterForm({
  title,
  form,
  saving,
  onChange,
  onSave,
}: {
  title: string;
  form: Record<string, string>;
  saving: boolean;
  onChange: (key: string, value: string) => void;
  onSave: () => void;
}) {
  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-3xl mx-auto space-y-5">
        <h1 className="text-2xl font-bold">{title}</h1>

        <Input label="캐릭터 이름" value={form.name} onChange={(v) => onChange("name", v)} />
        <Textarea label="캐릭터 설명" value={form.description} onChange={(v) => onChange("description", v)} />
        <Textarea label="성격" value={form.personality} onChange={(v) => onChange("personality", v)} />
        <Textarea label="말투" value={form.speaking_style} onChange={(v) => onChange("speaking_style", v)} />
        <Textarea label="사용자와의 관계" value={form.relationship} onChange={(v) => onChange("relationship", v)} />
        <Textarea label="첫 메시지" value={form.first_message} onChange={(v) => onChange("first_message", v)} />
        <Input label="프로필 이미지 URL" value={form.avatar_url} onChange={(v) => onChange("avatar_url", v)} />

        <div className="flex gap-3">
          <button
            onClick={onSave}
            disabled={saving}
            className="bg-blue-600 px-5 py-3 rounded-xl disabled:bg-zinc-700"
          >
            {saving ? "저장 중..." : "수정하기"}
          </button>

          <a href="/characters" className="bg-zinc-800 px-5 py-3 rounded-xl">
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