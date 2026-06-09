const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Groq = require('groq-sdk');

// Get all mocks
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('mocks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// AI Generate mock
router.post('/ai-generate', async (req, res) => {
  const { prompt } = req.body;
  const geminiKey = process.env.GEMINI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;

  console.log('AI generation request received, prompt:', prompt);
  console.log('Gemini API key configured:', !!geminiKey);
  console.log('Groq API key configured:', !!groqKey);

  // Try Gemini first
  if (geminiKey) {
    try {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });

      console.log('Calling Gemini API...');
      const result = await model.generateContent(
        `You are an API mock generator. Generate a mock API response based on the user's description. Return ONLY a JSON object with these exact keys: url (string), method (string: GET/POST/PUT/DELETE/PATCH), status_code (number), response_body (object). Do not include any explanations or markdown.

User description: ${prompt}`
      );

      console.log('Gemini response received');
      const generatedContent = result.response.text();
      console.log('Generated content:', generatedContent);

      // Remove markdown code blocks if present
      const cleanedContent = generatedContent.replace(/```json\n?|\n?```/g, '').trim();
      const mock = JSON.parse(cleanedContent);

      return res.json({ mock, provider: 'gemini' });
    } catch (error) {
      console.error('Gemini AI generation error:', error);
      console.error('Error type:', error.constructor.name);
      console.error('Error status:', error.status);
      console.error('Error message:', error.message);

      // If it's a 503 (overload) or 404 (model not found), try Groq as fallback
      if (error.status === 503 || error.status === 404) {
        console.log('Gemini failed, trying Groq as fallback...');
      } else {
        // For other errors, return immediately
        let errorMessage = error.message;
        let statusCode = 500;

        if (error.status === 401 || error.status === 403) {
          errorMessage = 'Invalid API key. Please check your Gemini API key.';
          statusCode = 401;
        }

        return res.status(statusCode).json({ error: errorMessage, details: error.message });
      }
    }
  }

  // Try Groq as fallback
  if (groqKey) {
    try {
      const groq = new Groq({ apiKey: groqKey });
      const model = 'llama-3.3-70b-versatile';

      console.log('Calling Groq API with model:', model);
      const result = await groq.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are an API mock generator. Generate a mock API response based on the user\'s description. Return ONLY a JSON object with these exact keys: url (string), method (string: GET/POST/PUT/DELETE/PATCH), status_code (number), response_body (object). Do not include any explanations or markdown.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
      });

      console.log('Groq response received');
      const generatedContent = result.choices[0].message.content;
      console.log('Generated content:', generatedContent);

      // Remove markdown code blocks if present
      const cleanedContent = generatedContent.replace(/```json\n?|\n?```/g, '').trim();
      const mock = JSON.parse(cleanedContent);

      return res.json({ mock, provider: 'groq' });
    } catch (error) {
      console.error('Groq AI generation error:', error);
      console.error('Error message:', error.message);

      let errorMessage = error.message;
      let statusCode = 500;

      if (error.status === 401 || error.status === 403) {
        errorMessage = 'Invalid API key. Please check your Groq API key.';
        statusCode = 401;
      } else if (error.status === 503) {
        errorMessage = 'Groq API is currently overloaded. Please try again later.';
        statusCode = 503;
      }

      return res.status(statusCode).json({ error: errorMessage, details: error.message });
    }
  }

  // No API keys configured
  return res.status(400).json({ error: 'No AI API key configured. Please add Gemini or Groq API key in settings.' });
});

// Get single mock
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('mocks')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create mock
router.post('/', async (req, res) => {
  try {
    const { url, method, response_body, status_code, enabled } = req.body;

    const { data, error } = await supabase
      .from('mocks')
      .insert({
        url,
        method: method.toUpperCase(),
        response_body,
        status_code: status_code || 200,
        enabled: enabled !== undefined ? enabled : true
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error('Error creating mock:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update mock
router.put('/:id', async (req, res) => {
  try {
    const { url, method, response_body, status_code, enabled } = req.body;

    const { data, error } = await supabase
      .from('mocks')
      .update({
        url,
        method: method ? method.toUpperCase() : undefined,
        response_body,
        status_code,
        enabled,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete mock
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('mocks')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Mock deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle mock
router.patch('/:id/toggle', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('mocks')
      .update({ enabled: req.body.enabled })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
