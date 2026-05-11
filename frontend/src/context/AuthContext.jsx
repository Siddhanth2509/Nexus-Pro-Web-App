import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (token) {
      axios.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => {
        setUser(res.data.user);
      })
      .catch(() => {
        localStorage.removeItem('token');
      })
      .finally(() => {
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await axios.post('/api/auth/login', { email, password });
    localStorage.setItem('token', res.data.access);
    setUser(res.data.user);
    return res.data;
  };

  const register = async (name, email, password, confirmPassword, role, adminSecret) => {
    const res = await axios.post('/api/auth/register', { name, email, password, confirmPassword, role, adminSecret });
    localStorage.setItem('token', res.data.access);
    setUser(res.data.user);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const loginWithGoogle = async ({ credential, accessToken }) => {
    const payload = credential
      ? { credential }
      : { access_token: accessToken };
    const endpoint = credential ? '/api/auth/google' : '/api/auth/google-access';

    if (!credential && !accessToken) {
      throw new Error('Google token is missing.');
    }

    const res = await axios.post(endpoint, payload);
    localStorage.setItem('token', res.data.access);
    setUser(res.data.user);
    return res.data;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, loginWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
