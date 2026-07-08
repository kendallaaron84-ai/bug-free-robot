"use client";

import React from "react";
import { CheckCircle2, Clock, Globe, Mic, Cpu, Radio } from "lucide-react";

interface Step {
  id: string;
  label: string;
  status: "completed" | "in-progress" | "pending";
}

interface PizzaTrackerProps {
  webSteps?: Step[];
  audioSteps?: Step[];
}

export function PizzaTracker({ 
  webSteps = [
    { id: "creds", label: "Credentials Configured", status: "completed" },
    { id: "theme", label: "Theme Deployed", status: "in-progress" },
    { id: "live", label: "Site Live", status: "pending" }
  ],
  audioSteps = [
    { id: "voice", label: "Voice Sample Uploaded", status: "completed" },
    { id: "draft", label: "Audio Draft Generated", status: "completed" },
    { id: "final", label: "Final Acceptance", status: "in-progress" }
  ]
}: PizzaTrackerProps) {
  
  const renderPipeline = (title: string, icon: React.ReactNode, steps: Step[]) => (
    <div className="bg-slate-950/50 border border-border rounded-xl p-5 shadow-lg">
      <div className="flex items-center gap-2 mb-4 text-white font-bold tracking-tight">
        {icon} {title}
      </div>
      <div className="space-y-4">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          return (
            <div key={step.id} className="relative flex items-start gap-4">
              {!isLast && (
                <div 
                  className={`absolute left-[11px] top-6 bottom-[-16px] w-[2px] ${
                    step.status === "completed" ? "bg-emerald-500" : "bg-slate-800"
                  }`}
                />
              )}
              <div className="relative z-10 flex-shrink-0 mt-1">
                {step.status === "completed" ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 fill-emerald-500/20" />
                ) : step.status === "in-progress" ? (
                  <Clock className="w-6 h-6 text-orange-500 animate-pulse" />
                ) : (
                  <div className="w-6 h-6 rounded-full border-2 border-slate-700 bg-slate-900" />
                )}
              </div>
              <div className="pt-1">
                <p className={`text-sm font-semibold ${
                  step.status === "completed" ? "text-emerald-400" :
                  step.status === "in-progress" ? "text-orange-400" :
                  "text-slate-500"
                }`}>
                  {step.label}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {step.status === "completed" ? "Finished successfully" :
                   step.status === "in-progress" ? "Working on this now..." :
                   "Awaiting previous steps"}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-slate-800">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Cpu className="w-5 h-5 text-emerald-500" /> Fulfillment Pipeline Tracker
        </h3>
        <p className="text-sm text-slate-400 mt-1">Real-time status of your KOBA-I automation factory.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {renderPipeline("Web Construction", <Globe className="w-5 h-5 text-blue-500" />, webSteps)}
        {renderPipeline("Audiobook Factory", <Mic className="w-5 h-5 text-purple-500" />, audioSteps)}
      </div>
    </div>
  );
}
