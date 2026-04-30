import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LayoutGrid, FileText, BarChart2, X, Plus, MessageSquare, Edit3 } from 'lucide-react';

// --- Sub-component for individual chat items to handle renaming logic ---
const ChatItem = ({ chat, currentSessionId, onSelect, onRename }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newTitle, setNewTitle] = useState(chat.title);
  const isActive = currentSessionId === chat.session_id;

  const handleSave = async (e) => {
    e.stopPropagation();
    if (newTitle.trim() && newTitle !== chat.title) {
      await onRename(chat.session_id, newTitle);
    } else {
      setNewTitle(chat.title); // Revert if empty
    }
    setIsEditing(false);
  };

  return (
    <div 
      className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
        isActive ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-800 text-slate-300'
      }`}
      onClick={() => !isEditing && onSelect(chat.session_id)}
    >
      <div className="flex items-center gap-3 overflow-hidden w-full">
        <MessageSquare size={16} className={isActive ? "text-blue-200" : "text-slate-500"} />
        {isEditing ? (
          <input 
            autoFocus
            className="bg-slate-700 text-white text-sm p-1 rounded w-full outline-none border border-blue-400"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => e.key === 'Enter' && handleSave(e)}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="truncate text-sm font-medium pr-2">{chat.title}</span>
        )}
      </div>
      
      {!isEditing && (
        <Edit3 
          size={14} 
          className={`hidden group-hover:block transition-colors shrink-0 ${isActive ? 'text-blue-200 hover:text-white' : 'text-slate-500 hover:text-white'}`} 
          onClick={(e) => { 
            e.stopPropagation(); 
            setIsEditing(true); 
          }}
        />
      )}
    </div>
  );
};

// --- Main Sidebar Component ---
const Sidebar = ({ isOpen, onClose, activeTab, setActiveTab, currentSessionId, onSessionSelect }) => {
  const [sessions, setSessions] = useState([]);

  // Fetch chat history from SQLite backend
  const fetchSessions = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8001/chats/sessions");
      setSessions(res.data);
    } catch (err) {
      console.error("Error fetching sessions:", err);
    }
  };

  // Fetch sessions on mount and whenever the active session changes
  useEffect(() => {
    fetchSessions();
  }, [currentSessionId]);

  // Handle renaming API call
  const handleRename = async (sessionId, newTitle) => {
    try {
      await axios.put(`http://127.0.0.1:8001/chats/sessions/${sessionId}`, { title: newTitle });
      fetchSessions(); // Refresh the list
    } catch (err) {
      console.error("Error renaming session:", err);
    }
  };

  // FIX: Handle starting a fresh analysis by setting tab AND clearing session
  const handleNewChat = () => {
    setActiveTab('analysis'); // Force UI to switch to chat view
    onSessionSelect(null);    // Null triggers a fresh chat
    if (window.innerWidth < 768) onClose();
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={onClose}></div>
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed md:relative z-50 w-64 h-screen bg-slate-900 text-white flex flex-col shadow-2xl transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
      `}>
        
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-black tracking-tighter text-blue-400">AARVI</h2>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Tender Intelligence</p>
          </div>
          <button onClick={onClose} className="md:hidden text-slate-400 hover:text-white"><X size={24} /></button>
        </div>
        
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Actions & Dashboards */}
          <div className="p-4 space-y-2 border-b border-slate-800 shrink-0">
            {/* New Chat Button */}
            <button 
              onClick={handleNewChat} 
              className="flex items-center gap-3 w-full p-3 mb-4 rounded-xl font-bold bg-white text-slate-900 hover:bg-slate-200 transition-all shadow-sm"
            >
              <Plus size={18} /> New Analysis
            </button>

            {/* FIX: Master Dashboard - strictly use setActiveTab */}
            <button 
              onClick={() => { setActiveTab('dashboard'); if (window.innerWidth < 768) onClose(); }} 
              className={`flex items-center gap-3 w-full p-3 rounded-xl font-bold transition-all ${
                activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <FileText size={18} /> Master Dashboard
            </button>

            {/* FIX: Analytics Dashboard - strictly use setActiveTab */}
            <button 
              onClick={() => { setActiveTab('analytics'); if (window.innerWidth < 768) onClose(); }} 
              className={`flex items-center gap-3 w-full p-3 rounded-xl font-bold transition-all ${
                activeTab === 'analytics' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <BarChart2 size={18} /> Analytics Dashboard
            </button>
          </div>

          {/* Scrollable Chat History */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 px-2">Recent Analyses</p>
            <div className="space-y-1">
              {sessions.length === 0 ? (
                <p className="text-xs text-slate-500 px-2 italic">No recent chats.</p>
              ) : (
                sessions.map(chat => (
                  <ChatItem 
                    key={chat.session_id} 
                    chat={chat} 
                    // Only highlight the chat if we are actually on the analysis tab
                    currentSessionId={activeTab === 'analysis' ? currentSessionId : null}
                    onSelect={(id) => {
                      setActiveTab('analysis'); // Force switch to chat view
                      onSessionSelect(id);      // Load specific chat
                      if (window.innerWidth < 768) onClose();
                    }}
                    onRename={handleRename}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;