'use client';

import { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';

interface Domain {
  id: string;
  name_en: string;
}

interface Subdomain {
  id: string;
  domain_id: string;
  name_en: string;
  name_ar: string;
}

interface Question {
  id: string;
  title_en: string;
  subdomain_id: string;
  subdomain_name_en?: string;
}

export function SubdomainMapping() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [subdomains, setSubdomains] = useState<Subdomain[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubdomain, setSelectedSubdomain] = useState<string | null>(null);
  const [reassignQuestion, setReassignQuestion] = useState<Question | null>(null);

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

  const handleReassign = async (questionId: string, newSubdomainId: string) => {
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

  const getQuestionsBySubdomain = (subdomainId: string) => {
    return questions.filter(q => q.subdomain_id === subdomainId);
  };

  const getSubdomainsByDomain = (domainId: string) => {
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
            {subdomains.length > 0 ? (questions.length / subdomains.length).toFixed(1) : '0'}
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
