'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import 'mapbox-gl/dist/mapbox-gl.css';

const Map = dynamic(() => import('react-map-gl').then((mod) => mod.default), { ssr: false });
const Marker = dynamic(() => import('react-map-gl').then((mod) => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-map-gl').then((mod) => mod.Popup), { ssr: false });

// Type for the markers we get from backend (parsed from Google Maps comments)
type TrackedItem = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: string;
};

interface TransportMapProps {
  items: TrackedItem[];
}

export default function TransportMap({ items }: TransportMapProps) {
  const [selectedItem, setSelectedItem] = useState<TrackedItem | null>(null);
  
  // NOTE: In a real app, MAPBOX_TOKEN comes from env var: process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  const mapboxToken = 'pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJleGFtcGxlIn0.example'; 

  return (
    <div className="w-full h-[500px] rounded-xl overflow-hidden shadow-lg border border-gray-700/50">
      {items.length === 0 ? (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900/50 backdrop-blur-sm text-gray-300 p-6 text-center">
          <p>Para ver los talleres o vehículos en el mapa, es necesario que tengan coordenadas registradas.</p>
          <p className="text-sm mt-2 text-gray-400">(Añade un comentario con un enlace de Google Maps para rastrearlo)</p>
        </div>
      ) : (
        <Map
          mapboxAccessToken={mapboxToken}
          initialViewState={{
            longitude: -102.55,
            latitude: 23.63,
            zoom: 5,
            pitch: 45, // 3D view
          }}
          // Replace with user's actual mapbox style
          mapStyle="mapbox://styles/mapbox/dark-v11"
        >
          {items.map((item) => (
            <Marker
              key={item.id}
              longitude={item.lng}
              latitude={item.lat}
              anchor="bottom"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                setSelectedItem(item);
              }}
            >
              {/* Custom SVG Marker styled with Tailwind */}
              <div className="cursor-pointer bg-blue-500 rounded-full p-2 shadow-lg shadow-blue-500/50 border-2 border-white animate-pulse">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </Marker>
          ))}

          {selectedItem && (
            <Popup
              longitude={selectedItem.lng}
              latitude={selectedItem.lat}
              anchor="top"
              onClose={() => setSelectedItem(null)}
              className="rounded-lg overflow-hidden"
            >
              <div className="p-3 text-gray-900">
                <h3 className="font-bold text-lg">{selectedItem.name}</h3>
                <p className="text-sm text-gray-600 mb-3">Estatus: <span className="font-medium text-blue-600">{selectedItem.status}</span></p>
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded transition-colors">
                  Ver Historial
                </button>
              </div>
            </Popup>
          )}
        </Map>
      )}
    </div>
  );
}
