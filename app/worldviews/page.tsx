"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Worldview = {
  id: string;
  title: string;
  description: string | null;
  setting: string | null;
  rules: string | null;
  updated_at: string;
};

export default function WorldviewsPage() {
  const [worldviews, setWorldviews] = useState<Worldview[]>([]);
  const [loading, setLoading] = useState(true);

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
      .select("*")
      .eq("user_id", userData.user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error(error);
      alert("세계관 목록을 불러오지 못했습니다.");
    } else {
      setWorldviews(data || []);
    }

    setLoading(false);
  }

  async function deleteWorldview(id: string) {
    const ok = confirm("이 세계관을 삭제할까요? 연결된 로어북도 함께 삭제될 수 있습니다.");
    if (!ok) return;

    const { error } = await supabase.from("worldviews").delete().eq("id", id);

    if (error) {
      console.error(error);
      alert("삭제 중 오류가 발생했습니다.");
      return;
    }

    await loadWorldviews();
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
            <h1 className="text-2xl font-bold">세계관</h1>
            <p className="text-zinc-400 text-sm mt-1">
              채팅에 사용할 배경 세계와 규칙을 관리합니다.
            </p>
          </div>

          <a
            href="/worldviews/new"
            className="bg-blue-600 px-5 py-3 rounded-xl font-medium"
          >
            + 새 세계관
          </a>
        </div>

        {worldviews.length === 0 ? (
          <div className="border border-zinc-800 rounded-2xl p-10 text-center">
            <p className="text-zinc-400">아직 생성된 세계관이 없습니다.</p>
            <a
              href="/worldviews/new"
              className="inline-block mt-5 bg-blue-600 px-5 py-3 rounded-xl"
            >
              첫 세계관 만들기
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {worldviews.map((worldview) => (
              <div
                key={worldview.id}
                className="border border-zinc-800 bg-zinc-950 rounded-2xl p-5 space-y-4"
              >
                <div>
                  <h2 className="font-bold text-lg truncate">
                    {worldview.title}
                  </h2>
                  <p className="text-sm text-zinc-400 line-clamp-2 mt-1">
                    {worldview.description || "설명 없음"}
                  </p>
                </div>

                <div className="text-sm text-zinc-500 space-y-1">
                  <p className="line-clamp-2">
                    배경: {worldview.setting || "설정 없음"}
                  </p>
                  <p className="line-clamp-2">
                    규칙: {worldview.rules || "설정 없음"}
                  </p>
                </div>

                <div className="flex gap-2">
                  <a
                    href={`/worldviews/${worldview.id}`}
                    className="flex-1 bg-zinc-800 text-center rounded-xl py-3 text-sm"
                  >
                    수정
                  </a>

                  <button
                    onClick={() => deleteWorldview(worldview.id)}
                    className="bg-zinc-900 text-red-400 px-4 rounded-xl text-sm"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <a href="/chat" className="bg-zinc-800 px-5 py-3 rounded-xl text-sm">
            채팅으로 돌아가기
          </a>

          <a
            href="/characters"
            className="bg-zinc-800 px-5 py-3 rounded-xl text-sm"
          >
            캐릭터 관리
          </a>

          <a
            href="/personas"
            className="bg-zinc-800 px-5 py-3 rounded-xl text-sm"
          >
            페르소나 관리
          </a>
        </div>
      </div>
    </div>
  );
}