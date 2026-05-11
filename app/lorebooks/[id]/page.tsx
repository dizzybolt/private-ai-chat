"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";

type Worldview = {
  id: string;
  title: string;
};

export default function EditLorebookPage() {
  const params = useParams();
  const lorebookId = params.id as string;

  const [worldviews, setWorldviews] = useState<Worldview[]>([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    worldview_id: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (lorebookId) {
      initialize();
    }
  }, [lorebookId]);

  async function initialize() {
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      window.location.href = "/login";
      return;
    }

    const { data: worldviewData, error: worldviewError } = await supabase
      .from("worldviews")
      .select("id, title")
      .eq("user_id", userData.user.id)
      .order("updated_at", { ascending: false });

    if (worldviewError) {
      console.error(worldviewError);
      alert("세계관 목록을 불러오지 못했습니다.");
      return;
    }

    setWorldviews(worldviewData || []);

    const { data: lorebookData, error: lorebookError } = await supabase
      .from("lorebooks")
      .select("*")
      .eq("id", lorebookId)
      .eq("user_id", userData.user.id)
      .single();

    if (lorebookError || !lorebookData) {
      console.error(lorebookError);
      alert("로어북을 찾을 수 없습니다.");
      window.location.href = "/lorebooks";
      return;
    }

    setForm({
      title: lorebookData.title || "",
      description: lorebookData.description || "",
      worldview_id: lorebookData.worldview_id || "",
    });

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
      alert("세계관을 선택해주세요.");
      return;
    }

    setSaving(true);

    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      window.location.href = "/login";
      return;
    }

    const { error } = await supabase
      .from("lorebooks")
      .update({
        title: form.title,
        description: form.description,
        worldview_id: form.worldview_id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", lorebookId)
      .eq("user_id", userData.user.id);

    setSaving(false);

    if (error) {
      console.error(error);
      alert("수정 중 오류가 발생했습니다.");
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

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-3xl mx-auto space-y-5">
        <h1 className="text-2xl font-bold">로어북 수정</h1>

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
        />

        <div className="flex gap-3">
          <button
            onClick={saveLorebook}
            disabled={saving}
            className="bg-blue-600 px-5 py-3 rounded-xl disabled:bg-zinc-700"
          >
            {saving ? "저장 중..." : "수정하기"}
          </button>

          <a href="/lorebooks" className="bg-zinc-800 px-5 py-3 rounded-xl">
            취소
          </a>

          <a
            href={`/lorebooks/${lorebookId}/entries`}
            className="bg-zinc-800 px-5 py-3 rounded-xl"
          >
            항목 관리
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