import React from 'react';
import { LayoutGrid, FileText, BarChart2, X } from 'lucide-react';

const Sidebar = ({ isOpen, onClose, activeTab, setActiveTab }) => {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-40" onClick={onClose}></div>
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:relative z-50 w-64 h-screen bg-slate-900 text-white flex flex-col shadow-2xl transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
      `}>
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black tracking-tighter text-blue-400">AARVI</h2>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Tender Intelligence</p>
          </div>
          <button onClick={onClose} className="md:hidden text-slate-400"><X size={24} /></button>
        </div>
        
        {/* Nav Links */}
        <nav className="flex-1 p-4 space-y-2">
          {/* Analysis Chat */}
          <button onClick={() => { setActiveTab('analysis'); onClose(); }} 
            className={`flex items-center gap-3 w-full p-3 rounded-xl font-bold transition-all ${activeTab === 'analysis' ? 'bg-blue-600' : 'hover:bg-slate-800'}`}>
            <LayoutGrid size={18} /> Analysis Chat
          </button>
          
          {/* Master Dashboard */}
          <button onClick={() => { setActiveTab('dashboard'); onClose(); }} 
            className={`flex items-center gap-3 w-full p-3 rounded-xl font-bold transition-all ${activeTab === 'dashboard' ? 'bg-blue-600' : 'hover:bg-slate-800'}`}>
            <FileText size={18} /> Master Dashboard
          </button>

          {/* Analytics Dashboard */}
          <button onClick={() => { setActiveTab('analytics'); onClose(); }} 
            className={`flex items-center gap-3 w-full p-3 rounded-xl font-bold transition-all ${activeTab === 'analytics' ? 'bg-blue-600' : 'hover:bg-slate-800'}`}>
            <BarChart2 size={18} /> Analytics Dashboard
          </button>
        </nav>
      </aside>
    </>
  );
};
export default Sidebar;