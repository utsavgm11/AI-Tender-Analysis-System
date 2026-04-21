import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ClientBarChart = ({ tenders }) => {
  // Aggregate value by client (Top 5)
  const clientData = tenders.reduce((acc, t) => {
    const client = t.name_of_client || 'Unknown';
    acc[client] = (acc[client] || 0) + (Number(t.quoted_value) || 0);
    return acc;
  }, {});

  const data = Object.keys(clientData)
    .map(key => ({ name: key, value: clientData[key] / 10000000 })) // Convert to Crores
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600 }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} label={{ value: 'Cr (₹)', angle: -90, position: 'insideLeft' }} />
          <Tooltip 
            cursor={{ fill: '#f8fafc' }}
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
          />
          <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ClientBarChart;