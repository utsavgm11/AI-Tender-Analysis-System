import React from 'react'
import { User, Bell } from 'lucide-react'

const Navbar = ({ title = "Dashboard" }) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm shrink-0 w-full z-10">
      
      {/* Dynamic Title based on Sidebar selection */}
      <h1 className="font-semibold text-slate-800 text-lg truncate">
        {title}
      </h1>
      
      {/* Right Side: Status and Profile */}
      <div className="flex items-center gap-4">
        
        {/* Connection Status (Hides on very small screens) */}
        <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> 
          <span>Backend Online</span>
        </div>
        
        {/* Notification Icon (Optional, good for future features) */}
        <button className="text-slate-400 hover:text-blue-600 transition-colors">
          <Bell size={18} />
        </button>

        {/* User Profile Avatar */}
        <div className="w-9 h-9 bg-blue-50 text-blue-700 rounded-full flex items-center justify-center border border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors shadow-sm">
          <User size={18} />
        </div>
        
      </div>
    </header>
  )
}

export default Navbar