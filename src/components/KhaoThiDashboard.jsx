import React, { useState, useEffect } from 'react';
import { 
  ClipboardCheck, 
  CalendarCheck, 
  FileCheck2, 
  TrendingUp, 
  TrendingDown, 
  HelpCircle,
  Award,
  AlertCircle,
  Filter,
  Layers,
  BookOpen,
  ArrowUpDown
} from 'lucide-react';

// Robust date parser for both YYYY-MM-DD and DD/MM/YYYY formats
function parseDate(str) {
  if (!str) return null;
  str = String(str).trim();
  if (str.toLowerCase() === 'none' || str === '') return null;
  
  // Format: YYYY-MM-DD HH:MM:SS or YYYY-MM-DD
  if (str.includes('-')) {
    const isoStr = str.replace(' ', 'T');
    const d = new Date(isoStr);
    if (!isNaN(d.getTime())) return d;
  }
  
  // Format: DD/MM/YYYY HH:MM:SS or DD/MM/YYYY
  if (str.includes('/')) {
    const parts = str.split(' ');
    const dateParts = parts[0].split('/');
    if (dateParts.length === 3) {
      const day = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10) - 1; // 0-indexed
      const year = parseInt(dateParts[2], 10);
      
      let hour = 0, minute = 0, second = 0;
      if (parts[1]) {
        const timeParts = parts[1].split(':');
        hour = parseInt(timeParts[0], 10) || 0;
        minute = parseInt(timeParts[1], 10) || 0;
        second = parseInt(timeParts[2], 10) || 0;
      }
      const d = new Date(year, month, day, hour, minute, second);
      if (!isNaN(d.getTime())) return d;
    }
  }
  
  const fallback = new Date(str);
  return isNaN(fallback.getTime()) ? null : fallback;
}

// Convert column [Điểm tổng] to float safely
function parseGrade(val) {
  if (!val) return null;
  val = String(val).trim().replace(',', '.');
  const num = parseFloat(val);
  return isNaN(num) ? null : num;
}

// Helper to extract course code from the "instance" column
function getCourseCode(instance) {
  if (!instance) return 'N/A';
  instance = String(instance).trim();
  const match = instance.match(/^([A-Za-z0-9]+)/);
  return match ? match[1] : instance;
}

export default function KhaoThiDashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filtering states
  const [filterType, setFilterType] = useState('week'); // 'week' | 'month'
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [weeksList, setWeeksList] = useState([]);
  const [monthsList, setMonthsList] = useState([]);
  
  // Ranking toggle
  const [rankingSortKey, setRankingSortKey] = useState('count'); // 'count' | 'passRate'

  // Fetch data on mount
  useEffect(() => {
    const sheetUrl = "https://docs.google.com/spreadsheets/d/1CkYyhewjNOIuYrMhtNP5pUF05C-hv8vTkaBbdbPMoUQ/export?format=csv&gid=1035019380";
    
    const parseCSV = (text) => {
      const lines = [];
      let row = [""];
      let inQuotes = false;
      
      for (let i = 0; i < text.length; i++) {
        const c = text[i];
        const next = text[i+1];
        
        if (c === '"') {
          if (inQuotes && next === '"') {
            row[row.length - 1] += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (c === ',' && !inQuotes) {
          row.push("");
        } else if ((c === '\r' || c === '\n') && !inQuotes) {
          if (c === '\r' && next === '\n') {
            i++;
          }
          lines.push(row);
          row = [""];
        } else {
          row[row.length - 1] += c;
        }
      }
      if (row.length > 1 || row[0] !== "") {
        lines.push(row);
      }
      return lines;
    };

    const loadData = async () => {
      try {
        setLoading(true);
        let text = "";
        
        // Try fetching live data first
        try {
          const res = await fetch(sheetUrl);
          if (res.ok) {
            text = await res.text();
            console.log("KhaoThi: Loaded live data from Google Sheet");
          }
        } catch (e) {
          console.warn("KhaoThi: CORS or network error, falling back to local cached copy", e);
        }

        // Fallback to local copy
        if (!text) {
          const res = await fetch('/data/khaothi_data.json');
          if (!res.ok) {
            throw new Error("Không thể tải dữ liệu Khảo thí (cả online và offline)");
          }
          const jsonData = await res.json();
          setData(jsonData);
          processInitialMetadata(jsonData);
          setLoading(false);
          return;
        }

        // Process fetched CSV text
        const rows = parseCSV(text);
        if (rows.length > 0) {
          const headers = rows[0].map(h => h.trim());
          const records = [];
          for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (row.length < headers.length) continue;
            if (row.every(cell => !cell || cell.trim() === "")) continue;
            
            const obj = {};
            headers.forEach((header, index) => {
              if (header) {
                obj[header] = (row[index] || "").trim();
              }
            });
            records.push(obj);
          }
          setData(records);
          processInitialMetadata(records);
        } else {
          throw new Error("Dữ liệu CSV trống");
        }
        setLoading(false);
      } catch (err) {
        console.error("Lỗi tải dữ liệu Khảo thí:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Process weeks and months list from raw data
  const processInitialMetadata = (records) => {
    // 1. Weeks list
    const weeks = [...new Set(records.map(r => r.Week).filter(Boolean))].sort();
    setWeeksList(weeks);

    // 2. Months list
    const months = [...new Set(records.map(r => {
      const dateVal = r['Start date (Mon.)'] || r['Thời gian HV nộp'];
      const dateObj = parseDate(dateVal);
      if (!dateObj) return null;
      const y = dateObj.getFullYear();
      const m = String(dateObj.getMonth() + 1).padStart(2, '0');
      return `${y}-${m}`;
    }).filter(Boolean))].sort();
    setMonthsList(months);

    // Set default selected period to latest
    if (filterType === 'week' && weeks.length > 0) {
      setSelectedPeriod(weeks[weeks.length - 1]);
    } else if (filterType === 'month' && months.length > 0) {
      setSelectedPeriod(months[months.length - 1]);
    }
  };

  // Keep dropdown default updated when filterType changes
  useEffect(() => {
    if (data.length === 0) return;
    if (filterType === 'week' && weeksList.length > 0) {
      setSelectedPeriod(weeksList[weeksList.length - 1]);
    } else if (filterType === 'month' && monthsList.length > 0) {
      setSelectedPeriod(monthsList[monthsList.length - 1]);
    }
  }, [filterType, weeksList, monthsList]);

  if (loading) {
    return (
      <div className="p-8 bg-[#0b0f19] min-h-screen text-slate-300 flex flex-col items-center justify-center gap-3">
        <span className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></span>
        <span className="text-sm font-semibold tracking-wider text-indigo-400">Đang đồng bộ dữ liệu Khảo thí 2025-2026...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-[#0b0f19] min-h-screen text-slate-300 flex flex-col items-center justify-center gap-3 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500" />
        <span className="text-base font-bold text-white">Lỗi kết nối dữ liệu Khảo thí</span>
        <p className="text-xs text-slate-400 max-w-md">{error}</p>
      </div>
    );
  }

  // Helper to check if record matches selected period
  const matchesPeriod = (row, period) => {
    if (!period) return false;
    if (filterType === 'week') {
      return row.Week === period;
    } else {
      const dateVal = row['Start date (Mon.)'] || row['Thời gian HV nộp'];
      const dateObj = parseDate(dateVal);
      if (!dateObj) return false;
      const y = dateObj.getFullYear();
      const m = String(dateObj.getMonth() + 1).padStart(2, '0');
      return `${y}-${m}` === period;
    }
  };

  // Find previous period for comparison
  const getPreviousPeriod = () => {
    if (filterType === 'week') {
      const idx = weeksList.indexOf(selectedPeriod);
      return idx > 0 ? weeksList[idx - 1] : null;
    } else {
      const idx = monthsList.indexOf(selectedPeriod);
      return idx > 0 ? monthsList[idx - 1] : null;
    }
  };

  const prevPeriod = getPreviousPeriod();

  // Filter current and previous datasets
  const currentRows = data.filter(r => matchesPeriod(r, selectedPeriod));
  const prevRows = prevPeriod ? data.filter(r => matchesPeriod(r, prevPeriod)) : [];

  // Calculate KPIs for a given set of rows
  const calculateKPIs = (rows) => {
    let labAsmDenom = 0;
    let labAsmNum = 0;
    
    let examDenom = 0;
    let examNum = 0;
    
    let interviewDenom = 0;
    let interviewNum = 0;
    
    let totalSubmissions = rows.length;

    rows.forEach(row => {
      const type = row['Loại thành phần điểm'];
      const hvSub = parseDate(row['Thời gian HV nộp']);
      const menSub = parseDate(row['Thời gian mentor nộp cuối']);
      const interview = parseDate(row['Lịch interview']);
      const cancelReason = row['Lý do hủy'];

      // 1. KPI Lab, ASM (Mục tiêu 96% trong 3 ngày)
      if (type === 'Assignment' || type === 'Lab') {
        if (hvSub && menSub) {
          labAsmDenom++;
          const diffDays = (menSub - hvSub) / (1000 * 3600 * 24);
          if (diffDays <= 3.0) {
            labAsmNum++;
          }
        }
      }

      // 2. KPI Trả Điểm Thi (Mục tiêu 98% trong 2 ngày)
      if (type === 'Final Exam' || type === 'FE_ENG') {
        const start = interview ? interview : hvSub;
        if (start && menSub) {
          examDenom++;
          const diffDays = (menSub - start) / (1000 * 3600 * 24);
          if (diffDays <= 2.0) {
            examNum++;
          }
        }
      }

      // 3. KPI Tổ Chức Thi Đúng Lịch (Mục tiêu 97%)
      const hasInterview = row['Lịch interview'] && row['Lịch interview'].toLowerCase() !== 'none';
      if (hasInterview) {
        interviewDenom++;
        if (!cancelReason || cancelReason.toLowerCase() === 'none') {
          interviewNum++;
        }
      }
    });

    return {
      labAsmRate: labAsmDenom > 0 ? (labAsmNum / labAsmDenom * 100) : null,
      labAsmNum,
      labAsmDenom,
      examRate: examDenom > 0 ? (examNum / examDenom * 100) : null,
      examNum,
      examDenom,
      interviewRate: interviewDenom > 0 ? (interviewNum / interviewDenom * 100) : null,
      interviewNum,
      interviewDenom,
      totalSubmissions
    };
  };

  const currentKPIs = calculateKPIs(currentRows);
  const prevKPIs = calculateKPIs(prevRows);

  // Helper to format change rate WoW or MoM
  const renderKPIChange = (currentVal, prevVal, isRate = true) => {
    if (currentVal === null || prevVal === null) {
      return <span className="text-slate-500 text-xs font-medium">Không có dữ liệu so sánh</span>;
    }
    const diff = currentVal - prevVal;
    const isUp = diff >= 0;
    const formatted = Math.abs(diff).toFixed(1);
    
    return (
      <div className={`flex items-center gap-1 text-xs font-bold ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
        {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
        <span>{isUp ? '+' : '-'}{formatted}{isRate ? '%' : ''}</span>
        <span className="text-slate-400 font-normal">so với kỳ trước</span>
      </div>
    );
  };

  const renderSubmissionsChange = () => {
    const cur = currentKPIs.totalSubmissions;
    const prev = prevKPIs.totalSubmissions;
    if (!prev) return <span className="text-slate-500 text-xs">Kỳ trước không có bài</span>;
    
    const pct = ((cur - prev) / prev * 100);
    const isUp = pct >= 0;
    return (
      <div className={`flex items-center gap-1 text-xs font-bold ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
        {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
        <span>{isUp ? '+' : ''}{Math.abs(pct).toFixed(1)}%</span>
        <span className="text-slate-400 font-normal">({cur - prev > 0 ? '+' : ''}{cur - prev} bài)</span>
      </div>
    );
  };

  // 4. Compute Score Distribution for the current period
  // Grading bins logic:
  // - Xuất sắc: >= 9.0 (up to 10.0)
  // - Giỏi: >= 8.0 and < 9.0
  // - Khá: >= 6.5 and < 8.0
  // - Trung bình: >= 5.0 and < 6.5
  // - Chưa đạt: < 5.0
  const scoreBins = {
    xuatSac: 0,
    gioi: 0,
    kha: 0,
    trungBinh: 0,
    chuaDat: 0
  };

  currentRows.forEach(row => {
    const grade = parseGrade(row['Điểm tổng']);
    if (grade !== null) {
      if (grade >= 9.0) scoreBins.xuatSac++;
      else if (grade >= 8.0) scoreBins.gioi++;
      else if (grade >= 6.5) scoreBins.kha++;
      else if (grade >= 5.0) scoreBins.trungBinh++;
      else scoreBins.chuaDat++;
    } else if (row['Trạng thái'] === 'Không đạt' || row['Trạng thái'] === 'Hủy') {
      scoreBins.chuaDat++;
    }
  });

  const totalGraded = Object.values(scoreBins).reduce((a, b) => a + b, 0);

  const getPercentage = (count) => {
    return totalGraded > 0 ? (count / totalGraded * 100).toFixed(1) + '%' : '0%';
  };

  // 5. Compute Course Rankings (Top 10)
  const courseData = {};
  currentRows.forEach(row => {
    const code = getCourseCode(row.instance);
    const status = row['Trạng thái'];
    
    if (!courseData[code]) {
      courseData[code] = { code, total: 0, passed: 0, failed: 0 };
    }
    
    courseData[code].total++;
    if (status === 'Đạt') {
      courseData[code].passed++;
    } else if (status === 'Không đạt' || status === 'Hủy') {
      courseData[code].failed++;
    }
  });

  // Calculate pass rates and sort courses
  const sortedCourses = Object.values(courseData).map(c => {
    const passRate = c.total > 0 ? (c.passed / c.total * 100) : 0;
    return { ...c, passRate };
  }).sort((a, b) => {
    if (rankingSortKey === 'count') {
      return b.total - a.total; // Sort by volume
    } else {
      if (b.passRate !== a.passRate) {
        return b.passRate - a.passRate; // Sort by pass rate
      }
      return b.total - a.total; // Tie breaker: sort by volume
    }
  }).slice(0, 10);

  return (
    <div className="p-6 md:p-8 bg-[#0b0f19] min-h-screen text-[#f1f5f9] animate-fadeIn select-none">
      
      {/* Upper Dashboard Header */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between mb-8 pb-5 border-b border-[#1e293b] gap-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <span className="bg-gradient-to-r from-indigo-500 to-indigo-600 w-2 h-8 rounded-full inline-block"></span>
            Báo cáo Khảo thí & Điểm số
          </h1>
          <p className="text-sm text-slate-400 mt-1">Quản lý hiệu suất chấm trả bài, tổ chức thi đúng lịch và phân bổ chất lượng điểm học viên.</p>
        </div>

        {/* Dashboard Actions and Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Time range selector (Week / Month selector buttons) */}
          <div className="bg-[#131b2e] border border-[#1e293b] p-1 rounded-xl flex gap-1">
            <button 
              onClick={() => setFilterType('week')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterType === 'week' 
                  ? 'bg-indigo-600 text-white shadow-lg' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Xem theo Tuần
            </button>
            <button 
              onClick={() => setFilterType('month')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterType === 'month' 
                  ? 'bg-indigo-600 text-white shadow-lg' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Xem theo Tháng
            </button>
          </div>

          {/* Period selector dropdown */}
          <div className="flex items-center gap-2 bg-[#131b2e] border border-[#1e293b] px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white">
            <Filter size={14} className="text-indigo-400" />
            <span className="text-slate-400">Thời gian:</span>
            <select 
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-transparent border-none text-white focus:outline-none cursor-pointer font-bold pr-2"
            >
              {filterType === 'week' 
                ? weeksList.slice().reverse().map(w => <option key={w} value={w} className="bg-[#131b2e] text-white">Tuần {w}</option>)
                : monthsList.slice().reverse().map(m => <option key={m} value={m} className="bg-[#131b2e] text-white">Tháng {m}</option>)
              }
            </select>
          </div>

          {/* Connection status indicator */}
          <div className="flex items-center gap-2 text-xs bg-indigo-500/10 text-indigo-400 px-3 py-1.5 rounded-xl border border-indigo-500/20 shadow-sm shrink-0">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
            <span className="font-bold">Dữ liệu Live Sheet</span>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        {/* KPI 1: Trả Điểm Lab, ASM */}
        <div className="bg-[#131b2e] border border-[#1e293b] shadow-xl rounded-2xl p-6 transition-all duration-300 hover:border-[#2a385c] hover:translate-y-[-2px]">
          <div className="flex justify-between items-start">
            <span className="text-slate-400 text-xs font-bold tracking-wider uppercase">Trả điểm Lab, ASM</span>
            <span className="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 shadow-md">
              <ClipboardCheck size={20} />
            </span>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white tracking-tight">
                {currentKPIs.labAsmRate !== null ? `${currentKPIs.labAsmRate.toFixed(1)}%` : 'N/A'}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                ({currentKPIs.labAsmNum}/{currentKPIs.labAsmDenom} bài)
              </span>
            </div>
            {/* SLA indicator */}
            <div className="flex items-center gap-1.5 mt-2.5">
              <span className={`w-2 h-2 rounded-full ${
                currentKPIs.labAsmRate >= 96.0 ? 'bg-emerald-400' : 'bg-rose-400'
              }`}></span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Mục tiêu 96% trong 3 ngày • {currentKPIs.labAsmRate >= 96.0 ? 'Đạt' : 'Chưa Đạt'}
              </span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-[#1e293b]/70">
            {renderKPIChange(currentKPIs.labAsmRate, prevKPIs.labAsmRate)}
          </div>
        </div>

        {/* KPI 2: Trả Điểm Thi */}
        <div className="bg-[#131b2e] border border-[#1e293b] shadow-xl rounded-2xl p-6 transition-all duration-300 hover:border-[#2a385c] hover:translate-y-[-2px]">
          <div className="flex justify-between items-start">
            <span className="text-slate-400 text-xs font-bold tracking-wider uppercase">Trả điểm Thi</span>
            <span className="p-2.5 rounded-xl bg-amber-600/20 text-amber-400 border border-amber-500/20 shadow-md">
              <FileCheck2 size={20} />
            </span>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white tracking-tight">
                {currentKPIs.examRate !== null ? `${currentKPIs.examRate.toFixed(1)}%` : 'N/A'}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                ({currentKPIs.examNum}/{currentKPIs.examDenom} bài)
              </span>
            </div>
            {/* SLA indicator */}
            <div className="flex items-center gap-1.5 mt-2.5">
              <span className={`w-2 h-2 rounded-full ${
                currentKPIs.examRate >= 98.0 ? 'bg-emerald-400' : 'bg-rose-400'
              }`}></span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Mục tiêu 98% trong 2 ngày • {currentKPIs.examRate >= 98.0 ? 'Đạt' : 'Chưa Đạt'}
              </span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-[#1e293b]/70">
            {renderKPIChange(currentKPIs.examRate, prevKPIs.examRate)}
          </div>
        </div>

        {/* KPI 3: Tổ chức thi đúng lịch */}
        <div className="bg-[#131b2e] border border-[#1e293b] shadow-xl rounded-2xl p-6 transition-all duration-300 hover:border-[#2a385c] hover:translate-y-[-2px]">
          <div className="flex justify-between items-start">
            <span className="text-slate-400 text-xs font-bold tracking-wider uppercase">Tổ chức Thi Đúng Hẹn</span>
            <span className="p-2.5 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 shadow-md">
              <CalendarCheck size={20} />
            </span>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white tracking-tight">
                {currentKPIs.interviewRate !== null ? `${currentKPIs.interviewRate.toFixed(1)}%` : 'N/A'}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                ({currentKPIs.interviewNum}/{currentKPIs.interviewDenom} phiên)
              </span>
            </div>
            {/* SLA indicator */}
            <div className="flex items-center gap-1.5 mt-2.5">
              <span className={`w-2 h-2 rounded-full ${
                currentKPIs.interviewRate >= 97.0 ? 'bg-emerald-400' : 'bg-rose-400'
              }`}></span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Mục tiêu 97% đúng lịch • {currentKPIs.interviewRate >= 97.0 ? 'Đạt' : 'Chưa Đạt'}
              </span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-[#1e293b]/70">
            {renderKPIChange(currentKPIs.interviewRate, prevKPIs.interviewRate)}
          </div>
        </div>

        {/* Submission Volume and Activity Card */}
        <div className="bg-[#131b2e] border border-[#1e293b] shadow-xl rounded-2xl p-6 transition-all duration-300 hover:border-[#2a385c] hover:translate-y-[-2px]">
          <div className="flex justify-between items-start">
            <span className="text-slate-400 text-xs font-bold tracking-wider uppercase">Tổng Lượng Bài Nộp</span>
            <span className="p-2.5 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/20 shadow-md">
              <Layers size={20} />
            </span>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white tracking-tight">
                {currentKPIs.totalSubmissions.toLocaleString()}
              </span>
              <span className="text-xs text-slate-400 font-medium">bài nộp</span>
            </div>
            <div className="flex items-center gap-1.5 mt-2.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              <BookOpen size={12} className="text-purple-400" />
              <span>Gồm cả ASM, Lab, Exams và Dự án</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-[#1e293b]/70">
            {renderSubmissionsChange()}
          </div>
        </div>

      </div>

      {/* Detail Analysis Section containing Chart and Ranking Table */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left Column: Score Distribution Chart (CSS/Tailwind Custom implementation) */}
        <div className="lg:col-span-2 bg-[#131b2e] border border-[#1e293b] shadow-xl rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Award size={18} className="text-indigo-400 animate-pulse-slow" />
                Phân bổ Điểm số Học viên
              </h2>
              <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 font-bold uppercase">
                {totalGraded} bài chấm đạt/trượt
              </span>
            </div>

            {/* Custom pure-CSS chart */}
            <div className="h-60 flex items-end justify-between gap-3 pt-6 px-2 border-b border-[#1e293b] mb-4">
              {[
                { label: 'Xuất sắc', count: scoreBins.xuatSac, color: 'from-emerald-500 to-teal-500', range: '>= 9.0' },
                { label: 'Giỏi', count: scoreBins.gioi, color: 'from-sky-500 to-indigo-500', range: '8.0 -> 9.0' },
                { label: 'Khá', count: scoreBins.kha, color: 'from-indigo-600 to-purple-600', range: '6.5 -> 8.0' },
                { label: 'Trung bình', count: scoreBins.trungBinh, color: 'from-amber-500 to-orange-500', range: '5.0 -> 6.5' },
                { label: 'Chưa đạt', count: scoreBins.chuaDat, color: 'from-rose-600 to-pink-600', range: '< 5.0' }
              ].map((item, idx) => {
                const heightPct = totalGraded > 0 ? (item.count / Math.max(...Object.values(scoreBins)) * 100) : 0;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer">
                    {/* The bar with hover effect */}
                    <div 
                      style={{ height: heightPct > 0 ? `${heightPct}%` : '4%' }} 
                      className={`w-full max-w-[40px] rounded-t-lg bg-gradient-to-t ${item.color} relative transition-all duration-300 hover:brightness-125`}
                    >
                      {/* Tooltip on hover */}
                      <div className="absolute top-[-38px] left-1/2 transform -translate-x-1/2 bg-slate-800 border border-[#1e293b] text-white text-[10px] px-2.5 py-1.5 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 flex flex-col items-center">
                        <span className="font-bold">{item.count} bài ({getPercentage(item.count)})</span>
                        <span className="text-[9px] text-slate-400">{item.range}</span>
                      </div>
                    </div>
                    {/* Class label */}
                    <span className="text-[10px] text-slate-400 mt-2.5 font-bold text-center truncate w-full group-hover:text-white transition-colors">
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Metric legend */}
          <div className="flex flex-col gap-1.5 text-xs text-slate-400 mt-2 bg-[#0b0f19]/40 border border-[#1e293b]/70 p-3.5 rounded-xl">
            <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">
              <span>Thang Phân loại</span>
              <span>Điểm Số</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span>Xuất sắc</span>
              <span className="font-mono text-[11px] text-slate-300 font-bold">9.0 - 10.0</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-sky-500"></span>Giỏi</span>
              <span className="font-mono text-[11px] text-slate-300 font-bold">8.0 - 8.99</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-indigo-500"></span>Khá</span>
              <span className="font-mono text-[11px] text-slate-300 font-bold">6.5 - 7.99</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500"></span>Trung bình</span>
              <span className="font-mono text-[11px] text-slate-300 font-bold">5.0 - 6.49</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500"></span>Chưa đạt</span>
              <span className="font-mono text-[11px] text-slate-300 font-bold">&lt; 5.0</span>
            </div>
          </div>
        </div>

        {/* Right Column: Top 10 Course Rankings */}
        <div className="lg:col-span-3 bg-[#131b2e] border border-[#1e293b] shadow-xl rounded-2xl p-6 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <BookOpen size={18} className="text-indigo-400" />
              Bảng Xếp Hạng Top 10 Môn Học
            </h2>
            {/* Sorting metric switch */}
            <div className="bg-[#0b0f19] border border-[#1e293b] p-1 rounded-lg flex self-start sm:self-auto">
              <button 
                onClick={() => setRankingSortKey('count')}
                className={`px-3 py-1 rounded text-[10px] font-bold transition-all flex items-center gap-1 ${
                  rankingSortKey === 'count' 
                    ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/30' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Lượng bài nộp
              </button>
              <button 
                onClick={() => setRankingSortKey('passRate')}
                className={`px-3 py-1 rounded text-[10px] font-bold transition-all flex items-center gap-1 ${
                  rankingSortKey === 'passRate' 
                    ? 'bg-[#183153] text-[#a5c2f4] border border-[#2a4d7d]' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Tỷ lệ Đạt
              </button>
            </div>
          </div>

          {/* Ranking Table */}
          <div className="overflow-x-auto flex-1">
            {sortedCourses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-500 gap-2">
                <AlertCircle size={24} className="text-slate-600" />
                <span className="text-xs">Không tìm thấy thông tin môn học</span>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#0b0f19] border-b border-[#1e293b] text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                    <th className="p-3 text-center w-12 rounded-l-lg">Hạng</th>
                    <th className="p-3">Mã Môn Học</th>
                    <th className="p-3 text-center">Tổng Bài Nộp</th>
                    <th className="p-3 text-center">Số Bài Đạt</th>
                    <th className="p-3 text-center">Không Đạt / Hủy</th>
                    <th className="p-3 text-right rounded-r-lg">Tỷ Lệ Đạt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e293b]/50">
                  {sortedCourses.map((c, idx) => (
                    <tr key={c.code} className="hover:bg-[#0b0f19]/35 transition-colors">
                      <td className="p-3 text-center">
                        <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full font-black text-[10px] ${
                          idx === 0 ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                          idx === 1 ? 'bg-slate-300/10 text-slate-300 border border-slate-300/20' :
                          idx === 2 ? 'bg-amber-700/10 text-amber-700 border border-amber-700/20' :
                          'text-slate-500'
                        }`}>
                          {idx + 1}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-white tracking-wider">{c.code}</td>
                      <td className="p-3 text-center font-bold text-slate-300">{c.total}</td>
                      <td className="p-3 text-center text-emerald-400 font-semibold">{c.passed}</td>
                      <td className="p-3 text-center text-rose-400 font-medium">{c.failed}</td>
                      <td className="p-3 text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-extrabold text-indigo-400 text-sm">{c.passRate.toFixed(1)}%</span>
                          {/* Mini Progress bar under the pass rate */}
                          <div className="w-16 h-1 bg-[#0b0f19] rounded-full mt-1 overflow-hidden border border-[#1e293b]">
                            <div 
                              style={{ width: `${c.passRate}%` }} 
                              className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full"
                            ></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
