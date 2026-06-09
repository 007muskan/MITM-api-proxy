import { useState, useEffect } from 'react';
import { useSocket } from '../hooks/useSocket';
import { trafficApi } from '../api/traffic';
import { Search, Globe, Copy, X } from 'lucide-react';

export default function TrafficInspector({ onAddAlert }) {
  const [traffic, setTraffic] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [filterUrl, setFilterUrl] = useState('');
  const [filterMethod, setFilterMethod] = useState('');
  const [activeDetailTab, setActiveDetailTab] = useState('response');

  // Load traffic from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('mitm-traffic');
    if (stored) {
      try {
        setTraffic(JSON.parse(stored));
      } catch (e) {
        console.error('Error loading traffic from localStorage:', e);
      }
    }
  }, []);

  useSocket('traffic:new', (newTraffic) => {
    setTraffic((prev) => {
      const updated = [newTraffic, ...prev].slice(0, 100);
      localStorage.setItem('mitm-traffic', JSON.stringify(updated));
      return updated;
    });
  });

  useEffect(() => {
    loadTraffic();
  }, [filterUrl, filterMethod]);

  const loadTraffic = async () => {
    try {
      const params = {};
      if (filterUrl) params.url = filterUrl;
      if (filterMethod) params.method = filterMethod;
      const response = await trafficApi.getAll(params);
      setTraffic(response.data);
    } catch (error) {
      console.error('Error loading traffic:', error);
    }
  };

  const clearTraffic = async () => {
    try {
      await trafficApi.clear();
      setTraffic([]);
      setSelectedRequest(null);
      localStorage.removeItem('mitm-traffic');
    } catch (error) {
      console.error('Error clearing traffic:', error);
    }
  };

  const getStatusStyle = (status) => {
    if (status === 201) return 'bg-[#4edea3]/20 text-[#4edea3] border border-[#4edea3]';
    if (status >= 200 && status < 300) return 'bg-[#4edea3]/10 text-[#4edea3] border border-[#4edea3]/30';
    if (status >= 400 && status < 500) return 'bg-[#ffb95f]/10 text-[#ffb95f] border border-[#ffb95f]/30';
    if (status >= 500) return 'bg-[#ffb4ab]/10 text-[#ffb4ab] border border-[#ffb4ab]/30';
    return 'bg-white/5 text-[#86948a] border border-white/10';
  };

  const getDurationColor = (status) => {
    if (status >= 500) return 'text-[#ffb4ab]';
    if (status >= 400) return 'text-[#ffb95f]';
    return 'text-[#4edea3]';
  };

  const highlightJson = (obj) => {
    if (!obj) return '';
    const jsonStr = typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2);
    const highlighted = jsonStr
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(
        /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
        (match) => {
          let cls = 'syntax-number';
          if (/^"/.test(match)) {
            cls = /:$/.test(match) ? 'syntax-key' : 'syntax-string';
          }
          return `<span class="${cls}">${match}</span>`;
        }
      );
    return <div dangerouslySetInnerHTML={{ __html: highlighted }} />;
  };


  return (
    /*
      This component fills its parent <main> completely (h-full, flex-col).
      No padding on the root — all sections touch each other and the sidebar.
    */
    <div className="h-full flex flex-col bg-[#131313] overflow-hidden">

      {/* ── Top bar ─────────────────────────────────────────── */}
      <div className="h-12 shrink-0 flex items-center justify-between px-4 bg-[#1c1b1b] border-b border-[#3c4a42]">
        {/* Left */}
        <div className="flex items-center gap-4">
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#bbcabf]">
            Traffic Monitor
          </span>
          <div className="flex items-center bg-[#0e0e0e] border border-[#3c4a42] rounded px-2.5 py-1 gap-2">
            <Search size={13} className="text-[#86948a] shrink-0" />
            <input
              type="text"
              placeholder="Filter requests..."
              value={filterUrl}
              onChange={(e) => setFilterUrl(e.target.value)}
              className="bg-transparent outline-none font-mono text-[11px] text-[#e5e2e1] placeholder:text-[#86948a] w-56"
            />
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#4edea3] animate-pulse" />
            <span className="font-mono text-[11px] text-[#4edea3]">System Operational</span>
          </div>
          <button className="font-mono text-[11px] text-[#bbcabf] hover:text-[#e5e2e1] px-2 py-1 active:scale-95 transition-transform">
            Export
          </button>
          <button
            onClick={clearTraffic}
            className="font-mono text-[11px] text-[#4edea3] font-bold px-2 py-1 border border-[#4edea3]/25 rounded hover:bg-[#4edea3]/10 active:scale-95 transition-all"
          >
            Clear Traffic
          </button>
        </div>
      </div>

      {/* ── Body: table + optional detail pane ──────────────── */}
      <div className="flex flex-1 min-h-0">

        {/* Table panel */}
        <section className={`flex flex-col min-h-0 border-r border-[#3c4a42] transition-all duration-200 ${selectedRequest ? 'flex-1' : 'w-full'}`}>
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            <table className="w-full border-collapse">

              {/* thead */}
              <thead className="sticky top-0 z-10 bg-[#1c1b1b] border-b border-[#3c4a42]">
                <tr>
                  {['Status', 'Method', 'Path', 'Duration', 'Time'].map((h, i) => (
                    <th
                      key={h}
                      className={`px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-[#86948a] ${
                        i < 4 ? 'border-r border-[#3c4a42]' : ''
                      } ${i === 3 || i === 4 ? 'text-right' : 'text-left'} ${
                        i === 0 ? 'w-16' : i === 1 ? 'w-20' : i === 3 || i === 4 ? 'w-24' : ''
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              {/* tbody */}
              <tbody className="font-mono text-[11px]">
                {traffic.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-center">
                      <Globe className="w-10 h-10 mx-auto mb-3 text-[#3c4a42]" />
                      <p className="text-[#86948a]">No traffic captured yet</p>
                      <p className="text-[#3c4a42] text-[10px] mt-1">Make API requests through the proxy to see them here</p>
                    </td>
                  </tr>
                ) : (
                  traffic.map((item, idx) => {
                    const isActive = selectedRequest?.id === item.id;
                    const isEven = idx % 2 === 1;
                    return (
                      <tr
                        key={item.id}
                        onClick={() => setSelectedRequest(item)}
                        className={`cursor-pointer border-b border-[#3c4a42]/30 transition-colors ${
                          isActive
                            ? 'bg-[#4edea3]/10 border-l-2 border-l-[#4edea3]'
                            : `hover:bg-[#4edea3]/5 ${isEven ? 'bg-white/[0.02]' : ''}`
                        }`}
                      >
                        <td className="px-4 py-2 border-r border-[#3c4a42]/40">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] ${getStatusStyle(item.statusCode)}`}>
                            {item.statusCode}
                          </span>
                        </td>
                        <td className="px-4 py-2 border-r border-[#3c4a42]/40 font-bold text-[#e5e2e1]">
                          {item.method}
                        </td>
                        <td className="px-4 py-2 border-r border-[#3c4a42]/40 text-[#bbcabf]">
                          <span className="block truncate max-w-[280px] xl:max-w-[480px]">{item.url}</span>
                        </td>
                        <td className={`px-4 py-2 border-r border-[#3c4a42]/40 text-right ${getDurationColor(item.statusCode)} ${isActive ? 'font-bold' : ''}`}>
                          {item.responseTime}ms
                        </td>
                        <td className="px-4 py-2 text-right text-[#86948a]">
                          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Detail pane */}
        {selectedRequest && (
          <aside className="w-[480px] shrink-0 flex flex-col border-l-0 bg-[#131313]">

            {/* Detail tabs bar */}
            <div className="h-10 shrink-0 flex items-center justify-between px-4 bg-[#1c1b1b] border-b border-[#3c4a42]">
              <div className="flex h-full gap-1">
                <button
                  type="button"
                  onClick={() => setActiveDetailTab('response')}
                  className={`font-mono text-[10px] font-bold uppercase tracking-widest px-2 h-full transition-colors cursor-pointer ${
                    activeDetailTab === 'response'
                      ? 'border-b-2 border-[#4edea3] text-[#4edea3]'
                      : 'text-[#bbcabf] hover:text-[#e5e2e1]'
                  }`}
                >
                  Response Body
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDetailTab('headers')}
                  className={`font-mono text-[10px] font-bold uppercase tracking-widest px-2 h-full transition-colors cursor-pointer ${
                    activeDetailTab === 'headers'
                      ? 'border-b-2 border-[#4edea3] text-[#4edea3]'
                      : 'text-[#bbcabf] hover:text-[#e5e2e1]'
                  }`}
                >
                  Headers
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDetailTab('timing')}
                  className={`font-mono text-[10px] font-bold uppercase tracking-widest px-2 h-full transition-colors cursor-pointer ${
                    activeDetailTab === 'timing'
                      ? 'border-b-2 border-[#4edea3] text-[#4edea3]'
                      : 'text-[#bbcabf] hover:text-[#e5e2e1]'
                  }`}
                >
                  Timing
                </button>
              </div>
              <button onClick={() => setSelectedRequest(null)} className="text-[#86948a] hover:text-[#e5e2e1] transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Detail content */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">

              {activeDetailTab === 'response' && (
                <div className="rounded border border-[#3c4a42] bg-[#0e0e0e] p-3 font-mono text-[11px] leading-relaxed">
                  <div className="flex justify-between items-center mb-3 pb-2 border-b border-[#3c4a42]/30">
                    <span className="text-[#86948a] text-[9px] font-bold uppercase tracking-widest">
                      JSON Payload ({selectedRequest.responseBody ? (JSON.stringify(selectedRequest.responseBody).length / 1024).toFixed(1) : 0}KB)
                    </span>
                    <button className="text-[#4edea3] hover:text-[#10b981] transition-colors">
                      <Copy size={13} />
                    </button>
                  </div>
                  <pre className="whitespace-pre-wrap break-all leading-5">
                    {highlightJson(selectedRequest.responseBody || {})}
                  </pre>
                </div>
              )}

              {activeDetailTab === 'headers' && (
                <div className="rounded border border-[#3c4a42] bg-[#0e0e0e] p-3 font-mono text-[11px] leading-relaxed">
                  <p className="text-[9px] font-bold text-[#86948a] uppercase tracking-widest pb-2 mb-3 border-b border-[#3c4a42]/30">
                    Request Headers
                  </p>
                  <pre className="whitespace-pre-wrap break-all leading-5 mb-4">
                    {highlightJson(selectedRequest.requestHeaders || {})}
                  </pre>
                  <p className="text-[9px] font-bold text-[#86948a] uppercase tracking-widest pb-2 mb-3 border-b border-[#3c4a42]/30">
                    Response Headers
                  </p>
                  <pre className="whitespace-pre-wrap break-all leading-5">
                    {highlightJson(selectedRequest.responseHeaders || {})}
                  </pre>
                </div>
              )}

              {activeDetailTab === 'timing' && (
                <div className="space-y-4">
                  <p className="font-mono text-[10px] font-bold text-[#86948a] uppercase tracking-widest">
                    Timing Breakdown
                  </p>
                  {(() => {
                    const timing = selectedRequest.timing || {
                      ttfb: selectedRequest.responseTime || 0,
                      download: 0,
                      total: selectedRequest.responseTime || 0
                    };
                    const total = timing.total || 1;
                    const items = [
                      { label: 'Waiting (TTFB)', value: timing.ttfb, key: 'ttfb' },
                      { label: 'Content Download', value: timing.download, key: 'download' },
                    ];
                    return items.map(({ label, value, key }) => {
                      const pct = total > 0 ? Math.round((value / total) * 100) : 0;
                      return (
                        <div key={key} className="space-y-1">
                          <div className="flex justify-between font-mono text-[10px] uppercase">
                            <span className="text-[#86948a]">{label}</span>
                            <span className="text-[#e5e2e1]">{value}ms</span>
                          </div>
                          <div className="h-1 bg-[#353534] rounded-full overflow-hidden">
                            <div className="h-full bg-[#10b981]" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    });
                  })()}

                  {/* Metadata card */}
                  <div className="border border-[#3c4a42] rounded p-3 bg-[#1c1b1b] mt-4">
                    <p className="font-mono text-[9px] font-bold text-[#86948a] uppercase tracking-widest mb-3">
                      Request Metadata
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Total Duration', value: `${selectedRequest.responseTime}ms`, green: true },
                        { label: 'SSL Version',    value: 'TLSv1.3',                           green: true },
                        { label: 'Timestamp',      value: new Date(selectedRequest.timestamp).toLocaleTimeString() },
                        { label: 'Method',         value: selectedRequest.method },
                      ].map(({ label, value, green }) => (
                        <div key={label}>
                          <p className="text-[9px] text-[#86948a] font-bold uppercase mb-0.5">{label}</p>
                          <p className={`font-mono text-[11px] ${green ? 'text-[#4edea3]' : 'text-[#e5e2e1]'}`}>{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
