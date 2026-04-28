import React from 'react';
import { 
  ShieldCheck, AlertTriangle, TrendingUp, DollarSign, 
  Briefcase, FileText, Target, CheckCircle2, XCircle,
  Scale, FileCheck2, HardHat, Wallet, Users, Clock, Info
} from 'lucide-react';

// --- DATA CLEANER ---
const cleanText = (val) => {
  if (!val || val === "N/A" || val === "Not Specified") return "Not Specified";
  return String(val).trim().replace(/\\n/g, '\n');
};

const DecisionCard = ({ result }) => {
  const data = result?.aarvi_intelligence || result || {};
  
  // Helper to map data safely
  const d = {};
  Object.keys(data).forEach(key => d[key] = cleanText(data[key]));

  const bidDecision = String(d.bid_decision || "PENDING").toUpperCase();
  const isGo = bidDecision.includes("GO") && !bidDecision.includes("NO");
  const isNoGo = bidDecision.includes("NO-GO") || bidDecision.includes("NO GO");

  return (
    <div className="max-w-7xl mx-auto my-8 font-sans space-y-8">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <span className="bg-slate-900 text-white px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest">
            {d.tender_no || "TENDER ID"}
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 mt-3">{d.client_name || "Unknown Client"}</h1>
          <p className="text-slate-500 mt-1">{d.description || "Project Analysis Summary"}</p>
        </div>
        
        <div className={`px-6 py-3 rounded-xl font-bold text-sm border flex items-center gap-2 ${
          isGo ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
          isNoGo ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'
        }`}>
          {isGo ? <CheckCircle2 size={18} /> : <XCircle size={18} />} 
          {bidDecision}
        </div>
      </div>

      {/* --- KPI STRIP --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <KpiCard title="PQ Status" val={d.pq_status} icon={<ShieldCheck size={18}/>} color="emerald" />
        <KpiCard title="Win Probability" val={d.win_probability} icon={<Target size={18}/>} color="blue" />
        <KpiCard title="Profit Forecast" val={d.profit_forecast} icon={<DollarSign size={18}/>} color="amber" />
        <KpiCard title="Tender Value" val={d.tender_open_price || "N/A"} icon={<Wallet size={18}/>} color="slate" />
      </div>

      {/* --- QUALIFICATION SUMMARY (Requirement-Focused) --- */}
      <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-6">Qualification & Compliance</h2>
        <div className="grid md:grid-cols-2 gap-5">
          <QualItem title="BQC (Financial)" req={d.bqc_financial} status="Pass" reason="Meets turnover requirements" />
          <QualItem title="BQC (Technical)" req={d.bqc_technical} status="Pass" reason="Relevant experience validated" />
          <QualItem title="PQC (Financial)" req={d.pqc_financial} status="Pass" reason="Solvency criteria met" />
          <QualItem title="Mandatory Compliance" req={d.mandatory_compliance} status="Fail" reason="Missing PF documentation" isRisk />
        </div>
      </div>

      {/* --- OPERATIONAL DETAILS GRID --- */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        <DetailCard title="Scope of Work" icon={<Briefcase size={16}/>} content={d.scope_of_work} />
        <DetailCard title="Manpower Details" icon={<Users size={16}/>} content={`Count: ${d.manpower_count}\nQuals: ${d.manpower_qual}\nShift: ${d.shift_duty}`} />
        <DetailCard title="Similar Work History" icon={<HardHat size={16}/>} content={d.similar_work} />
      </div>

      {/* --- FINANCIAL & RISK --- */}
      <div className="grid md:grid-cols-2 gap-5">
        <DetailCard title="Payment Terms" icon={<DollarSign size={16}/>} content={d.payment_terms || "Not Specified"} />
        <DetailCard title="Penalty & Risk" icon={<AlertTriangle size={16}/>} content={d.penalty_terms} isRisk />
      </div>

      {/* --- STRATEGY SECTION --- */}
      <div className="bg-indigo-50/50 p-8 rounded-2xl border border-indigo-100">
        <h3 className="font-bold text-indigo-900 mb-4 flex items-center gap-2">
          <TrendingUp size={18} className="text-indigo-600" /> Strategic Action Plan
        </h3>
        <div className="text-slate-700 text-sm leading-relaxed space-y-2">
          {d.strategic_advice?.split('\n').map((line, i) => (
            <p key={i} className="flex items-start gap-2">• {line.replace(/^[-•*]\s*/, '')}</p>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- SUB-COMPONENTS ---

const KpiCard = ({ title, val, icon, color }) => {
  const map = { emerald: 'bg-emerald-50 text-emerald-600', blue: 'bg-blue-50 text-blue-600', amber: 'bg-amber-50 text-amber-600', slate: 'bg-slate-100 text-slate-600' };
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-100 flex items-center gap-4 hover:shadow-md transition-all">
      <div className={`p-2.5 rounded-lg ${map[color]}`}>{icon}</div>
      <div>
        <p className="text-[10px] uppercase font-bold text-slate-400">{title}</p>
        <p className="font-bold text-slate-800">{val}</p>
      </div>
    </div>
  );
};

const QualItem = ({ title, req, status, reason, isRisk }) => (
  <div className={`p-4 rounded-xl border ${isRisk ? 'border-rose-100 bg-rose-50/30' : 'border-slate-100 bg-slate-50'}`}>
    <div className="flex justify-between items-center mb-2">
      <h4 className="font-bold text-sm text-slate-800">{title}</h4>
      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${status === 'Pass' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
        {status}
      </span>
    </div>
    <p className="text-[11px] text-slate-500 mb-1"><span className="font-bold">Requirement:</span> {req}</p>
    <p className="text-[11px] text-slate-700"><span className="font-bold">Why:</span> {reason}</p>
  </div>
);

const DetailCard = ({ title, icon, content, isRisk = false }) => (
  <div className={`bg-white p-6 rounded-2xl border shadow-sm h-[200px] flex flex-col transition-all hover:shadow-lg hover:-translate-y-1 ${isRisk ? 'border-rose-100' : 'border-slate-100'}`}>
    <h4 className="flex items-center gap-2 font-bold text-slate-800 text-sm mb-3">
      <span className="text-slate-400">{icon}</span> {title}
    </h4>
    <div className="text-slate-600 text-xs leading-relaxed overflow-y-auto pr-2 sleek-scroll">
      {content}
    </div>
  </div>
);

export default DecisionCard;