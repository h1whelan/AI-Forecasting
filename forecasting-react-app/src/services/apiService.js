import axios from 'axios';

const API_URL = '/api';

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const submitResponse = async (responseData) => {
  try {
    console.log('Sending data to server:', JSON.stringify(responseData));
    const response = await axiosInstance.post('/response', responseData);
    console.log('Response from server:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error in submitResponse:', error.response?.data || error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    }
    throw error;
  }
};

export const getStudyData = async () => {
  try {
    const response = await axiosInstance.get('/study-data');
    return response.data;
  } catch (error) {
    console.error('Error fetching study data:', error);
    throw error;
  }
};