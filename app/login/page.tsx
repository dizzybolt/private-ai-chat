"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function login() {
    setMessage("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage("로그인 실패: 이메일 또는 비밀번호를 확인하세요.");
      return;
    }

    const user = data.user;

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("is_active")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.is_active) {
      await supabase.auth.signOut();
      setMessage("허용되지 않은 사용자입니다.");
      return;
    }

    window.location.href = "/chat";
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-4">
        <div>
          <h1 className="text-2xl font-bold">AI 채팅 로그인</h1>
          <p className="text-sm text-zinc-400 mt-2">
            허용된 사용자만 접속할 수 있습니다.
          </p>
        </div>

        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="이메일"
          className="w-full bg-zinc-900 rounded-xl px-4 py-3 outline-none"
        />

        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호"
          type="password"
          className="w-full bg-zinc-900 rounded-xl px-4 py-3 outline-none"
          onKeyDown={(e) => {
            if (e.key === "Enter") login();
          }}
        />

        <button
          onClick={login}
          className="w-full bg-blue-600 rounded-xl py-3 font-medium"
        >
          로그인
        </button>

        {message && <p className="text-sm text-red-400">{message}</p>}
      </div>
    </div>
  );
}