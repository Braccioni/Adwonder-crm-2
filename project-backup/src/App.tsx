import React, { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';
import Sidebar from './components/Layout/Sidebar';
import Dashboard from './components/Dashboard/Dashboard';
import ClientList from './components/Clients/ClientList';
import DealList from './components/Deals/DealList';
import ActivityList from './components/Activities/ActivityList';
import Reports from './components/Reports/Reports';
import UserManagement from './components/Admin/UserManagement';
import Operations from './components/Operations/Operations';

function App() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <CRMApp />
      </ProtectedRoute>
    </AuthProvider>
  );
}

function CRMApp() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'clients':
        return <ClientList />;
      case 'deals':
        return <DealList />;
      case 'activities':
        return <ActivityList />;
      case 'reports':
        return <Reports />;
      case 'operations':
        return <Operations />;
      case 'user-management':
        return <UserManagement />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1 overflow-auto">
        {renderContent()}
      </div>
    </div>
  );
}

export default App;