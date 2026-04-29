import React from 'react';
import {
  ShieldCheck, AlertTriangle, TrendingUp, DollarSign,
  Briefcase, FileText, Target, CheckCircle2, XCircle,
  HardHat, Wallet, Users
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
  const isGo = bidDecision.includes("GO BID");
  const isNoGo = bidDecision.includes("NO BID") || bidDecision.includes("NO-GO");

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

      {/* --- KPI STRIP (Updated to md:grid-cols-5 to fit EMD) --- */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
        <KpiCard title="PQ Status" val={d.pq_status} icon={<ShieldCheck size={18}/>} color={d.pq_status === 'Pass' ? 'emerald' : 'amber'} />
        <KpiCard title="Win Probability" val={d.win_probability} icon={<Target size={18}/>} color="blue" />
        <KpiCard title="Profit Forecast" val={d.profit_forecast} icon={<DollarSign size={18}/>} color={d.profit_forecast.includes('Low') ? 'amber' : 'emerald'} />
        <KpiCard title="Tender Value" val={d.tender_open_price || "N/A"} icon={<Wallet size={18}/>} color="slate" />
        <KpiCard title="EMD" val={d.emd || "N/A"} icon={<FileText size={18}/>} color="slate" />
      </div>

      {/* --- QUALIFICATION SUMMARY --- */}
      <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-6">Qualification & Compliance</h2>
        
        <div className="grid md:grid-cols-2 gap-5 mb-5">
          <QualItem title="BQC (Financial)" req={d.bqc_financial} status={d.bqc_financial !== "Not Specified" ? "Evaluated" : "Pending"} reason="Based on extracted financial data." />
          <QualItem title="BQC (Technical)" req={d.bqc_technical} status={d.bqc_technical !== "Not Specified" ? "Evaluated" : "Pending"} reason="Based on extracted technical data." />
        </div>

        <div className="grid md:grid-cols-2 gap-5 mb-5">
          <QualItem title="PQC (Financial)" req={d.pqc_financial} status={d.pqc_financial !== "Not Specified" ? "Evaluated" : "Pending"} reason="Based on pre-qualification criteria." />
          <QualItem title="PQC (Technical)" req={d.pqc_technical} status={d.pq_status === "Pass" ? "Pass" : "Evaluated"} reason="Cross-referenced with Knowledge Base." />
        </div>

        <div className="grid grid-cols-1">
          <QualItem 
            title="Mandatory Compliance" 
            req={d.mandatory_compliance} 
            status={d.compliance_status || "Evaluated"} 
            reason={d.compliance_reason || "Check documentation requirements."} 
            isRisk={d.compliance_status === "Fail"} 
          />
        </div>
      </div>

      {/* --- OPERATIONAL DETAILS GRID --- */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        <DetailCard title="Scope of Work" icon={<Briefcase size={16}/>} content={d.scope_of_work} />
        <DetailCard title="Manpower Details" icon={<Users size={16}/>} content={`**Count:** ${d.manpower_count}\n**Quals:** ${d.manpower_qual}\n**Shift:** ${d.shift_duty}`} />
        <DetailCard title="Similar Work History" icon={<HardHat size={16}/>} content={d.similar_work} />
      </div>

      {/* --- FINANCIAL & RISK --- */}
      <div className="grid md:grid-cols-2 gap-5">
        <DetailCard title="Payment Terms" icon={<DollarSign size={16}/>} content={d.payment_terms || "Not Specified"} />
        <DetailCard title="Penalty & Risk" icon={<AlertTriangle size={16}/>} content={d.penalty_terms} isRisk />
      </div>

      {/* --- STRATEGY SECTION --- */}
      <div className={`p-8 rounded-2xl border ${isNoGo ? 'bg-rose-50/50 border-rose-100' : 'bg-indigo-50/50 border-indigo-100'}`}>
        <h3 className={`font-bold mb-4 flex items-center gap-2 ${isNoGo ? 'text-rose-900' : 'text-indigo-900'}`}>
          <TrendingUp size={18} className={isNoGo ? 'text-rose-600' : 'text-indigo-600'} /> Strategic Action Plan
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
  const map = { emerald: 'bg-emerald-50 text-emerald-600', blue: 'bg-blue-50 text-blue-600', amber: 'bg-rose-50 text-rose-600', slate: 'bg-slate-100 text-slate-600' };
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-100 flex items-center gap-4 hover:shadow-md transition-all">
      <div className={`p-2.5 rounded-lg ${map[color] || map.slate}`}>{icon}</div>
      <div>
        <p className="text-[10px] uppercase font-bold text-slate-400">{title}</p>
        <p className="font-bold text-slate-800">{val}</p>
      </div>
    </div>
  );
};

const QualItem = ({ title, req, status, reason, isRisk }) => (
  <div className={`p-5 rounded-xl border ${isRisk ? 'border-rose-200 bg-rose-50' : 'border-slate-100 bg-slate-50'}`}>
    <div className="flex justify-between items-center mb-3">
      <h4 className="font-bold text-sm text-slate-800">{title}</h4>
      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${status === 'Pass' ? 'bg-emerald-100 text-emerald-700' : status === 'Fail' ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-700'}`}>
        {status}
      </span>
    </div>
    <p className="text-xs text-slate-600 mb-2 leading-relaxed"><span className="font-bold text-slate-800">Requirement:</span> {req}</p>
    <p className="text-xs text-slate-500"><span className="font-bold text-slate-700">Status Detail:</span> {reason}</p>
  </div>
);

const renderFormattedContent = (text) => {
  if (!text) return null;
  return text.split('\n').map((line, index) => {
    const isBullet = line.trim().startsWith('•') || line.trim().startsWith('-');
    const cleanLine = line.replace(/^[•-]\s*/, '');
    
    const parts = cleanLine.split(/(\*\*.*?\*\*)/g);
    const formattedLine = parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="text-slate-800">{part.slice(2, -2)}</strong>;
      }
      return part;
    });

    return (
      <div key={index} className={`mb-1.5 ${isBullet ? 'pl-4 flex' : 'mt-3 mb-2'}`}>
        {isBullet && <span className="mr-2 text-slate-400 font-bold">•</span>}
        <span className="leading-relaxed">{formattedLine}</span>
      </div>
    );
  });
};

const DetailCard = ({ title, icon, content, isRisk = false }) => (
  <div className={`bg-white p-6 rounded-2xl border shadow-sm h-[250px] flex flex-col transition-all hover:shadow-lg hover:-translate-y-1 ${isRisk ? 'border-rose-100' : 'border-slate-100'}`}>
    <h4 className="flex items-center gap-2 font-bold text-slate-800 text-sm mb-4 border-b pb-2 border-slate-50">
      <span className={isRisk ? 'text-rose-500' : 'text-slate-400'}>{icon}</span> {title}
    </h4>
    <div className="text-slate-600 text-xs overflow-y-auto pr-2 sleek-scroll">
      {renderFormattedContent(content)}
    </div>
  </div>
);

export default DecisionCard;