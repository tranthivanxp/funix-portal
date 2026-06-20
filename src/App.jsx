import React, { useState, useEffect } from 'react';
import EmbedRouter from './components/EmbedPages';
import Sidebar from './components/Sidebar';
import SettingsModal from './components/SettingsModal';
import { 
  RefreshCw, 
  ExternalLink, 
  Settings, 
  CheckCircle2, 
  Layout, 
  Loader2, 
  Wifi 
} from 'lucide-react';

const DEFAULT_URLS = {
  overview: '?embed=overview',
  b2c_mkt: import.meta.env.VITE_B2C_MKT_URL || 'http://localhost:5173/',
  mentor: import.meta.env.VITE_MENTOR_URL || 'http://127.0.0.1:8080/',
  khaothi: '?embed=khaothi'
};

function App() {
  // 1. Check if we are running nested in iframe mode
  const params = new URLSearchParams(window.location.search);
  const isEmbedMode = params.has('embed');

  if (isEmbedMode) {
    return <EmbedRouter />;
  }

  // 2. Main Dashboard Application Logic
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [iframeUrls, setIframeUrls] = useState(DEFAULT_URLS);
  
  // Iframe state helpers
  const [iframeKey, setIframeKey] = useState(0);
  const [isIframeLoading, setIsIframeLoading] = useState(true);

  // Load configured URLs from localStorage
  useEffect(() => {
    const savedUrls = localStorage.getItem('funix_portal_iframe_urls');
    if (savedUrls) {
      try {
        const parsed = JSON.parse(savedUrls);
        setIframeUrls({
          overview: parsed.overview || DEFAULT_URLS.overview,
          b2c_mkt: parsed.b2c_mkt || DEFAULT_URLS.b2c_mkt,
          mentor: parsed.mentor || DEFAULT_URLS.mentor,
          khaothi: parsed.khaothi || DEFAULT_URLS.khaothi
        });
      } catch (e) {
        console.error('Lỗi phân tích localStorage:', e);
      }
    }
  }, []);

  // Trigger loading spinner whenever we switch tabs or reload iframe
  useEffect(() => {
    setIsIframeLoading(true);
  }, [activeTab, iframeKey, iframeUrls]);

  const handleSaveUrls = (newUrls) => {
    setIframeUrls(newUrls);
    localStorage.setItem('funix_portal_iframe_urls', JSON.stringify(newUrls));
  };

  const handleReloadIframe = () => {
    setIframeKey(prev => prev + 1);
  };

  const activeTitle = {
    overview: 'Tổng quan Hệ thống',
    b2c_mkt: 'Báo cáo B2C Marketing',
    mentor: 'Báo cáo Mentor Hoạt động',
    khaothi: 'Báo cáo Khảo thí'
  }[activeTab];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0b0f19] text-[#f1f5f9] select-none">
      {/* Sidebar */}
      <Sidebar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Header */}
        <header className="h-16 border-b border-[#1e293b] bg-[#0b0f19] px-6 flex justify-between items-center z-10">
          <div className="flex items-center gap-3">
            <Layout size={18} className="text-indigo-400" />
            <h1 className="text-base font-extrabold tracking-tight text-white">{activeTitle}</h1>
            
            <div className="hidden sm:flex items-center gap-1.5 ml-4 bg-[#131b2e] border border-[#1e293b] px-2.5 py-1 rounded-md text-[10px] text-slate-400">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
              <span>SLA Đạt chuẩn</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Connection Indicator */}
            <div className="hidden md:flex items-center gap-1.5 text-xs text-emerald-400 font-bold px-3 py-1 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
              <Wifi size={14} />
              <span>Hệ thống ổn định</span>
            </div>

            {/* Reload Iframe button */}
            <button 
              onClick={handleReloadIframe}
              title="Tải lại Iframe"
              className="p-2 bg-[#131b2e] hover:bg-[#1e293b] border border-[#1e293b] rounded-xl text-slate-300 hover:text-white transition-all active:scale-95"
            >
              <RefreshCw size={16} className={`${isIframeLoading ? 'animate-spin' : ''}`} />
            </button>

            {/* Open Externally button */}
            <a 
              href={iframeUrls[activeTab]} 
              target="_blank" 
              rel="noopener noreferrer"
              title="Mở trong tab mới"
              className="p-2 bg-[#131b2e] hover:bg-[#1e293b] border border-[#1e293b] rounded-xl text-slate-300 hover:text-white transition-all active:scale-95 flex items-center justify-center"
            >
              <ExternalLink size={16} />
            </a>

            {/* Direct settings button */}
            <button 
              onClick={() => setIsSettingsOpen(true)}
              title="Cấu hình URL nhúng"
              className="p-2 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 text-indigo-400 hover:text-indigo-300 rounded-xl transition-all active:scale-95 flex items-center justify-center"
            >
              <Settings size={16} />
            </button>
          </div>
        </header>

        {/* Content Area containing Iframe */}
        <main className="flex-1 w-full h-full relative overflow-hidden bg-[#070a12]">
          {/* Custom loader overlaid on iframe when loading */}
          {isIframeLoading && (
            <div className="absolute inset-0 bg-[#070a12] z-30 flex flex-col items-center justify-center gap-3 animate-in fade-in duration-200">
              <Loader2 size={32} className="text-indigo-500 animate-spin" />
              <span className="text-xs text-indigo-300 tracking-widest uppercase font-bold animate-pulse">Đang kết nối dữ liệu nhúng...</span>
            </div>
          )}

          {/* Core Iframe Element */}
          <iframe 
            key={`${activeTab}-${iframeKey}`}
            src={iframeUrls[activeTab]}
            onLoad={() => setIsIframeLoading(false)}
            className="w-full h-full border-none bg-transparent z-20"
            title={activeTitle}
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          />
        </main>
      </div>

      {/* Configuration Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentUrls={iframeUrls}
        onSave={handleSaveUrls}
      />
    </div>
  );
}

export default App;
