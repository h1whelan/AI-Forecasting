import axios from 'axios';

const API_URL = process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5000/api';

export const getAiResponseStream = async (systemPrompt, contentPrompt, onChunk, onComplete) => {
  const startTime = Date.now();
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
          const data = line.slice(6).trim();
          if (data === '[DONE]') {
            const endTime = Date.now();
            const aiResponseTime = (endTime - startTime) / 1000; // Convert to seconds
            onComplete(aiResponseTime);
            return;
          }
          try {
            const parsedData = JSON.parse(data);
            if (parsedData.content) {
              onChunk(parsedData.content);
            }
          } catch (parseError) {
            console.error('Error parsing JSON:', parseError);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error in AI stream:', error);
    throw new Error('Unable to get AI response at this time.');
  }
};