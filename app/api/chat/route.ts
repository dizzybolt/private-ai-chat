import {
  createChatCompletion,
  type AiChatMessage,
} from "../../../lib/ai-providers";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  speaker_name?: string | null;
  message_type?: "chat" | "narration" | "system" | null;
};

type CharacterSetting = {
  name?: string;
  description?: string;
  personality?: string;
  speaking_style?: string;
  relationship?: string;
  first_message?: string;
};

type PersonaSetting = {
  name?: string;
  description?: string;
  personality?: string;
  speaking_style?: string;
  appearance?: string;
  background?: string;
  relationship_style?: string;
  additional_settings?: string;
};

type WorldviewSetting = {
  title?: string;
  description?: string;
  setting?: string;
  rules?: string;
};

type LoreEntry = {
  title: string;
  keywords?: string | null;
  content: string;
  always_enabled?: boolean;
  priority?: number;
};

function buildLoreText(loreEntries?: LoreEntry[]) {
  if (!loreEntries || loreEntries.length === 0) {
    return "관련 로어 없음";
  }

  return loreEntries
    .map((entry) => {
      return `
[${entry.title}]
키워드: ${entry.keywords || "없음"}
내용:
${entry.content}
`.trim();
    })
    .join("\n\n");
}

function buildSystemPrompt({
  character,
  persona,
  worldview,
  loreEntries,
}: {
  character?: CharacterSetting | null;
  persona?: PersonaSetting | null;
  worldview?: WorldviewSetting | null;
  loreEntries?: LoreEntry[];
}) {
  return `
너는 아래 설정을 기반으로 대화하는 한국어 캐릭터 AI다.

[사용자 페르소나]
이름: ${persona?.name || "설정 없음"}
설명: ${persona?.description || "설정 없음"}
성격: ${persona?.personality || "설정 없음"}
말투: ${persona?.speaking_style || "설정 없음"}
외형/분위기: ${persona?.appearance || "설정 없음"}
배경: ${persona?.background || "설정 없음"}
관계 스타일: ${persona?.relationship_style || "설정 없음"}
추가 설정: ${persona?.additional_settings || "설정 없음"}

[AI 캐릭터]
이름: ${character?.name || "설정 없음"}
설명: ${character?.description || "설정 없음"}
성격: ${character?.personality || "설정 없음"}
말투: ${character?.speaking_style || "설정 없음"}
사용자와의 관계: ${character?.relationship || "설정 없음"}

[세계관]
이름: ${worldview?.title || "설정 없음"}
설명: ${worldview?.description || "설정 없음"}
배경 설정: ${worldview?.setting || "설정 없음"}
세계관 규칙: ${worldview?.rules || "설정 없음"}

[현재 대화에 적용할 로어북 항목]
${buildLoreText(loreEntries)}

중요 규칙:
- 반드시 한국어로만 답변한다.
- 영어, 일본어, 중국어 등 외국어를 섞지 않는다.
- AI는 반드시 [AI 캐릭터] 역할로 대화한다.
- 사용자는 [사용자 페르소나]로 인식한다.
- 대화는 [세계관] 안에서 진행한다.
- 로어북 항목이 있으면 자연스럽게 참고한다.
- 로어북 내용과 충돌하는 설정을 임의로 만들지 않는다.
- 세계관의 배경과 규칙을 쉽게 깨지 않는다.
- 캐릭터와 사용자 관계를 유지한다.
- 이전 대화 흐름을 참고해서 자연스럽게 이어간다.
- 너무 설명식으로 답하지 않는다.
- 번역체를 피하고 자연스러운 한국어 구어체로 답한다.
- 사용자가 짧게 말하면 AI도 짧고 자연스럽게 답한다.
- 질문을 매번 덧붙이지 않는다.

[입력 해석 규칙]
- 사용자의 일반 문장 또는 "큰따옴표" 문장은 실제 대사로 해석한다.
- *별표로 감싼 문장*은 사용자의 행동 묘사로 해석한다.
- (괄호로 감싼 문장)은 사용자의 생각 또는 속마음으로 해석한다.
- 사용자가 행동을 입력하면 캐릭터는 그 행동을 본 것처럼 반응한다.
- 사용자가 생각을 입력하면 직접 들은 말처럼 반응하지 말고, 분위기나 표정으로 간접적으로 반응한다.

[대화 스타일]
- 기본은 짧은 대화체 답변이다.
- 행동 묘사는 꼭 필요할 때만 한 줄 이내로 쓴다.
- 속마음은 자주 쓰지 않는다.
- 매번 행동 묘사로 시작하지 않는다.
- 대사는 따옴표 없이 자연스럽게 말해도 된다.
- 한 답변에 행동, 대사, 생각을 모두 넣으려고 하지 않는다.
`.trim();
}

function toProviderMessages({
  messages,
  character,
  persona,
  worldview,
  loreEntries,
}: {
  messages: ChatMessage[];
  character?: CharacterSetting | null;
  persona?: PersonaSetting | null;
  worldview?: WorldviewSetting | null;
  loreEntries?: LoreEntry[];
}): AiChatMessage[] {
  const systemPrompt = buildSystemPrompt({
    character,
    persona,
    worldview,
    loreEntries,
  });

  const recentMessages: AiChatMessage[] = messages
    .slice(-20)
    .filter((message) => message.message_type !== "narration")
    .map((message) => ({
      role: message.role,
      content: message.content,
    }));

  return [
    {
      role: "system",
      content: systemPrompt,
    },
    ...recentMessages,
  ];
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const aiSettings = body.aiSettings || {};
    const messages = body.messages as ChatMessage[];
    const character = body.character as CharacterSetting | null;
    const persona = body.persona as PersonaSetting | null;
    const worldview = body.worldview as WorldviewSetting | null;
    const loreEntries = (body.loreEntries || []) as LoreEntry[];

    if (!messages || !Array.isArray(messages)) {
      return Response.json(
        { message: "messages 값이 없습니다." },
        { status: 400 }
      );
    }

    const providerMessages = toProviderMessages({
      messages,
      character,
      persona,
      worldview,
      loreEntries,
    });

const result = await createChatCompletion({
  messages: providerMessages,
  provider: aiSettings.provider,
  model: aiSettings.model,
  temperature: Number(aiSettings.temperature || process.env.AI_TEMPERATURE || 0.65),
  maxTokens: Number(aiSettings.max_tokens || process.env.AI_MAX_TOKENS || 700),
});

    return Response.json({
      message: result.message,
      provider: result.provider,
      model: result.model,
    });
  } catch (error) {
    console.error("AI route error:", error);

    return Response.json(
      {
        message: "AI 응답 생성 중 오류가 발생했습니다.",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}