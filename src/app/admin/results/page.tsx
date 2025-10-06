'use client'

import React, { useState, useEffect } from 'react'
import { BarChart3, FileText, Download, Calendar, TrendingUp, Users, Target, CheckCircle, Clock, AlertCircle, Search, Filter, FileSpreadsheet, Code } from 'lucide-react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2'
import jsPDF from 'jspdf'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
)

// Domain group color mapping (matching user results page)
const DOMAIN_COLORS = {
  'DATA_LIFECYCLE': {
    border: 'rgba(40, 167, 69, 1)',
    background: 'rgba(40, 167, 69, 0.2)',
    point: 'rgba(40, 167, 69, 1)',
    text: '#28a745'
  },
  'GOVERNANCE_PROTECTION': {
    border: 'rgba(245, 173, 46, 1)',
    background: 'rgba(245, 173, 46, 0.2)',
    point: 'rgba(245, 173, 46, 1)',
    text: '#F5AD2E'
  },
  'ORGANIZATIONAL_ENABLERS': {
    border: 'rgba(15, 44, 105, 1)',
    background: 'rgba(15, 44, 105, 0.2)',
    point: 'rgba(15, 44, 105, 1)',
    text: '#0F2C69'
  }
}

export default function ResultsAnalyticsPage() {
  const [activeView, setActiveView] = useState('analytics') // 'analytics' | 'reports'
  const [loading, setLoading] = useState(true)

  // Get current year start date as default
  const getCurrentYearStart = () => {
    const now = new Date()
    return new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0]
  }

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0]
  }

  useEffect(() => {
    // Simulate initial load
    setTimeout(() => setLoading(false), 500)
  }, [])

  // Tab Navigation Component
  const TabNavigation = () => (
    <div style={{
      display: 'flex',
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 2px 12px rgba(15, 44, 105, 0.08)',
      padding: '6px',
      marginBottom: '32px',
      maxWidth: '500px'
    }}>
      <button
        onClick={() => setActiveView('analytics')}
        style={{
          flex: 1,
          padding: '12px 20px',
          fontSize: '14px',
          fontWeight: '600',
          color: activeView === 'analytics' ? 'white' : '#6b7280',
          backgroundColor: activeView === 'analytics' ? '#7f7afe' : 'transparent',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}
      >
        <BarChart3 size={16} />
        Overall Analytics
      </button>
      <button
        onClick={() => setActiveView('reports')}
        style={{
          flex: 1,
          padding: '12px 20px',
          fontSize: '14px',
          fontWeight: '600',
          color: activeView === 'reports' ? 'white' : '#6b7280',
          backgroundColor: activeView === 'reports' ? '#7f7afe' : 'transparent',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}
      >
        <FileText size={16} />
        Assessment Reports
      </button>
    </div>
  )

  // Overall Analytics View
  const OverallAnalyticsView = () => {
    const [dateRange, setDateRange] = useState({
      start: getCurrentYearStart(),
      end: getTodayDate()
    })
    const [analytics, setAnalytics] = useState({
      totalAssessments: 0,
      totalOrganizations: 0,
      avgMaturityScore: 0,
      completionRate: 0
    })
    const [analyticsLoading, setAnalyticsLoading] = useState(true)
    const [trendsData, setTrendsData] = useState(null)
    const [trendsLoading, setTrendsLoading] = useState(true)

    // Fetch analytics data
    const fetchAnalytics = async () => {
      try {
        setAnalyticsLoading(true)
        const params = new URLSearchParams({
          start: dateRange.start,
          end: dateRange.end
        })

        const response = await fetch(`/api/admin/analytics/overview?${params.toString()}`)
        const data = await response.json()

        if (response.ok && data.success) {
          setAnalytics(data.data)
        } else {
          console.error('Failed to fetch analytics:', data.error)
        }
      } catch (error) {
        console.error('Error fetching analytics:', error)
      } finally {
        setAnalyticsLoading(false)
      }
    }

    // Fetch trends data
    const fetchTrends = async () => {
      try {
        setTrendsLoading(true)
        const params = new URLSearchParams({
          start: dateRange.start,
          end: dateRange.end
        })

        const response = await fetch(`/api/admin/analytics/completion-trends?${params.toString()}`)
        const data = await response.json()

        if (response.ok && data.success) {
          setTrendsData(data.data)
        } else {
          console.error('Failed to fetch trends:', data.error)
        }
      } catch (error) {
        console.error('Error fetching trends:', error)
      } finally {
        setTrendsLoading(false)
      }
    }

    // Fetch analytics and trends on component mount and date range change
    useEffect(() => {
      fetchAnalytics()
      fetchTrends()
    }, [dateRange])

    const applyDateRange = () => {
      fetchAnalytics()
      fetchTrends()
    }

    const StatCard = ({ title, value, subtitle, icon: Icon, color, change }) => (
      <div style={{
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 6px rgba(15, 44, 105, 0.06)',
        padding: '16px',
        borderTop: `3px solid ${color}`,
        minWidth: '200px',
        flex: 1
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ flex: 1 }}>
            <p style={{
              fontSize: '11px',
              fontWeight: '600',
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              margin: '0 0 6px 0'
            }}>
              {title}
            </p>
            <p style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#111827',
              margin: '0 0 2px 0'
            }}>
              {analyticsLoading ? '...' : value}
            </p>
            <p style={{
              fontSize: '10px',
              color: '#6b7280',
              margin: '0',
              lineHeight: '1.2'
            }}>
              {subtitle}
            </p>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            backgroundColor: color,
            marginLeft: '8px'
          }}>
            <Icon size={14} color="white" />
          </div>
        </div>
      </div>
    )

    return (
      <div>
        {/* Date Range Filter */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 12px rgba(15, 44, 105, 0.08)',
          padding: '20px',
          marginBottom: '24px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <Calendar size={16} color="#6b7280" />
              <span style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151'
              }}>
                Date Range:
              </span>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                style={{
                  padding: '8px 12px',
                  fontSize: '14px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '6px',
                  outline: 'none'
                }}
              />
              <span style={{ color: '#6b7280' }}>to</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                style={{
                  padding: '8px 12px',
                  fontSize: '14px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '6px',
                  outline: 'none'
                }}
              />
              <button
                onClick={applyDateRange}
                disabled={analyticsLoading}
                style={{
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: 'white',
                  backgroundColor: analyticsLoading ? '#9ca3af' : '#7f7afe',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: analyticsLoading ? 'not-allowed' : 'pointer'
                }}
              >
                {analyticsLoading ? 'Loading...' : 'Apply'}
              </button>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '24px',
          flexWrap: 'wrap'
        }}>
          <StatCard
            title="Total Assessments"
            value={analytics.totalAssessments}
            subtitle="Completed assessments"
            icon={CheckCircle}
            color="#10b981"
          />
          <StatCard
            title="Organizations"
            value={analytics.totalOrganizations}
            subtitle="Unique organizations"
            icon={Users}
            color="#6366f1"
          />
          <StatCard
            title="Avg Maturity Score"
            value={analytics.avgMaturityScore}
            subtitle="Based on valid responses only"
            icon={Target}
            color="#f59e0b"
          />
          <StatCard
            title="Completion Rate"
            value={`${analytics.completionRate}%`}
            subtitle="Completed vs attempted codes"
            icon={TrendingUp}
            color="#06b6d4"
          />
        </div>

        {/* Completion Trends Charts */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
          marginBottom: '32px'
        }}>
          {/* Monthly Trends Chart */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 12px rgba(15, 44, 105, 0.08)',
            padding: '20px'
          }}>
            <h3 style={{
              marginBottom: '16px',
              color: '#374151',
              fontSize: '16px',
              fontWeight: '600'
            }}>
              Monthly Completion Trends
            </h3>
            <div style={{ height: '250px' }}>
              {trendsLoading ? (
                <div style={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6b7280'
                }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    border: '2px solid #e5e7eb',
                    borderTop: '2px solid #7f7afe',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    marginRight: '8px'
                  }}></div>
                  Loading chart...
                </div>
              ) : trendsData?.monthlyTrends?.length > 0 ? (
                <Line
                  data={{
                    labels: trendsData.monthlyTrends.map(item => {
                      const [year, month] = item.month.split('-')
                      return new Date(year, month - 1).toLocaleDateString('en-US', {
                        month: 'short',
                        year: '2-digit'
                      })
                    }),
                    datasets: [{
                      label: 'Completions',
                      data: trendsData.monthlyTrends.map(item => item.completions),
                      borderColor: '#7f7afe',
                      backgroundColor: 'rgba(127, 122, 254, 0.1)',
                      fill: true,
                      tension: 0.4,
                      pointBackgroundColor: '#7f7afe',
                      pointBorderColor: '#ffffff',
                      pointBorderWidth: 2,
                      pointRadius: 4
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        grid: {
                          color: '#f3f4f6'
                        },
                        ticks: {
                          color: '#6b7280',
                          font: { size: 11 }
                        }
                      },
                      x: {
                        grid: {
                          display: false
                        },
                        ticks: {
                          color: '#6b7280',
                          font: { size: 11 }
                        }
                      }
                    }
                  }}
                />
              ) : (
                <div style={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6b7280',
                  textAlign: 'center'
                }}>
                  <div>
                    <BarChart3 size={32} style={{ margin: '0 auto 8px', display: 'block' }} />
                    <p style={{ fontSize: '14px' }}>No monthly data available</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Top Organizations Chart */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 12px rgba(15, 44, 105, 0.08)',
            padding: '20px'
          }}>
            <h3 style={{
              marginBottom: '16px',
              color: '#374151',
              fontSize: '16px',
              fontWeight: '600'
            }}>
              Top Organizations
            </h3>
            <div style={{ height: '250px' }}>
              {trendsLoading ? (
                <div style={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6b7280'
                }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    border: '2px solid #e5e7eb',
                    borderTop: '2px solid #7f7afe',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    marginRight: '8px'
                  }}></div>
                  Loading chart...
                </div>
              ) : trendsData?.organizationCompletion?.length > 0 ? (
                <Bar
                  data={{
                    labels: trendsData.organizationCompletion.slice(0, 6).map(org =>
                      org.organization.length > 15 ? org.organization.substring(0, 15) + '...' : org.organization
                    ),
                    datasets: [{
                      label: 'Completions',
                      data: trendsData.organizationCompletion.slice(0, 6).map(org => org.completions),
                      backgroundColor: [
                        '#10b981', '#06b6d4', '#8b5cf6', '#f59e0b', '#ef4444', '#6366f1'
                      ],
                      borderRadius: 4,
                      borderSkipped: false
                    }]
                  }}
                  options={{
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false
                      }
                    },
                    scales: {
                      x: {
                        beginAtZero: true,
                        grid: {
                          color: '#f3f4f6'
                        },
                        ticks: {
                          color: '#6b7280',
                          font: { size: 11 }
                        }
                      },
                      y: {
                        grid: {
                          display: false
                        },
                        ticks: {
                          color: '#6b7280',
                          font: { size: 11 }
                        }
                      }
                    }
                  }}
                />
              ) : (
                <div style={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6b7280',
                  textAlign: 'center'
                }}>
                  <div>
                    <Users size={32} style={{ margin: '0 auto 8px', display: 'block' }} />
                    <p style={{ fontSize: '14px' }}>No organization data available</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Assessment Types Chart */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 12px rgba(15, 44, 105, 0.08)',
            padding: '20px'
          }}>
            <h3 style={{
              marginBottom: '16px',
              color: '#374151',
              fontSize: '16px',
              fontWeight: '600'
            }}>
              Assessment Types
            </h3>
            <div style={{ height: '250px' }}>
              {trendsLoading ? (
                <div style={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6b7280'
                }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    border: '2px solid #e5e7eb',
                    borderTop: '2px solid #7f7afe',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    marginRight: '8px'
                  }}></div>
                  Loading chart...
                </div>
              ) : trendsData?.typeDistribution?.length > 0 ? (
                <Doughnut
                  data={{
                    labels: trendsData.typeDistribution.map(type =>
                      type.type === 'full' ? 'Full Assessment' : 'Quick Assessment'
                    ),
                    datasets: [{
                      data: trendsData.typeDistribution.map(type => type.completions),
                      backgroundColor: ['#7f7afe', '#10b981'],
                      borderWidth: 0,
                      cutout: '60%'
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: {
                          padding: 20,
                          usePointStyle: true,
                          font: { size: 12 },
                          color: '#374151'
                        }
                      }
                    }
                  }}
                />
              ) : (
                <div style={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6b7280',
                  textAlign: 'center'
                }}>
                  <div>
                    <Target size={32} style={{ margin: '0 auto 8px', display: 'block' }} />
                    <p style={{ fontSize: '14px' }}>No assessment type data available</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Daily Trends Chart */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 12px rgba(15, 44, 105, 0.08)',
            padding: '20px'
          }}>
            <h3 style={{
              marginBottom: '16px',
              color: '#374151',
              fontSize: '16px',
              fontWeight: '600'
            }}>
              Daily Activity (Last 30 Days)
            </h3>
            <div style={{ height: '250px' }}>
              {trendsLoading ? (
                <div style={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6b7280'
                }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    border: '2px solid #e5e7eb',
                    borderTop: '2px solid #7f7afe',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    marginRight: '8px'
                  }}></div>
                  Loading chart...
                </div>
              ) : trendsData?.dailyTrends?.length > 0 ? (
                <Line
                  data={{
                    labels: trendsData.dailyTrends.map(day =>
                      new Date(day.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })
                    ),
                    datasets: [{
                      label: 'Daily Completions',
                      data: trendsData.dailyTrends.map(day => day.completions),
                      borderColor: '#06b6d4',
                      backgroundColor: 'rgba(6, 182, 212, 0.2)',
                      fill: true,
                      tension: 0.4,
                      pointBackgroundColor: '#06b6d4',
                      pointBorderColor: '#ffffff',
                      pointBorderWidth: 2,
                      pointRadius: 3
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        grid: {
                          color: '#f3f4f6'
                        },
                        ticks: {
                          color: '#6b7280',
                          font: { size: 11 }
                        }
                      },
                      x: {
                        grid: {
                          display: false
                        },
                        ticks: {
                          color: '#6b7280',
                          font: { size: 11 },
                          maxTicksLimit: 10
                        }
                      }
                    }
                  }}
                />
              ) : (
                <div style={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6b7280',
                  textAlign: 'center'
                }}>
                  <div>
                    <Calendar size={32} style={{ margin: '0 auto 8px', display: 'block' }} />
                    <p style={{ fontSize: '14px' }}>No daily activity data available</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Assessment Reports View
  const AssessmentReportsView = () => {
    const [reportType, setReportType] = useState('single') // 'single' | 'multiple'
    const [selectedCodes, setSelectedCodes] = useState([])
    const [organizationFilter, setOrganizationFilter] = useState([]) // Changed to array for multi-select
    const [userFilter, setUserFilter] = useState([]) // Changed to array for multi-select
    const [departmentFilter, setDepartmentFilter] = useState([]) // Changed to array for multi-select
    const [dateFilter, setDateFilter] = useState({
      start: getCurrentYearStart(),
      end: getTodayDate()
    })
    const [availableCodes, setAvailableCodes] = useState([])
    const [availableOrganizations, setAvailableOrganizations] = useState([])
    const [availableUsers, setAvailableUsers] = useState([])
    const [availableDepartments, setAvailableDepartments] = useState([])
    const [codesLoading, setCodesLoading] = useState(true)
    const [reportData, setReportData] = useState(null)
    const [generatingReport, setGeneratingReport] = useState(false)

    // Search states for multi-select filters
    const [organizationSearch, setOrganizationSearch] = useState('')
    const [userSearch, setUserSearch] = useState('')
    const [departmentSearch, setDepartmentSearch] = useState('')
    const [organizationDropdownOpen, setOrganizationDropdownOpen] = useState(false)
    const [userDropdownOpen, setUserDropdownOpen] = useState(false)
    const [departmentDropdownOpen, setDepartmentDropdownOpen] = useState(false)

    // Fetch available assessment codes
    const fetchAssessmentCodes = async () => {
      try {
        setCodesLoading(true)
        const params = new URLSearchParams({
          start: dateFilter.start,
          end: dateFilter.end,
          organization: organizationFilter.length > 0 ? organizationFilter.join(',') : 'all',
          user: userFilter.length > 0 ? userFilter.join(',') : 'all',
          department: departmentFilter.length > 0 ? departmentFilter.join(',') : 'all'
        })

        const response = await fetch(`/api/admin/analytics/assessment-codes?${params.toString()}`)
        const data = await response.json()

        if (response.ok && data.success) {
          setAvailableCodes(data.codes)
          setAvailableOrganizations(data.organizations)
          setAvailableUsers(data.users)
          setAvailableDepartments(data.departments)
        } else {
          console.error('Failed to fetch assessment codes:', data.error)
        }
      } catch (error) {
        console.error('Error fetching assessment codes:', error)
      } finally {
        setCodesLoading(false)
      }
    }

    // Fetch codes on component mount and filter changes
    useEffect(() => {
      fetchAssessmentCodes()
    }, [dateFilter, organizationFilter, userFilter, departmentFilter])

    // Handle click outside to close dropdowns
    useEffect(() => {
      const handleClickOutside = (event) => {
        const target = event.target
        const isOrganizationDropdown = target.closest('[data-dropdown="organization"]')
        const isUserDropdown = target.closest('[data-dropdown="user"]')
        const isDepartmentDropdown = target.closest('[data-dropdown="department"]')

        if (!isOrganizationDropdown && organizationDropdownOpen) {
          setOrganizationDropdownOpen(false)
        }
        if (!isUserDropdown && userDropdownOpen) {
          setUserDropdownOpen(false)
        }
        if (!isDepartmentDropdown && departmentDropdownOpen) {
          setDepartmentDropdownOpen(false)
        }
      }

      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [organizationDropdownOpen, userDropdownOpen, departmentDropdownOpen])

    // Handle cascading filter changes
    const handleOrganizationChange = (newSelection) => {
      setOrganizationFilter(newSelection)
      // Reset dependent filters when organization changes
      setUserFilter([])
      setDepartmentFilter([])
      setSelectedCodes([])
    }

    // Organization multi-select handlers
    const handleOrganizationToggle = (organization) => {
      const newSelection = organizationFilter.includes(organization)
        ? organizationFilter.filter(o => o !== organization)
        : [...organizationFilter, organization]
      handleOrganizationChange(newSelection)
    }

    const handleOrganizationSelectAll = () => {
      if (organizationFilter.length === availableOrganizations.length) {
        handleOrganizationChange([])
      } else {
        handleOrganizationChange([...availableOrganizations])
      }
    }

    // Clear all filters handler
    const handleClearFilters = () => {
      setOrganizationFilter([])
      setUserFilter([])
      setDepartmentFilter([])
      setSelectedCodes([])
      // Reset search states
      setOrganizationSearch('')
      setUserSearch('')
      setDepartmentSearch('')
      // Close all dropdowns
      setOrganizationDropdownOpen(false)
      setUserDropdownOpen(false)
      setDepartmentDropdownOpen(false)
    }

    const handleUserChange = (selectedUsers) => {
      setUserFilter(selectedUsers)
      // Reset department filter when user changes (since departments are filtered by user)
      setDepartmentFilter([])
      setSelectedCodes([])
    }

    const handleDepartmentChange = (selectedDepartments) => {
      setDepartmentFilter(selectedDepartments)
      // Reset user filter when department changes (since users are filtered by department)
      setUserFilter([])
      setSelectedCodes([])
    }

    // Multi-select helper functions
    const toggleUserSelection = (user) => {
      const newSelection = userFilter.includes(user)
        ? userFilter.filter(u => u !== user)
        : [...userFilter, user]
      handleUserChange(newSelection)
    }

    const toggleDepartmentSelection = (department) => {
      const newSelection = departmentFilter.includes(department)
        ? departmentFilter.filter(d => d !== department)
        : [...departmentFilter, department]
      handleDepartmentChange(newSelection)
    }

    const selectAllUsers = () => {
      if (userFilter.length === availableUsers.length) {
        handleUserChange([])
      } else {
        handleUserChange([...availableUsers])
      }
    }

    const selectAllDepartments = () => {
      if (departmentFilter.length === availableDepartments.length) {
        handleDepartmentChange([])
      } else {
        handleDepartmentChange([...availableDepartments])
      }
    }

    // Department multi-select handlers
    const handleDepartmentToggle = (department) => {
      const newSelection = departmentFilter.includes(department)
        ? departmentFilter.filter(d => d !== department)
        : [...departmentFilter, department]
      handleDepartmentChange(newSelection)
    }

    const handleDepartmentSelectAll = () => {
      if (departmentFilter.length === availableDepartments.length) {
        handleDepartmentChange([])
      } else {
        handleDepartmentChange([...availableDepartments])
      }
    }

    const generateReport = async () => {
      if (selectedCodes.length === 0) {
        alert('Please select at least one assessment code')
        return
      }

      try {
        setGeneratingReport(true)
        setReportData(null)

        const response = await fetch('/api/admin/reports/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            codes: selectedCodes,
            reportType: reportType === 'single' ? 'individual' : 'collective'
          })
        })

        const data = await response.json()

        if (response.ok && data.success) {
          setReportData(data.report)
        } else {
          alert(`Error generating report: ${data.error}`)
        }
      } catch (error) {
        console.error('Error generating report:', error)
        alert('Failed to generate report. Please try again.')
      } finally {
        setGeneratingReport(false)
      }
    }

    const exportToPDF = async () => {
      if (!reportData) return

      try {
        // Show loading indicator
        const button = document.querySelector('button[onClick*="exportToPDF"]');
        const originalText = button?.textContent;
        if (button) button.textContent = 'Generating PDF...';

        const response = await fetch('/api/export-pdf', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            reportData,
            reportType
          })
        });

        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = `admin-assessment-report-${reportType}-${new Date().toISOString().split('T')[0]}.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        } else {
          throw new Error('Failed to generate PDF');
        }

        // Restore button text
        if (button && originalText) button.textContent = originalText;

      } catch (error) {
        console.error('PDF download error:', error);
        alert('Error downloading PDF');

        // Restore button text on error
        const button = document.querySelector('button[onClick*="exportToPDF"]');
        if (button) button.textContent = 'Download PDF Report';
      }
    }

    return (
      <div>
        {/* Report Type Selection */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 12px rgba(15, 44, 105, 0.08)',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <h3 style={{ marginBottom: '20px', color: '#374151', fontSize: '18px', fontWeight: '600' }}>
            Generate Assessment Report
          </h3>

          {/* Report Type Toggle */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '12px' }}>
              Report Type:
            </label>
            <div style={{ display: 'flex', gap: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  value="single"
                  checked={reportType === 'single'}
                  onChange={(e) => setReportType(e.target.value)}
                  style={{ accentColor: '#7f7afe' }}
                />
                <span style={{ fontSize: '14px', color: '#374151' }}>Single Assessment Code Report</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  value="multiple"
                  checked={reportType === 'multiple'}
                  onChange={(e) => setReportType(e.target.value)}
                  style={{ accentColor: '#7f7afe' }}
                />
                <span style={{ fontSize: '14px', color: '#374151' }}>Multiple Codes Report (Consolidated)</span>
              </label>
            </div>
          </div>

          {/* Filters */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '24px'
          }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                Organization Filter:
              </label>
              <div style={{ position: 'relative' }} data-dropdown="organization">
                <div
                  onClick={() => !codesLoading && setOrganizationDropdownOpen(!organizationDropdownOpen)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '14px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '6px',
                    backgroundColor: 'white',
                    cursor: codesLoading ? 'not-allowed' : 'pointer',
                    opacity: codesLoading ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    minHeight: '38px'
                  }}
                >
                  <span style={{ color: organizationFilter.length === 0 ? '#9ca3af' : '#374151' }}>
                    {organizationFilter.length === 0
                      ? 'All Organizations'
                      : `${organizationFilter.length} organization${organizationFilter.length > 1 ? 's' : ''} selected`
                    }
                  </span>
                  <span style={{ color: '#6b7280', fontSize: '12px' }}>
                    {organizationDropdownOpen ? '▲' : '▼'}
                  </span>
                </div>

                {organizationDropdownOpen && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: 'white',
                    border: '2px solid #e5e7eb',
                    borderRadius: '6px',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                    zIndex: 1000,
                    maxHeight: '300px',
                    overflow: 'hidden'
                  }}>
                    {/* Search Input */}
                    <div style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>
                      <input
                        type="text"
                        placeholder="Search organizations..."
                        value={organizationSearch}
                        onChange={(e) => setOrganizationSearch(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          fontSize: '12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          outline: 'none'
                        }}
                      />
                    </div>

                    {/* Select All/Deselect All */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation()
                        handleOrganizationSelectAll()
                      }}
                      style={{
                        padding: '12px 16px',
                        cursor: 'pointer',
                        backgroundColor: '#f8fafc',
                        borderBottom: '1px solid #e5e7eb',
                        fontSize: '12px',
                        fontWeight: '500',
                        color: '#7f7afe',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                    >
                      <span>
                        {organizationFilter.length === availableOrganizations.length ? 'Deselect All' : 'Select All'}
                      </span>
                      <span style={{ color: '#6b7280', fontSize: '11px' }}>
                        ({organizationFilter.length}/{availableOrganizations.length})
                      </span>
                    </div>

                    {/* Organization Options */}
                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      {availableOrganizations
                        .filter(org => org.toLowerCase().includes(organizationSearch.toLowerCase()))
                        .map(org => (
                          <div
                            key={org}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleOrganizationToggle(org)
                            }}
                            style={{
                              padding: '12px 16px',
                              cursor: 'pointer',
                              fontSize: '13px',
                              borderBottom: '1px solid #f3f4f6',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              color: '#374151'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                          >
                            <span>{organizationFilter.includes(org) ? '✓' : '☐'}</span>
                            {org}
                          </div>
                        ))}

                      {availableOrganizations.filter(org => org.toLowerCase().includes(organizationSearch.toLowerCase())).length === 0 && organizationSearch && (
                        <div style={{ padding: '12px', textAlign: 'center', color: '#6b7280', fontSize: '12px' }}>
                          No organizations found matching &quot;{organizationSearch}&quot;
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                User Filter: {userFilter.length > 0 && `(${userFilter.length} selected)`}
              </label>
              <div style={{ position: 'relative' }} data-dropdown="user">
                <div
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '14px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '6px',
                    backgroundColor: 'white',
                    cursor: codesLoading ? 'not-allowed' : 'pointer',
                    opacity: codesLoading ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <span style={{ color: userFilter.length === 0 ? '#9ca3af' : '#374151' }}>
                    {userFilter.length === 0 ? 'All Users' :
                     userFilter.length === 1 ? userFilter[0] :
                     `${userFilter.length} users selected`}
                  </span>
                  <span style={{ color: '#6b7280' }}>▼</span>
                </div>

                {userDropdownOpen && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: 'white',
                    border: '2px solid #e5e7eb',
                    borderTop: 'none',
                    borderRadius: '0 0 6px 6px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    zIndex: 1000,
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}>
                    {/* Search box */}
                    <div style={{ padding: '8px' }}>
                      <input
                        type="text"
                        placeholder="Search users..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          fontSize: '12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          outline: 'none'
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>

                    {/* Select All option */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation()
                        selectAllUsers()
                      }}
                      style={{
                        padding: '8px 12px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        backgroundColor: '#f3f4f6',
                        cursor: 'pointer',
                        borderBottom: '1px solid #e5e7eb',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                    >
                      <span>{userFilter.length === availableUsers.length ? '✓' : '☐'}</span>
                      {userFilter.length === availableUsers.length ? 'Deselect All' : 'Select All'} ({availableUsers.length})
                    </div>

                    {/* User options */}
                    {availableUsers
                      .filter(user => user.toLowerCase().includes(userSearch.toLowerCase()))
                      .map(user => (
                        <div
                          key={user}
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleUserSelection(user)
                          }}
                          style={{
                            padding: '8px 12px',
                            fontSize: '14px',
                            cursor: 'pointer',
                            backgroundColor: 'white',
                            borderBottom: '1px solid #f3f4f6',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                        >
                          <span>{userFilter.includes(user) ? '✓' : '☐'}</span>
                          {user}
                        </div>
                      ))}

                    {availableUsers.filter(user => user.toLowerCase().includes(userSearch.toLowerCase())).length === 0 && userSearch && (
                      <div style={{ padding: '12px', textAlign: 'center', color: '#6b7280', fontSize: '12px' }}>
                        No users found matching &quot;{userSearch}&quot;
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                Department Filter:
              </label>
              <div style={{ position: 'relative' }} data-dropdown="department">
                <div
                  onClick={() => !codesLoading && setDepartmentDropdownOpen(!departmentDropdownOpen)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '14px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '6px',
                    backgroundColor: 'white',
                    cursor: codesLoading ? 'not-allowed' : 'pointer',
                    opacity: codesLoading ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    minHeight: '38px'
                  }}
                >
                  <span style={{ color: departmentFilter.length === 0 ? '#9ca3af' : '#374151' }}>
                    {departmentFilter.length === 0
                      ? 'All Departments'
                      : `${departmentFilter.length} department${departmentFilter.length > 1 ? 's' : ''} selected`
                    }
                  </span>
                  <span style={{ color: '#6b7280', fontSize: '12px' }}>
                    {departmentDropdownOpen ? '▲' : '▼'}
                  </span>
                </div>

                {departmentDropdownOpen && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: 'white',
                    border: '2px solid #e5e7eb',
                    borderRadius: '6px',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                    zIndex: 1000,
                    maxHeight: '300px',
                    overflow: 'hidden'
                  }}>
                    {/* Search Input */}
                    <div style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>
                      <input
                        type="text"
                        placeholder="Search departments..."
                        value={departmentSearch}
                        onChange={(e) => setDepartmentSearch(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          fontSize: '12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          outline: 'none'
                        }}
                      />
                    </div>

                    {/* Select All/Deselect All */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDepartmentSelectAll()
                      }}
                      style={{
                        padding: '12px 16px',
                        cursor: 'pointer',
                        backgroundColor: '#f8fafc',
                        borderBottom: '1px solid #e5e7eb',
                        fontSize: '12px',
                        fontWeight: '500',
                        color: '#7f7afe',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                    >
                      <span>
                        {departmentFilter.length === availableDepartments.length ? 'Deselect All' : 'Select All'}
                      </span>
                      <span style={{ color: '#6b7280', fontSize: '11px' }}>
                        ({departmentFilter.length}/{availableDepartments.length})
                      </span>
                    </div>

                    {/* Department Options */}
                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      {availableDepartments
                        .filter(dept => dept.toLowerCase().includes(departmentSearch.toLowerCase()))
                        .map(dept => (
                          <div
                            key={dept}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDepartmentToggle(dept)
                            }}
                            style={{
                              padding: '12px 16px',
                              cursor: 'pointer',
                              fontSize: '13px',
                              borderBottom: '1px solid #f3f4f6',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              color: '#374151'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                          >
                            <span>{departmentFilter.includes(dept) ? '✓' : '☐'}</span>
                            {dept}
                          </div>
                        ))}

                      {availableDepartments.filter(dept => dept.toLowerCase().includes(departmentSearch.toLowerCase())).length === 0 && departmentSearch && (
                        <div style={{ padding: '12px', textAlign: 'center', color: '#6b7280', fontSize: '12px' }}>
                          No departments found matching &quot;{departmentSearch}&quot;
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                Date From:
              </label>
              <input
                type="date"
                value={dateFilter.start}
                onChange={(e) => setDateFilter(prev => ({ ...prev, start: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: '14px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '6px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                Date To:
              </label>
              <input
                type="date"
                value={dateFilter.end}
                onChange={(e) => setDateFilter(prev => ({ ...prev, end: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: '14px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '6px'
                }}
              />
            </div>
          </div>

          {/* Clear Filters Button */}
          <div style={{ marginBottom: '20px', textAlign: 'right' }}>
            <button
              onClick={handleClearFilters}
              disabled={organizationFilter.length === 0 && userFilter.length === 0 && departmentFilter.length === 0 && selectedCodes.length === 0}
              style={{
                padding: '8px 16px',
                fontSize: '12px',
                fontWeight: '500',
                backgroundColor: organizationFilter.length === 0 && userFilter.length === 0 && departmentFilter.length === 0 && selectedCodes.length === 0 ? '#f3f4f6' : '#ef4444',
                color: organizationFilter.length === 0 && userFilter.length === 0 && departmentFilter.length === 0 && selectedCodes.length === 0 ? '#9ca3af' : 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: organizationFilter.length === 0 && userFilter.length === 0 && departmentFilter.length === 0 && selectedCodes.length === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginLeft: 'auto',
                transition: 'all 0.2s ease',
                opacity: organizationFilter.length === 0 && userFilter.length === 0 && departmentFilter.length === 0 && selectedCodes.length === 0 ? 0.6 : 1
              }}
              onMouseOver={(e) => {
                if (organizationFilter.length > 0 || userFilter.length > 0 || departmentFilter.length > 0 || selectedCodes.length > 0) {
                  e.currentTarget.style.backgroundColor = '#dc2626'
                }
              }}
              onMouseOut={(e) => {
                if (organizationFilter.length > 0 || userFilter.length > 0 || departmentFilter.length > 0 || selectedCodes.length > 0) {
                  e.currentTarget.style.backgroundColor = '#ef4444'
                }
              }}
            >
              <Filter size={14} />
              Clear Filters
            </button>
          </div>

          {/* Assessment Code Selection */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '12px' }}>
              Select Assessment Code(s):
            </label>
            {codesLoading ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px',
                color: '#6b7280',
                border: '2px solid #e5e7eb',
                borderRadius: '8px'
              }}>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid #e5e7eb',
                  borderTop: '2px solid #7f7afe',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  marginRight: '8px'
                }}></div>
                Loading codes...
              </div>
            ) : availableCodes.length === 0 ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px',
                color: '#6b7280',
                textAlign: 'center',
                border: '2px solid #e5e7eb',
                borderRadius: '8px'
              }}>
                <div>
                  <Code size={24} style={{ margin: '0 auto 8px', display: 'block' }} />
                  <p>No assessment codes found for the selected filters</p>
                </div>
              </div>
            ) : (
              <select
                multiple={reportType === 'multiple'}
                value={reportType === 'single' ? selectedCodes[0] || '' : selectedCodes}
                onChange={(e) => {
                  if (reportType === 'single') {
                    setSelectedCodes(e.target.value ? [e.target.value] : [])
                  } else {
                    const values = Array.from(e.target.selectedOptions, option => option.value)

                    // Handle "Select All" option
                    if (values.includes('SELECT_ALL')) {
                      if (selectedCodes.length === availableCodes.length) {
                        // If all are selected, deselect all
                        setSelectedCodes([])
                      } else {
                        // Select all codes
                        setSelectedCodes(availableCodes.map(code => code.code))
                      }
                    } else {
                      // Regular selection handling
                      setSelectedCodes(values.filter(value => value !== 'SELECT_ALL'))
                    }
                  }
                }}
                style={{
                  width: '100%',
                  minHeight: reportType === 'multiple' ? '120px' : '50px',
                  padding: '12px',
                  fontSize: '14px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  outline: 'none',
                  fontFamily: 'inherit'
                }}
              >
                {reportType === 'single' && (
                  <option value="">Select an assessment code...</option>
                )}
                {reportType === 'multiple' && (
                  <option
                    value="SELECT_ALL"
                    style={{
                      padding: '8px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      backgroundColor: '#f3f4f6',
                      borderBottom: '1px solid #e5e7eb'
                    }}
                  >
                    {selectedCodes.length === availableCodes.length ? '✓ Deselect All' : '☐ Select All'} ({availableCodes.length} codes)
                  </option>
                )}
                {availableCodes.map((code) => (
                  <option
                    key={code.code}
                    value={code.code}
                    style={{
                      padding: '8px',
                      fontSize: '14px'
                    }}
                  >
                    {code.code} • {code.user_name || 'Unknown User'} • {code.organization_name || 'No Organization'} • {new Date(code.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </option>
                ))}
              </select>
            )}
            {reportType === 'multiple' && availableCodes.length > 0 && (
              <div style={{
                fontSize: '12px',
                color: '#6b7280',
                marginTop: '8px',
                fontStyle: 'italic'
              }}>
                Hold Ctrl (Cmd on Mac) to select multiple codes
              </div>
            )}
          </div>

          {/* Generate Report Button */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
            <button
              onClick={generateReport}
              disabled={selectedCodes.length === 0 || generatingReport}
              style={{
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: '600',
                color: 'white',
                backgroundColor: selectedCodes.length === 0 || generatingReport ? '#9ca3af' : '#7f7afe',
                border: 'none',
                borderRadius: '8px',
                cursor: selectedCodes.length === 0 || generatingReport ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background-color 0.2s ease'
              }}
            >
              {generatingReport ? (
                <>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid #ffffff',
                    borderTop: '2px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  Generating Report...
                </>
              ) : (
                <>
                  <FileText size={16} />
                  Generate Report
                </>
              )}
            </button>
          </div>
        </div>

        {/* Selected Codes Preview */}
        {selectedCodes.length > 0 && !reportData && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 12px rgba(15, 44, 105, 0.08)',
            padding: '20px'
          }}>
            <h4 style={{ marginBottom: '16px', color: '#374151' }}>
              Report Preview ({selectedCodes.length} code{selectedCodes.length > 1 ? 's' : ''} selected)
            </h4>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px'
            }}>
              {selectedCodes.map(code => (
                <span
                  key={code}
                  style={{
                    padding: '4px 8px',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#7f7afe',
                    backgroundColor: '#f0f0ff',
                    borderRadius: '4px'
                  }}
                >
                  {code}
                </span>
              ))}
            </div>
            <p style={{ marginTop: '12px', fontSize: '14px', color: '#6b7280' }}>
              {reportType === 'single'
                ? `Individual report will be generated for assessment code ${selectedCodes[0]}.`
                : `Collective report will be generated for ${selectedCodes.length} assessment codes.`
              }
            </p>
          </div>
        )}

        {/* Report Display - Matching User Results Page Design */}
        {reportData && (
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            paddingTop: '20px'
          }}>

            {/* Page Header - Matching User Results Style */}
            <div style={{
              textAlign: 'center',
              marginBottom: '40px',
              padding: '30px',
              background: 'linear-gradient(135deg, #0f2c69, #7f7afe)',
              color: 'white',
              borderRadius: '12px',
              position: 'relative'
            }}>
              <button
                onClick={() => setReportData(null)}
                style={{
                  position: 'absolute',
                  top: '15px',
                  right: '15px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  color: 'white',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Close Report
              </button>
              <h1 style={{
                fontSize: '2.5rem',
                fontWeight: '700',
                marginBottom: '10px',
                fontFamily: 'var(--font-primary)'
              }}>
                Data Maturity Assessment Report
              </h1>
              <div style={{
                fontSize: '1.1rem',
                opacity: '0.9',
                fontFamily: 'var(--font-primary)'
              }}>
                {reportData.reportInfo.isSingleAssessment ? (
                  <>
                    {reportData.userInfo?.name} • {reportData.userInfo?.role} • {reportData.userInfo?.organization}
                  </>
                ) : (
                  <>
                    {reportType === 'single' ? 'Individual Assessment' : 'Collective Assessment'} •
                    {reportData.reportInfo.codesCount} code{reportData.reportInfo.codesCount > 1 ? 's' : ''} •
                    {reportData.overallStats.totalSessions} session{reportData.overallStats.totalSessions > 1 ? 's' : ''}
                  </>
                )}
              </div>
            </div>

            {/* Results Grid - Matching User Results Style */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '30px',
              marginBottom: '40px'
            }}>

              {/* Overall Score Card - Matching User Results Style */}
              <div style={{
                textAlign: 'center',
                background: 'linear-gradient(135deg, rgba(15, 44, 105, 0.05), rgba(127, 122, 254, 0.05))',
                borderRadius: '12px',
                boxShadow: '0 2px 12px rgba(15, 44, 105, 0.08)',
                padding: '20px',
                borderLeft: '4px solid #0f2c69'
              }}>
                <h2 style={{
                  marginBottom: '20px',
                  fontFamily: 'var(--font-primary)',
                  color: '#0f2c69'
                }}>
                  Overall Data Maturity
                </h2>

                {/* Circular Progress - Matching User Results Style */}
                <div style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  background: `conic-gradient(#7f7afe 0deg, #7f7afe ${reportData.overallStats.overallScore * 72}deg, #ededed ${reportData.overallStats.overallScore * 72}deg, #ededed 360deg)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                  position: 'relative'
                }}>
                  <div style={{
                    width: '90px',
                    height: '90px',
                    background: 'white',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'absolute'
                  }}>
                    <span style={{
                      fontSize: '1.8rem',
                      fontWeight: '700',
                      color: '#0f2c69',
                      fontFamily: 'var(--font-primary)'
                    }}>
                      {reportData.overallStats.overallScore}
                    </span>
                  </div>
                </div>

                <div style={{
                  fontSize: '1.2rem',
                  fontWeight: '600',
                  color: '#7f7afe',
                  marginBottom: '10px',
                  fontFamily: 'var(--font-primary)'
                }}>
                  {reportData.overallStats.maturityLevel}
                </div>

                <div style={{
                  fontSize: '0.9rem',
                  color: '#7f7afe',
                  fontFamily: 'var(--font-primary)'
                }}>
                  {reportData.reportInfo.isSingleAssessment ? (
                    `Based on ${reportData.overallStats.questionsAnswered} of ${reportData.overallStats.totalQuestions} questions`
                  ) : (
                    `Based on ${reportData.overallStats.totalSessions} completed assessment${reportData.overallStats.totalSessions > 1 ? 's' : ''}`
                  )}
                </div>
              </div>

              {/* Quick Stats - Matching User Results Style */}
              <div style={{
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 2px 12px rgba(15, 44, 105, 0.08)',
                padding: '20px',
                borderLeft: '4px solid #0f2c69'
              }}>
                <h3 style={{
                  marginBottom: '20px',
                  fontFamily: 'var(--font-primary)',
                  color: '#0f2c69'
                }}>
                  Assessment Summary
                </h3>

                {reportData.reportInfo.isSingleAssessment ? (
                  <>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '15px'
                    }}>
                      <span style={{ fontFamily: 'var(--font-primary)' }}>Questions Answered:</span>
                      <strong style={{ fontFamily: 'var(--font-primary)' }}>
                        {reportData.overallStats.questionsAnswered}/{reportData.overallStats.totalQuestions}
                      </strong>
                    </div>

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '15px'
                    }}>
                      <span style={{ fontFamily: 'var(--font-primary)' }}>Completion Rate:</span>
                      <strong style={{ fontFamily: 'var(--font-primary)' }}>{reportData.overallStats.completionRate}%</strong>
                    </div>

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '15px'
                    }}>
                      <span style={{ fontFamily: 'var(--font-primary)' }}>Your Role:</span>
                      <strong style={{ fontFamily: 'var(--font-primary)' }}>{reportData.userInfo?.role}</strong>
                    </div>

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}>
                      <span style={{ fontFamily: 'var(--font-primary)' }}>Completed:</span>
                      <strong style={{ fontFamily: 'var(--font-primary)' }}>
                        {new Date(reportData.userInfo?.completedDate).toLocaleDateString('en-US')}
                      </strong>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '15px'
                    }}>
                      <span style={{ fontFamily: 'var(--font-primary)' }}>Total Sessions:</span>
                      <strong style={{ fontFamily: 'var(--font-primary)' }}>
                        {reportData.overallStats.totalSessions}
                      </strong>
                    </div>

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '15px'
                    }}>
                      <span style={{ fontFamily: 'var(--font-primary)' }}>Organizations:</span>
                      <strong style={{ fontFamily: 'var(--font-primary)' }}>{reportData.organizations?.length || 0}</strong>
                    </div>

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '15px'
                    }}>
                      <span style={{ fontFamily: 'var(--font-primary)' }}>Average Completion:</span>
                      <strong style={{ fontFamily: 'var(--font-primary)' }}>{reportData.overallStats.averageCompletion}%</strong>
                    </div>

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}>
                      <span style={{ fontFamily: 'var(--font-primary)' }}>Generated:</span>
                      <strong style={{ fontFamily: 'var(--font-primary)' }}>
                        {new Date().toLocaleDateString('en-US')}
                      </strong>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Domain Scores - Full Width - Matching User Results Style */}
            <div style={{
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 2px 12px rgba(15, 44, 105, 0.08)',
              padding: '20px',
              borderLeft: '4px solid #0f2c69',
              marginBottom: '30px'
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                color: '#0f2c69',
                marginBottom: '20px',
                textAlign: 'center',
                fontFamily: 'var(--font-primary)'
              }}>
                Scores by Dimension
              </h2>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                gap: '20px'
              }}>
                  {reportData.subdomainScores && reportData.subdomainScores.map((domain, index) => (
                    <div key={domain.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '15px 0',
                      borderBottom: index < reportData.subdomainScores.length - 1 ? '1px solid #ededed' : 'none'
                    }}>
                      <div style={{ flex: '1' }}>
                        <div style={{
                          fontWeight: '600',
                          color: domain.questions_answered === 0 ? '#6c757d' : '#0f2c69',
                          marginBottom: '5px',
                          fontFamily: 'var(--font-primary)'
                        }}>
                          {domain.name}
                        </div>
                        <div style={{
                          fontSize: '0.85rem',
                          color: '#7f7afe',
                          fontFamily: 'var(--font-primary)'
                        }}>
                          {domain.description}
                        </div>
                      </div>

                      <div style={{
                        textAlign: 'right',
                        marginLeft: '15px'
                      }}>
                        <div style={{
                          fontSize: '1.2rem',
                          fontWeight: '700',
                          color: domain.questions_answered === 0 ? '#6c757d' : '#0f2c69',
                          fontFamily: 'var(--font-primary)'
                        }}>
                          {domain.questions_answered === 0 ?
                            'Not Assessed' :
                            domain.score.toFixed(1)
                          }
                        </div>
                        <div style={{
                          width: '80px',
                          height: '8px',
                          background: '#ededed',
                          borderRadius: '4px',
                          overflow: 'hidden',
                          marginTop: '5px'
                        }}>
                          <div style={{
                            height: '100%',
                            background: domain.questions_answered === 0 ?
                              'repeating-linear-gradient(45deg, #ededed, #ededed 5px, white 5px, white 10px)' :
                              'linear-gradient(90deg, #0f2c69, #7f7afe)',
                            borderRadius: '4px',
                            width: domain.questions_answered === 0 ? '100%' : `${domain.percentage}%`,
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Radar Chart - Full Width */}
            <div style={{
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 2px 12px rgba(15, 44, 105, 0.08)',
              padding: '20px',
              marginBottom: '30px',
              borderLeft: '4px solid #0f2c69'
            }}>
              <h2 style={{
                marginBottom: '20px',
                fontFamily: 'var(--font-primary)',
                color: '#0f2c69',
                textAlign: 'center'
              }}>
                Maturity Overview
              </h2>
              <div style={{ maxWidth: '450px', margin: '0 auto', padding: '15px' }}>
                <Radar
                  data={{
                    labels: reportData.subdomainScores.map(d => d.name),
                    datasets: [{
                      label: 'Score',
                      data: reportData.subdomainScores.map(d =>
                        d.questions_answered === 0 ? 0 : parseFloat(d.score) || 0
                      ),
                      backgroundColor: 'rgba(127, 122, 254, 0.15)',
                      borderColor: 'rgba(127, 122, 254, 1)',
                      borderWidth: 2,
                      pointBackgroundColor: reportData.subdomainScores.map(d =>
                        DOMAIN_COLORS[d.domain_id]?.point || 'rgba(127, 122, 254, 1)'
                      ),
                      pointBorderColor: '#fff',
                      pointBorderWidth: 2,
                      pointHoverBackgroundColor: '#fff',
                      pointHoverBorderColor: reportData.subdomainScores.map(d =>
                        DOMAIN_COLORS[d.domain_id]?.border || 'rgba(127, 122, 254, 1)'
                      ),
                      pointRadius: 5,
                      pointHoverRadius: 7,
                      tension: 0.3
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: true,
                    scales: {
                      r: {
                        min: 0,
                        max: 5,
                        ticks: {
                          stepSize: 1,
                          font: {
                            family: 'var(--font-primary)',
                            size: 11
                          }
                        },
                        pointLabels: {
                          font: {
                            family: 'var(--font-primary)',
                            size: 12,
                            weight: '600'
                          },
                          color: reportData.subdomainScores.map(d =>
                            DOMAIN_COLORS[d.domain_id]?.text || '#0f2c69'
                          )
                        },
                        grid: {
                          color: 'rgba(0, 0, 0, 0.1)'
                        },
                        angleLines: {
                          color: 'rgba(0, 0, 0, 0.1)'
                        }
                      }
                    },
                    plugins: {
                      legend: {
                        display: false
                      },
                      tooltip: {
                        enabled: true,
                        callbacks: {
                          label: function(context) {
                            return `Score: ${context.parsed.r.toFixed(1)}`;
                          }
                        },
                        bodyFont: {
                          family: 'var(--font-primary)'
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>

            {/* Maturity Level Analysis */}
            {reportData.maturityAnalysis && (
              <div style={{
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 2px 12px rgba(15, 44, 105, 0.08)',
                padding: '20px',
                marginBottom: '30px',
                borderLeft: '4px solid #10b981'
              }}>
                <h2 style={{
                  marginBottom: '20px',
                  fontFamily: 'var(--font-primary)',
                  color: '#10b981'
                }}>
                  Your Maturity Level Analysis
                </h2>

                {reportData.maturityAnalysis.description_en && (
                  <div style={{ marginBottom: '20px' }}>
                    <p style={{
                      lineHeight: '1.6',
                      color: '#374151',
                      fontFamily: 'var(--font-primary)',
                      marginBottom: '15px'
                    }}>
                      {reportData.maturityAnalysis.description_en}
                    </p>
                  </div>
                )}

                {reportData.maturityAnalysis.indicators_en && reportData.maturityAnalysis.indicators_en.length > 0 && (
                  <div>
                    <h3 style={{
                      fontSize: '1.1rem',
                      fontWeight: '600',
                      color: '#0f2c69',
                      marginBottom: '10px',
                      fontFamily: 'var(--font-primary)'
                    }}>
                      Key Indicators
                    </h3>
                    <ul style={{
                      listStyle: 'disc',
                      paddingLeft: '20px',
                      color: '#374151'
                    }}>
                      {reportData.maturityAnalysis.indicators_en.map((indicator: string, idx: number) => (
                        <li key={idx} style={{
                          lineHeight: '1.6',
                          marginBottom: '8px',
                          fontFamily: 'var(--font-primary)'
                        }}>
                          {indicator}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* General Recommendations - Matching User Results Style */}
            <div style={{
              marginBottom: '30px',
              background: 'rgba(127, 122, 254, 0.05)',
              borderRadius: '12px',
              boxShadow: '0 2px 12px rgba(15, 44, 105, 0.08)',
              padding: '20px',
              borderLeft: '4px solid #7f7afe'
            }}>
              <h2 style={{
                color: '#7f7afe',
                marginBottom: '20px',
                fontFamily: 'var(--font-primary)',
                textAlign: 'left'
              }}>
                General Recommendations
              </h2>

              {reportData.generalRecommendations && reportData.generalRecommendations.map((rec, index) => (
                <div key={index} style={{
                  marginBottom: '15px',
                  padding: '15px',
                  background: 'white',
                  borderRadius: '8px',
                  border: '1px solid #ededed',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px'
                }}>
                  <div style={{
                    minWidth: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: '#7f7afe',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: '600',
                    marginTop: '2px'
                  }}>
                    {index + 1}
                  </div>
                  <div style={{
                    flex: 1,
                    fontFamily: 'var(--font-primary)',
                    textAlign: 'left'
                  }}>
                    {rec.title && (
                      <div style={{
                        fontWeight: '600',
                        color: '#0f2c69',
                        marginBottom: '5px',
                        fontSize: '1rem'
                      }}>
                        {rec.title}
                      </div>
                    )}
                    <div style={{
                      color: '#374151',
                      fontSize: '0.95rem',
                      lineHeight: '1.6'
                    }}>
                      {rec.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Role-Specific Recommendations - Matching User Results Style */}
            <div style={{
              marginBottom: '30px',
              background: 'rgba(245, 173, 46, 0.05)',
              borderRadius: '12px',
              boxShadow: '0 2px 12px rgba(15, 44, 105, 0.08)',
              padding: '20px',
              borderLeft: '4px solid #f5ad2e'
            }}>
              <h2 style={{
                color: '#f5ad2e',
                marginBottom: '20px',
                fontFamily: 'var(--font-primary)',
                textAlign: 'left'
              }}>
                Role-Specific Recommendations
              </h2>

              {reportData.roleRecommendations && reportData.roleRecommendations.map((rec, index) => (
                <div key={index} style={{
                  marginBottom: '15px',
                  padding: '15px',
                  background: 'white',
                  borderRadius: '8px',
                  border: '1px solid #ededed',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px'
                }}>
                  <div style={{
                    minWidth: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: '#f5ad2e',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: '600',
                    marginTop: '2px'
                  }}>
                    {index + 1}
                  </div>
                  <div style={{
                    flex: 1,
                    fontFamily: 'var(--font-primary)',
                    textAlign: 'left'
                  }}>
                    {rec.title && (
                      <div style={{
                        fontWeight: '600',
                        color: '#0f2c69',
                        marginBottom: '5px',
                        fontSize: '1rem'
                      }}>
                        {rec.title}
                      </div>
                    )}
                    <div style={{
                      color: '#374151',
                      fontSize: '0.95rem',
                      lineHeight: '1.6'
                    }}>
                      {rec.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions Section - Matching User Results Style */}
            <div style={{
              textAlign: 'center',
              marginTop: '40px',
              padding: '30px',
              background: '#ededed',
              borderRadius: '12px'
            }}>
              <h3 style={{
                color: '#0f2c69',
                marginBottom: '20px',
                fontFamily: 'var(--font-primary)'
              }}>
                Export & Actions
              </h3>

              <div style={{
                display: 'flex',
                gap: '15px',
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}>
                <button
                  onClick={exportToPDF}
                  style={{
                    padding: '12px 24px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: 'white',
                    background: '#7f7afe',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontFamily: 'var(--font-primary)'
                  }}
                >
                  <span style={{ marginRight: '8px' }}>📄</span>
                  Download PDF Report
                </button>

                <button
                  onClick={() => {
                    setReportData(null)
                    setSelectedCodes([])
                  }}
                  style={{
                    padding: '12px 24px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151',
                    background: 'white',
                    border: '2px solid #e5e7eb',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontFamily: 'var(--font-primary)'
                  }}
                >
                  <span style={{ marginRight: '8px' }}>🔄</span>
                  Generate New Report
                </button>
              </div>
            </div>

          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '32px',
            height: '32px',
            border: '3px solid #e5e7eb',
            borderTop: '3px solid #7f7afe',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ color: '#6b7280' }}>Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      padding: '24px'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '32px',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: '#7f7afe',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <BarChart3 size={20} color="white" />
            </div>
            <div>
              <h1 style={{
                fontSize: '28px',
                fontWeight: 'bold',
                margin: '0 0 4px 0',
                color: '#111827'
              }}>
                Results & Analytics
              </h1>
              <p style={{
                color: '#6b7280',
                margin: '0',
                fontSize: '16px'
              }}>
                {activeView === 'analytics'
                  ? 'System-wide assessment analytics and insights'
                  : 'Generate detailed assessment reports'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <TabNavigation />

        {/* View Content */}
        {activeView === 'analytics' ? <OverallAnalyticsView /> : <AssessmentReportsView />}

        {/* CSS for spinner animation */}
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  )
}