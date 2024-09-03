import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

const Landing = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);

    const groupId = localStorage.getItem('groupId');

    const group = groupId === 'A' ? 'control' : groupId === 'B' ? 'study' : groupId === 'C' ? 'prediction' : 'control';
    const userId = uuidv4();

    // Redirect to PredictionPage with group and userId
    navigate('/prediction', { state: { group, userId } });
  }, [location, navigate]);

  // Render a loading state or nothing since we're immediately redirecting
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Loading...</h1>
    </div>
  );
};

export default Landing;