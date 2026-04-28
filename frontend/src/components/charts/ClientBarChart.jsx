import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

const ClientBarChart = ({ tenders }) => {
  // Performance Optimization with useMemo
  const data = useMemo(() => {
    if (!tenders || tenders.length === 0) return [];

    // 1. Filter only "Won" tenders and aggregate
    const clientData = tenders.reduce((acc, t) => {
      const status = (t.tender_status || '').toLowerCase();
      if (!status.includes('won')) return acc; // Ignore lost/pending/regret

      // Clean client name: remove extra spaces, fallback to "Unknown"
      const client = (t.name_of_client || '').trim() || 'Unknown';
      
      // Convert safely to number, fallback to 0
      const value = Number(t.quoted_value) || 0;

      acc[client] = (acc[client] || 0) + value;
      return acc;
    }, {});

    // 2. Format to Crores, sort descending, slice top 5
    return Object.keys(clientData)
      .map(key => ({
        name: key,
        value: clientData[key] / 10000000 // Convert to Crores
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [tenders]); // Re-runs when tender data changes (e.g., changing year filter)

  // Handle Empty State Safely
  if (!data || data.length === 0) {
    return (
      <div className="h-80 w-full flex flex-col justify-center items-center bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
        <p className="text-slate-400 font-semibold uppercase tracking-widest text-xs">Top Clients by Revenue</p>
        <p className="text-slate-500 mt-2">No won tenders data available</p>
      </div>
    );
  }

  return (
    <div className="h-80 w-full flex flex-col">
      {/* Chart Title */}
      <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
        Top Clients by Revenue
      </h2>
      
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          
          {/* XAxis with rotated labels for long client names */}
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 11, fill: '#64748b' }} 
            angle={-35} 
            textAnchor="end"
            height={60} // Provides space for rotated labels to not get cut off
          />
          
          {/* YAxis formats ticks directly into Cr */}
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 11, fill: '#64748b' }} 
            tickFormatter={(val) => `₹${val}Cr`}
          />
          
          {/* Upgraded Tooltip */}
          <Tooltip 
            cursor={{ fill: '#f8fafc' }}
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            labelStyle={{ fontWeight: '900', color: '#1e293b', marginBottom: '4px' }}
            formatter={(value) => [`₹${value.toFixed(2)} Cr`, 'Revenue']}
          />
          
          <Bar 
            dataKey="value" 
            name="Revenue"
            fill="#6366f1" 
            radius={[6, 6, 0, 0]} 
            barSize={40} 
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ClientBarChart;