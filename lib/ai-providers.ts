export type AiProviderName = "groq" | "nvidia" | "openai";

export type AiChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type CreateChatCompletionParams = {
  messages: AiChatMessage[];
  temperature?: number;
  maxTokens?: number;
};

type ProviderConfig = {
  name: AiProviderName;
  baseUrl: string;
  apiKey: string;
  model: string;
};

function getEnv(name: string, fallback = "") {
  return process.env[name] || fallback;
}

export function getActiveProviderName(): AiProviderName {
  const provider = getEnv("AI_PROVIDER", "groq").toLowerCase();

  if (provider === "nvidia") return "nvidia";
  if (provider === "openai") return "openai";
  return "groq";
}

export function getProviderConfig(): ProviderConfig {
  const provider = getActiveProviderName();

  if (provider === "nvidia") {
    return {
      name: "nvidia",
      baseUrl: getEnv("NVIDIA_BASE_URL", "https://integrate.api.nvidia.com/v1"),
      apiKey: getEnv("NVIDIA_API_KEY"),
      model: getEnv("NVIDIA_MODEL", "z-ai/glm-5.2"),
    };
  }

  if (provider === "openai") {
    return {
      name: "openai",
      baseUrl: getEnv("OPENAI_BASE_URL", "https://api.openai.com/v1"),
      apiKey: getEnv("OPENAI_API_KEY"),
      model: getEnv("OPENAI_MODEL", "gpt-4o-mini"),
    };
  }

  return {
    name: "groq",
    baseUrl: getEnv("GROQ_BASE_URL", "https://api.groq.com/openai/v1"),
    apiKey: getEnv("GROQ_API_KEY"),
    model: getEnv("GROQ_MODEL", getEnv("AI_MODEL", "llama-3.1-8b-instant")),
  };
}

export async function createChatCompletion({
  messages,
  temperature = 0.65,
  maxTokens = 700,
}: CreateChatCompletionParams) {
  const config = getProviderConfig();

  if (!config.apiKey) {
    throw new Error(`${config.name} API key가 설정되지 않았습니다.`);
  }

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error?.message ||
        data?.message ||
        `${config.name} API 호출 중 오류가 발생했습니다.`
    );
  }

  return {
    provider: config.name,
    model: config.model,
    message: data.choices?.[0]?.message?.content || "응답 생성 실패",
    raw: data,
  };
}