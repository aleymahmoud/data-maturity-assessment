'use client';

import { useState, useEffect } from 'react';
import AdminLogin from '../../components/admin/AdminLogin';
import Sidebar from '../../components/admin/Sidebar';
import Dashboard from '../../components/admin/Dashboard';
import CodesManagement from '../../components/admin/CodesManagement';
import CreateCodes from '../../components/admin/CreateCodes';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('dashboard');
  
  // Login state
  const [loginData, setLoginData] = useState({
    username: '',
    password: ''
  });
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  // Data state
  const [codes, setCodes] = useState([]);
  const [stats, setStats] = useState({
    totalCodes: 0,
    activeCodes: 0,
    usedCodes: 0,
    expiredCodes: 0
  });
  const [filters, setFilters] = useState({
    type: '',
    status: ''
  });
  
  // Code creation state
  const [codeForm, setCodeForm] = useState({
    organizationName: '',
    intendedRecipient: '',
    assessmentType: 'full',
    expiresAt: '',
    maxUses: 1,
    bulkCount: 1
  });
  const [isCreatingCodes, setIsCreatingCodes] = useState(false);
  const [createSuccess, setCreateSuccess] = useState('');
  
  useEffect(() => {
    checkAuthentication();
  }, []);
  
  const checkAuthentication = () => {
    const adminSession = sessionStorage.getItem('adminSession');
    if (adminSession) {
      setIsAuthenticated(true);
      fetchCodes();
    }
    setIsLoading(false);
  };
  
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });
      
      const result = await response.json();
      
      if (result.success) {
        sessionStorage.setItem('adminSession', JSON.stringify(result.adminData));
        setIsAuthenticated(true);
        fetchCodes();
      } else {
        setLoginError(result.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('Network error occurred');
    } finally {
      setIsLoggingIn(false);
    }
  };
  
  const handleLogout = () => {
    sessionStorage.removeItem('adminSession');
    setIsAuthenticated(false);
    setLoginData({ username: '', password: '' });
    setActiveSection('dashboard');
  };
  
  const fetchCodes = async () => {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await fetch(`/api/admin/codes?${queryParams}`);
      const result = await response.json();
      
      if (result.success) {
        setCodes(result.codes);
        calculateStats(result.codes);
      }
    } catch (error) {
      console.error('Error fetching codes:', error);
    }
  };
  
  const calculateStats = (codes) => {
    const total = codes.length;
    const active = codes.filter(c => !c.is_used && (!c.expires_at || new Date(c.expires_at) > new Date())).length;
    const used = codes.filter(c => c.is_used).length;
    const expired = codes.filter(c => !c.is_used && c.expires_at && new Date(c.expires_at) < new Date()).length;
    
    setStats({
      totalCodes: total,
      activeCodes: active,
      usedCodes: used,
      expiredCodes: expired
    });
  };
  
  const handleCreateCodes = async (e) => {
    e.preventDefault();
    setIsCreatingCodes(true);
    setCreateSuccess('');
    
    try {
      const adminSession = JSON.parse(sessionStorage.getItem('adminSession'));
      const codesData = [];
      
      for (let i = 0; i < codeForm.bulkCount; i++) {
        codesData.push({
          ...codeForm,
          createdBy: adminSession.id
        });
      }
      
      const response = await fetch('/api/admin/create-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ codes: codesData }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setCreateSuccess(`Successfully created ${result.codes.length} assessment code(s)`);
        setCodeForm({
          organizationName: '',
          intendedRecipient: '',
          assessmentType: 'full',
          expiresAt: '',
          maxUses: 1,
          bulkCount: 1
        });
        fetchCodes();
        setTimeout(() => setCreateSuccess(''), 5000);
      } else {
        alert('Error creating codes: ' + result.error);
      }
    } catch (error) {
      console.error('Error creating codes:', error);
      alert('Network error occurred');
    } finally {
      setIsCreatingCodes(false);
    }
  };
  
  const handleDeleteCode = async (codeId) => {
    if (!confirm('Are you sure you want to delete this code?')) return;
    
    try {
      const adminSession = JSON.parse(sessionStorage.getItem('adminSession'));
      
      const response = await fetch(`/api/admin/codes/${codeId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ adminId: adminSession.id }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        fetchCodes();
      } else {
        alert('Error deleting code: ' + result.error);
      }
    } catch (error) {
      console.error('Error deleting code:', error);
      alert('Network error occurred');
    }
  };
  
  useEffect(() => {
    if (isAuthenticated && (activeSection === 'codes' || activeSection === 'dashboard')) {
      fetchCodes();
    }
  }, [filters, isAuthenticated, activeSection]);
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-indigo-600 mx-auto" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <h2 className="mt-2 text-lg font-medium text-gray-900">Loading...</h2>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return (
      <AdminLogin
        loginData={loginData}
        setLoginData={setLoginData}
        onLogin={handleLogin}
        loginError={loginError}
        isLoggingIn={isLoggingIn}
      />
    );
  }
  
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        onLogout={handleLogout}
      />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <main className="flex-1 relative overflow-y-auto focus:outline-none bg-gray-50">
          <div className="h-full">
            <div className="max-w-6xl mx-auto h-full">
              {activeSection === 'dashboard' && (
                <Dashboard stats={stats} codes={codes} />
              )}
              
              {activeSection === 'codes' && (
                <CodesManagement 
                  codes={codes}
                  filters={filters}
                  setFilters={setFilters}
                  onDeleteCode={handleDeleteCode}
                />
              )}
              
              {activeSection === 'create' && (
                <CreateCodes 
                  codeForm={codeForm}
                  setCodeForm={setCodeForm}
                  onCreateCodes={handleCreateCodes}
                  isCreatingCodes={isCreatingCodes}
                  createSuccess={createSuccess}
                />
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}