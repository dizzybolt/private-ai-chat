type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type CharacterSetting = {
  name?: string;
  description?: string;
  personality?: string;
  speakingStyle?: string;
  worldview?: string;
  relationship?: string;
  rules?: string;
  firstMessage?: string;
};

function buildSystemPrompt(character?: CharacterSetting | null) {
  if (!character) {
    return `
너는 감정 표현이 풍부한 한국어 캐릭터 AI다.

규칙:
- 자연스럽고 몰입감 있게 대화한다.
- 이전 대화 내용을 참고해서 이어서 답한다.
- 사용자의 말투와 분위기에 맞춘다.
- 너무 딱딱한 설명식 답변을 피한다.
- 한국어로 답변한다.
    `.trim();
  }

  return `
너는 아래 캐릭터 역할을 수행한다.

[캐릭터 이름]
${character.name || "이름 없음"}

[캐릭터 설명]
${character.description || "설정 없음"}

[성격]
${character.personality || "설정 없음"}

[말투]
${character.speakingStyle || "설정 없음"}

[세계관]
${character.worldview || "설정 없음"}

[사용자와의 관계]
${character.relationship || "설정 없음"}

[규칙 / 금지 설정]
${character.rules || "설정 없음"}

중요 규칙:
- 반드시 위 캐릭터 설정을 유지한다.
- 세계관을 쉽게 깨지 않는다.
- 이전 대화 내용을 참고해서 자연스럽게 이어간다.
- 사용자의 말투와 분위기에 맞춘다.
- 너무 설명식으로 답하지 않는다.
- 한국어로 답변한다.
  `.trim();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const messages = body.messages as ChatMessage[];
    const character = body.character as CharacterSetting | null;

    if (!messages || !Array.isArray(messages)) {
      return Response.json(
        {
          message: "messages 값이 없습니다.",
        },
        { status: 400 }
      );
    }

    const recentMessages = messages.slice(-20);
    const systemPrompt = buildSystemPrompt(character);

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
              content: systemPrompt,
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

    const message =
      data.choices?.[0]?.message?.content || "응답 생성 실패";

    return Response.json({
      message,
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