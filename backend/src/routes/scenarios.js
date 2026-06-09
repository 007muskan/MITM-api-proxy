const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// Get all scenarios
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('scenarios')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single scenario
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('scenarios')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create scenario
router.post('/', async (req, res) => {
  try {
    const { url, scenario_type, status_code, delay_ms, timeout, custom_response, enabled } = req.body;

    const { data, error } = await supabase
      .from('scenarios')
      .insert({
        url,
        scenario_type,
        status_code,
        delay_ms,
        timeout: timeout || false,
        custom_response,
        enabled: enabled !== undefined ? enabled : true
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update scenario
router.put('/:id', async (req, res) => {
  try {
    const { url, scenario_type, status_code, delay_ms, timeout, custom_response, enabled } = req.body;

    const { data, error } = await supabase
      .from('scenarios')
      .update({
        url,
        scenario_type,
        status_code,
        delay_ms,
        timeout,
        custom_response,
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

// Delete scenario
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('scenarios')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Scenario deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle scenario
router.patch('/:id/toggle', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('scenarios')
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
