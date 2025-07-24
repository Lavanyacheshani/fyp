import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

type VehicleStatus = 'active' | 'maintenance' | 'inactive';

type Vehicle = {
    id: number;
    plate_number: string;
    model: string;
    capacity: number;
    transporter_id: string;
    status: VehicleStatus;
    created_at: string;
};

type VehicleInsert = Omit<Vehicle, 'id' | 'created_at'> & {
    transporter_id: string;
};

const Vehicles = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [showRegisterForm, setShowRegisterForm] = useState(false);
    const [plateNumber, setPlateNumber] = useState('');
    const [model, setModel] = useState('');
    const [capacity, setCapacity] = useState('');
    const [status, setStatus] = useState<VehicleStatus>('active');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchVehicles();
    }, []);

    const fetchVehicles = async () => {
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
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!plateNumber.trim()) {
            toast.error('Plate number is required.');
            return;
        }
        if (!model.trim()) {
            toast.error('Model is required.');
            return;
        }
        if (!capacity) {
            toast.error('Capacity is required.');
            return;
        }

        setIsSubmitting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('id')
                .eq('email', user.email)
                .single();

            if (userError || !userData) throw new Error('Failed to get user data');

            const vehicleData: VehicleInsert = {
                plate_number: plateNumber.trim(),
                model: model.trim(),
                capacity: parseFloat(capacity),
                transporter_id: userData.id,
                status
            };

            const { error } = await supabase.from('vehicles').insert(vehicleData);
            if (error) throw error;
            
            toast.success('Vehicle registered successfully!');
            setPlateNumber('');
            setModel('');
            setCapacity('');
            setStatus('active');
            setShowRegisterForm(false);
            fetchVehicles(); // Refresh the list
        } catch (err: any) {
            console.error('Error registering vehicle:', err);
            toast.error(err.message || 'Failed to register vehicle.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusColor = (status: VehicleStatus) => {
        switch (status) {
            case 'active': return 'text-green-600';
            case 'maintenance': return 'text-yellow-600';
            case 'inactive': return 'text-red-600';
            default: return 'text-gray-600';
        }
    };

    if (isLoading) {
        return <div className="p-4">Loading...</div>;
    }

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Vehicles</h1>
                <button
                    onClick={() => setShowRegisterForm(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    Register New Vehicle
                </button>
            </div>

            {showRegisterForm ? (
                <div className="mb-8">
                    <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold">Register New Vehicle</h2>
                            <button 
                                onClick={() => setShowRegisterForm(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="plateNumber" className="block text-sm font-medium text-gray-700">
                                    Plate Number <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="plateNumber"
                                    value={plateNumber}
                                    onChange={(e) => setPlateNumber(e.target.value)}
                                    required
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                            </div>

                            <div>
                                <label htmlFor="model" className="block text-sm font-medium text-gray-700">
                                    Model <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="model"
                                    value={model}
                                    onChange={(e) => setModel(e.target.value)}
                                    required
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                            </div>

                            <div>
                                <label htmlFor="capacity" className="block text-sm font-medium text-gray-700">
                                    Capacity (tons) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    id="capacity"
                                    value={capacity}
                                    onChange={(e) => setCapacity(e.target.value)}
                                    step="0.01"
                                    required
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                            </div>

                            <div>
                                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                                    Status <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="status"
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value as VehicleStatus)}
                                    required
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="maintenance">Maintenance</option>
                                </select>
                            </div>

                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setShowRegisterForm(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Registering...' : 'Register Vehicle'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}

            {vehicles.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-gray-500">No vehicles registered yet.</p>
                </div>
            ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <ul className="divide-y divide-gray-200">
                        {vehicles.map((vehicle) => (
                            <li key={vehicle.id} className="px-6 py-4 hover:bg-gray-50">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900">
                                            {vehicle.plate_number}
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            Model: {vehicle.model}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            Capacity: {vehicle.capacity} tons
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(vehicle.status)}`}>
                                            {vehicle.status}
                                        </span>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default Vehicles;