import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const StatusPieChart = ({ tenders, title = "Status Distribution" }) => {
  // Helper function to safely normalize the status string
  const normalizeStatus = (status) => (status || '').toLowerCase();

  const data = [
    {
      name: 'Won',
      value: tenders.filter(t => normalizeStatus(t.tender_status).includes('won')).length
    },
    {
      name: 'Lost',
      value: tenders.filter(t => normalizeStatus(t.tender_status).includes('lost')).length
    },
    {
      name: 'Pending',
      value: tenders.filter(t => 
        normalizeStatus(t.tender_status).includes('quoted') || 
        normalizeStatus(t.tender_status).includes('pending')
      ).length
    },
    {
      name: 'Regret/Other',
      value: tenders.filter(t => 
        ['regret', 'cancelled'].some(s => normalizeStatus(t.tender_status).includes(s))
      ).length
    }
  ].filter(item => item.value > 0);

  const COLORS = {
    Won: '#10b981',
    Lost: '#ef4444',
    Pending: '#3b82f6',
    'Regret/Other': '#94a3b8'
  };

  return (
    <div className="h-80 w-full">
      {/* Dynamic Heading added here */}
      <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
        {title}
      </h2>

      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie 
            data={data} 
            innerRadius={70} 
            outerRadius={100} 
            paddingAngle={5} 
            dataKey="value"
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={COLORS[entry.name]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
          />
          <Legend verticalAlign="bottom" height={36}/>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StatusPieChart;