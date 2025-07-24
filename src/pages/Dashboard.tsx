import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowPathIcon, MapIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import WorldMap from '../components/WorldMap';
import type { ContainerMarker, RouteData } from '../components/WorldMap';
import { geocodeLocation, parsePostgresPoint } from '../utils/geocoding';

interface DashboardStats {
  assignedJobs: number;
  inTransit: number;
  completed: number;
  alerts: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    assignedJobs: 0,
    inTransit: 0,
    completed: 0,
    alerts: 0
  });
  const [containers, setContainers] = useState<ContainerMarker[]>([]);
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardStats = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get user's ID from users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', user.email)
        .single();

      if (userError) throw userError;

      // Fetch all stats in parallel
      const [assignedJobsData, alertsData] = await Promise.all([
        supabase // This now fetches from 'containers' table for any assigned user
          .from('containers')
          .select('id', { count: 'exact', head: true })
          .not('assigned_to', 'is', null),

        supabase
          .from('containers')
          .select('id', { count: 'exact', head: true })
          .eq('assigned_to', userData.id) // Use ID from public.users table
          .eq('status', 'warning')
      ]);

      setStats({
        assignedJobs: assignedJobsData.count || 0,
        inTransit: 0,
        completed: 0,
        alerts: alertsData.count || 0
      });
      setError(null);
    } catch (err: any) {
      console.error('Error fetching stats:', err);
      setError(err.message);
      toast.error('Failed to fetch dashboard stats');
    }
  }, []);

  const fetchMapData = useCallback(async () => {
    setIsMapLoading(true);
    try {
      // Fetch containers
      const { data: containersData, error: containersError } = await supabase
        .from('containers')
        .select('id, name, location, status, temperature, humidity, battery_level');
      
      if (containersError) throw containersError;

      // Fetch routes
      const { data: routesData, error: routesError } = await supabase
        .from('route_analytics')
        .select('id, route_name, origin, destination, total_shipments, delayed_shipments, risk_level');
      
      if (routesError) throw routesError;

      // Process containers data - geocode locations
      const containersWithCoordinates = await Promise.all(
        (containersData || []).map(async (container) => {
          const coordinates = await geocodeLocation(container.location);
          return {
            id: container.id,
            name: container.name,
            location: container.location,
            coordinates,
            status: container.status,
            temperature: container.temperature,
            humidity: container.humidity,
            battery_level: container.battery_level
          };
        })
      );

      // Process routes data - parse PostgreSQL points
      const processedRoutes = (routesData || []).map(route => ({
        id: route.id,
        name: route.route_name,
        origin: parsePostgresPoint(route.origin),
        destination: parsePostgresPoint(route.destination),
        risk_level: route.risk_level,
        total_shipments: route.total_shipments,
        delayed_shipments: route.delayed_shipments
      }));

      setContainers(containersWithCoordinates);
      setRoutes(processedRoutes);
    } catch (err: any) {
      console.error('Error fetching map data:', err);
      toast.error('Failed to fetch map data');
    } finally {
      setIsMapLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchDashboardStats(), fetchMapData()])
      .finally(() => setIsLoading(false));
  }, [fetchDashboardStats, fetchMapData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchDashboardStats(), fetchMapData()]);
    setIsRefreshing(false);
    toast.success('Dashboard updated');
  };

  if (isLoading) return <div className="p-4">Loading...</div>;

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-5 w-5 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {error ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-4">
          <div className="bg-red-50 text-red-600 p-4 rounded-md">{error}</div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="py-4">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {/* Containers need to transit */}
              <Link to="/assigned-containers" className="bg-white overflow-hidden shadow rounded-lg hover:bg-gray-50 transition-colors">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Containers need to transit</dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">{stats.assignedJobs}</div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </Link>



              {/* Alerts */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Active Alerts</dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">{stats.alerts}</div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* World Map */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-6">
        <div className="bg-white shadow rounded-lg p-4">
          <div className="flex items-center mb-4">
            <MapIcon className="h-6 w-6 text-indigo-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Container Locations & Routes</h2>
          </div>
          <WorldMap
            containers={containers}
            routes={routes}
            isLoading={isMapLoading}
            height="600px"
          />
        </div>
      </div>
    </div>
  );
}