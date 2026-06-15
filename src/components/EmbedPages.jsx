import React, { useState, useEffect } from 'react';
import { 
  Users, 
  GraduationCap, 
  Target, 
  DollarSign, 
  TrendingUp, 
  Activity, 
  Clock, 
  Star, 
  AlertTriangle,
  ArrowUpRight,
  TrendingDown,
  Layers,
  Award,
  Loader2
} from 'lucide-react';

// Common sub-components to make pages look premium

export function OverviewPage() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [b2cData, setB2cData] = useState(null);
  const [mentorData, setMentorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load data files from online URL or fallback to local public folder
  useEffect(() => {
    const b2cBaseUrl = import.meta.env.VITE_B2C_MKT_URL;
    const mentorBaseUrl = import.meta.env.VITE_MENTOR_URL;

    // Helper to strip trailing slash from URL
    const cleanUrl = (url) => {
      if (!url) return '';
      return url.endsWith('/') ? url.slice(0, -1) : url;
    };

    const fetchB2c = async () => {
      if (b2cBaseUrl) {
        try {
          const onlineUrl = `${cleanUrl(b2cBaseUrl)}/data.json`;
          const res = await fetch(onlineUrl);
          if (res.ok) {
            console.log('Successfully fetched B2C data from online source:', onlineUrl);
            return await res.json();
          }
        } catch (e) {
          console.warn('Failed to fetch online B2C data (CORS or network). Falling back to local copy.', e);
        }
      }
      const res = await fetch('/data/b2c_data.json');
      if (!res.ok) throw new Error('Không thể tải dữ liệu B2C');
      return await res.json();
    };

    const fetchMentor = async () => {
      if (mentorBaseUrl) {
        try {
          const onlineUrl = `${cleanUrl(mentorBaseUrl)}/mentor_data.json`;
          const res = await fetch(onlineUrl);
          if (res.ok) {
            console.log('Successfully fetched Mentor data from online source:', onlineUrl);
            return await res.json();
          }
        } catch (e) {
          console.warn('Failed to fetch online Mentor data (CORS or network). Falling back to local copy.', e);
        }
      }
      const res = await fetch('/data/mentor_data.json');
      if (!res.ok) throw new Error('Không thể tải dữ liệu Mentor');
      return await res.json();
    };

    Promise.all([fetchB2c(), fetchMentor()])
      .then(([b2c, mentor]) => {
        setB2cData(b2c);
        setMentorData(mentor);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const isDateInRange = (dateStr) => {
    if (!dateStr) return false;
    const d = dateStr.substring(0, 10); // YYYY-MM-DD
    
    // Data is only updated up to May 2026. Any dates in June 2026 or later are considered empty.
    if (d > '2026-05-31') return false;

    if (!startDate && !endDate) return true; // No filter: show all up to May 31
    if (startDate && d < startDate) return false;
    if (endDate && d > endDate) return false;
    return true;
  };

  const isMonthInDateRange = (monthStr) => {
    if (!monthStr) return false; // YYYY-MM
    
    // Data is only updated up to May 2026.
    if (monthStr > '2026-05') return false;

    if (!startDate && !endDate) return true;
    const startMonth = startDate ? startDate.substring(0, 7) : '0000-00';
    const endMonth = endDate ? endDate.substring(0, 7) : '9999-12';
    return monthStr >= startMonth && monthStr <= endMonth;
  };

  // 1. Loading and Error States
  if (loading) {
    return (
      <div className="p-8 bg-slate-50 min-h-screen text-slate-700 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <span className="text-sm font-semibold text-slate-500">Đang đồng bộ dữ liệu Excel thực tế...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-slate-50 min-h-screen text-slate-700 flex flex-col items-center justify-center gap-3 text-center">
        <AlertTriangle className="w-12 h-12 text-rose-500" />
        <span className="text-base font-bold text-slate-900">Lỗi kết nối dữ liệu báo cáo</span>
        <p className="text-xs text-slate-500 max-w-md">{error}</p>
        <p className="text-xs text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg p-2.5 mt-2">
          Mẹo: Hãy đảm bảo các file Excel của 2 dashboard được cấu hình và chạy script sync_data thành công.
        </p>
      </div>
    );
  }

  // 2. Calculations based on loaded data and filters
  // A. Active Students (Unique counts in askSessions + zoomSessions + B2C sales ID)
  const activeStudents = new Set();
  if (b2cData && b2cData.portalSales) {
    b2cData.portalSales.forEach(row => {
      if (isDateInRange(row.date) && row.id) {
        activeStudents.add('b2c-' + row.id);
      }
    });
  }
  if (mentorData && mentorData.askSessions) {
    mentorData.askSessions.forEach(row => {
      if (isDateInRange(row.date) && row.student) {
        activeStudents.add('mentor-' + row.student);
      }
    });
  }
  if (mentorData && mentorData.zoomSessions) {
    mentorData.zoomSessions.forEach(row => {
      if (isDateInRange(row.date) && row.student) {
        activeStudents.add('zoom-' + row.student);
      }
    });
  }
  const totalActiveStudents = activeStudents.size;

  // B. Active Mentors
  const activeMentors = new Set();
  if (mentorData && mentorData.askSessions) {
    mentorData.askSessions.forEach(row => {
      if (isDateInRange(row.date) && row.mentor) {
        activeMentors.add(row.mentor.toLowerCase().trim());
      }
    });
  }
  if (mentorData && mentorData.zoomSessions) {
    mentorData.zoomSessions.forEach(row => {
      if (isDateInRange(row.date) && row.mentor) {
        activeMentors.add(row.mentor.toLowerCase().trim());
      }
    });
  }
  const totalActiveMentors = activeMentors.size;

  // C. Active Marketing Campaigns (Products with actual spending or leads)
  const activeCampaigns = new Set();
  if (b2cData && b2cData.productDetails) {
    b2cData.productDetails.forEach(row => {
      if (isMonthInDateRange(row.month)) {
        if (row.adsExpActual > 0 || row.leadActual > 0 || row.neActual > 0) {
          activeCampaigns.add(row.product);
        }
      }
    });
  }
  const totalActiveCampaigns = activeCampaigns.size;

  // D. Revenue
  let totalRevenue = 0;
  if (b2cData && b2cData.portalSales) {
    b2cData.portalSales.forEach(row => {
      if (isDateInRange(row.date)) {
        totalRevenue += row.amount || 0;
      }
    });
  }

  // E. Chart Values (Activity breakdown by day of week)
  const dailyCounts = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  if (mentorData && mentorData.askSessions) {
    mentorData.askSessions.forEach(row => {
      if (isDateInRange(row.date)) {
        const d = new Date(row.date);
        const day = d.getDay();
        dailyCounts[day] = (dailyCounts[day] || 0) + 1;
      }
    });
  }
  if (mentorData && mentorData.zoomSessions) {
    mentorData.zoomSessions.forEach(row => {
      if (isDateInRange(row.date)) {
        const d = new Date(row.date);
        const day = d.getDay();
        dailyCounts[day] = (dailyCounts[day] || 0) + 1;
      }
    });
  }
  const maxCount = Math.max(...Object.values(dailyCounts));
  const chartValues = [
    { day: 'Thứ 2', val: maxCount > 0 ? Math.round((dailyCounts[1] / maxCount) * 100) + '%' : '0%' },
    { day: 'Thứ 3', val: maxCount > 0 ? Math.round((dailyCounts[2] / maxCount) * 100) + '%' : '0%' },
    { day: 'Thứ 4', val: maxCount > 0 ? Math.round((dailyCounts[3] / maxCount) * 100) + '%' : '0%' },
    { day: 'Thứ 5', val: maxCount > 0 ? Math.round((dailyCounts[4] / maxCount) * 100) + '%' : '0%' },
    { day: 'Thứ 6', val: maxCount > 0 ? Math.round((dailyCounts[5] / maxCount) * 100) + '%' : '0%' },
    { day: 'Thứ 7', val: maxCount > 0 ? Math.round((dailyCounts[6] / maxCount) * 100) + '%' : '0%' },
    { day: 'Chủ nhật', val: maxCount > 0 ? Math.round((dailyCounts[0] / maxCount) * 100) + '%' : '0%' }
  ];

  // F. Recent Activities from actual sessions
  const getFilteredActivities = () => {
    const list = [];
    if (mentorData && mentorData.askSessions) {
      mentorData.askSessions.forEach(s => {
        if (isDateInRange(s.date)) {
          list.push({
            student: s.student ? s.student.split('@')[0].toUpperCase() : 'XTER',
            course: s.subject || 'Khóa học',
            action: `Hỏi Mentor (${s.type === 'livechat' ? 'Live Chat' : 'Hanging'})`,
            time: new Date(s.date).toLocaleDateString('vi-VN'),
            status: s.helpful === 'Helpful' ? 'Đã giải đáp' : 'Chờ duyệt',
            rawDate: new Date(s.date)
          });
        }
      });
    }
    if (mentorData && mentorData.zoomSessions) {
      mentorData.zoomSessions.forEach(s => {
        if (isDateInRange(s.date)) {
          list.push({
            student: s.student ? s.student.split('@')[0].toUpperCase() : 'XTER',
            course: s.subject || 'Khóa học',
            action: `Đặt lịch Zoom (${s.status})`,
            time: new Date(s.date).toLocaleDateString('vi-VN'),
            status: s.isSuccess ? 'Đã hoàn thành' : 'Đã hủy',
            rawDate: new Date(s.date)
          });
        }
      });
    }
    return list.sort((a, b) => b.rawDate - a.rawDate).slice(0, 4);
  };
  const activitiesList = getFilteredActivities();

  // Stats display configuration
  const formatRevenue = (rev) => {
    if (rev === 0) return '0 VNĐ';
    if (rev >= 1e9) return (rev / 1e9).toFixed(2) + 'B VNĐ';
    return (rev / 1e6).toFixed(1) + 'M VNĐ';
  };

  const stats = [
    { label: 'Học viên Hoạt động', value: totalActiveStudents.toLocaleString(), change: totalActiveStudents > 0 ? 'Dữ liệu Excel' : 'Không có', isUp: totalActiveStudents > 0, icon: Users, color: 'from-blue-500 to-indigo-600' },
    { label: 'Mentor Hoạt động', value: totalActiveMentors.toLocaleString(), change: totalActiveMentors > 0 ? 'Dữ liệu Excel' : 'Không có', isUp: totalActiveMentors > 0, icon: GraduationCap, color: 'from-emerald-500 to-teal-600' },
    { label: 'Chiến dịch MKT Chạy', value: totalActiveCampaigns.toLocaleString(), change: totalActiveCampaigns > 0 ? 'B2C Products' : 'Không có', isUp: totalActiveCampaigns > 0, icon: Target, color: 'from-amber-500 to-orange-600' },
    { label: 'Doanh thu', value: formatRevenue(totalRevenue), change: totalRevenue > 0 ? 'B2C Sales' : 'Không có', isUp: totalRevenue > 0, icon: DollarSign, color: 'from-fuchsia-500 to-purple-600' }
  ];

  return (
    <div className="p-6 md:p-8 bg-slate-50 min-h-screen text-slate-700 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between mb-8 pb-5 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
            <span className="bg-gradient-to-r from-indigo-500 to-brand-500 w-2 h-8 rounded-full inline-block"></span>
            Tổng quan Hệ thống
          </h1>
          <p className="text-sm text-slate-500 mt-1">Dữ liệu tổng hợp thời gian thực được trích xuất trực tiếp từ báo cáo Excel.</p>
        </div>
        
        {/* Date Filters & Live Badge */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm text-xs font-medium">
            <span className="text-slate-505">Từ ngày</span>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-slate-200 rounded px-1.5 py-0.5 focus:outline-none focus:border-indigo-500 text-slate-800 font-semibold cursor-pointer"
            />
            <span className="text-slate-300">|</span>
            <span className="text-slate-505">Đến ngày</span>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-slate-200 rounded px-1.5 py-0.5 focus:outline-none focus:border-indigo-500 text-slate-800 font-semibold cursor-pointer"
            />
            {(startDate || endDate) && (
              <button 
                type="button"
                onClick={() => { setStartDate(''); setEndDate(''); }}
                className="ml-2 text-indigo-600 hover:text-indigo-800 font-bold transition-colors cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl border border-emerald-200 shadow-sm shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="font-semibold">Đang kết nối Excel</span>
          </div>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div key={idx} className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 transition-all duration-300 hover:border-slate-300 hover:translate-y-[-2px] hover:shadow-md">
              <div className="flex justify-between items-start">
                <span className="text-slate-500 text-xs font-semibold tracking-wider uppercase">{s.label}</span>
                <span className={`p-2 rounded-xl bg-gradient-to-br ${s.color} text-white shadow-lg`}>
                  <Icon size={20} />
                </span>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">{s.value}</span>
                <span className={`text-xs font-bold flex items-center gap-0.5 ${s.isUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {s.isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {s.change}
                </span>
              </div>
              <div className="mt-2 text-slate-400 text-xs">Phạm vi thời gian được chọn</div>
            </div>
          );
        })}
      </div>

      {/* Detail Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Chart mock and learning activity) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 shadow-sm rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Activity size={18} className="text-indigo-500" />
              Lưu lượng Truy cập Học tập (Phân phối tuần)
            </h2>
            <span className="text-xs text-indigo-600 font-semibold cursor-pointer hover:underline">Chi tiết</span>
          </div>
          
          {/* Simple pure-CSS chart */}
          <div className="h-64 flex items-end justify-between gap-2 pt-6 px-2 border-b border-slate-200 mb-4">
            {chartValues.map((d, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                <div 
                  style={{ height: d.val }} 
                  className="w-full max-w-[32px] rounded-t-lg bg-gradient-to-t from-indigo-700 to-indigo-500 relative transition-all duration-500 hover:brightness-125"
                >
                  <div className="absolute top-[-30px] left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                    {d.val}
                  </div>
                </div>
                <span className="text-[10px] text-slate-500 mt-2 font-medium">{d.day}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-between text-xs text-slate-600 mt-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-indigo-500"></span>
              <span>Lượt làm bài và Zoom thành công</span>
            </div>
            <span>Đơn vị: % Phân phối công suất</span>
          </div>
        </div>

        {/* Right Column (Recent student submission activities) */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-900">Hoạt động Gần đây</h2>
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
          </div>
          
          <div className="space-y-4">
            {activitiesList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
                <Activity size={24} className="text-slate-300" />
                <span className="text-xs text-slate-400 font-semibold">Không có hoạt động</span>
                <p className="text-[10px] text-slate-400 max-w-[180px] font-light">Không tìm thấy hoạt động của Xter nào trong khoảng thời gian này.</p>
              </div>
            ) : (
              activitiesList.map((act, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-100/50 transition-colors">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold text-sm text-slate-800">{act.student}</span>
                    <span className="text-[10px] text-slate-400">{act.time}</span>
                  </div>
                  <div className="text-xs text-slate-500 font-light truncate">{act.course}</div>
                  <div className="text-xs text-indigo-600 mt-1 font-semibold">{act.action}</div>
                  <div className="mt-2 flex justify-between items-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                      act.status === 'Đã hoàn thành' || act.status === 'Đã giải đáp' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                      act.status === 'Đang trả lời' || act.status === 'Chờ duyệt' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-rose-50 text-rose-700 border-rose-100'
                    }`}>
                      {act.status}
                    </span>
                    <button className="text-slate-400 hover:text-slate-700 transition-colors">
                      <ArrowUpRight size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function B2cMktPage() {
  const campaigns = [
    { name: 'Khóa học ReactJS Hè 2026', channel: 'Facebook Ads', spent: '45M', leads: '320', conversion: '8.5%', status: 'Active' },
    { name: 'Học bổng Mentor Dẫn đường', channel: 'Google Search', spent: '30M', leads: '180', conversion: '6.2%', status: 'Active' },
    { name: 'Lập trình viên AI Cơ bản', channel: 'Tiktok Video', spent: '62M', leads: '540', conversion: '11.2%', status: 'Active' },
    { name: 'Kỹ thuật Phần mềm (Bằng ĐH)', channel: 'Youtube Ads', spent: '80M', leads: '210', conversion: '4.8%', status: 'Pending' },
    { name: 'Nhập môn IT cho người mới', channel: 'Email Marketing', spent: '5M', leads: '98', conversion: '18.4%', status: 'Completed' }
  ];

  return (
    <div className="p-6 md:p-8 bg-[#0b0f19] min-height-screen text-slate-100 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 pb-5 border-b border-[#1e293b]">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <span className="bg-gradient-to-r from-amber-500 to-orange-500 w-2 h-8 rounded-full inline-block"></span>
            Phân tích B2C Marketing
          </h1>
          <p className="text-sm text-slate-400 mt-1">Theo dõi phễu marketing, doanh số chuyển đổi và chi phí quảng cáo.</p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-2">
          <span className="bg-[#131b2e] border border-[#1e293b] text-slate-300 text-xs px-3 py-1.5 rounded-lg">Tháng 06/2026</span>
        </div>
      </div>

      {/* MKT Overview Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-[#131b2e] border border-[#1e293b] rounded-2xl p-6">
          <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Tổng ngân sách chi tiêu</div>
          <div className="text-3xl font-extrabold text-white mt-2">222.0M VNĐ</div>
          <div className="text-xs text-emerald-400 mt-2 font-medium flex items-center gap-1">
            <TrendingUp size={14} /> +15% so với tháng trước
          </div>
        </div>
        <div className="bg-[#131b2e] border border-[#1e293b] rounded-2xl p-6">
          <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Giá trị Lead trung bình (CPL)</div>
          <div className="text-3xl font-extrabold text-white mt-2">164,000 VNĐ</div>
          <div className="text-xs text-rose-400 mt-2 font-medium flex items-center gap-1">
            <TrendingDown size={14} /> -8.5% (Tốt - chi phí giảm)
          </div>
        </div>
        <div className="bg-[#131b2e] border border-[#1e293b] rounded-2xl p-6">
          <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Tỷ lệ Chuyển đổi Cuối (CR)</div>
          <div className="text-3xl font-extrabold text-white mt-2">7.4%</div>
          <div className="text-xs text-emerald-400 mt-2 font-medium flex items-center gap-1">
            <TrendingUp size={14} /> +1.2% so với mục tiêu
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Marketing Funnel */}
        <div className="lg:col-span-2 bg-[#131b2e] border border-[#1e293b] rounded-2xl p-6 flex flex-col">
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Layers size={18} className="text-amber-400" />
            Phễu Chuyển đổi Marketing
          </h2>
          
          {/* Funnel Layout */}
          <div className="flex-1 flex flex-col justify-between space-y-4">
            {[
              { step: 'Ấn tượng (Impressions)', val: '520,000', pct: '100%', bg: 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300' },
              { step: 'Truy cập (Clicks)', val: '84,200', pct: '16.2%', bg: 'bg-purple-600/20 border-purple-500/50 text-purple-300' },
              { step: 'Cơ hội (Leads)', val: '12,500', pct: '2.4%', bg: 'bg-pink-600/20 border-pink-500/50 text-pink-300' },
              { step: 'Đăng ký học (Enrollments)', val: '925', pct: '0.18%', bg: 'bg-emerald-600/20 border-emerald-500/50 text-emerald-300' }
            ].map((item, idx) => (
              <div key={idx} className="relative">
                <div className={`p-4 border rounded-xl flex justify-between items-center transition-all hover:scale-[1.01] ${item.bg}`}>
                  <div>
                    <span className="text-xs opacity-75 uppercase tracking-wider block font-semibold">{item.step}</span>
                    <span className="text-lg font-bold mt-1 block">{item.val}</span>
                  </div>
                  <span className="text-sm font-black bg-black/30 px-2.5 py-1 rounded-lg">{item.pct}</span>
                </div>
                {idx < 3 && (
                  <div className="flex justify-center my-1">
                    <div className="w-0.5 h-4 bg-slate-700"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Campaign List */}
        <div className="lg:col-span-3 bg-[#131b2e] border border-[#1e293b] rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-6">Hiệu suất Chiến dịch Hiện tại</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs uppercase bg-[#0b0f19] text-slate-400">
                <tr>
                  <th className="p-3 rounded-l-lg">Chiến dịch</th>
                  <th className="p-3">Chi tiêu</th>
                  <th className="p-3">Leads</th>
                  <th className="p-3">CR</th>
                  <th className="p-3 rounded-r-lg">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b]">
                {campaigns.map((camp, idx) => (
                  <tr key={idx} className="hover:bg-[#0b0f19]/30 transition-colors">
                    <td className="p-3">
                      <div className="font-semibold text-white">{camp.name}</div>
                      <div className="text-[11px] text-slate-500">{camp.channel}</div>
                    </td>
                    <td className="p-3 font-medium text-slate-200">{camp.spent}</td>
                    <td className="p-3 font-semibold text-indigo-400">{camp.leads}</td>
                    <td className="p-3 text-emerald-400 font-bold">{camp.conversion}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        camp.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        camp.status === 'Pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-slate-700/30 text-slate-400 border border-slate-700/20'
                      }`}>
                        {camp.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MentorPage() {
  const mentors = [
    { name: 'Nguyễn Văn Anh', title: 'React & Frontend Expert', rating: 4.9, cases: 142, speed: '4.8 phút', status: 'Online' },
    { name: 'Trần Thị Bích', title: 'Python & Machine Learning Specialist', rating: 4.85, cases: 98, speed: '6.2 phút', status: 'Online' },
    { name: 'Lê Hoàng Cường', title: 'Java & Spring Boot Architect', rating: 4.78, cases: 110, speed: '8.5 phút', status: 'Offline' },
    { name: 'Phạm Minh Đức', title: 'HTML/CSS & UI/UX Expert', rating: 4.95, cases: 165, speed: '3.2 phút', status: 'Online' },
    { name: 'Vũ Thùy Dương', title: 'NodeJS & Database Administrator', rating: 4.82, cases: 75, speed: '9.0 phút', status: 'Away' }
  ];

  return (
    <div className="p-6 md:p-8 bg-[#0b0f19] min-height-screen text-slate-100 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 pb-5 border-b border-[#1e293b]">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <span className="bg-gradient-to-r from-emerald-500 to-teal-500 w-2 h-8 rounded-full inline-block"></span>
            Quản lý Đội ngũ Mentor
          </h1>
          <p className="text-sm text-slate-400 mt-1">Theo dõi hoạt động trả lời, chất lượng đánh giá và hàng đợi câu hỏi.</p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-2">
          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            142 Mentor Online
          </span>
        </div>
      </div>

      {/* Mentor Quality Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-[#131b2e] border border-[#1e293b] rounded-2xl p-6">
          <div className="flex items-center gap-2">
            <Star size={18} className="text-amber-400 fill-amber-400" />
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Đánh giá Trung bình</span>
          </div>
          <div className="text-3xl font-extrabold text-white mt-3">4.86 / 5.0</div>
          <div className="text-[11px] text-slate-500 mt-1">Từ 12,500 lượt review học viên</div>
        </div>

        <div className="bg-[#131b2e] border border-[#1e293b] rounded-2xl p-6">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-indigo-400" />
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Tốc độ Phản hồi</span>
          </div>
          <div className="text-3xl font-extrabold text-white mt-3">6.4 phút</div>
          <div className="text-[11px] text-slate-500 mt-1">Đạt chỉ tiêu SLA (&lt; 10 phút)</div>
        </div>

        <div className="bg-[#131b2e] border border-[#1e293b] rounded-2xl p-6">
          <div className="flex items-center gap-2">
            <Award size={18} className="text-emerald-400" />
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Tỷ lệ Giải quyết (First Contact)</span>
          </div>
          <div className="text-3xl font-extrabold text-white mt-3">92.4%</div>
          <div className="text-[11px] text-slate-500 mt-1">Giải quyết ngay câu hỏi đầu tiên</div>
        </div>

        <div className="bg-[#131b2e] border border-[#1e293b] rounded-2xl p-6">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-rose-400 animate-pulse" />
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Hàng đợi Đang chờ</span>
          </div>
          <div className="text-3xl font-extrabold text-white mt-3">12 câu hỏi</div>
          <div className="text-[11px] text-rose-400 mt-1">Có 2 câu hỏi chờ quá 15 phút</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mentor Directory */}
        <div className="lg:col-span-2 bg-[#131b2e] border border-[#1e293b] rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-6">Danh sách Mentor Tiêu biểu</h2>
          <div className="space-y-4">
            {mentors.map((m, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 bg-[#0b0f19]/40 border border-[#1e293b] rounded-xl hover:border-slate-700 transition-all">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-sm text-indigo-300">
                      {m.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#131b2e] ${
                      m.status === 'Online' ? 'bg-emerald-500' :
                      m.status === 'Away' ? 'bg-amber-500' : 'bg-slate-500'
                    }`}></span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-white">{m.name}</h3>
                    <p className="text-[11px] text-slate-400">{m.title}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center justify-end gap-1 text-amber-400 text-sm font-bold">
                    <Star size={14} className="fill-amber-400" />
                    {m.rating}
                  </div>
                  <div className="text-[10px] text-slate-500">{m.cases} câu hỏi • SLA: {m.speed}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Question Queue Alert */}
        <div className="bg-[#131b2e] border border-[#1e293b] rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-6">Cảnh báo SLA Hàng đợi</h2>
          
          <div className="space-y-4">
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl">
              <div className="flex justify-between items-start">
                <span className="bg-rose-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded">Cần hỗ trợ gấp</span>
                <span className="text-xs text-rose-400 font-bold">18 phút trước</span>
              </div>
              <h4 className="font-bold text-sm text-rose-300 mt-2">Học viên: Trần Anh Dũng</h4>
              <p className="text-xs text-slate-300 mt-1 font-light italic">"Em chạy npm start của dự án NextJS thì báo lỗi Module not found: Can't resolve..."</p>
              <div className="mt-4 flex gap-2">
                <button className="bg-rose-600 hover:bg-rose-500 text-white text-xs px-3 py-1.5 rounded-lg transition-colors font-medium">Bố trí Mentor ngay</button>
                <button className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-3 py-1.5 rounded-lg transition-colors font-medium">Bỏ qua</button>
              </div>
            </div>

            <div className="p-4 bg-[#0b0f19]/60 border border-[#1e293b] rounded-xl">
              <div className="flex justify-between items-start">
                <span className="bg-amber-500 text-black text-[9px] font-black uppercase px-2 py-0.5 rounded">Cận SLA</span>
                <span className="text-xs text-slate-400 font-bold">9 phút trước</span>
              </div>
              <h4 className="font-bold text-sm text-slate-200 mt-2">Học viên: Hoàng Thúy Vy</h4>
              <p className="text-xs text-slate-400 mt-1 font-light italic">"Mentor giải thích giúp em sự khác nhau giữa useEffect và useLayoutEffect..."</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Router component dynamically rendering based on path/search query
export default function EmbedRouter() {
  const params = new URLSearchParams(window.location.search);
  const embed = params.get('embed');

  if (embed === 'overview') return <OverviewPage />;
  if (embed === 'b2c_mkt') return <B2cMktPage />;
  if (embed === 'mentor') return <MentorPage />;

  return (
    <div className="p-8 flex flex-col items-center justify-center min-h-screen text-center bg-[#0b0f19]">
      <h2 className="text-xl font-bold text-rose-400">Không tìm thấy trang nhúng</h2>
      <p className="text-sm text-slate-400 mt-2">Vui lòng cung cấp tham số query hợp lệ (ví dụ: ?embed=overview)</p>
    </div>
  );
}
