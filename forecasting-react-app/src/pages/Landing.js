import React from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

const Landing = () => {
  const navigate = useNavigate();

  const startStudy = () => {
    const group = Math.random() < 0.5 ? 'control' : 'study';
    const userId = uuidv4(); // Generate a unique user ID
    navigate('/prediction', { state: { group, userId } });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Welcome to the Forecasting Study</h1>
      <p className="mb-4">This study aims to understand the impact of AI assistance on forecasting accuracy.</p>
      <button
        onClick={startStudy}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Start Study
      </button>
    </div>
  );
};

export default Landing;