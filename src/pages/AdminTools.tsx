import { useState } from 'react';
import { seedRouteAnalyticsData, clearRouteAnalyticsData } from '../utils/seedRouteData';
import toast from 'react-hot-toast';

export default function AdminTools() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleSeedData = async () => {
    try {
      setIsSeeding(true);
      setResult(null);
      await seedRouteAnalyticsData();
      setResult('Successfully seeded route_analytics table with sample data.');
      toast.success('Route data seeded successfully');
    } catch (error: any) {
      console.error('Error seeding data:', error);
      setResult(`Error: ${error.message}`);
      toast.error('Failed to seed route data');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleClearData = async () => {
    try {
      setIsClearing(true);
      setResult(null);
      await clearRouteAnalyticsData();
      setResult('Successfully cleared all data from route_analytics table.');
      toast.success('Route data cleared successfully');
    } catch (error: any) {
      console.error('Error clearing data:', error);
      setResult(`Error: ${error.message}`);
      toast.error('Failed to clear route data');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Admin Tools</h1>
        
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Route Analytics Data Management</h2>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">
                Use these tools to populate the route_analytics table with sample data for testing the dashboard map.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleSeedData}
                  disabled={isSeeding || isClearing}
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {isSeeding ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Seeding Data...
                    </>
                  ) : (
                    'Seed Sample Route Data'
                  )}
                </button>
                
                <button
                  onClick={handleClearData}
                  disabled={isSeeding || isClearing}
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {isClearing ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Clearing Data...
                    </>
                  ) : (
                    'Clear Route Data'
                  )}
                </button>
              </div>
            </div>
            
            {result && (
              <div className={`mt-4 p-3 rounded-md ${result.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                {result}
              </div>
            )}
            
            <div className="mt-6 border-t border-gray-200 pt-4">
              <h3 className="text-md font-medium text-gray-900 mb-2">Instructions</h3>
              <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
                <li>Click "Seed Sample Route Data" to populate the route_analytics table with sample data</li>
                <li>Go to the Dashboard page to see the routes displayed on the map</li>
                <li>Use "Clear Route Data" to remove all sample data when you're done testing</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}