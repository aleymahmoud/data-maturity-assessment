'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Plus, Filter, Code, TrendingUp, AlertCircle, CheckCircle, X, Check, Info, Trash2, Eye, EyeOff, Edit, Download, FileText, FileSpreadsheet, AlertTriangle } from 'lucide-react'

// FilterSelect component - define before main component
const FilterSelect = ({ label, value, onChange, options, loading = false }) => (
  <div style={{ minWidth: '160px' }}>
    <label style={{
      display: 'block',
      fontSize: '12px',
      fontWeight: '600',
      color: '#374151',
      marginBottom: '6px',
      textTransform: 'uppercase',
      letterSpacing: '0.05em'
    }}>
      {label}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={loading}
      style={{
        width: '100%',
        padding: '8px 12px',
        fontSize: '14px',
        border: '2px solid #e5e7eb',
        borderRadius: '6px',
        backgroundColor: 'white',
        color: '#374151',
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.6 : 1,
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
      }}
      onFocus={(e) => {
        e.target.style.borderColor = '#7f7afe'
        e.target.style.boxShadow = '0 0 0 3px rgba(127, 122, 254, 0.1)'
      }}
      onBlur={(e) => {
        e.target.style.borderColor = '#e5e7eb'
        e.target.style.boxShadow = 'none'
      }}
    >
      {options.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
)

export default function AssessmentCodesPage() {
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    expired: 0,
    used_up: 0,
    expiring_soon: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Filter states
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    organization: 'all'
  })
  const [organizations, setOrganizations] = useState([])
  const [filtersLoading, setFiltersLoading] = useState(false)
  
  // Table states
  const [codes, setCodes] = useState([])
  const [tableLoading, setTableLoading] = useState(false)
  const [search, setSearch] = useState('')

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCodes, setTotalCodes] = useState(0)
  const itemsPerPage = 10

  useEffect(() => {
    fetchStats()
    fetchOrganizations()
    fetchCodes()
  }, [])

  useEffect(() => {
    // Re-fetch stats when filters change
    fetchStats()
    setCurrentPage(1) // Reset to page 1 when filters change
  }, [filters])

  useEffect(() => {
    // Fetch codes when page or filters change
    fetchCodes()
  }, [currentPage, filters])

  useEffect(() => {
    // Re-fetch codes when search changes (with debounce)
    const timer = setTimeout(() => {
      setCurrentPage(1) // Reset to page 1 when search changes
      fetchCodes()
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const fetchStats = async () => {
    try {
      setLoading(true)
      
      // Build query params for filtering
      const params = new URLSearchParams()
      if (filters.status !== 'all') params.append('status', filters.status)
      if (filters.type !== 'all') params.append('type', filters.type)
      if (filters.organization !== 'all') params.append('organization', filters.organization)
      
      const response = await fetch(`/api/admin/assessment-codes/stats?${params.toString()}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch stats')
      }

      setStats(data.stats || {
        total: 0,
        active: 0,
        inactive: 0,
        expired: 0,
        used_up: 0,
        expiring_soon: 0
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
      setError('Failed to load statistics')
    } finally {
      setLoading(false)
    }
  }

  const fetchOrganizations = async () => {
    try {
      setFiltersLoading(true)
      const response = await fetch('/api/admin/assessment-codes/organizations')
      const data = await response.json()

      if (response.ok) {
        setOrganizations(data.organizations || [])
      }
    } catch (error) {
      console.error('Error fetching organizations:', error)
    } finally {
      setFiltersLoading(false)
    }
  }

  const fetchCodes = async () => {
    try {
      setTableLoading(true)

      // Build query params
      const params = new URLSearchParams()
      params.append('page', currentPage.toString())
      params.append('limit', itemsPerPage.toString())
      if (filters.status !== 'all') params.append('status', filters.status)
      if (filters.type !== 'all') params.append('type', filters.type)
      if (filters.organization !== 'all') params.append('organization', filters.organization)
      if (search.trim()) params.append('search', search.trim())

      const response = await fetch(`/api/admin/assessment-codes?${params.toString()}`)
      const data = await response.json()

      if (response.ok) {
        setCodes(data.codes || [])
        setTotalPages(data.pagination?.pages || 1)
        setTotalCodes(data.pagination?.total || 0)
      } else {
        console.error('Failed to fetch codes:', data.error)
      }
    } catch (error) {
      console.error('Error fetching codes:', error)
    } finally {
      setTableLoading(false)
    }
  }

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }))
  }

  const clearFilters = () => {
    setFilters({
      status: 'all',
      type: 'all',
      organization: 'all'
    })
    setCurrentPage(1)
  }

  // Export functions
  const exportToCSV = () => {
    try {
      if (!codes || codes.length === 0) {
        addNotification('No data to export', 'error')
        return
      }

      // CSV headers
      const headers = [
        'Code',
        'Organization',
        'Assessment Type',
        'Status',
        'Usage Count',
        'Max Uses',
        'Created Date',
        'Expires Date',
        'Description'
      ]

      // Convert data to CSV format
      const csvData = codes.map(code => [
        code.code,
        code.organization_name || '',
        code.assessment_type || 'full',
        code.status,
        code.usage_count || 0,
        code.max_uses || '',
        code.created_at ? new Date(code.created_at).toLocaleDateString() : '',
        code.expires_at ? new Date(code.expires_at).toLocaleDateString() : '',
        code.description || ''
      ])

      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...csvData.map(row =>
          row.map(field =>
            // Escape fields containing commas, quotes, or newlines
            typeof field === 'string' && (field.includes(',') || field.includes('"') || field.includes('\n'))
              ? `"${field.replace(/"/g, '""')}"`
              : field
          ).join(',')
        )
      ].join('\n')

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `assessment-codes-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      addNotification(`Successfully exported ${codes.length} codes to CSV`, 'success')
    } catch (error) {
      console.error('CSV export error:', error)
      addNotification('Failed to export CSV file', 'error')
    }
  }

  const exportToExcel = () => {
    try {
      if (!codes || codes.length === 0) {
        addNotification('No data to export', 'error')
        return
      }

      // Create HTML table for Excel
      const headers = [
        'Code',
        'Organization',
        'Assessment Type',
        'Status',
        'Usage Count',
        'Max Uses',
        'Created Date',
        'Expires Date',
        'Description'
      ]

      const tableRows = codes.map(code => `
        <tr>
          <td>${code.code}</td>
          <td>${code.organization_name || ''}</td>
          <td>${code.assessment_type || 'full'}</td>
          <td>${code.status}</td>
          <td>${code.usage_count || 0}</td>
          <td>${code.max_uses || ''}</td>
          <td>${code.created_at ? new Date(code.created_at).toLocaleDateString() : ''}</td>
          <td>${code.expires_at ? new Date(code.expires_at).toLocaleDateString() : ''}</td>
          <td>${code.description || ''}</td>
        </tr>
      `).join('')

      const htmlContent = `
        <table border="1">
          <thead>
            <tr>
              ${headers.map(header => `<th>${header}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      `

      // Create and download file
      const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `assessment-codes-${new Date().toISOString().split('T')[0]}.xls`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      addNotification(`Successfully exported ${codes.length} codes to Excel`, 'success')
    } catch (error) {
      console.error('Excel export error:', error)
      addNotification('Failed to export Excel file', 'error')
    }
  }

  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingCode, setEditingCode] = useState(null)
  const [modalLoading, setModalLoading] = useState(false)
  const [notifications, setNotifications] = useState([])

  // Confirmation modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)

  // Add notification function
  const addNotification = (message, type = 'info') => {
    const id = Date.now()
    const notification = { id, message, type }
    setNotifications(prev => [...prev, notification])

    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }, 5000)
  }

  // Remove notification function
  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  // Confirmation modal functions
  const showConfirmation = (title, message, onConfirm, confirmText = 'Confirm', type = 'danger') => {
    setConfirmAction({
      title,
      message,
      onConfirm,
      confirmText,
      type
    })
    setShowConfirmModal(true)
  }

  const handleConfirm = () => {
    if (confirmAction?.onConfirm) {
      confirmAction.onConfirm()
    }
    setShowConfirmModal(false)
    setConfirmAction(null)
  }

  const handleCancelConfirm = () => {
    setShowConfirmModal(false)
    setConfirmAction(null)
  }

  const handleAddCode = () => {
    setShowAddModal(true)
  }

  const handleSubmitCode = async (formData, bulkMode) => {
    // Validate form data
    if (!formData.organization.trim()) {
      addNotification('Organization name is required', 'error')
      return
    }

    setModalLoading(true)

    try {
      const payload = {
        maxUses: formData.maxUses,
        expiresIn: formData.expirationDays,
        description: formData.description.trim() || null,
        organizationName: formData.organization.trim(),
        assessmentType: formData.assessmentType,
        generateBulk: bulkMode,
        bulkCount: bulkMode ? formData.bulkCount : 1
      }

      const response = await fetch('/api/admin/assessment-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (response.ok) {
        addNotification(
          `Successfully generated ${bulkMode ? formData.bulkCount : 1} assessment code${bulkMode && formData.bulkCount > 1 ? 's' : ''}!`,
          'success'
        )
        setShowAddModal(false)
        fetchCodes()
        fetchStats()
        fetchOrganizations() // ✅ Refresh organizations filter
      } else {
        addNotification(`Failed to generate code: ${data.error}`, 'error')
      }
    } catch (error) {
      console.error('Error generating code:', error)
      addNotification('Failed to generate code. Please try again.', 'error')
    } finally {
      setModalLoading(false)
    }
  }

  const handleDeleteCode = (code, forceDelete = false) => {
    const confirmMessage = forceDelete
      ? `Are you sure you want to FORCE DELETE code "${code}" and ALL associated data (sessions, responses, results)? This action cannot be undone.`
      : `Are you sure you want to delete code "${code}"? This action cannot be undone.`

    const confirmTitle = forceDelete ? 'Force Delete Assessment Code' : 'Delete Assessment Code'

    showConfirmation(
      confirmTitle,
      confirmMessage,
      async () => {
        try {
          const url = forceDelete
            ? `/api/admin/assessment-codes?code=${encodeURIComponent(code)}&force=true`
            : `/api/admin/assessment-codes?code=${encodeURIComponent(code)}`

          const response = await fetch(url, {
            method: 'DELETE'
          })

          const data = await response.json()

          if (response.ok) {
            const message = data.cascadeDeleted
              ? 'Code and all associated data deleted successfully'
              : 'Code deleted successfully'
            addNotification(message, 'success')
            fetchCodes()
            fetchStats()
            fetchOrganizations() // ✅ Refresh organizations filter
          } else {
            // Check if this is a "has related data" error
            if (data.details && (data.details.sessions > 0 || data.details.responses > 0 || data.details.results > 0)) {
              // Show detailed error with option to force delete
              const detailsMsg = [
                data.details.sessions > 0 ? `${data.details.sessions} session(s)` : null,
                data.details.responses > 0 ? `${data.details.responses} response(s)` : null,
                data.details.results > 0 ? `${data.details.results} result(s)` : null
              ].filter(Boolean).join(', ')

              addNotification(
                `Cannot delete code: has associated data (${detailsMsg}). Click to force delete.`,
                'error'
              )

              // Show a follow-up confirmation for force delete
              setTimeout(() => {
                showConfirmation(
                  'Force Delete Required',
                  `Code "${code}" has associated data:\n\n${detailsMsg}\n\nDo you want to FORCE DELETE this code and ALL associated data? This cannot be undone.`,
                  () => handleDeleteCode(code, true),
                  'Force Delete',
                  'danger'
                )
              }, 500)
            } else {
              addNotification(`Failed to delete code: ${data.error}`, 'error')
            }
          }
        } catch (error) {
          console.error('Error deleting code:', error)
          addNotification('Failed to delete code. Please try again.', 'error')
        }
      },
      forceDelete ? 'Force Delete' : 'Delete Code',
      'danger'
    )
  }

  const handleToggleStatus = async (code, currentActive) => {
    try {
      const response = await fetch(`/api/admin/assessment-codes/${code}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_status',
          active: !currentActive
        })
      })

      const data = await response.json()

      if (response.ok) {
        addNotification(`Code ${!currentActive ? 'activated' : 'deactivated'} successfully`, 'success')
        fetchCodes()
        fetchStats()
        fetchOrganizations() // ✅ Refresh organizations filter
      } else {
        addNotification(`Failed to update code: ${data.error}`, 'error')
      }
    } catch (error) {
      console.error('Error updating code:', error)
      addNotification('Failed to update code. Please try again.', 'error')
    }
  }

  const handleEditCode = (code) => {
    setEditingCode(code)
    setShowEditModal(true)
  }

  const handleUpdateCode = async (formData) => {
    if (!editingCode) return

    // Validate form data
    if (!formData.organization.trim()) {
      addNotification('Organization name is required', 'error')
      return
    }

    setModalLoading(true)

    try {
      const payload = {
        action: 'update_details',
        organization_name: formData.organization.trim(),
        intended_recipient: formData.description.trim() || null,
        expires_in_days: formData.expirationDays,
        assessment_type: formData.assessmentType,
        max_uses: formData.maxUses
      }

      const response = await fetch(`/api/admin/assessment-codes/${editingCode.code}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (response.ok) {
        if (data.questionListUpdated) {
          addNotification('Assessment code updated successfully! Question list has been regenerated.', 'success')
        } else {
          addNotification('Assessment code updated successfully!', 'success')
        }
        setShowEditModal(false)
        setEditingCode(null)
        fetchCodes()
        fetchStats()
        fetchOrganizations() // ✅ Refresh organizations filter
      } else {
        addNotification(`Failed to update code: ${data.error}`, 'error')
      }
    } catch (error) {
      console.error('Error updating code:', error)
      addNotification('Failed to update code. Please try again.', 'error')
    } finally {
      setModalLoading(false)
    }
  }

  const StatCard = ({ title, count, icon: Icon, color, description }) => (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 2px 12px rgba(15, 44, 105, 0.08)',
      padding: '24px',
      borderLeft: `4px solid ${color}`,
      marginBottom: '16px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '48px',
          height: '48px',
          borderRadius: '8px',
          backgroundColor: color,
          marginRight: '16px'
        }}>
          <Icon size={20} color="white" />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{
            fontSize: '12px',
            fontWeight: '600',
            color: '#6b7280',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            margin: '0 0 4px 0'
          }}>
            {title}
          </p>
          <p style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#111827',
            margin: '0 0 4px 0'
          }}>
            {loading ? '...' : count.toLocaleString()}
          </p>
          {description && (
            <p style={{
              fontSize: '12px',
              color: '#6b7280',
              margin: '0'
            }}>
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  )

  const StatusBadge = ({ status }) => {
    const badgeStyles = {
      active: { backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' },
      inactive: { backgroundColor: '#f3f4f6', color: '#4b5563', border: '1px solid #d1d5db' },
      expired: { backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' },
      used_up: { backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }
    }

    const style = badgeStyles[status] || badgeStyles.inactive

    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 8px',
        fontSize: '12px',
        fontWeight: '500',
        borderRadius: '4px',
        textTransform: 'capitalize',
        ...style
      }}>
        {status ? status.replace('_', ' ') : 'unknown'}
      </span>
    )
  }

  // Toast Notification Component
  const ToastNotification = ({ notification, onClose }) => {
    const { id, message, type } = notification

    const typeStyles = {
      success: {
        bg: '#dcfce7',
        border: '#16a34a',
        text: '#15803d',
        icon: <Check size={20} />
      },
      error: {
        bg: '#fee2e2',
        border: '#dc2626',
        text: '#dc2626',
        icon: <AlertCircle size={20} />
      },
      info: {
        bg: '#dbeafe',
        border: '#2563eb',
        text: '#1d4ed8',
        icon: <Info size={20} />
      }
    }

    const style = typeStyles[type] || typeStyles.info

    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '16px',
          backgroundColor: style.bg,
          border: `1px solid ${style.border}`,
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          minWidth: '320px',
          maxWidth: '500px',
          marginBottom: '12px',
          animation: 'slideInRight 0.3s ease-out'
        }}
      >
        <div style={{ color: style.text, flexShrink: 0 }}>
          {style.icon}
        </div>
        <div style={{ flex: 1, color: style.text, fontSize: '14px', fontWeight: '500' }}>
          {message}
        </div>
        <button
          onClick={() => onClose(id)}
          style={{
            background: 'none',
            border: 'none',
            color: style.text,
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            opacity: 0.7,
            transition: 'opacity 0.2s ease'
          }}
          onMouseOver={(e) => e.target.style.opacity = '1'}
          onMouseOut={(e) => e.target.style.opacity = '0.7'}
        >
          <X size={16} />
        </button>
      </div>
    )
  }

  // Toast Container Component
  const ToastContainer = () => {
    if (notifications.length === 0) return null

    return (
      <div
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end'
        }}
      >
        {notifications.map(notification => (
          <ToastNotification
            key={notification.id}
            notification={notification}
            onClose={removeNotification}
          />
        ))}
      </div>
    )
  }

  // Confirmation Modal Component
  const ConfirmationModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText, type }) => {
    if (!isOpen) return null

    const typeStyles = {
      danger: {
        confirmBg: '#ef4444',
        confirmHover: '#dc2626',
        iconColor: '#ef4444',
        icon: <AlertTriangle size={24} />
      },
      warning: {
        confirmBg: '#f59e0b',
        confirmHover: '#d97706',
        iconColor: '#f59e0b',
        icon: <AlertTriangle size={24} />
      },
      info: {
        confirmBg: '#3b82f6',
        confirmHover: '#2563eb',
        iconColor: '#3b82f6',
        icon: <Info size={24} />
      }
    }

    const style = typeStyles[type] || typeStyles.info

    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '20px'
        }}
        onClick={(e) => e.target === e.currentTarget && onCancel()}
      >
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          maxWidth: '500px',
          width: '100%',
          overflow: 'hidden',
          animation: 'modalSlideIn 0.3s ease-out'
        }}>
          {/* Modal Header */}
          <div style={{
            padding: '24px 32px 20px 32px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: `${style.iconColor}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: style.iconColor,
              flexShrink: 0
            }}>
              {style.icon}
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#111827',
                margin: '0 0 4px 0'
              }}>
                {title}
              </h2>
              <p style={{
                fontSize: '16px',
                color: '#6b7280',
                margin: 0,
                lineHeight: '1.5'
              }}>
                {message}
              </p>
            </div>
          </div>

          {/* Modal Footer */}
          <div style={{
            padding: '20px 32px 32px 32px',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px'
          }}>
            <button
              onClick={onCancel}
              style={{
                padding: '12px 20px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                backgroundColor: 'white',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#f9fafb'
                e.target.style.borderColor = '#d1d5db'
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = 'white'
                e.target.style.borderColor = '#e5e7eb'
              }}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              style={{
                padding: '12px 20px',
                fontSize: '14px',
                fontWeight: '500',
                color: 'white',
                backgroundColor: style.confirmBg,
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = style.confirmHover
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = style.confirmBg
              }}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Edit Modal Component
  const EditCodeModal = ({ isOpen, onClose, onSubmit, loading, codeData }) => {
    const [localFormData, setLocalFormData] = useState({
      organization: '',
      description: '',
      expirationDays: 90,
      assessmentType: 'full',
      maxUses: 1
    })
    const [questions, setQuestions] = useState([])
    const [questionsLoading, setQuestionsLoading] = useState(false)
    const [questionsStats, setQuestionsStats] = useState(null)

    // Reset form when modal opens with code data
    React.useEffect(() => {
      if (isOpen && codeData) {
        const expiresAt = new Date(codeData.expires_at)
        const currentDate = new Date()
        const daysUntilExpiry = Math.ceil((expiresAt - currentDate) / (1000 * 60 * 60 * 24))

        setLocalFormData({
          organization: codeData.organization_name ?? '',
          description: codeData.intended_recipient ?? '',
          expirationDays: Math.max(1, daysUntilExpiry),
          assessmentType: codeData.assessment_type ?? 'full',
          maxUses: codeData.max_uses ?? 1
        })

        // Fetch questions for this code
        fetchCodeQuestions()
      }
    }, [isOpen, codeData])

    const fetchCodeQuestions = async () => {
      if (!codeData?.code) return

      setQuestionsLoading(true)
      try {
        const response = await fetch(`/api/admin/assessment-codes/${codeData.code}/questions`)
        const data = await response.json()

        if (data.success) {
          setQuestions(data.questions || [])
          setQuestionsStats(data.stats)
        }
      } catch (error) {
        console.error('Error fetching questions:', error)
      } finally {
        setQuestionsLoading(false)
      }
    }

    const handleLocalSubmit = (e) => {
      e.preventDefault()
      if (!localFormData.organization.trim()) {
        return
      }
      onSubmit(localFormData)
    }

    if (!isOpen) return null

    return (
      <div
        style={{
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
        }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          maxWidth: '900px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto'
        }}>
          {/* Modal Header */}
          <div style={{ padding: '24px', borderBottom: '1px solid #e5e7eb' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827', margin: '0 0 8px 0' }}>
              Edit Assessment Code
            </h2>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: '0' }}>
              Update the details for code: <strong>{codeData?.code}</strong>
            </p>
          </div>

          {/* Modal Body */}
          <form onSubmit={handleLocalSubmit} style={{ padding: '24px' }}>
            {/* Organization Name */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                Organization Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                value={localFormData.organization}
                onChange={(e) => setLocalFormData(prev => ({ ...prev, organization: e.target.value }))}
                placeholder="Enter organization name"
                autoComplete="off"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: '14px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '6px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Description */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                Description/Intended Recipient
              </label>
              <input
                type="text"
                value={localFormData.description}
                onChange={(e) => setLocalFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Optional description or recipient name"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: '14px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '6px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Expiration, Max Uses, and Type */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  Days Until Expiry
                </label>
                <input
                  type="number"
                  value={localFormData.expirationDays}
                  onChange={(e) => setLocalFormData(prev => ({ ...prev, expirationDays: parseInt(e.target.value) || 1 }))}
                  min="1"
                  max="365"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: '14px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '6px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  Max Uses
                </label>
                <input
                  type="number"
                  value={localFormData.maxUses}
                  onChange={(e) => setLocalFormData(prev => ({ ...prev, maxUses: Math.max(1, parseInt(e.target.value) || 1) }))}
                  min="1"
                  max="100"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: '14px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '6px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  Assessment Type
                </label>
                <select
                  value={localFormData.assessmentType}
                  onChange={(e) => setLocalFormData(prev => ({ ...prev, assessmentType: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: '14px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '6px',
                    backgroundColor: 'white',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="full">Full Assessment</option>
                  <option value="quick">Quick Assessment</option>
                </select>
              </div>
            </div>

            {/* Questions Section */}
            <div style={{ marginBottom: '20px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: 0 }}>
                  Assessment Questions
                </h3>
                {questionsStats && (
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    {questionsStats.total_questions} questions in this assessment
                  </div>
                )}
              </div>

              {questionsLoading ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
                  Loading questions...
                </div>
              ) : questions.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '24px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  color: '#6b7280'
                }}>
                  No questions assigned to this code
                </div>
              ) : (
                <div style={{
                  maxHeight: '300px',
                  overflowY: 'auto',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}>
                  <table style={{ width: '100%', fontSize: '13px' }}>
                    <thead style={{ backgroundColor: '#f9fafb', position: 'sticky', top: 0 }}>
                      <tr>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb', width: '60px' }}>
                          #
                        </th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>
                          Question
                        </th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb', width: '200px' }}>
                          Domain/Subdomain
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {questions.map((q, idx) => (
                        <tr key={q.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                          <td style={{ padding: '10px 12px', textAlign: 'center', color: '#6b7280', fontSize: '12px' }}>
                            {idx + 1}
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <div style={{ display: 'flex', alignItems: 'start', gap: '8px' }}>
                              <span style={{ fontSize: '16px', flexShrink: 0 }}>{q.icon || '❓'}</span>
                              <div>
                                <div style={{ fontWeight: '500', color: '#111827', marginBottom: '2px' }}>
                                  {q.title_en || q.text_en?.substring(0, 60) + '...'}
                                </div>
                                <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                                  ID: {q.id}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <div style={{ fontSize: '11px' }}>
                              <div style={{ color: '#6b7280', fontWeight: '500' }}>{q.domain_name_en}</div>
                              <div style={{ color: '#9ca3af' }}>{q.subdomain_name_en}</div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  backgroundColor: 'white',
                  border: '2px solid #e5e7eb',
                  borderRadius: '6px',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !localFormData.organization.trim()}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: 'white',
                  backgroundColor: loading || !localFormData.organization.trim() ? '#9ca3af' : '#7f7afe',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: loading || !localFormData.organization.trim() ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {loading && (
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                )}
                {loading ? 'Updating...' : 'Update Code'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  // Separate Modal Component with its own state
  const AddCodeModal = ({ isOpen, onClose, onSubmit, loading }) => {
    const [localFormData, setLocalFormData] = useState({
      organization: '',
      description: '',
      expirationDays: 90,
      assessmentType: 'full',
      maxUses: 1,
      bulkCount: 1
    })
    const [localBulkMode, setLocalBulkMode] = useState(false)

    // Reset form when modal opens
    React.useEffect(() => {
      if (isOpen) {
        setLocalFormData({
          organization: '',
          description: '',
          expirationDays: 90,
          assessmentType: 'full',
          maxUses: 1,
          bulkCount: 1
        })
        setLocalBulkMode(false)
      }
    }, [isOpen])

    const handleLocalSubmit = (e) => {
      e.preventDefault()
      if (!localFormData.organization.trim()) {
        // This will be handled by the parent component's notification system
        return
      }
      onSubmit(localFormData, localBulkMode)
    }

    if (!isOpen) return null

    return (
      <div
        style={{
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
        }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          maxWidth: '500px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto'
        }}>
          {/* Modal Header */}
          <div style={{ padding: '24px', borderBottom: '1px solid #e5e7eb' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827', margin: '0 0 8px 0' }}>
              Generate Assessment Code{localBulkMode ? 's' : ''}
            </h2>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: '0' }}>
              {localBulkMode ? 'Create multiple assessment codes at once' : 'Create a new assessment code for organization access'}
            </p>
          </div>

          {/* Modal Body */}
          <form onSubmit={handleLocalSubmit} style={{ padding: '24px' }}>
            {/* Bulk Mode Toggle */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={localBulkMode}
                  onChange={(e) => setLocalBulkMode(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#7f7afe' }}
                />
                Bulk Generation Mode
              </label>
            </div>

            {/* Organization Name */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                Organization Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                value={localFormData.organization}
                onChange={(e) => setLocalFormData(prev => ({ ...prev, organization: e.target.value }))}
                placeholder="Enter organization name"
                autoComplete="off"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: '14px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '6px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Description */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                Description/Intended Recipient
              </label>
              <input
                type="text"
                value={localFormData.description}
                onChange={(e) => setLocalFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Optional description or recipient name"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: '14px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '6px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Expiration, Max Uses, and Type */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  Expires In (Days)
                </label>
                <input
                  type="number"
                  value={localFormData.expirationDays}
                  onChange={(e) => setLocalFormData(prev => ({ ...prev, expirationDays: parseInt(e.target.value) || 90 }))}
                  min="1"
                  max="365"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: '14px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '6px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  Max Uses
                </label>
                <input
                  type="number"
                  value={localFormData.maxUses}
                  onChange={(e) => setLocalFormData(prev => ({ ...prev, maxUses: Math.max(1, parseInt(e.target.value) || 1) }))}
                  min="1"
                  max="100"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: '14px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '6px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  Assessment Type
                </label>
                <select
                  value={localFormData.assessmentType}
                  onChange={(e) => setLocalFormData(prev => ({ ...prev, assessmentType: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: '14px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '6px',
                    backgroundColor: 'white',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="full">Full Assessment</option>
                  <option value="quick">Quick Assessment</option>
                </select>
              </div>
            </div>

            {/* Bulk Count */}
            {localBulkMode && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  Number of Codes to Generate
                </label>
                <input
                  type="number"
                  value={localFormData.bulkCount}
                  onChange={(e) => setLocalFormData(prev => ({ ...prev, bulkCount: Math.min(100, Math.max(1, parseInt(e.target.value) || 1)) }))}
                  min="1"
                  max="100"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: '14px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '6px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            )}

            {/* Modal Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  backgroundColor: 'white',
                  border: '2px solid #e5e7eb',
                  borderRadius: '6px',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !localFormData.organization.trim()}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: 'white',
                  backgroundColor: loading || !localFormData.organization.trim() ? '#9ca3af' : '#7f7afe',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: loading || !localFormData.organization.trim() ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {loading && (
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                )}
                {loading ? 'Generating...' : `Generate ${localBulkMode ? `${localFormData.bulkCount} Code${localFormData.bulkCount > 1 ? 's' : ''}` : 'Code'}`}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  const DataTable = () => {
    if (tableLoading) {
      return (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 12px rgba(15, 44, 105, 0.08)',
          padding: '48px',
          textAlign: 'center'
        }}>
          <div style={{ 
            width: '32px', 
            height: '32px', 
            border: '3px solid #e5e7eb',
            borderTop: '3px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px auto'
          }}></div>
          <p style={{ color: '#6b7280', margin: '0' }}>Loading assessment codes...</p>
        </div>
      )
    }

    if (codes.length === 0) {
      return (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 12px rgba(15, 44, 105, 0.08)',
          padding: '48px',
          textAlign: 'center'
        }}>
          <Code size={48} style={{ color: '#9ca3af', margin: '0 auto 16px auto' }} />
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            color: '#111827',
            margin: '0 0 8px 0'
          }}>
            No codes found
          </h3>
          <p style={{ 
            color: '#6b7280',
            margin: '0'
          }}>
            {search || filters.status !== 'all' || filters.type !== 'all' || filters.organization !== 'all'
              ? 'Try adjusting your filters or search terms'
              : 'Create your first assessment code to get started'
            }
          </p>
        </div>
      )
    }

    return (
      <div style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 12px rgba(15, 44, 105, 0.08)',
        overflow: 'hidden'
      }}>
        {/* Search Bar */}
        <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
          <input
            type="text"
            placeholder="Search codes, organizations, or recipients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: '14px',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              outline: 'none',
              transition: 'border-color 0.2s ease'
            }}
            onFocus={(e) => e.target.style.borderColor = '#7f7afe'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
          />
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Code</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Organization</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Type</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Usage</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Expires</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {codes.map((code, index) => (
                <tr 
                  key={code.code}
                  style={{ 
                    borderBottom: '1px solid #f3f4f6',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                >
                  <td style={{ padding: '16px', fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                    {code.code}
                  </td>
                  <td style={{ padding: '16px', fontSize: '14px', color: '#6b7280' }}>
                    {code.organization_name || '-'}
                  </td>
                  <td style={{ padding: '16px', fontSize: '14px', color: '#6b7280' }}>
                    <span style={{
                      padding: '2px 8px',
                      fontSize: '12px',
                      fontWeight: '500',
                      backgroundColor: code.assessment_type === 'full' ? '#e0e7ff' : '#fef3c7',
                      color: code.assessment_type === 'full' ? '#3730a3' : '#92400e',
                      borderRadius: '4px',
                      textTransform: 'capitalize'
                    }}>
                      {code.assessment_type || 'full'}
                    </span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <StatusBadge status={code.status} />
                  </td>
                  <td style={{ padding: '16px', fontSize: '14px', color: '#6b7280' }}>
                    {code.usage_count}/{code.max_uses || '∞'}
                  </td>
                  <td style={{ padding: '16px', fontSize: '14px', color: '#6b7280' }}>
                    {code.expires_at ? new Date(code.expires_at).toLocaleDateString() : '-'}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                      {/* Edit Button */}
                      <button
                        onClick={() => handleEditCode(code)}
                        title="Edit code"
                        style={{
                          padding: '8px',
                          backgroundColor: 'transparent',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s ease',
                          color: '#6b7280'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = '#f3f4f6'
                          e.currentTarget.style.color = '#374151'
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent'
                          e.currentTarget.style.color = '#6b7280'
                        }}
                      >
                        <Edit size={16} />
                      </button>

                      {/* Toggle Status Button */}
                      {code.active ? (
                        <button
                          onClick={() => handleToggleStatus(code.code, true)}
                          title="Deactivate code"
                          style={{
                            padding: '8px',
                            backgroundColor: 'transparent',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease',
                            color: '#f59e0b'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = '#fef3c7'
                            e.currentTarget.style.color = '#d97706'
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent'
                            e.currentTarget.style.color = '#f59e0b'
                          }}
                        >
                          <EyeOff size={16} />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleToggleStatus(code.code, false)}
                          title="Activate code"
                          style={{
                            padding: '8px',
                            backgroundColor: 'transparent',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease',
                            color: '#10b981'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = '#dcfce7'
                            e.currentTarget.style.color = '#059669'
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent'
                            e.currentTarget.style.color = '#10b981'
                          }}
                        >
                          <Eye size={16} />
                        </button>
                      )}

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeleteCode(code.code)}
                        title="Delete code"
                        style={{
                          padding: '8px',
                          backgroundColor: 'transparent',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s ease',
                          color: '#ef4444'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = '#fee2e2'
                          e.currentTarget.style.color = '#dc2626'
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent'
                          e.currentTarget.style.color = '#ef4444'
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  if (error && !loading) {
    return (
      <div className="container page-container" style={{ textAlign: 'center' }}>
        <AlertCircle size={48} style={{ color: '#ef4444', margin: '0 auto 16px auto' }} />
        <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600' }}>Error loading page</h3>
        <p style={{ margin: '0 0 24px 0', color: '#6b7280' }}>{error}</p>
        <button
          onClick={fetchStats}
          className="btn-primary"
          style={{ width: 'auto', minWidth: '120px' }}
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="container page-container">
      {/* Toast Notifications */}
      <ToastContainer />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        title={confirmAction?.title}
        message={confirmAction?.message}
        onConfirm={handleConfirm}
        onCancel={handleCancelConfirm}
        confirmText={confirmAction?.confirmText}
        type={confirmAction?.type}
      />

      {/* Add Code Modal */}
      <AddCodeModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleSubmitCode}
        loading={modalLoading}
      />

      {/* Edit Code Modal */}
      <EditCodeModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setEditingCode(null)
        }}
        onSubmit={handleUpdateCode}
        loading={modalLoading}
        codeData={editingCode}
      />
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <h1 style={{
              fontSize: '28px',
              fontWeight: 'bold',
              margin: '0 0 8px 0',
              color: 'var(--text-primary)'
            }}>
              Assessment Codes
            </h1>
            <p style={{
              color: 'var(--text-light)',
              margin: '0',
              fontSize: '16px'
            }}>
              Manage and monitor assessment access codes
            </p>
          </div>
          <button
            onClick={handleAddCode}
            className="btn-primary"
            style={{
              width: 'auto',
              minWidth: '140px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <Plus size={16} />
            Add Code
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        <StatCard
          title="Total Codes"
          count={stats?.total || 0}
          icon={Code}
          color="#6b7280"
          description="All generated codes"
        />
        <StatCard
          title="Active"
          count={stats?.active || 0}
          icon={CheckCircle}
          color="#10b981"
          description="Ready to use"
        />
        <StatCard
          title="Inactive"
          count={stats?.inactive || 0}
          icon={AlertCircle}
          color="#6b7280"
          description="Manually disabled"
        />
        <StatCard
          title="Expired"
          count={stats?.expired || 0}
          icon={AlertCircle}
          color="#ef4444"
          description="Past expiration date"
        />
        <StatCard
          title="Used Up"
          count={stats?.used_up || 0}
          icon={TrendingUp}
          color="#f59e0b"
          description="Max uses reached"
        />
        <StatCard
          title="Expiring Soon"
          count={stats?.expiring_soon || 0}
          icon={AlertCircle}
          color="#eab308"
          description="Next 30 days"
        />
      </div>

      {/* Filters Section */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 12px rgba(15, 44, 105, 0.08)',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Filter size={16} color="#6b7280" />
              <span style={{ 
                fontSize: '14px', 
                fontWeight: '600', 
                color: '#374151' 
              }}>
                Filters:
              </span>
            </div>
            
            <FilterSelect
              label="Status"
              value={filters.status}
              onChange={(value) => handleFilterChange('status', value)}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'expired', label: 'Expired' },
                { value: 'used_up', label: 'Used Up' }
              ]}
            />
            
            <FilterSelect
              label="Type"
              value={filters.type}
              onChange={(value) => handleFilterChange('type', value)}
              options={[
                { value: 'all', label: 'All Types' },
                { value: 'full', label: 'Full Assessment' },
                { value: 'quick', label: 'Quick Assessment' }
              ]}
            />
            
            <FilterSelect
              label="Organization"
              value={filters.organization}
              onChange={(value) => handleFilterChange('organization', value)}
              loading={filtersLoading}
              options={[
                { value: 'all', label: 'All Organizations' },
                ...organizations.map(org => ({
                  value: org,
                  label: org
                }))
              ]}
            />
          </div>
          
          {/* Clear Filters Button */}
          {(filters.status !== 'all' || filters.type !== 'all' || filters.organization !== 'all') && (
            <button
              onClick={clearFilters}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#6b7280',
                backgroundColor: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#f3f4f6'
                e.target.style.borderColor = '#d1d5db'
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = '#f9fafb'
                e.target.style.borderColor = '#e5e7eb'
              }}
            >
              Clear Filters
            </button>
          )}
        </div>
        
        {/* Active Filters Display */}
        {(filters.status !== 'all' || filters.type !== 'all' || filters.organization !== 'all') && (
          <div style={{
            marginTop: '16px',
            paddingTop: '16px',
            borderTop: '1px solid #e5e7eb'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexWrap: 'wrap'
            }}>
              <span style={{ 
                fontSize: '12px', 
                fontWeight: '600', 
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Active Filters:
              </span>
              
              {filters.status !== 'all' && (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '4px 8px',
                  fontSize: '12px',
                  fontWeight: '500',
                  color: '#1f2937',
                  backgroundColor: '#e0e7ff',
                  borderRadius: '4px'
                }}>
                  Status: {filters.status}
                </span>
              )}
              
              {filters.type !== 'all' && (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '4px 8px',
                  fontSize: '12px',
                  fontWeight: '500',
                  color: '#1f2937',
                  backgroundColor: '#dcfce7',
                  borderRadius: '4px'
                }}>
                  Type: {filters.type}
                </span>
              )}
              
              {filters.organization !== 'all' && (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '4px 8px',
                  fontSize: '12px',
                  fontWeight: '500',
                  color: '#1f2937',
                  backgroundColor: '#fef3c7',
                  borderRadius: '4px'
                }}>
                  Org: {filters.organization}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Export Section */}
      {codes.length > 0 && (
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
              <Download size={16} color="#6b7280" />
              <span style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151'
              }}>
                Export {codes.length} filtered code{codes.length !== 1 ? 's' : ''}:
              </span>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={exportToCSV}
                style={{
                  padding: '10px 16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  backgroundColor: 'white',
                  border: '2px solid #e5e7eb',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.borderColor = '#d1d5db'
                  e.target.style.backgroundColor = '#f9fafb'
                }}
                onMouseOut={(e) => {
                  e.target.style.borderColor = '#e5e7eb'
                  e.target.style.backgroundColor = 'white'
                }}
                title="Export filtered codes to CSV"
              >
                <FileText size={16} />
                Export CSV
              </button>
              <button
                onClick={exportToExcel}
                style={{
                  padding: '10px 16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  backgroundColor: 'white',
                  border: '2px solid #e5e7eb',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.borderColor = '#d1d5db'
                  e.target.style.backgroundColor = '#f9fafb'
                }}
                onMouseOut={(e) => {
                  e.target.style.borderColor = '#e5e7eb'
                  e.target.style.backgroundColor = 'white'
                }}
                title="Export filtered codes to Excel"
              >
                <FileSpreadsheet size={16} />
                Export Excel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Data Table */}
      <DataTable />

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 12px rgba(15, 44, 105, 0.08)',
          padding: '20px',
          marginTop: '24px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            {/* Results info */}
            <div style={{
              fontSize: '14px',
              color: '#6b7280'
            }}>
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCodes)} of {totalCodes} codes
            </div>

            {/* Pagination controls */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              {/* Previous button */}
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                style={{
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: currentPage === 1 ? '#9ca3af' : '#374151',
                  backgroundColor: 'white',
                  border: '2px solid #e5e7eb',
                  borderRadius: '6px',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: currentPage === 1 ? 0.5 : 1
                }}
                onMouseOver={(e) => {
                  if (currentPage !== 1) {
                    e.target.style.borderColor = '#d1d5db'
                    e.target.style.backgroundColor = '#f9fafb'
                  }
                }}
                onMouseOut={(e) => {
                  if (currentPage !== 1) {
                    e.target.style.borderColor = '#e5e7eb'
                    e.target.style.backgroundColor = 'white'
                  }
                }}
              >
                Previous
              </button>

              {/* Page numbers */}
              <div style={{ display: 'flex', gap: '4px' }}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                  // Show first page, last page, current page, and pages around current
                  const showPage = page === 1 ||
                                   page === totalPages ||
                                   (page >= currentPage - 1 && page <= currentPage + 1)

                  // Show ellipsis
                  const showEllipsisBefore = page === currentPage - 2 && currentPage > 3
                  const showEllipsisAfter = page === currentPage + 2 && currentPage < totalPages - 2

                  if (!showPage && !showEllipsisBefore && !showEllipsisAfter) return null

                  if (showEllipsisBefore || showEllipsisAfter) {
                    return (
                      <span key={`ellipsis-${page}`} style={{
                        padding: '8px 12px',
                        fontSize: '14px',
                        color: '#9ca3af'
                      }}>
                        ...
                      </span>
                    )
                  }

                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      style={{
                        padding: '8px 12px',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: currentPage === page ? 'white' : '#374151',
                        backgroundColor: currentPage === page ? '#7f7afe' : 'white',
                        border: `2px solid ${currentPage === page ? '#7f7afe' : '#e5e7eb'}`,
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        minWidth: '40px'
                      }}
                      onMouseOver={(e) => {
                        if (currentPage !== page) {
                          e.target.style.borderColor = '#d1d5db'
                          e.target.style.backgroundColor = '#f9fafb'
                        }
                      }}
                      onMouseOut={(e) => {
                        if (currentPage !== page) {
                          e.target.style.borderColor = '#e5e7eb'
                          e.target.style.backgroundColor = 'white'
                        }
                      }}
                    >
                      {page}
                    </button>
                  )
                })}
              </div>

              {/* Next button */}
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                style={{
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: currentPage === totalPages ? '#9ca3af' : '#374151',
                  backgroundColor: 'white',
                  border: '2px solid #e5e7eb',
                  borderRadius: '6px',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: currentPage === totalPages ? 0.5 : 1
                }}
                onMouseOver={(e) => {
                  if (currentPage !== totalPages) {
                    e.target.style.borderColor = '#d1d5db'
                    e.target.style.backgroundColor = '#f9fafb'
                  }
                }}
                onMouseOut={(e) => {
                  if (currentPage !== totalPages) {
                    e.target.style.borderColor = '#e5e7eb'
                    e.target.style.backgroundColor = 'white'
                  }
                }}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add CSS for animations */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes slideInRight {
          0% {
            transform: translateX(100%);
            opacity: 0;
          }
          100% {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes fadeOut {
          0% {
            opacity: 1;
            transform: translateX(0);
          }
          100% {
            opacity: 0;
            transform: translateX(100%);
          }
        }
        @keyframes modalSlideIn {
          0% {
            transform: scale(0.95) translateY(-10px);
            opacity: 0;
          }
          100% {
            transform: scale(1) translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}