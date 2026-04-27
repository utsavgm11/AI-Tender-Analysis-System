import React from 'react';
import { 
  ShieldCheck, AlertTriangle, TrendingUp, DollarSign, 
  Briefcase, FileText, Target, CheckCircle2, 
  Scale, FileCheck2, HardHat, Wallet
} from 'lucide-react';

// --- STYLES FOR SLEEK SCROLLBAR ---
// This injects a modern, invisible-until-hover scrollbar just for this component
const scrollbarStyles = `
  .sleek-scroll::-webkit-scrollbar { width: 6px; }
  .sleek-scroll::-webkit-scrollbar-track { background: transparent; }
  .sleek-scroll::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; border: 2px solid transparent; background-clip: content-box; }
  .sleek-scroll:hover::-webkit-scrollbar-thumb { background-color: #94a3b8; border: 1px solid transparent; }
`;

// --- DATA CLEANER ---
const cleanText = (val, isMetric = false) => {
  if (!val || val === "N/A" || val === "Not Specified") return "Not Specified";
  let s = String(val).trim();
  
  if ((s.startsWith("['") && s.endsWith("']")) || (s.startsWith('["') && s.endsWith('"]'))) {
    s = s.substring(2, s.length - 2);
    s = s.replace(/', '/g, '\n').replace(/", "/g, '\n'); 
  }
  if (isMetric) s = s.replace(/^[-•*]\s*/, '');
  return s.replace(/\\n/g, '\n').trim();
};

const DecisionCard = ({ result }) => {
  const rawData = result?.aarvi_intelligence || result || {};

  const d = {};
  for (const key in rawData) {
    const isTopMetric = ['pq_status', 'win_probability', 'profit_forecast'].includes(key);
    d[key] = cleanText(rawData[key], isTopMetric);
  }

  const decisionStr = String(d.bid_decision || "Pending");
  const isGo = decisionStr.toLowerCase().includes("go");

  return (
    <>
      <style>{scrollbarStyles}</style>
      <div className="bg-white p-6 md:p-10 rounded-[2rem] border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] max-w-7xl mx-auto my-8 font-sans">
        
        {/* --- HEADER: COMPACT STRIP --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 pb-6 border-b border-slate-100 gap-6">
          <div className="flex flex-col gap-2">
            <span className="bg-slate-900 text-white px-4 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest shadow-sm w-fit">
              {d.tender_no || "N/A"}
            </span>
            <span className="text-slate-800 text-2xl md:text-3xl font-extrabold tracking-tight">{d.client_name || "Unknown Client"}</span>
          </div>
          
          <div className={`px-8 py-3.5 rounded-2xl font-black text-xl border-2 flex items-center gap-3 shadow-lg ${
            isGo 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-emerald-500/10' 
              : 'bg-rose-50 border-rose-200 text-rose-700 shadow-rose-500/10'
          }`}>
            {isGo && <CheckCircle2 size={24} />}
            DECISION: {decisionStr.toUpperCase()}
          </div>
        </div>

        {/* --- ZONE 1: 3 CORE METRICS --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <Metric title="PQ Status" val={d.pq_status} icon={<ShieldCheck size={24}/>} theme="emerald" />
          <Metric title="Win Probability" val={d.win_probability} icon={<Target size={24}/>} theme="blue" />
          <Metric title="Profit Forecast" val={d.profit_forecast} icon={<DollarSign size={24}/>} theme="amber" />
        </div>

        {/* --- ZONE 2: MAIN CONTENT & SIDEBAR --- */}
        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          
          {/* Left Column (Main Due Diligence) - Takes 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Project Reality Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              <ScrollableBox title="Scope of Work" icon={<Briefcase size={18}/>} content={d.scope_of_work} />
              <ScrollableBox title="Manpower Required" icon={<FileText size={18}/>} content={d.manpower_requirement} />
            </div>

            {/* Compliance Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              <ScrollableBox title="Key Eligibility" icon={<FileCheck2 size={18}/>} content={d.key_eligibility} />
              <ScrollableBox title="Mandatory Compliance" icon={<ShieldCheck size={18}/>} content={d.mandatory_compliance} />
            </div>

            {/* Financial Risk Row (Rose Theme) */}
            <div className="grid grid-cols-1 gap-6">
              {/* Note: Combining EMD & Penalty here since AI outputs them in penalty_terms */}
              <ScrollableBox 
                title="EMD & Penalty Terms" 
                icon={<AlertTriangle size={18} className="text-rose-500"/>} 
                content={d.penalty_terms} 
                bg="bg-rose-50/50" 
                borderColor="border-rose-100" 
              />
            </div>
          </div>

          {/* Right Column: Gatekeepers Sidebar - Takes 1/3 width */}
          <div className="bg-slate-50 p-6 rounded-[1.5rem] border border-slate-100 h-fit flex flex-col gap-5">
            <h3 className="font-extrabold text-slate-800 flex items-center gap-2 text-lg border-b border-slate-200 pb-4 mb-2">
              <ShieldCheck size={22} className="text-indigo-500" />
              Eligibility Gatekeepers
            </h3>
            <SidebarItem title="Financial Eligibility" val={d.financial_eligibility} icon={<Wallet size={16}/>} />
            <SidebarItem title="Technical Eligibility" val={d.technical_eligibility} icon={<Scale size={16}/>} />
            <SidebarItem title="Similar Work History" val={d.similar_work} icon={<HardHat size={16}/>} />
          </div>

        </div>

        {/* --- ZONE 3: THE VERDICT (Full Width Bottom Anchor) --- */}
        <div className="w-full">
          <div className="bg-indigo-50/40 p-8 rounded-[1.5rem] border border-indigo-100">
             <h3 className="font-extrabold text-indigo-900 mb-5 flex items-center gap-2 text-xl">
              <TrendingUp size={24} className="text-indigo-600" />
              Strategic Action Plan
            </h3>
            <div className="max-h-60 overflow-y-auto pr-4 sleek-scroll">
              <ContentRenderer text={d.strategic_advice} large />
            </div>
          </div>
        </div>

      </div>
    </>
  );
};

// --- SMART RENDERER ---
const ContentRenderer = ({ text, large = false }) => {
  const safeText = text ? String(text) : "Not Specified";
  const lines = safeText.split('\n').filter(line => line.trim() !== '');
  
  if (lines.length > 1) {
    return (
      <ul className="space-y-3">
        {lines.map((line, i) => {
          const cleanLine = line.replace(/^[-•*]\s*/, '').replace(/^\d+\.\s/, '');
          return (
            <li key={i} className="text-slate-700 flex items-start">
              <span className="mr-3 text-blue-500 font-black mt-1 leading-none">•</span>
              <span className={`leading-relaxed ${large ? 'text-[15px]' : 'text-sm'}`}>{cleanLine}</span>
            </li>
          );
        })}
      </ul>
    );
  }
  return <p className={`text-slate-700 leading-relaxed ${large ? 'text-[15px]' : 'text-sm'}`}>{safeText}</p>;
};

// --- UI SUB-COMPONENTS ---
const themeMap = {
  emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  blue: 'bg-blue-50 text-blue-600 border-blue-100',
  amber: 'bg-amber-50 text-amber-600 border-amber-100',
};

const Metric = ({ title, val, icon, theme }) => (
  <div className="bg-white p-6 rounded-[1.5rem] border border-slate-200 shadow-sm flex items-center gap-5 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
    <div className={`p-4 rounded-2xl ${themeMap[theme]}`}>
      {icon}
    </div>
    <div>
      <div className="text-[11px] uppercase font-extrabold text-slate-400 tracking-wider mb-1">{title}</div>
      <div className="text-2xl md:text-3xl font-black text-slate-800 leading-none">
        {val}
      </div>
    </div>
  </div>
);

// Standard scrollable box for main content
const ScrollableBox = ({ title, icon, content, bg = "bg-white", borderColor = "border-slate-200" }) => (
  <div className={`${bg} p-6 rounded-2xl border ${borderColor} flex flex-col h-[260px]`}>
    <h3 className="font-extrabold text-slate-800 mb-4 flex items-center gap-2 text-[15px]">
      <span className="text-slate-400">{icon}</span> {title}
    </h3>
    <div className="flex-1 overflow-y-auto pr-3 sleek-scroll">
      <ContentRenderer text={content} />
    </div>
  </div>
);

// Tighter scrollable box for the sidebar
const SidebarItem = ({ title, val, icon }) => (
  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col h-[200px]">
    <h4 className="text-[11px] uppercase font-bold text-slate-500 mb-3 tracking-widest flex items-center gap-1.5">
      <span className="text-slate-400">{icon}</span> {title}
    </h4>
    <div className="flex-1 overflow-y-auto pr-2 sleek-scroll">
      <ContentRenderer text={val} />
    </div>
  </div>
);

export default DecisionCard;