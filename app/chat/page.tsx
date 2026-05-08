"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type CharacterSetting = {
  name: string;
  description: string;
  personality: string;
  speakingStyle: string;
  worldview: string;
  relationship: string;
  rules: string;
  firstMessage: string;
};

type ChatRoom = {
  id: string;
  title: string;
  updated_at: string;
};

type Profile = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  is_active: boolean;
};

export default function ChatPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [character, setCharacter] = useState<CharacterSetting | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

      const savedCharacter = localStorage.getItem("character_setting");
      if (savedCharacter) {
        setCharacter(JSON.parse(savedCharacter));
      }

      await loadRooms(user.id);

      let savedRoomId = localStorage.getItem(`current_room_id_${user.id}`);

      if (!savedRoomId) {
        savedRoomId = await createNewRoom(user.id);
      }

      if (savedRoomId) {
        await loadRoom(savedRoomId);
      }
    } finally {
      setInitializing(false);
    }
  }

  async function loadRooms(userId?: string) {
    const targetUserId = userId || profile?.id;
    if (!targetUserId) return;

    const { data, error } = await supabase
      .from("chat_rooms")
      .select("id, title, updated_at")
      .eq("user_id", targetUserId)
      .order("updated_at", { ascending: false });

    if (!error && data) {
      setRooms(data);
    }
  }

  async function createNewRoom(userId?: string) {
    const targetUserId = userId || profile?.id;
    if (!targetUserId) return null;

    const { data, error } = await supabase
      .from("chat_rooms")
      .insert({
        title: "새 채팅",
        user_id: targetUserId,
      })
      .select("id")
      .single();

    if (error || !data) {
      console.error(error);
      return null;
    }

    localStorage.setItem(`current_room_id_${targetUserId}`, data.id);
    await loadRooms(targetUserId);

    return data.id;
  }

  async function loadRoom(selectedRoomId: string) {
    setRoomId(selectedRoomId);

    if (profile?.id) {
      localStorage.setItem(`current_room_id_${profile.id}`, selectedRoomId);
    }

    const { data, error } = await supabase
      .from("chat_messages")
      .select("role, content")
      .eq("room_id", selectedRoomId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error(error);
      return;
    }

    if (data) {
      setMessages(data as ChatMessage[]);
    }
  }

  async function startNewChat() {
    if (!profile) return;

    const newRoomId = await createNewRoom(profile.id);
    if (!newRoomId) return;

    setRoomId(newRoomId);

    if (character?.firstMessage) {
      const firstMessage: ChatMessage = {
        role: "assistant",
        content: character.firstMessage,
      };

      setMessages([firstMessage]);

      await supabase.from("chat_messages").insert({
        room_id: newRoomId,
        user_id: profile.id,
        role: firstMessage.role,
        content: firstMessage.content,
      });
    } else {
      setMessages([]);
    }

    await loadRooms(profile.id);
    setSidebarOpen(false);
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
      console.error("채팅방 삭제 오류:", error);
      alert("삭제 중 오류가 발생했습니다.");
      return;
    }

    if (deleteRoomId === roomId) {
      localStorage.removeItem(`current_room_id_${profile.id}`);
      setMessages([]);

      const remainingRooms = rooms.filter((room) => room.id !== deleteRoomId);

      if (remainingRooms.length > 0) {
        await loadRoom(remainingRooms[0].id);
      } else {
        const newRoomId = await createNewRoom(profile.id);
        if (newRoomId) {
          setRoomId(newRoomId);
        }
      }
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

    setMessages(updatedMessages);

    const currentInput = input;

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
          character,
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
            onClick={startNewChat}
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

          <button
            onClick={logout}
            className="w-full bg-zinc-900 text-zinc-300 rounded-xl py-3 text-sm"
          >
            로그아웃
          </button>

          <p className="text-xs text-zinc-500 truncate">
            {profile?.email}
          </p>
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
              {character?.name || "AI 채팅"}
            </h1>

            <p className="text-sm text-zinc-400 truncate">
              {character?.description || "캐릭터 설명"}
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`max-w-[80%] whitespace-pre-wrap p-3 rounded-2xl ${
                msg.role === "user"
                  ? "bg-blue-600 ml-auto"
                  : "bg-zinc-800"
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
            placeholder="메시지를 입력하세요..."
            className="flex-1 bg-zinc-900 rounded-xl px-4 py-3 outline-none"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                sendMessage();
              }
            }}
          />

          <button onClick={sendMessage} className="bg-blue-600 px-5 rounded-xl">
            전송
          </button>
        </div>
      </div>
    </div>
  );
}