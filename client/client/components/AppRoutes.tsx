
import React from 'react';
import { useAuth } from '../hooks/useAuth';
import LoginPage from './LoginPage';
import MainPlatform from './MainPlatform';

const AppRoutes: React.FC = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <MainPlatform /> : <LoginPage />;
};

export default AppRoutes;