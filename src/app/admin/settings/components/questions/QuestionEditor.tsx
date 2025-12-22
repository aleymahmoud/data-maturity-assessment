'use client';

import { useState } from 'react';
import { X, Save } from 'lucide-react';

interface Subdomain {
  id: string;
  name_en: string;
}

interface QuestionData {
  id: string;
  title_en: string;
  title_ar: string;
  text_en: string;
  text_ar: string;
  scenario_en: string;
  scenario_ar: string;
  subdomain_id: string;
  assessment_types: string;
  display_order: number;
}

interface QuestionEditorProps {
  question: QuestionData;
  subdomains: Subdomain[];
  onSave: (data: QuestionData) => void;
  onCancel: () => void;
}

export function QuestionEditor({ question, subdomains, onSave, onCancel }: QuestionEditorProps) {
  const [formData, setFormData] = useState(question);

  const handleSubmit = () => {
    if (!formData.id || !formData.title_en || !formData.text_en) {
      alert('ID, English title, and English text are required');
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
    fontWeight: '500',
    color: '#374151',
    marginBottom: '8px'
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
          <label style={labelStyle}>Question ID *</label>
          <input
            type="text"
            value={formData.id}
            onChange={(e) => setFormData({ ...formData, id: e.target.value })}
            disabled={!!question.id}
            style={{
              ...inputStyle,
              backgroundColor: question.id ? '#f3f4f6' : 'white'
            }}
          />
        </div>

        <div>
          <label style={labelStyle}>Subdomain *</label>
          <select
            value={formData.subdomain_id}
            onChange={(e) => setFormData({ ...formData, subdomain_id: e.target.value })}
            style={{
              ...inputStyle,
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
          <label style={labelStyle}>Assessment Types</label>
          <select
            value={formData.assessment_types}
            onChange={(e) => setFormData({ ...formData, assessment_types: e.target.value })}
            style={{
              ...inputStyle,
              backgroundColor: 'white'
            }}
          >
            <option value="full">Full Assessment Only</option>
            <option value="quick">Quick Assessment Only</option>
            <option value="full,quick">Both (Full & Quick)</option>
          </select>
        </div>

        <div>
          <label style={labelStyle}>Display Order</label>
          <input
            type="number"
            value={formData.display_order}
            onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
            style={inputStyle}
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
          <label style={labelStyle}>Title (English) *</label>
          <input
            type="text"
            value={formData.title_en}
            onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Title (Arabic)</label>
          <input
            type="text"
            value={formData.title_ar}
            onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
            dir="rtl"
            style={inputStyle}
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
          <label style={labelStyle}>Question Text (English) *</label>
          <textarea
            value={formData.text_en}
            onChange={(e) => setFormData({ ...formData, text_en: e.target.value })}
            rows={3}
            style={{
              ...inputStyle,
              resize: 'vertical'
            }}
          />
        </div>

        <div>
          <label style={labelStyle}>Question Text (Arabic)</label>
          <textarea
            value={formData.text_ar}
            onChange={(e) => setFormData({ ...formData, text_ar: e.target.value })}
            rows={3}
            dir="rtl"
            style={{
              ...inputStyle,
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
          <label style={labelStyle}>Scenario (English)</label>
          <textarea
            value={formData.scenario_en}
            onChange={(e) => setFormData({ ...formData, scenario_en: e.target.value })}
            rows={3}
            style={{
              ...inputStyle,
              resize: 'vertical'
            }}
          />
        </div>

        <div>
          <label style={labelStyle}>Scenario (Arabic)</label>
          <textarea
            value={formData.scenario_ar}
            onChange={(e) => setFormData({ ...formData, scenario_ar: e.target.value })}
            rows={3}
            dir="rtl"
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
          Save Question
        </button>
      </div>
    </div>
  );
}
