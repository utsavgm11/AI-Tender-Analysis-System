import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Send, FileUp, Loader2, Bot, User, CheckCircle2 } from 'lucide-react';
import DecisionCard from '../components/ui/DecisionCard';

const AnalysisChat = () => {
  const [messages, setMessages] = useState([
    { type: 'ai', text: 'Welcome! Please upload your tender document(s) to begin the strategic analysis.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTender, setActiveTender] = useState(null);
  
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleFileUpload = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // UI Update: List the files being uploaded
    const fileNames = Array.from(files).map(f => f.name).join(', ');
    setMessages(prev => [...prev, { type: 'user', text: `📄 Uploading ${files.length} file(s): ${fileNames}` }]);
    setIsLoading(true);

    const formData = new FormData();
    // CRITICAL: Append each file with the key 'files' to match backend List[UploadFile]
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    try {
      const response = await axios.post('http://127.0.0.1:8001/analyze-tender', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.data.aarvi_intelligence) {
        setActiveTender(response.data.aarvi_intelligence);
      }
      
      setMessages(prev => [...prev, { type: 'ai', result: response.data.aarvi_intelligence }]);
    } catch (e) {
      const errorMsg = e.response?.data?.detail || e.message; 
      console.error("Full Error:", e.response?.data);
      setMessages(prev => [...prev, { type: 'ai', text: `Analysis failed: ${errorMsg}` }]);
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleChat = async () => {
    if (!input.trim()) return;
    
    if (!activeTender) {
      setMessages(prev => [...prev, 
        { type: 'user', text: input },
        { type: 'ai', text: "Please upload the tender files first so I can analyze them." }
      ]);
      setInput('');
      return;
    }

    const userQuery = input;
    setMessages(prev => [...prev, { type: 'user', text: userQuery }]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await axios.post('http://127.0.0.1:8001/chat/', { 
        query: userQuery,
        context: activeTender,
        full_text: activeTender.full_text || "" 
      });
      setMessages(prev => [...prev, { type: 'ai', text: response.data.reply }]);
    } catch (e) {
      setMessages(prev => [...prev, { type: 'ai', text: "I'm having trouble accessing my strategic memory right now." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      {/* Context Indicator */}
      {activeTender && (
        <div className="bg-blue-900 text-white px-4 py-2 flex items-center justify-between text-xs font-medium">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-400" />
            <span>Consulting on: {activeTender.tender_no || "Active Tender"}</span>
          </div>
          <span className="opacity-60">{activeTender.client_name}</span>
        </div>
      )}

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.type === 'ai' && m.result ? (
              <DecisionCard result={m.result} onClose={() => {}} />
            ) : (
              <div className={`flex items-start gap-3 max-w-[85%] md:max-w-2xl ${m.type === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`p-2 rounded-lg ${m.type === 'ai' ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-600'}`}>
                  {m.type === 'ai' ? <Bot size={18} /> : <User size={18} />}
                </div>
                <div className={`p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${
                  m.type === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border rounded-tl-none text-slate-800'
                }`}>
                  {m.text}
                </div>
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-3 text-slate-400 animate-pulse text-sm ml-12">
            <Loader2 size={16} className="animate-spin" />
            Strategic Consultant is thinking...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Bar */}
      <div className="p-4 bg-white border-t">
        <div className="max-w-4xl mx-auto flex items-center gap-2 bg-slate-100 rounded-2xl p-1.5 border focus-within:border-blue-400 transition-all">
          <label className="cursor-pointer p-2.5 hover:bg-white rounded-xl text-slate-500 transition-colors">
            <FileUp size={22} />
            {/* Added 'multiple' attribute here */}
            <input 
              type="file" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept=".pdf,.doc,.docx" 
              multiple 
            />
          </label>
          <input 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            onKeyDown={(e) => e.key === 'Enter' && handleChat()} 
            className="flex-1 bg-transparent p-2.5 outline-none text-sm" 
            placeholder={activeTender ? "Ask about margins, risks, or technicals..." : "Upload your tender files..."} 
          />
          <button 
            onClick={handleChat} 
            className={`p-2.5 rounded-xl ${input.trim() ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnalysisChat;