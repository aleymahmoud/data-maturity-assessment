'use client';

import { Globe, Mail, Edit, UserCheck, Download, Settings } from 'lucide-react';

const placeholderStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '400px',
  flexDirection: 'column' as const,
  gap: '16px'
};

const titleStyle = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#111827',
  margin: '0 0 8px 0'
};

const descriptionStyle = {
  fontSize: '14px',
  color: '#6b7280',
  margin: 0
};

export function LanguagesTab() {
  return (
    <div style={placeholderStyle}>
      <Globe size={48} color="#9ca3af" />
      <div style={{ textAlign: 'center' }}>
        <h3 style={titleStyle}>Languages</h3>
        <p style={descriptionStyle}>
          Content coming soon - manage translations and localization
        </p>
      </div>
    </div>
  );
}

export function NotificationsTab() {
  return (
    <div style={placeholderStyle}>
      <Mail size={48} color="#9ca3af" />
      <div style={{ textAlign: 'center' }}>
        <h3 style={titleStyle}>Notifications</h3>
        <p style={descriptionStyle}>
          Content coming soon - email templates and notification settings
        </p>
      </div>
    </div>
  );
}

export function BrandingTab() {
  return (
    <div style={placeholderStyle}>
      <Edit size={48} color="#9ca3af" />
      <div style={{ textAlign: 'center' }}>
        <h3 style={titleStyle}>Branding</h3>
        <p style={descriptionStyle}>
          Content coming soon - customize appearance and branding
        </p>
      </div>
    </div>
  );
}

export function UserManagementTab() {
  return (
    <div style={placeholderStyle}>
      <UserCheck size={48} color="#9ca3af" />
      <div style={{ textAlign: 'center' }}>
        <h3 style={titleStyle}>User Management</h3>
        <p style={descriptionStyle}>
          Content coming soon - manage admin users and permissions
        </p>
      </div>
    </div>
  );
}

export function DataManagementTab() {
  return (
    <div style={placeholderStyle}>
      <Download size={48} color="#9ca3af" />
      <div style={{ textAlign: 'center' }}>
        <h3 style={titleStyle}>Data Management</h3>
        <p style={descriptionStyle}>
          Content coming soon - backup, import, export, and monitoring
        </p>
      </div>
    </div>
  );
}

export function SystemConfigTab() {
  return (
    <div style={placeholderStyle}>
      <Settings size={48} color="#9ca3af" />
      <div style={{ textAlign: 'center' }}>
        <h3 style={titleStyle}>System Configuration</h3>
        <p style={descriptionStyle}>
          Content coming soon - general system and security settings
        </p>
      </div>
    </div>
  );
}
