import React, { useState, useEffect } from 'react';
import { BarChart3, Users, Briefcase, Calendar, FileText, LogOut, User, Settings, Bell, Cog } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { notificationService } from '../../services/notificationService';
import NotificationCenter from './NotificationCenter';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const { user, logout } = useAuth();
  const [notificationCount, setNotificationCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'clients', label: 'Clienti', icon: Users },
    { id: 'deals', label: 'Trattative', icon: Briefcase },
    { id: 'activities', label: 'Attività', icon: Calendar },
    { id: 'operations', label: 'Operatività', icon: Cog },
    { id: 'reports', label: 'Report', icon: FileText },
  ];

  // Add admin menu items for owners
  const adminMenuItems = user?.ruolo === 'owner' ? [
    { id: 'user-management', label: 'Gestione Utenti', icon: Settings },
  ] : [];

  useEffect(() => {
    loadNotificationCount();
    // Refresh notification count every 5 minutes
    const interval = setInterval(loadNotificationCount, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadNotificationCount = async () => {
    try {
      const counts = await notificationService.getNotificationCount();
      setNotificationCount(counts.pending);
    } catch (error) {
      console.error('Error loading notification count:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Errore durante il logout:', error);
    }
  };

  return (
    <div className="w-64 bg-gray-900 text-white min-h-screen">
      <div className="p-6">
        <div className="flex items-center justify-center space-x-2">
          <img src="/adwonder-logo.svg" alt="Adwonder CRM" className="h-8" />
        </div>
        <h1 className="text-lg font-bold text-center mt-2">Adwonder CRM</h1>
      </div>
      
      {/* Notifications Button */}
      <div className="px-6 mb-4">
        <button
          onClick={() => setShowNotifications(true)}
          className="w-full flex items-center justify-between px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
        >
          <div className="flex items-center space-x-3">
            <Bell className="h-5 w-5" />
            <span className="text-sm font-medium">Notifiche</span>
          </div>
          {notificationCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full min-w-[20px] text-center">
              {notificationCount > 99 ? '99+' : notificationCount}
            </span>
          )}
        </button>
      </div>
      
      <nav className="mt-8 flex-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center px-6 py-3 text-left hover:bg-gray-800 transition-colors ${
                activeTab === item.id ? 'bg-blue-600 border-r-4 border-blue-400' : ''
              }`}
            >
              <Icon className="w-5 h-5 mr-3" />
              {item.label}
            </button>
          );
        })}
        
        {/* Admin section for owners */}
        {adminMenuItems.length > 0 && (
          <div className="mt-8">
            <h3 className="px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Amministrazione
            </h3>
            <div className="mt-2">
              {adminMenuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    className={`w-full flex items-center px-6 py-3 text-left hover:bg-gray-800 transition-colors ${
                      activeTab === item.id ? 'bg-blue-600 border-r-4 border-blue-400' : ''
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </nav>
      
      {/* User Info and Logout */}
      <div className="border-t border-gray-700 p-4">
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-3">
            <User className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.nome} {user?.cognome}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {user?.email}
            </p>
            <p className="text-xs text-blue-400 capitalize">
              {user?.ruolo}
            </p>
          </div>
        </div>
        
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-3 py-2 text-left hover:bg-gray-800 transition-colors rounded text-red-400 hover:text-red-300"
        >
          <LogOut className="w-4 h-4 mr-3" />
          Logout
        </button>
      </div>
      
      {/* Notification Center */}
      <NotificationCenter 
        isOpen={showNotifications} 
        onClose={() => {
          setShowNotifications(false);
          loadNotificationCount(); // Refresh count when closing
        }} 
      />
    </div>
  );
};

export default Sidebar;