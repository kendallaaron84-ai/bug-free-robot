"use client";

import React, { useState } from "react";

interface PurchaseButtonProps {
  assetId: string;
  userEmail: string;
}

export default function PurchaseButton({ assetId, userEmail }: PurchaseButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assetId: assetId,
          userEmail: userEmail,
          originDomain: window.location.origin, // Dynamically grabs localhost or your production domain
        }),
      });

      const data = await response.json();

      if (data.url) {
        // Redirect the user straight to Stripe's Secure Checkout Page
        window.location.href = data.url;
      } else {
        console.error("❌ Link generation failed:", data.error);
        alert("Could not initiate checkout. Check server logs.");
      }
    } catch (err) {
      console.error("❌ Frontend Network Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-sm rounded-xl border border-zinc-800 bg-zinc-950/50 backdrop-blur-md">
      <h3 className="text-lg font-semibold text-white mb-1">Unlock Digital Edition</h3>
      <p className="text-xs text-zinc-400 mb-4">
        Get instant high-fidelity streaming and download access for asset ID: <span className="font-mono text-indigo-400">{assetId}</span>
      </p>
      
      <button
        onClick={handleCheckout}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 text-white font-medium text-sm transition-all duration-200 shadow-lg shadow-indigo-600/20 active:scale-[0.98]"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Connecting to Stripe...</span>
          </>
        ) : (
          <span>Buy Audiobook — $14.99</span>
        )}
      </button>
    </div>
  );
}