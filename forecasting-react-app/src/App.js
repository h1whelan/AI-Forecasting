import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Landing from './pages/Landing';
import PredictionPage from './pages/PredictionPage';
import AdminDashboard from './pages/AdminDashboard';
import ThankYou from './pages/ThankYou';

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/group/:groupId" element={<Navigate to="/" replace />} />
            <Route path="/prediction" element={<PredictionPage />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/thank-you" element={<ThankYou />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;