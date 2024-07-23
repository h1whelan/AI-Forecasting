import React, { useState, useEffect } from 'react';
import { getStudyData } from '../services/apiService';
import { Card, CardHeader, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const [studyData, setStudyData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStudyData();
  }, []);

  const fetchStudyData = async () => {
    try {
      const data = await getStudyData();
      setStudyData(data);
    } catch (error) {
      console.error('Error fetching study data:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isAdmin');
    navigate('/admin/login');
  };

  if (!studyData) return <div>Loading...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
          <Button onClick={handleLogout}>Logout</Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white p-4 rounded shadow">
              <h2 className="text-xl font-bold mb-2">Participants</h2>
              <p>Total: {studyData.totalParticipants || 0}</p>
              <p>Control Group: {studyData.controlGroupSize || 0}</p>
              <p>Study Group: {studyData.studyGroupSize || 0}</p>
            </div>
            <div className="bg-white p-4 rounded shadow">
              <h2 className="text-xl font-bold mb-2">Average Metrics</h2>
              <p>Control Group Confidence: {(studyData.avgControlConfidence || 0).toFixed(2)}</p>
              <p>Study Group Confidence: {(studyData.avgStudyConfidence || 0).toFixed(2)}</p>
              <p>Control Group Time (s): {(studyData.avgControlTime || 0).toFixed(2)}</p>
              <p>Study Group Time (s): {(studyData.avgStudyTime || 0).toFixed(2)}</p>
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-4">Recent Responses</h2>
          <table className="w-full bg-white shadow rounded">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2">Group</th>
                <th className="p-2">Prediction</th>
                <th className="p-2">Confidence</th>
                <th className="p-2">Time (s)</th>
              </tr>
            </thead>
            <tbody>
              {studyData.recentResponses && studyData.recentResponses.map((response, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-gray-100' : ''}>
                  <td className="p-2">{response.group}</td>
                  <td className="p-2">{response.prediction}</td>
                  <td className="p-2">{response.confidence}</td>
                  <td className="p-2">{(response.timeTaken || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;