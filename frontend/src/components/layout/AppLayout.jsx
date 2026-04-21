import React from 'react';
import Navbar from './Navbar'; // Adjust paths if necessary
import Sidebar from './Sidebar';
import Footer from './Footer';

const AppLayout = ({ children }) => {
  return (
    <div className="flex flex-col h-screen">
      <Navbar />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto bg-slate-50">
          {children} 
        </main>
      </div>
      
      <Footer />
    </div>
  );
};

export default AppLayout;