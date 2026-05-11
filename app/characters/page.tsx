"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Character = {
  id: string;
  name: string;
  description: string | null;
  personality: string | null;
  speaking_style: string | null;
  relationship: string | null;
  first_message: string | null;
  avatar_url: string | null;
  updated_at: string;
};

export default function CharactersPage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCharacters();
  }, []);

  async function loadCharacters() {
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      window.location.href = "/login";
      return;
    }

    const { data, error } = await supabase
      .from("characters")
      .select("*")
      .eq("user_id", userData.user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error(error);
      alert("캐릭터 목록을 불러오지 못했습니다.");
    } else {
      setCharacters(data || []);
    }

    setLoading(false);
  }

  async function deleteCharacter(id: string) {
    const ok = confirm("이 캐릭터를 삭제할까요?");
    if (!ok) return;

    const { error } = await supabase
      .from("characters")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("삭제 중 오류가 발생했습니다.");
      return;
    }

    await loadCharacters();
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
            <h1 className="text-2xl font-bold">캐릭터 리스트</h1>
            <p className="text-zinc-400 text-sm mt-1">
              대화에 사용할 캐릭터를 만들고 관리합니다.
            </p>
          </div>

          <a
            href="/characters/new"
            className="bg-blue-600 px-5 py-3 rounded-xl font-medium"
          >
            + 새 캐릭터
          </a>
        </div>

        {characters.length === 0 ? (
          <div className="border border-zinc-800 rounded-2xl p-10 text-center">
            <p className="text-zinc-400">아직 생성된 캐릭터가 없습니다.</p>
            <a
              href="/characters/new"
              className="inline-block mt-5 bg-blue-600 px-5 py-3 rounded-xl"
            >
              첫 캐릭터 만들기
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {characters.map((character) => (
              <div
                key={character.id}
                className="border border-zinc-800 bg-zinc-950 rounded-2xl p-5 space-y-4"
              >
                <div className="flex gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center overflow-hidden shrink-0">
                    {character.avatar_url ? (
                      <img
                        src={character.avatar_url}
                        alt={character.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xl">👤</span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <h2 className="font-bold text-lg truncate">
                      {character.name}
                    </h2>
                    <p className="text-sm text-zinc-400 line-clamp-2">
                      {character.description || "설명 없음"}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <a
                    href={`/characters/${character.id}`}
                    className="flex-1 bg-zinc-800 text-center rounded-xl py-3 text-sm"
                  >
                    수정
                  </a>

                  <button
                    onClick={() => deleteCharacter(character.id)}
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
  <a
    href="/chat"
    className="inline-block bg-zinc-800 px-5 py-3 rounded-xl text-sm"
  >
    채팅으로 돌아가기
  </a>

  <a
    href="/personas"
    className="inline-block bg-zinc-800 px-5 py-3 rounded-xl text-sm"
  >
    페르소나 관리
  </a>
</div>
      </div>
    </div>
  );
}