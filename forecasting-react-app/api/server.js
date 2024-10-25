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
  aiResponseTime: Number,
  questionCount: Number,
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
  const { userId, group, question, prediction, confidence, timeTaken, baseRate, aiResponseTime, questionCount } = req.body;
  const response = new Response({ userId, group, question, prediction, confidence, timeTaken, baseRate, aiResponseTime, questionCount });
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
    const predictionGroupSize = await Response.distinct('userId', { group: 'prediction' }).then(users => users.length);

    const avgsByQuestionAndGroup = await Response.aggregate([
      { $match: { 
        timeTaken: { $gt: 0 },
        createdAt: { $gte: new Date('2024-10-10T00:00:00.000Z') }
      }},
      { $group: {
        _id: { question: '$question', group: '$group' },
        avgTimeTaken: { $avg: '$timeTaken' },
        avgQuestionCount: { $avg: '$questionCount' },
        count: { $sum: 1 }
      }},
      { $match: { count: { $gt: 10 } } },
      { $group: {
        _id: '$_id.question',
        groups: {
          $push: {
            group: '$_id.group',
            avgTimeTaken: '$avgTimeTaken',
            avgQuestionCount: '$avgQuestionCount',
            count: '$count'
          }
        }
      }}
    ]);

    const recentResponses = await Response.find({ timeTaken: { $gt: 0 } }).sort('-createdAt').limit(20);

    res.json({
      totalParticipants,
      controlGroupSize,
      studyGroupSize,
      predictionGroupSize,
      avgsByQuestionAndGroup,
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