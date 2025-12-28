
import { GoogleGenAI, Type } from "@google/genai";
import { NewsItem } from "../types.ts";

const REFRESH_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours

export const fetchLatestNDTVNews = async (): Promise<NewsItem[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: "Search for the latest 15 news stories from NDTV (ndtv.com). For each story, provide: 1. The exact title. 2. The source URL. 3. A category. 4. The news date. 5. A summary consisting of exactly 15 separate sentences that, when combined, form a comprehensive paragraph.",
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          news: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                url: { type: Type.STRING },
                category: { type: Type.STRING },
                date: { type: Type.STRING, description: "The publication date of the news article" },
                summaryLines: { 
                  type: Type.ARRAY, 
                  items: { type: Type.STRING },
                  description: "An array of exactly 15 sentences for the summary."
                }
              },
              required: ["title", "url", "summaryLines", "date"]
            }
          }
        },
        required: ["news"]
      }
    }
  });

  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const groundingUrls = groundingChunks
    .map((chunk: any) => chunk.web?.uri)
    .filter((uri: string | undefined): uri is string => !!uri);

  const rawText = response.text;
  try {
    const data = JSON.parse(rawText);
    return (data.news || []).map((item: any, index: number) => {
      const sourceUrl = item.url || (groundingUrls.length > 0 ? groundingUrls[index % groundingUrls.length] : 'https://www.ndtv.com');
      
      return {
        ...item,
        url: sourceUrl,
        id: `news-${Date.now()}-${index}`,
        timestamp: new Date().toISOString(),
        groundingSources: groundingUrls
      };
    });
  } catch (e) {
    console.error("Failed to parse news JSON", e);
    throw new Error("Invalid response format from AI");
  }
};

export const getStoredNews = (): NewsItem[] | null => {
  const stored = localStorage.getItem('ndtv_news_cache');
  if (!stored) return null;

  const parsed = JSON.parse(stored);
  const now = Date.now();
  
  if (now - parsed.lastUpdated > REFRESH_INTERVAL_MS) {
    return null; // Cache expired
  }

  return parsed.news;
};

export const storeNews = (news: NewsItem[]) => {
  localStorage.setItem('ndtv_news_cache', JSON.stringify({
    lastUpdated: Date.now(),
    news
  }));
};
