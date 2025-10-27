
import React from 'react';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './components/AppRoutes';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-blue-50/50">
        <AppRoutes />
      </div>
    </AuthProvider>
  );
};

export default App;