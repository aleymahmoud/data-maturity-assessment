'use client'

import { useState, useEffect } from 'react'
import { FileText, Mail, Phone, Building, MapPin, Briefcase, Calendar, RefreshCw, Tag } from 'lucide-react'

export default function OrganizationRequestsPage() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await fetch('/api/admin/org-requests')
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch requests')
      }

      setRequests(data.requests)
    } catch (error) {
      console.error('Error fetching requests:', error)
      setError('Failed to load organization requests')
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (requestId, newStatus) => {
    try {
      const response = await fetch('/api/admin/org-requests', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestId, status: newStatus }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update status')
      }

      // Update local state
      setRequests(requests.map(req =>
        req.id === requestId ? { ...req, status: newStatus, updated_at: new Date() } : req
      ))

      // Close modal if open
      if (selectedRequest?.id === requestId) {
        setSelectedRequest({ ...selectedRequest, status: newStatus })
      }
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update status: ' + error.message)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' }
      case 'contacted':
        return { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' }
      case 'completed':
        return { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' }
      case 'cancelled':
        return { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' }
      default:
        return { bg: '#f3f4f6', text: '#374151', border: '#d1d5db' }
    }
  }

  const getTypeColor = (type) => {
    switch (type) {
      case 'dma':
        return { bg: '#ede9fe', text: '#6d28d9', border: '#c4b5fd' }
      case 'consultation':
        return { bg: '#fef3c7', text: '#b45309', border: '#fcd34d' }
      default:
        return { bg: '#f3f4f6', text: '#374151', border: '#d1d5db' }
    }
  }

  const getTypeLabel = (type) => {
    switch (type) {
      case 'dma':
        return 'Data Maturity Assessment'
      case 'consultation':
        return 'Consultation'
      default:
        return type
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Apply both filters
  const filteredRequests = requests.filter(req => {
    const statusMatch = filterStatus === 'all' || req.status === filterStatus
    const typeMatch = filterType === 'all' || req.type === filterType
    return statusMatch && typeMatch
  })

  const statusCounts = {
    all: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    contacted: requests.filter(r => r.status === 'contacted').length,
    completed: requests.filter(r => r.status === 'completed').length,
    cancelled: requests.filter(r => r.status === 'cancelled').length,
  }

  const typeCounts = {
    all: requests.length,
    dma: requests.filter(r => r.type === 'dma').length,
    consultation: requests.filter(r => r.type === 'consultation').length,
  }

  if (error) {
    return (
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '24px',
        textAlign: 'center'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '48px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <p style={{ color: '#dc2626', marginBottom: '16px', fontSize: '16px' }}>{error}</p>
          <button
            onClick={fetchRequests}
            style={{
              padding: '8px 16px',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div>
          <h1 style={{
            fontSize: '24px',
            fontWeight: '600',
            color: '#111827',
            margin: 0,
            marginBottom: '8px'
          }}>
            Organization Requests
          </h1>
          <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
            Manage and track organization requests for assessments and consultations
          </p>
        </div>
        <button
          onClick={fetchRequests}
          disabled={loading}
          style={{
            padding: '8px 16px',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
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

      {/* Type Filter */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7eb',
        marginBottom: '16px',
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        flexWrap: 'wrap'
      }}>
        <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
          Request Type:
        </span>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { key: 'all', label: 'All Types' },
            { key: 'dma', label: 'Data Maturity Assessment' },
            { key: 'consultation', label: 'Consultation' }
          ].map(type => (
            <button
              key={type.key}
              onClick={() => setFilterType(type.key)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid',
                borderColor: filterType === type.key ? '#6d28d9' : '#e5e7eb',
                backgroundColor: filterType === type.key ? '#ede9fe' : 'white',
                color: filterType === type.key ? '#6d28d9' : '#374151',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
            >
              {type.label} ({typeCounts[type.key]})
            </button>
          ))}
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7eb',
        marginBottom: '24px',
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        flexWrap: 'wrap'
      }}>
        <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
          Status:
        </span>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { key: 'all', label: 'All' },
            { key: 'pending', label: 'Pending' },
            { key: 'contacted', label: 'Contacted' },
            { key: 'completed', label: 'Completed' },
            { key: 'cancelled', label: 'Cancelled' }
          ].map(status => (
            <button
              key={status.key}
              onClick={() => setFilterStatus(status.key)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid',
                borderColor: filterStatus === status.key ? '#2563eb' : '#e5e7eb',
                backgroundColor: filterStatus === status.key ? '#eff6ff' : 'white',
                color: filterStatus === status.key ? '#1e40af' : '#374151',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
            >
              {status.label} ({statusCounts[status.key]})
            </button>
          ))}
        </div>
      </div>

      {/* Requests List */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7eb',
        overflow: 'hidden'
      }}>
        {loading ? (
          <div style={{
            padding: '48px',
            textAlign: 'center',
            color: '#6b7280'
          }}>
            Loading requests...
          </div>
        ) : filteredRequests.length === 0 ? (
          <div style={{
            padding: '48px',
            textAlign: 'center',
            color: '#6b7280'
          }}>
            <FileText size={48} color="#d1d5db" style={{ margin: '0 auto 16px' }} />
            <p style={{ fontSize: '16px', marginBottom: '8px' }}>No requests found</p>
            <p style={{ fontSize: '14px', color: '#9ca3af' }}>
              {filterStatus === 'all' && filterType === 'all'
                ? 'There are no organization requests yet.'
                : 'No requests match the selected filters.'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse'
            }}>
              <thead style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <tr>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#6b7280',
                    textTransform: 'uppercase'
                  }}>
                    Type
                  </th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#6b7280',
                    textTransform: 'uppercase'
                  }}>
                    Organization
                  </th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#6b7280',
                    textTransform: 'uppercase'
                  }}>
                    Contact Person
                  </th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#6b7280',
                    textTransform: 'uppercase'
                  }}>
                    Email
                  </th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#6b7280',
                    textTransform: 'uppercase'
                  }}>
                    Status
                  </th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#6b7280',
                    textTransform: 'uppercase'
                  }}>
                    Date
                  </th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#6b7280',
                    textTransform: 'uppercase'
                  }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((request, index) => {
                  const statusStyle = getStatusColor(request.status)
                  const typeStyle = getTypeColor(request.type)
                  return (
                    <tr
                      key={request.id}
                      style={{
                        borderBottom: index < filteredRequests.length - 1 ? '1px solid #e5e7eb' : 'none',
                        cursor: 'pointer'
                      }}
                      onClick={() => setSelectedRequest(request)}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                    >
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '600',
                          backgroundColor: typeStyle.bg,
                          color: typeStyle.text,
                          border: `1px solid ${typeStyle.border}`,
                          textTransform: 'uppercase'
                        }}>
                          {request.type === 'dma' ? 'DMA' : 'Consult'}
                        </span>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontWeight: '500', color: '#111827', marginBottom: '4px' }}>
                          {request.organization_name}
                        </div>
                        {request.organization_size && (
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>
                            {request.organization_size}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ color: '#374151' }}>
                          {request.user_name}
                        </div>
                        {request.job_title && (
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>
                            {request.job_title}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '16px', color: '#374151' }}>
                        {request.user_email}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '500',
                          backgroundColor: statusStyle.bg,
                          color: statusStyle.text,
                          border: `1px solid ${statusStyle.border}`,
                          textTransform: 'capitalize'
                        }}>
                          {request.status}
                        </span>
                      </td>
                      <td style={{ padding: '16px', color: '#6b7280', fontSize: '14px' }}>
                        {formatDate(request.created_at)}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedRequest(request)
                          }}
                          style={{
                            padding: '6px 12px',
                            fontSize: '12px',
                            color: '#2563eb',
                            backgroundColor: 'transparent',
                            border: '1px solid #2563eb',
                            borderRadius: '6px',
                            cursor: 'pointer'
                          }}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedRequest && (
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
            padding: '16px'
          }}
          onClick={() => setSelectedRequest(null)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: '24px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: '#111827',
                  margin: 0
                }}>
                  Request Details
                </h2>
                {(() => {
                  const typeStyle = getTypeColor(selectedRequest.type)
                  return (
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600',
                      backgroundColor: typeStyle.bg,
                      color: typeStyle.text,
                      border: `1px solid ${typeStyle.border}`
                    }}>
                      {getTypeLabel(selectedRequest.type)}
                    </span>
                  )
                })()}
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                style={{
                  padding: '4px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '20px',
                  color: '#6b7280'
                }}
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Organization Info */}
                <div>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    marginBottom: '12px'
                  }}>
                    Organization Information
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                      <Building size={18} color="#6b7280" style={{ marginTop: '2px', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: '14px', color: '#111827', fontWeight: '500' }}>
                          {selectedRequest.organization_name}
                        </div>
                        {selectedRequest.organization_size && (
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>
                            {selectedRequest.organization_size}
                          </div>
                        )}
                      </div>
                    </div>
                    {selectedRequest.industry && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Briefcase size={18} color="#6b7280" style={{ flexShrink: 0 }} />
                        <div style={{ fontSize: '14px', color: '#374151' }}>
                          {selectedRequest.industry}
                        </div>
                      </div>
                    )}
                    {selectedRequest.country && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <MapPin size={18} color="#6b7280" style={{ flexShrink: 0 }} />
                        <div style={{ fontSize: '14px', color: '#374151' }}>
                          {selectedRequest.country}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact Info */}
                <div>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    marginBottom: '12px'
                  }}>
                    Contact Information
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                      <Mail size={18} color="#6b7280" style={{ marginTop: '2px', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: '14px', color: '#111827', fontWeight: '500' }}>
                          {selectedRequest.user_name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                          {selectedRequest.user_email}
                        </div>
                        {selectedRequest.job_title && (
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>
                            {selectedRequest.job_title}
                          </div>
                        )}
                      </div>
                    </div>
                    {selectedRequest.phone_number && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Phone size={18} color="#6b7280" style={{ flexShrink: 0 }} />
                        <div style={{ fontSize: '14px', color: '#374151' }}>
                          {selectedRequest.phone_number}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Message */}
                {selectedRequest.message && (
                  <div>
                    <div style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      marginBottom: '12px'
                    }}>
                      Message
                    </div>
                    <div style={{
                      padding: '12px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '6px',
                      fontSize: '14px',
                      color: '#374151',
                      lineHeight: '1.6'
                    }}>
                      {selectedRequest.message}
                    </div>
                  </div>
                )}

                {/* Dates */}
                <div>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    marginBottom: '12px'
                  }}>
                    Timeline
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Calendar size={18} color="#6b7280" style={{ flexShrink: 0 }} />
                      <div style={{ fontSize: '14px', color: '#374151' }}>
                        Created: {formatDate(selectedRequest.created_at)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Calendar size={18} color="#6b7280" style={{ flexShrink: 0 }} />
                      <div style={{ fontSize: '14px', color: '#374151' }}>
                        Updated: {formatDate(selectedRequest.updated_at)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Update */}
                <div>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    marginBottom: '12px'
                  }}>
                    Update Status
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {['pending', 'contacted', 'completed', 'cancelled'].map(status => {
                      const statusStyle = getStatusColor(status)
                      const isActive = selectedRequest.status === status
                      return (
                        <button
                          key={status}
                          onClick={() => updateStatus(selectedRequest.id, status)}
                          disabled={isActive}
                          style={{
                            padding: '8px 16px',
                            borderRadius: '6px',
                            border: '1px solid',
                            borderColor: isActive ? statusStyle.border : '#e5e7eb',
                            backgroundColor: isActive ? statusStyle.bg : 'white',
                            color: isActive ? statusStyle.text : '#374151',
                            cursor: isActive ? 'not-allowed' : 'pointer',
                            fontSize: '14px',
                            fontWeight: '500',
                            textTransform: 'capitalize',
                            opacity: isActive ? 0.7 : 1
                          }}
                        >
                          {status}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setSelectedRequest(null)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
