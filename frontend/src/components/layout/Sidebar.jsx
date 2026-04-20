import React from 'react'
import { LayoutGrid, FileText, Settings } from 'lucide-react'

const Sidebar = ({ activeTab, setActiveTab }) => {
  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col hidden md:flex shrink-0 z-20 shadow-xl">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800">
        <h2 className="text-2xl font-bold tracking-tight text-blue-400">AARVI</h2>
        <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">Tender Intelligence</p>
      </div>
      
      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-2">
        <button 
          onClick={() => setActiveTab('analysis')}
          className={`flex items-center gap-3 w-full p-3 rounded-xl font-medium transition-all ${
            activeTab === 'analysis' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <LayoutGrid size={20} /> Analysis Chat
        </button>

        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-3 w-full p-3 rounded-xl font-medium transition-all ${
            activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <FileText size={20} /> Master Dashboard
        </button>
      </nav>

      {/* Bottom Settings */}
      <div className="p-4 border-t border-slate-800">
        <button className="flex items-center gap-3 w-full p-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all">
          <Settings size={20} /> Settings
        </button>
      </div>
    </aside>
  )
}

export default Sidebar