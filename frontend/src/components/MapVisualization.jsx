import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import L from 'leaflet'; 
import 'leaflet/dist/leaflet.css';
import { useLocalizedStrings } from '../i18n/useLocalizedStrings';

// Fix for default Leaflet icons in Vite/React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// NEW: Accept sandboxData as a prop
const MapVisualization = ({ sandboxData }) => {
    const [geoData, setGeoData] = useState(null);
    const englishStrings = React.useMemo(() => ({
        loadingMap: 'Loading Geospatial Data...',
        legendTitle: 'Funding Influence (FCI %)',
        highConcentration: 'High Concentration (>15%)',
        significant: 'Significant (5-15%)',
        minimal: 'Minimal (<5%)',
        unknownTerritory: 'Unknown Territory',
        totalRaised: 'Total Raised:',
        fciScore: 'FCI Score:'
    }), []);
    const s = useLocalizedStrings(englishStrings);

    useEffect(() => {
        // We always fetch from the backend to get the actual GeoJSON map shapes
        fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api'}/geographic-influence`)
            .then(res => {
                if (!res.ok) throw new Error("Backend not responding correctly");
                return res.json();
            })
            .then(data => {
                if (data && data.features) {
                    
                    // --- BRANCH 1: ISOLATED SANDBOX MODE ---
                    if (sandboxData && sandboxData.donations) {
                        let totalSandboxFunds = 0;
                        const countyFunds = {};

                        // 1. Calculate sandbox totals and intelligently guess the county
                        sandboxData.donations.forEach(don => {
                            const amount = Number(don.amount) || 0;
                            totalSandboxFunds += amount;

                            // Smart string matching to place raw text onto the map
                            const textToSearch = `${don.donor_name} ${don.candidate_name}`.toLowerCase();
                            let matchedCounty = "unknown";

                            data.features.forEach(f => {
                                const cName = (f.properties.COUNTY_NAM || f.properties.COUNTY || "").toLowerCase();
                                if (cName && textToSearch.includes(cName)) {
                                    matchedCounty = cName;
                                }
                            });

                            // Fallback for the demo file ("Coastal Merchants" maps to Mombasa)
                            if (textToSearch.includes('coastal') || textToSearch.includes('coast')) {
                                matchedCounty = "mombasa";
                            }

                            countyFunds[matchedCounty] = (countyFunds[matchedCounty] || 0) + amount;
                        });

                        // 2. Override the map features with our isolated Sandbox data
                        data.features = data.features.map(feature => {
                            const cName = (feature.properties.COUNTY_NAM || feature.properties.COUNTY || "").toLowerCase();
                            const amountRaised = countyFunds[cName] || 0;
                            const fci = totalSandboxFunds > 0 ? (amountRaised / totalSandboxFunds) * 100 : 0;

                            return {
                                ...feature,
                                properties: {
                                    ...feature.properties,
                                    total_raised: amountRaised,
                                    fci_score: parseFloat(fci.toFixed(2))
                                }
                            };
                        });

                        setGeoData(data);
                    } 
                    // --- BRANCH 2: GLOBAL DATABASE MODE ---
                    else {
                        // Just load the normal PostgreSQL data sent by the backend
                        setGeoData(data);
                    }
                }
            })
            .catch(err => console.error("Map Engine Error:", err));
    }, [sandboxData]); // Re-run whenever the user enters or exits the Sandbox!

    // Light Theme Colors
    const getStyle = (feature) => {
        const fci = feature.properties.fci_score || 0;
        return {
            fillColor: fci > 15 ? '#b91c1c' : // High Concentration (Dark Red)
                       fci > 5  ? '#ef4444' : // Significant (Red)
                                  '#3b82f6',  // Minimal (Blue)
            weight: 1,
            opacity: 1,
            color: '#ffffff', // Clean white borders
            fillOpacity: 0.7,
        };
    };

    if (!geoData) return (
        <div className="flex items-center justify-center h-[600px] bg-slate-50 border border-slate-200 rounded-xl">
            <div className="text-slate-500 text-center p-20 animate-pulse font-sans">
                {s.loadingMap}
            </div>
        </div>
    );

    return (
        <div className="relative rounded-xl shadow-sm overflow-hidden border border-slate-200 bg-white">
            
            {/* Legend Overlay - Light Theme */}
            <div className="absolute bottom-6 left-6 z-[1000] bg-white/95 p-4 border border-slate-200 rounded-lg shadow-md text-xs text-slate-700 font-sans">
                <p className="font-bold text-blue-800 mb-2 uppercase tracking-tight">{s.legendTitle}</p>
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-[#b91c1c] rounded-sm"></div> 
                        <span>{s.highConcentration}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-[#ef4444] rounded-sm"></div> 
                        <span>{s.significant}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-[#3b82f6] rounded-sm"></div> 
                        <span>{s.minimal}</span>
                    </div>
                </div>
            </div>

            {/* Explicit Height is Required */}
            <div style={{ height: '600px', width: '100%' }}>
                <MapContainer 
                    center={[0.0236, 37.9062]} 
                    zoom={6} 
                    style={{ height: '100%', width: '100%', background: '#f8fafc' }}
                    scrollWheelZoom={false}
                >
                    {/* Light Mode Carto Base */}
                    <TileLayer 
                        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                        attribution='&copy; CARTO'
                    />
                    
                    <GeoJSON 
                        key={JSON.stringify(geoData.features[0]?.properties || 'empty')}
                        data={geoData} 
                        style={getStyle} 
                        onEachFeature={(feature, layer) => {
                            const name = feature.properties.COUNTY_NAM || feature.properties.COUNTY || s.unknownTerritory;
                            const raised = feature.properties.total_raised || 0;
                            const score = feature.properties.fci_score || 0;

                            layer.bindPopup(`
                                <div style="color: #1e293b; font-family: system-ui, sans-serif; min-width: 150px;">
                                    <h4 style="margin:0; border-bottom: 2px solid #3b82f6; padding-bottom: 4px; font-weight: bold; text-transform: uppercase;">${name}</h4>
                                    <div style="margin-top: 8px;">
                                        <p style="margin: 4px 0;"><strong>${s.totalRaised}</strong> KSh ${raised.toLocaleString()}</p>
                                        <p style="margin: 4px 0;"><strong>${s.fciScore}</strong> ${score}%</p>
                                    </div>
                                </div>
                            `);
                        }}
                    />
                </MapContainer>
            </div>
        </div>
    );
};

export default MapVisualization;