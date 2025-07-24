/**
 * Map optimization utilities for improving performance with large datasets
 */

import type { ContainerMarker, RouteData } from '../components/SriLankaMap';
import type { Coordinates } from './geocoding';

// Distance threshold for clustering in kilometers
const CLUSTER_DISTANCE_THRESHOLD = 5;

// Earth radius in kilometers
const EARTH_RADIUS = 6371;

/**
 * Calculates the distance between two points using the Haversine formula
 */
export function calculateDistance(point1: Coordinates, point2: Coordinates): number {
  const dLat = toRadians(point2.lat - point1.lat);
  const dLon = toRadians(point2.lng - point1.lng);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.lat)) * Math.cos(toRadians(point2.lat)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS * c;
}

/**
 * Converts degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * Math.PI / 180;
}

/**
 * Clusters container markers that are close to each other
 * Returns a new array with clustered markers
 */
export function clusterContainerMarkers(
  containers: ContainerMarker[],
  distanceThreshold: number = CLUSTER_DISTANCE_THRESHOLD
): ContainerMarker[] {
  if (containers.length <= 1) {
    return containers;
  }
  
  // Clone the containers array to avoid modifying the original
  const remainingContainers = [...containers];
  const clusters: ContainerMarker[] = [];
  
  while (remainingContainers.length > 0) {
    const current = remainingContainers.shift()!;
    const cluster: ContainerMarker[] = [current];
    
    // Find all containers within the distance threshold
    for (let i = remainingContainers.length - 1; i >= 0; i--) {
      const container = remainingContainers[i];
      const distance = calculateDistance(
        current.coordinates,
        container.coordinates
      );
      
      if (distance <= distanceThreshold) {
        cluster.push(container);
        remainingContainers.splice(i, 1);
      }
    }
    
    if (cluster.length === 1) {
      // No clustering needed, add the original container
      clusters.push(current);
    } else {
      // Create a cluster marker
      clusters.push(createClusterMarker(cluster));
    }
  }
  
  return clusters;
}

/**
 * Creates a cluster marker from a group of container markers
 */
function createClusterMarker(containers: ContainerMarker[]): ContainerMarker {
  // Calculate the average coordinates
  const sumLat = containers.reduce((sum, c) => sum + c.coordinates.lat, 0);
  const sumLng = containers.reduce((sum, c) => sum + c.coordinates.lng, 0);
  const avgLat = sumLat / containers.length;
  const avgLng = sumLng / containers.length;
  
  // Determine the cluster status based on the most critical container
  const hasWarning = containers.some(c => c.status === 'warning');
  const hasInactive = containers.some(c => c.status === 'inactive');
  const status = hasWarning ? 'warning' : (hasInactive ? 'inactive' : 'active');
  
  // Create a cluster marker
  return {
    id: -containers[0].id, // Negative ID to indicate a cluster
    name: `Cluster (${containers.length} containers)`,
    location: `${containers.length} containers in this area`,
    coordinates: { lat: avgLat, lng: avgLng },
    status,
    isCluster: true,
    clusterSize: containers.length,
    containers: containers // Store the original containers for popup display
  } as ContainerMarker;
}

/**
 * Optimizes routes by removing overlapping or redundant routes
 */
export function optimizeRoutes(routes: RouteData[]): RouteData[] {
  // For now, just return the original routes
  // In a real implementation, you might want to filter out redundant routes
  // or combine routes that follow similar paths
  return routes;
}

/**
 * Determines if clustering should be applied based on the number of containers
 * and the current map zoom level
 */
export function shouldApplyClustering(
  containerCount: number,
  zoomLevel: number
): boolean {
  // Apply clustering if there are many containers and the zoom level is low
  if (zoomLevel < 8 && containerCount > 10) {
    return true;
  }
  
  if (zoomLevel < 10 && containerCount > 20) {
    return true;
  }
  
  if (zoomLevel < 12 && containerCount > 50) {
    return true;
  }
  
  return false;
}