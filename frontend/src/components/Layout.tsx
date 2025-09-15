import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Leaf, Calendar, User, LogOut, Plus, ChevronDown } from 'lucide-react';
import { AddPlantModal } from './AddPlantModal';
import { Footer } from './Footer';
import { authAPI } from '../services/api';
import { useAuthStore } from '../stores/authStore';

interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
}

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout: logoutFromStore } = useAuthStore();
  const [user, setUser] = useState<User | null>(null);
  const [showAddPlantModal, setShowAddPlantModal] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await authAPI.profile();
        if (response.data.success) {
          setUser(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    console.log('🔄 Logout initiated');
    try {
      // Call backend logout (optional, for server-side cleanup)
      await authAPI.logout();
      console.log('✅ Backend logout successful');
    } catch (error) {
      console.error('❌ Error calling backend logout:', error);
    } finally {
      // Always clear the frontend auth state
      console.log('🧹 Clearing frontend auth state');
      logoutFromStore();
      console.log('🚀 Redirecting to landing page');
      // Force a hard redirect to ensure we leave the protected route
      window.location.href = '/';
    }
  };

  const navigationItems = [
    { path: '/home', icon: Home, label: 'Home' },
    { path: '/plants', icon: Leaf, label: 'Plants' },
    { path: '/calendar', icon: Calendar, label: 'Calendar' },
  ];

  const isActive = (path: string) => location.pathname === path;
  
  // Check if user is on plant detail page, add plant page, or AI identification page
  const isOnPlantDetailPage = location.pathname.startsWith('/plants/') && location.pathname !== '/plants';
  const isOnAddPlantPage = location.pathname === '/add-plant';
  const isOnAIIdentificationPage = location.pathname === '/ai-identification';
  const shouldHideFloatingButton = isOnPlantDetailPage || isOnAddPlantPage || isOnAIIdentificationPage;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-amber-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-white/20 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Mobile Layout */}
          <div className="block sm:hidden">
            <div className="flex items-center justify-between py-4">
              {/* Logo and Title - Left Side */}
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-green-600 rounded-xl flex items-center justify-center">
                  <span className="text-xl">🌱</span>
                </div>
                <div className="flex flex-col">
                  <h1 className="text-lg font-bold text-gray-800 leading-tight">PlantCare</h1>
                </div>
              </div>
              
              {/* Profile Section - Right Side */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="flex items-center space-x-2 px-2 py-1 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {user?.avatarUrl && (
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="w-8 h-8 rounded-full border-2 border-emerald-200"
                    />
                  )}
                  <div className="text-right hidden xs:block">
                    <p className="text-xs font-medium text-gray-800 truncate max-w-20">
                      {user?.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate max-w-20">
                      {user?.email?.split('@')[0]}
                    </p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Dropdown Menu */}
                {showProfileDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-800">
                        {user?.name}
                      </p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden sm:flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-green-600 rounded-xl flex items-center justify-center">
                <span className="text-xl">🌱</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-800">PlantCare</h1>
            </div>
            
            {/* Center - Newsletter signup */}
            <div className="flex-1 flex justify-center">
              <button className="text-sm text-gray-600 hover:bg-emerald-100 hover:border-emerald-300 border border-transparent px-3 py-1 rounded-lg transition-all duration-200 cursor-pointer">
                Newsletter coming soon! Click <span className="font-bold">here</span> to sign up.
              </button>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                {user?.avatarUrl && (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-10 h-10 rounded-full border-2 border-emerald-200"
                  />
                )}
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-800">
                    🌱 Welcome, {user?.name}
                  </p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white/70 hover:bg-white/90 rounded-lg border border-gray-200 transition-colors duration-200 flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Different padding for mobile vs desktop */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24 sm:pb-20">
        {children}
      </main>

      {/* Footer - Desktop only */}
      <div className="hidden sm:block">
        <Footer />
      </div>

      {/* Bottom Navigation - Responsive visibility */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-white/20 shadow-lg z-50">
        <div className="max-w-md sm:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Mobile Navigation */}
          <div className="flex justify-around py-3 sm:hidden">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-colors duration-200 ${
                    isActive(item.path)
                      ? 'text-emerald-600 bg-emerald-50'
                      : 'text-gray-600 hover:text-emerald-600 hover:bg-emerald-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Desktop Navigation */}
          <div className="hidden sm:flex justify-center py-4">
            <div className="flex items-center space-x-20">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200 ${
                      isActive(item.path)
                        ? 'text-emerald-600 bg-emerald-50 font-medium'
                        : 'text-gray-600 hover:text-emerald-600 hover:bg-emerald-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </nav>

      {/* Floating Action Button - Hide on plant detail page, add plant page, and AI identification page */}
      {!shouldHideFloatingButton && (
        <button
          onClick={() => setShowAddPlantModal(true)}
          className="fixed bottom-20 right-4 w-14 h-14 bg-emerald-600 text-white rounded-full shadow-lg hover:bg-emerald-700 transition-colors duration-200 flex items-center justify-center z-50 sm:bottom-24"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {/* Add Plant Modal */}
      <AddPlantModal
        isOpen={showAddPlantModal}
        onClose={() => setShowAddPlantModal(false)}
        onManualEntry={() => {
          setShowAddPlantModal(false);
          navigate('/add-plant');
        }}
        onCameraID={() => {
          setShowAddPlantModal(false);
          navigate('/ai-identification');
        }}
      />
    </div>
  );
};