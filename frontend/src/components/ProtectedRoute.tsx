import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AdminLoginModal } from './AdminLoginModal';
import { useNavigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAdminAuthenticated } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAdminAuthenticated) {
      setShowLoginModal(true);
    }
  }, [isAdminAuthenticated]);

  const handleLoginSuccess = () => {
    setShowLoginModal(false);
  };

  const handleLoginCancel = () => {
    setShowLoginModal(false);
    navigate('/');
  };

  if (!isAdminAuthenticated) {
    return (
      <AdminLoginModal
        isOpen={showLoginModal}
        onClose={handleLoginCancel}
        onSuccess={handleLoginSuccess}
      />
    );
  }

  return <>{children}</>;
};