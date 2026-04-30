import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import MainDashboard from './pages/MainDashboard';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import NotificationPage from './pages/NotificationPage';

// Helper component for conditional rendering
const Layout = ({ children }) => {
  const location = useLocation();
  
  // Only show Navbar if the path is NOT "/" 
  // (Because "/" will have its own Sidebar now)
  const showNavbar = location.pathname !== '/';

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {showNavbar && <Navbar />}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
};

function App() {
  // 1. Lift the session state up to the App level so it persists 
  // even if the user navigates to /analytics and back
  const [currentSessionId, setCurrentSessionId] = useState(null);

  return (
    <Router>
      <Layout>
        <Routes>
          {/* 2. Pass the session state into the MainDashboard */}
          <Route 
            path="/" 
            element={
              <MainDashboard 
                currentSessionId={currentSessionId} 
                onSessionSelect={setCurrentSessionId} 
              />
            } 
          />
          <Route path="/analytics" element={<AnalyticsDashboard />} />
          <Route path="/notifications" element={<NotificationPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;