"use client";

import React, { useState } from "react";
import { 
  Settings2, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Calculator,
  CalendarDays,
  Sparkles
} from "lucide-react";

interface ProductItem {
  id: string;
  name: string;
  targetUnits: number; // Stored at Monthly baseline level
  price: number;
  actualUnits: number; // Stored at Monthly baseline level
  statusTag?: string;
  category: "software" | "book";
}

type Timeframe = "month" | "quarter" | "year";

export default function UsageChartSection() {
  const currentUserEmail = "kendall.aaron@koba-i.com";
  const isOwner = currentUserEmail === "kendall.aaron@koba-i.com";

  // ⏱️ GLOBAL TIMEFRAME STATE FILTER
  const [timeframe, setTimeframe] = useState<Timeframe>("month");

  // 👑 UNIFIED DATA LEDGER INITIALIZATION
  const [products, setProducts] = useState<ProductItem[]>(
    isOwner 
      ? [
          /* Master Brand Software Portfolio */
          { id: "jw", name: "Jubilee Works", targetUnits: 5000, price: 199, actualUnits: 35, statusTag: "Software Core", category: "software" },
          { id: "ap", name: "KOBA-I Audio Plugin", targetUnits: 5000, price: 299, actualUnits: 0, statusTag: "Active Pipeline", category: "software" },
          { id: "ac", name: "Audiobook Creations", targetUnits: 5000, price: 1250, actualUnits: 0, statusTag: "Enterprise", category: "software" },
          /* Kendall Aaron Personal Author Catalog */
          { id: "dh1", name: "Duncan the Man Hunter: Part 1", targetUnits: 1500, price: 20, actualUnits: 240, statusTag: "Published", category: "book" },
          { id: "dh2", name: "Duncan the Man Hunter: Part 2", targetUnits: 2000, price: 20, actualUnits: 85, statusTag: "Published", category: "book" },
          { id: "dh3", name: "Duncan the Man Hunter: Part 3", targetUnits: 3000, price: 25, actualUnits: 0, statusTag: "Pre-Order", category: "book" },
          { id: "bio", name: "Personal Biography Memoir", targetUnits: 1000, price: 30, actualUnits: 0, statusTag: "Drafting", category: "book" }
        ]
      : [
          /* Standard Author Isolation Sandbox */
          { id: "ab1", name: "Book 1 Title", targetUnits: 5000, price: 20, actualUnits: 45, statusTag: "Active", category: "book" },
          { id: "ab2", name: "Book 2 Title", targetUnits: 3000, price: 20, actualUnits: 12, statusTag: "Active", category: "book" },
          { id: "ab3", name: "Book 3 Title", targetUnits: 2500, price: 25, actualUnits: 0, statusTag: "Draft", category: "book" }
        ]
  );

  // Pagination & Layout Controls
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  // Inline Configuration Form States
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editUnits, setEditUnits] = useState(0);
  const [editPrice, setEditPrice] = useState(0);

  // Reverse Calculator Tool Processing Parameter States
  const [calcTargetIncome, setCalcTargetIncome] = useState(100000);

  // Chart Hover Tooltip State (Maintains graph hover sync overlay)
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);

  const monthlyDataset = [
    { month: "Jan", clicks: 12400, leads: 850, sales: 45 },
    { month: "Feb", clicks: 14200, leads: 920, sales: 52 },
    { month: "Mar", clicks: 18500, leads: 1100, sales: 68 },
    { month: "Apr", clicks: 22000, leads: 1400, sales: 85 },
    { month: "May", clicks: 28400, leads: 1950, sales: 120 },
    { month: "Jun", clicks: 31000, leads: 2200, sales: 145 },
    { month: "Jul", clicks: 35000, leads: 2500, sales: 168 },
    { month: "Aug", clicks: 32000, bandwidth: 2100, leads: 2100, sales: 150 },
    { month: "Sep", clicks: 38000, leads: 2700, sales: 195 },
    { month: "Oct", clicks: 42000, leads: 3100, sales: 220 },
    { month: "Nov", clicks: 45200, leads: 3400, sales: 255 },
    { month: "Dec", clicks: 48000, leads: 3800, sales: 290 }
  ];

  // Isolated Edit Core Action Interceptor
  const startEditing = (prod: ProductItem) => {
    setEditingId(prod.id);
    setEditName(prod.name);
    // Storing edit adjustments natively back down to standard base monthly metrics
    const baselineUnits = timeframe === "year" ? prod.targetUnits / 12 : timeframe === "quarter" ? prod.targetUnits / 3 : prod.targetUnits;
    setEditUnits(Math.round(baselineUnits));
    setEditPrice(prod.price);
  };

  const saveProductConfig = (id: string) => {
    setProducts(products.map(p => {
      if (p.id === id) {
        // Automatically interpret based on active timeframe to accurately save base values
        const normalizedUnits = timeframe === "year" ? editUnits * 12 : timeframe === "quarter" ? editUnits * 3 : editUnits;
        return { ...p, name: editName, targetUnits: normalizedUnits, price: editPrice };
      }
      return p;
    }));
    setEditingId(null);
  };

  // Timeframe Math Calculation Modifiers
  const getTimeframeMultiplier = () => {
    if (timeframe === "year") return 12;
    if (timeframe === "quarter") return 3;
    return 1;
  };

  // Pagination Matrix Processing
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProducts = products.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(products.length / itemsPerPage);

  return (
    <div className="space-y-6 w-full">
      
      {/* 📊 SECTION 1: FULL WIDTH FUNNEL progress LINE & BAR TREND CHART */}
      <div className="p-6 bg-card border text-card-foreground rounded-xl shadow-sm space-y-6 relative transition-colors duration-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-0.5">
            <h3 className="font-bold text-lg tracking-tight">Funnel Conversion Lifecycles</h3>
            <p className="text-xs text-muted-foreground">Real-time baseline volume tracking running across connected merchant gateways</p>
          </div>
          <div className="flex gap-4 text-xs font-bold tracking-tight">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span> Clicks</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block"></span> Leads</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Sales Actuals</span>
          </div>
        </div>

        {/* Chart Visual Canvas Area */}
        <div className="h-48 flex items-end justify-between pt-8 border-b border-border relative px-2">
          {hoveredMonth !== null && (
            <div 
              className="absolute top-0 p-4 bg-zinc-950/95 text-white border border-zinc-800 rounded-xl shadow-xl z-30 space-y-1.5 pointer-events-none transition-all duration-150 text-xs"
              style={{ left: `${Math.min((hoveredMonth / monthlyDataset.length) * 100 + 4, 80)}%` }}
            >
              <div className="font-bold text-zinc-400 border-b border-zinc-800 pb-1 mb-1 uppercase tracking-wider font-mono">
                {monthlyDataset[hoveredMonth].month} Conversions
              </div>
              <div className="flex justify-between gap-6"><span>Clicks:</span><span className="font-mono font-bold text-blue-400">{monthlyDataset[hoveredMonth].clicks.toLocaleString()}</span></div>
              <div className="flex justify-between gap-6"><span>Leads:</span><span className="font-mono font-bold text-purple-400">{monthlyDataset[hoveredMonth].leads.toLocaleString()}</span></div>
              <div className="flex justify-between gap-6"><span>Sales:</span><span className="font-mono font-bold text-emerald-400">{monthlyDataset[hoveredMonth].sales.toLocaleString()}</span></div>
            </div>
          )}

          {monthlyDataset.map((data, idx) => {
            const maxVal = 50000;
            return (
              <div 
                key={idx} 
                className="w-full h-full flex items-end justify-center group relative cursor-pointer px-1"
                onMouseEnter={() => setHoveredMonth(idx)}
                onMouseLeave={() => setHoveredMonth(null)}
              >
                <div className="absolute inset-x-0 bottom-0 top-0 bg-muted/20 opacity-0 group-hover:opacity-100 transition-opacity duration-150 rounded-t-md z-0" />
                <div className="w-full flex items-end justify-center gap-1 max-w-[24px] h-full z-10 relative">
                  <div style={{ height: `${(data.clicks / maxVal) * 100}%` }} className="w-1.5 bg-blue-500 rounded-t-sm" />
                  <div style={{ height: `${((data.leads * 10) / maxVal) * 100}%` }} className="w-1.5 bg-purple-500 rounded-t-sm" />
                  <div style={{ height: `${((data.sales * 100) / maxVal) * 100}%` }} className="w-1.5 bg-emerald-500 rounded-t-sm" />
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-muted-foreground font-mono text-[10px] px-2 select-none">
          {monthlyDataset.map((d, i) => <span key={i} className="w-full text-center max-w-[24px]">{d.month}</span>)}
        </div>
      </div>

      {/* 🎯 SECTION 2: TIMEFRAME & PARAMETER TUNING CONTROL PANEL */}
      <div className="p-6 bg-card border text-card-foreground rounded-xl shadow-sm space-y-6 transition-colors duration-200">
        
        {/* Sub-Header Row with Timeline Filter Controls */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-border pb-4">
          <div className="space-y-0.5">
            <h3 className="font-bold text-lg tracking-tight flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-primary" /> Target Parameters Configurator
            </h3>
            <p className="text-xs text-muted-foreground">Isolate and scale project metrics across active timeline horizons.</p>
          </div>

          {/* ⏱️ HORIZON TIMEFRAME SELECTOR TOGGLE BUTTONS */}
          <div className="flex items-center gap-1 bg-muted p-1 rounded-xl border self-end lg:self-auto text-xs font-semibold">
            {(["month", "quarter", "year"] as Timeframe[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTimeframe(t); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                  timeframe === t 
                    ? "bg-background text-foreground shadow-sm font-bold" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "year" ? "Fiscal Year" : t}
              </button>
            ))}
          </div>
        </div>

        {/* 🛠️ Dynamic Grid Area */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {currentProducts.map((prod) => {
            const mult = getTimeframeMultiplier();
            const currentTargetUnits = Math.round(prod.targetUnits * mult);
            const currentActualUnits = Math.round(prod.actualUnits * mult);
            
            const plannedGoalValue = currentTargetUnits * prod.price;
            const actualRevenueValue = currentActualUnits * prod.price;
            
            const isEditing = editingId === prod.id;

            return (
              <div 
                key={prod.id}
                className={`p-5 rounded-xl border transition-all duration-200 min-h-[160px] flex flex-col justify-between ${
                  isEditing ? "bg-muted/90 border-primary shadow-sm" : "bg-muted/30 border-border hover:border-muted-foreground/40 hover:bg-muted/40 cursor-pointer"
                }`}
                onClick={() => !isEditing && startEditing(prod)}
              >
                {isEditing ? (
                  /* INLINE ISOLATED UPDATING WINDOW */
                  <div className="space-y-3 w-full text-xs" onClick={(e) => e.stopPropagation()}>
                    <div className="font-bold text-[10px] text-primary tracking-wide uppercase flex items-center gap-1">
                      <CalendarDays className="w-3.5 h-3.5" /> Adjusting {timeframe === "year" ? "Annual" : timeframe === "quarter" ? "Quarterly" : "Monthly"} Target
                    </div>
                    <input 
                      type="text" 
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full p-2 rounded bg-background border text-xs focus:outline-none focus:border-primary font-bold"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground font-semibold block">Target Units</label>
                        <input 
                          type="number" 
                          value={editUnits}
                          onChange={(e) => setEditUnits(Number(e.target.value))}
                          className="w-full p-1.5 rounded bg-background border font-mono text-xs focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground font-semibold block">Unit Price ($)</label>
                        <input 
                          type="number" 
                          value={editPrice}
                          onChange={(e) => setEditPrice(Number(e.target.value))}
                          className="w-full p-1.5 rounded bg-background border font-mono text-xs focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                    <button 
                      onClick={() => saveProductConfig(prod.id)}
                      className="w-full py-2 rounded bg-primary text-primary-foreground font-bold flex items-center justify-center gap-1 hover:opacity-90 transition-opacity"
                    >
                      <Check className="w-4 h-4" /> Save This Parameter Only
                    </button>
                  </div>
                ) : (
                  /* STANDARD BALANCED INTERFACE CARD DISPLAY */
                  <>
                    <div className="flex justify-between items-start">
                      <div className="space-y-0.5">
                        <h4 className="font-bold text-sm tracking-tight text-foreground group-hover:text-primary transition-colors">
                          {prod.name}
                        </h4>
                        <p className="text-xs text-muted-foreground font-medium">
                          Goal: {currentTargetUnits.toLocaleString()} units @ ${prod.price}
                        </p>
                      </div>
                      <span className={`text-[9px] border px-2 py-0.5 rounded-full font-mono font-bold tracking-wider uppercase ${
                        prod.category === "software" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-purple-500/10 text-purple-400 border-purple-500/20"
                      }`}>
                        {prod.statusTag || prod.category}
                      </span>
                    </div>

                    <div className="flex justify-between items-end pt-4 border-t border-dashed border-border mt-3">
                      <div>
                        <div className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Actual</div>
                        <div className="text-base font-black text-emerald-500 font-mono">${actualRevenueValue.toLocaleString()}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Planned Goal</div>
                        <div className="text-base font-bold text-foreground font-mono">${plannedGoalValue.toLocaleString()}</div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* 🧮 LOWER UTILITY TIER: PAGINATION & AUTOMATED REVERSE INCOME CALCULATOR */}
        <div className="flex flex-col lg:flex-row justify-between items-center pt-4 border-t border-border gap-4 text-xs">
          
          {/* 🔍 Dynamic Reverse Value Income Calculator tool block */}
          <div className="w-full lg:max-w-md bg-muted/40 border p-3.5 rounded-xl flex items-center gap-4 transition-colors">
            <div className="p-2 bg-primary/10 rounded-lg text-primary shrink-0">
              <Calculator className="w-4 h-4" />
            </div>
            <div className="space-y-1 w-full">
              <div className="font-bold text-[11px] text-foreground flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-yellow-500 animate-pulse" /> Target Income Solver
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-[11px] whitespace-nowrap">To clear gross value revenue of:</span>
                <div className="relative w-28">
                  <span className="absolute left-1.5 top-1/2 -translate-y-1/2 font-mono text-muted-foreground">$</span>
                  <input 
                    type="number" 
                    value={calcTargetIncome}
                    onChange={(e) => setCalcTargetIncome(Number(e.target.value))}
                    className="w-full pl-4 pr-1 py-0.5 bg-background border rounded text-xs font-mono font-bold focus:outline-none"
                  />
                </div>
              </div>
              <div className="text-[10px] text-muted-foreground font-medium pt-1">
                📚 At a standard book pricing baseline of <span className="font-bold text-foreground">$20</span>, an author needs to move exactly <span className="font-bold text-primary text-xs font-mono">{(Math.ceil(calcTargetIncome / 20)).toLocaleString()}</span> units.
              </div>
            </div>
          </div>

          {/* Pagination Navigation Interface Footer Buttons */}
          {totalPages > 1 && (
            <div className="flex items-center gap-2 bg-muted/60 border p-1 rounded-xl text-xs select-none">
              <button 
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} 
                disabled={currentPage === 1}
                className="p-1.5 rounded-md hover:bg-background disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono px-2">Page {currentPage} of {totalPages}</span>
              <button 
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} 
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-md hover:bg-background disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}