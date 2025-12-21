'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Save, CheckCircle, AlertCircle } from 'lucide-react';

interface Role {
  id: string;
  title: string;
  description: string;
  examples: string[] | string;
  estimatedTime: string;
  icon: string;
  subdomains: string[];
  displayOrder?: number;
  display_order?: number;
  dimensionCount?: number;
}

interface Subdomain {
  id: string;
  name: string;
  name_en: string;
  name_ar: string;
  description?: string;
  description_en: string;
  description_ar: string;
  domain_id: string;
  domain_name?: string;
  display_order: number;
  is_active: boolean;
  question_count?: number;
}

interface Domain {
  id: string;
  name: string;
  name_en: string;
}

export function RolesSubdomainsTab() {
  const [activeSubTab, setActiveSubTab] = useState('roles');
  const [roles, setRoles] = useState<Role[]>([]);
  const [subdomains, setSubdomains] = useState<Subdomain[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [editingSubdomain, setEditingSubdomain] = useState<Subdomain | null>(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  useEffect(() => {
    fetchRoles();
    fetchSubdomains();
    fetchDomains();
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
    }
  };

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/roles');
      const data = await response.json();
      if (data.success) {
        setRoles(data.roles);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      showMessage('Error loading roles', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubdomains = async () => {
    try {
      const response = await fetch('/api/admin/subdomains');
      const data = await response.json();
      if (data.success) {
        setSubdomains(data.subdomains);
      }
    } catch (error) {
      console.error('Error fetching subdomains:', error);
      showMessage('Error loading subdomains', 'error');
    }
  };

  const showMessage = (text: string, type: string) => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 3000);
  };

  const handleSaveRole = async () => {
    if (!editingRole) return;
    try {
      const url = editingRole.id ? `/api/admin/roles/${editingRole.id}` : '/api/admin/roles';
      const method = editingRole.id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingRole)
      });

      const data = await response.json();
      if (data.success) {
        showMessage(editingRole.id ? 'Role updated successfully' : 'Role created successfully', 'success');
        setEditingRole(null);
        fetchRoles();
      } else {
        showMessage(data.error || 'Error saving role', 'error');
      }
    } catch (error) {
      console.error('Error saving role:', error);
      showMessage('Error saving role', 'error');
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('Are you sure you want to delete this role? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/roles/${roleId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.success) {
        showMessage('Role deleted successfully', 'success');
        fetchRoles();
      } else {
        showMessage(data.error || 'Error deleting role', 'error');
      }
    } catch (error) {
      console.error('Error deleting role:', error);
      showMessage('Error deleting role', 'error');
    }
  };

  const handleSaveSubdomain = async () => {
    if (!editingSubdomain) return;
    try {
      const url = editingSubdomain.id ? `/api/admin/subdomains/${editingSubdomain.id}` : '/api/admin/subdomains';
      const method = editingSubdomain.id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingSubdomain)
      });

      const data = await response.json();
      if (data.success) {
        showMessage(editingSubdomain.id ? 'Subdomain updated successfully' : 'Subdomain created successfully', 'success');
        setEditingSubdomain(null);
        fetchSubdomains();
      } else {
        showMessage(data.error || 'Error saving subdomain', 'error');
      }
    } catch (error) {
      console.error('Error saving subdomain:', error);
      showMessage('Error saving subdomain', 'error');
    }
  };

  const handleDeleteSubdomain = async (subdomainId: string) => {
    if (!confirm('Are you sure you want to delete this subdomain? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/subdomains/${subdomainId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.success) {
        showMessage('Subdomain deleted successfully', 'success');
        fetchSubdomains();
      } else {
        showMessage(data.error || 'Error deleting subdomain', 'error');
      }
    } catch (error) {
      console.error('Error deleting subdomain:', error);
      showMessage('Error deleting subdomain', 'error');
    }
  };

  return (
    <div>
      {/* Message Display */}
      {message && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: messageType === 'success' ? '#f0fdf4' : '#fef2f2',
          border: `1px solid ${messageType === 'success' ? '#86efac' : '#fca5a5'}`,
          borderRadius: '6px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: messageType === 'success' ? '#166534' : '#991b1b'
        }}>
          {messageType === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          <span style={{ fontSize: '14px' }}>{message}</span>
        </div>
      )}

      {/* Sub Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        borderBottom: '2px solid #f3f4f6',
        paddingBottom: '0'
      }}>
        <button
          onClick={() => setActiveSubTab('roles')}
          style={{
            padding: '12px 24px',
            border: 'none',
            backgroundColor: 'transparent',
            color: activeSubTab === 'roles' ? '#7f7afe' : '#6b7280',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            borderBottom: activeSubTab === 'roles' ? '2px solid #7f7afe' : '2px solid transparent',
            marginBottom: '-2px',
            transition: 'all 0.2s'
          }}>
          Roles Management
        </button>
        <button
          onClick={() => setActiveSubTab('subdomains')}
          style={{
            padding: '12px 24px',
            border: 'none',
            backgroundColor: 'transparent',
            color: activeSubTab === 'subdomains' ? '#7f7afe' : '#6b7280',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            borderBottom: activeSubTab === 'subdomains' ? '2px solid #7f7afe' : '2px solid transparent',
            marginBottom: '-2px',
            transition: 'all 0.2s'
          }}>
          Subdomains Management
        </button>
      </div>

      {/* Roles Tab Content */}
      {activeSubTab === 'roles' && (
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#111827',
              margin: 0
            }}>
              User Roles ({roles.length})
            </h3>
            <button
              onClick={() => setEditingRole({
                id: '',
                title: '',
                description: '',
                examples: [],
                estimatedTime: '',
                icon: '',
                subdomains: []
              })}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                backgroundColor: '#7f7afe',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <Plus size={16} />
              Add Role
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
              Loading roles...
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              {roles.map((role) => (
                <div key={role.id} style={{
                  padding: '20px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  backgroundColor: 'white'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'start',
                    marginBottom: '12px'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '8px'
                      }}>
                        <span style={{ fontSize: '24px' }}>{role.icon}</span>
                        <h4 style={{
                          fontSize: '16px',
                          fontWeight: '600',
                          color: '#111827',
                          margin: 0
                        }}>
                          {role.title}
                        </h4>
                      </div>
                      <p style={{
                        fontSize: '14px',
                        color: '#6b7280',
                        margin: '0 0 8px 0'
                      }}>
                        {role.description}
                      </p>
                      <div style={{
                        fontSize: '13px',
                        color: '#9ca3af',
                        marginBottom: '8px'
                      }}>
                        <strong>Examples:</strong> {Array.isArray(role.examples) ? role.examples.join(', ') : role.examples}
                      </div>
                      <div style={{
                        fontSize: '13px',
                        color: '#9ca3af',
                        marginBottom: '8px'
                      }}>
                        <strong>Time:</strong> {role.estimatedTime} | <strong>Dimensions:</strong> {role.dimensionCount || (Array.isArray(role.subdomains) ? role.subdomains.length : 0)} | <strong>Order:</strong> {role.displayOrder || role.display_order || 0}
                      </div>
                      <div style={{
                        fontSize: '13px',
                        color: '#9ca3af'
                      }}>
                        <strong>Subdomains:</strong> {Array.isArray(role.subdomains) ? role.subdomains.join(', ') : role.subdomains}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => setEditingRole(role)}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: '#f3f4f6',
                          color: '#374151',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '13px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Edit size={14} />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteRole(role.id)}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: '#fee2e2',
                          color: '#991b1b',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '13px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Subdomains Tab Content */}
      {activeSubTab === 'subdomains' && (
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#111827',
              margin: 0
            }}>
              Assessment Subdomains ({subdomains.length})
            </h3>
            <button
              onClick={() => setEditingSubdomain({
                id: '',
                name: '',
                name_en: '',
                name_ar: '',
                description_en: '',
                description_ar: '',
                domain_id: '',
                display_order: 1,
                is_active: true
              })}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                backgroundColor: '#7f7afe',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <Plus size={16} />
              Add Subdomain
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
              Loading subdomains...
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {subdomains.map((subdomain) => (
                <div key={subdomain.id} style={{
                  padding: '16px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'start'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <h4 style={{
                        fontSize: '15px',
                        fontWeight: '600',
                        color: '#111827',
                        margin: 0
                      }}>
                        {subdomain.name_en || subdomain.name}
                      </h4>
                      {subdomain.is_active === false && (
                        <span style={{
                          fontSize: '10px',
                          padding: '2px 6px',
                          backgroundColor: '#fef2f2',
                          color: '#991b1b',
                          borderRadius: '4px'
                        }}>
                          Inactive
                        </span>
                      )}
                    </div>
                    {subdomain.name_ar && (
                      <p style={{
                        fontSize: '13px',
                        color: '#6b7280',
                        margin: '0 0 4px 0',
                        direction: 'rtl'
                      }}>
                        {subdomain.name_ar}
                      </p>
                    )}
                    <p style={{
                      fontSize: '13px',
                      color: '#6b7280',
                      margin: '0 0 4px 0'
                    }}>
                      {subdomain.description_en || subdomain.description || 'No description'}
                    </p>
                    <div style={{
                      fontSize: '12px',
                      color: '#9ca3af',
                      display: 'flex',
                      gap: '16px'
                    }}>
                      <span><strong>Domain:</strong> {subdomain.domain_name || 'Not assigned'}</span>
                      <span><strong>Order:</strong> {subdomain.display_order || 1}</span>
                      <span><strong>Questions:</strong> {subdomain.question_count || 0}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => setEditingSubdomain(subdomain)}
                      style={{
                        padding: '6px 10px',
                        backgroundColor: '#f3f4f6',
                        color: '#374151',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Edit size={12} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteSubdomain(subdomain.id)}
                      style={{
                        padding: '6px 10px',
                        backgroundColor: '#fee2e2',
                        color: '#991b1b',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Trash2 size={12} />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Role Edit Modal */}
      {editingRole && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#111827',
                margin: 0
              }}>
                {editingRole.id ? 'Edit Role' : 'Add New Role'}
              </h3>
              <button
                onClick={() => setEditingRole(null)}
                style={{
                  padding: '4px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  Role ID
                </label>
                <input
                  type="text"
                  value={editingRole.id}
                  onChange={(e) => setEditingRole({ ...editingRole, id: e.target.value })}
                  placeholder="e.g., executive"
                  disabled={!!editingRole.id}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: editingRole.id ? '#f9fafb' : 'white'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  Title
                </label>
                <input
                  type="text"
                  value={editingRole.title}
                  onChange={(e) => setEditingRole({ ...editingRole, title: e.target.value })}
                  placeholder="e.g., Executive/C-Suite Level"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  Description
                </label>
                <textarea
                  value={editingRole.description}
                  onChange={(e) => setEditingRole({ ...editingRole, description: e.target.value })}
                  placeholder="Describe this role..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  Examples (comma-separated)
                </label>
                <input
                  type="text"
                  value={Array.isArray(editingRole.examples) ? editingRole.examples.join(', ') : editingRole.examples}
                  onChange={(e) => setEditingRole({ ...editingRole, examples: e.target.value.split(',').map(s => s.trim()) })}
                  placeholder="CEO, COO, CTO"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  Estimated Time
                </label>
                <input
                  type="text"
                  value={editingRole.estimatedTime}
                  onChange={(e) => setEditingRole({ ...editingRole, estimatedTime: e.target.value })}
                  placeholder="e.g., 15-20 minutes"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    Icon (emoji)
                  </label>
                  <input
                    type="text"
                    value={editingRole.icon}
                    onChange={(e) => setEditingRole({ ...editingRole, icon: e.target.value })}
                    placeholder="🏢"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={editingRole.displayOrder || 0}
                    onChange={(e) => setEditingRole({ ...editingRole, displayOrder: parseInt(e.target.value) || 0 })}
                    placeholder="1"
                    min="0"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  Subdomains
                </label>
                <div style={{
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  padding: '12px',
                  maxHeight: '200px',
                  overflowY: 'auto'
                }}>
                  {subdomains.length === 0 ? (
                    <div style={{ color: '#6b7280', fontSize: '14px' }}>Loading subdomains...</div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                      {subdomains.map((subdomain) => {
                        const isChecked = Array.isArray(editingRole.subdomains)
                          ? editingRole.subdomains.includes(subdomain.id)
                          : false;

                        return (
                          <label
                            key={subdomain.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              cursor: 'pointer',
                              padding: '6px',
                              borderRadius: '4px'
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                const currentSubdomains = Array.isArray(editingRole.subdomains)
                                  ? [...editingRole.subdomains]
                                  : [];

                                if (e.target.checked) {
                                  setEditingRole({
                                    ...editingRole,
                                    subdomains: [...currentSubdomains, subdomain.id]
                                  });
                                } else {
                                  setEditingRole({
                                    ...editingRole,
                                    subdomains: currentSubdomains.filter(id => id !== subdomain.id)
                                  });
                                }
                              }}
                              style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                            />
                            <span style={{ fontSize: '14px', color: '#374151' }}>
                              {subdomain.name}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '6px' }}>
                  Selected: {Array.isArray(editingRole.subdomains) ? editingRole.subdomains.length : 0} subdomain(s)
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button
                  onClick={() => setEditingRole(null)}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveRole}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#7f7afe',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Save size={16} />
                  Save Role
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subdomain Edit Modal */}
      {editingSubdomain && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#111827',
                margin: 0
              }}>
                {editingSubdomain.id ? 'Edit Subdomain' : 'Add New Subdomain'}
              </h3>
              <button
                onClick={() => setEditingSubdomain(null)}
                style={{
                  padding: '4px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  Domain <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  value={editingSubdomain.domain_id || ''}
                  onChange={(e) => setEditingSubdomain({ ...editingSubdomain, domain_id: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  <option value="">Select a domain</option>
                  {domains.map((domain) => (
                    <option key={domain.id} value={domain.id}>{domain.name_en || domain.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  Name (English) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={editingSubdomain.name_en || ''}
                  onChange={(e) => setEditingSubdomain({ ...editingSubdomain, name_en: e.target.value })}
                  placeholder="e.g., Data Collection"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  Name (Arabic)
                </label>
                <input
                  type="text"
                  value={editingSubdomain.name_ar || ''}
                  onChange={(e) => setEditingSubdomain({ ...editingSubdomain, name_ar: e.target.value })}
                  placeholder="الاسم بالعربية"
                  dir="rtl"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  Description (English)
                </label>
                <textarea
                  value={editingSubdomain.description_en || ''}
                  onChange={(e) => setEditingSubdomain({ ...editingSubdomain, description_en: e.target.value })}
                  placeholder="Describe this subdomain..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  Description (Arabic)
                </label>
                <textarea
                  value={editingSubdomain.description_ar || ''}
                  onChange={(e) => setEditingSubdomain({ ...editingSubdomain, description_ar: e.target.value })}
                  placeholder="الوصف بالعربية"
                  dir="rtl"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={editingSubdomain.display_order || 1}
                    onChange={(e) => setEditingSubdomain({ ...editingSubdomain, display_order: parseInt(e.target.value) || 1 })}
                    min="1"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    Status
                  </label>
                  <select
                    value={editingSubdomain.is_active !== false ? 'active' : 'inactive'}
                    onChange={(e) => setEditingSubdomain({ ...editingSubdomain, is_active: e.target.value === 'active' })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button
                  onClick={() => setEditingSubdomain(null)}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSubdomain}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#7f7afe',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Save size={16} />
                  Save Subdomain
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
