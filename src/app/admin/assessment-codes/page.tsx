'use client'

import { useState, useEffect } from 'react'
import { Code, Plus, Search, Filter, Calendar, Users, Eye, EyeOff, Trash2, Edit, Copy, X, CheckSquare, Hash } from 'lucide-react'
import { DataTable, Badge, Column } from '../../../components/DataTable'

// Types for the assessment code data
interface AssessmentCode {
  code: string
  status: 'active' | 'inactive' | 'expired' | 'used_up'
  max_uses: number
  usage_count: number
  expires_at: string
  created_at: string
  description?: string
  assessment_type: 'full' | 'quick'
}

export default function AssessmentCodesPage() {
  const [codes, setCodes] = useState<AssessmentCode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showGenerateModal, setShowGenerateModal] = useState(false)

  useEffect(() => {
    fetchCodes()
  }, [])

  const fetchCodes = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/assessment-codes')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch codes')
      }

      setCodes(data.codes)
    } catch (error) {
      console.error('Error fetching codes:', error)
      setError('Failed to load assessment codes')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // Could add toast notification here
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const toggleCodeStatus = async (code: string, currentStatus: string) => {
    try {
      const response = await fetch(`/api/admin/assessment-codes/${code}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_status',
          active: currentStatus !== 'active'
        })
      })

      if (response.ok) {
        fetchCodes()
      }
    } catch (error) {
      console.error('Error toggling status:', error)
    }
  }

  const deleteCode = async (code: string) => {
    if (!confirm('Are you sure you want to delete this assessment code?')) return

    try {
      const response = await fetch(`/api/admin/assessment-codes?code=${code}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchCodes()
      }
    } catch (error) {
      console.error('Error deleting code:', error)
    }
  }

  // Define table columns
  const columns: Column<AssessmentCode>[] = [
    {
      key: 'code',
      label: 'Code',
      render: (value, item) => (
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
            <Code size={16} className="text-gray-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{value}</div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                copyToClipboard(value)
              }}
              className="text-xs text-gray-500 hover:text-blue-600 transition-colors"
              title="Copy to clipboard"
            >
              Copy to clipboard
            </button>
          </div>
        </div>
      )
    },
    {
      key: 'assessment_type',
      label: 'Type',
      render: (value) => (
        <Badge variant={value === 'full' ? 'pending' : 'active'}>
          {value === 'full' ? 'Full Assessment' : 'Quick Assessment'}
        </Badge>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (value, item) => {
        const statusConfig = {
          active: { variant: 'success' as const },
          inactive: { variant: 'inactive' as const },
          expired: { variant: 'danger' as const },
          used_up: { variant: 'warning' as const }
        }
        
        const config = statusConfig[value] || statusConfig.inactive
        
        return (
          <Badge variant={config.variant}>
            {value === 'active' ? 'Active' : value === 'used_up' ? 'Used Up' : value === 'expired' ? 'Expired' : 'Inactive'}
          </Badge>
        )
      }
    },
    {
      key: 'usage_count',
      label: 'Usage',
      render: (value, item) => (
        <div className="text-sm text-gray-900">
          <span className="font-medium">{value}</span>
          <span className="text-gray-400">/{item.max_uses || '∞'}</span>
        </div>
      )
    },
    {
      key: 'expires_at',
      label: 'Last Updated',
      render: (value) => (
        <span className="text-sm text-gray-500">
          {formatDate(value)}
        </span>
      )
    }
  ]

  // Define filters
  const filters = [
    {
      key: 'status',
      label: 'Filter by Status',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'expired', label: 'Expired' },
        { value: 'used_up', label: 'Used Up' }
      ]
    },
    {
      key: 'assessment_type',
      label: 'Filter by Type',
      options: [
        { value: 'full', label: 'Full Assessment' },
        { value: 'quick', label: 'Quick Assessment' }
      ]
    }
  ]

  // Render action buttons for each row
  const renderActions = (item: AssessmentCode) => (
    <div className="flex items-center justify-center gap-1">
      <button
        onClick={(e) => {
          e.stopPropagation()
          toggleCodeStatus(item.code, item.status)
        }}
        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-gray-100 rounded transition-colors"
        title={item.status === 'active' ? 'Deactivate' : 'Activate'}
      >
        {item.status === 'active' ? 
          <EyeOff size={16} /> : 
          <Eye size={16} />
        }
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation()
          deleteCode(item.code)
        }}
        className="p-2 text-gray-400 hover:text-red-600 hover:bg-gray-100 rounded transition-colors"
        title="Delete"
      >
        <Trash2 size={16} />
      </button>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Code size={22} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Assessment Codes</h1>
                <p className="text-gray-600 mt-1">Manage and monitor assessment access codes</p>
              </div>
            </div>
            <button 
              onClick={() => setShowGenerateModal(true)}
              style={{
                padding: '12px 20px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: 'white',
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Plus size={16} />
              Generate New Code
            </button>
          </div>

          {/* Stats Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '24px',
            marginBottom: '32px'
          }}>
            {/* Total Codes Card */}
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
                    Total Codes
                  </p>
                  <p style={{
                    fontSize: '24px',
                    fontWeight: '600',
                    color: '#111827',
                    margin: 0
                  }}>
                    {loading ? '...' : codes.length}
                  </p>
                </div>
              </div>
            </div>

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
                  <Eye size={20} color="#059669" />
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
                    {loading ? '...' : codes.filter(c => c.status === 'active').length}
                  </p>
                </div>
              </div>
            </div>

            {/* Expired Codes Card */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              border: '1px solid #e5e7eb',
              padding: '24px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ flexShrink: 0 }}>
                  <Calendar size={20} color="#dc2626" />
                </div>
                <div style={{ marginLeft: '16px' }}>
                  <p style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#6b7280',
                    margin: 0
                  }}>
                    Expired Codes
                  </p>
                  <p style={{
                    fontSize: '24px',
                    fontWeight: '600',
                    color: '#111827',
                    margin: 0
                  }}>
                    {loading ? '...' : codes.filter(c => c.status === 'expired').length}
                  </p>
                </div>
              </div>
            </div>

            {/* Used Up Codes Card */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              border: '1px solid #e5e7eb',
              padding: '24px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ flexShrink: 0 }}>
                  <Users size={20} color="#ea580c" />
                </div>
                <div style={{ marginLeft: '16px' }}>
                  <p style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#6b7280',
                    margin: 0
                  }}>
                    Used Up Codes
                  </p>
                  <p style={{
                    fontSize: '24px',
                    fontWeight: '600',
                    color: '#111827',
                    margin: 0
                  }}>
                    {loading ? '...' : codes.filter(c => c.status === 'used_up').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Assessment Codes Table */}
          {error ? (
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-8 text-center">
                <p className="text-red-600 mb-4">{error}</p>
                <button 
                  onClick={fetchCodes}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200">
              <DataTable
                data={codes}
                columns={columns}
                filters={filters}
                searchPlaceholder="Search codes by code, description, or assessment type..."
                emptyMessage="No assessment codes found. Generate your first code to get started."
                loading={loading}
                renderActions={renderActions}
              />
            </div>
          )}
        </div>
      </div>

      {/* Generate Code Modal */}
      {showGenerateModal && (
        <GenerateCodeModal 
          onClose={() => setShowGenerateModal(false)}
          onSuccess={() => {
            setShowGenerateModal(false)
            fetchCodes()
          }}
        />
      )}
    </div>
  )
}

function GenerateCodeModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    maxUses: 1,
    expiresIn: 90,
    description: '',
    assessmentType: 'full',
    bulkCount: 1,
    generateBulk: false
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Add Esc key listener
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        handleClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Client-side validation
    if (!formData.maxUses || formData.maxUses < 1) {
      setError('Max uses must be at least 1')
      setLoading(false)
      return
    }

    if (!formData.expiresIn || formData.expiresIn < 1) {
      setError('Expiration days must be at least 1')
      setLoading(false)
      return
    }

    if (formData.generateBulk && (!formData.bulkCount || formData.bulkCount < 1 || formData.bulkCount > 100)) {
      setError('Bulk count must be between 1 and 100')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/admin/assessment-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate code')
      }

      setSuccess(true)
      
      // Auto close after success
      setTimeout(() => {
        setSuccess(false)
        onSuccess()
      }, 2000)

    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      maxUses: 1,
      expiresIn: 90,
      description: '',
      assessmentType: 'full',
      bulkCount: 1,
      generateBulk: false
    })
    setError('')
    setSuccess(false)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <div 
      onClick={handleClose}
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
        padding: '16px'
      }}>
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          maxWidth: '520px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto'
        }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '24px',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#111827',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Plus size={20} color="#2563eb" />
            Generate Assessment Code
          </h2>
          <button
            onClick={handleClose}
            style={{
              padding: '8px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              color: '#6b7280'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#f3f4f6'}
            onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {/* Success Message */}
          {success && (
            <div style={{
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              color: '#166534',
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Code size={16} />
              {formData.generateBulk 
                ? `${formData.bulkCount} assessment codes generated successfully!`
                : 'Assessment code generated successfully!'
              }
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#b91c1c',
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <X size={16} />
              {error}
            </div>
          )}

          {/* Maximum Uses Field */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Maximum Uses <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none'
              }}>
                <Users size={16} color="#9ca3af" />
              </div>
              <input
                type="number"
                min="1"
                value={formData.maxUses}
                onChange={(e) => setFormData({ ...formData, maxUses: parseInt(e.target.value) })}
                placeholder="e.g., 50"
                required
                style={{
                  width: '100%',
                  paddingLeft: '40px',
                  paddingRight: '12px',
                  paddingTop: '12px',
                  paddingBottom: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
            </div>
            <p style={{
              fontSize: '12px',
              color: '#6b7280',
              margin: '4px 0 0 0'
            }}>
              How many times this code can be used
            </p>
          </div>

          {/* Expires In Field */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Expires In (Days) <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none'
              }}>
                <Calendar size={16} color="#9ca3af" />
              </div>
              <input
                type="number"
                min="1"
                value={formData.expiresIn}
                onChange={(e) => setFormData({ ...formData, expiresIn: parseInt(e.target.value) })}
                placeholder="e.g., 30"
                required
                style={{
                  width: '100%',
                  paddingLeft: '40px',
                  paddingRight: '12px',
                  paddingTop: '12px',
                  paddingBottom: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
            </div>
            <p style={{
              fontSize: '12px',
              color: '#6b7280',
              margin: '4px 0 0 0'
            }}>
              Code will expire after this many days
            </p>
          </div>

          {/* Assessment Type Field */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Assessment Type <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none'
              }}>
                <CheckSquare size={16} color="#9ca3af" />
              </div>
              <select
                value={formData.assessmentType}
                onChange={(e) => setFormData({ ...formData, assessmentType: e.target.value })}
                required
                style={{
                  width: '100%',
                  paddingLeft: '40px',
                  paddingRight: '12px',
                  paddingTop: '12px',
                  paddingBottom: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  backgroundColor: 'white',
                  cursor: 'pointer'
                }}
                onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              >
                <option value="full">Full Assessment</option>
                <option value="quick">Quick Assessment</option>
              </select>
            </div>
            <p style={{
              fontSize: '12px',
              color: '#6b7280',
              margin: '4px 0 0 0'
            }}>
              Choose the type of assessment this code will provide access to
            </p>
          </div>

          {/* Bulk Generation Toggle */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              cursor: 'pointer',
              gap: '8px'
            }}>
              <input
                type="checkbox"
                checked={formData.generateBulk}
                onChange={(e) => setFormData({ ...formData, generateBulk: e.target.checked })}
                style={{
                  width: '16px',
                  height: '16px',
                  accentColor: '#2563eb',
                  cursor: 'pointer'
                }}
              />
              Generate Multiple Codes (Bulk)
            </label>
            <p style={{
              fontSize: '12px',
              color: '#6b7280',
              margin: '4px 0 0 24px'
            }}>
              Generate multiple codes with the same settings at once
            </p>
          </div>

          {/* Bulk Count Field - Only show when bulk is enabled */}
          {formData.generateBulk && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '8px'
              }}>
                Number of Codes <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none'
                }}>
                  <Hash size={16} color="#9ca3af" />
                </div>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.bulkCount}
                  onChange={(e) => setFormData({ ...formData, bulkCount: parseInt(e.target.value) })}
                  placeholder="e.g., 10"
                  required
                  style={{
                    width: '100%',
                    paddingLeft: '40px',
                    paddingRight: '12px',
                    paddingTop: '12px',
                    paddingBottom: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
              </div>
              <p style={{
                fontSize: '12px',
                color: '#6b7280',
                margin: '4px 0 0 0'
              }}>
                How many codes to generate (maximum 100)
              </p>
            </div>
          )}

          {/* Description Field */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Description <span style={{ color: '#9ca3af', fontWeight: 'normal' }}>(Optional)</span>
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute',
                left: '12px',
                top: '12px',
                pointerEvents: 'none'
              }}>
                <Edit size={16} color="#9ca3af" />
              </div>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="e.g., Q4 Assessment Batch for Department X"
                rows="3"
                style={{
                  width: '100%',
                  paddingLeft: '40px',
                  paddingRight: '12px',
                  paddingTop: '12px',
                  paddingBottom: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  resize: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
            </div>
            <p style={{
              fontSize: '12px',
              color: '#6b7280',
              margin: '4px 0 0 0'
            }}>
              Optional description to help identify this code
            </p>
          </div>

          {/* Info Box */}
          <div style={{
            backgroundColor: '#f0f9ff',
            border: '1px solid #bae6fd',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '24px'
          }}>
            <p style={{
              fontSize: '12px',
              color: '#0369a1',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <Code size={14} />
              The generated code will provide secure access to the assessment system and will be tracked for usage analytics.
            </p>
          </div>

          {/* Buttons */}
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end'
          }}>
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              style={{
                padding: '12px 20px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                backgroundColor: 'white',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1
              }}
              onMouseOver={(e) => !loading && (e.target.style.backgroundColor = '#f9fafb')}
              onMouseOut={(e) => !loading && (e.target.style.backgroundColor = 'white')}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px 20px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: 'white',
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  Generating...
                </>
              ) : (
                <>
                  <Plus size={16} />
                  Generate Code
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}