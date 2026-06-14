import { useState, useEffect } from 'react';
import { mocksApi } from '../api/mocks';
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight, Save, X, Database, Code2, ChevronRight, Zap, Loader2 } from 'lucide-react';

/* ── Method colors (matching TrafficInspector palette) ── */
const METHOD_STYLES = {
  GET:    { text: 'text-[#4edea3]', border: 'border-[#4edea3]/40', bg: 'bg-[#4edea3]/10' },
  POST:   { text: 'text-[#adc6ff]', border: 'border-[#adc6ff]/40', bg: 'bg-[#adc6ff]/10' },
  PUT:    { text: 'text-[#ffb95f]', border: 'border-[#ffb95f]/40', bg: 'bg-[#ffb95f]/10' },
  PATCH:  { text: 'text-[#ffb95f]', border: 'border-[#ffb95f]/40', bg: 'bg-[#ffb95f]/10' },
  DELETE: { text: 'text-[#ffb4ab]', border: 'border-[#ffb4ab]/40', bg: 'bg-[#ffb4ab]/10' },
};

function MethodBadge({ method }) {
  const s = METHOD_STYLES[method] ?? { text: 'text-[#bbcabf]', border: 'border-[#3c4a42]', bg: 'bg-[#1c1b1b]' };
  return (
    <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border ${s.text} ${s.border} ${s.bg}`}>
      {method}
    </span>
  );
}

function StatusBadge({ code }) {
  let cls = 'text-[#4edea3] border-[#4edea3]/40 bg-[#4edea3]/10';
  if (code >= 400 && code < 500) cls = 'text-[#ffb95f] border-[#ffb95f]/40 bg-[#ffb95f]/10';
  if (code >= 500)               cls = 'text-[#ffb4ab] border-[#ffb4ab]/40 bg-[#ffb4ab]/10';
  return (
    <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border ${cls}`}>
      {code}
    </span>
  );
}

/* ── Shared input style ── */
const INPUT = 'w-full bg-[#0e0e0e] border border-[#3c4a42] rounded px-3 py-2 font-mono text-[12px] text-[#e5e2e1] placeholder:text-[#3c4a42] focus:outline-none focus:border-[#4edea3] transition-colors';

export default function MockManagement({ onAddAlert }) {
  const [mocks, setMocks]           = useState([]);
  const [showForm, setShowForm]     = useState(false);
  const [editingMock, setEditingMock] = useState(null);
  const [formData, setFormData]     = useState({
    url: '', method: 'GET', response_body: '{}', status_code: 200, enabled: true,
  });
  const [jsonError, setJsonError]   = useState('');
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiPrompt, setAiPrompt]     = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => { loadMocks(); }, []);

  const loadMocks = async () => {
    try {
      const response = await mocksApi.getAll();
      setMocks(response.data);
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setJsonError('');
    try {
      const body = JSON.parse(formData.response_body.trim());
      const data = { ...formData, response_body: body };
      if (editingMock) {
        await mocksApi.update(editingMock.id, data);
        onAddAlert?.('success', `Mock updated: ${data.method} ${data.url}`);
      } else {
        await mocksApi.create(data);
        onAddAlert?.('success', `Mock created: ${data.method} ${data.url}`);
      }
      resetForm();
      loadMocks();
    } catch (err) {
      setJsonError(`Invalid JSON: ${err.message}`);
      onAddAlert?.('error', `Failed to save mock: ${err.message}`);
    }
  };

  const handleEdit = (mock) => {
    setEditingMock(mock);
    setFormData({
      url: mock.url, method: mock.method,
      response_body: JSON.stringify(mock.response_body, null, 2),
      status_code: mock.status_code, enabled: mock.enabled,
    });
    setShowForm(true);
    setJsonError('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this mock?')) return;
    try {
      await mocksApi.delete(id);
      loadMocks();
      onAddAlert?.('info', 'Mock deleted');
    } catch (err) {
      console.error(err);
      onAddAlert?.('error', `Failed to delete mock: ${err.message}`);
    }
  };

  const handleToggle = async (id, enabled) => {
    try {
      await mocksApi.toggle(id, enabled);
      loadMocks();
      onAddAlert?.('info', `Mock ${enabled ? 'enabled' : 'disabled'}`);
    } catch (err) {
      console.error(err);
      onAddAlert?.('error', `Failed to toggle mock: ${err.message}`);
    }
  };

  const resetForm = () => {
    setShowForm(false); setEditingMock(null); setJsonError('');
    setFormData({ url: '', method: 'GET', response_body: '{}', status_code: 200, enabled: true });
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const response = await mocksApi.generateAi(aiPrompt);
      const data = response.data;
      if (data.mock) {
        setFormData({
          url: data.mock.url || '/api/generated',
          method: data.mock.method || 'GET',
          response_body: JSON.stringify(data.mock.response_body || {}, null, 2),
          status_code: data.mock.status_code || 200,
          enabled: true
        });
        setShowForm(true);
        setShowAiPanel(false);
        onAddAlert?.('success', 'AI-generated mock created');
      }
    } catch (err) {
      onAddAlert?.('error', 'Failed to generate mock with AI');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#131313] overflow-hidden">

      {/* ── Top bar (mirrors TrafficInspector header) ── */}
      <div className="h-12 shrink-0 flex items-center justify-between px-4 bg-[#1c1b1b] border-b border-[#3c4a42]">
        <div className="flex items-center gap-3">
          <Database size={15} className="text-[#4edea3]" />
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#bbcabf]">
            API Mocks
          </span>
          {/* count pill */}
          {mocks.length > 0 && (
            <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#4edea3]/15 text-[#4edea3] border border-[#4edea3]/30">
              {mocks.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAiPanel(!showAiPanel)}
            className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded border border-[#ffb95f] text-[#ffb95f] hover:bg-[#ffb95f]/10 active:scale-95 transition-all"
          >
            Auto Generate
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded bg-[#4edea3] text-[#003824] hover:opacity-90 active:scale-95 transition-all"
          >
            <Plus size={12} />
            New Mock
          </button>
        </div>
      </div>

      {/* ── AI Generation Panel ── */}
      {showAiPanel && (
        <div className="shrink-0 border-b border-[#3c4a42] bg-[#1c1b1b] p-4">
          <div className="flex items-center gap-2 mb-3">
            {/* <Zap size={14} className="text-[#ffb95f]" /> */}
            <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-[#e5e2e1]">Auto Mock Generation</span>
          </div>
          <div className="space-y-3">
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Describe the API endpoint you want to mock (e.g., 'GET /api/users that returns a list of users with id, name, and email')"
              className="w-full bg-[#0e0e0e] border border-[#3c4a42] rounded px-3 py-2 font-mono text-[12px] text-[#e5e2e1] placeholder:text-[#3c4a42] focus:outline-none focus:border-[#ffb95f] transition-colors resize-none h-20"
            />
            <div className="flex items-center justify-between">
              <p className="font-mono text-[10px] text-[#86948a]">Auto-generates URL, method, status code, and response body</p>
              <button
                onClick={handleAiGenerate}
                disabled={isGenerating || !aiPrompt.trim()}
                className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded border border-[#ffb95f] text-[#ffb95f] hover:bg-[#ffb95f]/10 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? <Loader2 size={12} className="animate-spin" /> : null}
                {isGenerating ? 'Generating...' : 'Generate Mock'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto">

        {/* Create / Edit form */}
        {showForm && (
          <div className="m-4 rounded border border-[#3c4a42] bg-[#1c1b1b] overflow-hidden">

            {/* form header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#3c4a42] bg-[#1c1b1b]">
              <div className="flex items-center gap-2.5">
                <Code2 size={14} className="text-[#4edea3]" />
                <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-[#e5e2e1]">
                  {editingMock ? 'Edit Mock' : 'Create New Mock'}
                </span>
              </div>
              <button onClick={resetForm} className="text-[#86948a] hover:text-[#e5e2e1] transition-colors">
                <X size={15} />
              </button>
            </div>

            {/* two-column form layout */}
            <form onSubmit={handleSubmit} className="p-4 grid grid-cols-2 gap-4">

              {/* URL — spans both columns */}
              <div className="col-span-2">
                <label className="block font-mono text-[9px] font-bold uppercase tracking-widest text-[#86948a] mb-1.5">URL</label>
                <input
                  type="text"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="/api/users"
                  className={INPUT}
                  required
                />
              </div>

              {/* Method */}
              <div>
                <label className="block font-mono text-[9px] font-bold uppercase tracking-widest text-[#86948a] mb-1.5">Method</label>
                <select
                  value={formData.method}
                  onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                  className={INPUT}
                >
                  {['GET','POST','PUT','DELETE','PATCH'].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* Status Code */}
              <div>
                <label className="block font-mono text-[9px] font-bold uppercase tracking-widest text-[#86948a] mb-1.5">Status Code</label>
                <input
                  type="number"
                  value={formData.status_code}
                  onChange={(e) => setFormData({ ...formData, status_code: parseInt(e.target.value) })}
                  className={INPUT}
                  required
                />
              </div>

              {/* Response Body — spans both columns */}
              <div className="col-span-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-mono text-[9px] font-bold uppercase tracking-widest text-[#86948a]">
                    Response Body (JSON)
                  </label>
                  {jsonError && (
                    <span className="font-mono text-[9px] text-[#ffb4ab]">{jsonError}</span>
                  )}
                </div>
                <textarea
                  value={formData.response_body}
                  onChange={(e) => setFormData({ ...formData, response_body: e.target.value })}
                  rows={10}
                  className={`${INPUT} resize-y leading-5`}
                  required
                />
              </div>

              {/* Enabled toggle */}
              <div className="col-span-2 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, enabled: !formData.enabled })}
                  className={`w-9 h-5 rounded-full transition-colors relative ${formData.enabled ? 'bg-[#4edea3]' : 'bg-[#353534]'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${formData.enabled ? 'left-4' : 'left-0.5'}`} />
                </button>
                <span className="font-mono text-[11px] text-[#bbcabf]">Enabled</span>
              </div>

              {/* Actions */}
              <div className="col-span-2 flex gap-2 pt-1">
                <button
                  type="submit"
                  className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded bg-[#4edea3] text-[#003824] hover:opacity-90 active:scale-95 transition-all"
                >
                  <Save size={12} />
                  {editingMock ? 'Update Mock' : 'Create Mock'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="font-mono text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded border border-[#3c4a42] text-[#bbcabf] hover:bg-[#252525] hover:text-[#e5e2e1] active:scale-95 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Mocks table ── */}
        <div className="mx-4 mb-4 rounded border border-[#3c4a42] overflow-hidden">

          {/* table header bar */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-[#1c1b1b] border-b border-[#3c4a42]">
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#86948a]">Active Mocks</span>
            <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#353534] text-[#bbcabf] border border-[#3c4a42]">
              {mocks.length}
            </span>
          </div>

          {/* col headers */}
          {mocks.length > 0 && (
            <div className="grid grid-cols-[80px_80px_1fr_70px_80px_96px] border-b border-[#3c4a42] bg-[#1c1b1b]">
              {['Method','Status','Path','Code','State','Actions'].map((h, i) => (
                <div key={h} className={`px-4 py-2 font-mono text-[9px] font-bold uppercase tracking-widest text-[#86948a] ${i > 0 ? 'border-l border-[#3c4a42]/50' : ''} ${i === 5 ? 'text-right' : ''}`}>
                  {h}
                </div>
              ))}
            </div>
          )}

          {mocks.length === 0 ? (
            <div className="py-20 text-center bg-[#131313]">
              <Database className="w-10 h-10 mx-auto mb-3 text-[#3c4a42]" />
              <p className="font-mono text-[12px] text-[#86948a]">No mocks configured yet</p>
              <p className="font-mono text-[10px] text-[#3c4a42] mt-1">Create your first mock to start intercepting API calls</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-5 inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded bg-[#4edea3] text-[#003824] hover:opacity-90 active:scale-95 transition-all"
              >
                <Plus size={12} /> New Mock
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[#3c4a42]/30 bg-[#131313]">
              {mocks.map((mock, idx) => (
                <div
                  key={mock.id}
                  className={`grid grid-cols-[80px_80px_1fr_70px_80px_96px] items-center transition-colors hover:bg-[#4edea3]/5 ${
                    idx % 2 === 1 ? 'bg-white/[0.015]' : ''
                  }`}
                >
                  {/* Method */}
                  <div className="px-4 py-3">
                    <MethodBadge method={mock.method} />
                  </div>

                  {/* Status code */}
                  <div className="px-4 py-3 border-l border-[#3c4a42]/40">
                    <StatusBadge code={mock.status_code} />
                  </div>

                  {/* Path */}
                  <div className="px-4 py-3 border-l border-[#3c4a42]/40">
                    <span className="font-mono text-[11px] text-[#bbcabf] truncate block">{mock.url}</span>
                  </div>

                  {/* Arrow + code (decorative) */}
                  <div className="px-2 py-3 border-l border-[#3c4a42]/40 flex items-center gap-1 text-[#3c4a42]">
                    <ChevronRight size={12} />
                    <span className="font-mono text-[10px] text-[#86948a]">{mock.status_code}</span>
                  </div>

                  {/* State badge */}
                  <div className="px-4 py-3 border-l border-[#3c4a42]/40">
                    {mock.enabled ? (
                      <span className="font-mono text-[9px] font-bold px-2 py-0.5 rounded border text-[#4edea3] border-[#4edea3]/40 bg-[#4edea3]/10">
                        Active
                      </span>
                    ) : (
                      <span className="font-mono text-[9px] font-bold px-2 py-0.5 rounded border text-[#ffb95f] border-[#ffb95f]/40 bg-[#ffb95f]/10">
                        Paused
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="px-4 py-3 border-l border-[#3c4a42]/40 flex items-center justify-end gap-1">
                    <button
                      onClick={() => handleToggle(mock.id, !mock.enabled)}
                      title={mock.enabled ? 'Pause' : 'Enable'}
                      className="p-1.5 rounded text-[#86948a] hover:text-[#4edea3] hover:bg-[#4edea3]/10 transition-colors"
                    >
                      {mock.enabled ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
                    </button>
                    <button
                      onClick={() => handleEdit(mock)}
                      title="Edit"
                      className="p-1.5 rounded text-[#86948a] hover:text-[#e5e2e1] hover:bg-white/5 transition-colors"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(mock.id)}
                      title="Delete"
                      className="p-1.5 rounded text-[#86948a] hover:text-[#ffb4ab] hover:bg-[#ffb4ab]/10 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
