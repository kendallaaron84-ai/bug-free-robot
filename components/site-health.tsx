"use client";

import React from "react";
import { Activity, Database, HardDrive, AlertTriangle, CheckCircle } from "lucide-react";

interface SiteHealthProps {
  cpuUsage?: number; // percentage
  dbCapacity?: number; // percentage
  storageUsage?: number; // percentage
}

export function SiteHealth({ cpuUsage = 45, dbCapacity = 88, storageUsage = 62 }: SiteHealthProps) {
  const THRESHOLD = 85;

  const hasAlert = cpuUsage > THRESHOLD || dbCapacity > THRESHOLD || storageUsage > THRESHOLD;

  const renderMetric = (label: string, value: number, icon: React.ReactNode) => {
    const isCritical = value > THRESHOLD;
    return (
      <div className={`p-4 rounded-xl border ${isCritical ? 'bg-red-500/10 border-red-500/30' : 'bg-slate-900 border-slate-800'}`}>
        <div className="flex justify-between items-center mb-3">
          <div className={`flex items-center gap-2 text-sm font-semibold ${isCritical ? 'text-red-400' : 'text-slate-300'}`}>
            {icon} {label}
          </div>
          <div className={`text-lg font-bold ${isCritical ? 'text-red-500' : 'text-emerald-400'}`}>
            {value}%
          </div>
        </div>
        <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden">
          <div 
            className={`h-2 rounded-full transition-all duration-1000 ${isCritical ? 'bg-red-500' : value > 60 ? 'bg-orange-500' : 'bg-emerald-500'}`}
            style={{ width: `${value}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="bg-slate-950 border border-border rounded-xl shadow-xl overflow-hidden">
      <div className="p-5 border-b border-border bg-slate-900/50 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-500" />
            WordPress Telemetry
          </h2>
          <p className="text-xs text-slate-400 mt-1">Managed Studio Tier ($60/mo) Active Monitoring.</p>
        </div>
        {hasAlert ? (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full text-xs font-bold uppercase tracking-wider animate-pulse">
            <AlertTriangle className="w-3 h-3" /> Critical Load
          </span>
        ) : (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-bold uppercase tracking-wider">
            <CheckCircle className="w-3 h-3" /> Healthy
          </span>
        )}
      </div>

      {hasAlert && (
        <div className="bg-red-500/10 border-b border-red-500/20 p-3 px-5 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-red-400">Resource Threshold Exceeded</h4>
            <p className="text-xs text-red-300 mt-0.5">One or more of your WordPress infrastructure metrics has crossed the 85% safety threshold. Consider scaling your Managed Studio resources or clearing out old revisions.</p>
          </div>
        </div>
      )}

      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {renderMetric("CPU Allocation", cpuUsage, <Activity className="w-4 h-4" />)}
        {renderMetric("DB Capacity", dbCapacity, <Database className="w-4 h-4" />)}
        {renderMetric("SSD Storage", storageUsage, <HardDrive className="w-4 h-4" />)}
      </div>
    </div>
  );
}
