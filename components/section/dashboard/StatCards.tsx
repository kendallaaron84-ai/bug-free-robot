"use client";

import React, { useState } from "react";
import { MousePointerClick, UserPlus, CheckCircle2, DollarSign } from "lucide-react";

export default function StatCards() {
  // Identity validation parameter
  const currentUserEmail = "kendall.aaron@koba-i.com";
  const isOwner = currentUserEmail === "kendall.aaron@koba-i.com";

  // State parameter to track monthly overhead across roles
  const [monthlyCost, setMonthlyCost] = useState(450); // Ads, Travel, SaaS subscriptions

  // Individual author tracking fallback states
  const [manualClicks] = useState(12400);
  const [manualLeads] = useState(850);
  const [manualSales] = useState(120);
  const authorConversionRate = manualClicks > 0 ? ((manualSales / manualClicks) * 100).toFixed(1) : "0.0";

  // Owner live metrics summary variables
  const ownerMetrics = {
    clicks: 45200,
    leads: 3100,
    sales: 185,
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Card 1: Traffic/Clicks */}
      <div className="p-5 bg-card border text-card-foreground rounded-xl shadow-sm space-y-3 transition-colors duration-200">
        <div className="flex justify-between items-center text-xs font-bold text-muted-foreground tracking-wider uppercase">
          <span>Traffic / Clicks</span>
          <MousePointerClick className="w-4 h-4 text-blue-500" />
        </div>
        <div className="text-2xl font-black">
          {isOwner ? ownerMetrics.clicks.toLocaleString() : manualClicks.toLocaleString()}
        </div>
        <p className="text-xs text-muted-foreground">MoM Funnel Progress Tracker</p>
      </div>

      {/* Card 2: Active Leads */}
      <div className="p-5 bg-card border text-card-foreground rounded-xl shadow-sm space-y-3 transition-colors duration-200">
        <div className="flex justify-between items-center text-xs font-bold text-muted-foreground tracking-wider uppercase">
          <span>Active Leads</span>
          <UserPlus className="w-4 h-4 text-purple-500" />
        </div>
        <div className="text-2xl font-black">
          {isOwner ? ownerMetrics.leads.toLocaleString() : manualLeads.toLocaleString()}
        </div>
        <p className="text-xs text-muted-foreground">Inbound Conversion Pipeline</p>
      </div>

      {/* Card 3: Volume Sales & Conversion */}
      <div className="p-5 bg-card border text-card-foreground rounded-xl shadow-sm space-y-3 transition-colors duration-200">
        <div className="flex justify-between items-center text-xs font-bold text-muted-foreground tracking-wider uppercase">
          <span>Closed Volume</span>
          <CheckCircle2 className="w-4 h-4 text-green-500" />
        </div>
        <div className="text-2xl font-black">
          {isOwner ? ownerMetrics.sales.toLocaleString() : manualSales.toLocaleString()}
        </div>
        <p className="text-xs text-muted-foreground font-medium">
          Conversion: {isOwner ? ((ownerMetrics.sales / ownerMetrics.clicks) * 100).toFixed(1) : authorConversionRate}%
        </p>
      </div>

      {/* Card 4: Maintained Monthly Cost Component */}
      <div className="p-5 bg-card border text-card-foreground rounded-xl shadow-sm space-y-3 transition-colors duration-200">
        <div className="flex justify-between items-center text-xs font-bold text-muted-foreground tracking-wider uppercase">
          <span>Monthly Cost Ledger</span>
          <DollarSign className="w-4 h-4 text-red-500" />
        </div>
        <div className="space-y-1">
          <div className="text-2xl font-black">${monthlyCost.toLocaleString()}</div>
          <input 
            type="range" 
            min="0" 
            max="5000" 
            step="50"
            value={monthlyCost} 
            onChange={(e) => setMonthlyCost(Number(e.target.value))}
            className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
          />
        </div>
        <p className="text-[10px] text-muted-foreground">Tracks ads, events, and travel expenses</p>
      </div>
    </div>
  );
}