"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../../lib/supabase";

type Lorebook = {
  id: string;
  title: string;
};

type LoreEntry = {
  id: string;
  title: string;
  keywords: string | null;
  content: string;
  always_enabled: boolean;
  priority: number;
  updated_at: string;
};

const emptyForm = {
  title: "",
  keywords: "",
  content: "",
  always_enabled: false,
  priority: 0,
};

export default function LoreEntriesPage() {
  const params = useParams();
  const lorebookId = params.id as string;

  const [lorebook, setLorebook] = useState<Lorebook | null>(null);
  const [entries, setEntries] = useState<LoreEntry[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

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

    const { data: lorebookData, error: lorebookError } = await supabase
      .from("lorebooks")
      .select("id, title")
      .eq("id", lorebookId)
      .eq("user_id", userData.user.id)
      .single();

    if (lorebookError || !lorebookData) {
      console.error(lorebookError);
      alert("로어북을 찾을 수 없습니다.");
      window.location.href = "/lorebooks";
      return;
    }

    setLorebook(lorebookData);
    await loadEntries(userData.user.id);
    setLoading(false);
  }

  async function loadEntries(userId?: string) {
    const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id;

    if (!targetUserId) return;

    const { data, error } = await supabase
      .from("lore_entries")
      .select("*")
      .eq("user_id", targetUserId)
      .eq("lorebook_id", lorebookId)
      .order("priority", { ascending: false })
      .order("updated_at", { ascending: false });

    if (error) {
      console.error(error);
      alert("로어 항목을 불러오지 못했습니다.");
      return;
    }

    setEntries((data || []) as LoreEntry[]);
  }

  function updateField(key: string, value: string | boolean | number) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function startEdit(entry: LoreEntry) {
    setEditingId(entry.id);
    setForm({
      title: entry.title || "",
      keywords: entry.keywords || "",
      content: entry.content || "",
      always_enabled: Boolean(entry.always_enabled),
      priority: Number(entry.priority || 0),
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveEntry() {
    if (!form.title.trim()) {
      alert("항목 제목은 필수입니다.");
      return;
    }

    if (!form.content.trim()) {
      alert("항목 내용은 필수입니다.");
      return;
    }

    setSaving(true);

    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      window.location.href = "/login";
      return;
    }

    if (editingId) {
      const { error } = await supabase
        .from("lore_entries")
        .update({
          title: form.title,
          keywords: form.keywords,
          content: form.content,
          always_enabled: form.always_enabled,
          priority: Number(form.priority || 0),
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingId)
        .eq("user_id", userData.user.id);

      setSaving(false);

      if (error) {
        console.error(error);
        alert("수정 중 오류가 발생했습니다.");
        return;
      }
    } else {
      const { error } = await supabase.from("lore_entries").insert({
        user_id: userData.user.id,
        lorebook_id: lorebookId,
        title: form.title,
        keywords: form.keywords,
        content: form.content,
        always_enabled: form.always_enabled,
        priority: Number(form.priority || 0),
      });

      setSaving(false);

      if (error) {
        console.error(error);
        alert("저장 중 오류가 발생했습니다.");
        return;
      }
    }

    resetForm();
    await loadEntries(userData.user.id);
  }

  async function deleteEntry(id: string) {
    const ok = confirm("이 로어 항목을 삭제할까요?");
    if (!ok) return;

    const { error } = await supabase.from("lore_entries").delete().eq("id", id);

    if (error) {
      console.error(error);
      alert("삭제 중 오류가 발생했습니다.");
      return;
    }

    await loadEntries();
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
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">로어 항목 관리</h1>
          <p className="text-zinc-400 text-sm mt-1">
            로어북: {lorebook?.title}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-5">
          <div className="border border-zinc-800 bg-zinc-950 rounded-2xl p-5 space-y-4 h-fit">
            <h2 className="font-bold">
              {editingId ? "로어 항목 수정" : "새 로어 항목"}
            </h2>

            <Input
              label="항목 제목"
              value={form.title}
              onChange={(v) => updateField("title", v)}
            />

            <Textarea
              label="키워드"
              value={form.keywords}
              onChange={(v) => updateField("keywords", v)}
              rows={3}
              placeholder="예: 네오넷, AI기업, 본사"
            />

            <Textarea
              label="내용"
              value={form.content}
              onChange={(v) => updateField("content", v)}
              rows={8}
              placeholder="이 키워드가 등장했을 때 AI가 참고해야 할 설정을 작성하세요."
            />

            <Input
              label="우선순위"
              type="number"
              value={String(form.priority)}
              onChange={(v) => updateField("priority", Number(v))}
            />

            <label className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <input
                type="checkbox"
                checked={form.always_enabled}
                onChange={(e) =>
                  updateField("always_enabled", e.target.checked)
                }
              />
              <span className="text-sm text-zinc-300">
                항상 프롬프트에 포함
              </span>
            </label>

            <div className="flex gap-2">
              <button
                onClick={saveEntry}
                disabled={saving}
                className="flex-1 bg-blue-600 px-5 py-3 rounded-xl disabled:bg-zinc-700"
              >
                {saving
                  ? "저장 중..."
                  : editingId
                  ? "수정하기"
                  : "추가하기"}
              </button>

              {editingId && (
                <button
                  onClick={resetForm}
                  className="bg-zinc-800 px-5 py-3 rounded-xl"
                >
                  취소
                </button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {entries.length === 0 ? (
              <div className="border border-zinc-800 rounded-2xl p-10 text-center text-zinc-400">
                아직 로어 항목이 없습니다.
              </div>
            ) : (
              entries.map((entry) => (
                <div
                  key={entry.id}
                  className="border border-zinc-800 bg-zinc-950 rounded-2xl p-5 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-lg">{entry.title}</h3>
                      <p className="text-xs text-zinc-500 mt-1">
                        우선순위 {entry.priority} ·{" "}
                        {entry.always_enabled ? "항상 포함" : "키워드 매칭"}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(entry)}
                        className="bg-zinc-800 px-4 py-2 rounded-xl text-sm"
                      >
                        수정
                      </button>

                      <button
                        onClick={() => deleteEntry(entry.id)}
                        className="bg-zinc-900 text-red-400 px-4 py-2 rounded-xl text-sm"
                      >
                        삭제
                      </button>
                    </div>
                  </div>

                  <div className="text-sm text-zinc-400">
                    <span className="text-zinc-500">키워드: </span>
                    {entry.keywords || "없음"}
                  </div>

                  <p className="text-sm text-zinc-300 whitespace-pre-wrap">
                    {entry.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <a href="/lorebooks" className="bg-zinc-800 px-5 py-3 rounded-xl text-sm">
            로어북 목록
          </a>

          <a href="/chat" className="bg-zinc-800 px-5 py-3 rounded-xl text-sm">
            채팅으로 돌아가기
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
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm text-zinc-300">{label}</span>
      <input
        type={type}
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
  rows = 5,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm text-zinc-300">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 outline-none resize-none"
      />
    </label>
  );
}