# Community Hero: The Hyperlocal Civic Nervous System

🔗 **[Deployed Live Application](https://community-hero-the-hyperlocal-civic.onrender.com/)** | 📝 **[Project Description (Google Doc)](https://docs.google.com/document/d/1vC3NUa82X0ANoY5IXli1PoDvB6l-ft0vVLd2l5Jwaow/edit?tab=t.0)**

**Community Hero** is a next-generation, AI-driven civic coordination platform designed to address the real bottlenecks in municipal resource allocation and grievance resolution in Chennai. 

Instead of treating civic issues as a static list of tickets, the platform coordinates them as a **Bioluminescent Mycelium Network** mapped on Leaflet.js, dynamically aggregating reports, auto-generating engineering resource calculations, and using LLM-RAG border mapping to resolve administrative boundary deadlocks.

---

## 🚀 Key Feature Directory

1. **Multimodal Engineering Triage (Gemini Vision):** Translates citizen hazard snapshots into cubic volume estimates, Bill of Materials (BOM) estimates, and traffic risk assessments.
2. **Webcam Failsafe Fallback:** Automatically fallbacks to local mockup assets if camera permissions are blocked during live presentations.
3. **Voice Ingestion & Landmark Translation:** Accepts audio recordings in Tamil/Tanglish, translates the transcripts, and resolves coordinate grids.
4. **Anti-Spam Spatial Clustering:** Merges duplicate reports within 100m. Consensus confidence scales asymptotically:
   $$C = 1 - 0.4^n$$
   At $n=3$, confidence hits $93.6\%$, auto-triggering the dispatch tickets.
5. **Generative AR "What-If" Lens:** Splits the capture window to show a side-by-side comparison: the original incident next to a restored smart-bin design.
6. **MTC Edge-AI Scanner Mesh:** Simulates transit bus cameras running active roadway scans along OMR.
7. **Jurisdictional Deadlock Solver (LLM-RAG):** Auto-splits responsibility splits (e.g. 60% GCC / 40% Highways) on border dispute grids and routes joint dispatches.
8. **Smart Accelerometer Shock Audit:** Leverages native browser `DeviceMotion` smartphone sensors to count road flatting variance before closing tickets.

---

## 🛠️ Technology Stack

* **Frontend:** React 18, Leaflet.js, SVG Vector Canvas, MediaRecorder API, HTML5 DeviceMotion API.
* **Backend:** Express Node.js, Multer buffers, Google Generative AI SDK (`gemini-1.5-flash-latest`), Spherical Haversine clustering.

---

## 📦 Quick Start Guide

### 1. Installation
Clone the repository and install the dependencies:
```bash
npm install
```

### 2. Configure Environment variables
Create a `.env` file in the root directory and add your Google Gemini API key:
```env
PORT=8080
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Build Client Assets
Compile the Vite production assets:
```bash
npm run build
```

### 4. Launch the Server
Start the Express backend:
```bash
npm start
```
Open **[http://localhost:8080](http://localhost:8080)** in your browser.

