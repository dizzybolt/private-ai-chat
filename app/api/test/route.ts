export async function GET() {
  try {
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
              content:
                "너는 한국어 캐릭터 AI다. 자연스럽고 친근하게 대화한다.",
            },
            {
              role: "user",
              content: "안녕?",
            },
          ],
        }),
      }
    );

    const data = await response.json();

    return Response.json(data);
  } catch (error) {
    return Response.json({
      error: String(error),
    });
  }
}