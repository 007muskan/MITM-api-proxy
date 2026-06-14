import { useState, useEffect } from 'react';
import { Save, Server, Database, Globe, CheckCircle, AlertCircle, Info, RotateCcw, Terminal, Eye, EyeOff, Zap } from 'lucide-react';

const INPUT = 'w-full bg-[#0e0e0e] border border-[#3c4a42] rounded px-3 py-2 font-mono text-[12px] text-[#e5e2e1] placeholder:text-[#3c4a42] focus:outline-none focus:border-[#4edea3] transition-colors';
const LABEL = 'block font-mono text-[9px] font-bold uppercase tracking-widest text-[#86948a] mb-1.5';

function SectionHeader({ icon: Icon, iconColor = '#4edea3', title, description }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-[#3c4a42] bg-[#1c1b1b]">
      <Icon size={14} style={{ color: iconColor }} />
      <div>
        <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-[#e5e2e1]">{title}</span>
        {description && <p className="font-mono text-[10px] text-[#86948a] mt-0.5">{description}</p>}
      </div>
    </div>
  );
}

export default function SettingsPanel({ onAddAlert }) {
  const [settings, setSettings] = useState({
    proxyPort: 3002,
    targetUrl: 'https://jsonplaceholder.typicode.com',
    geminiApiKey: '',
    groqApiKey: '',
  });
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('mitm-settings');
    if (stored) setSettings(JSON.parse(stored));
  }, []);

  const handleSave = () => {
    localStorage.setItem('mitm-settings', JSON.stringify(settings));
    setSaved(true);
    onAddAlert?.('success', 'Settings saved successfully');
    setTimeout(() => setSaved(false), 2500);
  };

  const set = (key, val) => setSettings(p => ({ ...p, [key]: val }));

  return (
    <div className="h-full flex flex-col bg-[#131313] overflow-hidden">

      {/* ── Top bar ── */}
      <div className="h-12 shrink-0 flex items-center justify-between px-4 bg-[#1c1b1b] border-b border-[#3c4a42]">
        <div className="flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4edea3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 0 1-1.73V18a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 0-1 1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>
          </svg>
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#bbcabf]">Settings</span>
        </div>
        <button
          onClick={handleSave}
          className={`flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded transition-all active:scale-95 ${
            saved
              ? 'bg-[#4edea3]/20 text-[#4edea3] border border-[#4edea3]/40'
              : 'bg-[#4edea3] text-[#003824] hover:opacity-90'
          }`}
        >
          {saved ? <CheckCircle size={12} /> : <Save size={12} />}
          {saved ? 'Saved!' : 'Save Settings'}
        </button>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* ── Proxy Config ── */}
        <div className="rounded border border-[#3c4a42] overflow-hidden">
          <SectionHeader icon={Server} iconColor="#adc6ff" title="Proxy Configuration" description="Intercept and forward API traffic" />
          <div className="p-4 grid grid-cols-2 gap-4 bg-[#131313]">
            <div>
              <label className={LABEL}>Proxy Port</label>
              <input
                type="number"
                value={settings.proxyPort}
                onChange={e => set('proxyPort', parseInt(e.target.value))}
                className={INPUT}
              />
              <p className="font-mono text-[9px] text-[#86948a] mt-1">Default: 3002. Restart required after change.</p>
            </div>
            <div>
              <label className={LABEL}>Target API URL</label>
              <input
                type="text"
                value={settings.targetUrl}
                onChange={e => set('targetUrl', e.target.value)}
                placeholder="https://api.example.com"
                className={INPUT}
              />
              <p className="font-mono text-[9px] text-[#86948a] mt-1">All proxied requests are forwarded here.</p>
            </div>

            {/* Live preview */}
            <div className="col-span-2 rounded border border-[#3c4a42]/50 bg-[#0e0e0e] p-3">
              <p className="font-mono text-[9px] text-[#86948a] uppercase tracking-widest mb-2">Proxy Route Preview</p>
              <div className="flex items-center gap-2 font-mono text-[11px]">
                <span className="text-[#4edea3] bg-[#4edea3]/10 border border-[#4edea3]/30 px-2 py-0.5 rounded">localhost:{settings.proxyPort}</span>
                <span className="text-[#3c4a42]">→</span>
                <span className="text-[#bbcabf] truncate">{settings.targetUrl || 'https://jsonplaceholder.typicode.com'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Gemini Config ── */}
        <div className="rounded border border-[#3c4a42] overflow-hidden">
          <SectionHeader icon={Globe} iconColor="#adc6ff" title="Gemini Configuration" description="API key for AI-powered mock generation (primary)" />
          <div className="p-4 space-y-4 bg-[#131313]">
            <div>
              <label className={LABEL}>Gemini API Key</label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={settings.geminiApiKey}
                  onChange={e => set('geminiApiKey', e.target.value)}
                  placeholder="AIza..."
                  className={`${INPUT} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowKey(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#86948a] hover:text-[#bbcabf] transition-colors"
                >
                  {showKey ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
              <p className="font-mono text-[9px] text-[#86948a] mt-1">Primary AI provider. Get your key from makersuite.google.com/app/apikey</p>
            </div>
            {/* Connection status pill */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded border text-[10px] font-mono font-bold ${
              settings.geminiApiKey
                ? 'bg-[#adc6ff]/10 border-[#adc6ff]/30 text-[#adc6ff]'
                : 'bg-[#3c4a42]/20 border-[#3c4a42] text-[#86948a]'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${settings.geminiApiKey ? 'bg-[#adc6ff] animate-pulse' : 'bg-[#3c4a42]'}`} />
              {settings.geminiApiKey ? 'API key configured — Primary AI ready' : 'No API key — Primary AI disabled'}
            </div>
          </div>
        </div>

        {/* ── Groq Config ── */}
        <div className="rounded border border-[#3c4a42] overflow-hidden">
          <SectionHeader icon={Zap} iconColor="#ffb95f" title="Groq Configuration" description="Fallback API key for AI-powered mock generation" />
          <div className="p-4 space-y-4 bg-[#131313]">
            <div>
              <label className={LABEL}>Groq API Key</label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={settings.groqApiKey}
                  onChange={e => set('groqApiKey', e.target.value)}
                  placeholder="gsk_..."
                  className={`${INPUT} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowKey(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#86948a] hover:text-[#bbcabf] transition-colors"
                >
                  {showKey ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
              <p className="font-mono text-[9px] text-[#86948a] mt-1">Fallback AI provider (used if Gemini fails). Get your key from console.groq.com</p>
            </div>
            {/* Connection status pill */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded border text-[10px] font-mono font-bold ${
              settings.groqApiKey
                ? 'bg-[#ffb95f]/10 border-[#ffb95f]/30 text-[#ffb95f]'
                : 'bg-[#3c4a42]/20 border-[#3c4a42] text-[#86948a]'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${settings.groqApiKey ? 'bg-[#ffb95f] animate-pulse' : 'bg-[#3c4a42]'}`} />
              {settings.groqApiKey ? 'API key configured — Fallback AI ready' : 'No API key — Fallback AI disabled'}
            </div>
          </div>
        </div>

        {/* ── Setup Instructions ── */}
        <div className="rounded border border-[#3c4a42] overflow-hidden">
          <SectionHeader icon={Terminal} iconColor="#ffb95f" title="Setup Guide" description="Get up and running in 3 steps" />
          <div className="divide-y divide-[#3c4a42]/40 bg-[#131313]">
            {[
              {
                step: '01',
                icon: Database,
                color: '#4edea3',
                title: 'Create a Supabase project',
                items: ['Go to supabase.com and create a new project', 'Open the SQL Editor and run backend/src/config/database.sql', 'Copy your Project URL and anon key from Settings → API'],
              },
              {
                step: '02',
                icon: AlertCircle,
                color: '#ffb95f',
                title: 'Configure environment',
                items: ['Copy .env.example → .env in the backend directory', 'Paste your Supabase credentials', 'Set PROXY_PORT and API_PORT as needed'],
              },
              {
                step: '03',
                icon: Info,
                color: '#adc6ff',
                title: 'Start the application',
                items: ['Run: npm run install:all', 'Run: npm run dev', 'Open http://localhost:5173 in your browser'],
              },
            ].map(({ step, icon: Icon, color, title, items }) => (
              <div key={step} className="flex gap-4 p-4 hover:bg-white/[0.015] transition-colors">
                <div className="shrink-0">
                  <span className="font-mono text-[10px] font-bold text-[#3c4a42]">{step}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon size={13} style={{ color }} />
                    <span className="font-mono text-[11px] font-bold text-[#e5e2e1]">{title}</span>
                  </div>
                  <ol className="space-y-1">
                    {items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 font-mono text-[11px] text-[#86948a]">
                        <span className="text-[#3c4a42] mt-px shrink-0">{i + 1}.</span>
                        {item}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Danger zone ── */}
        <div className="rounded border border-[#ffb4ab]/20 overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[#ffb4ab]/20 bg-[#ffb4ab]/5">
            <RotateCcw size={13} className="text-[#ffb4ab]" />
            <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-[#ffb4ab]">Danger Zone</span>
          </div>
          <div className="p-4 flex items-center justify-between bg-[#131313]">
            <div>
              <p className="font-mono text-[11px] text-[#e5e2e1]">Reset all settings</p>
              <p className="font-mono text-[10px] text-[#86948a] mt-0.5">Restore factory defaults and clear stored configuration</p>
            </div>
            <button
              onClick={() => {
                if (window.confirm('Reset all settings to defaults?')) {
                  const defaults = { proxyPort: 3002, targetUrl: 'https://jsonplaceholder.typicode.com' };
                  setSettings(defaults);
                  localStorage.removeItem('mitm-settings');
                }
              }}
              className="font-mono text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded border border-[#ffb4ab]/30 text-[#ffb4ab] hover:bg-[#ffb4ab]/10 active:scale-95 transition-all"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
