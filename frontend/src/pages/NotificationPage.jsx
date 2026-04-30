import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowLeft, Bell, Calendar, AlertCircle, Clock, Globe, MapPin, Edit3, Save, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const NotificationPage = () => {
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const navigate = useNavigate();

 const fetchUpcoming = async () => {
  setLoading(true);
  try {
    const res = await axios.get("http://127.0.0.1:8001/tenders/upcoming-prebid");
    
    // Get today's date in YYYY-MM-DD format for comparison
    const today = new Date().toISOString().split('T')[0];

    // Filter: Only keep tenders where pre_bidding_date is today or in the future
    const filteredTenders = res.data.filter(t => {
      if (!t.pre_bidding_date) return false;
      return t.pre_bidding_date >= today;
    });

    setTenders(filteredTenders);
  } catch (err) {
    console.error("Error fetching notifications:", err);
  } finally {
    setLoading(false);
  }
};
  useEffect(() => { fetchUpcoming(); }, []);

  const openEditModal = (tender) => {
    setEditData({ ...tender });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://127.0.0.1:8001/tenders/${encodeURIComponent(editData.tender_no)}`, editData);
      setIsModalOpen(false);
      fetchUpcoming(); // Refresh list
    } catch (err) {
      alert("Failed to update: " + err.message);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="p-2 bg-white border border-slate-200 rounded-full hover:bg-slate-50 shadow-sm">
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Bell className="text-rose-500" /> Upcoming Pre-Bids
          </h2>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="p-5 text-xs font-bold text-slate-400 uppercase">Client / Tender</th>
              <th className="p-5 text-xs font-bold text-slate-400 uppercase">Schedule</th>
              <th className="p-5 text-xs font-bold text-slate-400 uppercase">Mode</th>
              <th className="p-5 text-xs font-bold text-slate-400 uppercase">Venue / Link</th>
              <th className="p-5 text-xs font-bold text-slate-400 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tenders.map((t) => (
              <tr key={t.tender_no} className="hover:bg-slate-50 transition-colors">
                <td className="p-5">
                  <div className="font-bold text-slate-800">{t.name_of_client}</div>
                  <div className="font-mono text-xs text-slate-400">{t.tender_no}</div>
                </td>
                <td className="p-5">
                  <div className="text-sm font-bold text-slate-700">{t.pre_bidding_date}</div>
                  <div className="text-xs text-slate-500">{t.pre_bid_time || '--:--'}</div>
                </td>
                <td className="p-5">
                  <span className="px-3 py-1 bg-slate-100 rounded-full text-xs font-bold">{t.mode_of_conduct || 'N/A'}</span>
                </td>
                <td className="p-5 text-sm text-slate-600 max-w-[200px] truncate">
                  {t.platform_or_address || 'N/A'}
                </td>
                <td className="p-5">
                  <button onClick={() => openEditModal(t)} className="text-indigo-600 hover:text-indigo-800 p-2 hover:bg-indigo-50 rounded-lg">
                    <Edit3 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800">Edit Details</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X /></button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">Date</label>
                  <input type="date" value={editData.pre_bidding_date || ''} onChange={e => setEditData({...editData, pre_bidding_date: e.target.value})} className="w-full p-2 border rounded-lg" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">Time</label>
                  <input type="time" value={editData.pre_bid_time || ''} onChange={e => setEditData({...editData, pre_bid_time: e.target.value})} className="w-full p-2 border rounded-lg" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Mode</label>
                <select value={editData.mode_of_conduct || ''} onChange={e => setEditData({...editData, mode_of_conduct: e.target.value})} className="w-full p-2 border rounded-lg">
                  <option value="Online">Online</option>
                  <option value="Offline">Offline</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Venue / Link</label>
                <textarea value={editData.platform_or_address || ''} onChange={e => setEditData({...editData, platform_or_address: e.target.value})} className="w-full p-2 border rounded-lg" rows="3" />
              </div>

              <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 flex items-center justify-center gap-2">
                <Save size={18} /> Save Changes
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationPage;