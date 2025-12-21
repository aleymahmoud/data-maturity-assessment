'use client';

import { useState, useEffect } from 'react';
import { Edit, Trash2, Plus, X, Save } from 'lucide-react';

interface Domain {
  id: string;
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  display_order: number;
  subdomain_count?: number;
}

interface DomainsManagementProps {
  domains: Domain[];
  editingDomain: Domain | null;
  setEditingDomain: (domain: Domain | null) => void;
  onSave: (data: Domain) => void;
  onDelete: (id: string) => void;
}

export function DomainsManagement({ domains, editingDomain, setEditingDomain, onSave, onDelete }: DomainsManagementProps) {
  const [formData, setFormData] = useState({
    id: '',
    name_en: '',
    name_ar: '',
    description_en: '',
    description_ar: '',
    display_order: 0
  });
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (editingDomain) {
      setFormData({
        id: editingDomain.id || '',
        name_en: editingDomain.name_en || '',
        name_ar: editingDomain.name_ar || '',
        description_en: editingDomain.description_en || '',
        description_ar: editingDomain.description_ar || '',
        display_order: editingDomain.display_order || 0
      });
      setIsCreating(!editingDomain.id);
    } else {
      setFormData({
        id: '',
        name_en: '',
        name_ar: '',
        description_en: '',
        description_ar: '',
        display_order: 0
      });
      setIsCreating(false);
    }
  }, [editingDomain]);

  const handleSave = () => {
    if (!formData.name_en.trim()) return;
    onSave(formData as Domain);
  };

  const handleAddNew = () => {
    setEditingDomain({ id: '', name_en: '', name_ar: '', description_en: '', description_ar: '', display_order: domains.length + 1 });
  };

  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: 'white'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '8px'
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
            {isCreating ? 'Add New Domain' : `Edit Domain: ${editingDomain.name_en}`}
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
            <label style={labelStyle}>English Name *</label>
            <input
              type="text"
              value={formData.name_en}
              onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Arabic Name</label>
            <input
              type="text"
              value={formData.name_ar}
              onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
              style={{ ...inputStyle, direction: 'rtl' }}
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
            <label style={labelStyle}>English Description</label>
            <textarea
              value={formData.description_en}
              onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          <div>
            <label style={labelStyle}>Arabic Description</label>
            <textarea
              value={formData.description_ar}
              onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
              rows={3}
              style={{ ...inputStyle, resize: 'vertical', direction: 'rtl' }}
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
            {isCreating ? 'Create Domain' : 'Save Changes'}
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
            margin: 0
          }}>
            Assessment Domains
          </h3>
          <p style={{
            fontSize: '14px',
            color: '#6b7280',
            margin: '4px 0 0 0'
          }}>
            Manage the main assessment domains
          </p>
        </div>
        <button
          onClick={handleAddNew}
          style={{
            padding: '10px 16px',
            border: 'none',
            backgroundColor: '#7f7afe',
            color: 'white',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Plus size={16} />
          Add Domain
        </button>
      </div>

      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        overflow: 'hidden'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 2fr 1fr 150px',
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
              gridTemplateColumns: '2fr 2fr 1fr 150px',
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
            </div>

            <div style={{
              fontSize: '14px',
              color: '#6b7280',
              textAlign: 'center'
            }}>
              {domain.subdomain_count || 0} subdomains
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
              <button
                onClick={() => onDelete(domain.id)}
                style={{
                  padding: '6px 12px',
                  border: '1px solid #fecaca',
                  backgroundColor: '#fef2f2',
                  color: '#dc2626',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
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

        {domains.length === 0 && (
          <div style={{
            padding: '48px 24px',
            textAlign: 'center',
            color: '#6b7280'
          }}>
            No domains found. Click &quot;Add Domain&quot; to create one.
          </div>
        )}
      </div>
    </div>
  );
}
