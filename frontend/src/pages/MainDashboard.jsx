import React, { useState } from 'react'

// Import Layout Components
import Sidebar from '../components/layout/Sidebar'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'

// Import View Components
import AnalysisChat from './AnalysisChat'
import DashboardView from './DashboardView'

const MainDashboard = () => {
  // This state decides which page is currently visible
  const [activeTab, setActiveTab] = useState('analysis')

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 w-full overflow-hidden font-sans">
      
      {/* 1. Static Sidebar on the left */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* 2. Main column on the right */}
      <div className="flex-1 flex flex-col relative w-full h-full overflow-hidden">
        
        {/* Top Navbar */}
        <Navbar title={activeTab === 'analysis' ? 'Tender Analysis' : 'Master Dashboard'} />
        
        {/* Dynamic Content Area */}
        <main className="flex-1 overflow-hidden relative">
          {activeTab === 'analysis' ? <AnalysisChat /> : <DashboardView />}
        </main>
        
        {/* Bottom Footer */}
        <Footer />
        
      </div>
    </div>
  )
}

export default MainDashboard