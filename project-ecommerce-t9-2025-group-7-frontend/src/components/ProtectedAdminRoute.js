import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import { DOMAIN_SERVER } from '../config/constants';

const ProtectedAdminRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);

  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  };

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const token = getCookie('tokenAdmin');
        
        if (!token) {
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }

        const res = await axios.post(
          `${DOMAIN_SERVER}/admin/auth/verify-token`,
          { token },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            withCredentials: true,
          }
        );

        if (res.data.success) {
          if (res.data.data) {
            const adminData = {
              _id: res.data.data._id,
              fullname: res.data.data.fullname,
              username: res.data.data.username,
              email: res.data.data.email,
              phone: res.data.data.phone,
              role: res.data.data.role,
              status: res.data.data.status,
            };
            localStorage.setItem('adminData', JSON.stringify(adminData));
          }
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          document.cookie = 'tokenAdmin=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
          localStorage.removeItem('adminData');
        }
      } catch (error) {
        console.error('Verify token error:', error);
        setIsAuthenticated(false);
        document.cookie = 'tokenAdmin=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        localStorage.removeItem('adminData');
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

export default ProtectedAdminRoute;

