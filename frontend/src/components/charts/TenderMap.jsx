import React, { useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { cityCoords } from '../utils/geoData';

const TenderMap = ({ tenders }) => {
  // 1. Process and Aggregate Data
  const locationStats = useMemo(() => {
    const stats = {};
    
    tenders.forEach(t => {
      if (!t.location) return;

      // Normalize the city name: " mumbai " -> "Mumbai"
      const rawCity = t.location.trim();
      const normalizedCity = rawCity.charAt(0).toUpperCase() + rawCity.slice(1).toLowerCase();

      // Check if we have coordinates for this city
      if (cityCoords[normalizedCity]) {
        stats[normalizedCity] = (stats[normalizedCity] || 0) + 1;
      } else {
        // Silently log missing cities to console for your reference
        console.warn(`Missing coordinates for: ${normalizedCity}`);
      }
    });
    
    return stats;
  }, [tenders]);

  // 2. India's Central Coordinates
  const indiaCenter = [20.5937, 78.9629];

  return (
    <div className="h-full w-full rounded-3xl overflow-hidden border border-slate-200 shadow-inner min-h-[400px]">
      <MapContainer 
        center={indiaCenter} 
        zoom={5} 
        style={{ height: '100%', width: '100%', background: '#f8fafc' }}
        scrollWheelZoom={false}
      >
        {/* Modern Clean Map Tiles */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {Object.entries(locationStats).map(([city, count]) => {
          const position = cityCoords[city];
          
          return (
            <CircleMarker 
              key={city}
              center={position}
              // Scaling: Minimum radius 8, max radius grows with count
              radius={Math.max(8, Math.min(count * 1.5, 40))} 
              fillColor="#6366f1" // Indigo
              color="#4338ca"     // Darker Indigo border
              weight={1.5}
              fillOpacity={0.5}
            >
              <Tooltip direction="top" offset={[0, -5]} opacity={1} permanent={false}>
                <div className="p-1">
                  <p className="font-black text-slate-800 text-xs uppercase">{city}</p>
                  <p className="text-indigo-600 font-bold text-sm">{count} Tenders</p>
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default TenderMap;