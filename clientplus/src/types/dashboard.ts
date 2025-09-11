// src/types/dashboard.ts
export interface TeamMembersBreakdown {
  subdomain: string;
  consultants: string[];
  count: number;
}

export interface DashboardStats {
  todayHours: number;
  monthHours: number;
  utilization: number;
  activeClients: number;
  teamMembers?: number;
  teamMembersBreakdown?: TeamMembersBreakdown[];
}

export interface RecentActivity {
  id: string | number;
  type: 'entry_added' | 'entry_updated' | 'entry_deleted';
  description: string;
  timestamp: string;
  user: string;
}

export interface StatCard {
  title: string;
  value: string;
  unit: string;
  icon: any; // Lucide icon component
  color: string;
  hasTooltip?: boolean;
}

export interface QuickAction {
  title: string;
  description: string;
  href: string;
  icon: any; // Lucide icon component
  color: string;
  primary?: boolean;
}