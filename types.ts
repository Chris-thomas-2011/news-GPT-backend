
export interface NewsItem {
  id: string;
  title: string;
  url: string;
  summaryLines: string[];
  date: string;
  timestamp: string;
  category?: string;
  groundingSources?: string[];
}

export interface NewsStorage {
  lastUpdated: number;
  news: NewsItem[];
}
