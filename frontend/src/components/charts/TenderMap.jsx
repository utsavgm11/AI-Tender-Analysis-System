import React, { useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { cityCoords } from '../../utils/geoData';

const TenderMap = ({ tenders }) => {

  // 1. Process and Aggregate Data (FIXED)
  const locationStats = useMemo(() => {
    const stats = {};

    const invalidLocations = [
      "pan india", "central", "nr", "south region",
      "west india", "india", "all india"
    ];

    tenders.forEach(t => {
      if (!t.location) return;

      // ✅ Normalize properly
      let city = t.location.toLowerCase().trim();

      // ✅ Handle multiple locations like "Coimbatore / bengaluru"
      city = city.split('/')[0].trim();

      // ❌ Ignore invalid values
      if (invalidLocations.includes(city)) return;

      // ✅ Check coordinates
      if (cityCoords[city]) {
        stats[city] = (stats[city] || 0) + 1;
      } else {
        console.warn(`Missing coordinates for: ${city}`);
      }
    });

    return stats;
  }, [tenders]);

  // 2. India center
  const indiaCenter = [20.5937, 78.9629];

  return (
    <div className="h-full w-full rounded-3xl overflow-hidden border border-slate-200 shadow-inner min-h-[400px]">
      <MapContainer
        center={indiaCenter}
        zoom={5}
        style={{ height: '100%', width: '100%', background: '#f8fafc' }}
        scrollWheelZoom={false}
      >
        {/* Clean Map Theme */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap contributors'
        />

        {Object.entries(locationStats).map(([city, count]) => {
          const position = cityCoords[city];

          // ✅ Capitalize for display
          const displayCity =
            city.charAt(0).toUpperCase() + city.slice(1);

          return (
            <CircleMarker
              key={city}
              center={position}
              radius={Math.max(8, Math.min(count * 1.5, 40))}
              fillColor="#6366f1"
              color="#4338ca"
              weight={1.5}
              fillOpacity={0.5}
            >
              <Tooltip direction="top" offset={[0, -5]} opacity={1}>
                <div className="p-1">
                  <p className="font-black text-slate-800 text-xs uppercase">
                    {displayCity}
                  </p>
                  <p className="text-indigo-600 font-bold text-sm">
                    {count} Tenders
                  </p>
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