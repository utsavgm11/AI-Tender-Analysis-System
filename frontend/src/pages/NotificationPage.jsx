import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowLeft, Bell, Calendar, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const NotificationPage = () => {
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate(); // Hook for going backward

  useEffect(() => {
    const fetchUpcoming = async () => {
      try {
        const res = await axios.get("http://127.0.0.1:8001/tenders/upcoming-prebid");
        setTenders(res.data);
      } catch (err) {
        console.error("Error fetching notifications:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUpcoming();
  }, []);

  return (
    // No Navbar here - it is already handled in your App.jsx global layout
    <div className="p-8 max-w-6xl mx-auto">
      
      {/* Header Area */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate(-1)} // Takes user to the previous page
          className="p-2 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-colors shadow-sm"
        >
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Bell className="text-rose-500" /> Upcoming Pre-Bids
          </h2>
          <p className="text-slate-500 text-sm">Reviewing tender pre-bid requirements.</p>
        </div>
      </div>

      {/* Content Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading alerts...</div>
        ) : tenders.length === 0 ? (
          <div className="p-12 text-center">
            <AlertCircle size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500">All caught up! No upcoming pre-bids.</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="p-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Client</th>
                <th className="p-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Tender No</th>
                <th className="p-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Pre-Bid Date</th>
                <th className="p-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tenders.map((t) => (
                <tr key={t.tender_no} className="hover:bg-slate-50 transition-colors">
                  <td className="p-5 font-bold text-slate-800">{t.name_of_client}</td>
                  <td className="p-5 font-mono text-slate-500">{t.tender_no}</td>
                  <td className="p-5">
                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 rounded-full font-bold text-xs">
                      <Calendar size={12} /> {t.pre_bidding_date}
                    </span>
                  </td>
                  <td className="p-5">
                    <span className="text-xs font-bold text-slate-400 uppercase">{t.tender_status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default NotificationPage;