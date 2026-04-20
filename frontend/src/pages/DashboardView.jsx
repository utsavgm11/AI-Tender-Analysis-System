import React from 'react'
import { BarChart3 } from 'lucide-react'

const DashboardView = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-slate-500 bg-slate-50 p-8">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl shadow-sm p-10 text-center flex flex-col items-center">
        <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-6">
          <BarChart3 size={32} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-3">Master Dashboard</h2>
        <p className="text-slate-500 leading-relaxed">
          Historical tender analytics and win-rate tracking are currently under development. Awaiting backend data integration.
        </p>
      </div>
    </div>
  )
}

export default DashboardView