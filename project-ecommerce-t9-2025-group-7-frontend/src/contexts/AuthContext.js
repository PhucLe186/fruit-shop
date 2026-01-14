import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { DOMAIN_SERVER } from "../config/constants";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
    return null;
  };

  const verifyToken = async (tokenParam = null) => {
    const token = tokenParam || getCookie("tokenUser");
    if (!token) {
      setLoading(false);
      setUser(null);
      return;
    }

    try {
      const res = await axios.post(
        `${DOMAIN_SERVER}/api/auth/verify-token`,
        {},
        {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.data) {
        if (res.data.success === false) {
          setUser(null);
        } else {
          const customer = res.data.customer || res.data.user || res.data;
          if (customer && (customer._id || customer.id)) {
            setUser(customer);
          } else {
            setUser(null);
          }
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      // Handle network errors gracefully
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        console.warn("Backend server is not running. Please start the server at http://localhost:5000");
        // Don't log as error if server is just not running
      } else {
        console.error("Verify token error:", error.response?.data || error.message);
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    verifyToken();
  }, []);

  const logout = () => {
    document.cookie = "tokenUser=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    setUser(null);
  };

  const setUserDirectly = (userData) => {
    setUser(userData);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, verifyToken, logout, setUserDirectly }}>
      {children}
    </AuthContext.Provider>
  );
};

