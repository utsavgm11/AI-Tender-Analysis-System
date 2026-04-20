import React, { useState, useRef } from 'react'
import axios from 'axios'
import { Send, FileUp, Loader2, Bot, User } from 'lucide-react'
import DecisionCard from '../components/ui/DecisionCard'


const AnalysisChat = () => {
  const [messages, setMessages] = useState([{ type: 'ai', text: 'Hello! Upload a tender, and I will act as your Strategic Consultant.' }])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [activeTender, setActiveTender] = useState(null) // Context saved here!
  const fileInputRef = useRef(null)

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    setMessages(prev => [...prev, { type: 'user', text: `📄 Analyzing: ${file.name}` }])
    setIsLoading(true)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await axios.post('http://127.0.0.1:8000/analyze-file/', formData)
      setActiveTender(response.data.aarvi_intelligence) // Save context
      setMessages(prev => [...prev, { type: 'ai', result: response.data }])
    } catch (e) {
      setMessages(prev => [...prev, { type: 'ai', text: "Analysis failed. Please check backend connection." }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleChat = async () => {
    if (!input.trim()) return
    const userQuery = input
    setMessages(prev => [...prev, { type: 'user', text: userQuery }])
    setInput('')
    setIsLoading(true)

    try {
      const response = await axios.post('http://127.0.0.1:8000/chat/', { 
        query: userQuery,
        context: activeTender // Send context so AI knows which tender to discuss
      })
      setMessages(prev => [...prev, { type: 'ai', text: response.data.reply }])
    } catch (e) {
      setMessages(prev => [...prev, { type: 'ai', text: "Consultant error. Please try again." }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.type === 'user' ? 'justify-end' : 'justify-start'}`}>
             {m.type === 'ai' && m.result ? <DecisionCard result={m.result} /> : (
                <div className={`flex items-start gap-3 max-w-2xl ${m.type === 'user' ? 'flex-row-reverse' : ''}`}>
                   <div className={`p-2 rounded-full ${m.type === 'ai' ? 'bg-blue-100' : 'bg-slate-200'}`}>
                      {m.type === 'ai' ? <Bot size={16} /> : <User size={16} />}
                   </div>
                   <div className={`p-4 rounded-2xl ${m.type === 'user' ? 'bg-blue-600 text-white' : 'bg-white border'}`}>{m.text}</div>
                </div>
             )}
          </div>
        ))}
        {isLoading && <div className="text-slate-400 animate-pulse text-sm">Aarvi AI is thinking...</div>}
      </div>

      <div className="p-4 bg-white border-t">
        <div className="max-w-4xl mx-auto flex items-center gap-2">
           <label className="cursor-pointer p-3 hover:bg-slate-100 rounded-xl"><FileUp size={20} className="text-slate-500"/><input type="file" className="hidden" onChange={handleFileUpload} /></label>
           <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleChat()} className="flex-1 p-3 border rounded-xl" placeholder="Ask follow-up questions..." />
           <button onClick={handleChat} className="bg-blue-600 text-white p-3 rounded-xl"><Send size={20} /></button>
        </div>
      </div>
    </div>
  )
}

export default AnalysisChat