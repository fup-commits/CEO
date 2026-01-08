
import {GoogleGenAI} from "@google/genai";
import { NewsItem } from "../types";

// Vite define 설정에 의해 빌드 타임에 문자열로 치환됩니다.
const apiKey = process.env.API_KEY;
const ai = new GoogleGenAI({ apiKey });

export async function summarizeExecutiveNews(news: NewsItem[]): Promise<string> {
  if (!news || news.length === 0) return "No significant updates found for your companies this morning.";
  if (!apiKey) return "AI Summary unavailable: API Key not configured.";

  const newsContext = news.map(n => `[${n.source}] ${n.title}`).join('\n');

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are an elite executive assistant. Summarize the following company news into a concise, sophisticated 3-sentence morning briefing for the CEO. Focus on market sentiment and key strategic movements. Keep it professional and insightful.
      
      News Data:
      ${newsContext}`,
      config: {
        temperature: 0.7,
        topP: 0.95,
      },
    });

    return response.text || "Summary unavailable.";
  } catch (error) {
    console.error("Gemini summary error:", error);
    return "Error generating AI summary.";
  }
}
