// src/app/dashboard/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Clock, 
  TrendingUp, 
  Calendar,
  Shield,
  Award,
  Target,
  Activity,
  PlusCircle,
  Info
} from 'lucide-react';
import TodaysEntries from '@/components/data-entry/TodaysEntries'
import { useEffect, useState } from 'react'

// Interface for team members breakdown
interface TeamMembersBreakdown {
  subdomain: string;
  consultants: string[];
  count: number;
}

interface DashboardStats {
  todayHours: number;
  monthHours: number;
  utilization: number;
  activeClients: number;
  teamMembers?: number;
  teamMembersBreakdown?: TeamMembersBreakdown[];
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    todayHours: 0,
    monthHours: 0,
    utilization: 0,
    activeClients: 0,
  })

  const [recentActivity, setRecentActivity] = useState([])
  const [showTooltip, setShowTooltip] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState<'right' | 'left'>('right')

  // useEffect to fetch real data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch stats
        const statsResponse = await fetch('/api/dashboard/stats')
        if (statsResponse.ok) {
          const stats = await statsResponse.json()
          setDashboardStats(stats)
          console.log('Received dashboard stats:', stats)
        }

        // Fetch activity
        const activityResponse = await fetch('/api/dashboard/activity')
        if (activityResponse.ok) {
          const activity = await activityResponse.json()
          setRecentActivity(activity)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }
    
    fetchData()
  }, [])

  if (!session?.user) {
    return null;
  }

  const isAdmin = session.user.role === 'SUPER_USER';
  const isLead = session.user.role === 'LEAD_CONSULTANT';

  // Navigation handlers
  const handleNavigation = (path: string) => {
    router.push(path);
  };

  const quickActions = [
    {
      title: 'Add Time Entry',
      description: 'Log your work hours',
      href: '/data-entry',
      icon: Clock,
      color: 'bg-blue-500',
      primary: true,
    },
    {
      title: 'View Reports',
      description: 'Analyze your performance',
      href: '/reports',
      icon: TrendingUp,
      color: 'bg-green-500',
    },
    {
      title: 'Analytics',
      description: 'View detailed insights',
      href: '/analytics',
      icon: Activity,
      color: 'bg-purple-500',
    },
  ];

  // Add admin actions for super users
  if (isAdmin) {
    quickActions.push({
      title: 'Admin Panel',
      description: 'Manage users & system',
      href: '/admin',
      icon: Shield,
      color: 'bg-red-500',
    });
  }

  const statCards = [
    {
      title: 'Today\'s Hours',
      value: dashboardStats.todayHours.toString(),
      unit: 'hrs',
      icon: Clock,
      color: 'text-blue-600 bg-blue-100',
    },
    {
      title: 'This Month', 
      value: dashboardStats.monthHours.toString(),
      unit: 'hrs',
      icon: TrendingUp,
      color: 'text-purple-600 bg-purple-100',
    },
    {
      title: 'Utilization',
      value: dashboardStats.utilization.toString(),
      unit: '%',
      icon: Target,
      color: 'text-orange-600 bg-orange-100',
    },
    {
      title: 'Active Clients',
      value: dashboardStats.activeClients.toString(),
      unit: 'clients',
      icon: Users,
      color: 'text-green-600 bg-green-100',
    },
  ];

  // Add team stats for leads and admins
  if (isLead || isAdmin) {
    statCards.push({
      title: 'Team Members',
      value: dashboardStats.teamMembers?.toString() || '0',
      unit: 'people',
      icon: Users,
      color: 'text-indigo-600 bg-indigo-100'
      
    });
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-2">
                Welcome back, {session.user.username}! 👋
              </h1>
              <p className="text-blue-100">
                Here's your activity overview for today.
              </p>
              <div className="flex items-center mt-3 space-x-4">
                <div className="flex items-center space-x-1">
                  {isAdmin && <Shield className="h-4 w-4 text-red-300" />}
                  <span className="text-blue-100 text-sm capitalize">
                    {session.user.role?.replace('_', ' ').toLowerCase()}
                  </span>
                </div>
                <div className="text-blue-100 text-sm">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
              </div>
            </div>
            <div className="hidden md:block">
              <Award className="h-16 w-16 text-blue-300" />
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {statCards.map((card) => {
            const Icon = card.icon;
            const isTeamMembersCard = card.title === 'Team Members';
            
            return (
              <div 
                key={card.title} 
                className="relative bg-white rounded-lg border p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-600">
                        {card.title}
                      </p>
                      {/* Tooltip trigger for Team Members card */}
                      {isTeamMembersCard && (
                        <div 
                          className="relative"
                          onMouseEnter={(e) => {
                            setShowTooltip(true)
                            // Calculate dynamic positioning based on screen space
                            const rect = e.currentTarget.getBoundingClientRect()
                            const screenWidth = window.innerWidth
                            const tooltipWidth = 320 // 80 * 4 (w-80 = 320px)
                            
                            // If there's not enough space on the right, show on the left
                            if (rect.right + tooltipWidth > screenWidth - 20) {
                              setTooltipPosition('left')
                            } else {
                              setTooltipPosition('right')
                            }
                          }}
                          onMouseLeave={() => setShowTooltip(false)}
                        >
                          <Info className="h-4 w-4 text-gray-400 cursor-help hover:text-gray-600 transition-colors" />
                          
                          {/* Dynamic Tooltip */}
                          {showTooltip && (
                            <div className={`
                              absolute z-50 w-80 p-4 bg-gray-900 text-white text-sm rounded-lg shadow-xl border
                              ${tooltipPosition === 'right' 
                                ? 'left-6 top-0' 
                                : 'right-6 top-0'
                              }
                            `}>
                              <div className="font-semibold mb-3 text-indigo-200">
                                Team Members Breakdown
                              </div>
                              <div className="space-y-2 max-h-48 overflow-y-auto">
                                {dashboardStats.teamMembersBreakdown && dashboardStats.teamMembersBreakdown.length > 0 ? (
                                  dashboardStats.teamMembersBreakdown.map((item, index) => (
                                    <div key={index} className="border-l-2 border-indigo-400 pl-3">
                                      <div className="text-indigo-200 font-medium text-xs mb-1">
                                        {item.subdomain}
                                      </div>
                                      <div className="text-gray-300 text-xs">
                                        {item.consultants.join(', ')} 
                                        <span className="ml-2 text-indigo-300">
                                          ({item.count} {item.count === 1 ? 'person' : 'people'})
                                        </span>
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <div className="text-gray-400 text-center py-2">
                                    {dashboardStats.teamMembers === 0 ? (
                                      <>
                                        <div className="text-sm mb-1">No team members found</div>
                                        <div className="text-xs">
                                          You haven't worked with any subdomains this month, or you're the only one working on your current subdomains.
                                        </div>
                                      </>
                                    ) : (
                                      <div className="text-sm">Loading breakdown...</div>
                                    )}
                                  </div>
                                )}
                              </div>
                              {/* Dynamic Arrow */}
                              <div className={`
                                absolute top-4 w-0 h-0 border-t-8 border-b-8 border-t-transparent border-b-transparent
                                ${tooltipPosition === 'right' 
                                  ? '-left-2 border-r-8 border-r-gray-900' 
                                  : '-right-2 border-l-8 border-l-gray-900'
                                }
                              `}></div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-baseline space-x-1 mt-2">
                      <p className="text-2xl font-bold text-gray-900">
                        {card.value}
                      </p>
                      <p className="text-sm text-gray-500">
                        {card.unit}
                      </p>
                    </div>
                  </div>
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center ${card.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
                
                {/* Additional info for Team Members card */}
                {isTeamMembersCard && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                      Colleagues sharing your subdomains this month
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-6">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.title}
                onClick={() => handleNavigation(action.href)}
                className={`${action.color} text-white hover:opacity-90 h-auto p-6 flex-col space-y-2`}
              >
                <Icon className="h-8 w-8" />
                <div className="text-center">
                  <div className="font-semibold">{action.title}</div>
                  <div className="text-sm opacity-90">{action.description}</div>
                </div>
              </Button>
            );
          })}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {recentActivity.length > 0 ? (
                recentActivity.slice(0, 4).map((activity: any, index) => (
                  <div key={activity.id || index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(activity.timestamp).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No recent activity</p>
              )}
            </div>
            <div className="mt-4 pt-4 border-t">
              <Button 
                variant="ghost" 
                onClick={() => handleNavigation('/reports')}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                View all activity →
              </Button>
            </div>
          </div>

          {/* Today's Entries */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Today's Entries</h2>
            <TodaysEntries />
          </div>

          {/* Team Overview - Show for both leads and admins */}
          {(isLead || isAdmin) && (
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Users className="h-6 w-6 text-blue-600" />
                <h2 className="text-lg font-semibold text-blue-800">Team Overview</h2>
              </div>
              <p className="text-sm text-blue-700 mb-4">
                {isAdmin 
                  ? "As an admin, you can view team analytics and generate comprehensive reports."
                  : "As a lead consultant, you can view team analytics and generate reports."
                }
              </p>
              <Button
                onClick={() => handleNavigation('/analytics')}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                View Team Analytics
              </Button>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}