export type AiProviderName = "groq" | "nvidia" | "openai";

export type AiChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type CreateChatCompletionParams = {
  messages: AiChatMessage[];
  provider?: AiProviderName;
  model?: string;
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

function normalizeProvider(provider?: string): AiProviderName {
  if (provider === "nvidia") return "nvidia";
  if (provider === "openai") return "openai";
  return "groq";
}

export function getProviderConfig(
  providerOverride?: AiProviderName,
  modelOverride?: string
): ProviderConfig {
  const provider = providerOverride || normalizeProvider(getEnv("AI_PROVIDER", "groq"));

  if (provider === "nvidia") {
    return {
      name: "nvidia",
      baseUrl: getEnv("NVIDIA_BASE_URL", "https://integrate.api.nvidia.com/v1"),
      apiKey: getEnv("NVIDIA_API_KEY"),
      model: modelOverride || getEnv("NVIDIA_MODEL", "z-ai/glm-5.2"),
    };
  }

  if (provider === "openai") {
    return {
      name: "openai",
      baseUrl: getEnv("OPENAI_BASE_URL", "https://api.openai.com/v1"),
      apiKey: getEnv("OPENAI_API_KEY"),
      model: modelOverride || getEnv("OPENAI_MODEL", "gpt-4o-mini"),
    };
  }

  return {
    name: "groq",
    baseUrl: getEnv("GROQ_BASE_URL", "https://api.groq.com/openai/v1"),
    apiKey: getEnv("GROQ_API_KEY"),
    model: modelOverride || getEnv("GROQ_MODEL", getEnv("AI_MODEL", "llama-3.1-8b-instant")),
  };
}

export async function createChatCompletion({
  messages,
  provider,
  model,
  temperature = 0.65,
  maxTokens = 700,
}: CreateChatCompletionParams) {
  const config = getProviderConfig(provider, model);

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
    console.error("AI Provider Error:", {
        provider: config.name,
        baseUrl: config.baseUrl,
        model: config.model,
        status: response.status,
        data,
    });

    throw new Error(
        data?.error?.message ||
        data?.error ||
        data?.message ||
        `${config.name} API 호출 실패: ${response.status}`
    );
    }

  return {
    provider: config.name,
    model: config.model,
    message: data.choices?.[0]?.message?.content || "응답 생성 실패",
    raw: data,
  };
}