'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Settings,
  BarChart3,
  Users,
  Code,
  Menu,
  X,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Lock,
  User,
  ChevronDown,
  Key,
  UserPlus,
  FileText
} from 'lucide-react'
import PasswordChangeModal from '../../components/PasswordChangeModal'
import AddUserModal from '../../components/AddUserModal'

export default function AdminSidebarLayout({ children }) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [addUserModalOpen, setAddUserModalOpen] = useState(false)
  const userMenuRef = useRef(null)

  const sidebarItems = [
    {
      title: 'Dashboard',
      description: 'Overview & statistics',
      href: '/admin/dashboard',
      icon: BarChart3,
    },
    {
      title: 'Organization Requests',
      description: 'Assessment requests',
      href: '/admin/org-requests',
      icon: FileText,
    },
    {
      title: 'Assessment Codes',
      description: 'Manage assessment codes',
      href: '/admin/assessment-codes',
      icon: Code,
    },
    {
      title: 'Results & Analytics',
      description: 'View assessment results',
      href: '/admin/results',
      icon: BarChart3,
    },
    {
      title: 'User Sessions',
      description: 'Monitor user sessions',
      href: '/admin/sessions',
      icon: Users,
    },
    {
      title: 'System Settings',
      description: 'Configure system settings',
      href: '/admin/settings',
      icon: Settings,
    },
  ]

  const isActive = (href) => pathname === href

  const handleSignOut = () => {
    signOut({ callbackUrl: '/admin/login' })
  }

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <div style={{ display: 'flex', height: '100vh' }}>
        {/* Sidebar */}
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 50,
          backgroundColor: 'white',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          borderRight: '1px solid #e5e7eb',
          width: sidebarCollapsed ? '64px' : '256px',
          transform: sidebarOpen ? 'translateX(0)' : window.innerWidth < 768 ? 'translateX(-100%)' : 'translateX(0)',
          transition: 'all 0.3s ease',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Sidebar Header */}
          <div style={{
            padding: '16px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            {!sidebarCollapsed && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Lock size={16} color="white" />
                </div>
                <div>
                  <h2 style={{
                    fontWeight: '600',
                    color: '#111827',
                    fontSize: '14px',
                    margin: 0
                  }}>
                    Admin Panel
                  </h2>
                  <p style={{
                    fontSize: '12px',
                    color: '#6b7280',
                    margin: 0
                  }}>
                    Omnisight Analytics
                  </p>
                </div>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              style={{
                padding: '4px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: 'transparent',
                color: '#6b7280',
                cursor: 'pointer'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#f3f4f6'}
              onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              {sidebarCollapsed ? (
                <ChevronRight size={16} />
              ) : (
                <ChevronLeft size={16} />
              )}
            </button>
          </div>

          {/* Navigation Items */}
          <nav style={{ padding: '8px', flex: 1 }}>
            {sidebarItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              
              return (
                <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    borderRadius: '8px',
                    marginBottom: '4px',
                    cursor: 'pointer',
                    backgroundColor: active ? '#eff6ff' : 'transparent',
                    border: active ? '1px solid #bfdbfe' : '1px solid transparent',
                    color: active ? '#1e40af' : '#374151',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    if (!active) {
                      e.currentTarget.style.backgroundColor = '#f9fafb'
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!active) {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }
                  }}>
                    <Icon size={18} color={active ? '#2563eb' : '#6b7280'} />
                    {!sidebarCollapsed && (
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p style={{
                          fontSize: '14px',
                          fontWeight: '500',
                          color: active ? '#1e3a8a' : '#111827',
                          margin: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {item.title}
                        </p>
                        <p style={{
                          fontSize: '12px',
                          color: active ? '#2563eb' : '#6b7280',
                          margin: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {item.description}
                        </p>
                      </div>
                    )}
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* User Section */}
          <div style={{
            padding: '16px',
            borderTop: '1px solid #e5e7eb'
          }}>
            {!sidebarCollapsed ? (
              <div>
                <div style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  marginBottom: '8px'
                }}>
                  Signed in as:
                </div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#111827',
                  marginBottom: '8px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {session?.user?.email}
                </div>
                <button
                  onClick={handleSignOut}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    fontSize: '14px',
                    color: '#dc2626',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#fef2f2'}
                  onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={handleSignOut}
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  padding: '8px',
                  color: '#dc2626',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#fef2f2'}
                onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                title="Sign Out"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Mobile backdrop */}
        {sidebarOpen && window.innerWidth < 768 && (
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 40
            }}
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <div style={{
          flex: 1,
          marginLeft: window.innerWidth >= 768 ? (sidebarCollapsed ? '64px' : '256px') : '0',
          minHeight: 0,
          transition: 'margin-left 0.3s ease'
        }}>
          {/* Top Navigation */}
          <header style={{
            backgroundColor: 'white',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            borderBottom: '1px solid #e5e7eb',
            padding: '16px 24px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  style={{
                    display: window.innerWidth < 768 ? 'block' : 'none',
                    padding: '8px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                  onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
                <h1 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: '#111827',
                  margin: 0
                }}>
                  {sidebarItems.find(item => item.href === pathname)?.title || 'Admin'}
                </h1>
              </div>

              {/* User Menu */}
              <div style={{ position: 'relative' }} ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    backgroundColor: 'transparent',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#f9fafb'}
                  onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    backgroundColor: '#e5e7eb',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <User size={16} color="#6b7280" />
                  </div>
                  <div style={{
                    display: window.innerWidth >= 640 ? 'block' : 'none',
                    textAlign: 'left'
                  }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#111827'
                    }}>
                      {session?.user?.name || 'Admin'}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#6b7280'
                    }}>
                      {session?.user?.email}
                    </div>
                  </div>
                  <ChevronDown size={16} color="#6b7280" />
                </button>

                {/* User Dropdown */}
                {userMenuOpen && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '8px',
                    width: '200px',
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    zIndex: 50
                  }}>
                    <div style={{ padding: '8px' }}>
                      <button
                        onClick={() => {
                          setAddUserModalOpen(true)
                          setUserMenuOpen(false)
                        }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 12px',
                          fontSize: '14px',
                          color: '#374151',
                          backgroundColor: 'transparent',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          textAlign: 'left'
                        }}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                        onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                      >
                        <UserPlus size={16} />
                        Add User
                      </button>
                      <button
                        onClick={() => {
                          setPasswordModalOpen(true)
                          setUserMenuOpen(false)
                        }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 12px',
                          fontSize: '14px',
                          color: '#374151',
                          backgroundColor: 'transparent',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          textAlign: 'left'
                        }}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                        onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                      >
                        <Key size={16} />
                        Change Password
                      </button>
                      <button
                        onClick={handleSignOut}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 12px',
                          fontSize: '14px',
                          color: '#dc2626',
                          backgroundColor: 'transparent',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          textAlign: 'left'
                        }}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#fef2f2'}
                        onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                      >
                        <LogOut size={16} />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main style={{ padding: '24px', height: 'calc(100vh - 80px)', overflow: 'auto' }}>
            {children}
          </main>
        </div>
      </div>

      {/* Password Change Modal */}
      <PasswordChangeModal 
        isOpen={passwordModalOpen} 
        onClose={() => setPasswordModalOpen(false)} 
      />

      {/* Add User Modal */}
      <AddUserModal 
        isOpen={addUserModalOpen} 
        onClose={() => setAddUserModalOpen(false)}
        onUserAdded={(user) => {
          console.log('New user created:', user)
          // You could add a toast notification here or refresh user list
        }}
      />
    </div>
  )
}