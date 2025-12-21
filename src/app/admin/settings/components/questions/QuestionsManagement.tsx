'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { QuestionEditor } from './QuestionEditor';

interface Question {
  id: string;
  title_en: string;
  title_ar: string;
  text_en: string;
  text_ar: string;
  scenario_en: string;
  scenario_ar: string;
  subdomain_id: string;
  subdomain_name_en?: string;
  priority: number;
  display_order: number;
  icon: string;
}

interface Subdomain {
  id: string;
  name_en: string;
}

export function QuestionsManagement() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [subdomains, setSubdomains] = useState<Subdomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [subdomainFilter, setSubdomainFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
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

  const handleSave = async (questionData: Question) => {
    try {
      const method = editingQuestion?.id ? 'PUT' : 'POST';
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

  const handleDelete = async (id: string) => {
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

  const inputStyle = {
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px'
  };

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
          style={inputStyle}
        />

        <select
          value={subdomainFilter}
          onChange={(e) => {
            setSubdomainFilter(e.target.value);
            setCurrentPage(1);
          }}
          style={{ ...inputStyle, backgroundColor: 'white' }}
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
          style={{ ...inputStyle, backgroundColor: 'white' }}
        >
          <option value="all">All Priorities</option>
          <option value="1">Quick Assessment</option>
          <option value="0">Full Assessment Only</option>
        </select>

        <button
          onClick={() => setEditingQuestion({
            id: '',
            title_en: '',
            title_ar: '',
            text_en: '',
            text_ar: '',
            scenario_en: '',
            scenario_ar: '',
            subdomain_id: '',
            priority: 0,
            display_order: totalQuestions + 1,
            icon: '❓'
          })}
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
