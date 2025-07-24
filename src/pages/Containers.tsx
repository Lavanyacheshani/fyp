import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';
import { ArrowPathIcon, BellIcon, ExclamationCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

type Container = Database['public']['Tables']['containers']['Row'];
type Vehicle = Database['public']['Tables']['vehicles']['Row'];

// Define threshold values for notifications
const THRESHOLDS = {
    temperature: { low: 2, high: 8 }, // °C
    humidity: { low: 30, high: 70 }, // %
    battery: { low: 20, high: 80 }, // %
};

const getStatusColor = (value: number, type: 'temperature' | 'humidity' | 'battery'): string => {
    const threshold = THRESHOLDS[type];
    if (value < threshold.low) return 'text-blue-600 bg-blue-100';
    if (value > threshold.high) return 'text-red-600 bg-red-100';
    return 'text-green-600 bg-green-100';
};

const getStatusMessage = (container: Container) => {
    const messages: string[] = [];
    
    if (container.temperature < THRESHOLDS.temperature.low) {
        messages.push(`Temperature too low: ${container.temperature}°C`);
    } else if (container.temperature > THRESHOLDS.temperature.high) {
        messages.push(`Temperature too high: ${container.temperature}°C`);
    }
    
    if (container.humidity < THRESHOLDS.humidity.low) {
        messages.push(`Humidity too low: ${container.humidity}%`);
    } else if (container.humidity > THRESHOLDS.humidity.high) {
        messages.push(`Humidity too high: ${container.humidity}%`);
    }
    
    if (container.battery_level < THRESHOLDS.battery.low) {
        messages.push(`Battery low: ${container.battery_level}%`);
    }
    
    return messages;
};

import DashboardLayout from '../components/DashboardLayout';

const Containers = () => {
    const [availableContainers, setAvailableContainers] = useState<Container[]>([]);
    const [unassignedContainers, setUnassignedContainers] = useState<Container[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
    const [selectedContainerForAssignment, setSelectedContainerForAssignment] = useState<Container | null>(null);
    const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);

    const fetchContainers = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Fetch assigned containers
            const { data: assigned, error: assignedError } = await supabase
                .from('containers')
                .select('*')
                .not('assigned_to', 'is', null)
                .order('created_at', { ascending: false });

            if (assignedError) throw assignedError;
            setAvailableContainers(assigned || []);

            // Fetch unassigned containers
            const { data: unassigned, error: unassignedError } = await supabase
                .from('containers')
                .select('*')
                .is('assigned_to', null)
                .order('created_at', { ascending: false });

            if (unassignedError) throw unassignedError;
            setUnassignedContainers(unassigned || []);
            setError(null);
        } catch (err: any) {
            setError(err.message);
            console.error('Fetch error:', err);
            toast.error('Failed to fetch containers');
        }
    }, []);

    const fetchVehicles = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('id')
                .eq('email', user.email)
                .single();

            if (userError || !userData) throw new Error('Failed to get user data');

            const { data, error } = await supabase
                .from('vehicles')
                .select('*')
                .eq('transporter_id', userData.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setVehicles(data || []);
        } catch (err: any) {
            console.error('Error fetching vehicles:', err);
            toast.error('Failed to fetch vehicles');
        }
    }, []);

    const openVehicleSelectionModal = (container: Container) => {
        setSelectedContainerForAssignment(container);
        setIsVehicleModalOpen(true);
    };
    
    const handleConfirmAssignment = async () => {
        if (!selectedContainerForAssignment || !selectedVehicleId) {
            toast.error('Please select a container and a vehicle.');
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // First get the user's ID from the users table
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('id')
                .eq('email', user.email)
                .single();

            if (userError || !userData) throw new Error('Failed to get user data');

            // Update the container with the user's ID from the users table and selected vehicle_id
            const { error } = await supabase
                .from('containers')
                .update({ assigned_to: userData.id, vehicle_id: selectedVehicleId })
                .eq('id', selectedContainerForAssignment.id);

            if (error) throw error;

            toast.success(`Container ${selectedContainerForAssignment.name} assigned to you and vehicle.`);
            await fetchContainers(); // Refresh container lists
            setIsVehicleModalOpen(false); // Close modal
            setSelectedContainerForAssignment(null);
            setSelectedVehicleId(null);
        } catch (err: any) {
            console.error('Assignment error:', err);
            toast.error('Failed to assign container');
        }
    };

    const handleCompleteOrder = async (container: Container) => {
        try {
            const { error } = await supabase
                .from('containers')
                .update({ 
                    assigned_to: null,
                    vehicle_id: null,
                    status: 'inactive'  // Optionally update status to inactive
                })
                .eq('id', container.id);

            if (error) throw error;

            toast.success(`Container ${container.name} order completed successfully.`);
            await fetchContainers(); // Refresh container lists
        } catch (err: any) {
            console.error('Complete order error:', err);
            toast.error('Failed to complete container order');
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await Promise.all([fetchContainers(), fetchVehicles()]);
        setIsRefreshing(false);
        toast.success('Containers updated');
    };

    useEffect(() => {
        setIsLoading(true);
        Promise.all([fetchContainers(), fetchVehicles()])
            .finally(() => setIsLoading(false));
    }, [fetchContainers, fetchVehicles]);

    const hasNotifications = (container: Container): boolean => {
        return getStatusMessage(container).length > 0;
    };

    if (isLoading) return (
        <DashboardLayout>
            <div className="flex flex-col items-center justify-center h-full">
                <div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full"></div>
                <p className="mt-4 text-gray-600">Loading containers...</p>
            </div>
        </DashboardLayout>
    );
    
    if (error) return (
        <DashboardLayout>
            <div className="flex items-center justify-center h-full">
                <div className="bg-white p-8 rounded-xl shadow-lg border border-red-100">
                    <div className="bg-red-100 p-3 rounded-full w-fit mx-auto">
                        <ExclamationCircleIcon className="h-8 w-8 text-red-600" />
                    </div>
                    <p className="mt-4 text-red-600 text-center font-medium">{error}</p>
                </div>
            </div>
        </DashboardLayout>
    );

    const unassignedContainersWithAlerts = unassignedContainers.filter(hasNotifications);

    return (
        <DashboardLayout>
            <div className="p-6 space-y-10">
            {/* Notifications Section */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-red-100 p-2 rounded-lg">
                        <BellIcon className="h-6 w-6 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                        Unassigned Container Alerts ({unassignedContainersWithAlerts.length})
                    </h2>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {unassignedContainersWithAlerts.length === 0 ? (
                        <div className="col-span-full text-center py-8">
                            <div className="inline-block p-3 bg-green-50 rounded-full mb-3">
                                <CheckCircleIcon className="h-8 w-8 text-green-500" />
                            </div>
                            <p className="text-gray-500 text-lg">All containers are operating normally</p>
                        </div>
                    ) : (
                        unassignedContainersWithAlerts.map((container) => (
                            <div 
                                key={`notification-${container.id}`} 
                                className="bg-gradient-to-br from-red-50 to-white rounded-xl shadow-md p-6 border border-red-100 transform transition-all duration-200 hover:scale-102 hover:shadow-lg"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="bg-red-100 p-2 rounded-lg">
                                        <ExclamationCircleIcon className="h-5 w-5 text-red-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-lg text-gray-800">{container.name}</h3>
                                        <div className="space-y-2 mt-3">
                                            {getStatusMessage(container).map((message, index) => (
                                                <div 
                                                    key={index} 
                                                    className={`text-sm rounded-lg px-3 py-2 inline-block mr-2 mb-2 shadow-sm ${
                                                        message.includes('Temperature') ? getStatusColor(container.temperature, 'temperature') :
                                                        message.includes('Humidity') ? getStatusColor(container.humidity, 'humidity') :
                                                        getStatusColor(container.battery_level, 'battery')
                                                    }`}
                                                >
                                                    {message}
                                                </div>
                                            ))}
                                        </div>
                                        <button
                                            onClick={() => openVehicleSelectionModal(container)}
                                            className="mt-4 w-full px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-green-700 rounded-lg hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transform transition-all duration-200 hover:scale-105"
                                        >
                                            Take Container
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* All Assigned Containers Section */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold">All Assigned Containers</h1>
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ArrowPathIcon 
                            className={`h-5 w-5 mr-2 ${isRefreshing ? 'animate-spin' : ''}`}
                        />
                        Refresh
                    </button>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {availableContainers.length === 0 ? (
                        <p className="text-gray-500">No containers available</p>
                    ) : (
                        availableContainers.map((container) => (
                            <div 
                                key={container.id} 
                                className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-all"
                            >
                                <div className="flex justify-between items-start">
                                    <h3 className="font-semibold text-lg mb-2">{container.name}</h3>
                                    {hasNotifications(container) && (
                                        <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
                                    )}
                                </div>
                                <div className="space-y-2 text-sm text-gray-600">
                                    <p>Status: <span className={`capitalize ${
                                        container.status === 'warning' ? 'text-yellow-600' :
                                        container.status === 'active' ? 'text-green-600' : 'text-red-600'
                                    }`}>{container.status}</span></p>
                                    <p>Location: {container.location}</p>
                                    <p>Temperature: <span className={`${getStatusColor(container.temperature, 'temperature')} px-2 py-1 rounded-md`}>
                                        {container.temperature}°C
                                    </span></p>
                                    <p>Humidity: <span className={`${getStatusColor(container.humidity, 'humidity')} px-2 py-1 rounded-md`}>
                                        {container.humidity}%
                                    </span></p>
                                    <p>Battery: <span className={`${getStatusColor(container.battery_level, 'battery')} px-2 py-1 rounded-md`}>
                                        {container.battery_level}%
                                    </span></p>
                                    <p>Last Updated: {new Date(container.last_updated).toLocaleString()}</p>
                                    <button
                                        onClick={() => handleCompleteOrder(container)}
                                        className="mt-4 w-full px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                                    >
                                        Complete Order
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Vehicle Selection Modal */}
            {isVehicleModalOpen && selectedContainerForAssignment && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md border border-gray-100">
                        <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                            Assign Container: {selectedContainerForAssignment.name}
                        </h3>
                        
                        {vehicles.length === 0 ? (
                            <div className="text-center py-6">
                                <div className="inline-block p-3 bg-gray-50 rounded-full mb-3">
                                    <ExclamationCircleIcon className="h-8 w-8 text-gray-400" />
                                </div>
                                <p className="text-gray-600">No active vehicles found for assignment.</p>
                            </div>
                        ) : (
                            <div className="mb-6">
                                <label htmlFor="vehicle-select" className="block text-sm font-medium text-gray-700 mb-2">
                                    Select a Vehicle:
                                </label>
                                <select
                                    id="vehicle-select"
                                    value={selectedVehicleId || ''}
                                    onChange={(e) => setSelectedVehicleId(Number(e.target.value))}
                                    className="mt-1 block w-full pl-4 pr-10 py-3 text-base border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-lg bg-gray-50"
                                >
                                    <option value="" disabled>-- Choose a vehicle --</option>
                                    {vehicles.map((vehicle) => (
                                        <option key={vehicle.id} value={vehicle.id}>
                                            {vehicle.plate_number} ({vehicle.model}) - Capacity: {vehicle.capacity}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsVehicleModalOpen(false);
                                    setSelectedContainerForAssignment(null);
                                    setSelectedVehicleId(null);
                                }}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transform transition-all duration-200 hover:scale-105"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmAssignment}
                                disabled={!selectedVehicleId || vehicles.length === 0}
                                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-green-700 rounded-lg shadow-sm hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-200 hover:scale-105"
                            >
                                Confirm Assignment
                            </button>
                        </div>
                    </div>
                </div>
            )}
            </div>
        </DashboardLayout>
    );
};

export default Containers;