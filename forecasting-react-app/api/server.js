const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000'
}));
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Add this to log any errors after initial connection
mongoose.connection.on('error', err => {
  console.error('MongoDB error after initial connection:', err);
});

const Response = mongoose.model('Response', {
  userId: String,
  group: String,
  question: String,
  prediction: String,
  confidence: Number,
  timeTaken: Number,
  baseRate: String,
  createdAt: { type: Date, default: Date.now }
});

const Demographic = mongoose.model('Demographic', {
  userId: String,
  age: String,
  gender: String,
  education: String,
  occupation: String,
  createdAt: { type: Date, default: Date.now }
});

app.post('/api/demographics', async (req, res) => {
  console.log('Received demographics:', req.body);
  const { userId, age, gender, education, occupation } = req.body;
  const demographic = new Demographic({ userId, age, gender, education, occupation });
  try {
    await demographic.save();
    res.status(201).json(demographic);
  } catch (error) {
    console.error('Error saving demographics:', error);
    res.status(500).json({ message: 'Error saving demographics', error: error.toString() });
  }
});

app.post('/api/response', async (req, res) => {
  console.log('Received request body:', req.body);
  const { userId, group, question, prediction, confidence, timeTaken, baseRate } = req.body;
  const response = new Response({ userId, group, question, prediction, confidence, timeTaken, baseRate });
  try {
    await response.save();
    res.status(201).json(response);
  } catch (error) {
    console.error('Error saving response:', error);
    res.status(500).json({ message: 'Error saving response', error: error.toString(), stack: error.stack });
  }
});

app.get('/api/study-data', async (req, res) => {
  try {
    const totalParticipants = await Response.distinct('userId').then(users => users.length);
    const controlGroupSize = await Response.distinct('userId', { group: 'control' }).then(users => users.length);
    const studyGroupSize = await Response.distinct('userId', { group: 'study' }).then(users => users.length);

    const avgControlConfidence = await Response.aggregate([
      { $match: { group: 'control' } },
      { $group: { _id: '$userId', avgConfidence: { $avg: '$confidence' } } },
      { $group: { _id: null, avg: { $avg: '$avgConfidence' } } }
    ]);

    const avgStudyConfidence = await Response.aggregate([
      { $match: { group: 'study' } },
      { $group: { _id: '$userId', avgConfidence: { $avg: '$confidence' } } },
      { $group: { _id: null, avg: { $avg: '$avgConfidence' } } }
    ]);

    const avgControlTime = await Response.aggregate([
      { $match: { group: 'control' } },
      { $group: { _id: '$userId', avgTime: { $avg: '$timeTaken' } } },
      { $group: { _id: null, avg: { $avg: '$avgTime' } } }
    ]);

    const avgStudyTime = await Response.aggregate([
      { $match: { group: 'study' } },
      { $group: { _id: '$userId', avgTime: { $avg: '$timeTaken' } } },
      { $group: { _id: null, avg: { $avg: '$avgTime' } } }
    ]);

    const recentResponses = await Response.find().sort('-createdAt').limit(10);

    res.json({
      totalParticipants,
      controlGroupSize,
      studyGroupSize,
      avgControlConfidence: avgControlConfidence[0]?.avg || 0,
      avgStudyConfidence: avgStudyConfidence[0]?.avg || 0,
      avgControlTime: avgControlTime[0]?.avg || 0,
      avgStudyTime: avgStudyTime[0]?.avg || 0,
      recentResponses
    });
  } catch (error) {
    console.error('Error fetching study data:', error);
    res.status(500).json({ message: 'Error fetching study data', error: error.message });
  }
});

app.post('/api/ai-stream', async (req, res) => {
  const { systemPrompt, contentPrompt, model } = req.body;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const aiStream = await openai.chat.completions.create({
      model: model || 'gpt-4-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: contentPrompt }
      ],
      stream: true,
    });

    for await (const chunk of aiStream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
  } catch (error) {
    console.error('Error in AI stream:', error);
    res.write(`data: ${JSON.stringify({ error: 'An error occurred' })}\n\n`);
  } finally {
    res.end();
  }
});

const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
});

const config = {
  runtime: 'edge',
};

async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Method Not Allowed' });
    return;
  }

  const { systemPrompt, contentPrompt, model } = await req.json();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const aiStream = await openai.chat.completions.create({
          model: model || 'gpt-4-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: contentPrompt }
          ],
          stream: true,
        });

        for await (const chunk of aiStream) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
          }
        }

        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      } catch (error) {
        console.error('Error in AI stream:', error);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'An error occurred' })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

const port = process.env.BACKENDPORT || 5000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});