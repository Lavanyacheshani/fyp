import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowPathIcon, MapIcon, TruckIcon, ExclamationTriangleIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b border-green-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
                Dashboard Overview
              </h1>
              <p className="mt-2 text-gray-600">Monitor your transportation operations and container status</p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-all duration-200"
            >
              <ArrowPathIcon className={`h-5 w-5 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error ? (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        ) : null}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Containers need to transit */}
          <Link 
            to="/assigned-containers" 
            className="group bg-white rounded-xl shadow-sm border border-green-100 hover:shadow-lg hover:border-green-200 transition-all duration-200 transform hover:-translate-y-1"
          >
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                        <TruckIcon className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Containers to Transit</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.assignedJobs}</p>
                    </div>
                  </div>
                </div>
                <div className="text-green-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-green-600">
                <CheckCircleIcon className="h-4 w-4 mr-1" />
                <span>Click to view details</span>
              </div>
            </div>
          </Link>

          {/* In Transit */}
          <div className="bg-white rounded-xl shadow-sm border border-green-100 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <ClockIcon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Transit</p>
                <p className="text-2xl font-bold text-gray-900">{stats.inTransit}</p>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-500">
              Currently being transported
            </div>
          </div>

          {/* Completed */}
          <div className="bg-white rounded-xl shadow-sm border border-green-100 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed Today</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-500">
              Successfully delivered
            </div>
          </div>

          {/* Active Alerts */}
          <div className="bg-white rounded-xl shadow-sm border border-green-100 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Alerts</p>
                <p className="text-2xl font-bold text-gray-900">{stats.alerts}</p>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-500">
              Require immediate attention
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-green-100 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/containers"
              className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors group"
            >
              <div className="w-10 h-10 bg-green-200 rounded-lg flex items-center justify-center mr-3 group-hover:bg-green-300 transition-colors">
                <TruckIcon className="h-5 w-5 text-green-700" />
              </div>
              <div>
                <p className="font-medium text-gray-900">View Containers</p>
                <p className="text-sm text-gray-600">Manage container assignments</p>
              </div>
            </Link>

            <Link
              to="/vehicles/register"
              className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors group"
            >
              <div className="w-10 h-10 bg-blue-200 rounded-lg flex items-center justify-center mr-3 group-hover:bg-blue-300 transition-colors">
                <svg className="h-5 w-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Register Vehicle</p>
                <p className="text-sm text-gray-600">Add new transport vehicle</p>
              </div>
            </Link>

            <Link
              to="/profile"
              className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors group"
            >
              <div className="w-10 h-10 bg-purple-200 rounded-lg flex items-center justify-center mr-3 group-hover:bg-purple-300 transition-colors">
                <svg className="h-5 w-5 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Profile Settings</p>
                <p className="text-sm text-gray-600">Update your information</p>
              </div>
            </Link>

            <Link
              to="/help"
              className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
            >
              <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center mr-3 group-hover:bg-gray-300 transition-colors">
                <svg className="h-5 w-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Help & Support</p>
                <p className="text-sm text-gray-600">Get assistance</p>
              </div>
            </Link>
          </div>
        </div>

        {/* World Map Section */}
        <div className="bg-white rounded-xl shadow-sm border border-green-100 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-white border-b border-green-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <MapIcon className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Global Container Tracking</h2>
                  <p className="text-sm text-gray-600">Real-time locations and route analytics</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span>Active</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                  <span>Warning</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                  <span>Inactive</span>
                </div>
              </div>
            </div>
          </div>
          <div className="p-6">
            <WorldMap
              containers={containers}
              routes={routes}
              isLoading={isMapLoading}
              height="600px"
            />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-green-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            <div className="flex items-center p-4 bg-green-50 rounded-lg">
              <div className="w-8 h-8 bg-green-200 rounded-full flex items-center justify-center mr-3">
                <CheckCircleIcon className="h-4 w-4 text-green-700" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Container delivery completed</p>
                <p className="text-xs text-gray-600">2 minutes ago</p>
              </div>
            </div>
            <div className="flex items-center p-4 bg-blue-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center mr-3">
                <TruckIcon className="h-4 w-4 text-blue-700" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">New container assigned</p>
                <p className="text-xs text-gray-600">15 minutes ago</p>
              </div>
            </div>
            <div className="flex items-center p-4 bg-yellow-50 rounded-lg">
              <div className="w-8 h-8 bg-yellow-200 rounded-full flex items-center justify-center mr-3">
                <ExclamationTriangleIcon className="h-4 w-4 text-yellow-700" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Temperature alert resolved</p>
                <p className="text-xs text-gray-600">1 hour ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
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