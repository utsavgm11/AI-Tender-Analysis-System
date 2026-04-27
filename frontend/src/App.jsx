import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import MainDashboard from './pages/MainDashboard';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import NotificationPage from './pages/NotificationPage';

// This helper component handles the conditional rendering
const Layout = ({ children }) => {
  const location = useLocation();
  
  // Only show Navbar if the path is NOT "/"
  const showNavbar = location.pathname !== '/';

  return (
    <div className="h-screen flex flex-col">
      {showNavbar && <Navbar />}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<MainDashboard />} />
          <Route path="/analytics" element={<AnalyticsDashboard />} />
          <Route path="/notifications" element={<NotificationPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;