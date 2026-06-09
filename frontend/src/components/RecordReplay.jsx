import { useState, useEffect } from 'react';
import { recordingsApi } from '../api/recordings';
import { Circle, Square, Download, Trash2, Play, Eye, FileText, Radio, ArrowLeft } from 'lucide-react';

export default function RecordReplay() {
  const [sessions, setSessions] = useState([]);
  const [recordingState, setRecordingState] = useState({ isRecording: false, currentRecordingSession: null });
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionDetails, setSessionDetails] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadSessions();
    loadRecordingState();
    const interval = setInterval(loadRecordingState, 2000);
    return () => clearInterval(interval);
  }, []);

  const loadSessions = async () => {
    try {
      const response = await recordingsApi.getSessions();
      setSessions(response.data);
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  const loadRecordingState = async () => {
    try {
      const response = await recordingsApi.getState();
      setRecordingState(response.data);
    } catch (error) {
      console.error('Error loading recording state:', error);
    }
  };

  const startRecording = async () => {
    try {
      const name = prompt('Enter a name for this recording session:');
      if (!name) return;

      await recordingsApi.createSession({ name });
      loadRecordingState();
      loadSessions();
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = async () => {
    try {
      if (recordingState.currentRecordingSession) {
        await recordingsApi.stopSession(recordingState.currentRecordingSession);
        loadRecordingState();
        loadSessions();
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
    }
  };

  const deleteSession = async (id) => {
    if (window.confirm('Are you sure you want to delete this recording session?')) {
      try {
        await recordingsApi.deleteSession(id);
        loadSessions();
        if (selectedSession?.id === id) {
          setSelectedSession(null);
          setSessionDetails(null);
          setShowDetails(false);
        }
      } catch (error) {
        console.error('Error deleting session:', error);
      }
    }
  };

  const exportSession = async (id) => {
    try {
      const response = await recordingsApi.exportSession(id);
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recording-${id}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting session:', error);
    }
  };

  const viewSession = async (session) => {
    try {
      const response = await recordingsApi.getSession(session.id);
      setSessionDetails(response.data);
      setSelectedSession(session);
      setShowDetails(true);
    } catch (error) {
      console.error('Error loading session details:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-[var(--accent-info)]/10 rounded-lg">
              <Radio className="w-5 h-5 text-[var(--accent-info)]" />
            </div>
            <h2 className="text-2xl font-bold">Record & Replay</h2>
          </div>
          <p className="text-[var(--text-secondary)] text-sm">Capture and replay API traffic</p>
        </div>
        <div className="flex gap-3">
          {recordingState.isRecording ? (
            <button
              onClick={stopRecording}
              className="btn-danger flex items-center gap-2"
            >
              <Square size={16} />
              Stop Recording
            </button>
          ) : (
            <button
              onClick={startRecording}
              className="btn-success flex items-center gap-2"
            >
              <Circle size={16} />
              Start Recording
            </button>
          )}
        </div>
      </div>

      {recordingState.isRecording && (
        <div className="card p-4 mb-6 border-[var(--accent-error)]/30 bg-[var(--accent-error)]/5 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-[var(--accent-error)] rounded-full animate-pulse" />
            <span className="text-[var(--accent-error)] font-semibold">Recording in progress...</span>
          </div>
        </div>
      )}

      {showDetails && sessionDetails ? (
        <div className="animate-fade-in">
          <button
            onClick={() => setShowDetails(false)}
            className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] mb-6 flex items-center gap-2 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to sessions
          </button>
          <div className="card-elevated overflow-hidden">
            <div className="p-6 border-b border-[var(--border-primary)]">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-[var(--accent-primary)]/10 rounded-lg">
                  <FileText className="w-5 h-5 text-[var(--accent-primary-hover)]" />
                </div>
                <h3 className="text-lg font-semibold">{sessionDetails.session.name}</h3>
              </div>
              <div className="flex items-center gap-6 text-sm text-[var(--text-tertiary)]">
                <span>Started: {formatDate(sessionDetails.session.started_at)}</span>
                {sessionDetails.session.ended_at && (
                  <span>Ended: {formatDate(sessionDetails.session.ended_at)}</span>
                )}
                <span className="badge badge-primary">{sessionDetails.session.request_count} requests</span>
              </div>
            </div>
            <div className="p-6 overflow-auto max-h-[600px]">
              {sessionDetails.requests.length === 0 ? (
                <div className="text-center text-[var(--text-tertiary)] py-8">
                  No requests recorded
                </div>
              ) : (
                <div className="space-y-3">
                  {sessionDetails.requests.map((request, index) => (
                    <div key={request.id} className="code-block p-4 animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`badge ${getMethodBadge(request.method)}`}>
                          {request.method}
                        </span>
                        <span className="font-mono text-sm text-[var(--text-secondary)] truncate flex-1">{request.url}</span>
                        <span className={`badge ${getStatusBadge(request.status_code)}`}>
                          {request.status_code}
                        </span>
                      </div>
                      <div className="text-xs text-[var(--text-tertiary)]">
                        {formatDate(request.timestamp)} • {request.response_time_ms}ms
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="card-elevated overflow-hidden">
          <div className="p-4 border-b border-[var(--border-primary)] flex items-center justify-between">
            <h3 className="font-semibold text-[var(--text-primary)]">Recording Sessions</h3>
            <span className="badge badge-primary">{sessions.length}</span>
          </div>
          {sessions.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--background-tertiary)] flex items-center justify-center">
                <Radio className="w-8 h-8 text-[var(--text-tertiary)]" />
              </div>
              <p className="text-[var(--text-secondary)] mb-2">No recording sessions yet</p>
              <p className="text-[var(--text-tertiary)] text-sm">Start recording to capture API traffic</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border-primary)]">
              {sessions.map((session, index) => (
                <div key={session.id} className="p-4 table-row-hover animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <FileText size={18} className="text-[var(--text-tertiary)]" />
                        <span className="font-medium text-[var(--text-primary)]">{session.name}</span>
                        {!session.ended_at && (
                          <span className="badge badge-error flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-error)] animate-pulse" />
                            Recording
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-[var(--text-tertiary)]">
                        Started: {formatDate(session.started_at)} • {session.request_count} requests
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => viewSession(session)}
                        className="p-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => exportSession(session.id)}
                        className="p-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                        title="Export"
                      >
                        <Download size={18} />
                      </button>
                      <button
                        onClick={() => deleteSession(session.id)}
                        className="p-2 text-[var(--text-tertiary)] hover:text-[var(--accent-error)] transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function getMethodBadge(method) {
  const badges = {
    GET: 'badge-success',
    POST: 'badge-info',
    PUT: 'badge-warning',
    DELETE: 'badge-error',
    PATCH: 'badge-primary',
  };
  return badges[method] || 'badge-primary';
}

function getStatusBadge(status) {
  if (status >= 200 && status < 300) return 'badge-success';
  if (status >= 300 && status < 400) return 'badge-warning';
  if (status >= 400 && status < 500) return 'badge-error';
  if (status >= 500) return 'badge-error';
  return 'badge-info';
}

