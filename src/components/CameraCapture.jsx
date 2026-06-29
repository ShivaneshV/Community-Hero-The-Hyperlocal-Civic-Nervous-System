import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, MapPin, RefreshCw, X, ShieldAlert, Mic, Play, Square, Sparkles } from 'lucide-react';

const CameraCapture = ({ onClose, onSubmitReport }) => {
  const [activeTab, setActiveTab] = useState('camera'); // 'camera', 'voice', or 'upload'
  
  // Camera WebRTC States
  const [cameraStream, setCameraStream] = useState(null);
  const [imageBlob, setImageBlob] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  
  // Voice WebRTC States
  const [audioStream, setAudioStream] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const audioChunksRef = useRef([]);

  // Geolocation spoof states
  const [lat, setLat] = useState(13.0410);
  const [lng, setLng] = useState(80.2230);
  const [fileName, setFileName] = useState('live_capture.jpg');
  const [errorMsg, setErrorMsg] = useState('');
  const [isHealedView, setIsHealedView] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // ----------------------------------------------------
  // CAMERA OPERATIONS
  // ----------------------------------------------------
  const triggerFailsafeFallback = async () => {
    try {
      setErrorMsg('');
      const response = await fetch('/assets/mock_pothole.png');
      const blob = await response.blob();
      setImageBlob(blob);
      setPreviewUrl(URL.createObjectURL(blob));
      setFileName(`failsafe_incident_${Date.now().toString().slice(-4)}.png`);
      stopCamera();
    } catch (e) {
      console.error("Failsafe failed:", e);
      setErrorMsg("Camera error. Failsafe fallback failed.");
    }
  };

  const startCamera = async () => {
    try {
      setErrorMsg('');
      stopVoiceRecording(); // ensure voice is stopped
      if (cameraStream) {
        cameraStream.getTracks().forEach(t => t.stop());
      }
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });
      setCameraStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera access failed:", err);
      setErrorMsg("Live webcam feed blocked. Clicking snapshot will use local grid asset fallback.");
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Failsafe check: if camera not active or canvas dimensions empty, trigger mock loader
    if (!video || !canvas || video.videoWidth === 0 || video.videoHeight === 0) {
      console.warn("Video stream track not active. Executing built-in local simulation fallback.");
      triggerFailsafeFallback();
      return;
    }
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const dataUrl = canvas.toDataURL('image/jpeg');
    if (dataUrl === "data:," || dataUrl.length < 100) {
      console.warn("Canvas output empty. Triggering failsafe fallback.");
      triggerFailsafeFallback();
      return;
    }
    
    canvas.toBlob((blob) => {
      if (!blob) {
        triggerFailsafeFallback();
        return;
      }
      setImageBlob(blob);
      setPreviewUrl(URL.createObjectURL(blob));
      setFileName(`live_incident_${Date.now().toString().slice(-4)}.jpg`);
      stopCamera();
    }, 'image/jpeg', 0.9);
  };

  // ----------------------------------------------------
  // VOICE RECORDING OPERATIONS (WebRTC Mic Ingest)
  // ----------------------------------------------------
  const startVoiceRecording = async () => {
    try {
      setErrorMsg('');
      stopCamera(); // Ensure camera is stopped
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioStream(stream);

      // WebM audio format matches browsers nicely, wav fallback
      const options = { mimeType: 'audio/webm' };
      let recorder;
      try {
        recorder = new MediaRecorder(stream, options);
      } catch (e) {
        recorder = new MediaRecorder(stream);
      }

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        setAudioBlob(audioBlob);
        setAudioUrl(URL.createObjectURL(audioBlob));
        setFileName(`voice_note_${Date.now().toString().slice(-4)}.${recorder.mimeType.split('/')[1] || 'webm'}`);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access failed:", err);
      setErrorMsg("Microphone access denied. Please use simulated Tamil voice report or file upload.");
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop());
      setAudioStream(null);
    }
    setIsRecording(false);
  };

  // Cleanup WebRTC connections on unmount or tab switch
  useEffect(() => {
    if (activeTab === 'camera') {
      startCamera();
      stopVoiceRecording();
    } else if (activeTab === 'voice') {
      stopCamera();
      // Don't start recording automatically, let user click mic button
    } else {
      stopCamera();
      stopVoiceRecording();
    }
    return () => {
      stopCamera();
      stopVoiceRecording();
    };
  }, [activeTab]);

  // ----------------------------------------------------
  // FILE UPLOAD AND COORDINATE SPOOF CONTROLS
  // ----------------------------------------------------
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = (file) => {
    setImageBlob(file);
    setPreviewUrl(URL.createObjectURL(file));
    setFileName(file.name);
  };

  const handleDragOver = (e) => e.preventDefault();

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const setSpoofLocation = (type) => {
    if (type === 'kodambakkam') {
      setLat(13.0414 + (Math.random() - 0.5) * 0.0002);
      setLng(80.2241 + (Math.random() - 0.5) * 0.0002);
    } else if (type === 'adyar') {
      setLat(12.9972 + (Math.random() - 0.5) * 0.0002);
      setLng(80.2508 + (Math.random() - 0.5) * 0.0002);
    } else if (type === 'medavakkam') {
      setLat(12.9185 + (Math.random() - 0.5) * 0.0002);
      setLng(80.2175 + (Math.random() - 0.5) * 0.0002);
    } else {
      setLat(13.0100 + (Math.random() - 0.5) * 0.05);
      setLng(80.2200 + (Math.random() - 0.5) * 0.05);
    }
  };

  // Submit Handler: delegates depending on selected tab
  const handleSendReport = (isMockVoice = false) => {
    if (isMockVoice) {
      // Simulate voice note parsing
      onSubmitReport(null, lat, lng, 'medavakkam_voice_tamil.webm', true);
    } else if (activeTab === 'voice' && audioBlob) {
      onSubmitReport(audioBlob, lat, lng, fileName, false);
    } else if (imageBlob) {
      onSubmitReport(imageBlob, lat, lng, fileName, false);
    }
  };

  const resetMedia = () => {
    setImageBlob(null);
    setPreviewUrl(null);
    setAudioBlob(null);
    setAudioUrl(null);
    if (activeTab === 'camera') startCamera();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>
          <h3 className="panel-title" style={{ fontSize: '1.15rem' }}>
            <Mic size={20} className="glow-text-teal" /> Submit Civic Node Report
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="dispatch-tab-container">
          <div className={`dispatch-tab ${activeTab === 'camera' ? 'active' : ''}`} onClick={() => setActiveTab('camera')}>
            Live Camera
          </div>
          <div className={`dispatch-tab ${activeTab === 'voice' ? 'active' : ''}`} onClick={() => setActiveTab('voice')}>
            Voice Ingestion (Tamil/English)
          </div>
          <div className={`dispatch-tab ${activeTab === 'upload' ? 'active' : ''}`} onClick={() => setActiveTab('upload')}>
            File Ingest
          </div>
        </div>

        {/* Interactive Media Window */}
        <div className="camera-preview-container">
          {/* CAMERA TAB */}
          {activeTab === 'camera' && (
            previewUrl ? (
              isHealedView ? (
                <div className="ar-split-pane">
                  <div className="ar-image-wrapper">
                    <span className="ar-label-tag">Original Incident</span>
                    <img src={previewUrl} className="captured-image" alt="Original" />
                  </div>
                  <div className="ar-image-wrapper">
                    <span className="ar-label-tag" style={{ color: 'var(--neon-teal)' }}>AI-Restored Design</span>
                    <img src="/assets/restored_street.png" className="captured-image" alt="Healed AR Design" />
                  </div>
                </div>
              ) : (
                <img src={previewUrl} className="captured-image" alt="Captured Scene" />
              )
            ) : errorMsg ? (
              <div style={{ color: 'var(--neon-pink)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={36} />
                <span>{errorMsg}</span>
              </div>
            ) : (
              <video ref={videoRef} autoPlay playsInline className="camera-preview" />
            )
          )}

          {/* VOICE INGESTION TAB */}
          {activeTab === 'voice' && (
            <div style={{ width: '90%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
              {isRecording ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className="recording-dot" />
                    <span style={{ fontFamily: 'monospace', color: 'var(--neon-pink)', fontSize: '0.8rem' }}>RECORDING MIC AUDIO</span>
                  </div>
                  {/* Flashing audio wave */}
                  <div className="voice-recording-wave">
                    <div className="voice-wave-bar" />
                    <div className="voice-wave-bar" />
                    <div className="voice-wave-bar" />
                    <div className="voice-wave-bar" />
                    <div className="voice-wave-bar" />
                  </div>
                </>
              ) : audioUrl ? (
                <>
                  <span style={{ fontSize: '0.8rem', color: 'var(--neon-teal)' }}>Recorded Audio Draft ready:</span>
                  <audio src={audioUrl} controls style={{ width: '100%', outline: 'none' }} />
                </>
              ) : (
                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <Mic size={48} style={{ color: 'var(--neon-teal)', opacity: 0.6, margin: '0 auto 8px' }} />
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Record a voice note describing the incident</p>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Supports Tamil, English, and mix ("Tanglish")</span>
                </div>
              )}
            </div>
          )}

          {/* UPLOAD FILE TAB */}
          {activeTab === 'upload' && (
            previewUrl ? (
              isHealedView ? (
                <div className="ar-split-pane">
                  <div className="ar-image-wrapper">
                    <span className="ar-label-tag">Original Incident</span>
                    <img src={previewUrl} className="captured-image" alt="Original" />
                  </div>
                  <div className="ar-image-wrapper">
                    <span className="ar-label-tag" style={{ color: 'var(--neon-teal)' }}>AI-Restored Design</span>
                    <img src="/assets/restored_street.png" className="captured-image" alt="Healed AR Design" />
                  </div>
                </div>
              ) : (
                <img src={previewUrl} className="captured-image" alt="Preview File" />
              )
            ) : (
              <div className="upload-dropzone" onDragOver={handleDragOver} onDrop={handleDrop} style={{ width: '90%' }}>
                <Upload size={32} style={{ color: 'var(--neon-teal)' }} />
                <p style={{ fontSize: '0.85rem' }}>Drag & Drop incident media here</p>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>or click to browse local files</span>
                <input type="file" accept="image/*" style={{ display: 'none' }} id="file-input-capture" onChange={handleFileChange} />
                <button 
                  className="btn btn-secondary" 
                  style={{ marginTop: '10px', padding: '6px 12px', fontSize: '0.75rem' }}
                  onClick={() => document.getElementById('file-input-capture').click()}
                >
                  Browse Files
                </button>
              </div>
            )
          )}
        </div>

        {/* Media Buttons */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          {activeTab === 'camera' && !previewUrl && !errorMsg && (
            <button className="btn btn-primary" onClick={capturePhoto}>Capture Incident Snapshot</button>
          )}

          {activeTab === 'voice' && !audioUrl && (
            isRecording ? (
              <button className="btn btn-secondary" style={{ borderColor: 'var(--neon-pink)', color: 'var(--neon-pink)', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={stopVoiceRecording}>
                <Square size={12} /> Stop Recording
              </button>
            ) : (
              <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={startVoiceRecording}>
                <Mic size={14} /> Start Voice Note
              </button>
            )
          )}

          {previewUrl && activeTab !== 'voice' && (
            <button 
              className="btn btn-secondary" 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px', 
                borderColor: isHealedView ? 'var(--neon-teal)' : 'rgba(255,255,255,0.15)',
                color: isHealedView ? 'var(--neon-teal)' : '#fff',
                boxShadow: isHealedView ? '0 0 10px rgba(0, 245, 212, 0.2)' : 'none',
                marginRight: '10px'
              }} 
              onClick={() => setIsHealedView(!isHealedView)}
            >
              <Sparkles size={14} /> {isHealedView ? 'Original Photo' : 'Generative HEAL (AR)'}
            </button>
          )}

          {(previewUrl || audioUrl) && (
            <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => { resetMedia(); setIsHealedView(false); }}>
              <RefreshCw size={14} /> Reset Media Intake
            </button>
          )}
        </div>

        {/* Coordinate Spoof Controls */}
        <div style={{ background: 'rgba(15, 23, 42, 0.4)', borderRadius: '10px', padding: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--neon-blue)' }}>
            <MapPin size={14} /> GIS Location Spoofer (Tamil Pitch Setup)
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
            <div>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>LATITUDE</label>
              <input 
                type="number" step="0.0001" value={lat} onChange={(e) => setLat(parseFloat(e.target.value))} 
                style={{ width: '100%', background: '#070a13', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '5px', color: '#fff', fontSize: '0.8rem', fontFamily: 'monospace' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>LONGITUDE</label>
              <input 
                type="number" step="0.0001" value={lng} onChange={(e) => setLng(parseFloat(e.target.value))} 
                style={{ width: '100%', background: '#070a13', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '5px', color: '#fff', fontSize: '0.8rem', fontFamily: 'monospace' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" style={{ fontSize: '0.7rem', padding: '4px 8px' }} onClick={() => setSpoofLocation('kodambakkam')}>
              Kodambakkam Grid
            </button>
            <button className="btn btn-secondary" style={{ fontSize: '0.7rem', padding: '4px 8px' }} onClick={() => setSpoofLocation('adyar')}>
              Adyar Grid
            </button>
            <button className="btn btn-secondary" style={{ fontSize: '0.7rem', padding: '4px 8px' }} onClick={() => setSpoofLocation('medavakkam')}>
              Medavakkam Grid (Tamil Node Target)
            </button>
          </div>
        </div>

        {/* Modal Submit/Cancel */}
        <div className="modal-footer" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '15px' }}>
          {activeTab === 'voice' && !audioBlob && (
            <button 
              className="btn btn-primary" 
              style={{ background: 'linear-gradient(135deg, #f39c12 0%, #d35400 100%)', color: '#fff', marginRight: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={() => {
                setSpoofLocation('medavakkam'); // Auto spoof Medavakkam Main Road for the Tamil audio demo
                setTimeout(() => handleSendReport(true), 100);
              }}
            >
              <Play size={12} /> Play Tamil Demo Note
            </button>
          )}

          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          
          <button 
            className="btn btn-primary" 
            onClick={() => handleSendReport(false)}
            disabled={activeTab === 'voice' ? !audioBlob : !imageBlob}
            style={{ 
              opacity: (activeTab === 'voice' ? audioBlob : imageBlob) ? 1 : 0.5, 
              cursor: (activeTab === 'voice' ? audioBlob : imageBlob) ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            Scan with Gemini AI
          </button>
        </div>
      </div>
      {/* Hidden canvas for taking snapshot */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

export default CameraCapture;
