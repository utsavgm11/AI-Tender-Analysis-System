import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  Target, Clock, CheckCircle, XCircle, FileText, 
  Search, Plus, Edit3, X, BarChart2 
} from 'lucide-react';

const MasterDashboard = ({ onViewAnalytics }) => {
  const [tenders, setTenders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  
  const [formData, setFormData] = useState({
    tender_no: '', name_of_client: '', tender_status: 'Pending', 
    received_date: '', due_date: '', location: '', 
    tender_open_price: '', quoted_value: '', description: '', 
    project_manager: '', emd: '', emd_status: '', 
    tender_fee_status: '', price_status: '', source: '', 
    comments: '', docs_prepared_by: '', financial_year: '2023-2024'
  });

  const API_URL = "http://127.0.0.1:8001";

  const fetchTenders = async () => {
    try {
      const res = await axios.get(`${API_URL}/tenders`);
      setTenders(res.data);
    } catch (err) { console.error("Fetch Error:", err); }
  };

  useEffect(() => { 
    fetchTenders().finally(() => setLoading(false));
  }, []);

  const handleStatusChange = async (tender_no, newStatus) => {
    try {
      await axios.patch(`${API_URL}/tenders/${encodeURIComponent(tender_no)}`, { tender_status: newStatus });
      fetchTenders(); 
    } catch (err) { alert("Error Updating: " + (err.response?.data?.error || err.message)); }
  };

  const openAddModal = () => {
    setModalMode('add');
    setFormData({ 
      tender_no: '', name_of_client: '', tender_status: 'Pending', 
      received_date: '', due_date: '', location: '', 
      tender_open_price: '', quoted_value: '', description: '', 
      project_manager: '', emd: '', emd_status: '', 
      tender_fee_status: '', price_status: '', source: '', 
      comments: '', docs_prepared_by: '', financial_year: '2023-2024'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (tender) => {
    setModalMode('edit');
    setFormData({
      ...tender,
      received_date: tender.received_date ? tender.received_date.split(' ')[0] : '',
      due_date: tender.due_date ? tender.due_date.split(' ')[0] : '', 
    });
    setIsModalOpen(true);
  };

  const handleSaveTender = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (modalMode === 'add') {
        await axios.post(`${API_URL}/tenders`, formData);
      } else {
        await axios.put(`${API_URL}/tenders/${encodeURIComponent(formData.tender_no)}`, formData);
      }
      setIsModalOpen(false);
      fetchTenders().finally(() => setLoading(false));
    } catch (err) {
      setLoading(false);
      alert("Failed to save: " + (err.response?.data?.error || err.message));
    }
  };

  const handleDownload = () => window.open(`${API_URL}/export-tenders`, '_blank');

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const getRowStyle = (dateStr) => {
    if (!dateStr) return '';
    const dueDate = new Date(dateStr);
    const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'opacity-50 bg-slate-100 grayscale-[50%]'; 
    if (diffDays >= 0 && diffDays <= 4) return 'bg-red-50 border-l-4 border-l-red-500'; 
    return ''; 
  };

  const sortedTenders = useMemo(() => {
    return tenders.filter(t => 
      t.name_of_client?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      t.tender_no?.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => new Date(a.due_date || '9999-12-31') - new Date(b.due_date || '9999-12-31'));
  }, [tenders, searchTerm]);

  const stats = useMemo(() => ({
    totalActive: tenders.filter(t => t.due_date && new Date(t.due_date) >= today && !['Tender Won', 'Tender Lost', 'Tender Cancelled', 'Tender Regret'].includes(t.tender_status)).length,
    quoted: tenders.filter(t => t.tender_status === 'Tender Quoted').length,
    won: tenders.filter(t => t.tender_status === 'Tender Won').length,
    lost: tenders.filter(t => t.tender_status === 'Tender Lost').length,
  }), [tenders, today]);

  if (loading) return <div className="p-20 text-center font-bold text-slate-400">Loading Database...</div>;

  return (
    <div className="relative p-8 h-full bg-slate-50 overflow-y-auto">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Active" value={stats.totalActive} icon={<Clock className="text-blue-500"/>} />
        <StatCard title="Tender Quoted" value={stats.quoted} icon={<Target className="text-amber-500"/>} />
        <StatCard title="Tenders Won" value={stats.won} icon={<CheckCircle className="text-emerald-600"/>} />
        <StatCard title="Tenders Lost" value={stats.lost} icon={<XCircle className="text-rose-500"/>} />
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="relative w-96">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          <input className="w-full pl-10 py-2 rounded-xl border outline-none" placeholder="Search Client or Tender..." onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="flex gap-3">
          <button onClick={openAddModal} className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"><Plus size={16}/> Add Tender</button>
          <button onClick={handleDownload} className="bg-slate-800 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"><FileText size={16} /> Export</button>
          <button onClick={onViewAnalytics} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold flex gap-2 items-center"><BarChart2 size={16} /> Analytics</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-900 text-white text-xs">
            <tr><th className="p-4">CLIENT</th><th className="p-4">TENDER NO</th><th className="p-4">DUE DATE</th><th className="p-4">STATUS</th><th className="p-4 text-center">ACTION</th></tr>
          </thead>
          <tbody>
            {sortedTenders.map((t) => (
              <tr key={t.tender_no} className={`border-b text-sm transition-all ${getRowStyle(t.due_date)}`}>
                <td className="p-4 font-bold text-slate-700">{t.name_of_client}</td>
                <td className="p-4 font-mono text-slate-500">{t.tender_no}</td>
                <td className="p-4 font-bold">{t.due_date ? new Date(t.due_date).toLocaleDateString() : 'N/A'}</td>
                <td className="p-4">
                  <select value={t.tender_status || 'Pending'} onChange={(e) => handleStatusChange(t.tender_no, e.target.value)} className="bg-transparent border p-1 rounded font-black text-[10px] uppercase text-indigo-600 outline-none">
                    <option value="Pending">Pending</option><option value="Tender Quoted">Tender Quoted</option>
                    <option value="Tender Won">Tender Won</option><option value="Tender Lost">Tender Lost</option>
                    <option value="Tender Regret">Tender Regret</option><option value="Tender Cancelled">Tender Cancelled</option>
                  </select>
                </td>
                <td className="p-4 text-center"><button onClick={() => openEditModal(t)} className="p-2 text-slate-400 hover:text-indigo-600"><Edit3 size={18} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-slate-400"><X size={24} /></button>
            <h2 className="text-2xl font-black mb-6">{modalMode === 'add' ? 'Add Tender' : 'Edit Tender'}</h2>
            <form onSubmit={handleSaveTender} className="space-y-4">
               {/* Inputs go here */}
               <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold">Save Record</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ title, value, icon }) => (
  <div className="bg-white p-6 rounded-2xl border shadow-sm flex items-center justify-between">
    <div><p className="text-[10px] font-bold text-slate-400 uppercase">{title}</p><h3 className="text-2xl font-black">{value}</h3></div>
    <div className="p-3 bg-slate-50 rounded-xl">{icon}</div>
  </div>
);

export default MasterDashboard;