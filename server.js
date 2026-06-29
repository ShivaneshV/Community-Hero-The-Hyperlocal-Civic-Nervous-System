import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// Configure Multer for memory storage (uploaded images are processed directly in-memory)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Initialize Gemini API (runs real model if API Key is available, falls back to local visual simulation if not)
const apiKey = process.env.GEMINI_API_KEY;
let genAI = null;
if (apiKey) {
  genAI = new GoogleGenerativeAI(apiKey);
  console.log("Gemini Generative AI initialized successfully.");
} else {
  console.warn("WARNING: GEMINI_API_KEY environment variable is not set. Express will use high-fidelity simulation engine for image triage.");
}

// ----------------------------------------------------
// CHENNAI ZONE & WARD MAPPING (Hyperlocal GIS)
// ----------------------------------------------------
// Chennai's major centers for routing reports.
const CHENNAI_LOCATIONS = [
  { name: "Kodambakkam", zone: "Zone 10 (Kodambakkam)", ward: "Ward 142", lat: 13.0412, lng: 80.2235, street: "Arcot Road" },
  { name: "Adyar", zone: "Zone 13 (Adyar)", ward: "Ward 176", lat: 12.9975, lng: 80.2505, street: "Sardar Patel Road" },
  { name: "T. Nagar", zone: "Zone 10 (Kodambakkam)", ward: "Ward 136", lat: 13.0305, lng: 80.2338, street: "G.N. Chetty Road" },
  { name: "Mylapore", zone: "Zone 09 (Teynampet)", ward: "Ward 122", lat: 13.0330, lng: 80.2685, street: "Kutchery Road" },
  { name: "Nungambakkam", zone: "Zone 10 (Kodambakkam)", ward: "Ward 113", lat: 13.0586, lng: 80.2374, street: "College Road" },
  { name: "Perungudi", zone: "Zone 14 (Perungudi)", ward: "Ward 184", lat: 12.9654, lng: 80.2461, street: "OMR Road" }
];

function getChennaiZoneAndWard(lat, lng) {
  // Find the closest predefined neighborhood using Euclidean distance for simplicity
  let closest = CHENNAI_LOCATIONS[0];
  let minD = Infinity;
  for (const loc of CHENNAI_LOCATIONS) {
    const d = Math.pow(loc.lat - lat, 2) + Math.pow(loc.lng - lng, 2);
    if (d < minD) {
      minD = d;
      closest = loc;
    }
  }
  return {
    zone: closest.zone,
    ward: closest.ward,
    street: closest.street,
    neighborhood: closest.name
  };
}

// ----------------------------------------------------
// DATABASE & PRE-SEEDED ISSUES (In-memory)
// ----------------------------------------------------
// Seeds the bioluminescent map with realistic, structured tickets.
let epicenters = [
  {
    id: "epi-101",
    lat: 13.0415,
    lng: 80.2240,
    category: "Pot hole fill up / Repairs to the damaged surface",
    description: "Multiple severe potholes along Arcot Road, deep gravel exposed. Causing two-wheeler accidents during lane changes.",
    severity: "Critical",
    confidence: 0.936, // 3 reports (1 - 0.4^3)
    status: "Open",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    witherStatus: "active", // active (high community excitement/activity)
    reports: [
      { id: "rep-101a", lat: 13.0412, lng: 80.2235, volume: "2.8 cu ft", material: "3 bags cold-mix asphalt", reportedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
      { id: "rep-101b", lat: 13.0418, lng: 80.2242, volume: "2.1 cu ft", material: "2 bags cold-mix asphalt", reportedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
      { id: "rep-101c", lat: 13.0415, lng: 80.2243, volume: "3.2 cu ft", material: "4 bags cold-mix asphalt", reportedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() }
    ],
    materialRequirements: "9 bags of cold-mix asphalt, compaction tamper, bitumen binder",
    volumeEstimation: "8.1 cubic feet",
    riskAssessment: "High risk to two-wheeler traffic. Major congestion bottleneck at peak hours.",
    dispatchDraft: null,
    auditProgress: 0,
    sensorPings: [],
    deadlock: { disputed: false }
  },
  {
    id: "epi-102",
    lat: 12.9970,
    lng: 80.2510,
    category: "Leakage of water / sewage overflow",
    description: "Main potable water conduit fracture on Sardar Patel Road. High-pressure jet causing local road washouts and water pooling.",
    severity: "High",
    confidence: 0.84, // 2 reports
    status: "Open",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    witherStatus: "active",
    reports: [
      { id: "rep-102a", lat: 12.9975, lng: 80.2505, volume: "150 gal/hr", material: "Water main seal clamp, 3m replacement duct", reportedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
      { id: "rep-102b", lat: 12.9965, lng: 80.2515, volume: "180 gal/hr", material: "Excavation crew, pipeline sealing sleeve", reportedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() }
    ],
    materialRequirements: "Water main steel collar clamp (6 inch diameter), concrete pipe support, asphalt patch for road seal",
    volumeEstimation: "330 gallons per hour leak flow rate",
    riskAssessment: "Pavement structural integrity risk (washout under asphalt). High freshwater waste.",
    dispatchDraft: null,
    auditProgress: 0,
    sensorPings: [],
    deadlock: { disputed: false }
  },
  {
    id: "epi-103",
    lat: 13.0310,
    lng: 80.2330,
    category: "Removal of garbage / debris",
    description: "Commercial garbage dump accumulating beside the street curb. Attracting stray animals and blocking sidewalk.",
    severity: "Low",
    confidence: 0.60, // 1 report, no verifications
    status: "Open",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago!
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    witherStatus: "withered", // Withered because it is old, unverified, and has low community activity
    reports: [
      { id: "rep-103a", lat: 13.0310, lng: 80.2330, volume: "15 cubic feet", material: "1 garbage truck, 2 sanitary workers", reportedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() }
    ],
    materialRequirements: "Standard waste removal truck, disinfectant spray",
    volumeEstimation: "15.0 cubic feet",
    riskAssessment: "Slight sanitary hazard. Minor obstruction to pedestrian traffic.",
    dispatchDraft: null,
    auditProgress: 0,
    sensorPings: [],
    deadlock: {
      disputed: true,
      responsibility: "GCC Teynampet Zone: 50% | Southern Railways: 50%",
      resolutionProtocol: "RAG Deadlock Solver: Border intersection of GCC Ward 136 curb and Railway tracks. Dispatch tickets co-routed under Section 12 Railway Land Protocol.",
      ragDetails: "LLM Land Boundary verify pass. Southern Railway Division Manager & GCC Assistant Commissioner joint notice routed."
    }
  },
  {
    id: "epi-104",
    lat: 13.0335,
    lng: 80.2690,
    category: "Non-burning of street lights",
    description: "Series of 3 streetlights completely dark along Kutchery Road. Pitch-black street corridor.",
    severity: "High",
    confidence: 0.974, // 4 reports
    status: "Resolved", // Green, active civic success
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    witherStatus: "resolved",
    reports: [
      { id: "rep-104a", lat: 13.0330, lng: 80.2685, volume: "1 unit", material: "LED bulb", reportedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
      { id: "rep-104b", lat: 13.0338, lng: 80.2692, volume: "2 units", material: "LED fixture", reportedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
      { id: "rep-104c", lat: 13.0332, lng: 80.2689, volume: "1 unit", material: "LED bulb", reportedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
      { id: "rep-104d", lat: 13.0340, lng: 80.2695, volume: "3 units", material: "LED fixture, wiring harness", reportedAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString() }
    ],
    materialRequirements: "3 replacement 90W LED streetlight assemblies, insulated cable sleeve, bucket truck",
    volumeEstimation: "3 non-functional poles",
    riskAssessment: "Critical hazard to female and child pedestrian security. High vehicle collision probability.",
    dispatchDraft: null,
    auditProgress: 5,
    sensorPings: [
      "Vehicle ID #8022: 0.08g vertical (FLAT PASS)",
      "Vehicle ID #1412: 0.11g vertical (FLAT PASS)",
      "Vehicle ID #9051: 0.09g vertical (FLAT PASS)",
      "Vehicle ID #3312: 0.05g vertical (FLAT PASS)",
      "Vehicle ID #4821: 0.07g vertical (FLAT PASS)"
    ],
    deadlock: { disputed: false }
  }
];

// Pre-generate dispatch orders for seeded tickets on startup
epicenters.forEach(epi => {
  epi.dispatchDraft = generateGCCDispatchDraft(epi);
});

// ----------------------------------------------------
// HA VERSINE SPATIAL DISTANCE FORMULA
// ----------------------------------------------------
function getDistanceInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a = 
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) *
    Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in meters
}

// ----------------------------------------------------
function generateGCCDispatchDraft(epi) {
  const locInfo = getChennaiZoneAndWard(epi.lat, epi.lng);
  
  let gccComplaintType = "General Grievance / Infrastructure repairs";
  if (epi.category.toLowerCase().includes("pothole") || epi.category.toLowerCase().includes("road")) {
    gccComplaintType = "Pot hole fill up / Repairs to the damaged surface";
  } else if (epi.category.toLowerCase().includes("water") || epi.category.toLowerCase().includes("leak") || epi.category.toLowerCase().includes("sewage")) {
    gccComplaintType = "Leakage of water / sewage overflow";
  } else if (epi.category.toLowerCase().includes("light") || epi.category.toLowerCase().includes("lamp")) {
    gccComplaintType = "Non-burning of street lights";
  } else if (epi.category.toLowerCase().includes("garbage") || epi.category.toLowerCase().includes("debris") || epi.category.toLowerCase().includes("waste")) {
    gccComplaintType = "Removal of garbage / debris";
  }

  const numReports = epi.reports.length;
  let recommendedCrewSize = 2;
  if (epi.severity === "Critical") recommendedCrewSize = 4;
  else if (epi.severity === "High") recommendedCrewSize = 3;

  // Formulate joint cc and body text if node has disputed boundaries
  const isDisputed = epi.deadlock && epi.deadlock.disputed;
  const ccEmail = isDisputed ? "highways.nhai@tn.gov.in, divisional.manager@sr.gov.in" : `ee.${locInfo.zone.toLowerCase().replace(/[^a-z0-9]/g, "")}@chennaicorporation.gov.in`;

  const deadlockNote = isDisputed ? `
*** DISPUTED JURISDICTION BOUNDARY AUTO-RESOLVED BY LLM-RAG ***
This incident sits on overlapping administrative boundaries.
- Co-responsibility: ${epi.deadlock.responsibility}
- RAG Legal Protocol: ${epi.deadlock.resolutionProtocol}
Joint work orders routed. Co-funded allocation active.
` : '';

  return {
    officialSystem: isDisputed ? "GCC-NHAI Joint Boundary Redressal portal" : "GCC eGov Public Grievance Redressal (ERP 1913)",
    timestamp: new Date().toISOString(),
    grievanceDetails: {
      complaintType: gccComplaintType,
      complaintDetails: `${epi.description} [Autonomous Consolidation: Merged ${numReports} reports at epicenter. Volume: ${epi.volumeEstimation}.]${isDisputed ? ' [disputed boundary resolved]' : ''}`,
      severityLevel: epi.severity.toUpperCase(),
      priorityCode: epi.severity === "Critical" ? "PRIORITY_LEVEL_1" : epi.severity === "High" ? "PRIORITY_LEVEL_2" : "PRIORITY_LEVEL_3",
      sourceChannel: "COMMUNITY_HERO_CIVIC_AI",
      epid: epi.id
    },
    locationDetails: {
      latitude: parseFloat(epi.lat.toFixed(6)),
      longitude: parseFloat(epi.lng.toFixed(6)),
      addressText: `${locInfo.street}, ${locInfo.neighborhood}, Chennai, Tamil Nadu`,
      zoneName: locInfo.zone,
      wardNumber: locInfo.ward,
      jurisdictionOffice: isDisputed ? "Joint GCC Highways Boundary Committee" : `Office of the Assistant Executive Engineer, ${locInfo.zone}`
    },
    crewDispatchPayload: {
      assignedDepartment: isDisputed ? "Joint GCC & NHAI Maintenance Task Force" : (gccComplaintType.includes("water") ? "Chennai Metro Water (CMWSSB)" : "GCC Works Department (Roads & Electrical)"),
      materialsRequired: epi.materialRequirements,
      volumeTriage: epi.volumeEstimation,
      recommendedCrewSize: recommendedCrewSize,
      targetResponseTimeHrs: epi.severity === "Critical" ? 6 : epi.severity === "High" ? 12 : 24
    },
    officerNotificationEmail: {
      to: `ae.${locInfo.ward.toLowerCase().replace(" ", "")}@chennaicorporation.gov.in`,
      cc: ccEmail,
      subject: `[DISPATCH ORDER${isDisputed ? ' - JOINT BORDER CONTRACT' : ''}] Urgent Grievance Alert - ${locInfo.ward}`,
      body: `DEAR ASSISTANT ENGINEER,

An infrastructure grievance epicentre has been consolidated by the Community Hero Civic Nervous System at:
Coordinates: ${epi.lat.toFixed(5)}, ${epi.lng.toFixed(5)}
Location: ${locInfo.street}, ${locInfo.neighborhood}
GIS Routing: ${locInfo.zone} | ${locInfo.ward}
${deadlockNote}
Details of Grievance:
- Grievance Category: ${gccComplaintType}
- Severity: ${epi.severity} (Confidence: ${(epi.confidence * 100).toFixed(1)}% over ${numReports} reports)
- Issue Description: ${epi.description}

Actionable Engineering Estimates:
- Total Damage Volume: ${epi.volumeEstimation}
- Material Bill: ${epi.materialRequirements}
- Recommended Crew Personnel: ${recommendedCrewSize} workers

Please deploy the maintenance team immediately. This ticket has been logged into the joint system queue.

Regards,
Autonomous Dispatch Dispatcher, Community Hero Node Agent`
    }
  };
}

// ----------------------------------------------------
// CLUSTERING LOGIC (Anti-Spam Engine)
// ----------------------------------------------------
function clusterReportIntoEpicenter(newReport, imageAnalysis) {
  const SPATIAL_THRESHOLD_METERS = 100;
  let matchedEpicenter = null;

  for (const epi of epicenters) {
    // 1. Spatial distance test
    const distance = getDistanceInMeters(newReport.lat, newReport.lng, epi.lat, epi.lng);
    if (distance <= SPATIAL_THRESHOLD_METERS) {
      // 2. Category match test
      // Simple match: check if the categories are similar
      const cat1 = imageAnalysis.category.toLowerCase();
      const cat2 = epi.category.toLowerCase();
      
      const isSimilarCategory = 
        cat1.includes(cat2) || cat2.includes(cat1) ||
        (cat1.includes("road") && cat2.includes("pothole")) ||
        (cat1.includes("pothole") && cat2.includes("road")) ||
        (cat1.includes("water") && cat2.includes("sewage")) ||
        (cat1.includes("sewage") && cat2.includes("water")) ||
        (cat1.includes("garbage") && cat2.includes("debris")) ||
        (cat1.includes("debris") && cat2.includes("garbage"));

      if (isSimilarCategory) {
        matchedEpicenter = epi;
        break;
      }
    }
  }

  if (matchedEpicenter) {
    console.log(`[Clustering Engine] Match Found! Merging report into Epicenter ${matchedEpicenter.id}`);
    
    // Add report details to epicenter
    const reportId = `rep-${Date.now()}`;
    matchedEpicenter.reports.push({
      id: reportId,
      lat: newReport.lat,
      lng: newReport.lng,
      volume: imageAnalysis.volume_estimation,
      material: imageAnalysis.material_required,
      reportedAt: new Date().toISOString()
    });

    // Update coordinates: weighted center coordinates based on child reports
    const totalReports = matchedEpicenter.reports.length;
    let sumLat = 0;
    let sumLng = 0;
    matchedEpicenter.reports.forEach(r => {
      sumLat += r.lat;
      sumLng += r.lng;
    });
    matchedEpicenter.lat = sumLat / totalReports;
    matchedEpicenter.lng = sumLng / totalReports;

    // Update confidence score using formula: C = 1 - 0.4^n
    matchedEpicenter.confidence = 1 - Math.pow(0.4, totalReports);

    // Update severity based on report count scaling
    if (totalReports >= 3) {
      matchedEpicenter.severity = "Critical";
    } else if (totalReports >= 2 && matchedEpicenter.severity !== "Critical") {
      matchedEpicenter.severity = "High";
    }

    // Append to description if it adds new details
    if (!matchedEpicenter.description.includes(imageAnalysis.description)) {
      matchedEpicenter.description += ` | Additional verification: ${imageAnalysis.description}`;
    }

    // Consolidate materials and volumes
    matchedEpicenter.volumeEstimation = `Consolidated (${totalReports} reports): Total estimated volume around ${imageAnalysis.volume_estimation}`;
    matchedEpicenter.materialRequirements = `${matchedEpicenter.materialRequirements}, ${imageAnalysis.material_required}`;
    
    // Update timestamp
    matchedEpicenter.updatedAt = new Date().toISOString();
    matchedEpicenter.witherStatus = "active"; // Reactivated with citizen engagement

    // Regenerate dispatch order with new compiled metrics
    matchedEpicenter.dispatchDraft = generateGCCDispatchDraft(matchedEpicenter);

    return { epicenter: matchedEpicenter, isNew: false };
  } else {
    // Create a new Epicenter
    console.log(`[Clustering Engine] No near match. Creating new Epicenter...`);
    const epicenterId = `epi-${Date.now()}`;
    const reportId = `rep-${Date.now()}`;
    
    const newEpicenter = {
      id: epicenterId,
      lat: newReport.lat,
      lng: newReport.lng,
      category: imageAnalysis.category,
      description: imageAnalysis.description,
      severity: imageAnalysis.severity_level,
      confidence: 0.60, // 1 - 0.4^1 = 0.60
      status: "Open",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      witherStatus: "active",
      reports: [
        {
          id: reportId,
          lat: newReport.lat,
          lng: newReport.lng,
          volume: imageAnalysis.volume_estimation,
          material: imageAnalysis.material_required,
          reportedAt: new Date().toISOString()
        }
      ],
      volumeEstimation: imageAnalysis.volume_estimation,
      materialRequirements: imageAnalysis.material_required,
      riskAssessment: imageAnalysis.risk_assessment,
      dispatchDraft: null,
      auditProgress: 0,
      sensorPings: [],
      deadlock: { disputed: false }
    };

    newEpicenter.dispatchDraft = generateGCCDispatchDraft(newEpicenter);
    epicenters.push(newEpicenter);

    return { epicenter: newEpicenter, isNew: true };
  }
}

// ----------------------------------------------------
// SIMULATION / BACKEND API ENDPOINTS
// ----------------------------------------------------

// Fetch all epicenters
app.get('/api/epicenters', (req, res) => {
  res.json(epicenters);
});

// Verify / Excitation Trigger (manual citizen check-in)
app.post('/api/epicenters/:id/verify', (req, res) => {
  const { id } = req.params;
  const epi = epicenters.find(e => e.id === id);
  if (!epi) {
    return res.status(404).json({ error: "Epicenter not found" });
  }

  // Increment report count to simulate a user verification
  const fakeReportId = `verify-${Date.now()}`;
  epi.reports.push({
    id: fakeReportId,
    lat: epi.lat + (Math.random() - 0.5) * 0.0002, // slightly offset coordinate
    lng: epi.lng + (Math.random() - 0.5) * 0.0002,
    volume: "Citizen verification",
    material: "Community validation",
    reportedAt: new Date().toISOString()
  });

  const totalReports = epi.reports.length;
  epi.confidence = 1 - Math.pow(0.4, totalReports);
  
  if (totalReports >= 3) {
    epi.severity = "Critical";
  } else if (totalReports >= 2 && epi.severity !== "Critical") {
    epi.severity = "High";
  }

  epi.updatedAt = new Date().toISOString();
  epi.witherStatus = "active"; // Re-energize the node
  epi.dispatchDraft = generateGCCDispatchDraft(epi);

  console.log(`[Verification Node] Epicenter ${id} verified. Confidence up to ${(epi.confidence * 100).toFixed(1)}%`);
  res.json(epi);
});

// Resolve an issue (turns the node yellow for passive sensor audits)
app.post('/api/epicenters/:id/resolve', (req, res) => {
  const { id } = req.params;
  const epi = epicenters.find(e => e.id === id);
  if (!epi) {
    return res.status(404).json({ error: "Epicenter not found" });
  }

  // Move to a pending-resolution audit state instead of closing instantly
  epi.status = "Audit Pending";
  epi.witherStatus = "audit";
  epi.auditProgress = 0;
  epi.sensorPings = [];
  epi.updatedAt = new Date().toISOString();
  epi.dispatchDraft = generateGCCDispatchDraft(epi);

  console.log(`[Status Change] Epicenter ${id} set to Audit Pending for passive sensor validation.`);
  res.json(epi);
});

// Add new citizen report (with photo upload + geolocation)
app.post('/api/reports', upload.single('image'), async (req, res) => {
  try {
    const file = req.file;
    const lat = parseFloat(req.body.lat) || 13.0412;
    const lng = parseFloat(req.body.lng) || 80.2235;
    const imageName = req.body.imageName || "unknown_report.jpg";

    if (!file) {
      return res.status(400).json({ error: "Image file is required for multimodal analysis." });
    }

    console.log(`[Ingest Handler] New citizen report received at (${lat.toFixed(5)}, ${lng.toFixed(5)}). Image Size: ${file.size} bytes`);

    let imageAnalysis = null;

    if (genAI) {
      try {
        console.log("[Gemini Engine] Analyzing image via multimodal vision model...");
        const model = genAI.getGenerativeModel({ 
          model: "gemini-1.5-flash",
          generationConfig: { responseMimeType: "application/json" }
        });

        // Convert file buffer to parts format required by Gemini Node SDK
        const imagePart = {
          inlineData: {
            data: file.buffer.toString("base64"),
            mimeType: file.mimetype
          }
        };

        const prompt = `You are an expert civil structural engineer for a municipality (Greater Chennai Corporation). 
Analyze the image of the civic infrastructure issue (damaged roads, potholes, debris, garbage piles, water mains leaking, non-functional streetlights) and generate precise triage data.

If the image represents a mock setup, such as crumpled paper or a box on the floor (used during hackathon pitches to simulate street debris or potholes), analyze it as if it were actual municipal street debris or asphalt erosion, estimating its volume based on context.

Return a JSON object containing the exact properties listed below. Do not include any formatting text other than the clean JSON structure:
{
  "category": "Pot hole fill up / Repairs to the damaged surface" OR "Leakage of water / sewage overflow" OR "Removal of garbage / debris" OR "Non-burning of street lights" OR "General Repairs",
  "volume_estimation": "e.g., '2.5 cubic feet' or '12 gallons/min flow' or '15 cubic yards'",
  "material_required": "e.g., '2 bags of cold-mix asphalt, bitumen sealant' or 'sealing sleeve clamp' or '1 dump truck load'",
  "severity_level": "Low" OR "Medium" OR "High" OR "Critical",
  "risk_assessment": "e.g., 'High risk to two-wheeler riders due to depth. Medium risk of traffic congestion.'",
  "description": "e.g., 'A circular pothole roughly 2 feet in diameter and 4 inches deep on public pavement.'",
  "confidence_score": 0.85
}`;

        const result = await model.generateContent([prompt, imagePart]);
        const responseText = result.response.text();
        console.log(`[Gemini Engine] Response received: ${responseText}`);
        imageAnalysis = JSON.parse(responseText);
      } catch (err) {
        console.error("[Gemini Engine] Error calling Gemini API. Falling back to local simulation.", err);
      }
    }

    // Fallback simulation if Gemini fails or is not configured
    if (!imageAnalysis) {
      console.log("[Simulation Engine] Generating high-fidelity mock triage data based on image name or details...");
      // Simulate delays so the UI terminal loader shows off its animations beautifully
      await new Promise(resolve => setTimeout(resolve, 1500));

      const isCrumpledPaper = imageName.toLowerCase().includes("paper") || imageName.toLowerCase().includes("box") || file.size < 50000; 

      if (isCrumpledPaper) {
        // Mock paper simulation for the pitch strategy
        imageAnalysis = {
          category: "Removal of garbage / debris",
          volume_estimation: "1.2 cubic feet",
          material_required: "1 heavy-duty municipal trash bag, sweeping crew",
          severity_level: "Low",
          risk_assessment: "Low risk to vehicles, minor visual nuisance, slight slip hazard on pedestrian walkways.",
          description: "Crumpled paper debris simulating street litter and waste accumulation on sidewalk.",
          confidence_score: 0.95
        };
      } else {
        // Mock pothole simulation
        imageAnalysis = {
          category: "Pot hole fill up / Repairs to the damaged surface",
          volume_estimation: "3.5 cubic feet",
          material_required: "3 bags of cold-mix asphalt, joint emulsion sealant",
          severity_level: "High",
          risk_assessment: "High hazard to two-wheeler vehicles (motorcycles/scooters) especially during monsoon pooling. High traffic congestion risk.",
          description: "A deep structural pothole roughly 2.5 feet wide and 5 inches deep on the main driving lane.",
          confidence_score: 0.88
        };
      }
    }

    // Run Spatial-Semantic Clustering
    const newReport = { lat, lng };
    const clusterResult = clusterReportIntoEpicenter(newReport, imageAnalysis);

    res.json({
      success: true,
      analysis: imageAnalysis,
      epicenter: clusterResult.epicenter,
      isNew: clusterResult.isNew
    });

  } catch (error) {
    console.error("[Ingest Handler] Unhandled error during report process:", error);
    res.status(500).json({ error: "Internal Server Error during issue triage." });
  }
});

// ----------------------------------------------------
// ADVANCED CIVIC DASHBOARD ENDPOINTS
// ----------------------------------------------------

// Predictive Spores Dataset
const predictiveSpores = [
  {
    id: "spore-201",
    lat: 12.9780,
    lng: 80.2210,
    name: "Velachery Junction Pavement",
    riskFactor: "89% (Monsoon Waterlogging)",
    failureType: "Asphalt stripping & pothole formation",
    lifeRemaining: "14%",
    recommendation: "Proactively deploy 1.5 tons of polymer-modified cold-mix asphalt, seal joints before monsoon.",
    severity: "Warning"
  },
  {
    id: "spore-202",
    lat: 12.9602,
    lng: 80.2185,
    name: "Pallikaranai Main Drainage Pipeline",
    riskFactor: "76% (Silt accumulation)",
    failureType: "Pipe rupture & street sewer overflow",
    lifeRemaining: "22%",
    recommendation: "Deploy suction crawler team, clear 4.2 cubic meters of silt from primary pipeline bottleneck.",
    severity: "Advisory"
  },
  {
    id: "spore-203",
    lat: 12.9620,
    lng: 80.2450,
    name: "Perungudi OMR Link Road Corridor",
    riskFactor: "62% (Heavy trailer vehicle stress)",
    failureType: "Sub-base subsidence & micro-cracking",
    lifeRemaining: "31%",
    recommendation: "Inject crack elastomeric sealing filler to prevent rain penetration and gravel washout.",
    severity: "Advisory"
  }
];

// Fetch all predictive spores
app.get('/api/spores', (req, res) => {
  res.json(predictiveSpores);
});

// Post Accelerometer Drive-by audit verification (Anti-Corruption verification)
app.post('/api/epicenters/:id/audit', (req, res) => {
  const { id } = req.params;
  const epi = epicenters.find(e => e.id === id);
  if (!epi) {
    return res.status(404).json({ error: "Epicenter not found" });
  }

  if (epi.status !== "Audit Pending") {
    return res.status(400).json({ error: "Node is not in Audit Pending state." });
  }

  epi.auditProgress = (epi.auditProgress || 0) + 1;
  const mockVehicles = ["Scooter", "Auto-rickshaw", "Car", "GCC Sanitation Truck", "Bus"];
  const selectedVehicle = mockVehicles[Math.floor(Math.random() * mockVehicles.length)];
  const randomId = Math.floor(1000 + Math.random() * 9000);
  
  // Simulated flat drive: low vertical acceleration (under 0.15g indicates flat repaired pavement)
  const gForce = (0.04 + Math.random() * 0.08).toFixed(2);
  const pingLog = `Vehicle ID #${randomId} (${selectedVehicle}): ${gForce}g vertical acceleration (FLAT PASS)`;
  
  if (!epi.sensorPings) epi.sensorPings = [];
  epi.sensorPings.push(pingLog);

  if (epi.auditProgress >= 5) {
    epi.status = "Resolved";
    epi.witherStatus = "resolved";
    console.log(`[Sensor Audit] Epicenter ${id} PASSED all 5 drive-by validations. Closed successfully.`);
  } else {
    console.log(`[Sensor Audit] Epicenter ${id} audit drive-by logged. Count: ${epi.auditProgress}/5`);
  }

  epi.updatedAt = new Date().toISOString();
  epi.dispatchDraft = generateGCCDispatchDraft(epi);

  res.json(epi);
});

// Voice-to-Node report ingestion (Tamil/Tanglish audio parsing)
app.post('/api/voice-reports', upload.single('audio'), async (req, res) => {
  try {
    const file = req.file;
    const isMock = req.body.mock === 'true';

    console.log(`[Voice Ingest] Ingestion request. File present: ${!!file}, Mock Sim: ${isMock}`);

    let voiceAnalysis = null;

    if (isMock) {
      // Simulate Tamil voice report parser for "Medavakkam Pothole"
      await new Promise(resolve => setTimeout(resolve, 1500));
      voiceAnalysis = {
        category: "Pot hole fill up / Repairs to the damaged surface",
        volume_estimation: "4.8 cubic feet",
        material_required: "4 bags of cold-mix asphalt, bitumen binder",
        severity_level: "High",
        risk_assessment: "Severe traffic congestion on Medavakkam Main Road. Deep pavement failure posing hazard to two-wheeler riders.",
        description: "Citizen voice note Tamil: Medavakkam main road-la periya pallam irukku, adhunala traffic romba aagudhu. Seekram vanthu repair pannunga. (Translation: Big pothole on Medavakkam Main Road causing severe traffic backlog. Deploy repair team immediately.)",
        location_name: "Medavakkam",
        lat: 12.9185,
        lng: 80.2175
      };
    } else if (file) {
      if (genAI) {
        try {
          console.log("[Gemini Engine] Analyzing browser audio recording file...");
          const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            generationConfig: { responseMimeType: "application/json" }
          });

          const audioPart = {
            inlineData: {
              data: file.buffer.toString("base64"),
              mimeType: file.mimetype || "audio/webm"
            }
          };

          const prompt = `You are a municipal civil engineer. You are receiving a voice recording from a citizen in Chennai reporting a road, water, waste, or light infrastructure issue. They might speak in Tamil, English, or a mix of both ("Tanglish").

Understand, translate, and extract:
1. Incident Category: Pothole, water leak, garbage pile, streetlight. Map to one of the GCC categories:
   - "Pot hole fill up / Repairs to the damaged surface"
   - "Leakage of water / sewage overflow"
   - "Removal of garbage / debris"
   - "Non-burning of street lights"
2. Chennai location mentioned:
   - Medavakkam: 12.9185, 80.2175
   - Velachery: 12.9780, 80.2210
   - Adyar: 12.9975, 80.2505
   - Kodambakkam: 13.0412, 80.2235
   - T. Nagar: 13.0305, 80.2338
   - Mylapore: 13.0330, 80.2685
   - Pallikaranai: 12.9602, 80.2185
   - Madipakkam: 12.9620, 80.2010
   - If they name a different Chennai area, resolve its approximate coordinates.
3. Volumetric and material calculations.
4. Risk assessment.

Return a JSON object containing the exact properties listed below. Do not include any formatting text other than clean JSON:
{
  "category": "One of the 4 categories mentioned above",
  "volume_estimation": "e.g., '3.0 cubic feet' or '10 gallons/min leak flow'",
  "material_required": "e.g., '3 bags of cold-mix asphalt' or 'collateral steel clamp'",
  "severity_level": "Low" OR "Medium" OR "High" OR "Critical",
  "risk_assessment": "Details of hazards to traffic",
  "description": "Transcription details translated to English",
  "location_name": "Name of neighborhood",
  "lat": 12.9185,
  "lng": 80.2175
}`;

          const result = await model.generateContent([prompt, audioPart]);
          const responseText = result.response.text();
          console.log(`[Gemini Engine] Audio note parsed: ${responseText}`);
          voiceAnalysis = JSON.parse(responseText);
        } catch (err) {
          console.error("[Gemini Engine] Audio parsing failed. Falling back to default simulation.", err);
        }
      }
    }

    if (!voiceAnalysis) {
      // Fallback
      await new Promise(resolve => setTimeout(resolve, 1200));
      voiceAnalysis = {
        category: "Pot hole fill up / Repairs to the damaged surface",
        volume_estimation: "3.2 cubic feet",
        material_required: "3 bags of cold asphalt",
        severity_level: "High",
        risk_assessment: "Risk to vehicle alignment.",
        description: "Citizen recorded audio note: Repaired pothole on street link. Translated from audio notes.",
        location_name: "Chennai District",
        lat: 13.0100 + (Math.random() - 0.5) * 0.04,
        lng: 80.2200 + (Math.random() - 0.5) * 0.04
      };
    }

    // Run Spatial-Semantic Clustering
    const newReport = { lat: voiceAnalysis.lat, lng: voiceAnalysis.lng };
    const clusterResult = clusterReportIntoEpicenter(newReport, voiceAnalysis);

    res.json({
      success: true,
      analysis: voiceAnalysis,
      epicenter: clusterResult.epicenter,
      isNew: clusterResult.isNew
    });

  } catch (error) {
    console.error("[Voice Ingest Handler] Unhandled error during voice process:", error);
    res.status(500).json({ error: "Internal Server Error during voice note parsing." });
  }
});

// MTC Edge AI Scan Simulator (OMR Corridor Simulation)
app.post('/api/simulate-bus', (req, res) => {
  const { step } = req.body;
  console.log(`[MTC Edge AI Mesh] Received simulation request. Step: ${step}`);

  let newEpicenter = null;

  if (step === 1) {
    newEpicenter = {
      id: "epi-301",
      lat: 12.9654,
      lng: 80.2461,
      category: "Pot hole fill up / Repairs to the damaged surface",
      description: "Passive edge scan: Severe road erosion detected by MTC Bus ID #12A camera. Depth approx 6 inches.",
      severity: "High",
      confidence: 0.88,
      status: "Open",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      witherStatus: "active",
      reports: [
        { id: "mtc-301a", lat: 12.9654, lng: 80.2461, volume: "3.5 cu ft", material: "3 bags asphalt", reportedAt: new Date().toISOString() }
      ],
      volumeEstimation: "3.5 cubic feet",
      materialRequirements: "3 bags of cold-mix asphalt, compacting machinery",
      riskAssessment: "High risk to two-wheelers on the link expressway link.",
      deadlock: {
        disputed: true,
        responsibility: "GCC Perungudi Zone: 40% | NHAI Highways: 60%",
        resolutionProtocol: "RAG Deadlock Solver: Border junction of GCC Ward 184 and NHAI OMR Link. Dispatch tickets co-routed under Section 14 Highways Act.",
        ragDetails: "LLM Land Registry verification passed. NHAI regional manager & Perungudi EE joint notification queued."
      },
      auditProgress: 0,
      sensorPings: []
    };
  } else if (step === 2) {
    newEpicenter = {
      id: "epi-302",
      lat: 12.9012,
      lng: 80.2265,
      category: "Removal of garbage / debris",
      description: "Passive edge scan: Commercial dump accumulation on curb detected by MTC Bus ID #12A camera.",
      severity: "Medium",
      confidence: 0.82,
      status: "Open",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      witherStatus: "active",
      reports: [
        { id: "mtc-302a", lat: 12.9012, lng: 80.2265, volume: "18 cubic feet", material: "1 waste vehicle", reportedAt: new Date().toISOString() }
      ],
      volumeEstimation: "18.0 cubic feet",
      materialRequirements: "GCC sanitary vehicle, 2 clearance crew",
      riskAssessment: "Visual nuisance and pedestrian sidewalk blockage.",
      deadlock: { disputed: false },
      auditProgress: 0,
      sensorPings: []
    };
  } else if (step === 3) {
    newEpicenter = {
      id: "epi-303",
      lat: 12.9325,
      lng: 80.2312,
      category: "Leakage of water / sewage overflow",
      description: "Passive edge scan: Standing sewer pooling detected on linkage segment by MTC Bus ID #12A.",
      severity: "Critical",
      confidence: 0.90,
      status: "Open",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      witherStatus: "active",
      reports: [
        { id: "mtc-303a", lat: 12.9325, lng: 80.2312, volume: "220 gal/hr", material: "Pipe collar clamp", reportedAt: new Date().toISOString() }
      ],
      volumeEstimation: "220 gallons per hour leak",
      materialRequirements: "Metro Water pipeline sealer cuff, concrete link support",
      riskAssessment: "Freshwater loss and asphalt structural washout hazard.",
      deadlock: { disputed: false },
      auditProgress: 0,
      sensorPings: []
    };
  }

  if (newEpicenter) {
    newEpicenter.dispatchDraft = generateGCCDispatchDraft(newEpicenter);
    
    const exists = epicenters.find(e => e.id === newEpicenter.id);
    if (!exists) {
      epicenters.push(newEpicenter);
    }
    
    return res.json({ success: true, epicenter: newEpicenter });
  }

  res.status(400).json({ error: "Invalid simulation step." });
});

// Wildcard route to serve the built index.html for React routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`  COMMUNITY HERO ENGINE RUNNING ON PORT : ${PORT}  `);
  console.log(`  Local Endpoint: http://localhost:${PORT}          `);
  console.log(`====================================================`);
});
