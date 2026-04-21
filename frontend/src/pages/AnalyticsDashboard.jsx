import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';
import { IndianRupee, Target, Award, AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';

const AnalyticsDashboard = ({ onBack }) => {
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://127.0.0.1:8000/tenders');
      setTenders(res.data);
      setError(null);
    } catch (err) {
      setError("Unable to connect to the database. Is the backend running?", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Define and call the function entirely inside the hook
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await axios.get('http://127.0.0.1:8001/tenders');
        setTenders(res.data);
        setError(null);
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Unable to connect to the database.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- MEMOIZED CALCULATIONS ---
  const statusData = useMemo(() => {
    const counts = tenders.reduce((acc, t) => {
      acc[t.tender_status] = (acc[t.tender_status] || 0) + 1;
      return acc;
    }, {});
    return Object.keys(counts).map(key => ({ name: key, value: counts[key] }));
  }, [tenders]);

  const locationData = useMemo(() => {
    const locs = tenders.reduce((acc, t) => {
      const loc = t.location || 'Unknown';
      acc[loc] = (acc[loc] || 0) + 1;
      return acc;
    }, {});
    return Object.keys(locs)
      .map(key => ({ name: key, count: locs[key] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [tenders]);

  const stats = useMemo(() => {
    const totalValue = tenders.reduce((sum, t) => sum + (Number(t.quoted_value) || 0), 0);
    const won = tenders.filter(t => t.tender_status === 'Won').length;
    const closed = tenders.filter(t => ['Won', 'Lost'].includes(t.tender_status)).length;
    const winRate = closed > 0 ? ((won / closed) * 100).toFixed(1) : 0;
    const open = tenders.filter(t => t.tender_status === 'Pending').length;
    return { totalValue, won, winRate, open };
  }, [tenders]);

  const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#6366f1', '#94a3b8'];

  // --- UI RENDER ---
  return (
    <div className="min-h-screen p-8 bg-slate-50">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <button onClick={onBack} className="flex items-center gap-1 text-slate-400 hover:text-indigo-600 font-bold mb-2 transition-colors">
            <ArrowLeft size={16} /> Back to Table
          </button>
          <h1 className="text-3xl font-black text-slate-800">Executive Insights</h1>
        </div>
        <button onClick={fetchData} className="p-3 bg-white rounded-xl shadow-sm border border-slate-200 hover:bg-slate-50 transition-all">
          <RefreshCw size={20} className={loading ? "animate-spin text-indigo-600" : "text-slate-400"} />
        </button>
      </div>

      {error && <div className="p-4 mb-6 bg-rose-50 text-rose-600 rounded-xl font-bold text-center border border-rose-200">{error}</div>}

      {!loading && !error && (
        <>
          {/* KPI GRID */}
          <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
            <KPICard title="Total Portfolio" value={`₹${(stats.totalValue / 10000000).toFixed(2)} Cr`} color="border-indigo-500" icon={<IndianRupee />} />
            <KPICard title="Success Rate" value={`${stats.winRate}%`} color="border-emerald-500" icon={<Target />} />
            <KPICard title="Tenders Won" value={stats.won} color="border-amber-500" icon={<Award />} />
            <KPICard title="Open Tenders" value={stats.open} color="border-blue-500" icon={<AlertCircle />} />
          </div>

          {/* CHARTS */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="p-6 bg-white border border-slate-200 shadow-sm rounded-3xl">
              <h2 className="mb-6 text-xs font-black text-slate-400 uppercase tracking-widest">Status Distribution</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusData} innerRadius={80} outerRadius={110} paddingAngle={5} dataKey="value">
                      {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="p-6 bg-white border border-slate-200 shadow-sm rounded-3xl">
              <h2 className="mb-6 text-xs font-black text-slate-400 uppercase tracking-widest">Top 5 Locations</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={locationData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12, fontWeight: 'bold'}} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#6366f1" radius={[0, 10, 10, 0]} barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const KPICard = ({ title, value, icon, color }) => (
  <div className={`bg-white p-6 rounded-3xl border border-b-4 ${color} shadow-sm flex items-center justify-between`}>
    <div>
      <p className="text-[10px] font-black uppercase text-slate-400 mb-1">{title}</p>
      <h3 className="text-2xl font-black text-slate-800 tracking-tight">{value}</h3>
    </div>
    <div className="p-3 bg-slate-50 rounded-2xl text-slate-500">{icon}</div>
  </div>
);

export default AnalyticsDashboard;