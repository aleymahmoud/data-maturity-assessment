'use client'

import { useState, useEffect } from 'react'
import { Code, BarChart3, Users } from 'lucide-react'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    activeCodes: 0,
    completedAssessments: 0,
    activeSessions: 0,
    recentActivity: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/dashboard-stats')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch dashboard stats')
      }

      setStats(data.stats)
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (error) {
    return (
      <div style={{ 
        maxWidth: '1280px', 
        margin: '0 auto',
        padding: '24px',
        textAlign: 'center',
        color: '#dc2626'
      }}>
        <p>Error loading dashboard: {error}</p>
        <button 
          onClick={fetchDashboardStats}
          style={{
            padding: '8px 16px',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '24px',
        marginBottom: '32px'
      }}>
        {/* Active Codes Card */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb',
          padding: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ flexShrink: 0 }}>
              <Code size={20} color="#2563eb" />
            </div>
            <div style={{ marginLeft: '16px' }}>
              <p style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#6b7280',
                margin: 0
              }}>
                Active Codes
              </p>
              <p style={{
                fontSize: '24px',
                fontWeight: '600',
                color: '#111827',
                margin: 0
              }}>
                {loading ? '...' : stats.activeCodes}
              </p>
            </div>
          </div>
        </div>

        {/* Completed Assessments Card */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb',
          padding: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ flexShrink: 0 }}>
              <BarChart3 size={20} color="#059669" />
            </div>
            <div style={{ marginLeft: '16px' }}>
              <p style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#6b7280',
                margin: 0
              }}>
                Completed Assessments
              </p>
              <p style={{
                fontSize: '24px',
                fontWeight: '600',
                color: '#111827',
                margin: 0
              }}>
                {loading ? '...' : stats.completedAssessments}
              </p>
            </div>
          </div>
        </div>

        {/* Active Sessions Card */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb',
          padding: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ flexShrink: 0 }}>
              <Users size={20} color="#7c3aed" />
            </div>
            <div style={{ marginLeft: '16px' }}>
              <p style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#6b7280',
                margin: 0
              }}>
                Active Sessions
              </p>
              <p style={{
                fontSize: '24px',
                fontWeight: '600',
                color: '#111827',
                margin: 0
              }}>
                {loading ? '...' : stats.activeSessions}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7eb',
        padding: '24px'
      }}>
        <h2 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: '#111827',
          marginBottom: '16px'
        }}>
          Recent Activity
        </h2>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
            Loading recent activity...
          </div>
        ) : stats.recentActivity.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
            No recent activity found
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {stats.recentActivity.map((activity, index) => (
              <div key={index} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                backgroundColor: '#f9fafb',
                borderRadius: '6px'
              }}>
                <span style={{ fontSize: '14px', color: '#374151' }}>
                  {activity.description}
                </span>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>
                  {activity.timeAgo}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}