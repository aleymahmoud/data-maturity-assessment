'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

export default function ConsolidatedReportPage() {
  const searchParams = useSearchParams();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingStatus, setGeneratingStatus] = useState('');
  const language = 'en'; // Admin reports default to English

  useEffect(() => {
    const isGenerating = searchParams.get('generating') === 'true';

    if (isGenerating) {
      // We're in generating mode - poll for completion
      const pendingReport = sessionStorage.getItem('pendingCollectiveReport');
      if (!pendingReport) {
        setGeneratingStatus('Error: No pending report found');
        setLoading(false);
        return;
      }

      const reportInfo = JSON.parse(pendingReport);
      setGeneratingStatus('🤖 AI is analyzing your organizational data...');

      // Poll for completion
      const pollInterval = setInterval(async () => {
        try {
          const response = await fetch('/api/admin/generate-collective-recommendations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ codes: reportInfo.codes })
          });

          const data = await response.json();

          if (data.success && data.cached) {
            // Data is ready!
            clearInterval(pollInterval);
            console.log('✅ AI generation complete, loading report...');

            const enhancedReport = {
              ...reportInfo.baseReport,
              ...data.data,
              cached: true,
              tokenUsage: data.tokenUsage
            };

            sessionStorage.removeItem('pendingCollectiveReport');
            setReportData(enhancedReport);
            setLoading(false);
          } else if (!data.success) {
            // Error occurred
            clearInterval(pollInterval);
            setGeneratingStatus('❌ Error: ' + data.error);
            setLoading(false);
          } else {
            // Still generating
            const elapsed = Math.floor((Date.now() - reportInfo.timestamp) / 1000);
            setGeneratingStatus(`🤖 AI is analyzing your organizational data... (${elapsed}s elapsed)`);
          }
        } catch (error) {
          console.error('Poll error:', error);
        }
      }, 3000); // Poll every 3 seconds

      // Cleanup on unmount
      return () => clearInterval(pollInterval);

    } else {
      // Normal mode - get report from session storage
      const storedData = sessionStorage.getItem('consolidatedReportData');
      if (storedData) {
        setReportData(JSON.parse(storedData));
        setLoading(false);
      }
    }
  }, [searchParams]);

  const downloadPDF = async () => {
    if (!reportData || !reportData.sessions || reportData.sessions.length === 0) return;

    try {
      window.print();
    } catch (error) {
      console.error('PDF download error:', error);
      alert('Error downloading PDF');
    }
  };

  if (loading || !reportData) {
    return (
      <div style={{
        padding: '60px 40px',
        textAlign: 'center',
        maxWidth: '600px',
        margin: '0 auto'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '50%',
          width: '80px',
          height: '80px',
          margin: '0 auto 30px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'pulse 2s ease-in-out infinite'
        }}>
          <span style={{ fontSize: '40px' }}>🤖</span>
        </div>

        <h2 style={{
          fontSize: '24px',
          fontWeight: '600',
          color: '#1a202c',
          marginBottom: '16px'
        }}>
          {generatingStatus || 'Loading consolidated report...'}
        </h2>

        {generatingStatus.includes('analyzing') && (
          <div>
            <p style={{
              fontSize: '16px',
              color: '#4a5568',
              marginBottom: '20px',
              lineHeight: '1.6'
            }}>
              Our AI is performing deep analysis of your organizational assessment data.
              This includes evaluating maturity levels, identifying patterns, and generating
              strategic recommendations tailored to your organization.
            </p>

            <div style={{
              width: '100%',
              height: '6px',
              background: '#e2e8f0',
              borderRadius: '3px',
              overflow: 'hidden',
              marginTop: '30px'
            }}>
              <div style={{
                height: '100%',
                background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                width: '100%',
                animation: 'progress 2s ease-in-out infinite'
              }}/>
            </div>

            <p style={{
              fontSize: '14px',
              color: '#718096',
              marginTop: '20px',
              fontStyle: 'italic'
            }}>
              This typically takes 30-90 seconds. Please don't close this window.
            </p>
          </div>
        )}

        <style jsx>{`
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.1); opacity: 0.8; }
          }
          @keyframes progress {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}</style>
      </div>
    );
  }

  // Prepare chart data
  const chartData = {
    labels: reportData.subdomainScores.map(s => s.name),
    datasets: [{
      label: 'Organizational Average',
      data: reportData.subdomainScores.map(s => s.score),
      backgroundColor: 'rgba(127, 122, 254, 0.2)',
      borderColor: '#7f7afe',
      borderWidth: 2,
      pointBackgroundColor: '#7f7afe',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: '#7f7afe',
      pointRadius: 4,
      pointHoverRadius: 6
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    scales: {
      r: {
        beginAtZero: true,
        max: 5,
        ticks: {
          stepSize: 1,
          font: { size: 11 }
        },
        pointLabels: {
          font: { size: 13, weight: 'bold' },
          color: '#0f2c69'
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      }
    },
    plugins: {
      legend: {
        display: true,
        position: 'top'
      }
    }
  };

  const getMaturityColor = (level) => {
    switch(level) {
      case 'Optimized': return '#28a745';
      case 'Advanced': return '#7f7afe';
      case 'Defined': return '#ffc107';
      case 'Developing': return '#fd7e14';
      case 'Initial': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'high': return '#dc3545';
      case 'medium': return '#ffc107';
      case 'low': return '#28a745';
      default: return '#6c757d';
    }
  };

  const getPriorityIcon = (priority) => {
    switch(priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  return (
    <div style={{
      fontFamily: 'var(--font-primary)',
      background: '#f8f9fa',
      minHeight: '100vh',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        background: 'white',
        borderRadius: '12px',
        padding: '40px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.1)'
      }}>

        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '40px',
          borderBottom: '3px solid #7f7afe',
          paddingBottom: '20px'
        }}>
          <h1 style={{
            fontSize: '2.5rem',
            color: '#0f2c69',
            marginBottom: '10px'
          }}>
            Consolidated Assessment Report
          </h1>
          <p style={{ fontSize: '1.1rem', color: '#6c757d' }}>
            Organizational Data Maturity Analysis
          </p>
          <p style={{ fontSize: '0.95rem', color: '#999', marginTop: '10px' }}>
            Generated: {new Date(reportData.reportInfo.generatedAt).toLocaleString()}
          </p>
        </div>

        {/* Summary Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '40px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #7f7afe, #0f2c69)',
            color: 'white',
            padding: '20px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
              {reportData.overallStats.overallScore.toFixed(1)}
            </div>
            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Overall Score</div>
          </div>

          <div style={{
            background: `linear-gradient(135deg, ${getMaturityColor(reportData.overallStats.maturityLevel)}, #0f2c69)`,
            color: 'white',
            padding: '20px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>
              {reportData.overallStats.maturityLevel}
            </div>
            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Maturity Level</div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #f5ad2e, #0f2c69)',
            color: 'white',
            padding: '20px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
              {reportData.overallStats.totalSessions}
            </div>
            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Assessments</div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #28a745, #0f2c69)',
            color: 'white',
            padding: '20px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
              {reportData.overallStats.averageCompletion.toFixed(0)}%
            </div>
            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Avg Completion</div>
          </div>
        </div>

        {/* Organizations */}
        {reportData.organizations && reportData.organizations.length > 0 && (
          <div style={{
            background: '#f8f9fa',
            padding: '15px 20px',
            borderRadius: '8px',
            marginBottom: '30px'
          }}>
            <strong>Organizations:</strong> {reportData.organizations.join(', ')}
          </div>
        )}

        {/* Radar Chart */}
        <div id="radar-chart-container" style={{
          background: 'white',
          padding: '30px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          marginBottom: '40px'
        }}>
          <h2 style={{
            color: '#0f2c69',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            Maturity Assessment Overview
          </h2>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <Radar data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Subdomain Scores */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ color: '#0f2c69', marginBottom: '20px' }}>
            Scores by Dimension
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '15px'
          }}>
            {reportData.subdomainScores.map((subdomain, idx) => (
              <div key={idx} style={{
                background: '#f8f9fa',
                padding: '15px',
                borderRadius: '8px',
                borderLeft: `4px solid ${getMaturityColor(subdomain.maturity_level)}`
              }}>
                <div style={{
                  fontWeight: '600',
                  marginBottom: '8px',
                  color: '#0f2c69'
                }}>
                  {subdomain.name}
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <span style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>
                    {subdomain.score.toFixed(1)}/5.0
                  </span>
                  <span style={{
                    background: getMaturityColor(subdomain.maturity_level),
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '0.85rem'
                  }}>
                    {subdomain.maturity_level}
                  </span>
                </div>
                <div style={{
                  background: '#e9ecef',
                  height: '8px',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    background: getMaturityColor(subdomain.maturity_level),
                    height: '100%',
                    width: `${subdomain.percentage}%`,
                    transition: 'width 0.3s ease'
                  }} />
                </div>
                <div style={{
                  fontSize: '0.85rem',
                  color: '#6c757d',
                  marginTop: '8px'
                }}>
                  {subdomain.description}
                </div>
                <div style={{
                  fontSize: '0.8rem',
                  color: '#999',
                  marginTop: '5px'
                }}>
                  Based on {subdomain.sessions_count} assessment{subdomain.sessions_count > 1 ? 's' : ''}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Maturity Summary */}
        {reportData.maturityAnalysis && (
          <div style={{
            background: 'rgba(127, 122, 254, 0.05)',
            padding: '25px',
            borderRadius: '12px',
            marginBottom: '30px',
            borderLeft: '4px solid #7f7afe'
          }}>
            <h2 style={{ color: '#0f2c69', marginBottom: '15px' }}>
              Organizational Maturity Analysis
            </h2>
            {reportData.maturityAnalysis.description_en && (
              <p style={{ lineHeight: '1.6', marginBottom: '15px' }}>
                {reportData.maturityAnalysis.description_en}
              </p>
            )}
          </div>
        )}

        {/* General Recommendations */}
        {reportData.generalRecommendations && reportData.generalRecommendations.length > 0 && (
          <div style={{
            marginBottom: '30px',
            background: 'rgba(127, 122, 254, 0.05)',
            borderRadius: '12px',
            padding: '25px',
            borderLeft: '4px solid #7f7afe'
          }}>
            <h2 style={{ color: '#7f7afe', marginBottom: '20px' }}>
              General Recommendations
            </h2>
            {reportData.generalRecommendations.map((rec, index) => (
              <div key={index} style={{
                marginBottom: '15px',
                padding: '15px',
                background: 'white',
                borderRadius: '8px',
                border: '1px solid #ededed'
              }}>
                <div style={{
                  fontWeight: '600',
                  color: getPriorityColor(rec.priority),
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span>{getPriorityIcon(rec.priority)}</span>
                  <span>{rec.title}</span>
                </div>
                <div style={{ color: '#374151', lineHeight: '1.6' }}>
                  {rec.description}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Role Recommendations */}
        {reportData.roleRecommendations && reportData.roleRecommendations.length > 0 && (
          <div style={{
            marginBottom: '30px',
            background: 'rgba(245, 173, 46, 0.05)',
            borderRadius: '12px',
            padding: '25px',
            borderLeft: '4px solid #f5ad2e'
          }}>
            <h2 style={{ color: '#f5ad2e', marginBottom: '20px' }}>
              Role-Specific Recommendations
            </h2>
            {reportData.roleRecommendations.map((rec, index) => (
              <div key={index} style={{
                marginBottom: '15px',
                padding: '15px',
                background: 'white',
                borderRadius: '8px',
                border: '1px solid #ededed'
              }}>
                <div style={{
                  fontWeight: '600',
                  color: getPriorityColor(rec.priority),
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span>{getPriorityIcon(rec.priority)}</span>
                  <span>{rec.title}</span>
                </div>
                <div style={{ color: '#374151', lineHeight: '1.6' }}>
                  {rec.description}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Collective Organizational Analysis */}
        {reportData.organizationalAnalysis && (
          <div style={{
            background: 'rgba(127, 122, 254, 0.05)',
            padding: '25px',
            borderRadius: '12px',
            marginBottom: '30px',
            borderLeft: '4px solid #7f7afe'
          }}>
            <h2 style={{ color: '#0f2c69', marginBottom: '15px' }}>
              Organizational Maturity Analysis
            </h2>
            <p style={{ lineHeight: '1.8', whiteSpace: 'pre-line', color: '#374151' }}>
              {reportData.organizationalAnalysis}
            </p>
          </div>
        )}

        {/* Collective Strengths */}
        {reportData.collectiveStrengths && reportData.collectiveStrengths.length > 0 && (
          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ color: '#28a745', marginBottom: '20px' }}>
              Organizational Strengths
            </h2>
            <div style={{ display: 'grid', gap: '15px' }}>
              {reportData.collectiveStrengths.map((strength, idx) => (
                <div key={idx} style={{
                  background: 'rgba(40, 167, 69, 0.05)',
                  padding: '15px',
                  borderRadius: '8px',
                  borderLeft: '4px solid #28a745'
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>✅</span>
                    <span style={{ lineHeight: '1.6', color: '#374151' }}>{strength}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Collective Weaknesses */}
        {reportData.collectiveWeaknesses && reportData.collectiveWeaknesses.length > 0 && (
          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ color: '#dc3545', marginBottom: '20px' }}>
              Areas for Organizational Improvement
            </h2>
            <div style={{ display: 'grid', gap: '15px' }}>
              {reportData.collectiveWeaknesses.map((weakness, idx) => (
                <div key={idx} style={{
                  background: 'rgba(220, 53, 69, 0.05)',
                  padding: '15px',
                  borderRadius: '8px',
                  borderLeft: '4px solid #dc3545'
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>⚠️</span>
                    <span style={{ lineHeight: '1.6', color: '#374151' }}>{weakness}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Strategic Recommendations */}
        {reportData.strategicRecommendations && reportData.strategicRecommendations.length > 0 && (
          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ color: '#0f2c69', marginBottom: '20px' }}>
              Strategic Organizational Recommendations
            </h2>
            {reportData.strategicRecommendations.map((rec, idx) => (
              <div key={idx} style={{
                marginBottom: '20px',
                padding: '20px',
                background: 'white',
                borderRadius: '8px',
                border: '1px solid #e0e0e0',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '10px',
                  flexWrap: 'wrap',
                  gap: '10px'
                }}>
                  <h3 style={{ color: '#0f2c69', margin: 0, flex: 1 }}>
                    {idx + 1}. {rec.title}
                  </h3>
                  <span style={{
                    background: rec.priority === 'high' ? '#dc3545' :
                               rec.priority === 'medium' ? '#ffc107' : '#28a745',
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '0.85rem',
                    fontWeight: '600'
                  }}>
                    {rec.priority?.toUpperCase() || 'MEDIUM'}
                  </span>
                </div>
                <p style={{ lineHeight: '1.6', marginBottom: '12px', color: '#374151' }}>
                  {rec.description}
                </p>
                <div style={{
                  fontSize: '0.9rem',
                  color: '#6c757d',
                  borderTop: '1px solid #e9ecef',
                  paddingTop: '10px'
                }}>
                  <div style={{ marginBottom: '5px' }}>
                    <strong>Timeframe:</strong> {rec.timeframe}
                  </div>
                  {rec.affectedRoles && rec.affectedRoles.length > 0 && (
                    <div style={{ marginBottom: '5px' }}>
                      <strong>Affected Roles:</strong> {rec.affectedRoles.join(', ')}
                    </div>
                  )}
                  {rec.prerequisites && rec.prerequisites.length > 0 && (
                    <div>
                      <strong>Prerequisites:</strong> {rec.prerequisites.join(', ')}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Implementation Roadmap */}
        {reportData.implementationRoadmap && reportData.implementationRoadmap.length > 0 && (
          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ color: '#0f2c69', marginBottom: '20px' }}>
              Implementation Roadmap
            </h2>
            <div style={{ position: 'relative' }}>
              {/* Timeline line */}
              <div style={{
                position: 'absolute',
                left: '15px',
                top: '15px',
                bottom: '15px',
                width: '2px',
                background: 'linear-gradient(to bottom, #7f7afe, #0f2c69)',
                zIndex: 0
              }} />

              {reportData.implementationRoadmap.map((phase, idx) => (
                <div key={idx} style={{
                  marginBottom: '25px',
                  paddingLeft: '50px',
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    left: '0',
                    top: '5px',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#7f7afe',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '0.9rem',
                    zIndex: 1,
                    border: '3px solid white',
                    boxShadow: '0 2px 8px rgba(127, 122, 254, 0.3)'
                  }}>
                    {idx + 1}
                  </div>
                  <div style={{
                    background: 'rgba(127, 122, 254, 0.05)',
                    padding: '20px',
                    borderRadius: '8px',
                    borderLeft: '3px solid #7f7afe'
                  }}>
                    <h3 style={{ color: '#7f7afe', marginBottom: '12px', fontSize: '1.1rem' }}>
                      {phase.phase}
                    </h3>

                    {phase.keyActions && phase.keyActions.length > 0 && (
                      <div style={{ marginBottom: '15px' }}>
                        <strong style={{ color: '#0f2c69' }}>Key Actions:</strong>
                        <ul style={{ marginTop: '8px', paddingLeft: '20px', color: '#374151' }}>
                          {phase.keyActions.map((action, i) => (
                            <li key={i} style={{ marginBottom: '5px' }}>{action}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {phase.expectedOutcomes && phase.expectedOutcomes.length > 0 && (
                      <div style={{ marginBottom: '15px' }}>
                        <strong style={{ color: '#0f2c69' }}>Expected Outcomes:</strong>
                        <ul style={{ marginTop: '8px', paddingLeft: '20px', color: '#374151' }}>
                          {phase.expectedOutcomes.map((outcome, i) => (
                            <li key={i} style={{ marginBottom: '5px' }}>{outcome}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {phase.requiredResources && phase.requiredResources.length > 0 && (
                      <div style={{
                        background: 'rgba(255, 255, 255, 0.6)',
                        padding: '10px',
                        borderRadius: '6px',
                        fontSize: '0.9rem'
                      }}>
                        <strong style={{ color: '#0f2c69' }}>Required Resources:</strong>{' '}
                        <span style={{ color: '#6c757d' }}>{phase.requiredResources.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{
          display: 'flex',
          gap: '15px',
          justifyContent: 'center',
          marginTop: '40px',
          paddingTop: '30px',
          borderTop: '2px solid #e9ecef'
        }}>
          <button
            onClick={downloadPDF}
            style={{
              padding: '12px 30px',
              background: '#7f7afe',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            📥 Download PDF Report
          </button>
          <button
            onClick={() => window.close()}
            style={{
              padding: '12px 30px',
              background: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          marginTop: '40px',
          paddingTop: '20px',
          borderTop: '1px solid #e9ecef',
          color: '#6c757d',
          fontSize: '0.9rem'
        }}>
          <p>Omnisight Analytics by Forefront Consulting</p>
          <p><strong>DMA - Data Maturity Assessment</strong></p>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          button { display: none !important; }
        }
      `}</style>
    </div>
  );
}
