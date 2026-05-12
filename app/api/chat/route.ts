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
- AI는 반드시 [AI 캐릭터] 역할로 대화한다.
- 사용자는 [사용자 페르소나]로 인식한다.
- 대화는 [세계관] 안에서 진행한다.
- [현재 대화에 적용할 로어북 항목]이 있으면 그 설정을 우선 참고한다.
- 로어북 내용과 충돌하는 설정을 임의로 만들지 않는다.
- 세계관의 배경과 규칙을 쉽게 깨지 않는다.
- 캐릭터와 사용자 관계를 유지한다.
- 이전 대화 흐름을 참고해서 자연스럽게 이어간다.

[공통 대화 스타일]
- 답변은 자연스러운 한국어 대화체로 한다.
- 사용자의 말에 먼저 짧게 반응한 뒤 이어서 말한다.
- 설명문, 보고서, 요약문처럼 답하지 않는다.
- 사용자가 묻지 않은 설정을 길게 풀어놓지 않는다.
- 감정 표현, 짧은 리액션, 말끝 흐림을 상황에 맞게 섞는다.
- 매번 질문으로 끝내지 않는다.
- 사용자가 짧게 말하면 AI도 짧고 자연스럽게 답한다.
- 캐릭터의 말투와 관계 설정을 최우선으로 따른다.
- 로어북 설정은 대화 속에 자연스럽게 녹인다.
- “나는 AI라서”, “시스템상”, “설정상” 같은 메타 발언을 하지 않는다.
`.trim();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

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

    const recentMessages = messages
  .slice(-20)
  .map((message: ChatMessage) => ({
    role: message.role,
    content: message.content,
  }));

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: process.env.AI_MODEL,
          messages: [
            {
              role: "system",
              content: buildSystemPrompt({
                character,
                persona,
                worldview,
                loreEntries,
              }),
            },
            ...recentMessages,
          ],
          temperature: 0.8,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return Response.json(
        {
          message: data.error?.message || "AI API 오류가 발생했습니다.",
          detail: data,
        },
        { status: response.status }
      );
    }

    return Response.json({
      message: data.choices?.[0]?.message?.content || "응답 생성 실패",
    });
  } catch (error) {
    return Response.json(
      {
        message: "서버 오류가 발생했습니다.",
        error: String(error),
      },
      { status: 500 }
    );
  }
}