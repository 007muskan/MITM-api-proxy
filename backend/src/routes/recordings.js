const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { setRecordingState, getRecordingState } = require('../middleware/proxyHandler');

// Get all recording sessions
router.get('/sessions', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('recording_sessions')
      .select('*')
      .order('started_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single session with requests
router.get('/sessions/:id', async (req, res) => {
  try {
    const { data: session, error: sessionError } = await supabase
      .from('recording_sessions')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (sessionError) throw sessionError;

    const { data: requests, error: requestsError } = await supabase
      .from('recorded_requests')
      .select('*')
      .eq('session_id', req.params.id)
      .order('timestamp', { ascending: true });

    if (requestsError) throw requestsError;

    res.json({ session, requests });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create recording session (start recording)
router.post('/sessions', async (req, res) => {
  try {
    const { name } = req.body;

    const { data, error } = await supabase
      .from('recording_sessions')
      .insert({
        name: name || `Recording ${new Date().toISOString()}`,
        started_at: new Date().toISOString(),
        request_count: 0
      })
      .select()
      .single();

    if (error) throw error;

    // Set recording state
    setRecordingState(true, data.id);

    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stop recording
router.post('/sessions/:id/stop', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('recording_sessions')
      .update({
        ended_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    // Stop recording
    setRecordingState(false, null);

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete session
router.delete('/sessions/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('recording_sessions')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Recording session deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export session as JSON
router.get('/sessions/:id/export', async (req, res) => {
  try {
    const { data: session, error: sessionError } = await supabase
      .from('recording_sessions')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (sessionError) throw sessionError;

    const { data: requests, error: requestsError } = await supabase
      .from('recorded_requests')
      .select('*')
      .eq('session_id', req.params.id)
      .order('timestamp', { ascending: true });

    if (requestsError) throw requestsError;

    const exportData = {
      session,
      requests,
      exported_at: new Date().toISOString()
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=recording-${req.params.id}.json`);
    res.json(exportData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get recording state
router.get('/state', (req, res) => {
  const state = getRecordingState();
  res.json(state);
});

module.exports = router;
