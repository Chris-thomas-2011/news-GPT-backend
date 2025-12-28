
import React, { useState, useEffect, useCallback } from 'react';
import { NewsItem } from './types.ts';
import * as newsService from './services/newsService.ts';
import NewsCard from './components/NewsCard.tsx';

const App: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const loadNews = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      if (!forceRefresh) {
        const cached = newsService.getStoredNews();
        if (cached) {
          setNews(cached);
          const storedData = localStorage.getItem('ndtv_news_cache');
          if (storedData) {
            setLastUpdated(JSON.parse(storedData).lastUpdated);
          }
          setLoading(false);
          return;
        }
      }

      const freshNews = await newsService.fetchLatestNDTVNews();
      newsService.storeNews(freshNews);
      setNews(freshNews);
      setLastUpdated(Date.now());
    } catch (err) {
      console.error(err);
      setError("Failed to fetch current news. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNews();
  }, [loadNews]);

  const getTimeRemaining = () => {
    if (!lastUpdated) return "";
    const nextUpdate = lastUpdated + (6 * 60 * 60 * 1000);
    const diff = nextUpdate - Date.now();
    if (diff <= 0) return "Refreshing soon...";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `Next update in: ${hours}h ${minutes}m`;
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 backdrop-blur-md bg-opacity-90">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center text-white shadow-lg">
              <i className="fas fa-newspaper text-xl"></i>
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">NDTV <span className="text-red-600">Summarizer</span></h1>
              <p className="text-xs text-slate-500 font-medium">{getTimeRemaining()}</p>
            </div>
          </div>
          
          <button 
            onClick={() => loadNews(true)}
            disabled={loading}
            className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-all disabled:opacity-50"
            title="Refresh News"
          >
            <i className={`fas fa-sync-alt ${loading ? 'animate-spin' : ''}`}></i>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8">
        {loading && news.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="relative w-20 h-20 mb-6">
              <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-red-600 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Analyzing NDTV News</h2>
            <p className="text-slate-500 max-w-xs">Using Gemini AI to gather the top 15 stories and generate detailed summaries...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center max-w-lg mx-auto mt-12">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-600 mx-auto mb-4">
              <i className="fas fa-exclamation-triangle text-2xl"></i>
            </div>
            <h2 className="text-lg font-bold text-red-800 mb-2">Oops! Something went wrong</h2>
            <p className="text-red-600 mb-6">{error}</p>
            <button 
              onClick={() => loadNews(true)}
              className="px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h2 className="text-3xl font-black text-slate-900 mb-2">Daily Digest</h2>
                <p className="text-slate-500">15 top stories meticulously summarized into 15 points each.</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <i className="far fa-clock"></i>
                <span>Last updated: {lastUpdated ? new Date(lastUpdated).toLocaleDateString() + ' ' + new Date(lastUpdated).toLocaleTimeString() : 'N/A'}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {news.map((item) => (
                <NewsCard key={item.id} item={item} />
              ))}
            </div>
          </>
        )}
      </main>

      <footer className="mt-20 border-t border-slate-200 pt-12 text-center text-slate-400 text-sm">
        <p>© {new Date().getFullYear()} NDTV News Summarizer • Powered by Gemini Flash 3</p>
        <p className="mt-1 flex items-center justify-center gap-4">
          <span className="flex items-center gap-1"><i className="fas fa-bolt text-amber-400"></i> AI Generated</span>
          <span className="flex items-center gap-1"><i className="fas fa-redo text-blue-400"></i> Auto-refreshes every 6 hours</span>
        </p>
      </footer>
    </div>
  );
};

export default App;
