type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  speaker_name?: string | null;
  message_type?: string | null;
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

[AI 캐릭터들]
${buildCharactersText(characters)}

[세계관]
이름: ${worldview?.title || "설정 없음"}
설명: ${worldview?.description || "설정 없음"}
배경 설정: ${worldview?.setting || "설정 없음"}
세계관 규칙: ${worldview?.rules || "설정 없음"}

[현재 대화에 적용할 로어북 항목]
${buildLoreText(loreEntries)}

중요 규칙:
- AI는 반드시 [AI 캐릭터들] 중 상황에 맞는 캐릭터 역할로 대화한다.
- AI 캐릭터가 여러 명이면 상황에 맞는 캐릭터만 자연스럽게 말한다.
- 모든 캐릭터가 매번 한마디씩 말하지 않는다.
- 캐릭터들끼리도 상황에 맞게 대화할 수 있다.
- 사용자는 [사용자 페르소나]로 인식한다.
- 대화는 [세계관] 안에서 진행한다.
- [현재 대화에 적용할 로어북 항목]이 있으면 그 설정을 우선 참고한다.
- 로어북 내용과 충돌하는 설정을 임의로 만들지 않는다.
- 세계관의 배경과 규칙을 쉽게 깨지 않는다.
- 캐릭터와 사용자 관계를 유지한다.
- 이전 대화 흐름을 참고해서 자연스럽게 이어간다.
- 너무 설명식으로 답하지 않는다.
- 한국어로 답변한다.

[입력 해석 규칙]
- 사용자의 일반 문장 또는 "큰따옴표" 문장은 실제 대사로 해석한다.
- *별표로 감싼 문장*은 사용자의 행동 묘사로 해석한다.
- (괄호로 감싼 문장)은 사용자의 생각 또는 속마음으로 해석한다.
- 사용자가 행동을 입력하면 캐릭터는 그 행동을 본 것처럼 반응한다.
- 사용자가 생각을 입력하면 직접 들은 말처럼 반응하지 말고, 분위기나 표정으로 간접적으로 반응한다.

[출력 형식]
- AI도 같은 형식을 사용한다.
- 행동 묘사는 *행동* 형식으로 작성한다.
- 실제 대사는 "대사" 형식으로 작성한다.
- 속마음은 (생각) 형식으로 작성한다.
- 아무것도 감싸지 않은 설명문은 최대한 줄인다.
- 모든 답변에 행동, 대사, 생각을 억지로 다 넣지 않는다.
- 짧은 대화에서는 대사만 자연스럽게 답해도 된다.
- 행동과 생각은 과하게 길게 쓰지 않는다.
- 여러 캐릭터가 말할 경우, 각 캐릭터의 말투와 성격 차이가 드러나게 한다.

[복수 캐릭터 출력 규칙]
- AI 캐릭터가 여러 명일 때는 각 발화 앞에 반드시 캐릭터 이름을 붙인다.
- 형식은 반드시 아래처럼 작성한다.

캐릭터이름:
*행동*
"대사"
(생각)

- 한 번의 답변에 여러 캐릭터가 말할 수 있지만, 필요한 캐릭터만 말한다.
- 캐릭터 이름 없이 대사만 출력하지 않는다.
- 캐릭터 이름 없이 행동 묘사를 출력하지 않는다.

[복수 캐릭터 출력 규칙]
- 복수 캐릭터 대화에서는 반드시 아래 형식을 지킨다.
- 캐릭터가 말하거나 행동할 때 반드시 이름으로 시작한다.
- 이름 없는 대사를 출력하지 않는다.
- 이름 없는 행동 묘사를 출력하지 않는다.
- 아래 형식을 절대 유지한다.

캐릭터이름:
*행동*
"대사"
(생각)

- 다른 형식으로 출력하지 않는다.
- 캐릭터 이름은 반드시 한 줄 단독으로 작성한다.
- 콜론(:)을 반드시 붙인다.

잘못된 예시:
"안녕"

올바른 예시:
리아:
"안녕"
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
                characters,
                persona,
                worldview,
                loreEntries,
              }),
            },
            ...recentMessages,
          ],
          temperature: 0.9,
          top_p: 0.9,
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