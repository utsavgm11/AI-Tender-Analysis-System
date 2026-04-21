import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  Target, Clock, CheckCircle, XCircle, FileText, 
  Search, BarChart2, Plus, Edit3, X 
} from 'lucide-react';

const MasterDashboard = ({ onViewAnalytics }) => {
  const [tenders, setTenders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  
  // FORM DATA - Captures every single column needed for the backend DB
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
    } catch (err) { 
      console.error(err); 
    }
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
      tender_no: tender.tender_no || '',
      name_of_client: tender.name_of_client || '',
      tender_status: tender.tender_status || 'Pending',
      received_date: tender.received_date ? tender.received_date.split(' ')[0] : '',
      due_date: tender.due_date ? tender.due_date.split(' ')[0] : '', 
      location: tender.location || '',
      tender_open_price: tender.tender_open_price || '',
      quoted_value: tender.quoted_value || '',
      description: tender.description || '',
      project_manager: tender.project_manager || '',
      emd: tender.emd || '',
      emd_status: tender.emd_status || '',
      tender_fee_status: tender.tender_fee_status || '',
      price_status: tender.price_status || '',
      source: tender.source || '',
      comments: tender.comments || '',
      docs_prepared_by: tender.docs_prepared_by || '',
      financial_year: tender.financial_year || '2023-2024'
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
    let filtered = tenders.filter(t => 
      t.name_of_client?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      t.tender_no?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return filtered.sort((a, b) => {
      const dateA = a.due_date ? new Date(a.due_date) : new Date('9999-12-31');
      const dateB = b.due_date ? new Date(b.due_date) : new Date('9999-12-31');
      const isAPast = dateA < today;
      const isBPast = dateB < today;

      if (isAPast && !isBPast) return 1;  
      if (!isAPast && isBPast) return -1; 
      return dateA - dateB; 
    });
  }, [tenders, searchTerm, today]);

  const stats = useMemo(() => {
    const totalActive = tenders.filter(t => t.due_date && new Date(t.due_date) >= today && !['Tender Won', 'Tender Lost', 'Tender Cancelled', 'Tender Regret'].includes(t.tender_status)).length;
    const quoted = tenders.filter(t => t.tender_status === 'Tender Quoted').length;
    const won = tenders.filter(t => t.tender_status === 'Tender Won').length;
    const lost = tenders.filter(t => t.tender_status === 'Tender Lost').length;
    return { totalActive, quoted, won, lost };
  }, [tenders, today]);

  if (loading) return <div className="p-20 text-center font-bold text-slate-400">Loading Database...</div>;

  return (
    <div className="relative p-8 h-full bg-slate-50 overflow-y-auto">
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Active" value={stats.totalActive} icon={<Clock className="text-blue-500"/>} />
        <StatCard title="Tender Quoted" value={stats.quoted} icon={<Target className="text-amber-500"/>} />
        <StatCard title="Tenders Won" value={stats.won} icon={<CheckCircle className="text-emerald-600"/>} />
        <StatCard title="Tenders Lost" value={stats.lost} icon={<XCircle className="text-rose-500"/>} />
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="relative w-96">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          <input className="w-full pl-10 py-2 rounded-xl border outline-none" placeholder="Search Client or Tender..." onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        
        {/* ACTION BUTTONS */}
        <div className="flex gap-3">
          <button onClick={openAddModal} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2">
            <Plus size={16}/> Add Tender
          </button>
          <button onClick={handleDownload} className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2">
            <FileText size={16} /> Export Excel
          </button>
          <button onClick={onViewAnalytics} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold flex gap-2 items-center">
            <BarChart2 size={16} /> View Analytics
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-900 text-white text-xs">
            <tr>
              <th className="p-4">CLIENT NAME</th>
              <th className="p-4">TENDER NO</th>
              <th className="p-4">DUE DATE</th>
              <th className="p-4">STATUS</th>
              <th className="p-4 text-center">ACTION</th>
            </tr>
          </thead>
          <tbody>
            {sortedTenders.map((t) => (
              <tr key={t.tender_no} className={`border-b text-sm transition-all ${getRowStyle(t.due_date)}`}>
                <td className="p-4 font-bold text-slate-700">{t.name_of_client}</td>
                <td className="p-4 font-mono text-slate-500">{t.tender_no}</td>
                <td className="p-4 font-bold">
                  {t.due_date ? new Date(t.due_date).toLocaleDateString() : 'N/A'}
                </td>
                <td className="p-4">
                  <select 
                    value={t.tender_status || 'Pending'} 
                    onChange={(e) => handleStatusChange(t.tender_no, e.target.value)}
                    className="bg-transparent border border-slate-300 p-1 rounded font-black text-[10px] uppercase text-indigo-600 outline-none focus:bg-white"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Tender Quoted">Tender Quoted</option>
                    <option value="Tender Won">Tender Won</option>
                    <option value="Tender Lost">Tender Lost</option>
                    <option value="Tender Regret">Tender Regret</option>
                    <option value="Tender Cancelled">Tender Cancelled</option>
                  </select>
                </td>
                <td className="p-4 text-center">
                  <button onClick={() => openEditModal(t)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">
                    <Edit3 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-rose-500">
              <X size={24} />
            </button>
            <h2 className="text-2xl font-black mb-6">{modalMode === 'add' ? 'Add New Tender Data' : 'Edit Tender Database'}</h2>
            
            <form onSubmit={handleSaveTender} className="space-y-4">
              {/* PRIMARY ROW */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500">Tender No *</label>
                  <input required disabled={modalMode === 'edit'} type="text" value={formData.tender_no} onChange={e => setFormData({...formData, tender_no: e.target.value})} className="w-full mt-1 p-2 border rounded-lg bg-slate-50" placeholder="e.g. GEM/2023/B/..." />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-slate-500">Client Name *</label>
                  <input required type="text" value={formData.name_of_client} onChange={e => setFormData({...formData, name_of_client: e.target.value})} className="w-full mt-1 p-2 border rounded-lg bg-slate-50" />
                </div>
              </div>

              {/* DETAILS ROW */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="col-span-4">
                  <label className="text-xs font-bold text-slate-500">Description</label>
                  <input type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full mt-1 p-2 border rounded-lg bg-slate-50" />
                </div>
              </div>

              {/* DATE & MONEY ROW */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500">Status *</label>
                  <select required value={formData.tender_status} onChange={e => setFormData({...formData, tender_status: e.target.value})} className="w-full mt-1 p-2 border rounded-lg bg-slate-50">
                    <option value="Pending">Pending</option>
                    <option value="Tender Quoted">Tender Quoted</option>
                    <option value="Tender Won">Tender Won</option>
                    <option value="Tender Lost">Tender Lost</option>
                    <option value="Tender Regret">Tender Regret</option>
                    <option value="Tender Cancelled">Tender Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500">Received Date</label>
                  <input type="date" value={formData.received_date} onChange={e => setFormData({...formData, received_date: e.target.value})} className="w-full mt-1 p-2 border rounded-lg bg-slate-50" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500">Due Date *</label>
                  <input required type="date" value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} className="w-full mt-1 p-2 border rounded-lg bg-slate-50" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500">Quoted Value (₹)</label>
                  <input type="number" step="0.01" value={formData.quoted_value} onChange={e => setFormData({...formData, quoted_value: e.target.value})} className="w-full mt-1 p-2 border rounded-lg bg-slate-50" />
                </div>
              </div>

              {/* OPERATION ROW */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500">Location</label>
                  <input type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full mt-1 p-2 border rounded-lg bg-slate-50" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500">Project Manager</label>
                  <input type="text" value={formData.project_manager} onChange={e => setFormData({...formData, project_manager: e.target.value})} className="w-full mt-1 p-2 border rounded-lg bg-slate-50" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500">Docs Prepared By</label>
                  <input type="text" value={formData.docs_prepared_by} onChange={e => setFormData({...formData, docs_prepared_by: e.target.value})} className="w-full mt-1 p-2 border rounded-lg bg-slate-50" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500">Source</label>
                  <input type="text" value={formData.source} onChange={e => setFormData({...formData, source: e.target.value})} className="w-full mt-1 p-2 border rounded-lg bg-slate-50" />
                </div>
              </div>

              {/* FINANCE/EMD ROW */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500">EMD Value</label>
                  <input type="text" value={formData.emd} onChange={e => setFormData({...formData, emd: e.target.value})} className="w-full mt-1 p-2 border rounded-lg bg-slate-50" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500">EMD Status</label>
                  <input type="text" value={formData.emd_status} onChange={e => setFormData({...formData, emd_status: e.target.value})} className="w-full mt-1 p-2 border rounded-lg bg-slate-50" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500">Tender Fee Status</label>
                  <input type="text" value={formData.tender_fee_status} onChange={e => setFormData({...formData, tender_fee_status: e.target.value})} className="w-full mt-1 p-2 border rounded-lg bg-slate-50" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500">Price Status</label>
                  <input type="text" value={formData.price_status} onChange={e => setFormData({...formData, price_status: e.target.value})} className="w-full mt-1 p-2 border rounded-lg bg-slate-50" />
                </div>
              </div>

              <div className="mt-8 flex gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100">
                  Cancel
                </button>
                <button type="submit" className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700">
                  {modalMode === 'add' ? 'Save New Tender Data' : 'Update Database'}
                </button>
              </div>
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