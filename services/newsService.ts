
import { GoogleGenAI, Type } from "@google/genai";
import { NewsItem } from "../types.ts";

const REFRESH_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours

export const fetchLatestNDTVNews = async (): Promise<NewsItem[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: "Search for the latest 15 headlines from NDTV (ndtv.com). For each, provide a title, direct link, category, date, and a very detailed 15-sentence paragraph summary. Ensure the response is strictly valid JSON.",
    config: {
      systemInstruction: "You are a professional news aggregator. Your task is to fetch 15 news items from NDTV and return them in a specific JSON format. Do not include any text before or after the JSON. Each 'summaryLines' array MUST contain exactly 15 sentences. Ensure the 'url' is the direct news article link from ndtv.com.",
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
                date: { type: Type.STRING },
                summaryLines: { 
                  type: Type.ARRAY, 
                  items: { type: Type.STRING }
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

  // Extract grounding information
  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const groundingUrls = groundingChunks
    .map((chunk: any) => chunk.web?.uri)
    .filter((uri: string | undefined): uri is string => !!uri);

  let rawText = response.text || "";
  
  // Clean potential markdown formatting
  rawText = rawText.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();

  try {
    const data = JSON.parse(rawText);
    const newsItems = (data.news || []).map((item: any, index: number) => {
      // Fallback for missing URLs using grounding metadata
      const sourceUrl = item.url && item.url.includes('ndtv.com') 
        ? item.url 
        : (groundingUrls.length > index ? groundingUrls[index] : 'https://www.ndtv.com');
      
      return {
        ...item,
        url: sourceUrl,
        id: `news-${Date.now()}-${index}`,
        timestamp: new Date().toISOString(),
        groundingSources: groundingUrls.slice(0, 5) // Include some verified sources for compliance
      };
    });

    if (newsItems.length === 0) throw new Error("No news items found in response");
    return newsItems;
    
  } catch (e) {
    console.error("Critical Error: Failed to process news data.", e, "Raw response was:", rawText);
    throw new Error("The news server returned an incompatible format. Please try again.");
  }
};

export const getStoredNews = (): NewsItem[] | null => {
  try {
    const stored = localStorage.getItem('ndtv_news_cache');
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    const now = Date.now();
    
    // Check if 6 hours have passed
    if (now - parsed.lastUpdated > REFRESH_INTERVAL_MS) {
      return null;
    }

    return parsed.news;
  } catch (e) {
    return null;
  }
};

export const storeNews = (news: NewsItem[]) => {
  localStorage.setItem('ndtv_news_cache', JSON.stringify({
    lastUpdated: Date.now(),
    news
  }));
};
