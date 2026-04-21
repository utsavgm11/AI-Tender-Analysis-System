import React from 'react';
import { ArrowDown, Zap, Shield, BarChart3, ChevronDown } from 'lucide-react';

const LandingPage = ({ onStart }) => {
  return (
    <div className="relative h-screen w-full flex flex-col items-center justify-center bg-[#0f172a] overflow-hidden">
      {/* Animated Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-600/10 rounded-full blur-[120px]"></div>

      {/* Content Container */}
      <div className="relative z-10 max-w-5xl px-6 text-center space-y-8">
        <div className="flex justify-center animate-bounce-slow">
          <div className="px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-bold uppercase tracking-[0.2em] backdrop-blur-md">
            Strategic Intelligence v2.5
          </div>
        </div>

        <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-tight">
          Aarvi <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Encon</span>
        </h1>
        
        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed">
          The next generation of tender analysis. Cross-reference complex documents with historical data in a single, smart workspace.
        </p>

        <div className="pt-6">
          <button 
            onClick={onStart}
            className="group relative px-10 py-5 bg-white text-slate-900 rounded-2xl font-black text-xl shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-white/40 transition-all hover:-translate-y-1 active:scale-95"
          >
            Enter Dashboard
          </button>
        </div>

        {/* Mini Feature Grid (Smart & Sexy Icons) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16">
            <Feature icon={<Shield size={20}/>} title="PQ Analysis" />
            <Feature icon={<BarChart3 size={20}/>} title="Win Probability" />
            <Feature icon={<Zap size={20}/>} title="RAG Intelligence" />
        </div>
      </div>

      {/* Scroll Hint */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-slate-500 animate-bounce cursor-pointer" onClick={onStart}>
        <ChevronDown size={32} />
      </div>
    </div>
  );
};

const Feature = ({ icon, title }) => (
    <div className="flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
        <div className="text-blue-400">{icon}</div>
        <span className="text-white text-sm font-bold uppercase tracking-widest">{title}</span>
    </div>
)

export default LandingPage;