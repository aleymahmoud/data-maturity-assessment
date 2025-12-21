'use client';

import { useState } from 'react';
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
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

// Import tab components
import { DomainsMaturityTab } from './components/tabs/DomainsMaturityTab';
import { QuestionsOptionsTab } from './components/tabs/QuestionsOptionsTab';
import { RolesSubdomainsTab } from './components/tabs/RolesSubdomainsTab';
import {
  LanguagesTab,
  NotificationsTab,
  BrandingTab,
  UserManagementTab,
  DataManagementTab,
  SystemConfigTab
} from './components/tabs/PlaceholderTabs';

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
