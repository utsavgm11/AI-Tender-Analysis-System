import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { ArrowLeft } from 'lucide-react';
import { 
  BiddingTrendChart, 
  ClientBarChart, 
  StatusPieChart, 
  TenderMap,
  KPICardGroup,
  ClientPerformanceChart // Added missing comma above
} from '../components/charts'; 

const AnalyticsDashboard = ({ onBack }) => {
  const [tenders, setTenders] = useState([]);
  const [kpiData, setKpiData] = useState({});
  const [selectedYear, setSelectedYear] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. Fetch Logic (Parallel Fetching for Performance)
  const fetchData = useCallback(async () => {
    try {
      const [tenderRes, kpiRes] = await Promise.all([
        axios.get('http://127.0.0.1:8001/tenders'),
        axios.get(`http://127.0.0.1:8001/kpi-stats?year=${selectedYear}`)
      ]);
      
      setTenders(tenderRes.data);
      setKpiData(kpiRes.data);
      setError(null);
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Unable to connect to the database.");
    } finally {
      setLoading(false);
    }
  }, [selectedYear]);

  // 2. Live Polling (Every 30 seconds)
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // 3. Derived State: Filters
  const availableYears = useMemo(() => {
    const years = [...new Set(tenders.map(t => t.financial_year))];
    return ['All', ...years.sort().reverse()];
  }, [tenders]);

  const filteredTenders = useMemo(() => {
    if (selectedYear === 'All') return tenders;
    return tenders.filter(t => t.financial_year === selectedYear);
  }, [tenders, selectedYear]);

  return (
    <div className="min-h-screen p-8 bg-slate-50">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          {/* Restored Back button for proper navigation */}
          {onBack && (
            <button onClick={onBack} className="flex items-center gap-1 text-slate-400 hover:text-indigo-600 font-bold mb-2">
              <ArrowLeft size={16} /> Back
            </button>
          )}
          <h1 className="text-3xl font-black text-slate-800">Executive Insights</h1>
        </div>
        
        <select 
          value={selectedYear} 
          onChange={(e) => setSelectedYear(e.target.value)}
          className="p-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 shadow-sm outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {availableYears.map(year => (
            <option key={year} value={year}>{year === 'All' ? 'All Years' : year}</option>
          ))}
        </select>
      </div>

      {error && <div className="p-4 mb-6 bg-rose-50 text-rose-600 rounded-xl text-center border border-rose-200">{error}</div>}

      {!loading && (
        <>
          {/* KPI GRID - Top Level */}
          <KPICardGroup stats={kpiData} />

          {/* CHARTS GRID */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            
            {/* ROW 2: Status & Trend (1 column each on large screens) */}
            <div className="p-6 bg-white border border-slate-200 shadow-sm rounded-3xl">
              <StatusPieChart tenders={filteredTenders} />
            </div>
            <div className="p-6 bg-white border border-slate-200 shadow-sm rounded-3xl">
              <BiddingTrendChart tenders={filteredTenders} />
            </div>

            {/* ROW 3: Client Breakdown (1 column each on large screens) */}
            <div className="p-6 bg-white border border-slate-200 shadow-sm rounded-3xl">
              <ClientBarChart tenders={filteredTenders} />
            </div>
            <div className="p-6 bg-white border border-slate-200 shadow-sm rounded-3xl">
              <ClientPerformanceChart tenders={filteredTenders} />
            </div>

            {/* ROW 4: Tender Map (Full Width - Spans 2 columns) */}
            <div className="p-6 bg-white border border-slate-200 shadow-sm rounded-3xl col-span-1 lg:col-span-2 h-96">
              <TenderMap tenders={filteredTenders} />
            </div>

          </div>
        </>
      )}
    </div>
  );
};

export default AnalyticsDashboard;