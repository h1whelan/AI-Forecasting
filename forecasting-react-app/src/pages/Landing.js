import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { submitDemographics } from '../services/apiService';

const Landing = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [demographics, setDemographics] = useState({
    age: '',
    gender: '',
    education: '',
    occupation: '',
  });
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const groupId = params.get('groupId');
    if (groupId) {
      localStorage.setItem('groupId', groupId);
    }
  }, [location]);

  const handleInputChange = (e) => {
    setDemographics({ ...demographics, [e.target.name]: e.target.value });
  };

  const startStudy = async (e) => {
    e.preventDefault();
    const groupId = localStorage.getItem('groupId');
    const group = groupId === 'A' ? 'control' : 'study';
    const userId = uuidv4();
    
    try {
      await submitDemographics({ ...demographics, userId, group });
      navigate('/prediction', { state: { group, userId } });
    } catch (error) {
      console.error('Error submitting demographics:', error);
      // TODO: Handle error
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Welcome to the Forecasting Study</h1>
      <p className="mb-4">This study aims to understand the impact of AI assistance on forecasting accuracy.</p>
      <form onSubmit={startStudy} className="space-y-4">
        <div>
          <label htmlFor="age" className="block mb-1">Age Group</label>
          <select
            id="age"
            name="age"
            value={demographics.age}
            onChange={handleInputChange}
            required
            className="w-full p-2 border rounded"
          >
            <option value="">Select Age Group</option>
            <option value="18-24">18-24</option>
            <option value="25-34">25-34</option>
            <option value="35-44">35-44</option>
            <option value="45-54">45-54</option>
            <option value="55+">55+</option>
          </select>
        </div>
        <div>
          <label htmlFor="gender" className="block mb-1">Gender</label>
          <select
            id="gender"
            name="gender"
            value={demographics.gender}
            onChange={handleInputChange}
            required
            className="w-full p-2 border rounded"
          >
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="non-binary">Non-binary</option>
            <option value="prefer-not-to-say">Prefer not to say</option>
          </select>
        </div>
        <div>
          <label htmlFor="education" className="block mb-1">Highest Education Level</label>
          <select
            id="education"
            name="education"
            value={demographics.education}
            onChange={handleInputChange}
            required
            className="w-full p-2 border rounded"
          >
            <option value="">Select Education Level</option>
            <option value="high-school">High School</option>
            <option value="bachelors">Bachelor's Degree</option>
            <option value="masters">Master's Degree</option>
            <option value="doctorate">Doctorate</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label htmlFor="occupation" className="block mb-1">Occupation Field</label>
          <select
            id="occupation"
            name="occupation"
            value={demographics.occupation}
            onChange={handleInputChange}
            required
            className="w-full p-2 border rounded"
          >
            <option value="">Select Occupation Field</option>
            <option value="technology">Technology</option>
            <option value="healthcare">Healthcare</option>
            <option value="education">Education</option>
            <option value="finance">Finance</option>
            <option value="other">Other</option>
          </select>
        </div>
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Start Study
        </button>
      </form>
    </div>
  );
};

export default Landing;