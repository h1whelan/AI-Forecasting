const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { systemPrompt, contentPrompt, model } = req.body;

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

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
};