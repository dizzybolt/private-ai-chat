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

function buildCharactersText(characters?: CharacterSetting[]) {
  if (!characters || characters.length === 0) {
    return "설정 없음";
  }

  return characters
    .map((character, index) => {
      return `
[캐릭터 ${index + 1}]
이름: ${character.name || "설정 없음"}
설명: ${character.description || "설정 없음"}
성격: ${character.personality || "설정 없음"}
말투: ${character.speaking_style || "설정 없음"}
사용자와의 관계: ${character.relationship || "설정 없음"}
`.trim();
    })
    .join("\n\n");
}

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
  characters,
  persona,
  worldview,
  loreEntries,
}: {
  characters?: CharacterSetting[];
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
${buildCharactersText(characters)}

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
- AI는 위 캐릭터 설정을 참고해 자연스럽게 대화한다.
- 캐릭터가 여러 명이면 상황에 맞는 캐릭터만 자연스럽게 반응한다.
- 모든 캐릭터가 매번 말할 필요는 없다.
- 사용자는 [사용자 페르소나]로 인식한다.
- 대화는 [세계관] 안에서 진행한다.
- 로어북 항목이 있으면 자연스럽게 참고한다.
- 너무 설명식으로 답하지 않는다.
- 번역체를 피하고 자연스러운 한국어 구어체로 답한다.
- 캐릭터 이름을 억지로 붙이지 않아도 된다.

[입력 해석 규칙]
- 일반 문장 또는 "큰따옴표" 문장은 실제 대사로 해석한다.
- *별표로 감싼 문장*은 행동 묘사로 해석한다.
- (괄호로 감싼 문장)은 생각 또는 속마음으로 해석한다.

[출력 형식]
- 행동 묘사는 *행동* 형식으로 작성한다.
- 실제 대사는 "대사" 형식으로 작성한다.
- 속마음은 (생각) 형식으로 작성한다.
- 단, 모든 답변에 행동/대사/생각을 억지로 다 넣지 않는다.
- 짧은 대화에서는 대사만 자연스럽게 답해도 된다.
`.trim();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const messages = body.messages as ChatMessage[];
    const characters = (body.characters || []) as CharacterSetting[];
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
      .filter((message) => message.message_type !== "narration")
      .map((message) => ({
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
                characters,
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