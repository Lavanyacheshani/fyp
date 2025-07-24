import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface Container {
  id: string;
  name: string;
  location: string;
  status: string;
  assigned_to: string; // Assuming assigned_to stores user ID
  temperature?: number;
  humidity?: number;
  battery_level?: number;
  last_updated?: string;
}

export default function AssignedContainers() {
  const [containers, setContainers] = useState<Container[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignedContainers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('containers')
        .select('id, name, location, status, assigned_to, temperature, humidity, battery_level, last_updated') // Adjust select query as needed
        .not('assigned_to', 'is', null); // Fetch containers that are assigned

      if (fetchError) throw fetchError;

      setContainers(data || []);
    } catch (err: any) {
      console.error('Error fetching assigned containers:', err);
      setError(err.message);
      toast.error('Failed to fetch assigned containers');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssignedContainers();
  }, [fetchAssignedContainers]);

  if (isLoading) return <div className="p-4 text-center">Loading assigned containers...</div>;
  if (error) return <div className="p-4 text-center text-red-600">Error: {error}</div>;

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-4">Assigned Containers</h1>
        {containers.length === 0 ? (
          <p className="text-gray-500">No containers are currently assigned.</p>
        ) : (
          <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To (ID)</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {containers.map((container) => (
                  <tr key={container.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{container.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{container.location}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{container.status}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{container.assigned_to}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {container.last_updated ? new Date(container.last_updated).toLocaleString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}