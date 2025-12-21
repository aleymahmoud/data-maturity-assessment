'use client';

import { useState, useEffect } from 'react';
import { Edit, Trash2, Plus, X, Save } from 'lucide-react';

interface MaturityLevel {
  id: string;
  level_number: number | string;
  name: string;
  description: string;
  description_ar: string;
  min_score: number;
  max_score: number;
  color: string;
  icon: string;
}

interface MaturityLevelsManagementProps {
  levels: MaturityLevel[];
  editingLevel: MaturityLevel | null;
  setEditingLevel: (level: MaturityLevel | null) => void;
  onSave: (data: MaturityLevel) => void;
  onDelete: (id: string) => void;
}

export function MaturityLevelsManagement({ levels, editingLevel, setEditingLevel, onSave, onDelete }: MaturityLevelsManagementProps) {
  const [formData, setFormData] = useState({
    id: '',
    level_number: '',
    name: '',
    description: '',
    description_ar: '',
    min_score: 0,
    max_score: 0,
    color: '#6b7280',
    icon: ''
  });

  useEffect(() => {
    if (editingLevel) {
      setFormData({
        id: editingLevel.id || '',
        level_number: String(editingLevel.level_number) || '',
        name: editingLevel.name || '',
        description: editingLevel.description || '',
        description_ar: editingLevel.description_ar || '',
        min_score: editingLevel.min_score || 0,
        max_score: editingLevel.max_score || 0,
        color: editingLevel.color || '#6b7280',
        icon: editingLevel.icon || ''
      });
    } else {
      setFormData({
        id: '',
        level_number: '',
        name: '',
        description: '',
        description_ar: '',
        min_score: 0,
        max_score: 0,
        color: '#6b7280',
        icon: ''
      });
    }
  }, [editingLevel]);

  const handleSave = () => {
    if (!formData.name.trim() || !formData.level_number) return;
    onSave(formData as unknown as MaturityLevel);
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
          gridTemplateColumns: '80px 1fr 120px 1fr',
          gap: '24px',
          marginBottom: '24px'
        }}>
          <div>
            <label style={labelStyle}>Level # *</label>
            <input
              type="number"
              min="1"
              max="10"
              value={formData.level_number}
              onChange={(e) => setFormData({ ...formData, level_number: e.target.value })}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Initial, Developing, Defined..."
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Icon</label>
            <input
              type="text"
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              placeholder="e.g., 🌱"
              style={{ ...inputStyle, fontSize: '20px', textAlign: 'center' }}
            />
          </div>

          <div>
            <label style={labelStyle}>Color</label>
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
                style={{ ...inputStyle, flex: 1 }}
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
            <label style={labelStyle}>Description (English)</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          <div>
            <label style={labelStyle}>Description (Arabic)</label>
            <textarea
              value={formData.description_ar}
              onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
              rows={3}
              dir="rtl"
              style={{ ...inputStyle, resize: 'vertical' }}
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
            <label style={labelStyle}>Minimum Score *</label>
            <input
              type="number"
              min="0"
              max="5"
              step="0.1"
              value={formData.min_score}
              onChange={(e) => setFormData({ ...formData, min_score: parseFloat(e.target.value) || 0 })}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Maximum Score *</label>
            <input
              type="number"
              min="0"
              max="5"
              step="0.1"
              value={formData.max_score}
              onChange={(e) => setFormData({ ...formData, max_score: parseFloat(e.target.value) || 0 })}
              style={inputStyle}
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
        <button
          onClick={() => {
            const nextLevel = levels.length + 1;
            setEditingLevel({
              id: '',
              level_number: nextLevel,
              name: '',
              description: '',
              description_ar: '',
              min_score: nextLevel - 0.01,
              max_score: nextLevel + 0.99,
              color: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6'][Math.min(nextLevel - 1, 4)],
              icon: ''
            });
          }}
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
          Add Level
        </button>
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
            onMouseOver={(e) => (e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)')}
            onMouseOut={(e) => (e.currentTarget.style.boxShadow = 'none')}
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
                {level.icon && (
                  <span style={{ fontSize: '20px' }}>{level.icon}</span>
                )}
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
