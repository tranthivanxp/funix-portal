import React, { useState, useEffect } from 'react';
import { X, Link2, RotateCcw, AlertTriangle, Info, Check } from 'lucide-react';

export default function SettingsModal({ isOpen, onClose, currentUrls, onSave }) {
  const [urls, setUrls] = useState({ overview: '', b2c_mkt: '', mentor: '', khaothi: '' });
  const [showSavedToast, setShowSavedToast] = useState(false);

  useEffect(() => {
    if (currentUrls) {
      setUrls(currentUrls);
    }
  }, [currentUrls, isOpen]);

  if (!isOpen) return null;

  const handleReset = () => {
    setUrls({
      overview: '?embed=overview',
      b2c_mkt: import.meta.env.VITE_B2C_MKT_URL || 'http://localhost:5173/',
      mentor: import.meta.env.VITE_MENTOR_URL || 'http://127.0.0.1:8080/',
      khaothi: '?embed=khaothi'
    });
  };

  const handleSave = (e) => {
    e.preventDefault();
    onSave(urls);
    setShowSavedToast(true);
    setTimeout(() => {
      setShowSavedToast(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      ></div>

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl bg-[#131b2e] border border-[#1e293b] rounded-2xl shadow-2xl p-6 md:p-8 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-extrabold text-white">Cấu hình liên kết Portal (Iframe URL)</h2>
            <p className="text-xs text-slate-400 mt-1">
              Bạn có thể điều hướng Iframe sang các liên kết dashboard thực tế của bạn (như PowerBI, Google Sheet, Metabase, v.v.).
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#0b0f19] border border-[#1e293b] text-slate-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Info Tip */}
        <div className="mb-6 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2.5 text-xs text-amber-300">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Lưu ý về nhúng Iframe:</span> Trình duyệt sẽ chặn nhúng các trang web bên ngoài cấu hình Header <code className="bg-black/30 px-1 py-0.5 rounded text-rose-300">X-Frame-Options: DENY</code> (như Google.com, Facebook.com). Vui lòng sử dụng các link nhúng (Embed link) được hỗ trợ.
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-5">
          <div className="space-y-4">
            {/* Overview Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">URL Tổng quan (Overview)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 pointer-events-none">
                  <Link2 size={16} />
                </span>
                <input 
                  type="text" 
                  value={urls.overview}
                  onChange={(e) => setUrls({...urls, overview: e.target.value})}
                  className="w-full bg-[#0b0f19] border border-[#1e293b] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  placeholder="Nhập URL nhúng tổng quan..."
                  required
                />
              </div>
            </div>

            {/* B2C_MKT Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">URL B2C_MKT</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 pointer-events-none">
                  <Link2 size={16} />
                </span>
                <input 
                  type="text" 
                  value={urls.b2c_mkt}
                  onChange={(e) => setUrls({...urls, b2c_mkt: e.target.value})}
                  className="w-full bg-[#0b0f19] border border-[#1e293b] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  placeholder="Nhập URL nhúng B2C Marketing..."
                  required
                />
              </div>
            </div>

            {/* Mentor Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">URL Mentor</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 pointer-events-none">
                  <Link2 size={16} />
                </span>
                <input 
                  type="text" 
                  value={urls.mentor}
                  onChange={(e) => setUrls({...urls, mentor: e.target.value})}
                  className="w-full bg-[#0b0f19] border border-[#1e293b] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  placeholder="Nhập URL nhúng Mentor..."
                  required
                />
              </div>
            </div>

            {/* Khao Thi Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">URL Khảo thí</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 pointer-events-none">
                  <Link2 size={16} />
                </span>
                <input 
                  type="text" 
                  value={urls.khaothi}
                  onChange={(e) => setUrls({...urls, khaothi: e.target.value})}
                  className="w-full bg-[#0b0f19] border border-[#1e293b] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  placeholder="Nhập URL nhúng Khảo thí..."
                  required
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-4 border-t border-[#1e293b] mt-6">
            <button 
              type="button"
              onClick={handleReset}
              className="flex items-center justify-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors py-2 px-3 rounded-lg hover:bg-indigo-500/5"
            >
              <RotateCcw size={14} />
              Khôi phục Link Mock mặc định
            </button>
            <div className="flex items-center gap-2">
              <button 
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none text-xs text-slate-400 hover:text-white transition-colors bg-transparent border border-[#1e293b] px-4 py-2 rounded-lg"
              >
                Hủy
              </button>
              <button 
                type="submit"
                className="flex-1 sm:flex-none text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/20"
              >
                {showSavedToast ? <Check size={14} /> : null}
                {showSavedToast ? 'Đang lưu...' : 'Lưu cấu hình'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
