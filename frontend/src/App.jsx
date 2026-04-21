import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import MainDashboard from './pages/MainDashboard';
import AnalyticsDashboard from './pages/AnalyticsDashboard';

function App() {
  return (
    <Router>
      <div className="App">
       
        {/* Route Logic */}
        <Routes>
          <Route path="/" element={<MainDashboard />} />
          <Route path="/analytics" element={<AnalyticsDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;