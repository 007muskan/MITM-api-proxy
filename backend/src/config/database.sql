-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Mocks table
CREATE TABLE IF NOT EXISTS mocks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  url VARCHAR(500) NOT NULL,
  method VARCHAR(10) NOT NULL,
  response_body JSONB NOT NULL,
  status_code INTEGER DEFAULT 200,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scenarios table
CREATE TABLE IF NOT EXISTS scenarios (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  url VARCHAR(500) NOT NULL,
  scenario_type VARCHAR(50) NOT NULL, -- 'error', 'delay', 'timeout', 'custom'
  status_code INTEGER,
  delay_ms INTEGER,
  timeout BOOLEAN DEFAULT false,
  custom_response JSONB,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recording sessions table
CREATE TABLE IF NOT EXISTS recording_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  request_count INTEGER DEFAULT 0
);

-- Recorded requests table
CREATE TABLE IF NOT EXISTS recorded_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES recording_sessions(id) ON DELETE CASCADE,
  url VARCHAR(500) NOT NULL,
  method VARCHAR(10) NOT NULL,
  request_headers JSONB,
  request_body JSONB,
  query_params JSONB,
  response_headers JSONB,
  response_body JSONB,
  status_code INTEGER,
  response_time_ms INTEGER,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_mocks_url_method ON mocks(url, method);
CREATE INDEX IF NOT EXISTS idx_scenarios_url ON scenarios(url);
CREATE INDEX IF NOT EXISTS idx_recorded_requests_session_id ON recorded_requests(session_id);
CREATE INDEX IF NOT EXISTS idx_recorded_requests_timestamp ON recorded_requests(timestamp);
