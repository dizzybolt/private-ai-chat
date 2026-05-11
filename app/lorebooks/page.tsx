"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Lorebook = {
  id: string;
  title: string;
  description: string | null;
  worldview_id: string | null;
  updated_at: string;
  worldviews?: {
    title: string;
  } | null;
};

export default function LorebooksPage() {
  const [lorebooks, setLorebooks] = useState<Lorebook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLorebooks();
  }, []);

  async function loadLorebooks() {
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      window.location.href = "/login";
      return;
    }

    const { data, error } = await supabase
      .from("lorebooks")
      .select("*, worldviews(title)")
      .eq("user_id", userData.user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error(error);
      alert("로어북 목록을 불러오지 못했습니다.");
    } else {
      setLorebooks((data || []) as Lorebook[]);
    }

    setLoading(false);
  }

  async function deleteLorebook(id: string) {
    const ok = confirm("이 로어북을 삭제할까요? 연결된 로어 항목도 함께 삭제됩니다.");
    if (!ok) return;

    const { error } = await supabase.from("lorebooks").delete().eq("id", id);

    if (error) {
      console.error(error);
      alert("삭제 중 오류가 발생했습니다.");
      return;
    }

    await loadLorebooks();
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
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">로어북</h1>
            <p className="text-zinc-400 text-sm mt-1">
              세계관 안의 인물, 조직, 장소, 용어, 사건 설정을 관리합니다.
            </p>
          </div>

          <a
            href="/lorebooks/new"
            className="bg-blue-600 px-5 py-3 rounded-xl font-medium"
          >
            + 새 로어북
          </a>
        </div>

        {lorebooks.length === 0 ? (
          <div className="border border-zinc-800 rounded-2xl p-10 text-center">
            <p className="text-zinc-400">아직 생성된 로어북이 없습니다.</p>
            <a
              href="/lorebooks/new"
              className="inline-block mt-5 bg-blue-600 px-5 py-3 rounded-xl"
            >
              첫 로어북 만들기
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lorebooks.map((lorebook) => (
              <div
                key={lorebook.id}
                className="border border-zinc-800 bg-zinc-950 rounded-2xl p-5 space-y-4"
              >
                <div>
                  <h2 className="font-bold text-lg truncate">
                    {lorebook.title}
                  </h2>
                  <p className="text-sm text-zinc-500 mt-1">
                    세계관: {lorebook.worldviews?.title || "연결 없음"}
                  </p>
                  <p className="text-sm text-zinc-400 line-clamp-2 mt-2">
                    {lorebook.description || "설명 없음"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={`/lorebooks/${lorebook.id}/entries`}
                    className="bg-blue-600 text-center rounded-xl py-3 text-sm"
                  >
                    항목 관리
                  </a>

                  <a
                    href={`/lorebooks/${lorebook.id}`}
                    className="bg-zinc-800 text-center rounded-xl py-3 text-sm"
                  >
                    수정
                  </a>

                  <button
                    onClick={() => deleteLorebook(lorebook.id)}
                    className="col-span-2 bg-zinc-900 text-red-400 px-4 py-3 rounded-xl text-sm"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <a href="/chat" className="bg-zinc-800 px-5 py-3 rounded-xl text-sm">
            채팅으로 돌아가기
          </a>

          <a
            href="/worldviews"
            className="bg-zinc-800 px-5 py-3 rounded-xl text-sm"
          >
            세계관 관리
          </a>
        </div>
      </div>
    </div>
  );
}