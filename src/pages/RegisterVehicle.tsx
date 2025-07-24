import { useState } from 'react';
import { supabase } from '../lib/supabase';
import DashboardLayout from '../components/DashboardLayout';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

type VehicleFormData = {
    plate_number: string;
    model: string;
    capacity: number;
    status: 'active' | 'inactive';
};

const RegisterVehicle = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<VehicleFormData>({
        plate_number: '',
        model: '',
        capacity: 0,
        status: 'active'
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Get user's ID from the users table
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('id')
                .eq('email', user.email)
                .single();

            if (userError || !userData) throw new Error('Failed to get user data');

            // Insert the vehicle with the user's ID as transporter_id
            const { error } = await supabase
                .from('vehicles')
                .insert([
                    {
                        ...formData,
                        transporter_id: userData.id,
                    }
                ]);

            if (error) throw error;

            toast.success('Vehicle registered successfully');
            navigate('/vehicles'); // Redirect to vehicles list
        } catch (error: any) {
            console.error('Error registering vehicle:', error);
            toast.error(error.message || 'Failed to register vehicle');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'capacity' ? parseInt(value) || 0 : value
        }));
    };

    return (
        <DashboardLayout>
            <div className="p-6">
                <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8 border border-gray-100">
                    <h1 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        Register New Vehicle
                    </h1>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="plate_number" className="block text-sm font-medium text-gray-700 mb-1">
                                Plate Number
                            </label>
                            <input
                                type="text"
                                id="plate_number"
                                name="plate_number"
                                required
                                value={formData.plate_number}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter vehicle plate number"
                            />
                        </div>

                        <div>
                            <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-1">
                                Vehicle Model
                            </label>
                            <input
                                type="text"
                                id="model"
                                name="model"
                                required
                                value={formData.model}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter vehicle model"
                            />
                        </div>

                        <div>
                            <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-1">
                                Capacity (in units)
                            </label>
                            <input
                                type="number"
                                id="capacity"
                                name="capacity"
                                required
                                min="1"
                                value={formData.capacity}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter vehicle capacity"
                            />
                        </div>

                        <div>
                            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                                Status
                            </label>
                            <select
                                id="status"
                                name="status"
                                required
                                value={formData.status}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-200 hover:scale-105"
                        >
                            {isLoading ? 'Registering...' : 'Register Vehicle'}
                        </button>
                    </form>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default RegisterVehicle;
