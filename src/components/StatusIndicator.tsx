import React from 'react';
import { ShieldCheck, AlertCircle, RefreshCw, Server } from 'lucide-react';
import { useServerStatus } from '../hooks/useServerStatus';

export default function StatusIndicator() {
  const { status, serverInfo, error, checkStatus } = useServerStatus();

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg bg-indigo-50 p-1.5 text-indigo-600">
            <Server className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 text-sm">Full-Stack Active State</h3>
            <p className="text-xs text-slate-500">Live communication test client → server</p>
          </div>
        </div>

        <button 
          onClick={() => {
            if (status !== 'loading') {
              checkStatus();
            }
          }}
          disabled={status === 'loading'}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all cursor-pointer"
          title="Refresh server status"
        >
          <RefreshCw className={`h-4 w-4 ${status === 'loading' ? 'animate-spin text-indigo-500' : ''}`} />
        </button>
      </div>

      <div className="mt-2 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 border border-slate-100">
        <span className="text-xs font-medium text-slate-600">Express API Health:</span>
        
        {status === 'loading' && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-pulse" />
            Pinging server...
          </span>
        )}

        {status === 'online' && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Connected
          </span>
        )}

        {status === 'offline' && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-800">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
            Offline
          </span>
        )}
      </div>

      {status === 'online' && serverInfo && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>Timestamp:</span>
            <span className="font-mono text-slate-700">{new Date(serverInfo.timestamp).toLocaleTimeString()}</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>Response Code:</span>
            <span className="font-mono text-emerald-600 font-semibold bg-emerald-50 px-1.5 rounded">200 OK</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400 italic text-center">
            Express application is listening on port 3000 and successfully responding with standard headers.
          </p>
        </div>
      )}

      {status === 'offline' && (
        <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-3 text-xs text-rose-700">
          <div className="flex gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
            <div>
              <p className="font-medium">Failed to reach Express server.</p>
              <p className="mt-1 text-[11px] opacity-90 leading-relaxed">
                {error || "Verify that 'npm run dev' is executing correctly and CORS configuration accepts connection."}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
