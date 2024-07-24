import axios from 'axios';

const API_URL = process.env.NODE_ENV === 'production' 
  ? '/api' 
  : 'http://localhost:5000/api';

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

export const submitDemographics = async (demographicData) => {
  try {
    const response = await axiosInstance.post('/demographics', demographicData);
    console.log('Demographics submitted:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error submitting demographics:', error);
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

export const getAiResponseStream = async (systemPrompt, contentPrompt, onChunk) => {
  try {
    const response = await fetch(`${API_URL}/ai-stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ systemPrompt, contentPrompt }),
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6));
          if (data.content) {
            onChunk(data.content);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error in AI stream:', error);
    throw new Error('Unable to get AI response at this time.');
  }
};