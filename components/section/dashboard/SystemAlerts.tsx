"use client";

import React, { useState, useEffect } from "react";
import { 
  Gauge, 
  HardDrive, 
  Users, 
  ShieldAlert, 
  Clock,
  Radio,
  BarChart3,
  Timer,
  UserPlus
} from "lucide-react";

type AlertSeverity = "good" | "low" | "medium" | "high" | "critical" | "info";

interface InfrastructureAlert {
  id: string;
  type: "latency" | "storage" | "security";
  title: string;
  description: string;
  timeLabel: string;
  severity: AlertSeverity;
}

type MetricTimeframe = "week" | "month" | "quarter" | "year";

export default function SystemAlerts() {
  const currentUserEmail = "kendall.aaron@koba-i.com";
  const isOwner = currentUserEmail === "kendall.aaron@koba-i.com";

  // ⏱️ TIME HORIZON GRANULAR STATE FILTER FOR TELEMETRY
  const [telemetryTimeframe, setTelemetryTimeframe] = useState<MetricTimeframe>("month");
  const [liveUserCount, setLiveUserCount] = useState(14);

  // Live Jitter loop simulation for the active stream pulse
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveUserCount(prev => Math.max(8, prev + (Math.random() > 0.5 ? 1 : -1)));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // 1. HARD SYSTEM INFRASTRUCTURE FLAGS LIST (Cleaned up and isolated)
  const infraAlerts: InfrastructureAlert[] = [
    {
      id: "inf-1",
      type: "latency",
      title: "High Website Latency",
      description: "WordPress admin core endpoint responding slow (2.8s). Handshake loop degraded.",
      timeLabel: "30 min ago",
      severity: "critical"
    },
    {
      id: "inf-2",
      type: "storage",
      title: "Storage Limit Approaching",
      description: "Audiobook media vault utilizing 87% of allocated capacity boundaries.",
      timeLabel: "1 hour ago",
      severity: "high"
    },
    {
      id: "inf-3",
      type: "security",
      title: "Unusual Login Attempt Intercepted",
      description: "Active threat protection blocked 4 consecutive failure requests.",
      timeLabel: "5 hours ago",
      severity: "critical"
    }
  ];

  // 2. TIMEFRAME-SCALED MOCK METRICS CALCULATOR (Calculated based on product selection scopes)
  const getTelemetryData = () => {
    const scalar = telemetryTimeframe === "week" ? 0.25 : telemetryTimeframe === "quarter" ? 3 : telemetryTimeframe === "year" ? 12 : 1;
    
    return isOwner ? {
      totalTime: Math.round(4120 * scalar), // Hours spent listening/reading
      newUsers: Math.round(380 * scalar),
      avgActive: Math.round(18 + (telemetryTimeframe === "year" ? 6 : 0))
    } : {
      totalTime: Math.round(850 * scalar),
      newUsers: Math.round(115 * scalar),
      avgActive: Math.round(5)
    };
  };

  const data = getTelemetryData();

  const getSeverityStyle = (severity: AlertSeverity) => {
    switch (severity) {
      case "critical": return "bg-red-500/10 text-red-500 border-red-500/20";
      case "high": return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      default: return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
    }
  };

  return (
    <div className="p-6 bg-card border text-card-foreground rounded-xl shadow-sm space-y-6 flex flex-col justify-between h-full transition-colors duration-200">
      
      {/* 🟢 BLOC 1: REAL-TIME DATA TELEMETRY SUB-SYSTEM */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-border/60 pb-3">
          <div className="space-y-0.5">
            <h3 className="font-bold text-base tracking-tight flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-500 animate-pulse" /> Readership Telemetry
            </h3>
            <p className="text-[11px] text-muted-foreground">Time-series engagement statistics log</p>
          </div>
          
          {/* Telemetry Internal Filter Toggles */}
          <div className="flex bg-muted p-1 rounded-lg border text-[10px] font-bold">
            {(["week", "month", "quarter", "year"] as MetricTimeframe[]).map((t) => (
              <button
                key={t}
                onClick={() => setTelemetryTimeframe(t)}
                className={`px-2 py-1 rounded-md capitalize transition-all ${
                  telemetryTimeframe === t ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                {t === "year" ? "Annually" : t}
              </button>
            ))}
          </div>
        </div>

        {/* Live Active Current Header Unit */}
        <div className="flex items-center justify-between p-3 bg-emerald-500/[0.02] border border-emerald-500/20 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-background border border-emerald-500/30 text-emerald-500 rounded-lg animate-pulse">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground font-semibold">CONCURRENT ACTIVE USERS</div>
              <div className="text-xl font-black font-mono tracking-tight text-foreground">{liveUserCount} <span className="text-xs font-bold text-emerald-500">ONLINE</span></div>
            </div>
          </div>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        </div>

        {/* Multi-Horizon Granular Calculated Grid Cards */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2.5 bg-muted/40 border border-border/60 rounded-lg space-y-1">
            <Timer className="w-3.5 h-3.5 text-blue-500 mx-auto" />
            <div className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Total Time</div>
            <div className="font-mono font-bold text-foreground">{data.totalTime.toLocaleString()}h</div>
          </div>
          <div className="p-2.5 bg-muted/40 border border-border/60 rounded-lg space-y-1">
            <UserPlus className="w-3.5 h-3.5 text-purple-500 mx-auto" />
            <div className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">New Users</div>
            <div className="font-mono font-bold text-foreground">+{data.newUsers}</div>
          </div>
          <div className="p-2.5 bg-muted/40 border border-border/60 rounded-lg space-y-1">
            <BarChart3 className="w-3.5 h-3.5 text-orange-500 mx-auto" />
            <div className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Avg Active</div>
            <div className="font-mono font-bold text-foreground">~{data.avgActive}/day</div>
          </div>
        </div>
      </div>

      {/* 🛑 BLOC 2: HARD INFRASTRUCTURE SITE HEALTH ALERT LOGS */}
      <div className="space-y-3 pt-2 border-t border-dashed border-border/80">
        <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Infrastructure Status Alerts</div>
        <div className="space-y-2">
          {infraAlerts.map((alert) => (
            <div key={alert.id} className="flex items-start gap-3 p-2.5 rounded-lg bg-muted/20 border border-border/40 text-left text-xs">
              <div className="p-1.5 bg-background border rounded shadow-sm shrink-0 mt-0.5">
                {alert.type === "latency" ? <Gauge className="w-3.5 h-3.5 text-red-500" /> :
                 alert.type === "storage" ? <HardDrive className="w-3.5 h-3.5 text-orange-400" /> :
                 <ShieldAlert className="w-3.5 h-3.5 text-red-500" />}
              </div>
              <div className="space-y-0.5 w-full">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-foreground text-[11px]">{alert.title}</span>
                  <span className={`text-[8px] px-1.5 py-0.5 border rounded-full font-mono font-bold uppercase ${getSeverityStyle(alert.severity)}`}>
                    {alert.severity}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-tight">{alert.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-[10px] text-muted-foreground font-mono text-center border-t border-border/60 pt-3 select-none">
        🔗 KOBA-I Secure Core Bridge Listening Loop Active
      </div>
    </div>
  );
}