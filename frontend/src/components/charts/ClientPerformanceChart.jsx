import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';

const ClientPerformanceChart = ({ tenders }) => {
  // Performance Optimization with useMemo
  const data = useMemo(() => {
    if (!tenders || tenders.length === 0) return [];

    // 1. Group by client and count Won vs Lost
    const clientData = tenders.reduce((acc, t) => {
      // Normalize status
      const status = (t.tender_status || '').toLowerCase().trim();
      const isWon = status.includes('won');
      const isLost = status.includes('lost') || status.includes('regret');

      // Ignore pending/quoted tenders entirely for this chart
      if (!isWon && !isLost) return acc;

      // Clean client name
      const client = (t.name_of_client || '').trim() || 'Unknown';

      // Initialize client in accumulator if missing
      if (!acc[client]) {
        acc[client] = { name: client, Won: 0, Lost: 0 };
      }

      // Increment respective counters
      if (isWon) acc[client].Won += 1;
      if (isLost) acc[client].Lost += 1;

      return acc;
    }, {});

    // 2. Filter, Sort, and Slice Top 5
    return Object.values(clientData)
      // Remove clients who somehow have 0 won and 0 lost (edge case protection)
      .filter(c => c.Won > 0 || c.Lost > 0)
      // Sort by total volume of closed tenders (Won + Lost) descending
      .sort((a, b) => (b.Won + b.Lost) - (a.Won + a.Lost))
      // Take only the top 5 clients
      .slice(0, 5);

  }, [tenders]); // Re-runs instantly when tender data changes

  // Handle Empty State Safely
  if (!data || data.length === 0) {
    return (
      <div className="h-80 w-full flex flex-col justify-center items-center bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
        <p className="text-slate-400 font-semibold uppercase tracking-widest text-xs">Client Performance</p>
        <p className="text-slate-500 mt-2">No closed tenders (won/lost) available</p>
      </div>
    );
  }

  return (
    <div className="h-80 w-full flex flex-col">
      {/* Chart Title */}
      <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
        Client Performance (Win vs Loss)
      </h2>
      
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          
          {/* XAxis rotated to prevent long client names from overlapping */}
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 11, fill: '#64748b' }} 
            angle={-35} 
            textAnchor="end"
            height={60} 
          />
          
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 11, fill: '#64748b' }} 
            allowDecimals={false} // Prevents showing "1.5 tenders"
          />
          
          <Tooltip 
            cursor={{ fill: '#f8fafc' }}
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            labelStyle={{ fontWeight: '900', color: '#1e293b', marginBottom: '8px' }}
          />
          
          <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
          
          {/* Stacked Bars - Using identical stackId="a" creates the stacked effect */}
          <Bar 
            dataKey="Won" 
            stackId="a" 
            fill="#10b981" 
            barSize={40} 
            radius={[0, 0, 4, 4]} // Rounded bottom only
          />
          <Bar 
            dataKey="Lost" 
            stackId="a" 
            fill="#ef4444" 
            barSize={40} 
            radius={[4, 4, 0, 0]} // Rounded top only
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ClientPerformanceChart;