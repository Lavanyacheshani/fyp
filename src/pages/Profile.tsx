import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserCircleIcon, EnvelopeIcon, IdentificationIcon, CalendarIcon, CreditCardIcon, KeyIcon, BriefcaseIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import type { Database } from '../types/supabase';

type UserData = Database['public']['Tables']['users']['Row'];

const Profile: FC = () => {
  const [formattedJoinDate, setFormattedJoinDate] = useState('');
  const [formattedUpdateDate, setFormattedUpdateDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast.error('Not authenticated');
          return;
        }

        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', user.email)
          .single();

        if (error) throw error;
        if (!data) throw new Error('User data not found');

        setUserData(data);

        // Format dates
        if (data.join_date) {
          setFormattedJoinDate(new Date(data.join_date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }));
        }
        if (data.updated_at) {
          setFormattedUpdateDate(new Date(data.updated_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }));
        }
      } catch (err: any) {
        console.error('Error fetching user data:', err);
        toast.error(err.message || 'Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  if (isLoading || !userData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Profile</h1>
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          {/* Header Section */}
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {userData.avatar_url ? (
                <img
                  src={userData.avatar_url}
                  alt=""
                  className="h-20 w-20 rounded-full"
                />
              ) : (
                <UserCircleIcon className="h-20 w-20 text-gray-400" />
              )}
            </div>
            <div className="ml-6">
              <h2 className="text-2xl font-semibold text-gray-900">{userData.name}</h2>
              <div className="mt-1 flex items-center text-sm text-gray-500">
                <EnvelopeIcon className="h-4 w-4 mr-1" />
                {userData.email}
              </div>
              <div className="mt-1 flex items-center">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  userData.status === 'active' ? 'bg-green-100 text-green-800' :
                  userData.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {userData.status.charAt(0).toUpperCase() + userData.status.slice(1)}
                </span>
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="mt-6 border-t border-gray-200 pt-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div className="flex items-center">
                <BriefcaseIcon className="h-5 w-5 text-gray-400 mr-2" />
                <div>
                  <dt className="text-sm font-medium text-gray-500">Role</dt>
                  <dd className="mt-1 text-sm text-gray-900">{userData.role}</dd>
                </div>
              </div>

              <div className="flex items-center">
                <CreditCardIcon className="h-5 w-5 text-gray-400 mr-2" />
                <div>
                  <dt className="text-sm font-medium text-gray-500">Credits</dt>
                  <dd className="mt-1 text-sm text-gray-900">{userData.credits}</dd>
                </div>
              </div>

              <div className="flex items-center">
                <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                <div>
                  <dt className="text-sm font-medium text-gray-500">Join Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formattedJoinDate}</dd>
                </div>
              </div>

              <div className="flex items-center">
                <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                <div>
                  <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formattedUpdateDate}</dd>
                </div>
              </div>
            </dl>
          </div>

          {/* Permissions Section */}
          <div className="mt-6 border-t border-gray-200 pt-6">
            <div className="flex items-center mb-4">
              <KeyIcon className="h-5 w-5 text-gray-400 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Permissions</h3>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {userData.permissions.map((permission) => (
                <span
                  key={permission}
                  className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-indigo-100 text-indigo-800"
                >
                  {permission.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </span>
              ))}
            </div>
          </div>

          {/* User ID Section - For Reference */}
          <div className="mt-6 border-t border-gray-200 pt-6">
            <div className="flex items-center text-sm text-gray-500">
              <IdentificationIcon className="h-4 w-4 mr-1" />
              <span>User ID: {userData.id}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;