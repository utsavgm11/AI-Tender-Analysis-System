import React from 'react';
import { Hash, Percent, IndianRupee, BarChart3, TrendingUp } from 'lucide-react';

const KPICard = ({ title, value }) => {
  return (
    <div className="p-5 bg-white rounded-2xl shadow-sm border border-slate-200">
      <p className="text-sm text-slate-500">{title}</p>
      <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
    </div>
  );
};

const KPICardGroup = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-3 lg:grid-cols-5">
      <KPICard title="Total Tenders" value={stats.total_count || 0} color="border-slate-500" icon={<Hash />} />
      <KPICard title="Win Rate" value={`${stats.win_rate || 0}%`} color="border-emerald-500" icon={<Percent />} />
      <KPICard title="Total Won Value" value={`₹${(stats.total_won_value / 10000000 || 0).toFixed(2)} Cr`} color="border-indigo-500" icon={<IndianRupee />} />
      <KPICard title="Avg Deal Size" value={`₹${(stats.avg_value / 1000000 || 0).toFixed(2)} L`} color="border-amber-500" icon={<BarChart3 />} />
      <KPICard title="Active/Lost Ratio" value={(stats.active_lost_ratio || 0).toFixed(2)} color="border-rose-500" icon={<TrendingUp />} />
    </div>
  );
};

export default KPICardGroup;