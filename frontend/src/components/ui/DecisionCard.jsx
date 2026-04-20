import React from 'react';
import { 
  CheckCircle, XCircle, AlertTriangle, TrendingUp, 
  DollarSign, BookOpen, Briefcase, Scale, ShieldCheck 
} from 'lucide-react';

const DecisionCard = ({ result }) => {
  const { decision, aarvi_intelligence } = result;
  
  // Safeguard against missing data
  const intel = aarvi_intelligence || {};
  const isEligible = decision?.is_eligible;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-lg w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in duration-300">
      {/* Executive Header */}
      <div className={`px-6 py-5 border-b flex justify-between items-center ${isEligible ? 'bg-emerald-50' : 'bg-rose-50'}`}>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{intel.tender_no || "Unknown Tender"}</h2>
          <p className="text-sm text-slate-600 font-medium">{intel.client_name}</p>
        </div>
        <div className={`px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 ${isEligible ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
          {isEligible ? <CheckCircle size={18} /> : <XCircle size={18} />}
          {isEligible ? "GO - PROCEED" : "NO-GO - OUT OF SCOPE"}
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Metric Grid */}
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricCard icon={<TrendingUp size={20}/>} label="Win Probability" value={intel.win_probability} color="blue" />
          <MetricCard icon={<ShieldCheck size={20}/>} label="PQ Status" value={intel.pq_eligibility_status} color="emerald" />
          <MetricCard icon={<DollarSign size={20}/>} label="Profit Forecast" value={intel.profit_forecast} color="amber" />
        </div>

        {/* Deep Dive Sections */}
        <div className="space-y-4">
          <Section icon={<Briefcase size={18}/>} title="Manpower Scope">
            <p className="text-sm text-slate-600">{intel.manpower_requirement}</p>
          </Section>
          <Section icon={<BookOpen size={18}/>} title="PQ Criteria">
            <p className="text-sm text-slate-600 leading-relaxed">{intel.pre_qualification_criteria}</p>
          </Section>
        </div>

        <div className="space-y-4">
          <Section icon={<Scale size={18}/>} title="Strategic Advice">
            <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border italic">{intel.summary}</p>
          </Section>
          <Section icon={<AlertTriangle size={18}/>} title="Penalty & Terms">
            <p className="text-sm text-slate-600">{intel.penalty_terms}</p>
          </Section>
        </div>
      </div>
    </div>
  );
};

// Helper Components for clean layout
const MetricCard = ({ icon, label, value, color }) => (
  <div className={`p-4 rounded-xl border bg-${color}-50 border-${color}-100`}>
    <div className={`text-${color}-600 mb-1`}>{icon}</div>
    <div className="text-xs font-bold text-slate-500 uppercase">{label}</div>
    <div className={`text-md font-bold text-${color}-900`}>{value}</div>
  </div>
);

const Section = ({ icon, title, children }) => (
  <div className="border border-slate-100 rounded-xl p-4 bg-white shadow-sm">
    <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-2 border-b pb-2">
      {icon} {title}
    </h4>
    {children}
  </div>
);

export default DecisionCard;