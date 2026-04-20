import React from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck, ArrowRight } from 'lucide-react'

const LandingPage = ({ onLaunch }) => {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-900 text-white relative overflow-hidden">
      {/* Background Corporate Glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-pulse"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="z-10 flex flex-col items-center text-center px-4"
      >
        <div className="bg-blue-900/50 p-4 rounded-2xl mb-6 border border-blue-500/30">
          <ShieldCheck size={56} className="text-blue-400" />
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
          Aarvi Tender <span className="text-blue-400">System</span>
        </h1>
        <p className="text-xl text-slate-400 mb-12 max-w-2xl leading-relaxed">
          Next-generation strategic intelligence for engineering bids. Powered by RAG architecture and historical data.
        </p>
        
        <button 
          onClick={onLaunch}
          className="group flex items-center gap-3 bg-white text-slate-900 px-8 py-4 rounded-full font-bold text-lg hover:bg-blue-50 transition-all hover:scale-105 shadow-[0_0_40px_rgba(59,130,246,0.3)]"
        >
          Launch Workspace
          <ArrowRight className="group-hover:translate-x-2 transition-transform" />
        </button>
      </motion.div>
    </div>
  )
}

export default LandingPage