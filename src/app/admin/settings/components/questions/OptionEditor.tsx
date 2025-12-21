'use client';

import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

interface MaturityLevel {
  id: string;
  level_number: number;
  name: string;
}

interface OptionData {
  id: string;
  question_id: string;
  maturity_level_id: string;
  text: string;
  text_ar: string;
  score_value: number;
  display_order: number;
  is_special?: boolean;
  special_type?: 'NA' | 'NS' | null;
}

interface OptionEditorProps {
  option: Partial<OptionData>;
  questionId: string;
  onSave: (data: OptionData) => void;
  onCancel: () => void;
}

export function OptionEditor({ option, questionId, onSave, onCancel }: OptionEditorProps) {
  const [formData, setFormData] = useState<OptionData>({
    id: option.id || '',
    question_id: questionId,
    maturity_level_id: option.maturity_level_id || '',
    text: option.text || '',
    text_ar: option.text_ar || '',
    score_value: option.score_value ?? 1,
    display_order: option.display_order || 1,
    is_special: option.is_special || false,
    special_type: option.special_type || null
  });
  const [maturityLevels, setMaturityLevels] = useState<MaturityLevel[]>([]);
  const [optionType, setOptionType] = useState<'maturity' | 'NA' | 'NS'>(
    option.special_type === 'NA' ? 'NA' :
    option.special_type === 'NS' ? 'NS' : 'maturity'
  );

  useEffect(() => {
    fetchMaturityLevels();
  }, []);

  const fetchMaturityLevels = async () => {
    try {
      const res = await fetch('/api/admin/maturity-levels');
      const data = await res.json();
      if (data.success) {
        setMaturityLevels(data.maturityLevels || data.levels || []);
      }
    } catch (error) {
      console.error('Error fetching maturity levels:', error);
    }
  };

  const handleOptionTypeChange = (type: 'maturity' | 'NA' | 'NS') => {
    setOptionType(type);
    if (type === 'NA') {
      setFormData({
        ...formData,
        is_special: true,
        special_type: 'NA',
        maturity_level_id: '',
        score_value: 0,
        text: formData.text || 'Not Applicable',
        text_ar: formData.text_ar || 'غير منطبق'
      });
    } else if (type === 'NS') {
      setFormData({
        ...formData,
        is_special: true,
        special_type: 'NS',
        maturity_level_id: '',
        score_value: 0,
        text: formData.text || 'Not Sure / Don\'t Know',
        text_ar: formData.text_ar || 'غير متأكد / لا أعرف'
      });
    } else {
      setFormData({
        ...formData,
        is_special: false,
        special_type: null
      });
    }
  };

  const handleSubmit = () => {
    if (optionType === 'maturity' && !formData.maturity_level_id) {
      alert('Maturity level is required for scoring options');
      return;
    }
    if (!formData.text) {
      alert('Answer text is required');
      return;
    }
    onSave(formData);
  };

  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500' as const,
    color: '#374151',
    marginBottom: '8px'
  };

  const typeButtonStyle = (isActive: boolean, color: string) => ({
    padding: '10px 16px',
    border: isActive ? `2px solid ${color}` : '1px solid #d1d5db',
    borderRadius: '6px',
    backgroundColor: isActive ? `${color}15` : 'white',
    color: isActive ? color : '#6b7280',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: isActive ? '600' : '400' as const,
    transition: 'all 0.2s'
  });

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
          {option.id ? `Edit Option` : 'Create New Option'}
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

      {/* Option Type Selector */}
      <div style={{ marginBottom: '24px' }}>
        <label style={labelStyle}>Option Type</label>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            type="button"
            onClick={() => handleOptionTypeChange('maturity')}
            style={typeButtonStyle(optionType === 'maturity', '#2563eb')}
          >
            Maturity Level (Scored)
          </button>
          <button
            type="button"
            onClick={() => handleOptionTypeChange('NA')}
            style={typeButtonStyle(optionType === 'NA', '#9333ea')}
          >
            NA - Not Applicable
          </button>
          <button
            type="button"
            onClick={() => handleOptionTypeChange('NS')}
            style={typeButtonStyle(optionType === 'NS', '#f59e0b')}
          >
            NS - Not Sure
          </button>
        </div>
      </div>

      {/* Maturity Level Options (only for scored options) */}
      {optionType === 'maturity' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div>
            <label style={labelStyle}>
              Maturity Level <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              value={formData.maturity_level_id}
              onChange={(e) => {
                const level = maturityLevels.find(l => l.id === e.target.value);
                setFormData({
                  ...formData,
                  maturity_level_id: e.target.value,
                  score_value: level?.level_number || formData.score_value
                });
              }}
              style={{
                ...inputStyle,
                backgroundColor: 'white'
              }}
            >
              <option value="">Select maturity level...</option>
              {maturityLevels.map((level) => (
                <option key={level.id} value={level.id}>
                  Level {level.level_number}: {level.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Score Value (1-5)</label>
            <input
              type="number"
              min="1"
              max="5"
              value={formData.score_value}
              onChange={(e) => setFormData({ ...formData, score_value: parseInt(e.target.value) || 1 })}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Display Order</label>
            <input
              type="number"
              min="1"
              value={formData.display_order}
              onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 1 })}
              style={inputStyle}
            />
          </div>
        </div>
      )}

      {/* Special Option Info */}
      {(optionType === 'NA' || optionType === 'NS') && (
        <div style={{
          backgroundColor: optionType === 'NA' ? '#f3e8ff' : '#fef3c7',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px',
          border: `1px solid ${optionType === 'NA' ? '#d8b4fe' : '#fcd34d'}`
        }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div>
              <strong style={{ color: optionType === 'NA' ? '#7c3aed' : '#d97706' }}>
                {optionType === 'NA' ? 'Not Applicable' : 'Not Sure / Don\'t Know'}
              </strong>
              <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0 0' }}>
                {optionType === 'NA'
                  ? 'This option allows users to skip questions that don\'t apply to their organization. Score: 0 (excluded from calculation)'
                  : 'This option allows users to indicate uncertainty. Score: 0 (excluded from calculation)'}
              </p>
            </div>
            <div>
              <label style={labelStyle}>Display Order</label>
              <input
                type="number"
                min="1"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 1 })}
                style={{ ...inputStyle, width: '80px' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Answer Text */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div>
          <label style={labelStyle}>
            Answer Text (English) <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <textarea
            value={formData.text}
            onChange={(e) => setFormData({ ...formData, text: e.target.value })}
            rows={3}
            placeholder="Enter the answer option text..."
            style={{
              ...inputStyle,
              resize: 'vertical'
            }}
          />
        </div>

        <div>
          <label style={labelStyle}>Answer Text (Arabic)</label>
          <textarea
            value={formData.text_ar}
            onChange={(e) => setFormData({ ...formData, text_ar: e.target.value })}
            rows={3}
            dir="rtl"
            placeholder="نص الإجابة بالعربية"
            style={{
              ...inputStyle,
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
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Save size={16} />
          Save Option
        </button>
      </div>
    </div>
  );
}
