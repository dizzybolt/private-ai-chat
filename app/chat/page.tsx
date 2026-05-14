"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  speaker_name?: string | null;
  message_type?: "chat" | "narration" | "system" | null;
};

type ChatRoom = {
  id: string;
  title: string;
  updated_at: string;
  persona_id: string | null;
  character_id: string | null;
  worldview_id: string | null;
  lorebook_id: string | null;
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

type Worldview = {
  id: string;
  title: string;
  description: string | null;
  setting: string | null;
  rules: string | null;
};

type Lorebook = {
  id: string;
  title: string;
  description: string | null;
  worldview_id: string | null;
};

type LoreEntry = {
  id: string;
  title: string;
  keywords: string | null;
  content: string;
  always_enabled: boolean;
  priority: number;
};

export default function ChatPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [worldviews, setWorldviews] = useState<Worldview[]>([]);
  const [lorebooks, setLorebooks] = useState<Lorebook[]>([]);

  const [selectedCharacters, setSelectedCharacters] = useState<Character[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [selectedWorldview, setSelectedWorldview] =
    useState<Worldview | null>(null);
  const [selectedLorebook, setSelectedLorebook] = useState<Lorebook | null>(
    null
  );

  const [newCharacterIds, setNewCharacterIds] = useState<string[]>([]);
  const [newPersonaId, setNewPersonaId] = useState("");
  const [newWorldviewId, setNewWorldviewId] = useState("");
  const [newLorebookId, setNewLorebookId] = useState("");

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

      const loadedCharacters = await loadCharacters(user.id);
      const loadedPersonas = await loadPersonas(user.id);
      const loadedWorldviews = await loadWorldviews(user.id);
      const loadedLorebooks = await loadLorebooks(user.id);

      await loadRooms(user.id);

      const savedRoomId = localStorage.getItem(`current_room_id_${user.id}`);

      if (savedRoomId) {
        await loadRoom(savedRoomId, {
          characters: loadedCharacters,
          personas: loadedPersonas,
          worldviews: loadedWorldviews,
          lorebooks: loadedLorebooks,
        });
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

    const result = (data || []) as Character[];
    setCharacters(result);
    return result;
  }

  async function loadPersonas(userId: string) {
    const { data } = await supabase
      .from("user_personas")
      .select("*")
      .eq("user_id", userId)
      .order("is_default", { ascending: false })
      .order("updated_at", { ascending: false });

    const result = (data || []) as Persona[];
    setPersonas(result);
    return result;
  }

  async function loadWorldviews(userId: string) {
    const { data } = await supabase
      .from("worldviews")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    const result = (data || []) as Worldview[];
    setWorldviews(result);
    return result;
  }

  async function loadLorebooks(userId: string) {
    const { data } = await supabase
      .from("lorebooks")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    const result = (data || []) as Lorebook[];
    setLorebooks(result);
    return result;
  }

  async function loadRooms(userId?: string) {
    const targetUserId = userId || profile?.id;
    if (!targetUserId) return;

    const { data } = await supabase
      .from("chat_rooms")
      .select(
        "id, title, updated_at, persona_id, character_id, worldview_id, lorebook_id"
      )
      .eq("user_id", targetUserId)
      .order("updated_at", { ascending: false });

    setRooms((data || []) as ChatRoom[]);
  }

  async function loadRoom(
    selectedRoomId: string,
    lists?: {
      characters: Character[];
      personas: Persona[];
      worldviews: Worldview[];
      lorebooks: Lorebook[];
    }
  ) {
    setRoomId(selectedRoomId);

    if (profile?.id) {
      localStorage.setItem(`current_room_id_${profile.id}`, selectedRoomId);
    }

    const { data: roomData, error: roomError } = await supabase
      .from("chat_rooms")
      .select("id, persona_id, character_id, worldview_id, lorebook_id")
      .eq("id", selectedRoomId)
      .single();

    if (roomError || !roomData) {
      console.error(roomError);
      return;
    }

    const characterList = lists?.characters || characters;
    const personaList = lists?.personas || personas;
    const worldviewList = lists?.worldviews || worldviews;
    const lorebookList = lists?.lorebooks || lorebooks;

    const { data: roomCharacters } = await supabase
      .from("chat_room_characters")
      .select("character_id")
      .eq("room_id", selectedRoomId);

    const roomCharacterIds = (roomCharacters || []).map(
      (item) => item.character_id
    );

    const selectedRoomCharacters =
      roomCharacterIds.length > 0
        ? characterList.filter((item) => roomCharacterIds.includes(item.id))
        : characterList.filter((item) => item.id === roomData.character_id);

    setSelectedCharacters(selectedRoomCharacters);

    setSelectedPersona(
      personaList.find((item) => item.id === roomData.persona_id) || null
    );

    setSelectedWorldview(
      worldviewList.find((item) => item.id === roomData.worldview_id) || null
    );

    setSelectedLorebook(
      lorebookList.find((item) => item.id === roomData.lorebook_id) || null
    );

    const { data: messageData, error: messageError } = await supabase
      .from("chat_messages")
      .select("role, content, speaker_name, message_type")
      .eq("room_id", selectedRoomId)
      .order("created_at", { ascending: true });

    if (messageError) {
      console.error(messageError);
      return;
    }

    setMessages((messageData || []) as ChatMessage[]);
  }

  function getCharacterNames(list: Character[]) {
    if (list.length === 0) return "AI 채팅";
    return list.map((character) => character.name).join(", ");
  }

  function toggleNewCharacter(characterId: string) {
    setNewCharacterIds((prev) => {
      if (prev.includes(characterId)) {
        return prev.filter((id) => id !== characterId);
      }

      return [...prev, characterId];
    });
  }

  function getLorebooksByWorldview(worldviewId: string) {
    return lorebooks.filter((lorebook) => lorebook.worldview_id === worldviewId);
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

    if (worldviews.length === 0) {
      alert("먼저 세계관을 만들어주세요.");
      window.location.href = "/worldviews";
      return;
    }

    const defaultPersona =
      personas.find((persona) => persona.is_default) || personas[0];

    const firstWorldview = worldviews[0];
    const matchedLorebooks = getLorebooksByWorldview(firstWorldview.id);

    setNewPersonaId(defaultPersona.id);
    setNewCharacterIds([characters[0].id]);
    setNewWorldviewId(firstWorldview.id);
    setNewLorebookId(matchedLorebooks[0]?.id || "");
    setNewChatModalOpen(true);
  }

  function handleWorldviewChange(worldviewId: string) {
    setNewWorldviewId(worldviewId);

    const matchedLorebooks = getLorebooksByWorldview(worldviewId);
    setNewLorebookId(matchedLorebooks[0]?.id || "");
  }

  async function createRoomWithSelection() {
    if (
      !profile ||
      !newPersonaId ||
      newCharacterIds.length === 0 ||
      !newWorldviewId
    ) {
      alert("페르소나, 캐릭터, 세계관을 모두 선택해주세요.");
      return;
    }

    const selectedCharacterList = characters.filter((item) =>
      newCharacterIds.includes(item.id)
    );

    const mainCharacter = selectedCharacterList[0] || null;
    const persona = personas.find((item) => item.id === newPersonaId) || null;
    const worldview =
      worldviews.find((item) => item.id === newWorldviewId) || null;
    const lorebook =
      lorebooks.find((item) => item.id === newLorebookId) || null;

    const { data, error } = await supabase
      .from("chat_rooms")
      .insert({
        user_id: profile.id,
        persona_id: newPersonaId,
        character_id: mainCharacter?.id || null,
        worldview_id: newWorldviewId,
        lorebook_id: newLorebookId || null,
        title:
          selectedCharacterList.length > 0
            ? `${getCharacterNames(selectedCharacterList)}와의 대화`
            : "새 채팅",
      })
      .select("id")
      .single();

    if (error || !data) {
      console.error(error);
      alert("새 채팅 생성 중 오류가 발생했습니다.");
      return;
    }

    await supabase.from("chat_room_characters").insert(
      selectedCharacterList.map((character) => ({
        room_id: data.id,
        character_id: character.id,
      }))
    );

    localStorage.setItem(`current_room_id_${profile.id}`, data.id);

    setRoomId(data.id);
    setSelectedCharacters(selectedCharacterList);
    setSelectedPersona(persona);
    setSelectedWorldview(worldview);
    setSelectedLorebook(lorebook);
    setNewChatModalOpen(false);
    setSidebarOpen(false);

    const narrationContent = `${persona?.name || "사용자"}와 ${getCharacterNames(
      selectedCharacterList
    )}의 대화가 시작되었다. 배경은 ${
      worldview?.title || "알 수 없는 세계"
    }이다.`;

    const firstMessages: ChatMessage[] = [
      {
        role: "assistant",
        content: narrationContent,
        speaker_name: "내레이션",
        message_type: "narration",
      },
    ];

    for (const character of selectedCharacterList) {
      if (character.first_message) {
        firstMessages.push({
          role: "assistant",
          content: character.first_message,
          speaker_name: character.name,
          message_type: "chat",
        });
      }
    }

    setMessages(firstMessages);

    await supabase.from("chat_messages").insert(
      firstMessages.map((message) => ({
        room_id: data.id,
        user_id: profile.id,
        role: message.role,
        speaker_name: message.speaker_name,
        message_type: message.message_type,
        content: message.content,
      }))
    );

    await loadRooms(profile.id);
  }

  async function getRelevantLoreEntries(updatedMessages: ChatMessage[]) {
    if (!selectedLorebook) return [];

    const { data, error } = await supabase
      .from("lore_entries")
      .select("id, title, keywords, content, always_enabled, priority")
      .eq("lorebook_id", selectedLorebook.id)
      .order("priority", { ascending: false });

    if (error) {
      console.error("로어 항목 조회 오류:", error);
      return [];
    }

    const entries = (data || []) as LoreEntry[];

    const recentText = updatedMessages
      .slice(-8)
      .map((message) => message.content)
      .join("\n")
      .toLowerCase();

    const matched = entries.filter((entry) => {
      if (entry.always_enabled) return true;

      if (!entry.keywords) return false;

      const keywords = entry.keywords
        .split(/[,，\n]/)
        .map((keyword) => keyword.trim().toLowerCase())
        .filter(Boolean);

      return keywords.some((keyword) => recentText.includes(keyword));
    });

    return matched.slice(0, 8);
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
      setSelectedCharacters([]);
      setSelectedPersona(null);
      setSelectedWorldview(null);
      setSelectedLorebook(null);
    }

    await loadRooms(profile.id);
  }

  async function sendMessage() {
    if (!input.trim() || loading || !roomId || !profile) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: input,
      speaker_name: selectedPersona?.name || "나",
      message_type: "chat",
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
      speaker_name: userMessage.speaker_name,
      message_type: userMessage.message_type,
      content: userMessage.content,
    });

    try {
      const relevantLoreEntries = await getRelevantLoreEntries(updatedMessages);

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: updatedMessages,
          characters: selectedCharacters,
          persona: selectedPersona,
          worldview: selectedWorldview,
          loreEntries: relevantLoreEntries,
        }),
      });

      const data = await response.json();

      const aiMessages = parseAiCharacterResponse(
  data.message || "응답 생성 실패",
  selectedCharacters
);

setMessages((prev) => [...prev, ...aiMessages]);

await supabase.from("chat_messages").insert(
  aiMessages.map((message) => ({
    room_id: roomId,
    user_id: profile.id,
    role: message.role,
    speaker_name: message.speaker_name,
    message_type: message.message_type,
    content: message.content,
  }))
);

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

  async function regenerateLastAnswer() {
    if (!roomId || !profile || loading) return;

    const lastMessage = messages[messages.length - 1];

    if (!lastMessage || lastMessage.role !== "assistant") {
      alert("재생성할 AI 답변이 없습니다.");
      return;
    }

    const messagesWithoutLastAi = messages.slice(0, -1);

    setMessages(messagesWithoutLastAi);
    setLoading(true);

    try {
      const relevantLoreEntries = await getRelevantLoreEntries(
        messagesWithoutLastAi
      );

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: messagesWithoutLastAi,
          characters: selectedCharacters,
          persona: selectedPersona,
          worldview: selectedWorldview,
          loreEntries: relevantLoreEntries,
        }),
      });

      const data = await response.json();

const newAiMessages = parseAiCharacterResponse(
  data.message || "응답 생성 실패",
  selectedCharacters
);

setMessages((prev) => [...prev, ...newAiMessages]);

      await supabase
        .from("chat_messages")
        .delete()
        .eq("room_id", roomId)
        .eq("role", "assistant")
        .eq("content", lastMessage.content);

await supabase.from("chat_messages").insert(
  newAiMessages.map((message) => ({
    room_id: roomId,
    user_id: profile.id,
    role: message.role,
    speaker_name: message.speaker_name,
    message_type: message.message_type,
    content: message.content,
  }))
);

      await supabase
        .from("chat_rooms")
        .update({
          updated_at: new Date().toISOString(),
        })
        .eq("id", roomId);

      await loadRooms(profile.id);
    } catch (error) {
      console.error(error);
      alert("재생성 중 오류가 발생했습니다.");
      setMessages(messages);
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

  const modalLorebooks = newWorldviewId
    ? getLorebooksByWorldview(newWorldviewId)
    : [];

  return (
    <div className="h-screen w-screen max-w-screen overflow-hidden bg-black text-white flex relative">
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

          <a
            href="/worldviews"
            className="block w-full bg-zinc-800 text-center rounded-xl py-3 text-sm"
          >
            세계관 설정
          </a>

          <a
            href="/lorebooks"
            className="block w-full bg-zinc-800 text-center rounded-xl py-3 text-sm"
          >
            로어북 설정
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

      <div className="flex-1 min-w-0 flex flex-col">
        <div className="p-4 border-b border-zinc-800 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden bg-zinc-800 px-3 py-2 rounded-xl"
          >
            ☰
          </button>

          <div className="min-w-0">
            <h1 className="font-bold text-lg truncate">
              {getCharacterNames(selectedCharacters)}
            </h1>

            <p className="text-sm text-zinc-400 truncate">
              {selectedPersona?.name || selectedWorldview?.title
                ? `페르소나: ${selectedPersona?.name || "-"} / 세계관: ${
                    selectedWorldview?.title || "-"
                  } / 로어북: ${selectedLorebook?.title || "없음"}`
                : "새 채팅을 시작해 주세요."}
            </p>
          </div>
        </div>

        <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-zinc-500 text-sm text-center mt-20">
              새 채팅을 눌러 페르소나, 캐릭터, 세계관, 로어북을 선택하세요.
            </div>
          )}

          {messages.map((msg, index) => {
            const isNarration = msg.message_type === "narration";
            const isUser = msg.role === "user";

            if (isNarration) {
              return (
                <div key={index} className="flex justify-center">
                  <div className="max-w-[92%] bg-zinc-950 border border-zinc-800 text-zinc-400 text-sm px-4 py-3 rounded-2xl whitespace-pre-wrap break-words leading-relaxed">
                    <div className="text-xs text-zinc-500 text-center mb-1">
                      내레이션
                    </div>
                    {msg.content}
                  </div>
                </div>
              );
            }

            return (
              <div
                key={index}
                className={`flex flex-col max-w-[78%] min-w-0 ${
                  isUser ? "ml-auto items-end" : "mr-auto items-start"
                }`}
              >
                <div
                  className={`text-xs mb-1 px-1 ${
                    isUser ? "text-blue-300 text-right" : "text-zinc-400"
                  }`}
                >
                  {msg.speaker_name ||
                    (isUser ? "나" : getCharacterNames(selectedCharacters))}
                </div>

                <div
                  className={`whitespace-pre-wrap break-words p-3 rounded-2xl leading-relaxed ${
                    isUser
                      ? "bg-blue-600 text-white rounded-br-md"
                      : "bg-zinc-800 text-white rounded-bl-md"
                  }`}
                >
                  {renderRoleplayContent(msg.content)}
                </div>

                {!isUser &&
                  msg.message_type !== "narration" &&
                  index === messages.length - 1 && (
                    <button
                      onClick={regenerateLastAnswer}
                      disabled={loading}
                      className="mt-2 text-xs text-zinc-500 hover:text-zinc-300 disabled:text-zinc-700"
                    >
                      ↻ 재생성
                    </button>
                  )}
              </div>
            );
          })}

          {loading && (
            <div className="bg-zinc-800 p-3 rounded-2xl max-w-[80%] text-zinc-400">
              입력 중...
            </div>
          )}
        </div>

        <div className="p-3 sm:p-4 border-t border-zinc-800 flex gap-2 w-full max-w-full">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              roomId ? "메시지를 입력하세요..." : "새 채팅을 먼저 시작하세요"
            }
            disabled={!roomId || loading}
            className="flex-1 min-w-0 bg-zinc-900 rounded-xl px-4 py-3 outline-none disabled:text-zinc-500"
            onKeyDown={(e) => {
              if (e.key === "Enter") sendMessage();
            }}
          />

          <button
            onClick={sendMessage}
            disabled={!roomId || loading}
            className="shrink-0 bg-blue-600 px-4 sm:px-5 rounded-xl disabled:bg-zinc-700"
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
                사용할 페르소나, 캐릭터, 세계관, 로어북을 선택하세요.
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

              <div className="max-h-48 overflow-y-auto space-y-2 bg-zinc-900 border border-zinc-800 rounded-xl p-3">
                {characters.map((character) => (
                  <label
                    key={character.id}
                    className="flex items-center gap-3 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={newCharacterIds.includes(character.id)}
                      onChange={() => toggleNewCharacter(character.id)}
                    />

                    <span>{character.name}</span>
                  </label>
                ))}
              </div>

              <p className="text-xs text-zinc-500">
                최소 1명 이상 선택하세요. 너무 많이 선택하면 답변이 산만해질 수 있습니다.
              </p>
            </label>

            <label className="block space-y-2">
              <span className="text-sm text-zinc-300">세계관</span>
              <select
                value={newWorldviewId}
                onChange={(e) => handleWorldviewChange(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 outline-none"
              >
                {worldviews.map((worldview) => (
                  <option key={worldview.id} value={worldview.id}>
                    {worldview.title}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm text-zinc-300">로어북</span>
              <select
                value={newLorebookId}
                onChange={(e) => setNewLorebookId(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 outline-none"
              >
                <option value="">로어북 없음</option>

                {modalLorebooks.map((lorebook) => (
                  <option key={lorebook.id} value={lorebook.id}>
                    {lorebook.title}
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

function parseAiCharacterResponse(
  content: string,
  selectedCharacters: Character[]
): ChatMessage[] {
  if (selectedCharacters.length <= 1) {
    return [
      {
        role: "assistant",
        content,
        speaker_name: selectedCharacters[0]?.name || "AI",
        message_type: "chat",
      },
    ];
  }

  const characterNames = selectedCharacters.map((c) => c.name);

  const lines = content.split("\n");
  const result: ChatMessage[] = [];

  let currentSpeaker = "";
  let currentContent: string[] = [];

  function flush() {
    if (!currentSpeaker && currentContent.length === 0) return;

    result.push({
      role: "assistant",
      speaker_name: currentSpeaker || "캐릭터들",
      message_type: "chat",
      content: currentContent.join("\n").trim(),
    });

    currentSpeaker = "";
    currentContent = [];
  }

  for (const line of lines) {
    const trimmed = line.trim();

    const matchedName = characterNames.find(
      (name) => trimmed === `${name}:` || trimmed.startsWith(`${name}:`)
    );

    if (matchedName) {
      flush();

      currentSpeaker = matchedName;

      const rest = trimmed.replace(`${matchedName}:`, "").trim();

      if (rest) {
        currentContent.push(rest);
      }
    } else {
      currentContent.push(line);
    }
  }

  flush();

  if (result.length === 0) {
    return [
      {
        role: "assistant",
        content,
        speaker_name: "캐릭터들",
        message_type: "chat",
      },
    ];
  }

  return result;
}

function renderRoleplayContent(content: string) {
  const parts = content.split(/(\*[^*]+\*|\([^()]+\)|"[^"]+")/g);

  return (
    <div className="space-y-1">
      {parts.map((part, index) => {
        if (!part) return null;

        if (part.startsWith("*") && part.endsWith("*")) {
          return (
            <div
              key={index}
              className="text-zinc-400 italic text-sm leading-relaxed"
            >
              {part.slice(1, -1)}
            </div>
          );
        }

        if (part.startsWith("(") && part.endsWith(")")) {
          return (
            <div key={index} className="text-zinc-500 text-sm leading-relaxed">
              ({part.slice(1, -1)})
            </div>
          );
        }

        if (part.startsWith('"') && part.endsWith('"')) {
          return (
            <div key={index} className="text-white leading-relaxed">
              {part.slice(1, -1)}
            </div>
          );
        }

        return (
          <div key={index} className="text-white leading-relaxed">
            {part}
          </div>
        );
      })}
    </div>
  );
}