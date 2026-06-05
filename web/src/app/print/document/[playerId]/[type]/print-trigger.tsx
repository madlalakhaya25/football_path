"use client";
import { useEffect } from "react";

export function PrintTrigger() {
  useEffect(() => {
    const timer = setTimeout(() => window.print(), 800);
    return () => clearTimeout(timer);
  }, []);
  return null;
}

export function PrintButton() {
  return (
    <button
      type="button"
      className="no-print"
      style={{
        position: "fixed", bottom: 24, right: 24,
        padding: "12px 20px", background: "#1d4ed8", color: "#fff",
        border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600,
        cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,.2)",
      }}
      onClick={() => window.print()}
    >
      Print / Save PDF
    </button>
  );
}
