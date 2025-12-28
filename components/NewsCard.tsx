
import React, { useState } from 'react';
import { NewsItem } from '../types';

interface NewsCardProps {
  item: NewsItem;
}

const NewsCard: React.FC<NewsCardProps> = ({ item }) => {
  const [expanded, setExpanded] = useState(false);

  // Join the 15 sentences into a single paragraph
  const fullParagraph = item.summaryLines.join(' ');

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-300 hover:shadow-md hover:border-slate-300 flex flex-col h-full">
      <div className="p-6 flex flex-col flex-grow">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 text-[10px] font-bold text-blue-600 bg-blue-50 rounded-md uppercase tracking-wider">
              {item.category || 'General'}
            </span>
            <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
              <i className="far fa-calendar-alt mr-1"></i> {item.date}
            </span>
          </div>
          <span className="text-[10px] text-slate-400">
            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        
        <h3 className="text-xl font-bold text-slate-900 leading-tight mb-4 line-clamp-2 min-h-[3.5rem]">
          {item.title}
        </h3>

        <div className={`mb-6 ${!expanded ? 'max-h-[160px] overflow-hidden relative' : ''}`}>
          <p className="text-slate-600 text-sm leading-relaxed text-justify">
            {fullParagraph}
          </p>
          {!expanded && (
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent" />
          )}
        </div>

        {/* Grounding Sources for Compliance */}
        {expanded && item.groundingSources && item.groundingSources.length > 0 && (
          <div className="mb-4 pt-4 border-t border-slate-100">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Verified Sources</h4>
            <div className="flex flex-wrap gap-2">
              {item.groundingSources.slice(0, 3).map((src, i) => (
                <a 
                  key={i} 
                  href={src} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[10px] text-blue-500 hover:underline truncate max-w-[150px]"
                >
                  <i className="fas fa-link mr-1"></i> {new URL(src).hostname}
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-auto">
          <button 
            onClick={() => setExpanded(!expanded)}
            className="text-xs font-semibold text-slate-500 hover:text-blue-600 flex items-center gap-2 transition-colors"
          >
            {expanded ? (
              <><i className="fas fa-chevron-up"></i> Collapse</>
            ) : (
              <><i className="fas fa-chevron-down"></i> Read 15-Line Summary</>
            )}
          </button>
          
          <a 
            href={item.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-[10px] font-bold rounded-lg hover:bg-slate-800 transition-colors uppercase tracking-wide"
          >
            Original <i className="fas fa-external-link-alt text-[8px]"></i>
          </a>
        </div>
      </div>
    </div>
  );
};

export default NewsCard;
