import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const StatusPieChart = ({ tenders }) => {
  const data = [
    { name: 'Won', value: tenders.filter(t => t.tender_status === 'Won').length },
    { name: 'Lost', value: tenders.filter(t => t.tender_status === 'Lost').length },
    { name: 'Pending', value: tenders.filter(t => t.tender_status === 'Pending' || t.tender_status === 'Quoted').length },
    { name: 'Regret/Other', value: tenders.filter(t => ['Regret', 'Cancelled'].includes(t.tender_status)).length },
  ].filter(item => item.value > 0);

  const COLORS = ['#10b981', '#ef4444', '#3b82f6', '#94a3b8'];

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value">
            {data.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
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