import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

// Fixing default Leaflet marker shadow/image asset paths for bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const MyceliumMap = ({ 
  epicenters, 
  spores = [], 
  selectedEpicenter, 
  onSelectEpicenter, 
  selectedSpore, 
  onSelectSpore, 
  pulseNodeId 
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const sporeMarkersRef = useRef([]);
  const linesRef = useRef([]);

  // Initialize Map centered on Chennai
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [12.9980, 80.2280],
      zoom: 12.0,
      zoomControl: true,
      attributionControl: false,
    });

    // Dark-mode cartography tiles (CartoDB Dark Matter)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 20,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers, Spores, and Mycelium Connections when lists update
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // 1. Clear existing epicenter markers
    Object.values(markersRef.current).forEach(marker => marker.remove());
    markersRef.current = {};

    // 2. Clear existing predictive spore markers
    sporeMarkersRef.current.forEach(marker => marker.remove());
    sporeMarkersRef.current = [];

    // 3. Clear existing polylines
    linesRef.current.forEach(line => line.remove());
    linesRef.current = [];

    // 4. Plot active Epicenter Nodes
    epicenters.forEach((epi) => {
      // Determine node status styles
      let nodeClass = 'mycelium-node';
      if (epi.status === 'Resolved') {
        nodeClass += ' resolved';
      } else if (epi.status === 'Audit Pending') {
        nodeClass += ' audit';
      } else if (epi.witherStatus === 'withered') {
        nodeClass += ' withered';
      } else if (epi.severity === 'Critical') {
        nodeClass += ' critical';
      }

      // Add special class if selected or pulsing
      const isSelected = selectedEpicenter && selectedEpicenter.id === epi.id;
      const isPulsing = pulseNodeId === epi.id;
      
      const customIcon = L.divIcon({
        className: 'mycelium-marker',
        html: `
          <div class="${nodeClass} ${isSelected || isPulsing ? 'verify-flash' : ''}" 
               style="transform: scale(${isSelected ? 1.35 : 1}); 
                      border: ${isSelected ? '2px solid #fff' : 'none'};">
          </div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      const marker = L.marker([epi.lat, epi.lng], { icon: customIcon })
        .addTo(map)
        .on('click', () => {
          onSelectSpore(null); // Clear spore selection
          onSelectEpicenter(epi);
        });

      // Tooltip displaying category and consensus score
      marker.bindTooltip(`
        <div style="font-family: 'Outfit', sans-serif; font-size: 0.75rem; font-weight: 600; padding: 2px;">
          <span style="color: #fff; font-weight: 700;">#${epi.id}</span> | 
          <span style="color: ${epi.status === 'Resolved' ? 'var(--neon-green)' : epi.status === 'Audit Pending' ? '#ffd166' : 'var(--neon-teal)'};">${epi.category.split('/')[0]}</span><br/>
          <span style="color: #94a3b8; font-weight: 400;">Consensus: ${(epi.confidence * 100).toFixed(0)}% (${epi.reports.length} reports)</span>
        </div>
      `, {
        direction: 'top',
        offset: [0, -10],
        opacity: 0.95
      });

      markersRef.current[epi.id] = marker;
    });

    // 5. Plot Predictive Spores (Glowing Orange)
    spores.forEach((spore) => {
      const isSelected = selectedSpore && selectedSpore.id === spore.id;
      const sporeIcon = L.divIcon({
        className: 'mycelium-marker',
        html: `
          <div class="mycelium-spore" 
               style="transform: scale(${isSelected ? 1.4 : 1}); 
                      border: ${isSelected ? '2px solid #fff' : 'none'};">
          </div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      const marker = L.marker([spore.lat, spore.lng], { icon: sporeIcon })
        .addTo(map)
        .on('click', () => {
          onSelectEpicenter(null); // Clear epicenter selection
          onSelectSpore(spore);
        });

      marker.bindTooltip(`
        <div style="font-family: 'Outfit', sans-serif; font-size: 0.75rem; font-weight: 600; padding: 2px;">
          <span style="color: #f39c12; font-weight: 700;">PREDICTIVE SPORE</span><br/>
          <span style="color: #fff;">${spore.name}</span><br/>
          <span style="color: var(--neon-pink); font-weight: 500;">Risk Factor: ${spore.riskFactor}</span>
        </div>
      `, {
        direction: 'top',
        offset: [0, -10],
        opacity: 0.95
      });

      sporeMarkersRef.current.push(marker);
    });

    // 6. Draw Bioluminescent Mycelium Connections
    if (epicenters.length > 1) {
      epicenters.forEach((epi, i) => {
        // Find nearest epicenters
        const candidates = epicenters
          .map((other, idx) => ({
            index: idx,
            id: other.id,
            lat: other.lat,
            lng: other.lng,
            witherStatus: other.witherStatus,
            status: other.status,
            dist: idx === i ? Infinity : Math.pow(epi.lat - other.lat, 2) + Math.pow(epi.lng - other.lng, 2)
          }))
          .sort((a, b) => a.dist - b.dist);

        // Draw connections to the 2 closest nodes
        const connectionsCount = Math.min(2, candidates.length);
        for (let c = 0; c < connectionsCount; c++) {
          const target = candidates[c];
          if (target.dist === Infinity) continue;

          if (i < target.index) {
            let pathClass = 'mycelium-path';
            let strokeColor = '#00f5d4'; // default teal
            let strokeWeight = 1.5;

            // Determine line styling based on the connected nodes status
            if (pulseNodeId === epi.id || pulseNodeId === target.id) {
              pathClass = 'mycelium-path-pulse';
              strokeColor = '#00bbf9'; // pulsing blue
              strokeWeight = 3.5;
            } else if (epi.status === 'Audit Pending' || target.status === 'Audit Pending') {
              pathClass = 'mycelium-path-audit';
              strokeColor = '#ffd166'; // yellow warning
              strokeWeight = 2.0;
            } else if (epi.status === 'Resolved' && target.status === 'Resolved') {
              pathClass = 'mycelium-path-resolved';
              strokeColor = '#39ff14'; // neon green resolved
            } else if (epi.witherStatus === 'withered' && target.witherStatus === 'withered') {
              pathClass = 'mycelium-path-withered';
              strokeColor = '#f39c12'; // withered copper
            }

            const polyline = L.polyline(
              [[epi.lat, epi.lng], [target.lat, target.lng]],
              {
                className: pathClass,
                color: strokeColor,
                weight: strokeWeight,
              }
            ).addTo(map);

            linesRef.current.push(polyline);
          }
        }
      });
    }

  }, [epicenters, spores, selectedEpicenter, selectedSpore, onSelectEpicenter, onSelectSpore, pulseNodeId]);

  // Center map on selected items
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (selectedEpicenter) {
      map.panTo([selectedEpicenter.lat, selectedEpicenter.lng], {
        animate: true,
        duration: 1.0
      });
    } else if (selectedSpore) {
      map.panTo([selectedSpore.lat, selectedSpore.lng], {
        animate: true,
        duration: 1.0
      });
    }
  }, [selectedEpicenter, selectedSpore]);

  return <div id="map-container" ref={mapContainerRef} />;
};

export default MyceliumMap;
