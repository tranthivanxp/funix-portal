import React from 'react';
import { 
  Home, 
  TrendingUp, 
  GraduationCap, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Compass
} from 'lucide-react';

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  isCollapsed, 
  setIsCollapsed, 
  onOpenSettings 
}) {
  const menuItems = [
    { id: 'overview', name: 'Tổng quan', icon: Home, color: 'text-indigo-400' },
    { id: 'b2c_mkt', name: 'B2C_MKT', icon: TrendingUp, color: 'text-amber-400' },
    { id: 'mentor', name: 'Mentor', icon: GraduationCap, color: 'text-emerald-400' }
  ];

  return (
    <aside 
      className={`bg-[#131b2e] border-r border-[#1e293b] flex flex-col justify-between transition-all duration-300 ease-in-out shrink-0 relative h-screen z-40 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Top Brand Logo */}
      <div className="flex flex-col">
        <div className={`p-5 flex items-center justify-between border-b border-[#1e293b] ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <span className="p-2 rounded-xl bg-gradient-to-tr from-indigo-500 to-brand-500 text-white shadow-lg shadow-indigo-500/20 shrink-0">
              <Compass size={22} className="animate-pulse-slow" />
            </span>
            {!isCollapsed && (
              <div className="flex flex-col leading-none animate-in fade-in slide-in-from-left-4 duration-300">
                <span className="font-extrabold text-white tracking-tight text-base">FUNiX Portal</span>
                <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider mt-0.5">Quản trị Tổng</span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-3 space-y-2 mt-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 group relative ${
                  isActive 
                    ? 'bg-gradient-to-r from-indigo-600 to-brand-600 text-white shadow-lg shadow-indigo-600/20' 
                    : 'text-slate-400 hover:text-white hover:bg-[#0b0f19]/60'
                }`}
              >
                <Icon 
                  size={20} 
                  className={`transition-transform duration-200 group-hover:scale-110 shrink-0 ${
                    isActive ? 'text-white' : item.color
                  }`} 
                />
                
                {!isCollapsed && (
                  <span className="animate-in fade-in duration-300 truncate">
                    {item.name}
                  </span>
                )}

                {/* Tooltip for collapsed mode */}
                {isCollapsed && (
                  <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-[#131b2e] border border-[#1e293b] text-white text-xs font-bold rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                    {item.name}
                  </div>
                )}

                {/* Left Active Glow bar */}
                {isActive && (
                  <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-white rounded-r-md"></div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Actions */}
      <div className="p-3 border-t border-[#1e293b] space-y-2">
        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white hover:bg-[#0b0f19]/60 transition-all group relative"
        >
          <Settings 
            size={20} 
            className="text-slate-400 transition-transform duration-200 group-hover:rotate-45 shrink-0" 
          />
          {!isCollapsed && (
            <span className="truncate">Cấu hình URL</span>
          )}
          
          {isCollapsed && (
            <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-[#131b2e] border border-[#1e293b] text-white text-xs font-bold rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
              Cấu hình URL
            </div>
          )}
        </button>

        {/* Collapse Toggle button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-sm font-semibold text-slate-500 hover:text-white hover:bg-[#0b0f19]/60 transition-all shrink-0"
        >
          {isCollapsed ? (
            <ChevronRight size={20} className="mx-auto" />
          ) : (
            <>
              <ChevronLeft size={20} className="shrink-0" />
              <span>Thu gọn Menu</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
