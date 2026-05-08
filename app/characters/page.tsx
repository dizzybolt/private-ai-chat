"use client";

import { useEffect, useState } from "react";

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

const defaultCharacter: CharacterSetting = {
  name: "",
  description: "",
  personality: "",
  speakingStyle: "",
  worldview: "",
  relationship: "",
  rules: "",
  firstMessage: "",
};

export default function CharactersPage() {
  const [character, setCharacter] =
    useState<CharacterSetting>(defaultCharacter);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const savedCharacter = localStorage.getItem("character_setting");

    if (savedCharacter) {
      setCharacter(JSON.parse(savedCharacter));
    }
  }, []);

  function updateField(key: keyof CharacterSetting, value: string) {
    setCharacter((prev) => ({
      ...prev,
      [key]: value,
    }));

    setSaved(false);
  }

  function saveCharacter() {
    localStorage.setItem("character_setting", JSON.stringify(character));
    setSaved(true);
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">캐릭터 설정</h1>
          <p className="text-zinc-400 mt-2">
            채팅에 사용할 캐릭터와 세계관을 작성하세요.
          </p>
        </div>

        <div className="space-y-4">
          <InputBox
            label="캐릭터 이름"
            value={character.name}
            onChange={(value) => updateField("name", value)}
            placeholder="예: 리아"
          />

          <TextAreaBox
            label="캐릭터 설명"
            value={character.description}
            onChange={(value) => updateField("description", value)}
            placeholder="예: 밝고 다정하지만 가끔 장난기가 많은 캐릭터"
          />

          <TextAreaBox
            label="성격"
            value={character.personality}
            onChange={(value) => updateField("personality", value)}
            placeholder="예: 다정함, 질투가 있음, 감정 표현이 풍부함"
          />

          <TextAreaBox
            label="말투"
            value={character.speakingStyle}
            onChange={(value) => updateField("speakingStyle", value)}
            placeholder="예: 친한 친구처럼 반말, 부드럽고 자연스럽게"
          />

          <TextAreaBox
            label="세계관"
            value={character.worldview}
            onChange={(value) => updateField("worldview", value)}
            placeholder="예: 현대 도시 배경의 일상 세계관"
          />

          <TextAreaBox
            label="사용자와의 관계"
            value={character.relationship}
            onChange={(value) => updateField("relationship", value)}
            placeholder="예: 오래 알고 지낸 친구"
          />

          <TextAreaBox
            label="규칙 / 금지 설정"
            value={character.rules}
            onChange={(value) => updateField("rules", value)}
            placeholder="예: 세계관을 깨지 않는다. 설정과 다른 말투를 쓰지 않는다."
          />

          <TextAreaBox
            label="첫 메시지"
            value={character.firstMessage}
            onChange={(value) => updateField("firstMessage", value)}
            placeholder="예: 왔어? 오늘은 좀 늦었네."
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={saveCharacter}
            className="bg-blue-600 px-5 py-3 rounded-xl font-medium"
          >
            저장하기
          </button>

          <a
            href="/chat"
            className="bg-zinc-800 px-5 py-3 rounded-xl font-medium"
          >
            채팅으로 이동
          </a>
        </div>

        {saved && (
          <div className="text-green-400 text-sm">
            캐릭터 설정이 저장되었습니다.
          </div>
        )}
      </div>
    </div>
  );
}

function InputBox({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm text-zinc-300">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 outline-none"
      />
    </label>
  );
}

function TextAreaBox({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm text-zinc-300">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 outline-none resize-none"
      />
    </label>
  );
}