/**
 * Utility script to seed the route_analytics table with sample data
 * This can be used for testing the dashboard map functionality
 */

import { supabase } from '../lib/supabase';
import { toPostgresPoint } from './geocoding';

// Sample Sri Lanka locations with coordinates
const sriLankaLocations = [
  { name: 'Colombo', lat: 6.9271, lng: 79.8612 },
  { name: 'Kandy', lat: 7.2906, lng: 80.6337 },
  { name: 'Galle', lat: 6.0535, lng: 80.2210 },
  { name: 'Jaffna', lat: 9.6615, lng: 80.0255 },
  { name: 'Trincomalee', lat: 8.5874, lng: 81.2152 },
  { name: 'Batticaloa', lat: 7.7170, lng: 81.7000 },
  { name: 'Negombo', lat: 7.2081, lng: 79.8352 },
  { name: 'Anuradhapura', lat: 8.3114, lng: 80.4037 },
  { name: 'Matara', lat: 5.9485, lng: 80.5353 },
  { name: 'Kurunegala', lat: 7.4867, lng: 80.3647 }
];

// Generate sample routes between locations
const generateRoutes = () => {
  const routes = [];
  
  // Create routes between major cities
  for (let i = 0; i < sriLankaLocations.length; i++) {
    for (let j = i + 1; j < sriLankaLocations.length; j++) {
      const origin = sriLankaLocations[i];
      const destination = sriLankaLocations[j];
      
      // Calculate a risk level based on distance
      const distance = calculateDistance(origin.lat, origin.lng, destination.lat, destination.lng);
      let riskLevel: 'low' | 'medium' | 'high';
      
      if (distance < 100) {
        riskLevel = 'low';
      } else if (distance < 200) {
        riskLevel = 'medium';
      } else {
        riskLevel = 'high';
      }
      
      // Generate random shipment stats
      const totalShipments = Math.floor(Math.random() * 100) + 10;
      const delayedShipments = Math.floor(Math.random() * (totalShipments / 3));
      
      // Calculate average transit time (in hours)
      const avgTransitHours = Math.floor(distance / 40 * 60); // Assuming 40km/h average speed
      
      routes.push({
        route_name: `${origin.name} to ${destination.name}`,
        origin: toPostgresPoint({ lat: origin.lat, lng: origin.lng }),
        destination: toPostgresPoint({ lat: destination.lat, lng: destination.lng }),
        total_shipments: totalShipments,
        delayed_shipments: delayedShipments,
        avg_transit_time: `${Math.floor(avgTransitHours / 60)}:${avgTransitHours % 60}:00`, // Format as HH:MM:SS
        risk_level: riskLevel
      });
    }
  }
  
  return routes;
};

// Calculate distance between two points using Haversine formula
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const distance = R * c; // Distance in km
  return distance;
};

const deg2rad = (deg: number): number => {
  return deg * (Math.PI/180);
};

/**
 * Seeds the route_analytics table with sample data
 * @returns Promise that resolves when seeding is complete
 */
export const seedRouteAnalyticsData = async (): Promise<void> => {
  try {
    const routes = generateRoutes();
    
    // Insert routes in batches to avoid hitting API limits
    const batchSize = 10;
    for (let i = 0; i < routes.length; i += batchSize) {
      const batch = routes.slice(i, i + batchSize);
      const { error } = await supabase.from('route_analytics').insert(batch);
      
      if (error) {
        console.error('Error inserting route data:', error);
        throw error;
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`Successfully seeded ${routes.length} routes into route_analytics table`);
  } catch (error) {
    console.error('Failed to seed route data:', error);
    throw error;
  }
};

/**
 * Clears all data from the route_analytics table
 * @returns Promise that resolves when clearing is complete
 */
export const clearRouteAnalyticsData = async (): Promise<void> => {
  try {
    const { error } = await supabase.from('route_analytics').delete().neq('id', 0);
    
    if (error) {
      console.error('Error clearing route data:', error);
      throw error;
    }
    
    console.log('Successfully cleared route_analytics table');
  } catch (error) {
    console.error('Failed to clear route data:', error);
    throw error;
  }
};