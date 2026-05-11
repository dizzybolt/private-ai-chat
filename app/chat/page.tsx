"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ChatRoom = {
  id: string;
  title: string;
  updated_at: string;
  persona_id: string | null;
  character_id: string | null;
};

type Profile = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  is_active: boolean;
};

type Character = {
  id: string;
  name: string;
  description: string | null;
  personality: string | null;
  speaking_style: string | null;
  relationship: string | null;
  first_message: string | null;
  avatar_url: string | null;
};

type Persona = {
  id: string;
  name: string;
  description: string | null;
  personality: string | null;
  speaking_style: string | null;
  appearance: string | null;
  background: string | null;
  relationship_style: string | null;
  additional_settings: string | null;
  is_default: boolean;
};

export default function ChatPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);

  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(
    null
  );
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);

  const [newCharacterId, setNewCharacterId] = useState("");
  const [newPersonaId, setNewPersonaId] = useState("");

  const [roomId, setRoomId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [newChatModalOpen, setNewChatModalOpen] = useState(false);

  useEffect(() => {
    initialize();
  }, []);

  async function initialize() {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      if (!user) {
        window.location.href = "/login";
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError || !profileData?.is_active) {
        await supabase.auth.signOut();
        window.location.href = "/login";
        return;
      }

      setProfile(profileData);

      await loadCharacters(user.id);
      await loadPersonas(user.id);
      await loadRooms(user.id);

      const savedRoomId = localStorage.getItem(`current_room_id_${user.id}`);

      if (savedRoomId) {
        await loadRoom(savedRoomId);
      }
    } finally {
      setInitializing(false);
    }
  }

  async function loadCharacters(userId: string) {
    const { data } = await supabase
      .from("characters")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    setCharacters(data || []);
  }

  async function loadPersonas(userId: string) {
    const { data } = await supabase
      .from("user_personas")
      .select("*")
      .eq("user_id", userId)
      .order("is_default", { ascending: false })
      .order("updated_at", { ascending: false });

    setPersonas(data || []);
  }

  async function loadRooms(userId?: string) {
    const targetUserId = userId || profile?.id;
    if (!targetUserId) return;

    const { data } = await supabase
      .from("chat_rooms")
      .select("id, title, updated_at, persona_id, character_id")
      .eq("user_id", targetUserId)
      .order("updated_at", { ascending: false });

    setRooms(data || []);
  }

  async function loadRoom(selectedRoomId: string) {
    setRoomId(selectedRoomId);

    if (profile?.id) {
      localStorage.setItem(`current_room_id_${profile.id}`, selectedRoomId);
    }

    const { data: roomData, error: roomError } = await supabase
      .from("chat_rooms")
      .select("id, persona_id, character_id")
      .eq("id", selectedRoomId)
      .single();

    if (roomError || !roomData) {
      console.error(roomError);
      return;
    }

    const character =
      characters.find((item) => item.id === roomData.character_id) || null;
    const persona =
      personas.find((item) => item.id === roomData.persona_id) || null;

    setSelectedCharacter(character);
    setSelectedPersona(persona);

    const { data: messageData, error: messageError } = await supabase
      .from("chat_messages")
      .select("role, content")
      .eq("room_id", selectedRoomId)
      .order("created_at", { ascending: true });

    if (messageError) {
      console.error(messageError);
      return;
    }

    setMessages((messageData || []) as ChatMessage[]);
  }

  function openNewChatModal() {
    if (personas.length === 0) {
      alert("먼저 페르소나를 만들어주세요.");
      window.location.href = "/personas";
      return;
    }

    if (characters.length === 0) {
      alert("먼저 캐릭터를 만들어주세요.");
      window.location.href = "/characters";
      return;
    }

    const defaultPersona =
      personas.find((persona) => persona.is_default) || personas[0];

    setNewPersonaId(defaultPersona.id);
    setNewCharacterId(characters[0].id);
    setNewChatModalOpen(true);
  }

  async function createRoomWithSelection() {
    if (!profile || !newPersonaId || !newCharacterId) return;

    const character =
      characters.find((item) => item.id === newCharacterId) || null;
    const persona = personas.find((item) => item.id === newPersonaId) || null;

    const { data, error } = await supabase
      .from("chat_rooms")
      .insert({
        user_id: profile.id,
        persona_id: newPersonaId,
        character_id: newCharacterId,
        title: character?.name ? `${character.name}와의 대화` : "새 채팅",
      })
      .select("id")
      .single();

    if (error || !data) {
      console.error(error);
      alert("새 채팅 생성 중 오류가 발생했습니다.");
      return;
    }

    localStorage.setItem(`current_room_id_${profile.id}`, data.id);

    setRoomId(data.id);
    setSelectedCharacter(character);
    setSelectedPersona(persona);
    setNewChatModalOpen(false);
    setSidebarOpen(false);

    if (character?.first_message) {
      const firstMessage: ChatMessage = {
        role: "assistant",
        content: character.first_message,
      };

      setMessages([firstMessage]);

      await supabase.from("chat_messages").insert({
        room_id: data.id,
        user_id: profile.id,
        role: firstMessage.role,
        content: firstMessage.content,
      });
    } else {
      setMessages([]);
    }

    await loadRooms(profile.id);
  }

  async function deleteRoom(deleteRoomId: string) {
    if (!profile) return;

    const ok = confirm("이 채팅방을 삭제할까요?");
    if (!ok) return;

    const { error } = await supabase
      .from("chat_rooms")
      .delete()
      .eq("id", deleteRoomId);

    if (error) {
      console.error(error);
      alert("삭제 중 오류가 발생했습니다.");
      return;
    }

    if (deleteRoomId === roomId) {
      localStorage.removeItem(`current_room_id_${profile.id}`);
      setRoomId(null);
      setMessages([]);
      setSelectedCharacter(null);
      setSelectedPersona(null);
    }

    await loadRooms(profile.id);
  }

  async function sendMessage() {
    if (!input.trim() || loading || !roomId || !profile) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: input,
    };

    const updatedMessages = [...messages, userMessage];
    const currentInput = input;

    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    await supabase.from("chat_messages").insert({
      room_id: roomId,
      user_id: profile.id,
      role: userMessage.role,
      content: userMessage.content,
    });

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: updatedMessages,
          character: selectedCharacter,
          persona: selectedPersona,
        }),
      });

      const data = await response.json();

      const aiMessage: ChatMessage = {
        role: "assistant",
        content: data.message || "응답 생성 실패",
      };

      setMessages((prev) => [...prev, aiMessage]);

      await supabase.from("chat_messages").insert({
        room_id: roomId,
        user_id: profile.id,
        role: aiMessage.role,
        content: aiMessage.content,
      });

      await supabase
        .from("chat_rooms")
        .update({
          title: currentInput.slice(0, 30),
          updated_at: new Date().toISOString(),
        })
        .eq("id", roomId);

      await loadRooms(profile.id);
    } catch (error) {
      console.error(error);
      alert("AI 응답 생성 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  if (initializing) {
    return (
      <div className="h-screen bg-black text-white flex items-center justify-center">
        불러오는 중...
      </div>
    );
  }

  return (
    <div className="h-screen bg-black text-white flex relative overflow-hidden">
      <div
        className={`fixed md:static z-30 h-full w-[280px] bg-black border-r border-zinc-800 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="p-4 border-b border-zinc-800">
          <button
            onClick={openNewChatModal}
            className="w-full bg-blue-600 rounded-xl py-3 font-medium"
          >
            + 새 채팅
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {rooms.map((room) => (
            <div
              key={room.id}
              className={`group flex items-center border-b border-zinc-900 hover:bg-zinc-900 transition ${
                room.id === roomId ? "bg-zinc-900" : ""
              }`}
            >
              <button
                onClick={async () => {
                  await loadRoom(room.id);
                  setSidebarOpen(false);
                }}
                className="flex-1 text-left px-4 py-3 min-w-0"
              >
                <div className="truncate text-sm">
                  {room.title || "새 채팅"}
                </div>
              </button>

              <button
                onClick={() => deleteRoom(room.id)}
                className="px-3 text-zinc-500 hover:text-red-400"
                title="삭제"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-zinc-800 space-y-2">
          <a
            href="/characters"
            className="block w-full bg-zinc-800 text-center rounded-xl py-3 text-sm"
          >
            캐릭터 설정
          </a>

          <a
            href="/personas"
            className="block w-full bg-zinc-800 text-center rounded-xl py-3 text-sm"
          >
            페르소나 설정
          </a>

          <button
            onClick={logout}
            className="w-full bg-zinc-900 text-zinc-300 rounded-xl py-3 text-sm"
          >
            로그아웃
          </button>

          <p className="text-xs text-zinc-500 truncate">{profile?.email}</p>
        </div>
      </div>

      {sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 z-20 md:hidden"
          aria-label="사이드바 닫기"
        />
      )}

      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-zinc-800 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden bg-zinc-800 px-3 py-2 rounded-xl"
          >
            ☰
          </button>

          <div className="min-w-0">
            <h1 className="font-bold text-lg truncate">
              {selectedCharacter?.name || "AI 채팅"}
            </h1>

            <p className="text-sm text-zinc-400 truncate">
              {selectedPersona?.name
                ? `페르소나: ${selectedPersona.name}`
                : "새 채팅을 시작해 주세요."}
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-zinc-500 text-sm text-center mt-20">
              새 채팅을 눌러 페르소나와 캐릭터를 선택하세요.
            </div>
          )}

          {messages.map((msg, index) => (
            <div
              key={index}
              className={`max-w-[80%] whitespace-pre-wrap p-3 rounded-2xl ${
                msg.role === "user" ? "bg-blue-600 ml-auto" : "bg-zinc-800"
              }`}
            >
              {msg.content}
            </div>
          ))}

          {loading && (
            <div className="bg-zinc-800 p-3 rounded-2xl max-w-[80%] text-zinc-400">
              입력 중...
            </div>
          )}
        </div>

        <div className="p-4 border-t border-zinc-800 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              roomId ? "메시지를 입력하세요..." : "새 채팅을 먼저 시작하세요"
            }
            disabled={!roomId || loading}
            className="flex-1 bg-zinc-900 rounded-xl px-4 py-3 outline-none disabled:text-zinc-500"
            onKeyDown={(e) => {
              if (e.key === "Enter") sendMessage();
            }}
          />

          <button
            onClick={sendMessage}
            disabled={!roomId || loading}
            className="bg-blue-600 px-5 rounded-xl disabled:bg-zinc-700"
          >
            전송
          </button>
        </div>
      </div>

      {newChatModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-5 space-y-5">
            <div>
              <h2 className="text-xl font-bold">새 채팅 시작</h2>
              <p className="text-sm text-zinc-400 mt-1">
                사용할 페르소나와 캐릭터를 선택하세요.
              </p>
            </div>

            <label className="block space-y-2">
              <span className="text-sm text-zinc-300">페르소나</span>
              <select
                value={newPersonaId}
                onChange={(e) => setNewPersonaId(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 outline-none"
              >
                {personas.map((persona) => (
                  <option key={persona.id} value={persona.id}>
                    {persona.name}
                    {persona.is_default ? " (기본)" : ""}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm text-zinc-300">캐릭터</span>
              <select
                value={newCharacterId}
                onChange={(e) => setNewCharacterId(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 outline-none"
              >
                {characters.map((character) => (
                  <option key={character.id} value={character.id}>
                    {character.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex gap-3">
              <button
                onClick={createRoomWithSelection}
                className="flex-1 bg-blue-600 rounded-xl py-3 font-medium"
              >
                시작하기
              </button>

              <button
                onClick={() => setNewChatModalOpen(false)}
                className="flex-1 bg-zinc-800 rounded-xl py-3 font-medium"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}