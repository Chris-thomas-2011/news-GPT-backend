
import { GoogleGenAI, Type } from "@google/genai";
import { NewsItem } from "../types.ts";

const REFRESH_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours

export const fetchLatestNDTVNews = async (): Promise<NewsItem[]> => {
  // Use gemini-flash-latest which typically uses the default provided API key 
  // without requiring the manual selection dialog for paid projects.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const response = await ai.models.generateContent({
    model: "gemini-flash-latest",
    contents: "Search for the latest 15 headlines from NDTV (ndtv.com). For each article, provide a title, direct NDTV URL, category, date, and a summary consisting of exactly 15 separate detailed sentences.",
    config: {
      systemInstruction: "You are a news aggregator. Fetch 15 current news stories from NDTV. Return the data in a strict JSON format. Each 'summaryLines' array MUST contain exactly 15 sentences. Ensure the 'url' is the direct link to the article on ndtv.com.",
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

  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const groundingUrls = groundingChunks
    .map((chunk: any) => chunk.web?.uri)
    .filter((uri: string | undefined): uri is string => !!uri);

  let rawText = response.text || "";
  
  // Strip code block markers if present
  rawText = rawText.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();

  try {
    const data = JSON.parse(rawText);
    const newsItems = (data.news || []).map((item: any, index: number) => {
      const sourceUrl = item.url && item.url.includes('ndtv.com') 
        ? item.url 
        : (groundingUrls.length > index ? groundingUrls[index] : 'https://www.ndtv.com');
      
      return {
        ...item,
        url: sourceUrl,
        id: `news-${Date.now()}-${index}`,
        timestamp: new Date().toISOString(),
        groundingSources: groundingUrls.slice(0, 5)
      };
    });

    if (newsItems.length === 0) throw new Error("No news items returned by AI");
    return newsItems;
    
  } catch (e) {
    console.error("JSON Parse Error:", e, "Raw Text:", rawText);
    throw new Error("Received an invalid response format. Please try again.");
  }
};

export const getStoredNews = (): NewsItem[] | null => {
  try {
    const stored = localStorage.getItem('ndtv_news_cache');
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    const now = Date.now();
    
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
