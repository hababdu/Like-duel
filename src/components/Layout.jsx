import { Outlet, NavLink } from 'react-router-dom';
import {
  HomeIcon,
  ShoppingCartIcon,
  ChartBarIcon,
  UserIcon
} from '@heroicons/react/24/outline';

function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
    
      {/* Main Content */}
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 w-full bg-white border-t border-gray-200">
        <nav className="flex justify-around">
          
          <NavLink
            to="/orders"
            className={({ isActive }) => 
              `flex flex-col items-center py-3 px-4 text-xs ${
                isActive ? 'text-blue-600' : 'text-gray-600'
              }`
            }
          >
            <ShoppingCartIcon className="h-6 w-6" />
            <span className="mt-1">Orders</span>
          </NavLink>
         
          <NavLink
            to="/"
            className={({ isActive }) => 
              `flex flex-col items-center py-3 px-4 text-xs ${
                isActive ? 'text-blue-600' : 'text-gray-600'
              }`
            }
          >
            <UserIcon className="h-6 w-6" />
            <span className="mt-1">Profile</span>
          </NavLink>
        </nav>
      </div>

      {/* Footer */}
      <footer className="bg-white py-4 border-t border-gray-200 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500 text-sm">
          <p>&copy; 2025 Food Delivery App. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default Layout;