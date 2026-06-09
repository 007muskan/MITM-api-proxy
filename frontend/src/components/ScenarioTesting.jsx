import { useState, useEffect } from 'react';
import { scenariosApi } from '../api/scenarios';
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight, Save, X, Clock, AlertTriangle, Zap, Code2 } from 'lucide-react';

/* ── Scenario type config ── */
const SCENARIO_TYPES = {
  error:   { label: 'Error Response',   Icon: AlertTriangle, text: 'text-[#ffb4ab]', border: 'border-[#ffb4ab]/40', bg: 'bg-[#ffb4ab]/10' },
  delay:   { label: 'Delayed Response', Icon: Clock,         text: 'text-[#ffb95f]', border: 'border-[#ffb95f]/40', bg: 'bg-[#ffb95f]/10' },
  timeout: { label: 'Timeout',          Icon: AlertTriangle, text: 'text-[#ffb4ab]', border: 'border-[#ffb4ab]/40', bg: 'bg-[#ffb4ab]/10' },
  custom:  { label: 'Custom Response',  Icon: Code2,         text: 'text-[#adc6ff]', border: 'border-[#adc6ff]/40', bg: 'bg-[#adc6ff]/10' },
};

function TypeBadge({ type }) {
  const cfg = SCENARIO_TYPES[type] ?? SCENARIO_TYPES.custom;
  const { Icon } = cfg;
  return (
    <span className={`inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 rounded border ${cfg.text} ${cfg.border} ${cfg.bg}`}>
      <Icon size={10} />
      {cfg.label}
    </span>
  );
}

function StatusBadge({ code }) {
  let cls = 'text-[#4edea3] border-[#4edea3]/40 bg-[#4edea3]/10';
  if (code >= 400 && code < 500) cls = 'text-[#ffb95f] border-[#ffb95f]/40 bg-[#ffb95f]/10';
  if (code >= 500)               cls = 'text-[#ffb4ab] border-[#ffb4ab]/40 bg-[#ffb4ab]/10';
  return (
    <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border ${cls}`}>{code}</span>
  );
}

const INPUT = 'w-full bg-[#0e0e0e] border border-[#3c4a42] rounded px-3 py-2 font-mono text-[12px] text-[#e5e2e1] placeholder:text-[#3c4a42] focus:outline-none focus:border-[#4edea3] transition-colors';
const LABEL = 'block font-mono text-[9px] font-bold uppercase tracking-widest text-[#86948a] mb-1.5';

/* ── Quick-select type card ── */
function TypeCard({ id, selected, onSelect }) {
  const cfg = SCENARIO_TYPES[id];
  const { Icon } = cfg;
  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className={`flex flex-col items-center gap-2 p-3 rounded border transition-all ${
        selected
          ? `${cfg.bg} ${cfg.border} ${cfg.text}`
          : 'bg-[#0e0e0e] border-[#3c4a42] text-[#86948a] hover:border-[#3c4a42] hover:text-[#bbcabf]'
      }`}
    >
      <Icon size={16} />
      <span className="font-mono text-[9px] font-bold uppercase tracking-wider leading-tight text-center">
        {cfg.label}
      </span>
    </button>
  );
}

export default function ScenarioTesting({ onAddAlert }) {
  const [scenarios, setScenarios]       = useState([]);
  const [showForm, setShowForm]         = useState(false);
  const [editingScenario, setEditing]   = useState(null);
  const [jsonError, setJsonError]       = useState('');
  const [formData, setFormData]         = useState({
    url: '', scenario_type: 'error', status_code: 500,
    delay_ms: 0, timeout: false, custom_response: '{}', enabled: true,
  });

  useEffect(() => { loadScenarios(); }, []);

  const loadScenarios = async () => {
    try { const r = await scenariosApi.getAll(); setScenarios(r.data); }
    catch (e) { console.error(e); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setJsonError('');
    try {
      let custom_response = null;
      if (formData.scenario_type === 'custom' && formData.custom_response) {
        custom_response = JSON.parse(formData.custom_response);
      }
      const data = { ...formData, custom_response };
      if (editingScenario) {
        await scenariosApi.update(editingScenario.id, data);
        onAddAlert?.('success', `Scenario updated: ${data.url}`);
      } else {
        await scenariosApi.create(data);
        onAddAlert?.('success', `Scenario created: ${data.url}`);
      }
      resetForm(); loadScenarios();
    } catch (err) {
      setJsonError(`Invalid JSON: ${err.message}`);
      onAddAlert?.('error', `Failed to save scenario: ${err.message}`);
    }
  };

  const handleEdit = (s) => {
    setEditing(s);
    setFormData({
      url: s.url, scenario_type: s.scenario_type,
      status_code: s.status_code || 500, delay_ms: s.delay_ms || 0,
      timeout: s.timeout || false,
      custom_response: s.custom_response ? JSON.stringify(s.custom_response, null, 2) : '{}',
      enabled: s.enabled,
    });
    setShowForm(true); setJsonError('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this scenario?')) return;
    try {
      await scenariosApi.delete(id);
      loadScenarios();
      onAddAlert?.('info', 'Scenario deleted');
    } catch (e) {
      console.error(e);
      onAddAlert?.('error', `Failed to delete scenario: ${e.message}`);
    }
  };

  const handleToggle = async (id, enabled) => {
    try {
      await scenariosApi.toggle(id, enabled);
      loadScenarios();
      onAddAlert?.('info', `Scenario ${enabled ? 'enabled' : 'disabled'}`);
    } catch (e) {
      console.error(e);
      onAddAlert?.('error', `Failed to toggle scenario: ${e.message}`);
    }
  };

  const resetForm = () => {
    setShowForm(false); setEditing(null); setJsonError('');
    setFormData({ url: '', scenario_type: 'error', status_code: 500, delay_ms: 0, timeout: false, custom_response: '{}', enabled: true });
  };

  const set = (key, val) => setFormData(p => ({ ...p, [key]: val }));

  return (
    <div className="h-full flex flex-col bg-[#131313] overflow-hidden">

      {/* ── Top bar ── */}
      <div className="h-12 shrink-0 flex items-center justify-between px-4 bg-[#1c1b1b] border-b border-[#3c4a42]">
        <div className="flex items-center gap-3">
          <Zap size={15} className="text-[#ffb95f]" />
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#bbcabf]">
            Scenario Testing
          </span>
          {scenarios.length > 0 && (
            <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#ffb95f]/15 text-[#ffb95f] border border-[#ffb95f]/30">
              {scenarios.length}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded bg-[#4edea3] text-[#003824] hover:opacity-90 active:scale-95 transition-all"
        >
          <Plus size={12} /> New Scenario
        </button>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto">

        {/* ── Create / Edit form ── */}
        {showForm && (
          <div className="m-4 rounded border border-[#3c4a42] bg-[#1c1b1b] overflow-hidden">

            {/* form header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#3c4a42]">
              <div className="flex items-center gap-2.5">
                <Zap size={13} className="text-[#ffb95f]" />
                <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-[#e5e2e1]">
                  {editingScenario ? 'Edit Scenario' : 'Create New Scenario'}
                </span>
              </div>
              <button onClick={resetForm} className="text-[#86948a] hover:text-[#e5e2e1] transition-colors">
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">

              {/* URL */}
              <div>
                <label className={LABEL}>Target URL</label>
                <input
                  type="text"
                  value={formData.url}
                  onChange={e => set('url', e.target.value)}
                  placeholder="/api/users"
                  className={INPUT}
                  required
                />
              </div>

              {/* Scenario type — card selector */}
              <div>
                <label className={LABEL}>Scenario Type</label>
                <div className="grid grid-cols-4 gap-2">
                  {Object.keys(SCENARIO_TYPES).map(id => (
                    <TypeCard
                      key={id}
                      id={id}
                      selected={formData.scenario_type === id}
                      onSelect={v => set('scenario_type', v)}
                    />
                  ))}
                </div>
              </div>

              {/* Conditional fields */}
              {formData.scenario_type === 'error' && (
                <div>
                  <label className={LABEL}>Error Status Code</label>
                  <select
                    value={formData.status_code}
                    onChange={e => set('status_code', parseInt(e.target.value))}
                    className={INPUT}
                  >
                    <option value={400}>400 Bad Request</option>
                    <option value={401}>401 Unauthorized</option>
                    <option value={403}>403 Forbidden</option>
                    <option value={404}>404 Not Found</option>
                    <option value={429}>429 Too Many Requests</option>
                    <option value={500}>500 Internal Server Error</option>
                    <option value={502}>502 Bad Gateway</option>
                    <option value={503}>503 Service Unavailable</option>
                    <option value={504}>504 Gateway Timeout</option>
                  </select>
                </div>
              )}

              {formData.scenario_type === 'delay' && (
                <div>
                  <label className={LABEL}>Delay Duration (ms)</label>
                  <div className="relative">
                    <Clock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#86948a]" />
                    <input
                      type="number"
                      value={formData.delay_ms}
                      onChange={e => set('delay_ms', parseInt(e.target.value))}
                      placeholder="1000"
                      className={`${INPUT} pl-8`}
                      min={0}
                      required
                    />
                  </div>
                  {/* Quick presets */}
                  <div className="flex gap-2 mt-2">
                    {[500, 1000, 2000, 5000].map(ms => (
                      <button
                        key={ms}
                        type="button"
                        onClick={() => set('delay_ms', ms)}
                        className={`font-mono text-[10px] px-2 py-0.5 rounded border transition-colors ${
                          formData.delay_ms === ms
                            ? 'bg-[#ffb95f]/15 text-[#ffb95f] border-[#ffb95f]/40'
                            : 'bg-transparent text-[#86948a] border-[#3c4a42] hover:text-[#bbcabf]'
                        }`}
                      >
                        {ms}ms
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {formData.scenario_type === 'custom' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={LABEL}>Status Code</label>
                    <input
                      type="number"
                      value={formData.status_code}
                      onChange={e => set('status_code', parseInt(e.target.value))}
                      className={INPUT}
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className={LABEL.replace('mb-1.5','')}>Custom Response (JSON)</label>
                      {jsonError && <span className="font-mono text-[9px] text-[#ffb4ab]">{jsonError}</span>}
                    </div>
                    <textarea
                      value={formData.custom_response}
                      onChange={e => set('custom_response', e.target.value)}
                      rows={8}
                      className={`${INPUT} resize-y leading-5`}
                      required
                    />
                  </div>
                </div>
              )}

              {/* Enabled toggle */}
              <div className="flex items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => set('enabled', !formData.enabled)}
                  className={`w-9 h-5 rounded-full transition-colors relative ${formData.enabled ? 'bg-[#4edea3]' : 'bg-[#353534]'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${formData.enabled ? 'left-4' : 'left-0.5'}`} />
                </button>
                <span className="font-mono text-[11px] text-[#bbcabf]">Enabled on save</span>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1 border-t border-[#3c4a42]">
                <button
                  type="submit"
                  className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded bg-[#4edea3] text-[#003824] hover:opacity-90 active:scale-95 transition-all mt-3"
                >
                  <Save size={12} />
                  {editingScenario ? 'Update Scenario' : 'Create Scenario'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="font-mono text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded border border-[#3c4a42] text-[#bbcabf] hover:bg-[#252525] hover:text-[#e5e2e1] active:scale-95 transition-all mt-3"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Scenarios list ── */}
        <div className="mx-4 mb-4 rounded border border-[#3c4a42] overflow-hidden">

          {/* list header */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-[#1c1b1b] border-b border-[#3c4a42]">
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#86948a]">Active Scenarios</span>
            <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#353534] text-[#bbcabf] border border-[#3c4a42]">
              {scenarios.length}
            </span>
          </div>

          {/* col headers */}
          {scenarios.length > 0 && (
            <div className="grid grid-cols-[160px_1fr_120px_80px_96px] border-b border-[#3c4a42] bg-[#1c1b1b]">
              {['Type', 'URL', 'Behaviour', 'State', 'Actions'].map((h, i) => (
                <div
                  key={h}
                  className={`px-4 py-2 font-mono text-[9px] font-bold uppercase tracking-widest text-[#86948a] ${i > 0 ? 'border-l border-[#3c4a42]/50' : ''} ${i === 4 ? 'text-right' : ''}`}
                >
                  {h}
                </div>
              ))}
            </div>
          )}

          {scenarios.length === 0 ? (
            <div className="py-20 text-center bg-[#131313]">
              <Zap className="w-10 h-10 mx-auto mb-3 text-[#3c4a42]" />
              <p className="font-mono text-[12px] text-[#86948a]">No scenarios configured yet</p>
              <p className="font-mono text-[10px] text-[#3c4a42] mt-1">
                Simulate failures, delays, and custom API responses
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-5 inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded bg-[#4edea3] text-[#003824] hover:opacity-90 active:scale-95 transition-all"
              >
                <Plus size={12} /> New Scenario
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[#3c4a42]/30 bg-[#131313]">
              {scenarios.map((s, idx) => {
                const cfg = SCENARIO_TYPES[s.scenario_type] ?? SCENARIO_TYPES.custom;
                return (
                  <div
                    key={s.id}
                    className={`grid grid-cols-[160px_1fr_120px_80px_96px] items-center transition-colors hover:bg-[#4edea3]/5 ${
                      idx % 2 === 1 ? 'bg-white/[0.015]' : ''
                    }`}
                  >
                    {/* Type */}
                    <div className="px-4 py-3">
                      <TypeBadge type={s.scenario_type} />
                    </div>

                    {/* URL */}
                    <div className="px-4 py-3 border-l border-[#3c4a42]/40">
                      <span className="font-mono text-[11px] text-[#bbcabf] truncate block">{s.url}</span>
                    </div>

                    {/* Behaviour detail */}
                    <div className="px-4 py-3 border-l border-[#3c4a42]/40">
                      {s.scenario_type === 'error' && <StatusBadge code={s.status_code} />}
                      {s.scenario_type === 'delay' && (
                        <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 rounded border text-[#ffb95f] border-[#ffb95f]/40 bg-[#ffb95f]/10">
                          <Clock size={10} /> {s.delay_ms}ms
                        </span>
                      )}
                      {s.scenario_type === 'timeout' && (
                        <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 rounded border text-[#ffb4ab] border-[#ffb4ab]/40 bg-[#ffb4ab]/10">
                          <AlertTriangle size={10} /> Timeout
                        </span>
                      )}
                      {s.scenario_type === 'custom' && (
                        <StatusBadge code={s.status_code} />
                      )}
                    </div>

                    {/* State */}
                    <div className="px-4 py-3 border-l border-[#3c4a42]/40">
                      {s.enabled ? (
                        <span className="font-mono text-[9px] font-bold px-2 py-0.5 rounded border text-[#4edea3] border-[#4edea3]/40 bg-[#4edea3]/10">Active</span>
                      ) : (
                        <span className="font-mono text-[9px] font-bold px-2 py-0.5 rounded border text-[#ffb95f] border-[#ffb95f]/40 bg-[#ffb95f]/10">Paused</span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="px-4 py-3 border-l border-[#3c4a42]/40 flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleToggle(s.id, !s.enabled)}
                        title={s.enabled ? 'Pause' : 'Enable'}
                        className="p-1.5 rounded text-[#86948a] hover:text-[#4edea3] hover:bg-[#4edea3]/10 transition-colors"
                      >
                        {s.enabled ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
                      </button>
                      <button
                        onClick={() => handleEdit(s)}
                        title="Edit"
                        className="p-1.5 rounded text-[#86948a] hover:text-[#e5e2e1] hover:bg-white/5 transition-colors"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        title="Delete"
                        className="p-1.5 rounded text-[#86948a] hover:text-[#ffb4ab] hover:bg-[#ffb4ab]/10 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
