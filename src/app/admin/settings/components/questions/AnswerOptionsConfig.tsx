'use client';

import { useState, useEffect } from 'react';
import { Plus, HelpCircle } from 'lucide-react';
import { OptionEditor } from './OptionEditor';

interface Question {
  id: string;
  title_en: string;
}

interface Option {
  id: string;
  question_id: string;
  maturity_level_id: string;
  maturity_level_name?: string;
  maturity_level_number?: number;
  maturity_level_color?: string;
  text: string;
  text_ar: string;
  score_value: number;
  display_order: number;
  is_special?: boolean;
  special_type?: 'NA' | 'NS' | null;
}

export function AnswerOptionsConfig() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState('');
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingOption, setEditingOption] = useState<Option | null>(null);

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

  const handleSave = async (optionData: Option) => {
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

  const handleDelete = async (id: string) => {
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

  const getScoreBadgeColor = (score: number, specialType?: string | null) => {
    if (specialType === 'NA') return { bg: '#f3e8ff', text: '#7c3aed' };
    if (specialType === 'NS') return { bg: '#fef3c7', text: '#d97706' };
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
                maturity_level_id: '',
                text: '',
                text_ar: '',
                score_value: 1,
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
                No options found. Click &quot;Add Option&quot; to create the first one.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Answer Text</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#6b7280', width: '80px' }}>Score</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', width: '160px' }}>Maturity Level</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#6b7280', width: '70px' }}>Order</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#6b7280', width: '120px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {options.map((option) => {
                    const scoreColors = getScoreBadgeColor(option.score_value, option.special_type);
                    const isSpecial = option.is_special || option.special_type === 'NA' || option.special_type === 'NS';
                    return (
                      <tr key={option.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {isSpecial && (
                              <span style={{
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '10px',
                                fontWeight: '600',
                                backgroundColor: option.special_type === 'NA' ? '#f3e8ff' : '#fef3c7',
                                color: option.special_type === 'NA' ? '#7c3aed' : '#d97706'
                              }}>
                                {option.special_type}
                              </span>
                            )}
                            <div style={{ fontSize: '14px', color: '#111827' }}>
                              {option.text}
                            </div>
                          </div>
                          {option.text_ar && (
                            <div style={{ fontSize: '13px', color: '#6b7280', direction: 'rtl', marginTop: '4px' }}>
                              {option.text_ar}
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
                            {isSpecial ? option.special_type : option.score_value}
                          </span>
                        </td>
                        <td style={{ padding: '12px' }}>
                          {isSpecial ? (
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: '500',
                              backgroundColor: '#f3f4f6',
                              color: '#6b7280',
                              fontStyle: 'italic'
                            }}>
                              Special Option
                            </span>
                          ) : (
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: '500',
                              backgroundColor: option.maturity_level_color ? `${option.maturity_level_color}20` : '#f3f4f6',
                              color: option.maturity_level_color || '#374151'
                            }}>
                              {option.maturity_level_name || `Level ${option.maturity_level_number}` || '-'}
                            </span>
                          )}
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
