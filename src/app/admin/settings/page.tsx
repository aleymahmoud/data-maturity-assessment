'use client';

import { useState, useEffect } from 'react';
import {
  Database,
  Users,
  HelpCircle,
  Settings,
  Globe,
  Mail,
  Edit,
  UserCheck,
  Download,
  Upload,
  Sliders,
  ChevronLeft,
  ChevronRight,
  Menu,
  Plus,
  Save,
  X,
  Trash2,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

export default function SystemSettingsPage() {
  const [activeTab, setActiveTab] = useState('domains');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const tabs = [
    {
      id: 'domains',
      name: 'Domains & Maturity',
      icon: Database,
      description: 'Manage assessment domains and maturity levels'
    },
    {
      id: 'questions',
      name: 'Questions & Options',
      icon: HelpCircle,
      description: 'Configure questions, options, and scoring'
    },
    {
      id: 'roles',
      name: 'Roles & Subdomains',
      icon: Users,
      description: 'Manage user roles and domain subdivisions'
    },
    {
      id: 'assessment',
      name: 'Assessment Config',
      icon: Sliders,
      description: 'Configure assessment types and rules'
    },
    {
      id: 'languages',
      name: 'Languages',
      icon: Globe,
      description: 'Manage translations and localization'
    },
    {
      id: 'notifications',
      name: 'Notifications',
      icon: Mail,
      description: 'Email templates and notification settings'
    },
    {
      id: 'branding',
      name: 'Branding',
      icon: Edit,
      description: 'Customize appearance and branding'
    },
    {
      id: 'users',
      name: 'User Management',
      icon: UserCheck,
      description: 'Manage admin users and permissions'
    },
    {
      id: 'data',
      name: 'Data Management',
      icon: Download,
      description: 'Backup, import, export, and monitoring'
    },
    {
      id: 'system',
      name: 'System Config',
      icon: Settings,
      description: 'General system and security settings'
    }
  ];

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'domains':
        return <DomainsMaturityTab />;
      case 'questions':
        return <QuestionsOptionsTab />;
      case 'roles':
        return <RolesSubdomainsTab />;
      case 'assessment':
        return <AssessmentConfigTab />;
      case 'languages':
        return <LanguagesTab />;
      case 'notifications':
        return <NotificationsTab />;
      case 'branding':
        return <BrandingTab />;
      case 'users':
        return <UserManagementTab />;
      case 'data':
        return <DataManagementTab />;
      case 'system':
        return <SystemConfigTab />;
      default:
        return <DomainsMaturityTab />;
    }
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '32px'
      }}>
        <div style={{
          padding: '12px',
          backgroundColor: '#7f7afe',
          borderRadius: '8px'
        }}>
          <Settings size={24} color="white" />
        </div>
        <div>
          <h1 style={{
            fontSize: '24px',
            fontWeight: '600',
            color: '#111827',
            margin: 0
          }}>
            System Settings
          </h1>
          <p style={{
            fontSize: '14px',
            color: '#6b7280',
            margin: 0
          }}>
            Configure system-wide settings and preferences
          </p>
        </div>
      </div>

      {/* Main Content with Sidebar */}
      <div style={{
        display: 'flex',
        gap: '24px',
        minHeight: '600px'
      }}>
        {/* Sidebar Navigation */}
        <div style={{
          width: isSidebarCollapsed ? '60px' : '280px',
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          padding: '16px',
          height: 'fit-content',
          transition: 'width 0.3s ease',
          overflow: 'hidden'
        }}>
          {/* Sidebar Header with Collapse Button */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px'
          }}>
            {!isSidebarCollapsed && (
              <h2 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#111827',
                margin: 0,
                whiteSpace: 'nowrap'
              }}>
                Configuration
              </h2>
            )}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              style={{
                padding: '6px',
                border: 'none',
                backgroundColor: '#f3f4f6',
                borderRadius: '6px',
                cursor: 'pointer',
                color: '#6b7280',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#e5e7eb';
                e.currentTarget.style.color = '#374151';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
                e.currentTarget.style.color = '#6b7280';
              }}
            >
              {isSidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}>
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  title={isSidebarCollapsed ? `${tab.name} - ${tab.description}` : ''}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: isSidebarCollapsed ? '0' : '12px',
                    padding: isSidebarCollapsed ? '12px' : '12px 16px',
                    border: 'none',
                    backgroundColor: isActive ? '#f3f4ff' : 'transparent',
                    color: isActive ? '#7f7afe' : '#6b7280',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: isActive ? '500' : '400',
                    transition: 'all 0.2s',
                    textAlign: 'left',
                    width: '100%',
                    justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                    position: 'relative',
                    minHeight: '44px'
                  }}
                  onMouseOver={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = '#f9fafb';
                      e.currentTarget.style.color = '#374151';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#6b7280';
                    }
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <IconComponent size={18} />
                  </div>
                  {!isSidebarCollapsed && (
                    <div style={{
                      marginLeft: '12px',
                      overflow: 'hidden'
                    }}>
                      <div style={{ whiteSpace: 'nowrap' }}>{tab.name}</div>
                      <div style={{
                        fontSize: '12px',
                        color: isActive ? '#a5a7ff' : '#9ca3af',
                        marginTop: '2px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {tab.description}
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div style={{
          flex: 1,
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          padding: '24px'
        }}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

// Domains & Maturity Levels Management Component
function DomainsMaturityTab() {
  const [activeSubTab, setActiveSubTab] = useState('domains');
  const [domains, setDomains] = useState([]);
  const [maturityLevels, setMaturityLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingDomain, setEditingDomain] = useState(null);
  const [editingLevel, setEditingLevel] = useState(null);
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
        setMaturityLevels(data.levels);
      }
    } catch (error) {
      console.error('Error fetching maturity levels:', error);
      showMessage('Failed to load maturity levels', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text, type = 'info') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

  const handleSaveDomain = async (domainData) => {
    try {
      const response = await fetch('/api/admin/domains', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(domainData)
      });

      const data = await response.json();
      if (data.success) {
        showMessage('Domain updated successfully', 'success');
        setEditingDomain(null);
        fetchDomains();
      } else {
        showMessage(data.error || 'Failed to update domain', 'error');
      }
    } catch (error) {
      console.error('Error saving domain:', error);
      showMessage('Failed to save domain', 'error');
    }
  };

  const handleSaveMaturityLevel = async (levelData) => {
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

  const handleDeleteMaturityLevel = async (levelId) => {
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

function QuestionsOptionsTab() {
  const [activeSubTab, setActiveSubTab] = useState('questions');

  const subTabs = [
    { id: 'questions', name: 'Questions Management' },
    { id: 'options', name: 'Answer Options' },
    { id: 'mapping', name: 'Subdomain Mapping' },
    { id: 'import-export', name: 'Import/Export' }
  ];

  return (
    <div>
      {/* Sub-tabs */}
      <div style={{
        display: 'flex',
        gap: '4px',
        borderBottom: '1px solid #e5e7eb',
        marginBottom: '24px'
      }}>
        {subTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            style={{
              padding: '12px 20px',
              border: 'none',
              backgroundColor: 'transparent',
              color: activeSubTab === tab.id ? '#0066cc' : '#6b7280',
              borderBottom: activeSubTab === tab.id ? '2px solid #0066cc' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: activeSubTab === tab.id ? '600' : '500',
              transition: 'all 0.2s'
            }}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeSubTab === 'questions' && <QuestionsManagement />}
      {activeSubTab === 'options' && <AnswerOptionsConfig />}
      {activeSubTab === 'mapping' && <SubdomainMapping />}
      {activeSubTab === 'import-export' && <ImportExport />}
    </div>
  );
}

function RolesSubdomainsTab() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '400px',
      flexDirection: 'column',
      gap: '16px'
    }}>
      <Users size={48} color="#9ca3af" />
      <div style={{ textAlign: 'center' }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: '#111827',
          margin: '0 0 8px 0'
        }}>
          Roles & Subdomains
        </h3>
        <p style={{
          fontSize: '14px',
          color: '#6b7280',
          margin: 0
        }}>
          Content coming soon - manage user roles and domain subdivisions
        </p>
      </div>
    </div>
  );
}

function AssessmentConfigTab() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '400px',
      flexDirection: 'column',
      gap: '16px'
    }}>
      <Sliders size={48} color="#9ca3af" />
      <div style={{ textAlign: 'center' }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: '#111827',
          margin: '0 0 8px 0'
        }}>
          Assessment Configuration
        </h3>
        <p style={{
          fontSize: '14px',
          color: '#6b7280',
          margin: 0
        }}>
          Content coming soon - configure assessment types and rules
        </p>
      </div>
    </div>
  );
}

function LanguagesTab() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '400px',
      flexDirection: 'column',
      gap: '16px'
    }}>
      <Globe size={48} color="#9ca3af" />
      <div style={{ textAlign: 'center' }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: '#111827',
          margin: '0 0 8px 0'
        }}>
          Languages
        </h3>
        <p style={{
          fontSize: '14px',
          color: '#6b7280',
          margin: 0
        }}>
          Content coming soon - manage translations and localization
        </p>
      </div>
    </div>
  );
}

function NotificationsTab() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '400px',
      flexDirection: 'column',
      gap: '16px'
    }}>
      <Mail size={48} color="#9ca3af" />
      <div style={{ textAlign: 'center' }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: '#111827',
          margin: '0 0 8px 0'
        }}>
          Notifications
        </h3>
        <p style={{
          fontSize: '14px',
          color: '#6b7280',
          margin: 0
        }}>
          Content coming soon - email templates and notification settings
        </p>
      </div>
    </div>
  );
}

function BrandingTab() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '400px',
      flexDirection: 'column',
      gap: '16px'
    }}>
      <Edit size={48} color="#9ca3af" />
      <div style={{ textAlign: 'center' }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: '#111827',
          margin: '0 0 8px 0'
        }}>
          Branding
        </h3>
        <p style={{
          fontSize: '14px',
          color: '#6b7280',
          margin: 0
        }}>
          Content coming soon - customize appearance and branding
        </p>
      </div>
    </div>
  );
}

function UserManagementTab() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '400px',
      flexDirection: 'column',
      gap: '16px'
    }}>
      <UserCheck size={48} color="#9ca3af" />
      <div style={{ textAlign: 'center' }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: '#111827',
          margin: '0 0 8px 0'
        }}>
          User Management
        </h3>
        <p style={{
          fontSize: '14px',
          color: '#6b7280',
          margin: 0
        }}>
          Content coming soon - manage admin users and permissions
        </p>
      </div>
    </div>
  );
}

function DataManagementTab() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '400px',
      flexDirection: 'column',
      gap: '16px'
    }}>
      <Download size={48} color="#9ca3af" />
      <div style={{ textAlign: 'center' }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: '#111827',
          margin: '0 0 8px 0'
        }}>
          Data Management
        </h3>
        <p style={{
          fontSize: '14px',
          color: '#6b7280',
          margin: 0
        }}>
          Content coming soon - backup, import, export, and monitoring
        </p>
      </div>
    </div>
  );
}

function SystemConfigTab() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '400px',
      flexDirection: 'column',
      gap: '16px'
    }}>
      <Settings size={48} color="#9ca3af" />
      <div style={{ textAlign: 'center' }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: '#111827',
          margin: '0 0 8px 0'
        }}>
          System Configuration
        </h3>
        <p style={{
          fontSize: '14px',
          color: '#6b7280',
          margin: 0
        }}>
          Content coming soon - general system and security settings
        </p>
      </div>
    </div>
  );
}

// Domains Management Component
function DomainsManagement({ domains, editingDomain, setEditingDomain, onSave }) {
  const [formData, setFormData] = useState({
    id: '',
    name_en: '',
    name_ar: '',
    description_en: '',
    description_ar: '',
    display_order: 0
  });

  useEffect(() => {
    if (editingDomain) {
      setFormData({
        id: editingDomain.id,
        name_en: editingDomain.name_en,
        name_ar: editingDomain.name_ar || '',
        description_en: editingDomain.description_en || '',
        description_ar: editingDomain.description_ar || '',
        display_order: editingDomain.display_order || 0
      });
    } else {
      setFormData({
        id: '',
        name_en: '',
        name_ar: '',
        description_en: '',
        description_ar: '',
        display_order: 0
      });
    }
  }, [editingDomain]);

  const handleSave = () => {
    if (!formData.name_en.trim()) return;
    onSave(formData);
  };

  if (editingDomain) {
    return (
      <div style={{
        backgroundColor: '#f9fafb',
        borderRadius: '8px',
        padding: '24px',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#111827',
            margin: 0
          }}>
            Edit Domain: {editingDomain.name_en}
          </h3>
          <button
            onClick={() => setEditingDomain(null)}
            style={{
              padding: '8px',
              border: 'none',
              backgroundColor: '#e5e7eb',
              borderRadius: '6px',
              cursor: 'pointer',
              color: '#6b7280',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px',
          marginBottom: '24px'
        }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px'
            }}>
              English Name *
            </label>
            <input
              type="text"
              value={formData.name_en}
              onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: 'white'
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Arabic Name
            </label>
            <input
              type="text"
              value={formData.name_ar}
              onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: 'white',
                direction: 'rtl'
              }}
            />
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px',
          marginBottom: '24px'
        }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px'
            }}>
              English Description
            </label>
            <textarea
              value={formData.description_en}
              onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
              rows={3}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: 'white',
                resize: 'vertical'
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Arabic Description
            </label>
            <textarea
              value={formData.description_ar}
              onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
              rows={3}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: 'white',
                resize: 'vertical',
                direction: 'rtl'
              }}
            />
          </div>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px'
        }}>
          <button
            onClick={() => setEditingDomain(null)}
            style={{
              padding: '8px 16px',
              border: '1px solid #d1d5db',
              backgroundColor: 'white',
              color: '#374151',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!formData.name_en.trim()}
            style={{
              padding: '8px 16px',
              border: 'none',
              backgroundColor: formData.name_en.trim() ? '#2563eb' : '#9ca3af',
              color: 'white',
              borderRadius: '6px',
              cursor: formData.name_en.trim() ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Save size={16} />
            Save Changes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px'
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: '#111827',
          margin: 0
        }}>
          Assessment Domains
        </h3>
        <p style={{
          fontSize: '14px',
          color: '#6b7280',
          margin: 0
        }}>
          Manage the main assessment domains
        </p>
      </div>

      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        overflow: 'hidden'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 2fr 1fr 120px',
          gap: '16px',
          padding: '16px 24px',
          backgroundColor: '#f9fafb',
          borderBottom: '1px solid #e5e7eb',
          fontSize: '12px',
          fontWeight: '500',
          color: '#6b7280',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          <div>Domain Name</div>
          <div>Description</div>
          <div>Subdomains</div>
          <div>Actions</div>
        </div>

        {domains.map((domain) => (
          <div
            key={domain.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 2fr 1fr 120px',
              gap: '16px',
              padding: '16px 24px',
              borderBottom: '1px solid #f3f4f6',
              alignItems: 'center'
            }}
          >
            <div>
              <div style={{
                fontWeight: '500',
                color: '#111827',
                marginBottom: '4px'
              }}>
                {domain.name_en}
              </div>
              {domain.name_ar && (
                <div style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  direction: 'rtl'
                }}>
                  {domain.name_ar}
                </div>
              )}
            </div>

            <div>
              <div style={{ fontSize: '14px', color: '#374151' }}>
                {domain.description_en || 'No description'}
              </div>
              {domain.description_ar && (
                <div style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  direction: 'rtl',
                  marginTop: '2px'
                }}>
                  {domain.description_ar}
                </div>
              )}
            </div>

            <div style={{
              fontSize: '14px',
              color: '#6b7280',
              textAlign: 'center'
            }}>
              {domain.subdomain_count} subdomains
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setEditingDomain(domain)}
                style={{
                  padding: '6px 12px',
                  border: '1px solid #d1d5db',
                  backgroundColor: 'white',
                  color: '#374151',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Edit size={12} />
                Edit
              </button>
            </div>
          </div>
        ))}

        {domains.length === 0 && (
          <div style={{
            padding: '48px 24px',
            textAlign: 'center',
            color: '#6b7280'
          }}>
            No domains found
          </div>
        )}
      </div>
    </div>
  );
}

// Maturity Levels Management Component
function MaturityLevelsManagement({ levels, editingLevel, setEditingLevel, onSave, onDelete }) {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    description_ar: '',
    min_score: 0,
    max_score: 0,
    color: '#6b7280',
    display_order: 0
  });

  useEffect(() => {
    if (editingLevel) {
      setFormData({
        id: editingLevel.id,
        name: editingLevel.name,
        description: editingLevel.description || '',
        description_ar: editingLevel.description_ar || '',
        min_score: editingLevel.min_score,
        max_score: editingLevel.max_score,
        color: editingLevel.color || '#6b7280',
        display_order: editingLevel.display_order || 0
      });
    } else {
      setFormData({
        id: '',
        name: '',
        description: '',
        description_ar: '',
        min_score: 0,
        max_score: 0,
        color: '#6b7280',
        display_order: 0
      });
    }
  }, [editingLevel]);

  const handleSave = () => {
    if (!formData.name.trim() || formData.min_score === '' || formData.max_score === '') return;
    onSave(formData);
  };

  if (editingLevel) {
    return (
      <div style={{
        backgroundColor: '#f9fafb',
        borderRadius: '8px',
        padding: '24px',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#111827',
            margin: 0
          }}>
            {editingLevel.id ? `Edit Maturity Level: ${editingLevel.name}` : 'Create New Maturity Level'}
          </h3>
          <button
            onClick={() => setEditingLevel(null)}
            style={{
              padding: '8px',
              border: 'none',
              backgroundColor: '#e5e7eb',
              borderRadius: '6px',
              cursor: 'pointer',
              color: '#6b7280',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px',
          marginBottom: '24px'
        }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: 'white'
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Color
            </label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                style={{
                  width: '40px',
                  height: '36px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              />
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  backgroundColor: 'white'
                }}
              />
            </div>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px',
          marginBottom: '24px'
        }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Description (English)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: 'white',
                resize: 'vertical'
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Description (Arabic)
            </label>
            <textarea
              value={formData.description_ar}
              onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
              rows={3}
              dir="rtl"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: 'white',
                resize: 'vertical'
              }}
            />
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px',
          marginBottom: '24px'
        }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Minimum Score *
            </label>
            <input
              type="number"
              min="0"
              max="5"
              step="0.1"
              value={formData.min_score}
              onChange={(e) => setFormData({ ...formData, min_score: parseFloat(e.target.value) || 0 })}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: 'white'
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Maximum Score *
            </label>
            <input
              type="number"
              min="0"
              max="5"
              step="0.1"
              value={formData.max_score}
              onChange={(e) => setFormData({ ...formData, max_score: parseFloat(e.target.value) || 0 })}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: 'white'
              }}
            />
          </div>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px'
        }}>
          <button
            onClick={() => setEditingLevel(null)}
            style={{
              padding: '8px 16px',
              border: '1px solid #d1d5db',
              backgroundColor: 'white',
              color: '#374151',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!formData.name.trim()}
            style={{
              padding: '8px 16px',
              border: 'none',
              backgroundColor: formData.name.trim() ? '#2563eb' : '#9ca3af',
              color: 'white',
              borderRadius: '6px',
              cursor: formData.name.trim() ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Save size={16} />
            {editingLevel.id ? 'Save Changes' : 'Create Level'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px'
      }}>
        <div>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#111827',
            margin: 0,
            marginBottom: '4px'
          }}>
            Maturity Levels
          </h3>
          <p style={{
            fontSize: '14px',
            color: '#6b7280',
            margin: 0
          }}>
            Configure scoring thresholds and maturity level definitions
          </p>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '16px'
      }}>
        {levels.map((level) => (
          <div
            key={level.id}
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              padding: '20px',
              transition: 'box-shadow 0.2s',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}
            onMouseOut={(e) => e.currentTarget.style.boxShadow = 'none'}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    backgroundColor: level.color
                  }}
                />
                <h4 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#111827',
                  margin: 0
                }}>
                  {level.name}
                </h4>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setEditingLevel(level)}
                  style={{
                    padding: '6px',
                    border: 'none',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    color: '#6b7280',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#e5e7eb'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                >
                  <Edit size={14} />
                </button>
                <button
                  onClick={() => onDelete(level.id)}
                  style={{
                    padding: '6px',
                    border: 'none',
                    backgroundColor: '#fef2f2',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    color: '#dc2626',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#fee2e2'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#fef2f2'}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            <p style={{
              fontSize: '14px',
              color: '#6b7280',
              marginBottom: '16px',
              lineHeight: '1.5'
            }}>
              {level.description}
            </p>

            <div style={{
              backgroundColor: '#f9fafb',
              borderRadius: '6px',
              padding: '12px',
              fontSize: '12px',
              color: '#374151'
            }}>
              <strong>Score Range:</strong> {level.min_score} - {level.max_score}
            </div>
          </div>
        ))}
      </div>

      {levels.length === 0 && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          padding: '48px 24px',
          textAlign: 'center',
          color: '#6b7280'
        }}>
          No maturity levels found
        </div>
      )}
    </div>
  );
}

// Questions Management Component
function QuestionsManagement() {
  const [questions, setQuestions] = useState([]);
  const [subdomains, setSubdomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [subdomainFilter, setSubdomainFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchSubdomains();
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [currentPage, subdomainFilter, priorityFilter, searchTerm]);

  const fetchSubdomains = async () => {
    try {
      const res = await fetch('/api/admin/subdomains');
      const data = await res.json();
      if (data.success) {
        setSubdomains(data.subdomains);
      }
    } catch (error) {
      console.error('Error fetching subdomains:', error);
    }
  };

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', itemsPerPage.toString());
      if (subdomainFilter !== 'all') params.append('subdomain', subdomainFilter);
      if (priorityFilter !== 'all') params.append('priority', priorityFilter);
      if (searchTerm) params.append('search', searchTerm);

      const res = await fetch(`/api/admin/questions?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setQuestions(data.questions);
        setTotalPages(data.pagination.totalPages);
        setTotalQuestions(data.pagination.total);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (questionData) => {
    try {
      const method = editingQuestion.id ? 'PUT' : 'POST';
      const res = await fetch('/api/admin/questions', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(questionData)
      });

      const data = await res.json();
      if (data.success) {
        setEditingQuestion(null);
        fetchQuestions();
      }
    } catch (error) {
      console.error('Error saving question:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this question? This will also delete all its answer options.')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/questions?id=${id}`, {
        method: 'DELETE'
      });

      const data = await res.json();
      if (data.success) {
        fetchQuestions();
      }
    } catch (error) {
      console.error('Error deleting question:', error);
    }
  };

  if (loading) {
    return <div style={{ padding: '24px', textAlign: 'center' }}>Loading questions...</div>;
  }

  if (editingQuestion) {
    return (
      <QuestionEditor
        question={editingQuestion}
        subdomains={subdomains}
        onSave={handleSave}
        onCancel={() => setEditingQuestion(null)}
      />
    );
  }

  return (
    <div>
      {/* Filters and Search */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 200px 200px 150px',
        gap: '12px',
        marginBottom: '24px'
      }}>
        <input
          type="text"
          placeholder="Search questions..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          style={{
            padding: '10px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px'
          }}
        />

        <select
          value={subdomainFilter}
          onChange={(e) => {
            setSubdomainFilter(e.target.value);
            setCurrentPage(1);
          }}
          style={{
            padding: '10px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px',
            backgroundColor: 'white'
          }}
        >
          <option value="all">All Subdomains</option>
          {subdomains.map((sd) => (
            <option key={sd.id} value={sd.id}>{sd.name_en}</option>
          ))}
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => {
            setPriorityFilter(e.target.value);
            setCurrentPage(1);
          }}
          style={{
            padding: '10px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px',
            backgroundColor: 'white'
          }}
        >
          <option value="all">All Priorities</option>
          <option value="1">Quick Assessment</option>
          <option value="0">Full Assessment Only</option>
        </select>

        <button
          onClick={() => setEditingQuestion({ id: '', title_en: '', title_ar: '', text_en: '', text_ar: '', scenario_en: '', scenario_ar: '', subdomain_id: '', priority: 0, display_order: totalQuestions + 1, icon: '❓' })}
          style={{
            padding: '10px 16px',
            backgroundColor: '#0066cc',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <Plus size={16} />
          Add Question
        </button>
      </div>

      {/* Stats */}
      <div style={{
        marginBottom: '16px',
        fontSize: '14px',
        color: '#6b7280'
      }}>
        Showing {questions.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0} to {Math.min(currentPage * itemsPerPage, totalQuestions)} of {totalQuestions} questions
      </div>

      {/* Questions Table */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', width: '60px' }}>ID</th>
              <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Question</th>
              <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', width: '180px' }}>Subdomain</th>
              <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#6b7280', width: '100px' }}>Priority</th>
              <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#6b7280', width: '80px' }}>Order</th>
              <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#6b7280', width: '120px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {questions.map((question) => (
              <tr key={question.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '12px', fontSize: '13px', color: '#111827', fontFamily: 'monospace' }}>
                  {question.id}
                </td>
                <td style={{ padding: '12px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827', marginBottom: '4px' }}>
                    {question.icon} {question.title_en}
                  </div>
                  <div style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.4' }}>
                    {question.text_en.substring(0, 80)}{question.text_en.length > 80 ? '...' : ''}
                  </div>
                </td>
                <td style={{ padding: '12px', fontSize: '13px', color: '#6b7280' }}>
                  {question.subdomain_name_en}
                </td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '500',
                    backgroundColor: question.priority === 1 ? '#dbeafe' : '#f3f4f6',
                    color: question.priority === 1 ? '#1e40af' : '#6b7280'
                  }}>
                    {question.priority === 1 ? 'Quick' : 'Full'}
                  </span>
                </td>
                <td style={{ padding: '12px', textAlign: 'center', fontSize: '13px', color: '#6b7280' }}>
                  {question.display_order}
                </td>
                <td style={{ padding: '12px', textAlign: 'right' }}>
                  <button
                    onClick={() => setEditingQuestion(question)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#f3f4f6',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      color: '#374151',
                      marginRight: '8px'
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(question.id)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#fee2e2',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      color: '#991b1b'
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {questions.length === 0 && (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: '#6b7280' }}>
            No questions found
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '8px',
          marginTop: '24px'
        }}>
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            style={{
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              backgroundColor: currentPage === 1 ? '#f3f4f6' : 'white',
              color: currentPage === 1 ? '#9ca3af' : '#374151',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              fontSize: '14px'
            }}
          >
            Previous
          </button>

          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }

            return (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  backgroundColor: currentPage === pageNum ? '#0066cc' : 'white',
                  color: currentPage === pageNum ? 'white' : '#374151',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: currentPage === pageNum ? '600' : '400'
                }}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            style={{
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              backgroundColor: currentPage === totalPages ? '#f3f4f6' : 'white',
              color: currentPage === totalPages ? '#9ca3af' : '#374151',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              fontSize: '14px'
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

// Question Editor Component
function QuestionEditor({ question, subdomains, onSave, onCancel }) {
  const [formData, setFormData] = useState(question);

  const handleSubmit = () => {
    if (!formData.id || !formData.title_en || !formData.text_en) {
      alert('ID, English title, and English text are required');
      return;
    }
    onSave(formData);
  };

  return (
    <div style={{
      backgroundColor: '#f9fafb',
      borderRadius: '8px',
      padding: '24px',
      border: '1px solid #e5e7eb'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px'
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: '#111827',
          margin: 0
        }}>
          {question.id ? `Edit Question: ${question.id}` : 'Create New Question'}
        </h3>
        <button
          onClick={onCancel}
          style={{
            padding: '8px',
            border: 'none',
            backgroundColor: '#e5e7eb',
            borderRadius: '6px',
            cursor: 'pointer',
            color: '#6b7280'
          }}
        >
          <X size={16} />
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr 1fr',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
            Question ID *
          </label>
          <input
            type="text"
            value={formData.id}
            onChange={(e) => setFormData({ ...formData, id: e.target.value })}
            disabled={!!question.id}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              backgroundColor: question.id ? '#f3f4f6' : 'white'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
            Subdomain *
          </label>
          <select
            value={formData.subdomain_id}
            onChange={(e) => setFormData({ ...formData, subdomain_id: e.target.value })}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              backgroundColor: 'white'
            }}
          >
            <option value="">Select subdomain</option>
            {subdomains.map((sd) => (
              <option key={sd.id} value={sd.id}>{sd.name_en}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
            Priority
          </label>
          <select
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              backgroundColor: 'white'
            }}
          >
            <option value="0">Full Only</option>
            <option value="1">Quick</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
            Display Order
          </label>
          <input
            type="number"
            value={formData.display_order}
            onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px',
        marginBottom: '16px'
      }}>
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
            Title (English) *
          </label>
          <input
            type="text"
            value={formData.title_en}
            onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
            Title (Arabic)
          </label>
          <input
            type="text"
            value={formData.title_ar}
            onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
            dir="rtl"
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px',
        marginBottom: '16px'
      }}>
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
            Question Text (English) *
          </label>
          <textarea
            value={formData.text_en}
            onChange={(e) => setFormData({ ...formData, text_en: e.target.value })}
            rows={3}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              resize: 'vertical'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
            Question Text (Arabic)
          </label>
          <textarea
            value={formData.text_ar}
            onChange={(e) => setFormData({ ...formData, text_ar: e.target.value })}
            rows={3}
            dir="rtl"
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              resize: 'vertical'
            }}
          />
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
            Scenario (English)
          </label>
          <textarea
            value={formData.scenario_en}
            onChange={(e) => setFormData({ ...formData, scenario_en: e.target.value })}
            rows={3}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              resize: 'vertical'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
            Scenario (Arabic)
          </label>
          <textarea
            value={formData.scenario_ar}
            onChange={(e) => setFormData({ ...formData, scenario_ar: e.target.value })}
            rows={3}
            dir="rtl"
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              resize: 'vertical'
            }}
          />
        </div>
      </div>

      <div style={{
        display: 'flex',
        gap: '12px',
        justifyContent: 'flex-end'
      }}>
        <button
          onClick={onCancel}
          style={{
            padding: '10px 20px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            backgroundColor: 'white',
            color: '#374151',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          style={{
            padding: '10px 20px',
            border: 'none',
            borderRadius: '6px',
            backgroundColor: '#0066cc',
            color: 'white',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          <Save size={16} style={{ marginRight: '8px', display: 'inline', verticalAlign: 'middle' }} />
          Save Question
        </button>
      </div>
    </div>
  );
}

// Answer Options Configuration Component
function AnswerOptionsConfig() {
  const [questions, setQuestions] = useState([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState('');
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingOption, setEditingOption] = useState(null);

  useEffect(() => {
    fetchQuestions();
  }, []);

  useEffect(() => {
    if (selectedQuestionId) {
      fetchOptions();
    }
  }, [selectedQuestionId]);

  const fetchQuestions = async () => {
    try {
      const res = await fetch('/api/admin/questions?page=1&limit=1000');
      const data = await res.json();
      if (data.success) {
        setQuestions(data.questions);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  };

  const fetchOptions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/question-options?question_id=${selectedQuestionId}`);
      const data = await res.json();
      if (data.success) {
        setOptions(data.options);
      }
    } catch (error) {
      console.error('Error fetching options:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (optionData) => {
    try {
      const method = editingOption?.id ? 'PUT' : 'POST';
      const res = await fetch('/api/admin/question-options', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(optionData)
      });

      const data = await res.json();
      if (data.success) {
        setEditingOption(null);
        fetchOptions();
      }
    } catch (error) {
      console.error('Error saving option:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this option?')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/question-options?id=${id}`, {
        method: 'DELETE'
      });

      const data = await res.json();
      if (data.success) {
        fetchOptions();
      }
    } catch (error) {
      console.error('Error deleting option:', error);
    }
  };

  const getScoreBadgeColor = (score) => {
    if (score === 0) return { bg: '#f3f4f6', text: '#6b7280' };
    if (score === 1) return { bg: '#fee2e2', text: '#991b1b' };
    if (score === 2) return { bg: '#fed7aa', text: '#9a3412' };
    if (score === 3) return { bg: '#fef08a', text: '#854d0e' };
    if (score === 4) return { bg: '#bbf7d0', text: '#166534' };
    if (score === 5) return { bg: '#bfdbfe', text: '#1e40af' };
    return { bg: '#f3f4f6', text: '#6b7280' };
  };

  if (editingOption) {
    return (
      <OptionEditor
        option={editingOption}
        questionId={selectedQuestionId}
        onSave={handleSave}
        onCancel={() => setEditingOption(null)}
      />
    );
  }

  return (
    <div>
      {/* Question Selector */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: '500',
          color: '#374151',
          marginBottom: '8px'
        }}>
          Select Question
        </label>
        <select
          value={selectedQuestionId}
          onChange={(e) => setSelectedQuestionId(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px',
            backgroundColor: 'white'
          }}
        >
          <option value="">Choose a question...</option>
          {questions.map((q) => (
            <option key={q.id} value={q.id}>
              {q.id} - {q.title_en}
            </option>
          ))}
        </select>
      </div>

      {!selectedQuestionId ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '300px',
          flexDirection: 'column',
          gap: '12px',
          color: '#9ca3af'
        }}>
          <HelpCircle size={48} />
          <p style={{ fontSize: '14px', margin: 0 }}>
            Select a question to manage its answer options
          </p>
        </div>
      ) : loading ? (
        <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>
          Loading options...
        </div>
      ) : (
        <>
          {/* Add Option Button */}
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>
              {options.length} options for this question
            </div>
            <button
              onClick={() => setEditingOption({
                id: '',
                question_id: selectedQuestionId,
                option_key: '',
                option_text_en: '',
                option_text_ar: '',
                score_value: 0,
                maturity_level: '',
                explanation_en: '',
                explanation_ar: '',
                display_order: options.length + 1
              })}
              style={{
                padding: '8px 16px',
                backgroundColor: '#0066cc',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Plus size={16} />
              Add Option
            </button>
          </div>

          {/* Options List */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            overflow: 'hidden'
          }}>
            {options.length === 0 ? (
              <div style={{ padding: '48px 24px', textAlign: 'center', color: '#6b7280' }}>
                No options found. Click "Add Option" to create the first one.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', width: '80px' }}>Key</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Option Text (English)</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#6b7280', width: '80px' }}>Score</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', width: '140px' }}>Maturity Level</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#6b7280', width: '70px' }}>Order</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#6b7280', width: '120px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {options.map((option) => {
                    const scoreColors = getScoreBadgeColor(option.score_value);
                    return (
                      <tr key={option.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '600',
                            backgroundColor: '#f3f4f6',
                            color: '#374151',
                            fontFamily: 'monospace'
                          }}>
                            {option.option_key}
                          </span>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontSize: '14px', color: '#111827', marginBottom: '4px' }}>
                            {option.option_text_en}
                          </div>
                          {option.option_text_ar && (
                            <div style={{ fontSize: '13px', color: '#6b7280', direction: 'rtl' }}>
                              {option.option_text_ar}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '4px',
                            fontSize: '13px',
                            fontWeight: '600',
                            backgroundColor: scoreColors.bg,
                            color: scoreColors.text
                          }}>
                            {option.score_value}
                          </span>
                        </td>
                        <td style={{ padding: '12px', fontSize: '13px', color: '#6b7280' }}>
                          {option.maturity_level || '-'}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center', fontSize: '13px', color: '#6b7280' }}>
                          {option.display_order}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          <button
                            onClick={() => setEditingOption(option)}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#f3f4f6',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '13px',
                              color: '#374151',
                              marginRight: '8px'
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(option.id)}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#fee2e2',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '13px',
                              color: '#991b1b'
                            }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// Option Editor Component
function OptionEditor({ option, questionId, onSave, onCancel }) {
  const [formData, setFormData] = useState(option);

  const handleSubmit = () => {
    if (!formData.option_key || !formData.option_text_en) {
      alert('Option key and English text are required');
      return;
    }
    onSave(formData);
  };

  const maturityLevels = [
    'Not Applicable',
    'Not Sure',
    'Initial',
    'Developing',
    'Defined',
    'Advanced',
    'Optimized'
  ];

  return (
    <div style={{
      backgroundColor: '#f9fafb',
      borderRadius: '8px',
      padding: '24px',
      border: '1px solid #e5e7eb'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px'
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: '#111827',
          margin: 0
        }}>
          {option.id ? `Edit Option: ${option.id}` : 'Create New Option'}
        </h3>
        <button
          onClick={onCancel}
          style={{
            padding: '8px',
            border: 'none',
            backgroundColor: '#e5e7eb',
            borderRadius: '6px',
            cursor: 'pointer',
            color: '#6b7280'
          }}
        >
          <X size={16} />
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr 1fr',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
            Option Key * (A, B, C, D, E, NA, NS)
          </label>
          <input
            type="text"
            value={formData.option_key}
            onChange={(e) => setFormData({ ...formData, option_key: e.target.value.toUpperCase() })}
            disabled={!!option.id}
            maxLength={3}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              backgroundColor: option.id ? '#f3f4f6' : 'white',
              textTransform: 'uppercase'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
            Score Value * (0-5)
          </label>
          <input
            type="number"
            min="0"
            max="5"
            value={formData.score_value}
            onChange={(e) => setFormData({ ...formData, score_value: parseInt(e.target.value) || 0 })}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
            Maturity Level
          </label>
          <select
            value={formData.maturity_level}
            onChange={(e) => setFormData({ ...formData, maturity_level: e.target.value })}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              backgroundColor: 'white'
            }}
          >
            <option value="">Select level...</option>
            {maturityLevels.map((level) => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
            Display Order
          </label>
          <input
            type="number"
            value={formData.display_order}
            onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px',
        marginBottom: '16px'
      }}>
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
            Option Text (English) *
          </label>
          <textarea
            value={formData.option_text_en}
            onChange={(e) => setFormData({ ...formData, option_text_en: e.target.value })}
            rows={3}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              resize: 'vertical'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
            Option Text (Arabic)
          </label>
          <textarea
            value={formData.option_text_ar}
            onChange={(e) => setFormData({ ...formData, option_text_ar: e.target.value })}
            rows={3}
            dir="rtl"
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              resize: 'vertical'
            }}
          />
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
            Explanation (English)
          </label>
          <textarea
            value={formData.explanation_en}
            onChange={(e) => setFormData({ ...formData, explanation_en: e.target.value })}
            rows={2}
            placeholder="Optional explanation for this option"
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              resize: 'vertical'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
            Explanation (Arabic)
          </label>
          <textarea
            value={formData.explanation_ar}
            onChange={(e) => setFormData({ ...formData, explanation_ar: e.target.value })}
            rows={2}
            dir="rtl"
            placeholder="شرح اختياري لهذا الخيار"
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              resize: 'vertical'
            }}
          />
        </div>
      </div>

      <div style={{
        display: 'flex',
        gap: '12px',
        justifyContent: 'flex-end'
      }}>
        <button
          onClick={onCancel}
          style={{
            padding: '10px 20px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            backgroundColor: 'white',
            color: '#374151',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          style={{
            padding: '10px 20px',
            border: 'none',
            borderRadius: '6px',
            backgroundColor: '#0066cc',
            color: 'white',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          <Save size={16} style={{ marginRight: '8px', display: 'inline', verticalAlign: 'middle' }} />
          Save Option
        </button>
      </div>
    </div>
  );
}

function SubdomainMapping() {
  const [domains, setDomains] = useState([]);
  const [subdomains, setSubdomains] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubdomain, setSelectedSubdomain] = useState(null);
  const [reassignQuestion, setReassignQuestion] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [domainsRes, subdomainsRes, questionsRes] = await Promise.all([
        fetch('/api/admin/domains'),
        fetch('/api/admin/subdomains'),
        fetch('/api/admin/questions?page=1&limit=1000')
      ]);

      const domainsData = await domainsRes.json();
      const subdomainsData = await subdomainsRes.json();
      const questionsData = await questionsRes.json();

      if (domainsData.success) setDomains(domainsData.domains);
      if (subdomainsData.success) setSubdomains(subdomainsData.subdomains);
      if (questionsData.success) setQuestions(questionsData.questions);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReassign = async (questionId, newSubdomainId) => {
    try {
      const question = questions.find(q => q.id === questionId);
      const res = await fetch('/api/admin/questions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...question,
          subdomain_id: newSubdomainId
        })
      });

      const data = await res.json();
      if (data.success) {
        setReassignQuestion(null);
        fetchData();
      }
    } catch (error) {
      console.error('Error reassigning question:', error);
    }
  };

  const getQuestionsBySubdomain = (subdomainId) => {
    return questions.filter(q => q.subdomain_id === subdomainId);
  };

  const getSubdomainsByDomain = (domainId) => {
    return subdomains.filter(s => s.domain_id === domainId);
  };

  if (loading) {
    return <div style={{ padding: '24px', textAlign: 'center' }}>Loading mapping data...</div>;
  }

  if (reassignQuestion) {
    return (
      <div style={{
        backgroundColor: '#f9fafb',
        borderRadius: '8px',
        padding: '24px',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#111827',
            margin: 0
          }}>
            Reassign Question: {reassignQuestion.id}
          </h3>
          <button
            onClick={() => setReassignQuestion(null)}
            style={{
              padding: '8px',
              border: 'none',
              backgroundColor: '#e5e7eb',
              borderRadius: '6px',
              cursor: 'pointer',
              color: '#6b7280'
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827', marginBottom: '4px' }}>
            {reassignQuestion.title_en}
          </div>
          <div style={{ fontSize: '13px', color: '#6b7280' }}>
            Current subdomain: {reassignQuestion.subdomain_name_en}
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '8px'
          }}>
            Select New Subdomain
          </label>
          <select
            onChange={(e) => {
              if (e.target.value) {
                handleReassign(reassignQuestion.id, e.target.value);
              }
            }}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              backgroundColor: 'white'
            }}
          >
            <option value="">Choose subdomain...</option>
            {domains.map((domain) => (
              <optgroup key={domain.id} label={domain.name_en}>
                {getSubdomainsByDomain(domain.id).map((subdomain) => (
                  <option key={subdomain.id} value={subdomain.id}>
                    {subdomain.name_en} ({getQuestionsBySubdomain(subdomain.id).length} questions)
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Total Questions</div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#111827' }}>{questions.length}</div>
        </div>
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Total Subdomains</div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#111827' }}>{subdomains.length}</div>
        </div>
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Avg per Subdomain</div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#111827' }}>
            {(questions.length / subdomains.length).toFixed(1)}
          </div>
        </div>
      </div>

      {/* Mapping Matrix */}
      {domains.map((domain) => {
        const domainSubdomains = getSubdomainsByDomain(domain.id);

        return (
          <div key={domain.id} style={{ marginBottom: '32px' }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#111827',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                width: '8px',
                height: '32px',
                backgroundColor: '#0066cc',
                borderRadius: '4px'
              }} />
              {domain.name_en}
              <span style={{ fontSize: '14px', fontWeight: '400', color: '#6b7280' }}>
                ({domainSubdomains.reduce((sum, s) => sum + getQuestionsBySubdomain(s.id).length, 0)} questions)
              </span>
            </h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
              gap: '16px'
            }}>
              {domainSubdomains.map((subdomain) => {
                const subdomainQuestions = getQuestionsBySubdomain(subdomain.id);
                const isSelected = selectedSubdomain === subdomain.id;

                return (
                  <div
                    key={subdomain.id}
                    onClick={() => setSelectedSubdomain(isSelected ? null : subdomain.id)}
                    style={{
                      backgroundColor: 'white',
                      border: isSelected ? '2px solid #0066cc' : '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '16px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '12px'
                    }}>
                      <div>
                        <div style={{
                          fontSize: '15px',
                          fontWeight: '600',
                          color: '#111827',
                          marginBottom: '4px'
                        }}>
                          {subdomain.name_en}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280', direction: 'rtl' }}>
                          {subdomain.name_ar}
                        </div>
                      </div>
                      <div style={{
                        backgroundColor: subdomainQuestions.length === 0 ? '#fee2e2' : '#dbeafe',
                        color: subdomainQuestions.length === 0 ? '#991b1b' : '#1e40af',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '13px',
                        fontWeight: '600'
                      }}>
                        {subdomainQuestions.length}
                      </div>
                    </div>

                    {isSelected && subdomainQuestions.length > 0 && (
                      <div style={{
                        borderTop: '1px solid #e5e7eb',
                        paddingTop: '12px',
                        marginTop: '12px'
                      }}>
                        <div style={{ fontSize: '13px', fontWeight: '500', color: '#6b7280', marginBottom: '8px' }}>
                          Questions in this subdomain:
                        </div>
                        {subdomainQuestions.map((q) => (
                          <div
                            key={q.id}
                            style={{
                              padding: '8px',
                              backgroundColor: '#f9fafb',
                              borderRadius: '4px',
                              marginBottom: '6px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              <div style={{
                                fontSize: '12px',
                                fontWeight: '600',
                                color: '#374151',
                                fontFamily: 'monospace'
                              }}>
                                {q.id}
                              </div>
                              <div style={{ fontSize: '13px', color: '#6b7280' }}>
                                {q.title_en.substring(0, 50)}{q.title_en.length > 50 ? '...' : ''}
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setReassignQuestion(q);
                              }}
                              style={{
                                padding: '4px 8px',
                                backgroundColor: 'white',
                                border: '1px solid #d1d5db',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '11px',
                                color: '#374151',
                                marginLeft: '8px'
                              }}
                            >
                              Move
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {isSelected && subdomainQuestions.length === 0 && (
                      <div style={{
                        borderTop: '1px solid #e5e7eb',
                        paddingTop: '12px',
                        marginTop: '12px',
                        textAlign: 'center',
                        color: '#9ca3af',
                        fontSize: '13px'
                      }}>
                        No questions assigned to this subdomain
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Unassigned Questions */}
      {questions.filter(q => !q.subdomain_id).length > 0 && (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '20px',
          marginTop: '24px'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#991b1b',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={20} />
            Unassigned Questions ({questions.filter(q => !q.subdomain_id).length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {questions.filter(q => !q.subdomain_id).map((q) => (
              <div
                key={q.id}
                style={{
                  padding: '12px',
                  backgroundColor: 'white',
                  borderRadius: '6px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#374151',
                    fontFamily: 'monospace',
                    marginBottom: '4px'
                  }}>
                    {q.id}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>
                    {q.title_en}
                  </div>
                </div>
                <button
                  onClick={() => setReassignQuestion(q)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#0066cc',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '500'
                  }}
                >
                  Assign to Subdomain
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ImportExport() {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importResults, setImportResults] = useState(null);

  const handleExportQuestions = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/admin/questions?page=1&limit=1000');
      const data = await res.json();

      if (data.success) {
        const questions = data.questions;

        // Create CSV content
        const headers = [
          'ID',
          'Subdomain ID',
          'Title (EN)',
          'Title (AR)',
          'Text (EN)',
          'Text (AR)',
          'Scenario (EN)',
          'Scenario (AR)',
          'Icon',
          'Display Order',
          'Priority'
        ];

        const csvRows = [headers.join(',')];

        questions.forEach((q) => {
          const row = [
            q.id,
            q.subdomain_id || '',
            `"${(q.title_en || '').replace(/"/g, '""')}"`,
            `"${(q.title_ar || '').replace(/"/g, '""')}"`,
            `"${(q.text_en || '').replace(/"/g, '""')}"`,
            `"${(q.text_ar || '').replace(/"/g, '""')}"`,
            `"${(q.scenario_en || '').replace(/"/g, '""')}"`,
            `"${(q.scenario_ar || '').replace(/"/g, '""')}"`,
            q.icon || '',
            q.display_order || 0,
            q.priority || 0
          ];
          csvRows.push(row.join(','));
        });

        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `questions_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Error exporting questions:', error);
      alert('Failed to export questions');
    } finally {
      setExporting(false);
    }
  };

  const handleExportOptions = async () => {
    setExporting(true);
    try {
      // Get all questions first
      const questionsRes = await fetch('/api/admin/questions?page=1&limit=1000');
      const questionsData = await questionsRes.json();

      if (!questionsData.success) {
        throw new Error('Failed to fetch questions');
      }

      // Fetch options for all questions
      const allOptions = [];
      for (const question of questionsData.questions) {
        const optionsRes = await fetch(`/api/admin/question-options?question_id=${question.id}`);
        const optionsData = await optionsRes.json();
        if (optionsData.success) {
          allOptions.push(...optionsData.options);
        }
      }

      // Create CSV content
      const headers = [
        'ID',
        'Question ID',
        'Option Key',
        'Text (EN)',
        'Text (AR)',
        'Score Value',
        'Maturity Level',
        'Explanation (EN)',
        'Explanation (AR)',
        'Display Order'
      ];

      const csvRows = [headers.join(',')];

      allOptions.forEach((opt) => {
        const row = [
          opt.id,
          opt.question_id,
          opt.option_key,
          `"${(opt.option_text_en || '').replace(/"/g, '""')}"`,
          `"${(opt.option_text_ar || '').replace(/"/g, '""')}"`,
          opt.score_value,
          opt.maturity_level || '',
          `"${(opt.explanation_en || '').replace(/"/g, '""')}"`,
          `"${(opt.explanation_ar || '').replace(/"/g, '""')}"`,
          opt.display_order || 0
        ];
        csvRows.push(row.join(','));
      });

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', `question_options_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting options:', error);
      alert('Failed to export question options');
    } finally {
      setExporting(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        alert('Please select a CSV file');
        return;
      }
      setImportFile(file);
      setImportResults(null);
    }
  };

  const handleImportQuestions = async () => {
    if (!importFile) {
      alert('Please select a file first');
      return;
    }

    setImporting(true);
    try {
      const text = await importFile.text();
      const lines = text.split('\n').filter(line => line.trim());

      if (lines.length < 2) {
        alert('CSV file is empty or invalid');
        return;
      }

      // Skip header row
      const dataRows = lines.slice(1);
      let success = 0;
      let failed = 0;
      const errors = [];

      for (const line of dataRows) {
        try {
          // Parse CSV line (handle quoted fields)
          const values = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g).map(v =>
            v.trim().replace(/^"|"$/g, '').replace(/""/g, '"')
          );

          if (values.length < 11) {
            failed++;
            errors.push(`Row has insufficient columns: ${line.substring(0, 50)}`);
            continue;
          }

          const questionData = {
            id: values[0],
            subdomain_id: values[1],
            title_en: values[2],
            title_ar: values[3],
            text_en: values[4],
            text_ar: values[5],
            scenario_en: values[6],
            scenario_ar: values[7],
            icon: values[8],
            display_order: parseInt(values[9]) || 0,
            priority: parseInt(values[10]) || 0
          };

          const res = await fetch('/api/admin/questions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(questionData)
          });

          if (res.ok) {
            success++;
          } else {
            failed++;
            errors.push(`Failed to import ${questionData.id}`);
          }
        } catch (err) {
          failed++;
          errors.push(`Error parsing row: ${err.message}`);
        }
      }

      setImportResults({ success, failed, errors: errors.slice(0, 10) });
    } catch (error) {
      console.error('Error importing questions:', error);
      alert('Failed to import questions');
    } finally {
      setImporting(false);
      setImportFile(null);
    }
  };

  const downloadTemplate = () => {
    const headers = [
      'ID',
      'Subdomain ID',
      'Title (EN)',
      'Title (AR)',
      'Text (EN)',
      'Text (AR)',
      'Scenario (EN)',
      'Scenario (AR)',
      'Icon',
      'Display Order',
      'Priority'
    ];

    const exampleRow = [
      'Q100',
      'STRATEGY',
      'Example Question Title',
      'عنوان السؤال المثال',
      'This is an example question text',
      'هذا نص سؤال مثال',
      'Example scenario description',
      'وصف السيناريو المثال',
      '📊',
      '100',
      '1'
    ];

    const csvContent = [headers.join(','), exampleRow.join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', 'questions_import_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      {/* Export Section */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '24px',
        border: '1px solid #e5e7eb',
        marginBottom: '24px'
      }}>
        <h3 style={{
          fontSize: '16px',
          fontWeight: '600',
          color: '#111827',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Download size={20} />
          Export Data
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px'
        }}>
          <div style={{
            padding: '16px',
            backgroundColor: '#f9fafb',
            borderRadius: '6px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827', marginBottom: '8px' }}>
              Export Questions
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px' }}>
              Download all questions with their metadata to CSV format
            </div>
            <button
              onClick={handleExportQuestions}
              disabled={exporting}
              style={{
                padding: '10px 16px',
                backgroundColor: exporting ? '#9ca3af' : '#0066cc',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: exporting ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <Download size={16} />
              {exporting ? 'Exporting...' : 'Export Questions'}
            </button>
          </div>

          <div style={{
            padding: '16px',
            backgroundColor: '#f9fafb',
            borderRadius: '6px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827', marginBottom: '8px' }}>
              Export Question Options
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px' }}>
              Download all answer options for all questions to CSV format
            </div>
            <button
              onClick={handleExportOptions}
              disabled={exporting}
              style={{
                padding: '10px 16px',
                backgroundColor: exporting ? '#9ca3af' : '#0066cc',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: exporting ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <Download size={16} />
              {exporting ? 'Exporting...' : 'Export Options'}
            </button>
          </div>
        </div>
      </div>

      {/* Import Section */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '24px',
        border: '1px solid #e5e7eb'
      }}>
        <h3 style={{
          fontSize: '16px',
          fontWeight: '600',
          color: '#111827',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Upload size={20} />
          Import Questions
        </h3>

        <div style={{
          backgroundColor: '#fef3c7',
          border: '1px solid #fcd34d',
          borderRadius: '6px',
          padding: '12px',
          marginBottom: '16px',
          fontSize: '13px',
          color: '#92400e'
        }}>
          <strong>⚠️ Warning:</strong> Importing questions will create new entries. Make sure your CSV follows the correct format.
        </div>

        <div style={{ marginBottom: '16px' }}>
          <button
            onClick={downloadTemplate}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f3f4f6',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Download size={16} />
            Download CSV Template
          </button>
        </div>

        <div style={{
          border: '2px dashed #d1d5db',
          borderRadius: '8px',
          padding: '32px',
          textAlign: 'center',
          marginBottom: '16px',
          backgroundColor: '#f9fafb'
        }}>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            style={{ display: 'none' }}
            id="csvFileInput"
          />
          <label
            htmlFor="csvFileInput"
            style={{
              cursor: 'pointer',
              display: 'inline-flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <Upload size={40} color="#9ca3af" />
            <div style={{ fontSize: '14px', color: '#6b7280' }}>
              {importFile ? (
                <span style={{ color: '#111827', fontWeight: '500' }}>{importFile.name}</span>
              ) : (
                <>Click to select CSV file or drag and drop</>
              )}
            </div>
            <div style={{ fontSize: '12px', color: '#9ca3af' }}>
              CSV files only
            </div>
          </label>
        </div>

        {importFile && (
          <button
            onClick={handleImportQuestions}
            disabled={importing}
            style={{
              padding: '12px 24px',
              backgroundColor: importing ? '#9ca3af' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: importing ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <CheckCircle size={16} />
            {importing ? 'Importing...' : 'Import Questions'}
          </button>
        )}

        {/* Import Results */}
        {importResults && (
          <div style={{
            marginTop: '16px',
            padding: '16px',
            backgroundColor: importResults.failed > 0 ? '#fef2f2' : '#f0fdf4',
            border: `1px solid ${importResults.failed > 0 ? '#fecaca' : '#bbf7d0'}`,
            borderRadius: '6px'
          }}>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
              Import Complete
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px' }}>
              <div>✅ Successfully imported: {importResults.success} questions</div>
              {importResults.failed > 0 && (
                <div style={{ color: '#991b1b' }}>❌ Failed: {importResults.failed} questions</div>
              )}
            </div>
            {importResults.errors.length > 0 && (
              <div>
                <div style={{ fontSize: '13px', fontWeight: '500', color: '#111827', marginBottom: '4px' }}>
                  Errors (showing first 10):
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  maxHeight: '150px',
                  overflowY: 'auto',
                  fontFamily: 'monospace'
                }}>
                  {importResults.errors.map((err, i) => (
                    <div key={i} style={{ marginBottom: '2px' }}>• {err}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}