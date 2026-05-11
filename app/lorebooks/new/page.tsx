"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

type Worldview = {
  id: string;
  title: string;
};

export default function NewLorebookPage() {
  const [worldviews, setWorldviews] = useState<Worldview[]>([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    worldview_id: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadWorldviews();
  }, []);

  async function loadWorldviews() {
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      window.location.href = "/login";
      return;
    }

    const { data, error } = await supabase
      .from("worldviews")
      .select("id, title")
      .eq("user_id", userData.user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error(error);
      alert("세계관 목록을 불러오지 못했습니다.");
      return;
    }

    const list = data || [];
    setWorldviews(list);
    setForm((prev) => ({
      ...prev,
      worldview_id: list[0]?.id || "",
    }));

    setLoading(false);
  }

  function updateField(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function saveLorebook() {
    if (!form.title.trim()) {
      alert("로어북 이름은 필수입니다.");
      return;
    }

    if (!form.worldview_id) {
      alert("세계관을 먼저 선택하세요.");
      return;
    }

    setSaving(true);

    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      window.location.href = "/login";
      return;
    }

    const { error } = await supabase.from("lorebooks").insert({
      user_id: userData.user.id,
      title: form.title,
      description: form.description,
      worldview_id: form.worldview_id,
    });

    setSaving(false);

    if (error) {
      console.error(error);
      alert("저장 중 오류가 발생했습니다.");
      return;
    }

    window.location.href = "/lorebooks";
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        불러오는 중...
      </div>
    );
  }

  if (worldviews.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-xl font-bold">세계관이 필요합니다</h1>
          <p className="text-zinc-400">
            로어북은 세계관에 연결됩니다. 먼저 세계관을 생성해주세요.
          </p>
          <a href="/worldviews/new" className="inline-block bg-blue-600 px-5 py-3 rounded-xl">
            세계관 만들기
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-3xl mx-auto space-y-5">
        <h1 className="text-2xl font-bold">새 로어북 생성</h1>

        <label className="block space-y-2">
          <span className="text-sm text-zinc-300">연결할 세계관</span>
          <select
            value={form.worldview_id}
            onChange={(e) => updateField("worldview_id", e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 outline-none"
          >
            {worldviews.map((worldview) => (
              <option key={worldview.id} value={worldview.id}>
                {worldview.title}
              </option>
            ))}
          </select>
        </label>

        <Input
          label="로어북 이름"
          value={form.title}
          onChange={(v) => updateField("title", v)}
        />

        <Textarea
          label="로어북 설명"
          value={form.description}
          onChange={(v) => updateField("description", v)}
          placeholder="예: 주요 인물, 조직, 장소, 용어를 정리한 로어북"
        />

        <div className="flex gap-3">
          <button
            onClick={saveLorebook}
            disabled={saving}
            className="bg-blue-600 px-5 py-3 rounded-xl disabled:bg-zinc-700"
          >
            {saving ? "저장 중..." : "저장하기"}
          </button>

          <a href="/lorebooks" className="bg-zinc-800 px-5 py-3 rounded-xl">
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