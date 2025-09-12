'use client'

import { useState, useEffect } from 'react'
import { Code, Plus, Calendar, Users, Eye, EyeOff, Trash2, Copy, X, CheckSquare, Hash } from 'lucide-react'
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

export default function ModernAssessmentCodesPage() {
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
        <div className="flex items-center gap-2">
          <Badge variant="active" icon={<Code size={12} />}>
            {value}
          </Badge>
          <button
            onClick={(e) => {
              e.stopPropagation()
              copyToClipboard(value)
            }}
            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
            title="Copy to clipboard"
          >
            <Copy size={12} />
          </button>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (value, item) => {
        const statusConfig = {
          active: { variant: 'success' as const, icon: <Eye size={12} /> },
          inactive: { variant: 'inactive' as const, icon: <EyeOff size={12} /> },
          expired: { variant: 'danger' as const, icon: <Calendar size={12} /> },
          used_up: { variant: 'warning' as const, icon: <Users size={12} /> }
        }
        
        const config = statusConfig[value] || statusConfig.inactive
        
        return (
          <Badge variant={config.variant} icon={config.icon}>
            {value.replace('_', ' ').toUpperCase()}
          </Badge>
        )
      }
    },
    {
      key: 'assessment_type',
      label: 'Type',
      render: (value) => (
        <Badge variant={value === 'full' ? 'active' : 'pending'} icon={<CheckSquare size={12} />}>
          {value === 'full' ? 'Full Assessment' : 'Quick Assessment'}
        </Badge>
      )
    },
    {
      key: 'usage_count',
      label: 'Usage',
      render: (value, item) => (
        <div className="flex items-center gap-1 text-sm">
          <Users size={14} className="text-gray-400" />
          <span className="font-medium">{value}</span>
          <span className="text-gray-400">/</span>
          <span>{item.max_uses || '∞'}</span>
        </div>
      )
    },
    {
      key: 'expires_at',
      label: 'Expires',
      render: (value) => (
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <Calendar size={14} className="text-gray-400" />
          {formatDate(value)}
        </div>
      )
    },
    {
      key: 'created_at',
      label: 'Created',
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
    <div className="flex items-center gap-2">
      <button
        onClick={(e) => {
          e.stopPropagation()
          toggleCodeStatus(item.code, item.status)
        }}
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
          item.status === 'active'
            ? 'text-orange-700 bg-orange-100 hover:bg-orange-200'
            : 'text-green-700 bg-green-100 hover:bg-green-200'
        }`}
        title={item.status === 'active' ? 'Deactivate' : 'Activate'}
      >
        {item.status === 'active' ? (
          <>
            <EyeOff size={12} />
            Deactivate
          </>
        ) : (
          <>
            <Eye size={12} />
            Activate
          </>
        )}
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation()
          deleteCode(item.code)
        }}
        className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 transition-colors"
        title="Delete"
      >
        <Trash2 size={12} />
        Delete
      </button>
    </div>
  )

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="p-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <button 
                onClick={fetchCodes}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

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

          {/* Modern Data Table */}
          <DataTable
            data={codes}
            columns={columns}
            filters={filters}
            searchPlaceholder="Search codes by name, description, or code..."
            emptyMessage="No assessment codes found. Generate your first code to get started."
            loading={loading}
            renderActions={renderActions}
            className="shadow-sm"
          />
        </div>
      </div>

      {/* Generate Code Modal - You would integrate the existing modal here */}
      {showGenerateModal && (
        <div>
          {/* Modal content would go here - use the existing GenerateCodeModal */}
        </div>
      )}
    </div>
  )
}