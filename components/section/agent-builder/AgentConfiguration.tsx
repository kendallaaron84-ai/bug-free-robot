"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { ShieldCheck, Cpu } from "lucide-react"

export default function AgentConfiguration() {
    // 🏢 MOCK USER CONTEXT: Swap this later with your actual auth context (e.g., useAuth())
    const currentUser = {
        role: "ROLE_MASTER_ADMIN" // Change to "ROLE_STAFF" to test the view-only mode!
    }

    // 🔒 STATE MANAGEMENT: Controls text fields dynamically for your live database updates
    const [macroStrategicDirectives, setMacroStrategicDirectives] = useState(
`[HOLISTIC ARCHITECTURE]
1. Evaluate topics using Jonah Berger's STEPPS framework (Contagious).
2. Establish the Cialdini Persuasion anchor: Leverage structural Authority and Scarcity indices.
3. Apply Russell Brunson's Traffic Secrets: Guide the target audience natively down the designated value ladder sequence.`
    )

    const [tacticalDirectives, setTacticalDirectives] = useState(
`[TACTICAL COPYWRITING & SEO]
1. Enforce Joseph Sugarman's Slippery Slide: Keep the initial opening hook sentence extremely short.
2. Maintain sentence limits under 15 words to enforce the target readability grade score.
3. Satisfy Rank Math Criteria: Dynamically embed the target focus keyword inside the H1 layout, the first introductory line, and across semantic subheadings.`
    )

    // 👑 Governance Definition for Admin Access Controls
    const isMasterAdmin = currentUser?.role === 'ROLE_MASTER_ADMIN'; 

    const handleSaveConfiguration = () => {
        console.log("Saving new tuning vectors to Firestore system_config/seo_core...", {
            macroStrategicDirectives,
            tacticalDirectives
        })
        alert("Success: Tuning parameters committed to the core content engine!")
    }

    return (
        <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
                <div>
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                        <Cpu className="h-5 w-5 text-primary" />
                        Nexus Engine Tuning Portal
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                        {isMasterAdmin ? "You possess Master Admin write clearance." : "Staff Mode: Read-Only Dashboard View"}
                    </p>
                </div>
                {!isMasterAdmin && (
                    <span className="flex items-center gap-1 text-xs bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full font-medium border border-amber-500/20">
                        <ShieldCheck className="h-3 w-3" /> Secure Bounded View
                    </span>
                )}
            </CardHeader>
            
            <CardContent className="space-y-6">
                {/* Global Settings Sub-Grid */}
                <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                        <Label htmlFor="agent-name">Engine Partition Name</Label>
                        <Input 
                            id="agent-name" 
                            disabled={!isMasterAdmin}
                            defaultValue="KOBA-I Copywriter Agent (v2-Enhanced)" 
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="base-model">Base LLM Engine</Label>
                        <Select defaultValue="gpt-4o" disabled={!isMasterAdmin}>
                            <SelectTrigger id="base-model">
                                <SelectValue placeholder="Select model" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="gpt-4o">GPT-4o (Production Core)</SelectItem>
                                <SelectItem value="claude-3">Claude 3.5 Sonnet</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="reading-level">Target Readability Constraint</Label>
                        <Select defaultValue="6th-grade" disabled={!isMasterAdmin}>
                            <SelectTrigger id="reading-level">
                                <SelectValue placeholder="Select Grade" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="5th-grade">5th Grade Level</SelectItem>
                                <SelectItem value="6th-grade">6th Grade Level (Standard)</SelectItem>
                                <SelectItem value="8th-grade">8th Grade Level</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <hr className="my-4 border-muted" />

                {/* EPIC 1: THE HOLISTIC STRATEGIC TIER CONTROLLER */}
                <div className="space-y-2">
                    <Label htmlFor="system-prompt" className="text-sm font-semibold flex items-center gap-2">
                        Phase 1: Holistic Strategic Directives (Macro Tier)
                    </Label>
                    <Textarea
                        id="system-prompt"
                        disabled={!isMasterAdmin} // 🔒 STAFF PREVENTED FROM EDITING CONTENT DIRECTLY
                        className={!isMasterAdmin ? "bg-muted cursor-not-allowed opacity-80 font-mono text-xs" : "font-mono text-xs"}
                        value={macroStrategicDirectives}
                        onChange={(e) => setMacroStrategicDirectives(e.target.value)}
                        rows={6}
                    />
                    <p className="text-xs text-muted-foreground">
                        Inject your holistic marketing manuals and strategic guidelines here (*Traffic Secrets*, *Influence*).
                    </p>
                </div>

                {/* EPIC 2: THE TACTICAL MICRO-COPYWRITING TIER CONTROLLER */}
                <div className="space-y-2">
                    <Label htmlFor="tactical-prompt" className="text-sm font-semibold flex items-center gap-2">
                        Phase 2: Copywriting & Rank Math SEO Directives (Micro Tier)
                    </Label>
                    <Textarea
                        id="tactical-prompt"
                        disabled={!isMasterAdmin} // 🔒 STAFF PREVENTED FROM EDITING CONTENT DIRECTLY
                        className={!isMasterAdmin ? "bg-muted cursor-not-allowed opacity-80 font-mono text-xs" : "font-mono text-xs"}
                        value={tacticalDirectives}
                        onChange={(e) => setTacticalDirectives(e.target.value)}
                        rows={6}
                    />
                    <p className="text-xs text-muted-foreground">
                        Enforce strict paragraph structures, Rank Math variables, and readability mechanics (*Adweek Copywriting*).
                    </p>
                </div>

                {/* Save Trigger Button Container */}
                {isMasterAdmin && (
                    <div className="pt-2">
                        <Button onClick={handleSaveConfiguration} className="w-full md:w-auto bg-primary text-white">
                            Commit Tuning Parameters to Live Engine
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}