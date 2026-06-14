const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️  WARNING: Missing Supabase credentials (SUPABASE_URL / SUPABASE_ANON_KEY).');
  console.warn('   Database-dependent routes will return errors, but the server will still start.');
}

// If credentials are missing, export a stub that returns errors gracefully
// so the server can still boot and serve non-DB routes (/, /health, etc.)
if (!supabaseUrl || !supabaseKey) {
  const makeStub = () => ({
    select: () => makeStub(),
    insert: () => makeStub(),
    update: () => makeStub(),
    delete: () => makeStub(),
    upsert: () => makeStub(),
    from: () => makeStub(),
    eq: () => makeStub(),
    single: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
    order: () => makeStub(),
    raw: (v) => v,
    then: (resolve) => resolve({ data: null, error: new Error('Supabase not configured') }),
  });
  module.exports = { from: () => makeStub() };
} else {
  const supabase = createClient(supabaseUrl, supabaseKey, {
    realtime: {
      transport: ws
    }
  });
  module.exports = supabase;
}
