'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { DomainsManagement } from '../domains/DomainsManagement';
import { MaturityLevelsManagement } from '../domains/MaturityLevelsManagement';

interface Domain {
  id: string;
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  display_order: number;
  subdomain_count?: number;
}

interface MaturityLevel {
  id: string;
  level_number: number;
  name: string;
  description: string;
  description_ar: string;
  min_score: number;
  max_score: number;
  color: string;
  icon: string;
}

export function DomainsMaturityTab() {
  const [activeSubTab, setActiveSubTab] = useState('domains');
  const [domains, setDomains] = useState<Domain[]>([]);
  const [maturityLevels, setMaturityLevels] = useState<MaturityLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingDomain, setEditingDomain] = useState<Domain | null>(null);
  const [editingLevel, setEditingLevel] = useState<MaturityLevel | null>(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  useEffect(() => {
    fetchDomains();
    fetchMaturityLevels();
  }, []);

  const fetchDomains = async () => {
    try {
      const response = await fetch('/api/admin/domains');
      const data = await response.json();
      if (data.success) {
        setDomains(data.domains);
      }
    } catch (error) {
      console.error('Error fetching domains:', error);
      showMessage('Failed to load domains', 'error');
    }
  };

  const fetchMaturityLevels = async () => {
    try {
      const response = await fetch('/api/admin/maturity-levels');
      const data = await response.json();
      if (data.success) {
        setMaturityLevels(data.levels || data.maturityLevels || []);
      }
    } catch (error) {
      console.error('Error fetching maturity levels:', error);
      showMessage('Failed to load maturity levels', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text: string, type: string = 'info') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

  const handleSaveDomain = async (domainData: Domain) => {
    try {
      const isCreate = !domainData.id || domainData.id === '';
      const method = isCreate ? 'POST' : 'PUT';

      const response = await fetch('/api/admin/domains', {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(domainData)
      });

      const data = await response.json();
      if (data.success) {
        showMessage(isCreate ? 'Domain created successfully' : 'Domain updated successfully', 'success');
        setEditingDomain(null);
        fetchDomains();
      } else {
        showMessage(data.error || 'Failed to save domain', 'error');
      }
    } catch (error) {
      console.error('Error saving domain:', error);
      showMessage('Failed to save domain', 'error');
    }
  };

  const handleDeleteDomain = async (domainId: string) => {
    if (!confirm('Are you sure you want to delete this domain? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/domains?id=${domainId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.success) {
        showMessage('Domain deleted successfully', 'success');
        fetchDomains();
      } else {
        showMessage(data.error || 'Failed to delete domain', 'error');
      }
    } catch (error) {
      console.error('Error deleting domain:', error);
      showMessage('Failed to delete domain', 'error');
    }
  };

  const handleSaveMaturityLevel = async (levelData: MaturityLevel) => {
    try {
      const isEdit = levelData.id && levelData.id !== '';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch('/api/admin/maturity-levels', {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(levelData)
      });

      const data = await response.json();
      if (data.success) {
        showMessage(isEdit ? 'Maturity level updated successfully' : 'Maturity level created successfully', 'success');
        setEditingLevel(null);
        fetchMaturityLevels();
      } else {
        showMessage(data.error || 'Failed to save maturity level', 'error');
      }
    } catch (error) {
      console.error('Error saving maturity level:', error);
      showMessage('Failed to save maturity level', 'error');
    }
  };

  const handleDeleteMaturityLevel = async (levelId: string) => {
    if (!confirm('Are you sure you want to delete this maturity level? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/maturity-levels?id=${levelId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.success) {
        showMessage('Maturity level deleted successfully', 'success');
        fetchMaturityLevels();
      } else {
        showMessage(data.error || 'Failed to delete maturity level', 'error');
      }
    } catch (error) {
      console.error('Error deleting maturity level:', error);
      showMessage('Failed to delete maturity level', 'error');
    }
  };


  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px'
      }}>
        <div style={{
          animation: 'spin 1s linear infinite',
          borderRadius: '50%',
          width: '32px',
          height: '32px',
          borderBottom: '2px solid #2563eb'
        }}></div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      {/* Message Display */}
      {message && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '6px',
          marginBottom: '24px',
          backgroundColor: messageType === 'success' ? '#f0fdf4' : messageType === 'error' ? '#fef2f2' : '#f0f9ff',
          color: messageType === 'success' ? '#166534' : messageType === 'error' ? '#dc2626' : '#1e40af',
          border: `1px solid ${messageType === 'success' ? '#bbf7d0' : messageType === 'error' ? '#fecaca' : '#bfdbfe'}`,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {messageType === 'success' && <CheckCircle size={16} />}
          {messageType === 'error' && <AlertCircle size={16} />}
          {message}
        </div>
      )}

      {/* Sub-tabs */}
      <div style={{
        borderBottom: '1px solid #e5e7eb',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', gap: '32px' }}>
          <button
            onClick={() => setActiveSubTab('domains')}
            style={{
              padding: '12px 0',
              border: 'none',
              backgroundColor: 'transparent',
              color: activeSubTab === 'domains' ? '#7f7afe' : '#6b7280',
              fontWeight: activeSubTab === 'domains' ? '500' : '400',
              fontSize: '14px',
              cursor: 'pointer',
              borderBottom: activeSubTab === 'domains' ? '2px solid #7f7afe' : '2px solid transparent',
              transition: 'all 0.2s'
            }}
          >
            Assessment Domains
          </button>
          <button
            onClick={() => setActiveSubTab('maturity')}
            style={{
              padding: '12px 0',
              border: 'none',
              backgroundColor: 'transparent',
              color: activeSubTab === 'maturity' ? '#7f7afe' : '#6b7280',
              fontWeight: activeSubTab === 'maturity' ? '500' : '400',
              fontSize: '14px',
              cursor: 'pointer',
              borderBottom: activeSubTab === 'maturity' ? '2px solid #7f7afe' : '2px solid transparent',
              transition: 'all 0.2s'
            }}
          >
            Maturity Levels
          </button>
        </div>
      </div>

      {/* Domains Tab */}
      {activeSubTab === 'domains' && (
        <DomainsManagement
          domains={domains}
          editingDomain={editingDomain}
          setEditingDomain={setEditingDomain}
          onSave={handleSaveDomain}
          onDelete={handleDeleteDomain}
        />
      )}

      {/* Maturity Levels Tab */}
      {activeSubTab === 'maturity' && (
        <MaturityLevelsManagement
          levels={maturityLevels}
          editingLevel={editingLevel}
          setEditingLevel={setEditingLevel}
          onSave={handleSaveMaturityLevel}
          onDelete={handleDeleteMaturityLevel}
        />
      )}
    </div>
  );
}
