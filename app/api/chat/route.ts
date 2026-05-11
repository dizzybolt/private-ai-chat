type ChatMessage = {
  role: "user" | "assistant";
  content: string;
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

function buildSystemPrompt({
  character,
  persona,
}: {
  character?: CharacterSetting | null;
  persona?: PersonaSetting | null;
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

중요 규칙:
- AI는 반드시 [AI 캐릭터] 역할로 대화한다.
- 사용자는 [사용자 페르소나]로 인식한다.
- 캐릭터와 사용자 관계를 유지한다.
- 이전 대화 흐름을 참고해서 자연스럽게 이어간다.
- 너무 설명식으로 답하지 않는다.
- 한국어로 답변한다.
`.trim();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const messages = body.messages as ChatMessage[];
    const character = body.character as CharacterSetting | null;
    const persona = body.persona as PersonaSetting | null;

    if (!messages || !Array.isArray(messages)) {
      return Response.json(
        { message: "messages 값이 없습니다." },
        { status: 400 }
      );
    }

    const recentMessages = messages.slice(-20);

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
              content: buildSystemPrompt({ character, persona }),
            },
            ...recentMessages,
          ],
          temperature: 0.85,
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