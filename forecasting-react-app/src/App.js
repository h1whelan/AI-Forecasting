import React from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate, useLocation, useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import Header from './components/Header';
import Footer from './components/Footer';
import Landing from './pages/Landing';
import PredictionPage from './pages/PredictionPage';
import AdminDashboard from './pages/AdminDashboard';
import ThankYou from './pages/ThankYou';

// New component to handle group redirection
const GroupRedirect = () => {
  const navigate = useNavigate();
  const { groupId } = useParams();
  const location = useLocation();

  React.useEffect(() => {
    if (groupId) {
      const searchParams = new URLSearchParams(location.search);
      const pid = searchParams.get('ProlificID');
      console.log('GroupRedirect: Setting groupId in localStorage:', groupId);
      console.log('GroupRedirect: Participant ID:', pid);
      localStorage.setItem('groupId', groupId);
      localStorage.setItem('participantId', pid || uuidv4());
      navigate('/', { replace: true });
    }
  }, [groupId, navigate, location.search]);

  return null;
};

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/group/:groupId" element={<GroupRedirect />} />
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