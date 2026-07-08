"use client";

import React, { useState } from "react";
import { DollarSign, TrendingUp, TrendingDown, Calculator, Receipt } from "lucide-react";

interface CostLedgerProps {
  stripeVolume?: number;
  transcriptionHours?: number;
}

export function CostLedger({ stripeVolume = 2500, transcriptionHours = 12.5 }: CostLedgerProps) {
  const [adSpend, setAdSpend] = useState<number>(450);

  const TRANSCRIPTION_RATE = 0.50; // $0.50 per hour
  const aiTranscriptionCost = transcriptionHours * TRANSCRIPTION_RATE;
  
  const totalCosts = adSpend + aiTranscriptionCost;
  const netProfit = stripeVolume - totalCosts;
  const roi = adSpend > 0 ? ((netProfit / totalCosts) * 100).toFixed(1) : 0;

  return (
    <div className="bg-slate-950 border border-border rounded-xl shadow-xl overflow-hidden">
      <div className="p-5 border-b border-border bg-slate-900/50 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-500" />
            Monthly Cost Ledger
          </h2>
          <p className="text-xs text-slate-400 mt-1">Track your 100% royalty take-home & ad spend ROI.</p>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold text-slate-400">Total Stripe Volume</div>
          <div className="text-2xl font-black text-white">${stripeVolume.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input & Line Items */}
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <TrendingDown className="w-3 h-3 text-orange-500" /> Monthly Meta/Ad Spend
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3 text-slate-400">$</span>
              <input 
                type="number"
                value={adSpend}
                onChange={(e) => setAdSpend(Number(e.target.value))}
                className="w-full pl-8 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white font-semibold focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Receipt className="w-3 h-3" /> Fixed Infrastructure Costs
            </h4>
            
            <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
              <span className="text-sm text-slate-300">Software Commissions</span>
              <span className="text-sm font-bold text-emerald-500">$0.00 <span className="text-[10px] uppercase ml-1 px-1.5 py-0.5 bg-emerald-500/20 rounded">Zero-Commission</span></span>
            </div>
            
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-slate-300 flex items-center gap-1.5">
                AI Transcription Billing
                <Calculator className="w-3 h-3 text-slate-500" />
              </span>
              <div className="text-right">
                <span className="text-sm font-bold text-orange-400">${aiTranscriptionCost.toFixed(2)}</span>
                <div className="text-[10px] text-slate-500 mt-0.5">({transcriptionHours} hrs @ $0.50/hr)</div>
              </div>
            </div>
          </div>
        </div>

        {/* ROI Calculator Result */}
        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 flex flex-col justify-center items-center text-center">
          <div className="mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Net Profit</span>
          </div>
          <div className={`text-5xl font-black mb-4 ${netProfit >= 0 ? "text-emerald-400" : "text-red-500"}`}>
            ${netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          
          <div className="w-full bg-slate-950 rounded-lg p-4 border border-slate-800 flex justify-around">
             <div>
               <div className="text-[10px] uppercase text-slate-500 font-bold mb-1">Total Costs</div>
               <div className="text-sm font-semibold text-orange-400">${totalCosts.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
             </div>
             <div className="w-[1px] bg-slate-800"></div>
             <div>
               <div className="text-[10px] uppercase text-slate-500 font-bold mb-1">Blended ROI</div>
               <div className={`text-sm font-semibold flex items-center justify-center gap-1 ${Number(roi) > 0 ? "text-emerald-500" : "text-red-500"}`}>
                 {Number(roi) > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                 {roi}%
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
