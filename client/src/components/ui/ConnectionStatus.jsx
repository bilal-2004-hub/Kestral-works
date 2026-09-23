import React from 'react';
import { useSocket } from '../../context/SocketContext.jsx';

export default function ConnectionStatus({ className = '' }) {
  const { isConnected } = useSocket();

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
        isConnected
          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
          : 'bg-amber-50 text-amber-700 border border-amber-200/60'
      } ${className}`}
      title={isConnected ? 'Real-time WebSocket connected' : 'Connecting to live update server...'}
    >
      <span className="relative flex h-2 w-2">
        {isConnected && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        )}
        <span
          className={`relative inline-flex h-2 w-2 rounded-full ${
            isConnected ? 'bg-emerald-500' : 'bg-amber-500'
          }`}
        />
      </span>
      <span>{isConnected ? 'Live' : 'Connecting'}</span>
    </div>
  );
}
