'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useRef, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// Removed DatePicker import - using basic HTML date inputs instead
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Users, 
  TrendingUp, 
  Activity, 
  Calendar,
  BarChart3,
  PieChart,
  Filter,
  Download,
  RefreshCw,
  Clock,
  Target,
  ChevronDown,
  Check
} from 'lucide-react';
import { getCurrentWeekSundayToSaturday } from '@/lib/utils';
import { format } from 'date-fns';
import dynamic from 'next/dynamic';

// Dynamically import Chart.js components to avoid SSR issues
const Bar = dynamic(() => import('react-chartjs-2').then((mod) => mod.Bar), {
  ssr: false,
});
const Line = dynamic(() => import('react-chartjs-2').then((mod) => mod.Line), {
  ssr: false,
});
const Pie = dynamic(() => import('react-chartjs-2').then((mod) => mod.Pie), {
  ssr: false,
});
const Radar = dynamic(() => import('react-chartjs-2').then((mod) => mod.Radar), {
  ssr: false,
});

// Import chart types
import type { ChartData, ChartOptions } from 'chart.js';

// Chart.js imports and registration
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface AnalyticsData {
  performanceMetrics: {
    clientMetrics: {
      totalClients: number;
      totalProjectClients: number;
      totalRetainerClients: number;
      totalActiveClients: number;
      activeProjectClients: number;
      activeRetainerClients: number;
      totalClientHours: number;
      totalClientMandays: number;
    };
    teamMetrics: {
      myUtilization: number;
      teamUtilization: number;
      consultingTeamUtilization: number;
      supportingTeamUtilization: number;
      ffntHours: number;
      ffntMandays: number;
    };
  };
  utilizationChart: {
    months: string[];
    myUtilization: number[];
    teamUtilization: number[];
  };
  activityBreakdown: {
    months: string[];
    clientHours: number[];
    ffntHours: number[];
    clientMandays: number[];
    ffntMandays: number[];
  };
  clientDistribution: {
    pieChart: {
      labels: string[];
      data: number[];
      backgroundColor: string[];
      clientCounts: number[];
    };
    totalHours: number;
    totalClients: number;
  };
  performanceTrends: {
    months: string[];
    trends: {
      utilization: number[];
      efficiency: number[];
      clientDiversity: number[];
    };
    trendAnalysis: {
      utilizationTrend: 'up' | 'down' | 'stable';
      efficiencyTrend: 'up' | 'down' | 'stable';
      diversityTrend: 'up' | 'down' | 'stable';
    };
  };
  topClients: {
    clients: Array<{
      client: string;
      hours: number;
      mandays: number;
      type: string;
    }>;
    chartData: {
      labels: string[];
      data: number[];
      backgroundColor: string[];
    };
  };
  teamPerformance: {
    consultants: Array<{
      consultant: string;
      metrics: {
        utilization: number;
        clientDiversity: number;
        efficiency: number;
        clientFocus: number;
        ffntContribution: number;
      };
      rawData: {
        totalHours: number;
        clientHours: number;
        ffntHours: number;
        uniqueClients: number;
      };
    }>;
    radarLabels: string[];
  };
}

interface FilterState {
  fromDate: Date;
  toDate: Date;
  userTypes: string[];
  users: string[];
  domains: string[];
  subdomains: string[];
  scopes: string[];
  activityTypes: string[];
}

export default function AnalyticsPage() {
  const { data: session } = useSession();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const hasInitialized = useRef(false);
  const lastFetchTime = useRef<number>(0);
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache
  
  // Initialize filters with localStorage persistence
  const [filters, setFilters] = useState<FilterState>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedFilters = localStorage.getItem('analytics_filters');
        if (savedFilters) {
          const parsed = JSON.parse(savedFilters);
          return {
            ...parsed,
            fromDate: new Date(parsed.fromDate),
            toDate: new Date(parsed.toDate),
          };
        }
      } catch (error) {
        console.error('Error loading saved filters:', error);
      }
    }
    
    const currentWeek = getCurrentWeekSundayToSaturday();
    return {
      fromDate: new Date('2025-01-01'),
      toDate: currentWeek.to,
      userTypes: [],
      users: [],
      domains: [],
      subdomains: [],
      scopes: [],
      activityTypes: ['Client', 'FFNT'],
    };
  });

  // Filter options - dynamic based on current selections
  const [filterOptions, setFilterOptions] = useState({
    userTypes: [],
    users: [],
    domains: [],
    subdomains: [],
    scopes: [],
    activityTypes: [],
  });

  const isAdmin = session?.user?.role === 'SUPER_USER';
  const isLead = session?.user?.role === 'LEAD_CONSULTANT';
  const isConsultant = session?.user?.role === 'CONSULTANT';

  // Search states for filters
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [domainSearchQuery, setDomainSearchQuery] = useState('');
  const [subdomainSearchQuery, setSubdomainSearchQuery] = useState('');
  const [scopeSearchQuery, setScopeSearchQuery] = useState('');
  
  // Filter expand/collapse state
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  // Save filters to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('analytics_filters', JSON.stringify(filters));
      } catch (error) {
        console.error('Error saving filters:', error);
      }
    }
  }, [filters]);

  // Fetch analytics data - only when explicitly called
  const fetchAnalyticsData = useCallback(async (forceRefresh = false) => {
    // Only show loading for forced refreshes after initial load
    if (forceRefresh || !analyticsData) {
      setLoading(true);
    }

    try {
      
      const queryParams = new URLSearchParams();
      
      // Only add dates if they are valid
      if (filters.fromDate && !isNaN(filters.fromDate.getTime())) {
        queryParams.append('from', filters.fromDate.toISOString());
      }
      if (filters.toDate && !isNaN(filters.toDate.getTime())) {
        queryParams.append('to', filters.toDate.toISOString());
      }
      if (filters.userTypes.length > 0) {
        queryParams.append('userTypes', filters.userTypes.join(','));
      }
      if (filters.users.length > 0) {
        queryParams.append('users', filters.users.join(','));
      }
      if (filters.domains.length > 0) {
        queryParams.append('domains', filters.domains.join(','));
      }
      if (filters.subdomains.length > 0) {
        queryParams.append('subdomains', filters.subdomains.join(','));
      }
      if (filters.scopes.length > 0) {
        queryParams.append('scopes', filters.scopes.join(','));
      }
      if (filters.activityTypes.length > 0) {
        queryParams.append('activityTypes', filters.activityTypes.join(','));
      }

      const response = await fetch(`/api/analytics?${queryParams.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
        lastFetchTime.current = Date.now();
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, analyticsData]);

  // Fetch filter options with current filter selections for universal filtering
  const fetchFilterOptions = useCallback(async () => {
    try {
      const queryParams = new URLSearchParams();
      
      // Send current filter selections to API for universal filtering
      if (filters.users.length > 0) {
        queryParams.append('users', filters.users.join(','));
      }
      if (filters.userTypes.length > 0) {
        queryParams.append('userTypes', filters.userTypes.join(','));
      }
      if (filters.activityTypes.length > 0) {
        queryParams.append('activityTypes', filters.activityTypes.join(','));
      }
      if (filters.domains.length > 0) {
        queryParams.append('domains', filters.domains.join(','));
      }
      if (filters.subdomains.length > 0) {
        queryParams.append('subdomains', filters.subdomains.join(','));
      }
      if (filters.scopes.length > 0) {
        queryParams.append('scopes', filters.scopes.join(','));
      }

      const url = `/api/analytics/filters?${queryParams.toString()}`;
      const response = await fetch(url);
      if (response.ok) {
        const options = await response.json();
        setFilterOptions(options);
        
        // Don't save to localStorage anymore since options are dynamic
      }
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  }, [filters]);

  // Initialize data only once
  useEffect(() => {
    if (session?.user && !hasInitialized.current) {
      hasInitialized.current = true;
      fetchFilterOptions();
      fetchAnalyticsData();
    }
  }, [session, fetchFilterOptions, fetchAnalyticsData]);

  // Refresh filter options when any filter changes (universal filtering)
  useEffect(() => {
    if (session?.user && hasInitialized.current) {
      const timeoutId = setTimeout(() => {
        fetchFilterOptions(); // Refresh available filter options based on current selections
      }, 200); // Small debounce to avoid too many API calls
      
      return () => clearTimeout(timeoutId);
    }
  }, [filters, session?.user, fetchFilterOptions]);

  // Removed auto-refresh on filter changes - data only updates when user clicks refresh
  // useEffect(() => {
  //   if (session?.user && hasInitialized.current) {
  //     const timeoutId = setTimeout(() => {
  //       fetchAnalyticsData(true); // Force refresh when filters change
  //     }, 500); // 500ms debounce
  //     
  //     return () => clearTimeout(timeoutId);
  //   }
  // }, [filters, session?.user, fetchAnalyticsData]);

  // Removed page visibility auto-refresh - no more automatic updates
  // useEffect(() => {
  //   const handleVisibilityChange = () => {
  //     if (document.visibilityState === 'visible' && session?.user) {
  //       // Only refetch if data is stale when page becomes visible
  //       const now = Date.now();
  //       const timeSinceLastFetch = now - lastFetchTime.current;
  //       if (timeSinceLastFetch > CACHE_DURATION) {
  //         fetchAnalyticsData();
  //       }
  //     }
  //   };

  //   document.addEventListener('visibilitychange', handleVisibilityChange);
  //   return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  // }, [session?.user, fetchAnalyticsData]);

  // Chart configurations
  const getUtilizationColor = (utilization: number): string => {
    if (utilization > 100) return '#8B0000'; // Dark red
    if (utilization >= 70) return '#B7E1CD'; // Green
    if (utilization >= 50) return '#FCE8B2'; // Yellow
    return '#F4C7C3'; // Light red
  };

  const utilizationChartData: ChartData<'bar'> = {
    labels: analyticsData?.utilizationChart?.months || [],
    datasets: [
      {
        label: isAdmin ? 'Team Member Utilization' : 'My Utilization',
        data: analyticsData?.utilizationChart?.myUtilization || [],
        backgroundColor: analyticsData?.utilizationChart?.myUtilization?.map(getUtilizationColor) || ['#F4C7C3'],
        borderColor: analyticsData?.utilizationChart?.myUtilization?.map(getUtilizationColor) || ['#F4C7C3'],
        borderWidth: 1,
      },
    ],
  };

  const utilizationChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            const month = context.label;
            
            return `${month}: ${label} ${value}%`;
          }
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Utilization %'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Month-Year'
        }
      }
    },
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
  };

  const activityChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      {
        label: 'Client Hours',
        data: [],
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
      },
      {
        label: 'FFNT Hours',
        data: [],
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 1,
      },
    ],
  };

  if (!session?.user) {
    return null;
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <div className="flex items-center space-x-3">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
            <span className="text-lg font-medium text-gray-600">Loading Analytics...</span>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-2">Analytics Dashboard</h1>
              <p className="text-purple-100">
                Comprehensive performance metrics and insights
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => fetchAnalyticsData(true)}
                variant="outline"
                className="border-purple-300 text-purple-100 hover:bg-purple-800"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button
                variant="outline"
                className="border-purple-300 text-purple-100 hover:bg-purple-800"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader 
            className={`cursor-pointer transition-colors duration-200 ${
              filtersExpanded 
                ? 'bg-blue-800 hover:bg-blue-900' 
                : 'bg-gray-700 hover:bg-gray-800'
            }`} 
            onClick={() => setFiltersExpanded(!filtersExpanded)}
          >
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Filter className={`h-5 w-5 ${filtersExpanded ? 'text-blue-100' : 'text-gray-300'}`} />
                <span className={filtersExpanded ? 'text-white' : 'text-gray-100'}>Filters</span>
              </div>
              <ChevronDown className={`h-5 w-5 transition-all duration-200 ${
                filtersExpanded 
                  ? 'rotate-180 text-blue-100' 
                  : 'text-gray-300'
              }`} />
            </CardTitle>
          </CardHeader>
          {filtersExpanded && (
            <CardContent className="space-y-4">
            {/* Row 1: Basic Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* From Date - Fixed width */}
              <div className="space-y-2">
                <label className="text-sm font-medium">From</label>
                <input
                  type="date"
                  value={filters.fromDate && !isNaN(filters.fromDate.getTime()) ? filters.fromDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => {
                    if (e.target.value) {
                      const newDate = new Date(e.target.value);
                      setFilters(prev => ({ ...prev, fromDate: newDate }));
                    } else {
                      // Handle clear - set to January 1, 2025 as fallback
                      setFilters(prev => ({ ...prev, fromDate: new Date('2025-01-01') }));
                    }
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* To Date - Fixed width */}
              <div className="space-y-2">
                <label className="text-sm font-medium">To</label>
                <input
                  type="date"
                  value={filters.toDate && !isNaN(filters.toDate.getTime()) ? filters.toDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => {
                    if (e.target.value) {
                      const newDate = new Date(e.target.value);
                      setFilters(prev => ({ ...prev, toDate: newDate }));
                    } else {
                      // Handle clear - set to current week end as fallback
                      const currentWeek = getCurrentWeekSundayToSaturday();
                      setFilters(prev => ({ ...prev, toDate: currentWeek.to }));
                    }
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Activity Types - Fixed width */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Activity Types</label>
                <Select
                  value={filters.activityTypes.length === 2 ? 'Client,FFNT' : 
                         filters.activityTypes.length === 1 ? filters.activityTypes[0] : 'none'}
                  onValueChange={(value) => {
                    if (value === 'Client,FFNT') {
                      setFilters(prev => ({ ...prev, activityTypes: ['Client', 'FFNT'] }))
                    } else if (value === 'Client') {
                      setFilters(prev => ({ ...prev, activityTypes: ['Client'] }))
                    } else if (value === 'FFNT') {
                      setFilters(prev => ({ ...prev, activityTypes: ['FFNT'] }))
                    }
                  }}
                >
                  <SelectTrigger className="w-full min-w-[160px]">
                    <SelectValue placeholder="Activity types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Client,FFNT">Both (Client & FFNT)</SelectItem>
                    <SelectItem value="Client">Client Only</SelectItem>
                    <SelectItem value="FFNT">FFNT Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* User Types - SUPER_USER only - Fixed width */}
              {isAdmin && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">User Types</label>
                  <Select
                    value={filters.userTypes.length === 2 ? 'Consultant,Supporting' : 
                           filters.userTypes.length === 1 ? filters.userTypes[0] : 'none'}
                    onValueChange={(value) => {
                      if (value === 'Consultant,Supporting') {
                        setFilters(prev => ({ ...prev, userTypes: ['Consultant', 'Supporting'] }))
                      } else if (value === 'Consultant') {
                        setFilters(prev => ({ ...prev, userTypes: ['Consultant'] }))
                      } else if (value === 'Supporting') {
                        setFilters(prev => ({ ...prev, userTypes: ['Supporting'] }))
                      }
                    }}
                  >
                    <SelectTrigger className="w-full min-w-[160px]">
                      <SelectValue placeholder="User types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Consultant,Supporting">Both Types</SelectItem>
                      <SelectItem value="Consultant">Consultant Only</SelectItem>
                      <SelectItem value="Supporting">Supporting Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Users - SUPER_USER only - Custom Multi-Select */}
              {isAdmin && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Users</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full min-w-[160px] justify-between text-sm font-normal"
                      >
                        {filters.users.length === 0
                          ? "All users"
                          : filters.users.length === 1
                          ? filterOptions.users?.find((user: any) => user.value === filters.users[0])?.label || filters.users[0]
                          : `${filters.users.length} users selected`
                        }
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[250px] p-0" align="start">
                      <div className="max-h-[250px] flex flex-col">
                        {/* Search Input */}
                        <div className="p-3 border-b">
                          <input
                            type="text"
                            placeholder="Search users..."
                            value={userSearchQuery}
                            onChange={(e) => setUserSearchQuery(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        
                        <div className="overflow-auto flex-1">
                          {/* All Users Option */}
                          <div className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-100">
                            <Checkbox
                              id="all-users"
                              checked={filters.users.length === 0}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setFilters(prev => ({ ...prev, users: [] }));
                                  setUserSearchQuery(''); // Clear search when selecting all
                                }
                              }}
                            />
                            <label
                              htmlFor="all-users"
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                            >
                              All Users
                            </label>
                          </div>
                          
                          {/* Individual Users - Sorted by consultant ID and Filtered by search */}
                          {filterOptions.users?.sort((a: any, b: any) => {
                            // Sort by consultant ID numerically
                            const aConsultantId = parseInt(a.consultantId) || 0;
                            const bConsultantId = parseInt(b.consultantId) || 0;
                            return aConsultantId - bConsultantId;
                          }).filter((user: any) => {
                            // Filter by search query
                            if (!userSearchQuery) return true;
                            const searchLower = userSearchQuery.toLowerCase();
                            return (
                              user.label.toLowerCase().includes(searchLower) ||
                              user.value.toLowerCase().includes(searchLower) ||
                              (user.consultantId && user.consultantId.includes(searchLower))
                            );
                          }).map((user: any, index: number) => (
                          <div key={`user-${user.value}-${index}`} className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-100">
                            <Checkbox
                              id={`user-${user.value}`}
                              checked={filters.users.includes(user.value)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setFilters(prev => ({
                                    ...prev,
                                    users: [...prev.users, user.value]
                                  }));
                                } else {
                                  setFilters(prev => ({
                                    ...prev,
                                    users: prev.users.filter(u => u !== user.value)
                                  }));
                                }
                              }}
                            />
                            <label
                              htmlFor={`user-${user.value}`}
                              className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                            >
                              {user.label}
                            </label>
                          </div>
                        ))}
                        
                        {/* No Results Message */}
                        {userSearchQuery && filterOptions.users?.filter((user: any) => {
                          const searchLower = userSearchQuery.toLowerCase();
                          return (
                            user.label.toLowerCase().includes(searchLower) ||
                            user.value.toLowerCase().includes(searchLower) ||
                            (user.consultantId && user.consultantId.includes(searchLower))
                          );
                        }).length === 0 && (
                          <div className="px-3 py-2 text-sm text-gray-500 text-center">
                            No users found matching "{userSearchQuery}"
                          </div>
                        )}
                      </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>

            {/* Row 2: Domain Filters */}
            {(isAdmin || isLead) && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                {/* Domains - Multi-Select with Search */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Domains</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full min-w-[160px] justify-between text-sm font-normal"
                      >
                        {filters.domains.length === 0
                          ? "All domains"
                          : filters.domains.length === 1
                          ? filterOptions.domains?.find((domain: any) => domain.value === filters.domains[0])?.label || filters.domains[0]
                          : `${filters.domains.length} domains selected`
                        }
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[250px] p-0" align="start">
                      <div className="max-h-[250px] flex flex-col">
                        {/* Search Input */}
                        <div className="p-3 border-b">
                          <input
                            type="text"
                            placeholder="Search domains..."
                            value={domainSearchQuery}
                            onChange={(e) => setDomainSearchQuery(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        
                        <div className="overflow-auto flex-1">
                          {/* All Domains Option */}
                          <div className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-100">
                            <Checkbox
                              id="all-domains"
                              checked={filters.domains.length === 0}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setFilters(prev => ({ 
                                    ...prev, 
                                    domains: []
                                  }));
                                  setDomainSearchQuery(''); // Clear search when selecting all
                                }
                              }}
                            />
                            <label
                              htmlFor="all-domains"
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                            >
                              All Domains
                            </label>
                          </div>
                          
                          {/* Individual Domains - Filtered by search */}
                          {filterOptions.domains?.filter((domain: any) => {
                            // Filter by search query
                            if (!domainSearchQuery) return true;
                            const searchLower = domainSearchQuery.toLowerCase();
                            return (
                              domain.label.toLowerCase().includes(searchLower) ||
                              domain.value.toLowerCase().includes(searchLower)
                            );
                          }).map((domain: any, index: number) => (
                            <div key={`domain-${domain.value}-${index}`} className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-100">
                              <Checkbox
                                id={`domain-${domain.value}`}
                                checked={filters.domains.includes(domain.value)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setFilters(prev => ({
                                      ...prev,
                                      domains: [...prev.domains, domain.value]
                                    }));
                                  } else {
                                    setFilters(prev => ({
                                      ...prev,
                                      domains: prev.domains.filter(d => d !== domain.value)
                                    }));
                                  }
                                }}
                              />
                              <label
                                htmlFor={`domain-${domain.value}`}
                                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                              >
                                {domain.label}
                              </label>
                            </div>
                          ))}
                          
                          {/* No Results Message */}
                          {domainSearchQuery && filterOptions.domains?.filter((domain: any) => {
                            const searchLower = domainSearchQuery.toLowerCase();
                            return (
                              domain.label.toLowerCase().includes(searchLower) ||
                              domain.value.toLowerCase().includes(searchLower)
                            );
                          }).length === 0 && (
                            <div className="px-3 py-2 text-sm text-gray-500 text-center">
                              No domains found matching "{domainSearchQuery}"
                            </div>
                          )}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Subdomains - Multi-Select with Search */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Subdomains</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full min-w-[160px] justify-between text-sm font-normal"
                      >
                        {filters.subdomains.length === 0
                          ? "All subdomains"
                          : filters.subdomains.length === 1
                          ? filterOptions.subdomains?.find((subdomain: any) => subdomain.value === filters.subdomains[0])?.label || filters.subdomains[0]
                          : `${filters.subdomains.length} subdomains selected`
                        }
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0" align="start">
                      <div className="max-h-[250px] flex flex-col">
                        {/* Search Input */}
                        <div className="p-3 border-b">
                          <input
                            type="text"
                            placeholder="Search subdomains..."
                            value={subdomainSearchQuery}
                            onChange={(e) => setSubdomainSearchQuery(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        
                        <div className="overflow-auto flex-1">
                          {/* All Subdomains Option */}
                          <div className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-100">
                            <Checkbox
                              id="all-subdomains"
                              checked={filters.subdomains.length === 0}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setFilters(prev => ({ 
                                    ...prev, 
                                    subdomains: []
                                  }));
                                  setSubdomainSearchQuery(''); // Clear search when selecting all
                                }
                              }}
                            />
                            <label
                              htmlFor="all-subdomains"
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                            >
                              All Subdomains
                            </label>
                          </div>
                          
                          {/* Individual Subdomains - Filtered by search only (API handles universal filtering) */}
                          {filterOptions.subdomains?.filter((subdomain: any) => {
                            // Filter by search query only (API already filtered by all other selections)
                            if (!subdomainSearchQuery) return true;
                            const searchLower = subdomainSearchQuery.toLowerCase();
                            return (
                              subdomain.label.toLowerCase().includes(searchLower) ||
                              subdomain.value.toLowerCase().includes(searchLower)
                            );
                          }).map((subdomain: any, index: number) => (
                            <div key={`subdomain-${subdomain.value}-${index}`} className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-100">
                              <Checkbox
                                id={`subdomain-${subdomain.value}`}
                                checked={filters.subdomains.includes(subdomain.value)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setFilters(prev => ({
                                      ...prev,
                                      subdomains: [...prev.subdomains, subdomain.value]
                                    }));
                                  } else {
                                    setFilters(prev => ({
                                      ...prev,
                                      subdomains: prev.subdomains.filter(s => s !== subdomain.value)
                                    }));
                                  }
                                }}
                              />
                              <label
                                htmlFor={`subdomain-${subdomain.value}`}
                                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                              >
                                {subdomain.label}
                              </label>
                            </div>
                          ))}
                          
                          {/* No Results Message */}
                          {subdomainSearchQuery && filterOptions.subdomains?.filter((subdomain: any) => {
                            const searchLower = subdomainSearchQuery.toLowerCase();
                            return (
                              subdomain.label.toLowerCase().includes(searchLower) ||
                              subdomain.value.toLowerCase().includes(searchLower)
                            );
                          }).length === 0 && (
                            <div className="px-3 py-2 text-sm text-gray-500 text-center">
                              No subdomains found matching "{subdomainSearchQuery}"
                            </div>
                          )}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Scopes - Multi-Select with Search */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Scopes</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full min-w-[160px] justify-between text-sm font-normal"
                      >
                        {filters.scopes.length === 0
                          ? "All scopes"
                          : filters.scopes.length === 1
                          ? filterOptions.scopes?.find((scope: any) => scope.value === filters.scopes[0])?.label || filters.scopes[0]
                          : `${filters.scopes.length} scopes selected`
                        }
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[350px] p-0" align="start">
                      <div className="max-h-[250px] flex flex-col">
                        {/* Search Input */}
                        <div className="p-3 border-b">
                          <input
                            type="text"
                            placeholder="Search scopes..."
                            value={scopeSearchQuery}
                            onChange={(e) => setScopeSearchQuery(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        
                        <div className="overflow-auto flex-1">
                          {/* All Scopes Option */}
                          <div className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-100">
                            <Checkbox
                              id="all-scopes"
                              checked={filters.scopes.length === 0}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setFilters(prev => ({ 
                                    ...prev, 
                                    scopes: []
                                  }));
                                  setScopeSearchQuery(''); // Clear search when selecting all
                                }
                              }}
                            />
                            <label
                              htmlFor="all-scopes"
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                            >
                              All Scopes
                            </label>
                          </div>
                          
                          {/* Individual Scopes - Filtered by search only (API handles universal filtering) */}
                          {filterOptions.scopes?.filter((scope: any) => {
                            // Filter by search query only (API already filtered by all other selections)
                            if (!scopeSearchQuery) return true;
                            const searchLower = scopeSearchQuery.toLowerCase();
                            return (
                              scope.label.toLowerCase().includes(searchLower) ||
                              scope.value.toLowerCase().includes(searchLower)
                            );
                          }).map((scope: any, index: number) => (
                            <div key={`scope-${scope.value}-${index}`} className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-100">
                              <Checkbox
                                id={`scope-${scope.value}`}
                                checked={filters.scopes.includes(scope.value)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setFilters(prev => ({
                                      ...prev,
                                      scopes: [...prev.scopes, scope.value]
                                    }));
                                  } else {
                                    setFilters(prev => ({
                                      ...prev,
                                      scopes: prev.scopes.filter(s => s !== scope.value)
                                    }));
                                  }
                                }}
                              />
                              <label
                                htmlFor={`scope-${scope.value}`}
                                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                              >
                                {scope.label}
                              </label>
                            </div>
                          ))}
                          
                          {/* No Results Message */}
                          {scopeSearchQuery && filterOptions.scopes?.filter((scope: any) => {
                            const searchLower = scopeSearchQuery.toLowerCase();
                            return (
                              scope.label.toLowerCase().includes(searchLower) ||
                              scope.value.toLowerCase().includes(searchLower)
                            );
                          }).length === 0 && (
                            <div className="px-3 py-2 text-sm text-gray-500 text-center">
                              No scopes found matching "{scopeSearchQuery}"
                            </div>
                          )}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}

            {/* Applied Filters */}
            {(filters.activityTypes.length > 0 || filters.userTypes.length > 0 || filters.users.length > 0 || 
              filters.domains.length > 0 || filters.subdomains.length > 0 || filters.scopes.length > 0) && (
              <div className="flex flex-wrap gap-2 pt-4 border-t">
                <span className="text-sm font-medium text-gray-600">Applied filters:</span>
                
                {filters.activityTypes.length > 0 && filters.activityTypes.map((type, index) => (
                  <Badge key={`activity-${type}-${index}`} variant="secondary">
                    Activity: {type}
                  </Badge>
                ))}
                
                {filters.userTypes.length > 0 && filters.userTypes.map((type, index) => (
                  <Badge key={`usertype-${type}-${index}`} variant="outline">
                    User Type: {type}
                  </Badge>
                ))}
                
                {filters.users.length > 0 && filters.users.map((user, index) => (
                  <Badge key={`user-${user}-${index}`} variant="outline">
                    User: {user}
                  </Badge>
                ))}
                
                {filters.domains.length > 0 && filters.domains.map((domain, index) => (
                  <Badge key={`domain-${domain}-${index}`} variant="outline">
                    Domain: {domain}
                  </Badge>
                ))}
                
                {filters.subdomains.length > 0 && filters.subdomains.map((subdomain, index) => (
                  <Badge key={`subdomain-${subdomain}-${index}`} variant="outline">
                    Subdomain: {subdomain}
                  </Badge>
                ))}
                
                {filters.scopes.length > 0 && filters.scopes.map((scope, index) => (
                  <Badge key={`scope-${scope}-${index}`} variant="outline">
                    Scope: {scope}
                  </Badge>
                ))}
                
                
                {/* Apply Filters Button */}
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => fetchAnalyticsData(true)}
                  className="h-6 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Apply Filters
                </Button>

                {/* Clear All Filters Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFilters({
                      fromDate: new Date('2025-01-01'), // Reset to Jan 1, 2025
                      toDate: filters.toDate,
                      userTypes: [],
                      users: [],
                      domains: [],
                      subdomains: [],
                      scopes: [],
                      activityTypes: ['Client', 'FFNT'], // Reset to default both selected
                    });
                    // Auto-apply after clearing filters
                    setTimeout(() => fetchAnalyticsData(true), 100);
                  }}
                  className="h-6 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Clear & Apply
                </Button>
              </div>
            )}
          </CardContent>
          )}
        </Card>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Client Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span>Client Metrics</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Card 1: Total Clients */}
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {analyticsData?.performanceMetrics?.clientMetrics?.totalClients || '--'}
                  </div>
                  <div className="text-sm text-gray-600">Total Clients</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Project: {analyticsData?.performanceMetrics?.clientMetrics?.totalProjectClients || '--'} | 
                    Retainer: {analyticsData?.performanceMetrics?.clientMetrics?.totalRetainerClients || '--'}
                  </div>
                </div>
                
                {/* Card 2: Active Clients */}
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {analyticsData?.performanceMetrics?.clientMetrics?.totalActiveClients || '--'}
                  </div>
                  <div className="text-sm text-gray-600">Active Clients</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Project: {analyticsData?.performanceMetrics?.clientMetrics?.activeProjectClients || '--'} | 
                    Retainer: {analyticsData?.performanceMetrics?.clientMetrics?.activeRetainerClients || '--'}
                  </div>
                </div>
                
                {/* Card 3: Total Client Hours */}
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {analyticsData?.performanceMetrics?.clientMetrics?.totalClientHours || '--'}
                  </div>
                  <div className="text-sm text-gray-600">Total Client Hours</div>
                </div>
                
                {/* Card 4: Total Client Mandays */}
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {analyticsData?.performanceMetrics?.clientMetrics?.totalClientMandays || '--'}
                  </div>
                  <div className="text-sm text-gray-600">Total Client Mandays</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-purple-600" />
                <span>Team Metrics</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* First Row - 3 cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Card 1: My Utilization - Always visible */}
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {analyticsData?.performanceMetrics?.teamMetrics?.myUtilization || '--'}%
                  </div>
                  <div className="text-sm text-gray-600">My Utilization</div>
                </div>
                
                {/* Card 2: Team Utilization - Visible to all */}
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {analyticsData?.performanceMetrics?.teamMetrics?.teamUtilization || '--'}%
                  </div>
                  <div className="text-sm text-gray-600">Team Utilization</div>
                </div>
                
                {/* Card 3: Consulting Team Utilization - Visible to non-supporting users and super users */}
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {(isAdmin || session?.user?.role !== 'SUPPORTING') 
                      ? (analyticsData?.performanceMetrics?.teamMetrics?.consultingTeamUtilization || '--')
                      : '--'
                    }%
                  </div>
                  <div className="text-sm text-gray-600">Consulting Team</div>
                </div>
              </div>
              
              {/* Second Row - 3 cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Card 4: Supporting Team Utilization - Visible to supporting users and super users */}
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {(isAdmin || session?.user?.role === 'SUPPORTING') 
                      ? (analyticsData?.performanceMetrics?.teamMetrics?.supportingTeamUtilization || '--')
                      : '--'
                    }%
                  </div>
                  <div className="text-sm text-gray-600">Supporting Team</div>
                </div>
                
                {/* Card 5: FFNT Hours - Current user data, all for super user */}
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {analyticsData?.performanceMetrics?.teamMetrics?.ffntHours || '--'}
                  </div>
                  <div className="text-sm text-gray-600">FFNT Hours</div>
                </div>
                
                {/* Card 6: FFNT Mandays - Current user data, all for super user */}
                <div className="text-center p-4 bg-indigo-50 rounded-lg">
                  <div className="text-2xl font-bold text-indigo-600">
                    {analyticsData?.performanceMetrics?.teamMetrics?.ffntMandays || '--'}
                  </div>
                  <div className="text-sm text-gray-600">FFNT Mandays</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Visualization Components */}
        <div className="space-y-6">
          {/* Utilization Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <span>Consultant Utilization Chart</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <BarChart3 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p>Chart Placeholder</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-green-600" />
                <span>Monthly Activity Breakdown</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <Activity className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p>Chart Placeholder</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Client Distribution & Top Clients */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Client Type Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PieChart className="h-5 w-5 text-yellow-600" />
                  <span>Client Type Distribution</span>
                  <Badge variant="outline" className="ml-auto">
                    {analyticsData?.clientDistribution?.totalClients || '--'} clients
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <PieChart className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <p>Chart Placeholder</p>
                    </div>
                  </div>
                </div>
                
                {/* Summary Stats */}
                <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {analyticsData?.clientDistribution?.totalHours || '--'}
                    </div>
                    <div className="text-xs text-gray-500">Total Hours</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {analyticsData?.clientDistribution?.totalClients || '--'}
                    </div>
                    <div className="text-xs text-gray-500">Active Clients</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">
                      {analyticsData?.clientDistribution?.totalHours ? 
                        Math.round((analyticsData.clientDistribution.totalHours / 8) * 10) / 10 : '--'}
                    </div>
                    <div className="text-xs text-gray-500">Mandays</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Clients Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-indigo-600" />
                  <span>Top Clients by Hours</span>
                  <Badge variant="outline" className="ml-auto">
                    Top --
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {analyticsData?.topClients?.chartData?.labels?.length ? (
                    <Bar
                      data={{
                        labels: analyticsData.topClients.chartData.labels,
                        datasets: [{
                          label: 'Hours Worked',
                          data: analyticsData.topClients.chartData.data,
                          backgroundColor: analyticsData.topClients.chartData.backgroundColor,
                          borderColor: analyticsData.topClients.chartData.backgroundColor.map(color => color.replace('0.8', '1')),
                          borderWidth: 1,
                        }]
                      } as ChartData<'bar'>}
                      options={{
                        indexAxis: 'y' as const,
                        responsive: true,
                        plugins: {
                          legend: {
                            display: false,
                          },
                          tooltip: {
                            callbacks: {
                              label: function(context: any) {
                                try {
                                  const clientData = analyticsData?.topClients?.clients?.[context.dataIndex];
                                  if (!clientData) return context.label || 'Unknown';
                                  return [
                                    `Hours: ${clientData.hours}`,
                                    `Mandays: ${clientData.mandays}`,
                                    `Type: ${clientData.type}`,
                                  ];
                                } catch (error) {
                                  console.error('Top clients tooltip error:', error);
                                  return context.label || 'Unknown';
                                }
                              }
                            }
                          }
                        },
                        scales: {
                          x: {
                            beginAtZero: true,
                            title: {
                              display: true,
                              text: 'Hours'
                            }
                          },
                          y: {
                            title: {
                              display: true,
                              text: 'Clients'
                            }
                          }
                        },
                      } as ChartOptions<'bar'>}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      No client data available for selected period
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Trends Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-red-600" />
                <span>Performance Trend Analysis</span>
                <div className="ml-auto flex space-x-2">
                  <Badge variant={analyticsData?.performanceTrends.trendAnalysis.utilizationTrend === 'up' ? 'default' : 
                                 analyticsData?.performanceTrends.trendAnalysis.utilizationTrend === 'down' ? 'destructive' : 'secondary'}>
                    Utilization {analyticsData?.performanceTrends.trendAnalysis.utilizationTrend || 'stable'}
                  </Badge>
                  <Badge variant={analyticsData?.performanceTrends.trendAnalysis.efficiencyTrend === 'up' ? 'default' : 
                                 analyticsData?.performanceTrends.trendAnalysis.efficiencyTrend === 'down' ? 'destructive' : 'secondary'}>
                    Efficiency {analyticsData?.performanceTrends.trendAnalysis.efficiencyTrend || 'stable'}
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                {analyticsData?.performanceTrends?.months?.length ? (
                  <Line
                    data={{
                      labels: analyticsData.performanceTrends.months,
                      datasets: [
                        {
                          label: 'Utilization %',
                          data: analyticsData.performanceTrends.trends.utilization,
                          borderColor: '#3B82F6',
                          backgroundColor: 'rgba(59, 130, 246, 0.1)',
                          tension: 0.4,
                          yAxisID: 'y',
                        },
                        {
                          label: 'Efficiency Score',
                          data: analyticsData.performanceTrends.trends.efficiency,
                          borderColor: '#10B981',
                          backgroundColor: 'rgba(16, 185, 129, 0.1)',
                          tension: 0.4,
                          yAxisID: 'y1',
                        },
                        {
                          label: 'Client Diversity',
                          data: analyticsData.performanceTrends.trends.clientDiversity,
                          borderColor: '#F59E0B',
                          backgroundColor: 'rgba(245, 158, 11, 0.1)',
                          tension: 0.4,
                          yAxisID: 'y2',
                        }
                      ]
                    } as ChartData<'line'>}
                    options={{
                      responsive: true,
                      interaction: {
                        mode: 'index' as const,
                        intersect: false,
                      },
                      plugins: {
                        legend: {
                          position: 'top' as const,
                        },
                        tooltip: {
                          callbacks: {
                            label: function(context: any) {
                              try {
                                const label = context.dataset.label;
                                const value = context.parsed?.y?.toFixed(1) || '0';
                                if (label === 'Client Diversity') {
                                  return `${label}: ${value} clients`;
                                }
                                return `${label}: ${value}${label?.includes('%') ? '' : label === 'Efficiency Score' ? ' hrs/entry' : '%'}`;
                              } catch (error) {
                                console.error('Performance trends tooltip error:', error);
                                return context.dataset?.label || 'Unknown';
                              }
                            }
                          }
                        }
                      },
                      scales: {
                        x: {
                          display: true,
                          title: {
                            display: true,
                            text: 'Month-Year'
                          }
                        },
                        y: {
                          type: 'linear' as const,
                          display: true,
                          position: 'left' as const,
                          title: {
                            display: true,
                            text: 'Utilization %'
                          },
                        },
                        y1: {
                          type: 'linear' as const,
                          display: true,
                          position: 'right' as const,
                          title: {
                            display: true,
                            text: 'Efficiency Score'
                          },
                          grid: {
                            drawOnChartArea: false,
                          },
                        },
                        y2: {
                          type: 'linear' as const,
                          display: false,
                          position: 'right' as const,
                        }
                      },
                    } as ChartOptions<'line'>}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    Insufficient data for trend analysis
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Team Performance Comparison - Only for admins and leads */}
          {(isAdmin || isLead) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-purple-600" />
                  <span>Team Performance Comparison</span>
                  <Badge variant="outline" className="ml-auto">
                    {analyticsData?.teamPerformance.consultants.length || 0} consultants
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Radar Chart */}
                  <div className="h-80">
                    {analyticsData?.teamPerformance?.consultants?.length ? (
                      <Radar
                        data={{
                          labels: analyticsData.teamPerformance.radarLabels,
                          datasets: analyticsData.teamPerformance.consultants.slice(0, 3).map((consultant, index) => ({
                            label: consultant.consultant,
                            data: [
                              consultant.metrics.utilization,
                              consultant.metrics.clientDiversity,
                              consultant.metrics.efficiency,
                              consultant.metrics.clientFocus,
                              consultant.metrics.ffntContribution,
                            ],
                            borderColor: [`#3B82F6`, `#10B981`, `#F59E0B`][index],
                            backgroundColor: [`rgba(59, 130, 246, 0.2)`, `rgba(16, 185, 129, 0.2)`, `rgba(245, 158, 11, 0.2)`][index],
                            borderWidth: 2,
                          }))
                        } as ChartData<'radar'>}
                        options={{
                          responsive: true,
                          plugins: {
                            legend: {
                              position: 'bottom' as const,
                            },
                          },
                          scales: {
                            r: {
                              beginAtZero: true,
                              max: 100,
                              title: {
                                display: true,
                                text: 'Performance Score'
                              }
                            }
                          }
                        } as ChartOptions<'radar'>}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        No team data available
                      </div>
                    )}
                  </div>

                  {/* Performance Summary Table */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900">Team Performance Summary</h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {analyticsData?.teamPerformance?.consultants?.map((consultant, index) => (
                        <div key={`consultant-${consultant.consultant}-${index}`} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-medium text-sm">{consultant.consultant}</span>
                            <Badge variant="outline" className="text-xs">
                              #{index + 1}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                            <div>Total: {consultant.rawData?.totalHours || 0}h</div>
                            <div>Clients: {consultant.rawData?.uniqueClients || 0}</div>
                            <div>Client: {consultant.rawData?.clientHours || 0}h</div>
                            <div>FFNT: {consultant.rawData?.ffntHours || 0}h</div>
                          </div>
                        </div>
                      )) || []}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
}