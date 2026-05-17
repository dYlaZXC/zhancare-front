import { NextResponse } from "next/server";

const API_KEY = process.env.MISTRAL_API_KEY;
const ENDPOINT = "https://api.mistral.ai/v1/chat/completions";

const SYSTEM_PROMPT = `Ты — опытный российский врач, заполняющий электронную медицинскую карту. Прочитай описание консультации и СГЕНЕРИРУЙ профессиональный медицинский текст для КАЖДОГО раздела карты.

Правила:
1. Поля "diagnostics", "diagnosis", "treatment", "prescription", "recommendations" — заполнять ВСЕГДА, даже если в описании нет прямых указаний. Опирайся на клинические стандарты для выявленного состояния.
2. Для "treatment" и "prescription" — назначь конкретные препараты с дозировками согласно стандартам лечения.
3. Для "diagnostics" — опиши объективный статус из данных описания (АД, ЧСС, температура, осмотр).
4. Для "recommendations" — дай конкретные рекомендации по режиму, диете, контролю, следующему визиту.
5. Пустую строку "" ставь ТОЛЬКО если раздел категорически невозможно заполнить.

Верни ТОЛЬКО валидный JSON (без markdown, без пояснений):
{
  "complaints": "жалобы пациента — симптомы, характер, локализация, интенсивность, длительность",
  "anamnesis": "анамнез болезни и жизни — история, сопутствующие заболевания, аллергии, наследственность",
  "diagnostics": "объективный статус — данные осмотра, АД, ЧСС, температура, результаты обследований",
  "diagnosis": "диагноз с кодом МКБ-10, например: Гипертоническая болезнь II ст., 2 степень (I10)",
  "treatment": "назначения: конкретные препараты с МНН, дозировками и режимом приёма; процедуры",
  "prescription": "рецептурный список препаратов из лечения: МНН, форма выпуска, дозировка, кол-во упаковок",
  "recommendations": "рекомендации: режим, диета, самоконтроль АД/сахара, ограничения, контрольный визит через...",
  "session_notes": "заметки для следующего приёма: динамика, контрольные показатели, на что обратить внимание"
}`;

export async function POST(req: Request) {
  if (!API_KEY) {
    return NextResponse.json({ error: "AI service not configured" }, { status: 503 });
  }

  try {
    const { description, patientName } = await req.json();

    if (!description?.trim()) {
      return NextResponse.json({ error: "Description is required" }, { status: 400 });
    }

    const userMessage = patientName
      ? `Пациент: ${patientName}\n\nОписание врача:\n${description}`
      : `Описание врача:\n${description}`;

    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: "mistral-large-latest",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        temperature: 0.4,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json({ error: error.message || "AI request failed" }, { status: response.status });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? "{}";

    let parsed: Record<string, string> = {};
    try {
      parsed = JSON.parse(content);
    } catch {
      // fallback: try to extract JSON from the response
      const match = content.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
    }

    return NextResponse.json({ result: parsed });
  } catch (err: any) {
    console.error("analyze-consultation error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
