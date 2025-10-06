'use client'
import React, { useState, useEffect } from 'react'
import { Users, Clock, CheckCircle, XCircle, AlertTriangle, Search, Filter, RefreshCw, Eye, Trash2, Mail, Play, Pause, Calendar, BarChart3, Copy } from 'lucide-react'

export default function UserSessionsPage() {
  // State management
  const [loading, setLoading] = useState(true)
  const [sessionsData, setSessionsData] = useState([])
  const [overviewStats, setOverviewStats] = useState({
    activeSessions: 0,
    completedSessions: 0,
    abandonedSessions: 0,
    averageDuration: 0
  })
  const [selectedSessions, setSelectedSessions] = useState([])

  // Modal states
  const [selectedSessionDetails, setSelectedSessionDetails] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Filter states
  const [statusFilter, setStatusFilter] = useState('all')
  const [organizationFilter, setOrganizationFilter] = useState('all')
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  })
  const [searchTerm, setSearchTerm] = useState('')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)

  // Available filter options
  const [availableOrganizations, setAvailableOrganizations] = useState([])

  // Helper function to get current date
  const getCurrentDate = () => {
    return new Date().toISOString().split('T')[0]
  }

  // Helper function to get date 30 days ago
  const getDateDaysAgo = (days) => {
    const date = new Date()
    date.setDate(date.getDate() - days)
    return date.toISOString().split('T')[0]
  }

  // Initialize date range
  useEffect(() => {
    setDateRange({
      start: '2025-01-01',
      end: getCurrentDate()
    })
  }, [])

  // Fetch session data
  const fetchSessionsData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        status: statusFilter,
        organization: organizationFilter,
        start: dateRange.start,
        end: dateRange.end,
        search: searchTerm,
        page: currentPage.toString(),
        limit: itemsPerPage.toString()
      })

      const response = await fetch(`/api/admin/sessions?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setSessionsData(data.sessions)
        setOverviewStats(data.stats)
        setAvailableOrganizations(data.organizations)
      }
    } catch (error) {
      console.error('Error fetching sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  // Load data on component mount and filter changes
  useEffect(() => {
    fetchSessionsData()
  }, [statusFilter, organizationFilter, dateRange, searchTerm, currentPage])

  // Format duration helper
  const formatDuration = (start, end) => {
    if (!end) return 'In progress'
    const startTime = new Date(start)
    const endTime = new Date(end)
    const durationMs = endTime - startTime
    const durationMinutes = Math.round(durationMs / 60000)

    if (durationMinutes < 60) {
      return `${durationMinutes}m`
    } else {
      const hours = Math.floor(durationMinutes / 60)
      const minutes = durationMinutes % 60
      return `${hours}h ${minutes}m`
    }
  }

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#10b981'
      case 'active': return '#3b82f6'
      case 'abandoned': return '#f59e0b'
      case 'expired': return '#ef4444'
      default: return '#6b7280'
    }
  }

  // Handle session selection
  const handleSessionSelect = (sessionId) => {
    setSelectedSessions(prev =>
      prev.includes(sessionId)
        ? prev.filter(id => id !== sessionId)
        : [...prev, sessionId]
    )
  }

  // Handle select all
  const handleSelectAll = () => {
    if (selectedSessions.length === sessionsData.length) {
      setSelectedSessions([])
    } else {
      setSelectedSessions(sessionsData.map(session => session.id))
    }
  }

  // Session actions
  const handleTerminateSession = async (sessionId) => {
    if (confirm('Are you sure you want to terminate this session?')) {
      try {
        const response = await fetch(`/api/admin/sessions/${sessionId}/terminate`, {
          method: 'POST'
        })
        if (response.ok) {
          fetchSessionsData()
        }
      } catch (error) {
        console.error('Error terminating session:', error)
      }
    }
  }

  const handleSendReminder = async (sessionId) => {
    try {
      const response = await fetch(`/api/admin/sessions/${sessionId}/remind`, {
        method: 'POST'
      })
      if (response.ok) {
        alert('Reminder sent successfully!')
      }
    } catch (error) {
      console.error('Error sending reminder:', error)
    }
  }

  // Bulk actions
  const handleBulkAction = async (action) => {
    if (selectedSessions.length === 0) {
      alert('Please select sessions first.')
      return
    }

    const confirmMessage = `Are you sure you want to ${action} ${selectedSessions.length} session(s)?`
    if (!confirm(confirmMessage)) return

    try {
      const response = await fetch(`/api/admin/sessions/bulk/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionIds: selectedSessions })
      })

      if (response.ok) {
        fetchSessionsData()
        setSelectedSessions([])
        alert(`${action} completed successfully!`)
      }
    } catch (error) {
      console.error(`Error performing bulk ${action}:`, error)
    }
  }

  // Handle view session details
  const handleViewDetails = async (sessionId) => {
    try {
      // Find session in current data first
      const sessionData = sessionsData.find(session => session.id === sessionId)
      if (sessionData) {
        // Fetch additional details if needed
        const response = await fetch(`/api/admin/sessions/${sessionId}/details`)
        if (response.ok) {
          const detailsData = await response.json()
          setSelectedSessionDetails({ ...sessionData, ...detailsData })
        } else {
          // Use current session data if details API fails
          setSelectedSessionDetails(sessionData)
        }
        setIsModalOpen(true)
      }
    } catch (error) {
      console.error('Error fetching session details:', error)
      // Fallback to current session data
      const sessionData = sessionsData.find(session => session.id === sessionId)
      if (sessionData) {
        setSelectedSessionDetails(sessionData)
        setIsModalOpen(true)
      }
    }
  }

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedSessionDetails(null)
  }

  // Copy session ID to clipboard
  const copySessionId = async (sessionId) => {
    try {
      await navigator.clipboard.writeText(sessionId)
      alert('Session ID copied to clipboard!')
    } catch (error) {
      console.error('Failed to copy session ID:', error)
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea')
      textArea.value = sessionId
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      alert('Session ID copied to clipboard!')
    }
  }

  // StatCard component
  const StatCard = ({ title, value, subtitle, icon: Icon, color, trend }) => (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 2px 12px rgba(15, 44, 105, 0.08)',
      border: '1px solid #e5e7eb'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '12px'
      }}>
        <div style={{ flex: 1 }}>
          <p style={{
            fontSize: '14px',
            color: '#6b7280',
            margin: 0,
            fontWeight: '500'
          }}>{title}</p>
          <h3 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#111827',
            margin: '4px 0',
            lineHeight: '1.2'
          }}>{value}</h3>
          <p style={{
            fontSize: '12px',
            color: '#9ca3af',
            margin: 0
          }}>{subtitle}</p>
        </div>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          backgroundColor: `${color}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Icon size={24} color={color} />
        </div>
      </div>
      {trend && (
        <div style={{ fontSize: '12px', color: trend > 0 ? '#10b981' : '#ef4444' }}>
          {trend > 0 ? '↗' : '↘'} {Math.abs(trend)}% from last month
        </div>
      )}
    </div>
  )

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      padding: '32px'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '32px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: '#7f7afe15',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Users size={24} color="#7f7afe" />
          </div>
          <div>
            <h1 style={{
              fontSize: '28px',
              fontWeight: 'bold',
              color: '#111827',
              margin: 0,
              lineHeight: '1.2'
            }}>User Sessions</h1>
            <p style={{
              fontSize: '16px',
              color: '#6b7280',
              margin: '4px 0 0 0'
            }}>Monitor and manage assessment sessions</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={fetchSessionsData}
            disabled={loading}
            style={{
              padding: '10px 16px',
              backgroundColor: 'white',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              opacity: loading ? 0.6 : 1
            }}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        <StatCard
          title="Active Sessions"
          value={overviewStats.activeSessions}
          subtitle="Currently in progress"
          icon={Play}
          color="#3b82f6"
        />
        <StatCard
          title="Completed Sessions"
          value={overviewStats.completedSessions}
          subtitle="Successfully finished"
          icon={CheckCircle}
          color="#10b981"
        />
        <StatCard
          title="Abandoned Sessions"
          value={overviewStats.abandonedSessions}
          subtitle="Started but not finished"
          icon={XCircle}
          color="#f59e0b"
        />
        <StatCard
          title="Avg Duration"
          value={`${overviewStats.averageDuration}m`}
          subtitle="Average completion time"
          icon={Clock}
          color="#8b5cf6"
        />
      </div>

      {/* Session Analytics Charts */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        {/* Session Status Distribution */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 2px 12px rgba(15, 44, 105, 0.08)',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#111827',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <BarChart3 size={20} color="#7f7afe" />
            Session Status Distribution
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Active Sessions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                <div style={{
                  width: '12px',
                  height: '12px',
                  backgroundColor: '#10b981',
                  borderRadius: '50%'
                }}></div>
                <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Active</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '16px', fontWeight: '600', color: '#111827', minWidth: '40px', textAlign: 'right' }}>
                  {overviewStats.activeSessions}
                </span>
                <div style={{ width: '100px', height: '8px', backgroundColor: '#f3f4f6', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${(overviewStats.activeSessions / Math.max(overviewStats.activeSessions + overviewStats.completedSessions + overviewStats.abandonedSessions, 1) * 100)}%`,
                      height: '100%',
                      backgroundColor: '#10b981',
                      borderRadius: '4px',
                      transition: 'width 0.5s ease'
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Completed Sessions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                <div style={{
                  width: '12px',
                  height: '12px',
                  backgroundColor: '#3b82f6',
                  borderRadius: '50%'
                }}></div>
                <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Completed</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '16px', fontWeight: '600', color: '#111827', minWidth: '40px', textAlign: 'right' }}>
                  {overviewStats.completedSessions}
                </span>
                <div style={{ width: '100px', height: '8px', backgroundColor: '#f3f4f6', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${(overviewStats.completedSessions / Math.max(overviewStats.activeSessions + overviewStats.completedSessions + overviewStats.abandonedSessions, 1) * 100)}%`,
                      height: '100%',
                      backgroundColor: '#3b82f6',
                      borderRadius: '4px',
                      transition: 'width 0.5s ease'
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Abandoned Sessions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                <div style={{
                  width: '12px',
                  height: '12px',
                  backgroundColor: '#f59e0b',
                  borderRadius: '50%'
                }}></div>
                <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Abandoned/Expired</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '16px', fontWeight: '600', color: '#111827', minWidth: '40px', textAlign: 'right' }}>
                  {overviewStats.abandonedSessions}
                </span>
                <div style={{ width: '100px', height: '8px', backgroundColor: '#f3f4f6', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${(overviewStats.abandonedSessions / Math.max(overviewStats.activeSessions + overviewStats.completedSessions + overviewStats.abandonedSessions, 1) * 100)}%`,
                      height: '100%',
                      backgroundColor: '#f59e0b',
                      borderRadius: '4px',
                      transition: 'width 0.5s ease'
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Session Performance Metrics */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 2px 12px rgba(15, 44, 105, 0.08)',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#111827',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Clock size={20} color="#7f7afe" />
            Performance Metrics
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Completion Rate */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Completion Rate</span>
                <span style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                  {Math.round((overviewStats.completedSessions / Math.max(overviewStats.activeSessions + overviewStats.completedSessions + overviewStats.abandonedSessions, 1)) * 100)}%
                </span>
              </div>
              <div style={{ width: '100%', height: '12px', backgroundColor: '#f3f4f6', borderRadius: '6px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${Math.round((overviewStats.completedSessions / Math.max(overviewStats.activeSessions + overviewStats.completedSessions + overviewStats.abandonedSessions, 1)) * 100)}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #3b82f6 0%, #10b981 100%)',
                    borderRadius: '6px',
                    transition: 'width 0.5s ease'
                  }}
                ></div>
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                {overviewStats.completedSessions} out of {overviewStats.activeSessions + overviewStats.completedSessions + overviewStats.abandonedSessions} sessions completed
              </div>
            </div>

            {/* Average Duration */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Average Duration</span>
                <span style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                  {overviewStats.averageDuration} min
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={16} color="#6b7280" />
                <span style={{ fontSize: '12px', color: '#6b7280' }}>
                  For completed sessions only
                </span>
              </div>
            </div>

            {/* Total Sessions Summary */}
            <div style={{
              paddingTop: '16px',
              borderTop: '1px solid #f3f4f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Total Sessions</span>
              <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827' }}>
                {overviewStats.activeSessions + overviewStats.completedSessions + overviewStats.abandonedSessions}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 2px 12px rgba(15, 44, 105, 0.08)',
        marginBottom: '24px'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          alignItems: 'end'
        }}>
          {/* Search */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '6px'
            }}>Search</label>
            <div style={{ position: 'relative' }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#6b7280'
                }}
              />
              <input
                type="text"
                placeholder="Search by user name, email, or session ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 40px',
                  fontSize: '14px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '6px',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '6px'
            }}>Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '14px',
                border: '2px solid #e5e7eb',
                borderRadius: '6px',
                backgroundColor: 'white'
              }}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="abandoned">Abandoned</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          {/* Organization Filter */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '6px'
            }}>Organization</label>
            <select
              value={organizationFilter}
              onChange={(e) => setOrganizationFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '14px',
                border: '2px solid #e5e7eb',
                borderRadius: '6px',
                backgroundColor: 'white'
              }}
            >
              <option value="all">All Organizations</option>
              {availableOrganizations.map(org => (
                <option key={org} value={org}>{org}</option>
              ))}
            </select>
          </div>

          {/* Date From */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '6px'
            }}>Date From</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '14px',
                border: '2px solid #e5e7eb',
                borderRadius: '6px'
              }}
            />
          </div>

          {/* Date To */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '6px'
            }}>Date To</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
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
      </div>

      {/* Bulk Actions */}
      {selectedSessions.length > 0 && (
        <div style={{
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span style={{ fontSize: '14px', color: '#1e40af', fontWeight: '500' }}>
            {selectedSessions.length} session(s) selected
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => handleBulkAction('terminate')}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Terminate
            </button>
            <button
              onClick={() => handleBulkAction('remind')}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Send Reminders
            </button>
          </div>
        </div>
      )}

      {/* Sessions Table */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 12px rgba(15, 44, 105, 0.08)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#111827',
            margin: 0
          }}>
            User Sessions ({sessionsData.length})
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={selectedSessions.length === sessionsData.length && sessionsData.length > 0}
              onChange={handleSelectAll}
              style={{ cursor: 'pointer' }}
            />
            <label style={{ fontSize: '14px', color: '#6b7280', cursor: 'pointer' }}>
              Select All
            </label>
          </div>
        </div>

        {loading ? (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            color: '#6b7280'
          }}>
            <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ marginTop: '16px' }}>Loading sessions...</p>
          </div>
        ) : sessionsData.length === 0 ? (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            color: '#6b7280'
          }}>
            <Users size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
            <p>No sessions found matching your criteria.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc' }}>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#374151',
                    borderBottom: '1px solid #e5e7eb',
                    width: '40px'
                  }}>
                    <input
                      type="checkbox"
                      checked={selectedSessions.length === sessionsData.length}
                      onChange={handleSelectAll}
                      style={{ cursor: 'pointer' }}
                    />
                  </th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#374151',
                    borderBottom: '1px solid #e5e7eb'
                  }}>Session ID</th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#374151',
                    borderBottom: '1px solid #e5e7eb'
                  }}>User</th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#374151',
                    borderBottom: '1px solid #e5e7eb'
                  }}>Organization</th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#374151',
                    borderBottom: '1px solid #e5e7eb'
                  }}>Status</th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#374151',
                    borderBottom: '1px solid #e5e7eb'
                  }}>Progress</th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#374151',
                    borderBottom: '1px solid #e5e7eb'
                  }}>Duration</th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'center',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#374151',
                    borderBottom: '1px solid #e5e7eb',
                    width: '120px'
                  }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessionsData.map((session, index) => (
                  <tr
                    key={session.id}
                    style={{
                      borderBottom: index < sessionsData.length - 1 ? '1px solid #f3f4f6' : 'none',
                      backgroundColor: selectedSessions.includes(session.id) ? '#eff6ff' : 'white'
                    }}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <input
                        type="checkbox"
                        checked={selectedSessions.includes(session.id)}
                        onChange={() => handleSessionSelect(session.id)}
                        style={{ cursor: 'pointer' }}
                      />
                    </td>
                    <td style={{
                      padding: '12px 16px',
                      fontSize: '13px',
                      color: '#111827',
                      fontFamily: 'monospace'
                    }}>
                      {session.id.split('_').slice(-1)[0] || session.id.substring(0, 8)}...
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: '500',
                          color: '#111827'
                        }}>{session.userName || 'Unknown User'}</div>
                        <div style={{
                          fontSize: '12px',
                          color: '#6b7280'
                        }}>{session.userEmail}</div>
                      </div>
                    </td>
                    <td style={{
                      padding: '12px 16px',
                      fontSize: '13px',
                      color: '#374151'
                    }}>
                      {session.organization || 'N/A'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '500',
                        backgroundColor: `${getStatusColor(session.status)}15`,
                        color: getStatusColor(session.status)
                      }}>
                        {session.status?.charAt(0).toUpperCase() + session.status?.slice(1) || 'Unknown'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '60px',
                          height: '6px',
                          backgroundColor: '#e5e7eb',
                          borderRadius: '3px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${session.completionPercentage || 0}%`,
                            height: '100%',
                            backgroundColor: session.completionPercentage >= 100 ? '#10b981' : '#3b82f6',
                            borderRadius: '3px'
                          }} />
                        </div>
                        <span style={{
                          fontSize: '12px',
                          color: '#6b7280',
                          minWidth: '35px'
                        }}>
                          {Math.round(session.completionPercentage || 0)}%
                        </span>
                      </div>
                    </td>
                    <td style={{
                      padding: '12px 16px',
                      fontSize: '13px',
                      color: '#374151'
                    }}>
                      {formatDuration(session.sessionStart, session.sessionEnd)}
                    </td>
                    <td style={{
                      padding: '12px 16px',
                      textAlign: 'center'
                    }}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                        <button
                          onClick={() => handleViewDetails(session.id)}
                          style={{
                            padding: '4px',
                            backgroundColor: 'transparent',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            color: '#6b7280'
                          }}
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>

                        {session.status === 'active' && (
                          <button
                            onClick={() => handleTerminateSession(session.id)}
                            style={{
                              padding: '4px',
                              backgroundColor: 'transparent',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              color: '#ef4444'
                            }}
                            title="Terminate Session"
                          >
                            <XCircle size={14} />
                          </button>
                        )}

                        {(session.status === 'active' || session.status === 'abandoned') && (
                          <button
                            onClick={() => handleSendReminder(session.id)}
                            style={{
                              padding: '4px',
                              backgroundColor: 'transparent',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              color: '#3b82f6'
                            }}
                            title="Send Reminder"
                          >
                            <Mail size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Session Details Modal */}
      {isModalOpen && selectedSessionDetails && (
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
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            position: 'relative'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '24px 32px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              position: 'sticky',
              top: 0,
              backgroundColor: 'white',
              borderRadius: '16px 16px 0 0'
            }}>
              <div>
                <h2 style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: '#111827',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <Users size={24} color="#7f7afe" />
                  Session Details
                </h2>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  margin: '4px 0 0 36px'
                }}>
                  <p style={{
                    fontSize: '14px',
                    color: '#6b7280',
                    margin: 0,
                    fontFamily: 'monospace'
                  }}>
                    ID: {selectedSessionDetails.id}
                  </p>
                  <button
                    onClick={() => copySessionId(selectedSessionDetails.id)}
                    style={{
                      padding: '4px',
                      backgroundColor: 'transparent',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      color: '#6b7280',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease'
                    }}
                    title="Copy Session ID"
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#f3f4f6'
                      e.target.style.color = '#374151'
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'transparent'
                      e.target.style.color = '#6b7280'
                    }}
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>
              <button
                onClick={closeModal}
                style={{
                  padding: '8px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  color: '#6b7280',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <XCircle size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: '32px' }}>
              {/* User Information */}
              <div style={{
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '24px'
              }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#111827',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Users size={18} color="#7f7afe" />
                  User Information
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '16px'
                }}>
                  <div>
                    <label style={{
                      fontSize: '12px',
                      fontWeight: '500',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Name</label>
                    <p style={{
                      fontSize: '16px',
                      fontWeight: '500',
                      color: '#111827',
                      margin: '4px 0 0 0'
                    }}>{selectedSessionDetails.userName || 'Unknown User'}</p>
                  </div>
                  <div>
                    <label style={{
                      fontSize: '12px',
                      fontWeight: '500',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Email</label>
                    <p style={{
                      fontSize: '16px',
                      color: '#111827',
                      margin: '4px 0 0 0'
                    }}>{selectedSessionDetails.userEmail}</p>
                  </div>
                  <div>
                    <label style={{
                      fontSize: '12px',
                      fontWeight: '500',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Organization</label>
                    <p style={{
                      fontSize: '16px',
                      color: '#111827',
                      margin: '4px 0 0 0'
                    }}>{selectedSessionDetails.organization || 'N/A'}</p>
                  </div>
                  <div>
                    <label style={{
                      fontSize: '12px',
                      fontWeight: '500',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Role Title</label>
                    <p style={{
                      fontSize: '16px',
                      color: '#111827',
                      margin: '4px 0 0 0'
                    }}>{selectedSessionDetails.roleTitle || 'N/A'}</p>
                  </div>
                  <div>
                    <label style={{
                      fontSize: '12px',
                      fontWeight: '500',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Assessment Code</label>
                    <p style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#7f7afe',
                      margin: '4px 0 0 0',
                      fontFamily: 'monospace'
                    }}>{selectedSessionDetails.assessmentCode || 'N/A'}</p>
                  </div>
                  <div>
                    <label style={{
                      fontSize: '12px',
                      fontWeight: '500',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Assessment Type</label>
                    <p style={{
                      fontSize: '16px',
                      color: '#111827',
                      margin: '4px 0 0 0'
                    }}>{selectedSessionDetails.assessmentType || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Session Status and Progress */}
              <div style={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '24px'
              }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#111827',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <BarChart3 size={18} color="#7f7afe" />
                  Session Status & Progress
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '16px'
                }}>
                  <div>
                    <label style={{
                      fontSize: '12px',
                      fontWeight: '500',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Status</label>
                    <div style={{ marginTop: '4px' }}>
                      <span style={{
                        padding: '6px 12px',
                        borderRadius: '16px',
                        fontSize: '14px',
                        fontWeight: '500',
                        backgroundColor: `${getStatusColor(selectedSessionDetails.status)}15`,
                        color: getStatusColor(selectedSessionDetails.status)
                      }}>
                        {selectedSessionDetails.status?.charAt(0).toUpperCase() + selectedSessionDetails.status?.slice(1) || 'Unknown'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label style={{
                      fontSize: '12px',
                      fontWeight: '500',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Completion Progress</label>
                    <div style={{ marginTop: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          flex: 1,
                          height: '12px',
                          backgroundColor: '#e5e7eb',
                          borderRadius: '6px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${selectedSessionDetails.completionPercentage || 0}%`,
                            height: '100%',
                            backgroundColor: selectedSessionDetails.completionPercentage >= 100 ? '#10b981' : '#3b82f6',
                            borderRadius: '6px',
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                        <span style={{
                          fontSize: '16px',
                          fontWeight: '600',
                          color: '#111827',
                          minWidth: '45px'
                        }}>
                          {Math.round(selectedSessionDetails.completionPercentage || 0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label style={{
                      fontSize: '12px',
                      fontWeight: '500',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Language Preference</label>
                    <p style={{
                      fontSize: '16px',
                      color: '#111827',
                      margin: '4px 0 0 0'
                    }}>{selectedSessionDetails.languagePreference || 'N/A'}</p>
                  </div>
                  <div>
                    <label style={{
                      fontSize: '12px',
                      fontWeight: '500',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Maturity Level</label>
                    <p style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#10b981',
                      margin: '4px 0 0 0'
                    }}>{selectedSessionDetails.maturityLevel || 'Not Calculated'}</p>
                  </div>
                  <div>
                    <label style={{
                      fontSize: '12px',
                      fontWeight: '500',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Overall Score</label>
                    <p style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#7f7afe',
                      margin: '4px 0 0 0'
                    }}>{selectedSessionDetails.overallScore ? `${selectedSessionDetails.overallScore}/5` : 'Not Available'}</p>
                  </div>
                </div>
              </div>

              {/* Session Timeline */}
              <div style={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '24px'
              }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#111827',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Clock size={18} color="#7f7afe" />
                  Session Timeline
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '16px'
                }}>
                  <div>
                    <label style={{
                      fontSize: '12px',
                      fontWeight: '500',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Session Start</label>
                    <p style={{
                      fontSize: '16px',
                      color: '#111827',
                      margin: '4px 0 0 0'
                    }}>
                      {selectedSessionDetails.sessionStart ?
                        new Date(selectedSessionDetails.sessionStart).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label style={{
                      fontSize: '12px',
                      fontWeight: '500',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Session End</label>
                    <p style={{
                      fontSize: '16px',
                      color: '#111827',
                      margin: '4px 0 0 0'
                    }}>
                      {selectedSessionDetails.sessionEnd ?
                        new Date(selectedSessionDetails.sessionEnd).toLocaleString() : 'In Progress'}
                    </p>
                  </div>
                  <div>
                    <label style={{
                      fontSize: '12px',
                      fontWeight: '500',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Duration</label>
                    <p style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#8b5cf6',
                      margin: '4px 0 0 0'
                    }}>
                      {formatDuration(selectedSessionDetails.sessionStart, selectedSessionDetails.sessionEnd)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end',
                paddingTop: '24px',
                borderTop: '1px solid #e5e7eb'
              }}>
                {selectedSessionDetails.status === 'active' && (
                  <>
                    <button
                      onClick={() => {
                        handleSendReminder(selectedSessionDetails.id)
                        closeModal()
                      }}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <Mail size={16} />
                      Send Reminder
                    </button>
                    <button
                      onClick={() => {
                        handleTerminateSession(selectedSessionDetails.id)
                        closeModal()
                      }}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <XCircle size={16} />
                      Terminate Session
                    </button>
                  </>
                )}
                <button
                  onClick={closeModal}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSS for spin animation */}
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}