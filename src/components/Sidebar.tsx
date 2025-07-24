import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  User, 
  HelpCircle, 
  Leaf, 
  LogOut
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const Sidebar: React.FC = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const navigationItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Container Marketplace', href: '/containers', icon: Package },
    { name: 'Register Vehicle', href: '/vehicles/register', icon: ShoppingCart },
    { name: 'Profile', href: '/profile', icon: User },
    { name: 'Help', href: '/help', icon: HelpCircle },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-secondary-200">
      <div className="flex items-center px-4 py-6">
        <Leaf className="h-8 w-8 text-primary-600" />
        <span className="ml-2 text-xl font-semibold text-secondary-900">SmartCargo</span>
      </div>
      
      <div className="flex-1 px-2 space-y-1">
        {navigationItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) => 
              `nav-link ${isActive ? 'nav-link-active' : 'nav-link-inactive'}`
            }
          >
            <item.icon className="mr-3 h-5 w-5" />
            {item.name}
          </NavLink>
        ))}
      </div>
      
      <div className="px-2 py-4 border-t border-secondary-200">
        <button 
          className="nav-link nav-link-inactive w-full justify-between"
          onClick={handleSignOut}
        >
          <div className="flex items-center">
            <LogOut className="mr-3 h-5 w-5" />
            Sign out
          </div>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
