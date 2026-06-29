import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, MapPin, AlertTriangle, CheckCircle, RefreshCw, 
  FileText, Mail, Terminal, UserCheck, Shield, Activity, Sparkles,
  TrendingUp, Cpu, Compass, Flame, ShieldCheck, HeartPulse
} from 'lucide-react';
import MyceliumMap from './components/MyceliumMap';
import CameraCapture from './components/CameraCapture';
import { ConsoleLog, CyberpunkTerminalLoader } from './components/ConsoleLog';

const App = () => {
  const [epicenters, setEpicenters] = useState([]);
  const [spores, setSpores] = useState([]);
  const [selectedEpicenter, setSelectedEpicenter] = useState(null);
  const [selectedSpore, setSelectedSpore] = useState(null);
  
  const [showCamera, setShowCamera] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const [pulseNodeId, setPulseNodeId] = useState(null);
  
  // Tab states
  const [activeDetailTab, setActiveDetailTab] = useState('triage');
  const [dispatchTab, setDispatchTab] = useState('payload');
  
  // Pending data hold during terminal animation
  const [pendingReportData, setPendingReportData] = useState(null);
  
  // Persistent telemetry logs state
  const [logs, setLogs] = useState([]);

  // Load epicenters and predictive spores from API
  const fetchEpicenters = async () => {
    try {
      const response = await fetch('/api/epicenters');
      const data = await response.json();
      setEpicenters(data);
      
      // Keep selected epicenter reference updated
      if (selectedEpicenter) {
        const updated = data.find(e => e.id === selectedEpicenter.id);
        if (updated) setSelectedEpicenter(updated);
      }
    } catch (err) {
      console.error("Error loading epicenters:", err);
      addLog("Failed to sync with local database node.", "error");
    }
  };

  const fetchSpores = async () => {
    try {
      const response = await fetch('/api/spores');
      const data = await response.json();
      setSpores(data);
    } catch (err) {
      console.error("Error loading spores:", err);
    }
  };

  const addLog = (text, type = 'info') => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { time, text, type }]);
  };

  useEffect(() => {
    fetchEpicenters();
    fetchSpores();
    addLog("Community Hero: The Hyperlocal Civic Nervous System online.", "success");
    addLog("Chennai GIS telemetry synced. Zone 1 to Zone 15 active.", "system");
    addLog("Seeded active municipal epicenters on Chennai grid.", "info");
    addLog("Predictive Spore layer activated. Velachery/OMR warning flags registered.", "system");
  }, []);

  // Handle incoming camera or voice report submission
  const handleSubmitReport = async (mediaBlob, lat, lng, name, isMockTamilAudio = false) => {
    setShowCamera(false);
    setShowLoader(true);
    
    const isVoice = name.includes('voice') || name.includes('webm') || name.includes('wav');

    if (isVoice) {
      addLog(`Ingesting voice audio report. Extracting intent and neighborhood keywords...`, "system");
    } else {
      addLog(`Ingesting citizen photo upload. Analyzing incident topology...`, "system");
    }

    const formData = new FormData();
    if (isMockTamilAudio) {
      formData.append('mock', 'true');
    } else {
      // Append files matching the server parameters
      formData.append(isVoice ? 'audio' : 'image', mediaBlob, name);
      formData.append('lat', lat);
      formData.append('lng', lng);
      formData.append(isVoice ? 'audioName' : 'imageName', name);
    }

    const endpoint = isVoice ? '/api/voice-reports' : '/api/reports';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      
      if (data.success) {
        setPendingReportData(data);
        if (isVoice) {
          addLog(`Voice note transcribed and translated by Gemini. Geocoded to ${data.analysis.location_name}.`, "success");
        } else {
          addLog(`Image triage parsed by Gemini. Merged into GCC ward routing context.`, "success");
        }
      } else {
        setShowLoader(false);
        addLog(`Ingest failure: ${data.error || 'Server error'}`, "error");
      }
    } catch (err) {
      console.error("Ingest error:", err);
      setShowLoader(false);
      addLog(`Failed to communicate with AI Triage Engine. Check network connection.`, "error");
    }
  };

  // Called when full cyberpunk telemetry terminal loading screen completes
  const handleLoaderComplete = () => {
    setShowLoader(false);
    if (!pendingReportData) return;

    const { epicenter, isNew, analysis } = pendingReportData;
    
    fetchEpicenters().then(() => {
      setSelectedSpore(null); // Clear spore panel
      setSelectedEpicenter(epicenter);
      
      if (isNew) {
        addLog(`Registered Epicenter Node #${epicenter.id} in ${analysis.location_name || 'Chennai'}. Category: ${analysis.category.split('/')[0]}`, "system");
        addLog(`AI Triage volume: ${analysis.volume_estimation}. Material required: ${analysis.material_required}`, "success");
      } else {
        addLog(`Epicenter #${epicenter.id} updated. Consolidated duplicate citizen reports. Consensus confidence: ${(epicenter.confidence * 100).toFixed(1)}%`, "success");
      }
      setPendingReportData(null);
    });
  };

  // Verify / Excitation pulse trigger
  const handleVerifyNode = async (id) => {
    try {
      addLog(`Broadcasting community verification excitation code to node #${id}...`, "system");
      setPulseNodeId(id);
      
      const response = await fetch(`/api/epicenters/${id}/verify`, { method: 'POST' });
      const updatedNode = await response.json();
      
      await fetchEpicenters();
      setSelectedEpicenter(updatedNode);
      
      addLog(`Community validation verified. Excitation pulse sent down street ribbons.`, "success");

      setTimeout(() => setPulseNodeId(null), 2500);
    } catch (err) {
      console.error(err);
      addLog("Node verification failed.", "error");
      setPulseNodeId(null);
    }
  };

  // Move ticket to Audit Pending verification state
  const handleResolveNode = async (id) => {
    try {
      addLog(`GCC Dispatch: Ticket #${id} marked RESOLVED. Initiating sensor bump validation audit...`, "system");
      
      const response = await fetch(`/api/epicenters/${id}/resolve`, { method: 'POST' });
      const updatedNode = await response.json();
      
      await fetchEpicenters();
      setSelectedEpicenter(updatedNode);
      
      addLog(`Node #${id} transitioned to Audit Pending state. Awaiting smartphone accelerometer tests.`, "warning");
    } catch (err) {
      console.error(err);
      addLog("Resolution update failed.", "error");
    }
  };

  // MTC Edge-AI Scanner simulation run
  const [isBusScanning, setIsBusScanning] = useState(false);
  const [isAutoPilotActive, setIsAutoPilotActive] = useState(false);
  const autoPilotTimerRef = useRef(null);

  const toggleAutoPilotScanner = () => {
    if (isAutoPilotActive) {
      if (autoPilotTimerRef.current) clearInterval(autoPilotTimerRef.current);
      setIsAutoPilotActive(false);
      addLog("[Edge Ingest] Auto-Pilot Ingestion Daemon disabled.", "info");
    } else {
      setIsAutoPilotActive(true);
      addLog("[Edge Ingest] Auto-Pilot Ingestion Daemon started. Background-scanning OMR link corridor...", "success");
      
      let step = 1;
      const runDaemonStep = async () => {
        try {
          const response = await fetch('/api/simulate-bus', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ step: step })
          });
          const data = await response.json();
          if (data.success) {
            await fetchEpicenters();
            addLog(`[Daemon] Passive Edge-Vision scanned coordinate node #${data.epicenter.id} along bus route.`, "success");
          }
          step = step === 3 ? 1 : step + 1;
        } catch (e) {
          console.error(e);
        }
      };

      runDaemonStep();
      autoPilotTimerRef.current = setInterval(runDaemonStep, 15000);
    }
  };

  useEffect(() => {
    return () => {
      if (autoPilotTimerRef.current) clearInterval(autoPilotTimerRef.current);
    };
  }, []);

  const handleSimulateBus = async () => {
    if (isBusScanning) return;
    setIsBusScanning(true);
    addLog(`[Edge Ingest] MTC Bus #12A active sensory scan connected. Routing: OMR Corridor.`, "system");

    const runStep = async (stepNum) => {
      try {
        addLog(`[MTC-12A Edge AI] Passively scanning roadway... Searching for failures...`, "info");
        const response = await fetch('/api/simulate-bus', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ step: stepNum })
        });
        const data = await response.json();
        
        if (data.success) {
          const { epicenter } = data;
          await fetchEpicenters();
          
          if (stepNum === 1) {
            addLog(`[MTC-12A Edge AI] Bounding Box Flag: Pothole detected on OMR Link Road. C: 88%.`, "success");
            addLog(`[MTC-12A Edge AI] Syncing coordinates (${epicenter.lat.toFixed(5)} N, ${epicenter.lng.toFixed(5)} E) to database. Deadlock resolved.`, "warning");
          } else if (stepNum === 2) {
            addLog(`[MTC-12A Edge AI] Bounding Box Flag: Waste dump pile detected near Sholinganallur. C: 82%.`, "success");
            addLog(`[System] Epicenter Node #${epicenter.id} registered. Mycelium network expanded.`, "system");
          } else if (stepNum === 3) {
            addLog(`[MTC-12A Edge AI] Bounding Box Flag: Sewer pipeline leakage detected near Karapakkam. C: 90%.`, "success");
            addLog(`[System] Epicenter Node #${epicenter.id} registered. All OMR link segments synced.`, "success");
          }
          
          // Select the newly spawned epicenter on step 1 to show the deadlock solver live!
          if (stepNum === 1) {
            setSelectedSpore(null);
            setSelectedEpicenter(epicenter);
          }
        }
      } catch (err) {
        console.error("Bus simulation error:", err);
      }
    };

    // Run the 3 steps sequentially with 2.5 second delays
    await runStep(1);
    setTimeout(async () => {
      await runStep(2);
      setTimeout(async () => {
        await runStep(3);
        addLog(`[Edge Ingest] OMR Corridor Edge Mesh scan sequence completed.`, "success");
        setIsBusScanning(false);
      }, 2500);
    }, 2500);
  };

  // Simulate vehicle accelerometer bumps driving over the resolved spot
  const handleSimulateAudit = async (id) => {
    try {
      addLog(`Simulating vehicle drive-by accelerometer test on Node #${id}...`, "system");
      
      const response = await fetch(`/api/epicenters/${id}/audit`, { method: 'POST' });
      const updatedNode = await response.json();
      
      await fetchEpicenters();
      setSelectedEpicenter(updatedNode);
      
      const lastPing = updatedNode.sensorPings[updatedNode.sensorPings.length - 1];
      addLog(`[Sensor Ingest] ${lastPing}`, "info");

      if (updatedNode.status === 'Resolved') {
        addLog(`[Audit Passed] Node #${id} logged 5 consecutive flat drives. Ticket officially closed!`, "success");
      } else {
        addLog(`Pings logged: ${updatedNode.auditProgress}/5. Verification incomplete.`, "warning");
      }
    } catch (err) {
      console.error(err);
      addLog("Audit ping failed.", "error");
    }
  };

  // Hardware Accelerometer Sensor Integration
  const [isSensorActive, setIsSensorActive] = useState(false);

  const startRealAccelerometer = async (id) => {
    if (typeof DeviceMotionEvent === 'undefined') {
      addLog("Hardware accelerometer not supported on this desktop/device.", "error");
      return;
    }

    try {
      if (typeof DeviceMotionEvent.requestPermission === 'function') {
        const permission = await DeviceMotionEvent.requestPermission();
        if (permission !== 'granted') {
          addLog("Accelerometer sensor permission denied.", "error");
          return;
        }
      }

      setIsSensorActive(true);
      addLog(`[Sensor Node] Mobile Shock Sensor connected to Node #${id}. Monitoring g-force.`, "success");

      let lastPing = Date.now();
      const motionHandler = async (event) => {
        const acc = event.accelerationIncludingGravity || event.acceleration;
        if (!acc) return;
        
        const x = acc.x || 0;
        const y = acc.y || 0;
        const z = acc.z || 0;
        const magnitude = Math.sqrt(x*x + y*y + z*z);
        
        // If device registers a shake or bump (> 14m/s^2) and 1.5 seconds have passed
        if (magnitude > 14 && (Date.now() - lastPing > 1500)) {
          lastPing = Date.now();
          const gForce = (magnitude / 9.8).toFixed(2);
          addLog(`[Smart Sensor] Live device shock detected: ${gForce}g. Sending audit data...`, "success");
          
          try {
            const response = await fetch(`/api/epicenters/${id}/audit`, { method: 'POST' });
            const updatedNode = await response.json();
            
            await fetchEpicenters();
            setSelectedEpicenter(updatedNode);
            
            const lastPingMsg = updatedNode.sensorPings[updatedNode.sensorPings.length - 1];
            addLog(`[Sensor Ingest] ${lastPingMsg}`, "info");

            if (updatedNode.status === 'Resolved') {
              addLog(`[Smart Sensor] Audit completed. Node #${id} fully resolved via device hardware sensors.`, "success");
              window.removeEventListener('devicemotion', motionHandler);
              setIsSensorActive(false);
            }
          } catch (e) {
            console.error(e);
          }
        }
      };

      window.addEventListener('devicemotion', motionHandler);
    } catch (e) {
      console.error(e);
      addLog("Failed to request accelerometer permissions.", "error");
    }
  };

  return (
    <div className="dashboard-container">
      
      {/* LEFT PANEL: Civic Incidents Directory */}
      <div className="glass-panel">
        <div className="panel-header">
          <Activity className="glow-text-teal" size={24} />
          <div>
            <h1 className="panel-title" style={{ fontSize: '1.1rem', letterSpacing: '0.5px' }}>Community Hero</h1>
            <span style={{ fontSize: '0.65rem', color: 'var(--neon-blue)', fontWeight: 700, textTransform: 'uppercase' }}>The Hyperlocal Civic Nervous System</span>
          </div>
        </div>

        <div style={{ padding: '0 20px 10px', display: 'flex', flexDirection: 'column', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className="mtc-simulate-btn" 
              onClick={handleSimulateBus}
              disabled={isBusScanning || isAutoPilotActive}
              style={{ opacity: (isBusScanning || isAutoPilotActive) ? 0.6 : 1, cursor: (isBusScanning || isAutoPilotActive) ? 'not-allowed' : 'pointer', flex: 1, justifyContent: 'center' }}
            >
              <Cpu size={14} className={isBusScanning ? "recording-dot" : ""} />
              {isBusScanning ? 'Scan Running...' : 'Simulate Bus'}
            </button>
            <button 
              className="btn btn-secondary"
              onClick={toggleAutoPilotScanner}
              style={{ 
                fontSize: '0.7rem', 
                padding: '6px 10px', 
                borderColor: isAutoPilotActive ? 'var(--neon-teal)' : 'rgba(255,255,255,0.15)',
                color: isAutoPilotActive ? 'var(--neon-teal)' : '#64748b',
                boxShadow: isAutoPilotActive ? '0 0 10px rgba(0, 245, 212, 0.2)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Activity size={12} className={isAutoPilotActive ? "recording-dot" : ""} />
              {isAutoPilotActive ? 'Auto-Pilot ON' : 'Auto-Pilot'}
            </button>
          </div>
          {isAutoPilotActive && (
            <div className="mtc-scanning-tag" style={{ display: 'flex', justifyContent: 'center', gap: '6px', fontSize: '0.6rem' }}>
              <span className="recording-dot" style={{ background: 'var(--neon-teal)', boxShadow: '0 0 8px var(--neon-teal)', width: '6px', height: '6px' }} />
              <span>Edge AI Ingestion Daemon Active (OMR Route)</span>
            </div>
          )}
        </div>

        <div className="panel-content">
          {/* Active epicenters directory list */}
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.5px' }}>
            Active Epicenters ({epicenters.filter(e => e.status !== 'Resolved').length})
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {epicenters
              .filter(e => e.status !== 'Resolved')
              .map(epi => (
                <div 
                  key={epi.id} 
                  className={`issue-card ${epi.status === 'Audit Pending' ? 'audit' : epi.witherStatus === 'withered' ? 'withered' : ''} ${selectedEpicenter?.id === epi.id ? 'active-selection' : ''}`}
                  onClick={() => {
                    setSelectedSpore(null);
                    setSelectedEpicenter(epi);
                  }}
                  style={{ borderLeft: epi.status === 'Audit Pending' ? '3px solid #ffd166' : '' }}
                >
                  <div className="card-header">
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>#{epi.id}</span>
                    <span className={`badge ${
                      epi.status === 'Audit Pending' ? 'badge-audit' :
                      epi.severity === 'Critical' ? 'badge-critical' : 
                      epi.severity === 'High' ? 'badge-high' : 'badge-low'
                    }`}>
                      {epi.status === 'Audit Pending' ? 'Audit Pending' : epi.severity}
                    </span>
                  </div>
                  <div className="card-title">{epi.category.split('/')[0]}</div>
                  <div className="card-meta">
                    <span>{epi.reports.length} report{epi.reports.length > 1 ? 's' : ''}</span>
                    <span className={epi.status === 'Audit Pending' ? 'text-yellow' : 'glow-text-teal'} style={{ fontWeight: 600, color: epi.status === 'Audit Pending' ? '#ffd166' : '' }}>
                      {epi.status === 'Audit Pending' ? `Audit: ${epi.auditProgress}/5` : `C: ${(epi.confidence * 100).toFixed(0)}%`}
                    </span>
                  </div>
                </div>
              ))}
          </div>

          {/* Resolved archived tickets directory list */}
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.5px', marginTop: '10px' }}>
            Resolved Tickets ({epicenters.filter(e => e.status === 'Resolved').length})
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {epicenters
              .filter(e => e.status === 'Resolved')
              .map(epi => (
                <div 
                  key={epi.id} 
                  className={`issue-card resolved ${selectedEpicenter?.id === epi.id ? 'active-selection' : ''}`}
                  onClick={() => {
                    setSelectedSpore(null);
                    setSelectedEpicenter(epi);
                  }}
                >
                  <div className="card-header">
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>#{epi.id}</span>
                    <span className="badge badge-resolved">Resolved</span>
                  </div>
                  <div className="card-title" style={{ opacity: 0.6 }}>{epi.category.split('/')[0]}</div>
                  <div className="card-meta">
                    <span>Audit Pass Logged</span>
                    <span style={{ color: 'var(--neon-green)' }}>Sync Archived</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* CENTER PANEL: Map Canvas */}
      <div style={{ height: '100vh', width: '100%', position: 'relative' }}>
        <MyceliumMap 
          epicenters={epicenters} 
          spores={spores}
          selectedEpicenter={selectedEpicenter} 
          onSelectEpicenter={setSelectedEpicenter}
          selectedSpore={selectedSpore}
          onSelectSpore={setSelectedSpore}
          pulseNodeId={pulseNodeId}
        />
        
        {/* Floating action trigger buttons */}
        <button className="float-btn" onClick={() => setShowCamera(true)}>
          <Camera size={18} /> INGEST CIVIC REPORT (CAMERA/VOICE)
        </button>
      </div>

      {/* RIGHT PANEL: Dynamic Details Drawer */}
      <div className="glass-panel right-panel">
        <div className="panel-header" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <Cpu className="glow-text-teal" size={20} />
          <h2 className="panel-title" style={{ fontSize: '1.1rem' }}>Triage Dispatch</h2>
        </div>

        <div className="panel-content">
          {/* SPRE SPORE PANEL SELECTION */}
          {selectedSpore ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--neon-orange)', fontWeight: 700, marginBottom: '4px' }}>
                    PREDICTIVE MYCELIUM SPORE
                  </div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>
                    {selectedSpore.name}
                  </h3>
                </div>
                <span className="badge" style={{ background: 'rgba(243, 156, 18, 0.15)', color: '#f39c12', border: '1px solid rgba(243, 156, 18, 0.3)' }}>
                  {selectedSpore.severity}
                </span>
              </div>

              {/* Geo Info */}
              <div style={{ background: 'rgba(243, 156, 18, 0.03)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(243, 156, 18, 0.1)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
                <Compass size={14} style={{ color: '#f39c12' }} />
                <div>
                  Coordinates: <span style={{ fontFamily: 'monospace' }}>{selectedSpore.lat.toFixed(4)}, {selectedSpore.lng.toFixed(4)}</span>
                </div>
              </div>

              {/* Predictive Stats */}
              <div className="detail-card" style={{ borderColor: 'rgba(243, 156, 18, 0.2)' }}>
                <div className="detail-row">
                  <span className="detail-label" style={{ color: '#f39c12' }}>Predictive Failure Probability</span>
                  <span className="detail-value" style={{ color: 'var(--neon-pink)', fontWeight: 700 }}>
                    {selectedSpore.riskFactor}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Forecasted Failure Type</span>
                  <span className="detail-value">{selectedSpore.failureType}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Asset Life Remaining</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                    <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: selectedSpore.lifeRemaining, background: 'var(--neon-pink)', height: '100%' }}></div>
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{selectedSpore.lifeRemaining}</span>
                  </div>
                </div>
                <div className="detail-row" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                  <span className="detail-label" style={{ color: 'var(--neon-teal)' }}>Preventative Action Plan (AI)</span>
                  <span className="detail-value" style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.3 }}>
                    {selectedSpore.recommendation}
                  </span>
                </div>
              </div>

              {/* Proactive Dispatch Button */}
              <button 
                className="btn btn-primary"
                onClick={() => {
                  addLog(`GCC Dispatch: Triggered preventative dispatch order to ${selectedSpore.name}.`, "success");
                  setSelectedSpore(null);
                }}
                style={{ 
                  background: 'linear-gradient(135deg, #f39c12 0%, #d35400 100%)', 
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Flame size={14} /> Send Preventative Crew
              </button>
            </div>
          ) : selectedEpicenter ? (
            // EPICENTER DETAILS DRAWER
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    EPICENTER NODE ID: {selectedEpicenter.id}
                  </div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
                    {selectedEpicenter.category.split('/')[0]}
                  </h3>
                </div>
                <span className={`badge ${
                  selectedEpicenter.status === 'Resolved' ? 'badge-resolved' : 
                  selectedEpicenter.status === 'Audit Pending' ? 'badge-audit' :
                  selectedEpicenter.severity === 'Critical' ? 'badge-critical' : 'badge-high'
                }`}>
                  {selectedEpicenter.status === 'Resolved' ? 'Resolved' : selectedEpicenter.status === 'Audit Pending' ? 'Audit Pending' : selectedEpicenter.severity}
                </span>
              </div>

              {/* Location address */}
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
                <MapPin size={14} className="glow-text-teal" />
                <div>
                  <span style={{ fontWeight: 600, color: '#fff' }}>Ward {selectedEpicenter.dispatchDraft?.locationDetails?.wardNumber || 'AE'}</span> | {selectedEpicenter.dispatchDraft?.locationDetails?.zoneName || 'Chennai Zone'}
                </div>
              </div>

              {/* PASSIVE ACCELEROMETER DRIVE-BY AUDIT PANEL (Only visible when status is 'Audit Pending') */}
              {selectedEpicenter.status === 'Audit Pending' && (
                <div style={{ background: 'rgba(255, 209, 102, 0.03)', border: '1px solid rgba(255, 209, 102, 0.2)', padding: '15px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: '#ffd166' }}>
                    <ShieldCheck size={16} /> <span>Crowdsourced Passive Pavement Audit</span>
                  </div>

                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
                    To verify repair quality and prevent corruption, we audit coordinates using vertical accelerometers of citizens driving over the spot. Need 5 passes with &lt; 0.15g shock telemetry to close.
                  </p>

                  {/* Audit counter and progress bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600 }}>
                    <span>Flat vehicle passes registered</span>
                    <span>{selectedEpicenter.auditProgress} / 5 passes</span>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.05)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        background: '#ffd166', 
                        height: '100%', 
                        width: `${(selectedEpicenter.auditProgress / 5) * 100}%`,
                        boxShadow: '0 0 10px #ffd166',
                        transition: 'width 0.4s ease'
                      }}
                    />
                  </div>

                  {/* Ping scroll board */}
                  <div style={{ background: '#050811', border: '1px solid rgba(255,209,102,0.1)', padding: '8px', borderRadius: '6px', maxHeight: '100px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px', fontFamily: 'monospace', fontSize: '0.65rem', color: '#ffd166' }}>
                    {selectedEpicenter.sensorPings && selectedEpicenter.sensorPings.length > 0 ? (
                      selectedEpicenter.sensorPings.map((ping, idx) => (
                        <div key={idx}>{ping}</div>
                      ))
                    ) : (
                      <div style={{ color: '#64748b', textAlign: 'center' }}>Awaiting first drive-by telemetry...</div>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button 
                      className="btn btn-primary"
                      onClick={() => handleSimulateAudit(selectedEpicenter.id)}
                      style={{ background: '#ffd166', color: '#000', fontWeight: 700, fontSize: '0.8rem', padding: '6px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', width: '100%' }}
                    >
                      <HeartPulse size={12} /> Simulate Drive-by Shock Test
                    </button>
                    <button 
                      className="btn btn-secondary"
                      onClick={() => startRealAccelerometer(selectedEpicenter.id)}
                      style={{ 
                        borderColor: isSensorActive ? 'var(--neon-pink)' : 'rgba(255,209,102,0.3)', 
                        color: isSensorActive ? 'var(--neon-pink)' : '#ffd166', 
                        fontSize: '0.8rem', 
                        padding: '6px 12px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        gap: '6px',
                        width: '100%',
                        boxShadow: isSensorActive ? '0 0 10px rgba(255,0,127,0.2)' : 'none'
                      }}
                    >
                      <Activity size={12} className={isSensorActive ? "recording-dot" : ""} />
                      {isSensorActive ? "Shock Sensor Active (Shake Phone)" : "Link Mobile Shock Sensor"}
                    </button>
                  </div>
                </div>
              )}

              {/* Consensus meter (Only when not resolved / in audit) */}
              {selectedEpicenter.status !== 'Audit Pending' && selectedEpicenter.status !== 'Resolved' && (
                <div style={{ background: 'rgba(0, 245, 212, 0.02)', border: '1px solid rgba(0, 245, 212, 0.1)', padding: '12px 15px', borderRadius: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--neon-teal)' }}>Anti-Spam Consensus Score</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>
                      {(selectedEpicenter.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                  
                  <div style={{ background: 'rgba(255,255,255,0.05)', height: '8px', borderRadius: '4px', overflow: 'hidden', marginBottom: '8px' }}>
                    <div 
                      style={{ 
                        background: 'linear-gradient(90deg, var(--neon-blue) 0%, var(--neon-teal) 100%)', 
                        height: '100%', 
                        width: `${selectedEpicenter.confidence * 100}%`,
                        boxShadow: '0 0 10px var(--neon-teal)',
                        transition: 'width 0.8s ease'
                      }}
                    />
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                    <span>{selectedEpicenter.reports.length} reports merged (Model: C = 1 - 0.4ⁿ)</span>
                    <span>Consensus: {selectedEpicenter.reports.length >= 3 ? 'Critical (93.6% Verified)' : 'Stable'}</span>
                  </div>
                </div>
              )}

              {/* Triage / Dispatch Tabs */}
              <div className="dispatch-tab-container">
                <div className={`dispatch-tab ${activeDetailTab === 'triage' ? 'active' : ''}`} onClick={() => setActiveDetailTab('triage')}>
                  Engineering Triage
                </div>
                <div className={`dispatch-tab ${activeDetailTab === 'dispatch' ? 'active' : ''}`} onClick={() => setActiveDetailTab('dispatch')}>
                  GCC eGov Dispatch
                </div>
              </div>

              {/* Tab 1: Engineering Triage */}
              {activeDetailTab === 'triage' && (
                <div className="detail-card">
                  <div className="detail-row">
                    <span className="detail-label">Report Details</span>
                    <span className="detail-value">{selectedEpicenter.description}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Estimated Failure Volume</span>
                    <span className="detail-value" style={{ color: 'var(--neon-blue)', fontWeight: 600 }}>
                      {selectedEpicenter.volumeEstimation}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Material Bill (Estimation)</span>
                    <span className="detail-value" style={{ color: 'var(--neon-teal)', fontWeight: 600 }}>
                      {selectedEpicenter.materialRequirements}
                    </span>
                  </div>
                  <div className="detail-row" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                    <span className="detail-label">Risk Assessment</span>
                    <span className="detail-value" style={{ color: 'var(--neon-pink)', fontSize: '0.85rem' }}>
                      {selectedEpicenter.riskAssessment}
                    </span>
                  </div>
                </div>
              )}

              {activeDetailTab === 'dispatch' && selectedEpicenter.dispatchDraft && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  
                  {selectedEpicenter.deadlock && selectedEpicenter.deadlock.disputed && (
                    <div className="deadlock-card">
                      <div className="deadlock-title-row">
                        <AlertTriangle size={14} className="recording-dot" />
                        <span>Jurisdictional Boundary Deadlock Resolved</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#fff', fontWeight: 600 }}>
                        Responsibility Split: <span style={{ color: 'var(--neon-pink)' }}>{selectedEpicenter.deadlock.responsibility}</span>
                      </div>
                      <div className="deadlock-rag-details">
                        {selectedEpicenter.deadlock.resolutionProtocol}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                        RAG Reasoning: {selectedEpicenter.deadlock.ragDetails}
                      </div>
                    </div>
                  )}

                  <div style={{ background: '#050811', border: '1px solid rgba(0, 187, 249, 0.2)', padding: '10px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--neon-blue)', fontFamily: 'monospace', fontWeight: 600 }}>
                      Routing Authority
                    </span>
                    <div style={{ fontSize: '0.85rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <UserCheck size={14} style={{ color: 'var(--neon-blue)' }} />
                      <span>{selectedEpicenter.dispatchDraft.locationDetails.jurisdictionOffice}</span>
                    </div>
                  </div>

                  <div className="dispatch-tab-container" style={{ borderBottom: 'none' }}>
                    <div className={`dispatch-tab ${dispatchTab === 'payload' ? 'active' : ''}`} onClick={() => setDispatchTab('payload')} style={{ fontSize: '0.75rem', padding: '6px' }}>
                      GCC ERP JSON
                    </div>
                    <div className={`dispatch-tab ${dispatchTab === 'email' ? 'active' : ''}`} onClick={() => setDispatchTab('email')} style={{ fontSize: '0.75rem', padding: '6px' }}>
                      AE Email Draft
                    </div>
                  </div>

                  {dispatchTab === 'payload' ? (
                    <pre className="payload-preview">
                      {JSON.stringify(selectedEpicenter.dispatchDraft.grievanceDetails, null, 2)}
                      {'\n'}
                      {JSON.stringify(selectedEpicenter.dispatchDraft.crewDispatchPayload, null, 2)}
                    </pre>
                  ) : (
                    <div className="payload-preview" style={{ fontSize: '0.7rem', color: '#cbd5e1' }}>
                      <strong>Subject:</strong> {selectedEpicenter.dispatchDraft.officerNotificationEmail.subject}
                      <hr style={{ margin: '8px 0', borderColor: 'rgba(255,255,255,0.08)' }} />
                      {selectedEpicenter.dispatchDraft.officerNotificationEmail.body}
                    </div>
                  )}

                </div>
              )}

              {/* Action Buttons */}
              {selectedEpicenter.status !== 'Resolved' && selectedEpicenter.status !== 'Audit Pending' && (
                <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => handleVerifyNode(selectedEpicenter.id)}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', borderColor: 'var(--border-glow-active)' }}
                  >
                    <Shield size={14} className="glow-text-teal" /> Verify Incident
                  </button>
                  
                  <button 
                    className="btn btn-primary" 
                    onClick={() => handleResolveNode(selectedEpicenter.id)}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'var(--neon-green)', color: '#000', border: 'none' }}
                  >
                    <CheckCircle size={14} /> Resolve & Audit
                  </button>
                </div>
              )}

            </div>
          ) : (
            // Dashboard Overview (no selection)
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ background: 'rgba(15, 23, 42, 0.4)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(0, 245, 212, 0.1)', textAlign: 'center' }}>
                <Activity size={32} className="glow-text-teal" style={{ margin: '0 auto 8px' }} />
                <h3 style={{ fontSize: '0.95rem', color: '#fff', marginBottom: '4px' }}>Chennai City Nerve Center</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  Select any glowing epicenter marker, warning audit pin, or orange predictive spore hover-spot on the map to trigger detailed municipal triage controls.
                </p>
              </div>

              {/* General Health Indicators */}
              <div style={{ background: 'rgba(15, 23, 42, 0.4)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Hyperlocal Nervous System Health
                </span>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                  <span>Active Infrastructure Nodes</span>
                  <span style={{ color: 'var(--neon-teal)', fontWeight: 700 }}>
                    {epicenters.filter(e => e.status !== 'Resolved').length}
                  </span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                  <span>Predictive Spore Zones</span>
                  <span style={{ color: '#f39c12', fontWeight: 700 }}>
                    {spores.length} Warning spots
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                  <span>Under Active Drive-by Audit</span>
                  <span style={{ color: '#ffd166', fontWeight: 700 }}>
                    {epicenters.filter(e => e.status === 'Audit Pending').length} spots
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Telemetry Console */}
          <div style={{ marginTop: 'auto', paddingTop: '15px' }}>
            <ConsoleLog logs={logs} />
          </div>
        </div>
      </div>

      {/* Media Ingest Modal */}
      {showCamera && (
        <CameraCapture 
          onClose={() => setShowCamera(false)} 
          onSubmitReport={handleSubmitReport}
        />
      )}

      {/* Cyberpunk Telemetry Loader Overlay */}
      <CyberpunkTerminalLoader 
        isVisible={showLoader} 
        onComplete={handleLoaderComplete} 
      />
    </div>
  );
};

export default App;
