"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

const MODEL_OPTIONS = {
  nvidia: [
    { label: "GLM 5.2", value: "z-ai/glm-5.2" },
  ],
  groq: [
    { label: "Llama 3.1 8B Instant", value: "llama-3.1-8b-instant" },
    { label: "Llama 3.3 70B Versatile", value: "llama-3.3-70b-versatile" },
  ],
  openai: [
    { label: "GPT-4o mini", value: "gpt-4o-mini" },
    { label: "GPT-4o", value: "gpt-4o" },
  ],
};

type Provider = "nvidia" | "groq" | "openai";

export default function AiSettingsPage() {
  const [provider, setProvider] = useState<Provider>("nvidia");
  const [model, setModel] = useState("z-ai/glm-5.2");
  const [temperature, setTemperature] = useState("0.65");
  const [maxTokens, setMaxTokens] = useState("700");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      window.location.href = "/login";
      return;
    }

    const { data } = await supabase
      .from("ai_settings")
      .select("*")
      .eq("user_id", userData.user.id)
      .single();

    if (data) {
      setProvider(data.provider || "nvidia");
      setModel(data.model || "z-ai/glm-5.2");
      setTemperature(String(data.temperature ?? "0.65"));
      setMaxTokens(String(data.max_tokens ?? "700"));
    }

    setLoading(false);
  }

  function changeProvider(nextProvider: Provider) {
    setProvider(nextProvider);
    setModel(MODEL_OPTIONS[nextProvider][0].value);
  }

  async function saveSettings() {
    setSaving(true);

    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      window.location.href = "/login";
      return;
    }

    const payload = {
      user_id: userData.user.id,
      provider,
      model,
      temperature: Number(temperature || 0.65),
      max_tokens: Number(maxTokens || 700),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("ai_settings")
      .upsert(payload, { onConflict: "user_id" });

    setSaving(false);

    if (error) {
      console.error(error);
      alert("AI 설정 저장 중 오류가 발생했습니다.");
      return;
    }

    alert("AI 설정이 저장되었습니다.");
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
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">AI 설정</h1>
          <p className="text-sm text-zinc-400 mt-1">
            사용할 AI Provider와 모델을 선택합니다.
          </p>
        </div>

        <div className="border border-zinc-800 bg-zinc-950 rounded-2xl p-5 space-y-5">
          <label className="block space-y-2">
            <span className="text-sm text-zinc-300">Provider</span>
            <select
              value={provider}
              onChange={(e) => changeProvider(e.target.value as Provider)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 outline-none"
            >
              <option value="nvidia">NVIDIA NIM</option>
              <option value="groq">Groq</option>
              <option value="openai">OpenAI</option>
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-sm text-zinc-300">Model</span>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 outline-none"
            >
              {MODEL_OPTIONS[provider].map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-sm text-zinc-300">Temperature</span>
            <input
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 outline-none"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm text-zinc-300">Max Tokens</span>
            <input
              value={maxTokens}
              onChange={(e) => setMaxTokens(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 outline-none"
            />
          </label>

          <div className="flex gap-3">
            <button
              onClick={saveSettings}
              disabled={saving}
              className="bg-blue-600 px-5 py-3 rounded-xl disabled:bg-zinc-700"
            >
              {saving ? "저장 중..." : "저장"}
            </button>

            <a href="/chat" className="bg-zinc-800 px-5 py-3 rounded-xl">
              채팅으로 돌아가기
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}