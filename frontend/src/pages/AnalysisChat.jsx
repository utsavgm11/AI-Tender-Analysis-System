import React, { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { Send, FileUp, Loader2, Bot, User, CheckCircle2 } from 'lucide-react'
import DecisionCard from '../components/ui/DecisionCard'

const AnalysisChat = () => {
  const [messages, setMessages] = useState([
    { type: 'ai', text: 'Welcome! Please upload a tender document to begin the strategic analysis.' }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [activeTender, setActiveTender] = useState(null) // This holds the "Memory" for the AI
  
  const fileInputRef = useRef(null)
  const messagesEndRef = useRef(null)

  // Auto-scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    setMessages(prev => [...prev, { type: 'user', text: `📄 Uploading: ${file.name}` }])
    setIsLoading(true)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await axios.post('http://127.0.0.1:8000/analyze-file/', formData)
      
      // 1. Save the analysis result as "Context" for the chatbot
      if (response.data.aarvi_intelligence) {
        setActiveTender(response.data.aarvi_intelligence)
      }
      
      // 2. Add the AI result (the Card) to the chat
      setMessages(prev => [...prev, { type: 'ai', result: response.data }])
    } catch (e) {
      setMessages(prev => [...prev, { type: 'ai', text: "Analysis failed. Check if the backend is running." }])
    } finally {
      setIsLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleChat = async () => {
    if (!input.trim()) return
    
    // If no tender is uploaded yet, warn the user
    if (!activeTender) {
      setMessages(prev => [...prev, 
        { type: 'user', text: input },
        { type: 'ai', text: "Please upload a tender document first so I can provide specific strategic advice." }
      ])
      setInput('')
      return
    }

    const userQuery = input
    setMessages(prev => [...prev, { type: 'user', text: userQuery }])
    setInput('')
    setIsLoading(true)

    try {
      // Send the user question AND the current tender context to the backend
      const response = await axios.post('http://127.0.0.1:8000/chat/', { 
        query: userQuery,
        context: activeTender 
      })
      
      setMessages(prev => [...prev, { type: 'ai', text: response.data.reply }])
    } catch (e) {
      setMessages(prev => [...prev, { type: 'ai', text: "I'm having trouble accessing my strategic memory right now." }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      
      {/* Context Indicator: Shows the AI is "Locked In" to a specific tender */}
      {activeTender && (
        <div className="bg-blue-900 text-white px-4 py-2 flex items-center justify-between text-xs font-medium animate-in slide-in-from-top duration-300">
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
              <DecisionCard result={m.result} />
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

      {/* Chat Bar */}
      <div className="p-4 bg-white border-t">
        <div className="max-w-4xl mx-auto flex items-center gap-2 bg-slate-100 rounded-2xl p-1.5 border focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400 transition-all">
          <label className="cursor-pointer p-2.5 hover:bg-white rounded-xl text-slate-500 transition-colors">
            <FileUp size={22} />
            <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} accept=".pdf,.doc,.docx" />
          </label>
          <input 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            onKeyDown={(e) => e.key === 'Enter' && handleChat()} 
            className="flex-1 bg-transparent p-2.5 outline-none text-sm" 
            placeholder={activeTender ? "Ask about margins, risks, or technicals..." : "Upload a tender to start..."} 
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
  )
}

export default AnalysisChat