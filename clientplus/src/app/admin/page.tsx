// src/app/admin/page.tsx - Restored Original Admin Dashboard
'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { 
  Users, 
  UserCheck, 
  Shield, 
  Building2, 
  Activity,
  TrendingUp,
  Calendar,
  FileText,
  LogIn
} from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  superUsers: number;
  totalDomains: number;
  recentEntries: number;
  thisMonthEntries: number;
  // Additional calculated fields
  thisMonthUsers: number;
  thisMonthDomains: number;
  activePercentage: number;
}

interface RecentActivity {
  id: string;
  type: 'user_created' | 'user_updated' | 'password_reset' | 'login' | 'entry_added';
  user: string;
  description: string;
  timestamp: string;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    superUsers: 0,
    totalDomains: 0,
    recentEntries: 0,
    thisMonthEntries: 0,
    thisMonthUsers: 0,
    thisMonthDomains: 0,
    activePercentage: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardStats();
    fetchRecentActivity();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/stats');
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setError('Failed to load dashboard statistics');
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchRecentActivity = async () => {
    try {
      const response = await fetch('/api/admin/activity');
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      setRecentActivity(data);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }
  };

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers.toString(),
      icon: Users,
      color: 'text-blue-600 bg-blue-100',
      change: stats.thisMonthUsers > 0 ? `+${stats.thisMonthUsers} this month` : 'No new users this month'
    },
    {
      title: 'Active Users',
      value: stats.activeUsers.toString(),
      icon: UserCheck,
      color: 'text-green-600 bg-green-100',
      change: `${stats.activePercentage}% active`
    },
    {
      title: 'Super Users',
      value: stats.superUsers.toString(),
      icon: Shield,
      color: 'text-red-600 bg-red-100',
      change: 'Admin access'
    },
    {
      title: 'Domains',
      value: stats.totalDomains.toString(),
      icon: Building2,
      color: 'text-purple-600 bg-purple-100',
      change: stats.thisMonthDomains > 0 ? `+${stats.thisMonthDomains} this month` : 'Service areas'
    }
  ];

  const activityTypeConfig = {
    user_created: { icon: Users, color: 'text-green-600 bg-green-100' },
    user_updated: { icon: UserCheck, color: 'text-blue-600 bg-blue-100' },
    password_reset: { icon: Shield, color: 'text-red-600 bg-red-100' },
    login: { icon: LogIn, color: 'text-gray-600 bg-gray-100' },
    entry_added: { icon: FileText, color: 'text-purple-600 bg-purple-100' },
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">Welcome to ClientPlus Admin</h1>
          <p className="text-blue-100">
            Manage users, monitor system activity, and maintain organizational settings.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoading ? (
            // Loading skeleton
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="bg-white rounded-lg border p-6 animate-pulse">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
                    <div className="h-6 w-16 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 w-20 bg-gray-200 rounded"></div>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-gray-200"></div>
                </div>
              </div>
            ))
          ) : error ? (
            // Error state
            <div className="col-span-4 p-6 text-center">
              <div className="text-red-500 mb-2">{error}</div>
              <button 
                onClick={fetchDashboardStats}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Try Again
              </button>
            </div>
          ) : (
            // Actual stat cards
            statCards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.title} className="bg-white rounded-lg border p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{card.title}</p>
                      <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                      <p className="text-sm text-gray-500 mt-1">{card.change}</p>
                    </div>
                    <div className={`p-3 rounded-full ${card.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
              <Activity className="h-5 w-5 text-gray-400" />
            </div>
            {recentActivity.length === 0 ? (
              <div className="text-center py-4 text-gray-500">Loading activity data...</div>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((activity) => {
                  const config = activityTypeConfig[activity.type];
                  const Icon = config.icon;
                  
                  return (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className={`p-2 rounded-full ${config.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">{activity.description}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <p className="text-xs text-gray-500">by {activity.user}</p>
                          <span className="text-xs text-gray-400">•</span>
                          <p className="text-xs text-gray-500">
                            {new Date(activity.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="mt-4 pt-4 border-t">
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                View all activity →
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
              <TrendingUp className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              <a
                href="/admin/users"
                className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <Users className="h-5 w-5 text-gray-400 group-hover:text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900">Manage Users</p>
                    <p className="text-sm text-gray-500">Create, edit, and deactivate users</p>
                  </div>
                </div>
                <span className="text-gray-400 group-hover:text-blue-600">→</span>
              </a>

              <a
                href="/admin/domains"
                className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <Building2 className="h-5 w-5 text-gray-400 group-hover:text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900">Domain Management</p>
                    <p className="text-sm text-gray-500">Configure service domains</p>
                  </div>
                </div>
                <span className="text-gray-400 group-hover:text-blue-600">→</span>
              </a>

              <a
                href="/admin/clients"
                className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <UserCheck className="h-5 w-5 text-gray-400 group-hover:text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900">Client Management</p>
                    <p className="text-sm text-gray-500">Manage consulting clients</p>
                  </div>
                </div>
                <span className="text-gray-400 group-hover:text-blue-600">→</span>
              </a>

              <a
                href="/admin/deals"
                className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-gray-400 group-hover:text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900">Consultant Deals</p>
                    <p className="text-sm text-gray-500">Manage monthly deal allocations</p>
                  </div>
                </div>
                <span className="text-gray-400 group-hover:text-blue-600">→</span>
              </a>
            </div>
          </div>
        </div>

        {/* System Overview */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">System Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-3">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-medium text-gray-900">This Month</h3>
              <p className="text-2xl font-bold text-blue-600">{stats.thisMonthEntries}</p>
              <p className="text-sm text-gray-500">Time entries</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-3">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-medium text-gray-900">Recent Activity</h3>
              <p className="text-2xl font-bold text-green-600">{stats.recentEntries}</p>
              <p className="text-sm text-gray-500">Last 7 days</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mx-auto mb-3">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-medium text-gray-900">User Engagement</h3>
              <p className="text-2xl font-bold text-purple-600">
                {Math.round((stats.activeUsers / stats.totalUsers) * 100)}%
              </p>
              <p className="text-sm text-gray-500">Active users</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}