import React, { useState, useEffect } from 'react';
import { getStudyData } from '../services/apiService';
import { Card, CardHeader, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const ChartComponent = ({ data, options }) => {
  if (!data || !options) {
    return null; // Return null if data or options are not available
  }
  return <Bar data={data} options={options} />;
};

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

  const prepareChartData = () => {
    if (!studyData || !studyData.avgsByQuestionAndGroup) return null;

    const labels = studyData.avgsByQuestionAndGroup.map(item => {
      // Truncate labels to first 20 characters
      return item._id.length > 20 ? item._id.substring(0, 20) + '...' : item._id;
    });
    const datasets = ['control', 'study', 'prediction'].map(groupName => ({
      label: groupName,
      data: studyData.avgsByQuestionAndGroup.map(item => {
        const group = item.groups.find(g => g.group === groupName);
        return group ? group.avgTimeTaken : 0;
      }),
      backgroundColor: groupName === 'control' ? 'rgba(255, 99, 132, 0.5)' :
                       groupName === 'study' ? 'rgba(54, 162, 235, 0.5)' :
                       'rgba(75, 192, 192, 0.5)',
      avgQuestions: studyData.avgsByQuestionAndGroup.map(item => {
        const group = item.groups.find(g => g.group === groupName);
        return group ? group.avgQuestionCount : 0;
      }),
    }));

    return { labels, datasets };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Average Time Taken and Questions Asked by Question and Group',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y.toFixed(2);
            const avgQuestions = context.dataset.avgQuestions[context.dataIndex].toFixed(2);
            return `${label}: ${value}s (Avg Questions: ${avgQuestions})`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Average Time (seconds)'
        }
      }
    }
  };

  if (!studyData) return <div>Loading...</div>;
  
  const chartData = prepareChartData();

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
              <p>Total: {studyData.totalParticipants}</p>
              <p>Control Group: {studyData.controlGroupSize}</p>
              <p>Study Group: {studyData.studyGroupSize}</p>
              <p>Prediction Group: {studyData.predictionGroupSize}</p>
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-4">Aggregated Results Chart</h2>
          {chartData ? (
            <div className="mb-8">
              <ChartComponent data={chartData} options={chartOptions} />
            </div>
          ) : (
            <p>No chart data available.</p>
          )}
          <h2 className="text-2xl font-bold mb-4">Aggregated Results by Question</h2>
          {studyData.avgsByQuestionAndGroup && studyData.avgsByQuestionAndGroup.length > 0 ? (
            <table className="w-full bg-white shadow rounded mb-8">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-2">Question</th>
                  <th className="p-2">Group</th>
                  <th className="p-2">Avg Time (s)</th>
                  <th className="p-2">Avg Question Count</th>
                  <th className="p-2">Count</th>
                </tr>
              </thead>
              <tbody>
                {studyData.avgsByQuestionAndGroup.map((item) => (
                  item.groups && item.groups.map((group) => (
                    <tr key={`${item._id}-${group.group}`}>
                      <td className="p-2">{item._id}</td>
                      <td className="p-2">{group.group}</td>
                      <td className="p-2">{group.avgTimeTaken.toFixed(2)}</td>
                      <td className="p-2">{group.avgQuestionCount.toFixed(2)}</td>
                      <td className="p-2">{group.count}</td>
                    </tr>
                  ))
                ))}
              </tbody>
            </table>
          ) : (
            <p>No aggregated data available.</p>
          )}
          <h2 className="text-2xl font-bold mb-4">Recent Responses</h2>
          <table className="w-full bg-white shadow rounded">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2">Question</th>
                <th className="p-2">Group</th>
                <th className="p-2">Time Taken (s)</th>
                <th className="p-2">Question Count</th>
              </tr>
            </thead>
            <tbody>
              {studyData.recentResponses.map((response, index) => (
                <tr key={index}>
                  <td className="p-2">{response.question}</td>
                  <td className="p-2">{response.group}</td>
                  <td className="p-2">{response.timeTaken.toFixed(2)}</td>
                  <td className="p-2">{response.questionCount}</td>
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