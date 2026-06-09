import { useState, useEffect } from 'react';
import { Braces, TerminalSquare, Network, Settings, Bell, Plus } from 'lucide-react';
import TrafficInspector from './components/TrafficInspector';
import MockManagement from './components/MockManagement';
import ScenarioTesting from './components/ScenarioTesting';
import SettingsPanel from './components/SettingsPanel';
import AlertsDrawer from './components/AlertsPanel';

const NAV_TABS = [
  { id: 'traffic',   label: 'Traffic',   icon: Braces         },
  { id: 'mocks',     label: 'Mocks',     icon: TerminalSquare  },
  { id: 'scenarios', label: 'Scenarios', icon: Network         },
  { id: 'settings',  label: 'Settings',  icon: Settings        },
];

/* ── localStorage helpers ── */
function loadAlerts() {
  try { return JSON.parse(localStorage.getItem('mitm-alerts') || '[]'); } catch { return []; }
}
function saveAlerts(a) {
  try { localStorage.setItem('mitm-alerts', JSON.stringify(a)); } catch {}
}

export default function App() {
  const [activeTab,  setActiveTab]  = useState('traffic');
  const [alerts,     setAlerts]     = useState(loadAlerts);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const unread = alerts.filter(a => !a.read).length;

  useEffect(() => { saveAlerts(alerts); }, [alerts]);

  const setAndSave = (fn) => setAlerts(p => { const n = fn(p); saveAlerts(n); return n; });
  const markRead  = (id) => setAndSave(p => p.map(a => a.id === id ? { ...a, read: true } : a));
  const markAll   = ()   => setAndSave(p => p.map(a => ({ ...a, read: true })));
  const dismiss   = (id) => setAndSave(p => p.filter(a => a.id !== id));
  const clearAll  = ()   => setAndSave(() => []);

  const addAlert = (type, message) => {
    const newAlert = {
      id: Date.now().toString(),
      type,
      message,
      time: new Date().toLocaleTimeString(),
      read: false
    };
    setAlerts(p => [newAlert, ...p]);
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-[#131313] text-[#e5e2e1]">

      {/* ══ Sidebar ══════════════════════════════════════════ */}
      <aside className="w-60 shrink-0 h-full flex flex-col bg-[#1c1b1b] border-r border-[#3c4a42] z-30">

        {/* Logo */}
        <div className="px-4 py-5 border-b border-[#3c4a42]/60">
          <h1 className="font-mono font-bold text-[18px] text-[#4edea3]">API Inspector</h1>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-2">
          {NAV_TABS.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors ${
                  isActive
                    ? 'bg-[#353534] text-[#4edea3] border-l-2 border-[#4edea3]'
                    : 'text-[#bbcabf] hover:bg-[#252525] hover:text-[#e5e2e1] border-l-2 border-transparent'
                }`}
              >
                <Icon size={16} className={isActive ? 'text-[#4edea3]' : 'text-[#86948a]'} />
                <span className="font-sans text-[14px]">{label}</span>
              </button>
            );
          })}
        </nav>

        {/* ── Footer ── */}
        <div className="border-t border-[#3c4a42] p-3 space-y-3">
          <button
            onClick={() => setActiveTab('scenarios')}
            className="w-full bg-[#4edea3] text-[#003824] py-1.5 px-4 rounded font-mono text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all"
          >
            <Plus size={12} /> New Scenario
          </button>

          {/* Session age row */}
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] text-[#86948a] uppercase tracking-widest">Session</span>
            <span className="font-mono text-[9px] text-[#bbcabf]">Active</span>
          </div>

          {/* Alerts / Bell row */}
          <div className="flex items-center justify-between pt-1 border-t border-[#3c4a42]/40">
            <span className="font-mono text-[9px] text-[#86948a] uppercase tracking-widest">Alerts</span>
            <button
              onClick={() => setDrawerOpen(true)}
              className="relative flex items-center gap-1.5 font-mono text-[9px] rounded px-1.5 py-0.5 transition-colors hover:bg-white/5"
              title={`${unread} unread alert${unread !== 1 ? 's' : ''}`}
            >
              <Bell size={12} className={unread > 0 ? 'text-[#ffb95f]' : 'text-[#86948a]'} />
              {unread > 0 ? (
                <span className="font-mono text-[9px] font-bold text-[#ffb4ab]">
                  {unread} unread
                </span>
              ) : (
                <span className="text-[#3c4a42]">none</span>
              )}
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] rounded-full bg-[#ffb4ab] text-[#131313] font-mono text-[7px] font-bold flex items-center justify-center px-0.5">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* ══ Main area ══════════════════════════════════════════ */}
      <main className="flex-1 min-w-0 h-full flex flex-col overflow-hidden">
        {activeTab === 'traffic'   && <TrafficInspector onAddAlert={addAlert} />}
        {activeTab === 'mocks'     && <MockManagement onAddAlert={addAlert} />}
        {activeTab === 'scenarios' && <ScenarioTesting onAddAlert={addAlert} />}
        {activeTab === 'settings'  && <SettingsPanel onAddAlert={addAlert} />}
      </main>

      {/* ══ Alerts Drawer ══════════════════════════════════════ */}
      <AlertsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        alerts={alerts}
        onMarkRead={markRead}
        onMarkAll={markAll}
        onDismiss={dismiss}
        onClearAll={clearAll}
      />
    </div>
  );
}
