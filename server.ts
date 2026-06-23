import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize Google GenAI lazily to avoid crashing on missing key at startup
let aiInstance: GoogleGenAI | null = null;
function getAI() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("API Ключ GEMINI_API_KEY не знайдено в налаштуваннях сервера.");
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

// JSON Schema for structured decision analysis from Gemini
const decisionAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    recommendation: {
      type: Type.OBJECT,
      properties: {
        recommendedOptionName: { 
          type: Type.STRING, 
          description: "Назва найкращого варіанту, яка ТОЧНО збігається з однією із наданих опцій." 
        },
        score: { 
          type: Type.INTEGER, 
          description: "Оцінка впевненості у рекомендації у відсотках від 0 до 100." 
        },
        justification: { 
          type: Type.STRING, 
          description: "Детальне, впевнене та об'єктивне пояснення, чому саме цей варіант є найкращим, на основі контексту." 
        }
      },
      required: ["recommendedOptionName", "score", "justification"]
    },
    optionsAnalysis: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          optionName: { type: Type.STRING, description: "Назва варіанту без змін." },
          pros: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Переваги цього рішення (список коротких тез українською мовою)." },
          cons: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Недоліки цього рішення (список коротких тез українською мовою)." },
          swot: {
            type: Type.OBJECT,
            properties: {
              strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Сильні сторони (S) - внутрішні позитивні фактори рішення." },
              weaknesses: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Слабкі сторони (W) - внутрішні обмеження чи недоліки рішення." },
              opportunities: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Можливості (O) - зовнішні сприятливі фактори чи перспективи." },
              threats: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Загрози (T) - зовнішні загрози, ризики чи непередбачувані фактори." }
            },
            required: ["strengths", "weaknesses", "opportunities", "threats"]
          }
        },
        required: ["optionName", "pros", "cons", "swot"]
      }
    },
    comparisonTable: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          criterionName: { 
            type: Type.STRING, 
            description: "Критерій оцінювання варіантів (наприклад: Вартість, Час, Складність, Ризики, Перспектива, Емоційне задоволення)." 
          },
          optionScores: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                optionName: { type: Type.STRING, description: "Назва порівнюваного варіанту." },
                score: { type: Type.INTEGER, description: "Оцінка цього варіанту за критерієм від 1 (найгірше) до 10 (найкраще)." },
                comment: { type: Type.STRING, description: "Короткий аналітичний коментар чому поставлено такий бал." }
              },
              required: ["optionName", "score", "comment"]
            }
          }
        },
        required: ["criterionName", "optionScores"]
      }
    },
    nextSteps: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Конкретні практичні кроки після прийняття цього рішення."
    }
  },
  required: ["recommendation", "optionsAnalysis", "comparisonTable", "nextSteps"]
};

// API endpoint for analyzing a decision
app.post("/api/analyze", async (req, res) => {
  try {
    const { title, context, options, criteria } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Не вказане питання або назва рішення." });
    }

    if (!options || !Array.isArray(options) || options.length < 1) {
      return res.status(400).json({ error: "Будь ласка, вкажіть хоча б один варіант для аналізу." });
    }

    let ai;
    try {
      ai = getAI();
    } catch (err: any) {
      return res.status(500).json({ error: err.message || "API Ключ GEMINI_API_KEY не знайдено в налаштуваннях сервера." });
    }

    // Format the options list and criteria list
    const optionsStr = options.map((opt, i) => `Варіант ${i + 1}: "${opt}"`).join("\n");
    const criteriaStr = criteria && criteria.length > 0 
      ? `Порівняй їх за такими критеріями: ${criteria.join(", ")}.`
      : "Самостійно визнач релевантні критерії для порівняння (наприклад: Вартість, Складність, Зусилля, Перспектива, Ризики, Задоволення).";

    const prompt = `
Аналізуй наступну життєву або професійну дилему та допоможи прийняти оптимальне рішення.

Проблема/Запитання: "${title}"
Додатковий контекст: "${context || 'Опис контексту відсутній.'}"

Варіанти, які потрібно порівняти:
${optionsStr}

Критерії порівняння:
${criteriaStr}

Будь ласка, виконай:
1. Визнач найкращий рекомендований варіант і твою впевненість у ньому (від 0 до 100%).
2. Склади детальний огляд переваг (pros) і недоліків (cons) для КОЖНОГО з варіантів.
3. Проведи повний SWOT-аналіз для кожного варіанту (Strengths, Weaknesses, Opportunities, Threats).
4. Заповни детальну порівняльну таблицю за критеріями, оцінивши кожен варіант за шкалою від 1 до 10.
5. Напиши план наступних дій (nextSteps) для успішного втілення найкращого рішення.

Вся аналітика повинна бути надана глибокою, професійною, об'єктивною українською мовою. Оцінки критеріїв повинні відображати логіку та здоровий глузд, порівнюючи переваги й ризики кожного рішення.
`;

    // We use gemini-3.5-flash as recommended for general text tasks
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: decisionAnalysisSchema,
        systemInstruction: "Ти — висококваліфікований аналітик та стратегічний консультант. Твоє завдання — допомагати людям приймати зважені, структуровані та логічні рішення. Спілкуйся виключно українською мовою. Уникай пустих банальностей, надавай аргументовані, глибокі та реалістичні висновки."
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("Отримано порожню відповідь від моделі Gemini.");
    }

    const result = JSON.parse(text);
    return res.json(result);
  } catch (error: any) {
    console.error("Помилка під час аналізу рішення:", error);
    return res.status(500).json({ 
      error: error?.message || "Не вдалося отримати аналіз рішення.",
      details: error.toString()
    });
  }
});

// Serve frontend assets in development and production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Помилка під час запуску сервера:", err);
});
