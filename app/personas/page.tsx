"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Persona = {
  id: string;
  name: string;
  description: string | null;
  personality: string | null;
  speaking_style: string | null;
  is_default: boolean;
  updated_at: string;
};

export default function PersonasPage() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPersonas();
  }, []);

  async function loadPersonas() {
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      window.location.href = "/login";
      return;
    }

    const { data, error } = await supabase
      .from("user_personas")
      .select("*")
      .eq("user_id", userData.user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error(error);
      alert("페르소나 목록을 불러오지 못했습니다.");
    } else {
      setPersonas(data || []);
    }

    setLoading(false);
  }

  async function deletePersona(id: string) {
    const ok = confirm("이 페르소나를 삭제할까요?");
    if (!ok) return;

    const { error } = await supabase
      .from("user_personas")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("삭제 중 오류가 발생했습니다.");
      return;
    }

    await loadPersonas();
  }

  async function setDefaultPersona(id: string) {
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      window.location.href = "/login";
      return;
    }

    await supabase
      .from("user_personas")
      .update({ is_default: false })
      .eq("user_id", userData.user.id);

    const { error } = await supabase
      .from("user_personas")
      .update({
        is_default: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", userData.user.id);

    if (error) {
      console.error(error);
      alert("기본 페르소나 설정 중 오류가 발생했습니다.");
      return;
    }

    await loadPersonas();
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
            <h1 className="text-2xl font-bold">내 페르소나</h1>
            <p className="text-zinc-400 text-sm mt-1">
              AI가 인식할 사용자 역할과 성격을 관리합니다.
            </p>
          </div>

          <a
            href="/personas/new"
            className="bg-blue-600 px-5 py-3 rounded-xl font-medium"
          >
            + 새 페르소나
          </a>
        </div>

        {personas.length === 0 ? (
          <div className="border border-zinc-800 rounded-2xl p-10 text-center">
            <p className="text-zinc-400">아직 생성된 페르소나가 없습니다.</p>
            <a
              href="/personas/new"
              className="inline-block mt-5 bg-blue-600 px-5 py-3 rounded-xl"
            >
              첫 페르소나 만들기
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {personas.map((persona) => (
              <div
                key={persona.id}
                className="border border-zinc-800 bg-zinc-950 rounded-2xl p-5 space-y-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-lg truncate">
                      {persona.name}
                    </h2>

                    {persona.is_default && (
                      <span className="text-xs bg-blue-600 px-2 py-1 rounded-full">
                        기본
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-zinc-400 line-clamp-2 mt-1">
                    {persona.description || "설명 없음"}
                  </p>
                </div>

                <div className="text-sm text-zinc-500 space-y-1">
                  <p className="line-clamp-1">
                    성격: {persona.personality || "설정 없음"}
                  </p>
                  <p className="line-clamp-1">
                    말투: {persona.speaking_style || "설정 없음"}
                  </p>
                </div>

                <div className="flex gap-2">
                  <a
                    href={`/personas/${persona.id}`}
                    className="flex-1 bg-zinc-800 text-center rounded-xl py-3 text-sm"
                  >
                    수정
                  </a>

                  <button
                    onClick={() => setDefaultPersona(persona.id)}
                    className="bg-zinc-800 px-4 rounded-xl text-sm"
                  >
                    기본
                  </button>

                  <button
                    onClick={() => deletePersona(persona.id)}
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
            href="/characters"
            className="inline-block bg-zinc-800 px-5 py-3 rounded-xl text-sm"
          >
            캐릭터 관리
          </a>
        </div>
      </div>
    </div>
  );
}