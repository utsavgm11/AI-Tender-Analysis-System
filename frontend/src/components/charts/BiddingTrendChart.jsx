import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';

const BiddingTrendChart = ({ tenders }) => {
  // Group tenders by Month
  const monthlyData = tenders.reduce((acc, t) => {
    if (!t.received_date) return acc;
    const month = format(parseISO(t.received_date), 'MMM yyyy');
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {});

  const data = Object.keys(monthlyData).map(key => ({
    month: key,
    count: monthlyData[key]
  })).slice(-6); // Last 6 months

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
          <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
          <Tooltip />
          <Area type="monotone" dataKey="count" stroke="#6366f1" fillOpacity={1} fill="url(#colorCount)" strokeWidth={3} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BiddingTrendChart;
