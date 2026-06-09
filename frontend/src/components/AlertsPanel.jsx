import { useState } from 'react';
import { XCircle, AlertTriangle, CheckCircle, Info, Bell, X, Check, Trash2 } from 'lucide-react';

/* Alert type config */
const ALERT_CONFIG = {
  error:   { Icon: XCircle,       text: 'text-[#ffb4ab]', border: 'border-l-[#ffb4ab]', bg: 'bg-[#ffb4ab]/5',  badge: 'text-[#ffb4ab] bg-[#ffb4ab]/10 border-[#ffb4ab]/30', label: 'Error'   },
  warning: { Icon: AlertTriangle, text: 'text-[#ffb95f]', border: 'border-l-[#ffb95f]', bg: 'bg-[#ffb95f]/5',  badge: 'text-[#ffb95f] bg-[#ffb95f]/10 border-[#ffb95f]/30', label: 'Warning' },
  info:    { Icon: Info,          text: 'text-[#adc6ff]', border: 'border-l-[#adc6ff]', bg: 'bg-[#adc6ff]/5',  badge: 'text-[#adc6ff] bg-[#adc6ff]/10 border-[#adc6ff]/30', label: 'Info'    },
  success: { Icon: CheckCircle,   text: 'text-[#4edea3]', border: 'border-l-[#4edea3]', bg: 'bg-[#4edea3]/5',  badge: 'text-[#4edea3] bg-[#4edea3]/10 border-[#4edea3]/30', label: 'OK'      },
};

/**
 * AlertsDrawer — slide-in panel rendered as a fixed overlay.
 *
 * Props:
 *   open        boolean
 *   onClose     () => void
 *   alerts      Array<{ id, type, message, time, read }>
 *   onMarkRead  (id) => void
 *   onMarkAll   () => void
 *   onDismiss   (id) => void
 *   onClearAll  () => void
 */
export default function AlertsDrawer({ open, onClose, alerts = [], onMarkRead, onMarkAll, onDismiss, onClearAll }) {
  const [filter, setFilter] = useState('all');
  const unread = alerts.filter(a => !a.read).length;

  const filteredAlerts = filter === 'all' ? alerts : alerts.filter(a => a.type === filter);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px] transition-opacity duration-200 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      />

      {/* Drawer */}
      <aside
        className={`fixed top-0 right-0 h-full w-[400px] z-50 flex flex-col bg-[#131313] border-l border-[#3c4a42] shadow-2xl transition-transform duration-250 ease-out ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* ── Drawer header ── */}
        <div className="h-12 shrink-0 flex items-center justify-between px-4 bg-[#1c1b1b] border-b border-[#3c4a42]">
          <div className="flex items-center gap-3">
            <Bell size={14} className="text-[#4edea3]" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#bbcabf]">Alerts</span>
            {unread > 0 && (
              <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#ffb4ab]/20 text-[#ffb4ab] border border-[#ffb4ab]/40">
                {unread} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unread > 0 && (
              <button
                onClick={onMarkAll}
                className="flex items-center gap-1 font-mono text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded border border-[#3c4a42] text-[#86948a] hover:text-[#4edea3] hover:border-[#4edea3]/40 transition-colors"
              >
                <Check size={10} /> Mark all read
              </button>
            )}
            {alerts.length > 0 && (
              <button
                onClick={onClearAll}
                className="flex items-center gap-1 font-mono text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded border border-[#3c4a42] text-[#86948a] hover:text-[#ffb4ab] hover:border-[#ffb4ab]/40 transition-colors"
              >
                <Trash2 size={10} /> Clear
              </button>
            )}
            <button
              onClick={onClose}
              className="ml-1 p-1 rounded text-[#86948a] hover:text-[#e5e2e1] hover:bg-white/5 transition-colors"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* ── Filter tabs ── */}
        <div className="shrink-0 flex items-center gap-0 border-b border-[#3c4a42] bg-[#1c1b1b] px-4">
          {['all', 'error', 'warning', 'info', 'success'].map(f => {
            const count = f === 'all' ? alerts.length : alerts.filter(a => a.type === f).length;
            const cfg = f !== 'all' ? ALERT_CONFIG[f] : null;
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`font-mono text-[9px] font-bold uppercase tracking-widest px-3 py-2 border-b-2 transition-colors cursor-pointer ${
                  filter === f
                    ? f === 'all'
                      ? 'border-[#4edea3] text-[#4edea3]'
                      : `${cfg.border} ${cfg.text}`
                    : 'border-transparent text-[#86948a] hover:text-[#bbcabf]'
                }`}
              >
                {f} {count > 0 && <span className={`ml-1 ${cfg ? cfg.text : 'text-[#4edea3]'}`}>{count}</span>}
              </button>
            );
          })}
        </div>

        {/* ── Alert list ── */}
        <div className="flex-1 overflow-y-auto">
          {filteredAlerts.length === 0 ? (
            <div className="py-20 text-center">
              <Bell className="w-10 h-10 mx-auto mb-3 text-[#3c4a42]" />
              <p className="font-mono text-[12px] text-[#86948a]">No alerts</p>
              <p className="font-mono text-[10px] text-[#3c4a42] mt-1">All clear — nothing to report</p>
            </div>
          ) : (
            <div className="divide-y divide-[#3c4a42]/30">
              {filteredAlerts.map((alert) => {
                const cfg = ALERT_CONFIG[alert.type] ?? ALERT_CONFIG.info;
                const { Icon } = cfg;
                return (
                  <div
                    key={alert.id}
                    onClick={() => onMarkRead(alert.id)}
                    className={`relative flex gap-3 px-4 py-3.5 border-l-2 cursor-pointer transition-colors hover:bg-white/[0.025] ${cfg.border} ${cfg.bg} ${!alert.read ? '' : 'opacity-60'}`}
                  >
                    {/* Unread dot */}
                    {!alert.read && (
                      <div className="absolute top-3.5 right-10 w-1.5 h-1.5 rounded-full bg-[#ffb4ab]" />
                    )}

                    <Icon size={15} className={`${cfg.text} shrink-0 mt-0.5`} />

                    <div className="flex-1 min-w-0">
                      {/* Type badge */}
                      <span className={`inline-block font-mono text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border mb-1 ${cfg.badge}`}>
                        {cfg.label}
                      </span>
                      <p className="font-mono text-[11px] text-[#e5e2e1] leading-snug">{alert.message}</p>
                      <p className="font-mono text-[10px] text-[#86948a] mt-1">{alert.time}</p>
                    </div>

                    {/* Dismiss */}
                    <button
                      onClick={e => { e.stopPropagation(); onDismiss(alert.id); }}
                      className="shrink-0 p-1 rounded text-[#3c4a42] hover:text-[#86948a] transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="shrink-0 px-4 py-2.5 border-t border-[#3c4a42] bg-[#1c1b1b] flex items-center justify-between">
          <span className="font-mono text-[9px] text-[#86948a]">{alerts.length} total · {unread} unread</span>
          <span className="font-mono text-[9px] text-[#3c4a42]">Click an alert to mark as read</span>
        </div>
      </aside>
    </>
  );
}
