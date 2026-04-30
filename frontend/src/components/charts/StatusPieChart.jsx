import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-4 shadow-xl border border-slate-100 rounded-2xl">
        <p className="text-xs font-black text-slate-400 uppercase mb-2">{data.name}</p>
        <p className="text-sm font-bold text-slate-800 mb-1">Total: {data.value}</p>
        
        {/* Specific breakdown for Regret/Cancelled group */}
        {data.name === 'Regret' && (
          <div className="mt-2 pt-2 border-t border-slate-50 space-y-1">
            <div className="flex justify-between gap-4 text-[10px] font-bold">
              <span className="text-slate-500">Regret:</span>
              <span className="text-slate-700">{data.regretCount}</span>
            </div>
            <div className="flex justify-between gap-4 text-[10px] font-bold">
              <span className="text-slate-500">Cancelled:</span>
              <span className="text-slate-700">{data.cancelledCount}</span>
            </div>
          </div>
        )}
      </div>
    );
  }
  return null;
};

const StatusPieChart = ({ tenders, title = "Status Distribution" }) => {
  const normalizeStatus = (status) => (status || '').toLowerCase();

  const data = [
    {
      name: 'Won',
      value: tenders.filter(t => normalizeStatus(t.Status || t.status || t.tender_status).includes('won')).length
    },
    {
      name: 'Lost',
      value: tenders.filter(t => normalizeStatus(t.Status || t.status || t.tender_status).includes('lost')).length
    },
    {
      name: 'Quoted',
      value: tenders.filter(t => {
        const s = normalizeStatus(t.Status || t.status || t.tender_status);
        return s.includes('quoted') || s.includes('received');
      }).length
    },
    {
      name: 'Regret',
      // The total value for the slice
      value: tenders.filter(t => {
        const s = normalizeStatus(t.Status || t.status || t.tender_status);
        return s.includes('regret') || s.includes('cancelled');
      }).length,
      // Individual counts for the tooltip
      regretCount: tenders.filter(t => normalizeStatus(t.Status || t.status || t.tender_status).includes('regret')).length,
      cancelledCount: tenders.filter(t => normalizeStatus(t.Status || t.status || t.tender_status).includes('cancelled')).length
    }
  ].filter(item => item.value > 0);

  const COLORS = {
    Won: '#10b981',
    Lost: '#ef4444',
    Quoted: '#3b82f6',
    Regret: '#94a3b8'
  };

  return (
    <div className="h-80 w-full flex flex-col">
      <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 text-center">
        {title}
      </h2>

      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie 
            data={data} 
            innerRadius={65} 
            outerRadius={90} 
            paddingAngle={8} 
            dataKey="value"
            stroke="none"
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={COLORS[entry.name]} cornerRadius={10} />
            ))}
          </Pie>
          {/* Using the Custom Tooltip component here */}
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="bottom" 
            height={36} 
            iconType="circle"
            formatter={(value) => <span className="text-slate-600 font-bold text-xs">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StatusPieChart;