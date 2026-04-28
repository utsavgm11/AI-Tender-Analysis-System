import React, { useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { format } from 'date-fns';

const BiddingTrendChart = ({ tenders }) => {
  
  // 1. Dynamic Performance Optimization
  const data = useMemo(() => {
    if (!tenders || tenders.length === 0) return [];

    const monthlyData = {};

    tenders.forEach(t => {
      if (!t.received_date) return;
      
      const date = new Date(t.received_date);
      if (isNaN(date.getTime())) return; // Skip invalid dates safely

      // Create a strict chronological sorting key (e.g., "2023-04")
      const sortKey = format(date, 'yyyy-MM');
      // Create the pretty display name (e.g., "Apr 2023")
      const displayMonth = format(date, 'MMM yyyy');

      // Initialize the month if it doesn't exist yet
      if (!monthlyData[sortKey]) {
        monthlyData[sortKey] = {
          sortKey: sortKey, 
          month: displayMonth, 
          count: 0, 
          won: 0 
        };
      }

      // Increment counts
      monthlyData[sortKey].count += 1;
      if ((t.tender_status || '').toLowerCase().includes('won')) {
        monthlyData[sortKey].won += 1;
      }
    });

    // Convert object to array and sort strictly by the chronological key
    return Object.values(monthlyData).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
    
  }, [tenders]); // Re-runs instantly when the dashboard changes the year filter

  // Handle Empty State Safely
  if (!data || data.length === 0) {
    return (
      <div className="h-80 w-full flex flex-col justify-center items-center bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
        <p className="text-slate-400 font-semibold uppercase tracking-widest text-xs">Monthly Tender Trends</p>
        <p className="text-slate-500 mt-2">No data available for the selected period</p>
      </div>
    );
  }

  return (
    <div className="h-80 w-full flex flex-col">
      {/* Dynamic Title */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">
          Monthly Tender Trends
        </h2>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorWon" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          
          {/* XAxis now dynamically maps all months passed to it */}
          <XAxis 
            dataKey="month" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 11, fill: '#64748b' }} 
            dy={10} 
            minTickGap={20} // Prevents labels from overlapping if there are many months
          />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
          
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            labelStyle={{ fontWeight: '900', color: '#1e293b', marginBottom: '4px' }}
            formatter={(value, name) => [
              `${value} ${value === 1 ? 'tender' : 'tenders'}`, 
              name === 'count' ? 'Total' : 'Won'
            ]}
          />
          
          <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>

          <Area 
            type="monotone" 
            dataKey="count" 
            name="count"
            stroke="#6366f1" 
            fillOpacity={1} 
            fill="url(#colorCount)" 
            strokeWidth={3} 
            dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: '#6366f1' }}
            activeDot={{ r: 6, strokeWidth: 0, fill: '#6366f1' }}
          />

          <Area 
            type="monotone" 
            dataKey="won" 
            name="won"
            stroke="#10b981" 
            fillOpacity={1} 
            fill="url(#colorWon)" 
            strokeWidth={3} 
            dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: '#10b981' }}
            activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BiddingTrendChart;