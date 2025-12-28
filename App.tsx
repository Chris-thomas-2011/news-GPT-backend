
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
        if (cached && cached.length > 0) {
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
    } catch (err: any) {
      console.error("App Error:", err);
      setError(err.message || "Failed to fetch current news. Please check your connection and try again.");
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
    if (diff <= 0) return "Refreshing now...";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `Update in: ${hours}h ${minutes}m`;
  };

  return (
    <div className="min-h-screen pb-20 bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 border-b border-slate-200 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center text-white shadow-lg">
              <i className="fas fa-newspaper text-xl"></i>
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">NDTV <span className="text-red-600">Summarizer</span></h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{getTimeRemaining()}</p>
            </div>
          </div>
          
          <button 
            onClick={() => loadNews(true)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-full transition-all disabled:opacity-50"
          >
            <i className={`fas fa-sync-alt ${loading ? 'animate-spin' : ''}`}></i>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8">
        {loading && news.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="relative w-24 h-24 mb-8">
              <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-red-600 rounded-full border-t-transparent animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center text-red-600">
                <i className="fas fa-search text-2xl"></i>
              </div>
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Fetching Live News</h2>
            <p className="text-slate-500 max-w-sm mx-auto leading-relaxed">
              We are gathering the top 15 stories from NDTV and generating detailed summaries. This takes about 15 seconds.
            </p>
          </div>
        ) : error ? (
          <div className="bg-white border border-red-100 rounded-2xl p-10 text-center max-w-lg mx-auto mt-12 shadow-xl shadow-red-50">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-500 mx-auto mb-6">
              <i className="fas fa-bolt text-3xl"></i>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">Unable to Load News</h2>
            <p className="text-slate-500 mb-8 leading-relaxed">{error}</p>
            <button 
              onClick={() => loadNews(true)}
              className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg active:scale-[0.98]"
            >
              Retry Connection
            </button>
          </div>
        ) : (
          <>
            <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 text-red-600 text-[10px] font-black rounded-full uppercase tracking-widest mb-4">
                  <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
                  Live Updates
                </div>
                <h2 className="text-4xl font-black text-slate-900 tracking-tight">Top 15 Headlines</h2>
                <p className="text-slate-500 mt-2 text-lg">Comprehensive 15-sentence summaries from NDTV.</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last Synced</p>
                <p className="text-sm font-semibold text-slate-700">
                  {lastUpdated ? new Date(lastUpdated).toLocaleDateString() + ' • ' + new Date(lastUpdated).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : 'N/A'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {news.map((item) => (
                <NewsCard key={item.id} item={item} />
              ))}
            </div>
          </>
        )}
      </main>

      <footer className="mt-24 border-t border-slate-200 py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mx-auto mb-6">
            <i className="fas fa-shield-alt"></i>
          </div>
          <p className="text-slate-900 font-bold mb-1">NDTV News Summarizer</p>
          <p className="text-slate-400 text-sm mb-6">Built with Google Gemini AI & React</p>
          <div className="flex items-center justify-center gap-6 text-xs font-bold text-slate-400 uppercase tracking-widest">
            <span className="flex items-center gap-2"><i className="fas fa-check-circle text-green-500"></i> Auto-Sync Active</span>
            <span className="flex items-center gap-2"><i className="fas fa-check-circle text-green-500"></i> AI Verified</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
