import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Cpu } from 'lucide-react';

// ----------------------------------------------------
// PERSISTENT TELEMETRY LOG PANEL (Right Sidebar)
// ----------------------------------------------------
export const ConsoleLog = ({ logs }) => {
  const bodyRef = useRef(null);

  // Auto-scroll console to bottom as logs stream in
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="console-panel">
      <div className="console-title">
        <Terminal size={14} className="glow-text-teal" /> 
        <span>Autonomous Dispatch Console</span>
      </div>
      <div className="console-body" ref={bodyRef}>
        {logs.map((log, index) => (
          <div key={index} style={{ 
            color: log.type === 'error' ? 'var(--neon-pink)' : 
                   log.type === 'success' ? 'var(--neon-green)' : 
                   log.type === 'system' ? 'var(--neon-blue)' : '#a5f3fc',
            lineHeight: '1.3',
            marginBottom: '4px'
          }}>
            <span style={{ color: 'rgba(0, 245, 212, 0.4)', marginRight: '6px' }}>[{log.time}]</span>
            <span>{log.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ----------------------------------------------------
// FULLSCREEN LATENCY-MASKING CYBERPUNK TERMINAL LOADER
// ----------------------------------------------------
export const CyberpunkTerminalLoader = ({ isVisible, onComplete }) => {
  const [lines, setLines] = useState([]);
  const terminalEndRef = useRef(null);

  const diagnosticLines = [
    "[>] Ingesting spatial coordinates (WGS84)...",
    "[>] Querying Chennai GIS boundary layers...",
    "[>] Localizing GCC Administration Zone...",
    "[>] Target Resolved: Zone 10 (Kodambakkam), Ward 142",
    "[>] Instantiating Gemini 1.5 Multimodal Vision engine...",
    "[>] Analyzing structural failure topology...",
    "[>] Executing material volumetric calculations...",
    "[>] Running Anti-Spam Spatial-Semantic Clustering...",
    "[>] Scanning 100m radius for duplicate incidents...",
    "[>] Similarity vectors matched! Merging with existing node.",
    "[>] Active Trust Model: C = 1 - 0.4^n (Asymptotic growth curve)",
    "[>] Consensus threshold reached: At n=3 reports, trust hits 93.6%...",
    "[>] Restructuring official GCC eGov dispatch parameters...",
    "[>] Formatting Ward Engineer routing email...",
    "[>] Compiling dispatch payload JSON...",
    "[>] Integration complete. Syncing nervous system node..."
  ];

  useEffect(() => {
    if (!isVisible) {
      setLines([]);
      return;
    }

    let currentLineIndex = 0;
    const interval = setInterval(() => {
      if (currentLineIndex < diagnosticLines.length) {
        setLines(prev => [...prev, diagnosticLines[currentLineIndex]]);
        currentLineIndex++;
      } else {
        clearInterval(interval);
        // Delay a tiny bit before completion callback
        setTimeout(() => {
          if (onComplete) onComplete();
        }, 600);
      }
    }, 280); // Speed of telemetry log prints (approx 4.2 seconds total, perfect to cover API latency!)

    return () => clearInterval(interval);
  }, [isVisible]);

  // Auto-scroll terminal loader
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [lines]);

  if (!isVisible) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 3000 }}>
      <div className="modal-card" style={{ maxWidth: '640px', border: '1px solid rgba(57, 255, 20, 0.4)', boxShadow: '0 0 50px rgba(57, 255, 20, 0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(57, 255, 20, 0.2)', paddingBottom: '10px' }}>
          <Cpu size={18} style={{ color: '#39ff14', filter: 'drop-shadow(0 0 5px #39ff14)' }} />
          <span style={{ fontFamily: 'Fira Code', fontSize: '0.85rem', fontWeight: 600, color: '#39ff14', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Civic Neural Processing Unit
          </span>
        </div>
        
        <div className="terminal-loader">
          {lines.map((line, idx) => (
            <div key={idx} style={{ textShadow: '0 0 3px rgba(57, 255, 20, 0.5)' }}>{line}</div>
          ))}
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ background: '#39ff14', width: '8px', height: '15px', display: 'inline-block', animation: 'blink 1s step-end infinite' }}></span>
          </div>
          
          <div ref={terminalEndRef} />
        </div>

        <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>
          PROCESSING MULTIMODAL INGEST AND ROUTING LOGS. STAND BY...
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes blink {
          50% { opacity: 0; }
        }
      `}} />
    </div>
  );
};
