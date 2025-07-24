import { useEffect, useRef, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Coordinates } from '../utils/geocoding';
import { clusterContainerMarkers, shouldApplyClustering } from '../utils/mapOptimizations';

// World map center coordinates (approximately)
const WORLD_CENTER: Coordinates = { lat: 20, lng: 0 };

// Fix for default marker icons in React-Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';

// Define marker icon sizes as PointTuple
const DEFAULT_ICON_SIZE: L.PointTuple = [25, 41];
const DEFAULT_ICON_ANCHOR: L.PointTuple = [12, 41];

// Fix default icon issue in React-Leaflet
const DefaultIcon = L.icon({
  iconUrl: icon,
  iconRetinaUrl: iconRetina,
  shadowUrl: iconShadow,
  iconSize: DEFAULT_ICON_SIZE,
  iconAnchor: DEFAULT_ICON_ANCHOR,
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom marker icons based on container status
const createStatusIcon = (status: 'active' | 'inactive' | 'warning') => {
  const color = status === 'active' ? 'green' : 
                status === 'warning' ? 'orange' : 'red';
  
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white;"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
};

// Interface for container marker data
export interface ContainerMarker {
  id: number;
  name: string;
  location: string;
  coordinates: Coordinates;
  status: 'active' | 'inactive' | 'warning';
  temperature?: number;
  humidity?: number;
  battery_level?: number;
  isCluster?: boolean;
  clusterSize?: number;
  containers?: ContainerMarker[];
}

// Interface for route data
export interface RouteData {
  id: number;
  name: string;
  origin: Coordinates;
  destination: Coordinates;
  risk_level: 'low' | 'medium' | 'high' | null;
  total_shipments: number;
  delayed_shipments: number;
}

// Props for the SriLankaMap component
interface SriLankaMapProps {
  containers: ContainerMarker[];
  routes: RouteData[];
  isLoading: boolean;
  height?: string;
}

// Component to recenter map when containers or routes change
function MapUpdater({ containers, routes }: { containers: ContainerMarker[], routes: RouteData[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (containers.length > 0 || routes.length > 0) {
      // Create bounds that include all markers and routes
      const bounds = L.latLngBounds([]);
      
      // Add container locations to bounds
      containers.forEach(container => {
        bounds.extend([container.coordinates.lat, container.coordinates.lng]);
      });
      
      // Add route endpoints to bounds
      routes.forEach(route => {
        bounds.extend([route.origin.lat, route.origin.lng]);
        bounds.extend([route.destination.lat, route.destination.lng]);
      });
      
      // Only fit bounds if we have points
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [containers, routes, map]);
  
  return null;
}

// Component to track zoom level changes
function ZoomLevelTracker({ onZoomChange }: { onZoomChange: (zoom: number) => void }) {
  const map = useMap();
  
  useEffect(() => {
    const handleZoomEnd = () => {
      onZoomChange(map.getZoom());
    };
    
    map.on('zoomend', handleZoomEnd);
    
    // Initial zoom level
    onZoomChange(map.getZoom());
    
    return () => {
      map.off('zoomend', handleZoomEnd);
    };
  }, [map, onZoomChange]);
  
  return null;
}

// Main WorldMap component
export default function WorldMap({
  containers, 
  routes, 
  isLoading,
  height = '500px'
}: SriLankaMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(8);
  const [clusteredContainers, setClusteredContainers] = useState<ContainerMarker[]>([]);
  
  // Get color based on risk level
  const getRouteColor = (risk: 'low' | 'medium' | 'high' | null): string => {
    switch (risk) {
      case 'low': return '#4ade80'; // green-400
      case 'medium': return '#fb923c'; // orange-400
      case 'high': return '#f87171'; // red-400
      default: return '#60a5fa'; // blue-400
    }
  };
  
  // Get status color for container metrics
  const getStatusColor = (value: number, type: 'temperature' | 'humidity' | 'battery'): string => {
    if (type === 'temperature') {
      return value < 2 || value > 8 ? 'text-red-600' : 'text-green-600';
    } else if (type === 'humidity') {
      return value < 30 || value > 70 ? 'text-red-600' : 'text-green-600';
    } else { // battery
      return value < 20 ? 'text-red-600' : value < 50 ? 'text-yellow-600' : 'text-green-600';
    }
  };

  // Apply clustering based on zoom level and container count
  useEffect(() => {
    if (containers.length > 0) {
      if (shouldApplyClustering(containers.length, zoomLevel)) {
        setClusteredContainers(clusterContainerMarkers(containers));
      } else {
        setClusteredContainers(containers);
      }
    } else {
      setClusteredContainers([]);
    }
  }, [containers, zoomLevel]);

  // Create a custom cluster icon
  const createClusterIcon = (clusterSize: number) => {
    return L.divIcon({
      className: 'custom-cluster-icon',
      html: `<div class="bg-indigo-500 text-white rounded-full flex items-center justify-center font-bold" style="width: 36px; height: 36px; border: 2px solid white;">${clusterSize}</div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });
  };
  
  return (
    <div className="relative rounded-lg overflow-hidden shadow-lg" style={{ height }}>
      {isLoading ? (
        <div className="h-full w-full flex items-center justify-center bg-gray-100">
          <div className="text-gray-500 flex flex-col items-center">
            <svg className="animate-spin h-8 w-8 text-indigo-500 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p>Loading map data...</p>
          </div>
        </div>
      ) : (
        <MapContainer
          center={[WORLD_CENTER.lat, WORLD_CENTER.lng]}
          zoom={2}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Container Markers */}
          {clusteredContainers.map(container => (
            <Marker
              key={`container-${container.id}`}
              position={[container.coordinates.lat, container.coordinates.lng]}
              icon={container.isCluster && container.clusterSize
                ? createClusterIcon(container.clusterSize)
                : createStatusIcon(container.status)}
            >
              <Popup>
                {container.isCluster && container.containers ? (
                  <div className="p-2 min-w-[250px]">
                    <h3 className="font-bold text-lg">Container Cluster</h3>
                    <p className="text-sm text-gray-600 mb-2">{container.clusterSize} containers in this area</p>
                    
                    <div className="max-h-[200px] overflow-y-auto mt-2">
                      {container.containers.map(c => (
                        <div key={c.id} className="border-t border-gray-200 pt-2 mt-2">
                          <h4 className="font-medium">{c.name}</h4>
                          <p className="text-xs text-gray-600">{c.location}</p>
                          <div className="flex justify-between text-xs mt-1">
                            <span>Status:</span>
                            <span className={`${
                              c.status === 'active' ? 'text-green-600' :
                              c.status === 'warning' ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-2 min-w-[200px]">
                    <h3 className="font-bold text-lg">{container.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{container.location}</p>
                    <div className="space-y-1">
                      <p className="flex justify-between">
                        <span>Status:</span>
                        <span className={`font-medium ${
                          container.status === 'active' ? 'text-green-600' :
                          container.status === 'warning' ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {container.status.charAt(0).toUpperCase() + container.status.slice(1)}
                        </span>
                      </p>
                      {container.temperature !== undefined && (
                        <p className="flex justify-between">
                          <span>Temperature:</span>
                          <span className={`font-medium ${getStatusColor(container.temperature, 'temperature')}`}>
                            {container.temperature}°C
                          </span>
                        </p>
                      )}
                      {container.humidity !== undefined && (
                        <p className="flex justify-between">
                          <span>Humidity:</span>
                          <span className={`font-medium ${getStatusColor(container.humidity, 'humidity')}`}>
                            {container.humidity}%
                          </span>
                        </p>
                      )}
                      {container.battery_level !== undefined && (
                        <p className="flex justify-between">
                          <span>Battery:</span>
                          <span className={`font-medium ${getStatusColor(container.battery_level, 'battery')}`}>
                            {container.battery_level}%
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </Popup>
            </Marker>
          ))}
          
          {/* Route Lines */}
          {routes.map(route => (
            <Polyline
              key={`route-${route.id}`}
              positions={[
                [route.origin.lat, route.origin.lng],
                [route.destination.lat, route.destination.lng]
              ]}
              pathOptions={{
                color: getRouteColor(route.risk_level),
                weight: 3,
                opacity: 0.7,
                dashArray: route.risk_level === 'high' ? '5, 10' : undefined
              }}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <h3 className="font-bold text-lg">{route.name}</h3>
                  <div className="space-y-1 mt-2">
                    <p className="flex justify-between">
                      <span>Total Shipments:</span>
                      <span className="font-medium">{route.total_shipments}</span>
                    </p>
                    <p className="flex justify-between">
                      <span>Delayed:</span>
                      <span className="font-medium">{route.delayed_shipments}</span>
                    </p>
                    <p className="flex justify-between">
                      <span>Delay Rate:</span>
                      <span className="font-medium">
                        {route.total_shipments > 0 
                          ? `${Math.round((route.delayed_shipments / route.total_shipments) * 100)}%` 
                          : '0%'}
                      </span>
                    </p>
                    <p className="flex justify-between">
                      <span>Risk Level:</span>
                      <span className={`font-medium ${
                        route.risk_level === 'low' ? 'text-green-600' : 
                        route.risk_level === 'medium' ? 'text-yellow-600' : 
                        route.risk_level === 'high' ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {route.risk_level 
                          ? route.risk_level.charAt(0).toUpperCase() + route.risk_level.slice(1) 
                          : 'Unknown'}
                      </span>
                    </p>
                  </div>
                </div>
              </Popup>
            </Polyline>
          ))}
          
          {/* Map updater to fit bounds */}
          <MapUpdater containers={clusteredContainers} routes={routes} />
          
          {/* Zoom level tracker */}
          <ZoomLevelTracker onZoomChange={setZoomLevel} />
        </MapContainer>
      )}
    </div>
  );
}