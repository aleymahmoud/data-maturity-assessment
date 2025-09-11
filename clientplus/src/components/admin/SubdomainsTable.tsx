// src/components/admin/SubdomainsTable.tsx
'use client';
import React from 'react';
import { 
  Building2, 
  Users, 
  Activity, 
  Edit, 
  Trash2, 
  MoreVertical,
  Calendar,
  Crown,
  CheckSquare,
  Square
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';

interface Subdomain {
  id: number;
  subdomainName: string;
  leadConsultant: string | null;
  createdAt: string;
  updatedAt: string;
  domain: {
    id: number;
    domainName: string;
  };
  stats: {
    entryCount: number;
    activeConsultants: number;
    scopesCount: number;
  };
}

interface Consultant {
  username: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
}

interface SubdomainsTableProps {
  subdomains: Subdomain[];
  consultants: Consultant[];
  onEdit: (subdomain: Subdomain) => void;
  onRefresh: () => void;
  selectedSubdomains: number[];
  onSelectionChange: (ids: number[]) => void;
}

export function SubdomainsTable({ 
  subdomains, 
  consultants, 
  onEdit, 
  onRefresh, 
  selectedSubdomains,
  onSelectionChange 
}: SubdomainsTableProps) {
  const handleDelete = async (subdomain: Subdomain) => {
    if (!confirm(`Are you sure you want to delete "${subdomain.subdomainName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/subdomains/${subdomain.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Subdomain deleted successfully');
        onRefresh();
      } else {
        toast.error(data.error || 'Failed to delete subdomain');
      }
    } catch (error) {
      toast.error('Failed to delete subdomain');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getConsultantDisplay = (username: string | null) => {
    if (!username) return 'Unassigned';
    
    const consultant = consultants.find(c => c.username === username);
    if (!consultant) return username;
    
    const displayName = consultant.firstName && consultant.lastName 
      ? `${consultant.firstName} ${consultant.lastName}`
      : username;
    
    return displayName;
  };

  const getConsultantRole = (username: string | null) => {
    if (!username) return null;
    const consultant = consultants.find(c => c.username === username);
    return consultant?.role;
  };

  const getActivityLevel = (entryCount: number) => {
    if (entryCount === 0) return { label: 'No Activity', color: 'bg-gray-100 text-gray-800' };
    if (entryCount < 25) return { label: 'Low', color: 'bg-yellow-100 text-yellow-800' };
    if (entryCount < 100) return { label: 'Medium', color: 'bg-blue-100 text-blue-800' };
    return { label: 'High', color: 'bg-green-100 text-green-800' };
  };

  const handleSelectAll = () => {
    if (selectedSubdomains.length === subdomains.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(subdomains.map(s => s.id));
    }
  };

  const handleSelectSubdomain = (subdomainId: number) => {
    if (selectedSubdomains.includes(subdomainId)) {
      onSelectionChange(selectedSubdomains.filter(id => id !== subdomainId));
    } else {
      onSelectionChange([...selectedSubdomains, subdomainId]);
    }
  };

  // Group subdomains by domain
  const groupedSubdomains = subdomains.reduce((groups, subdomain) => {
    const domainName = subdomain.domain.domainName;
    if (!groups[domainName]) {
      groups[domainName] = [];
    }
    groups[domainName].push(subdomain);
    return groups;
  }, {} as Record<string, Subdomain[]>);

  if (subdomains.length === 0) {
    return (
      <div className="bg-white rounded-lg border">
        <div className="p-8 text-center">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No subdomains found</h3>
          <p className="text-gray-500">
            Create subdomains to organize your domain services and assign consultants.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  checked={selectedSubdomains.length === subdomains.length && subdomains.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </TableHead>
              <TableHead>Domain & Subdomain</TableHead>
              <TableHead>Lead Consultant</TableHead>
              <TableHead>Activity Stats</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-12">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
{Object.entries(groupedSubdomains).map(([domainName, domainSubdomains]) => (
  <React.Fragment key={domainName}>

                {/* Domain Header Row */}
                <TableRow key={`domain-${domainName}`} className="bg-gray-50">
                  <TableCell></TableCell>
                  <TableCell colSpan={5}>
                    <div className="flex items-center gap-2 py-2">
                      <Building2 className="h-4 w-4 text-gray-600" />
                      <span className="font-medium text-gray-900">{domainName}</span>
                      <Badge variant="secondary" className="ml-2">
                        {domainSubdomains.length} subdomain{domainSubdomains.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </TableCell>
                </TableRow>
                
                {/* Subdomain Rows */}
                {domainSubdomains.map((subdomain) => {
                  const activityLevel = getActivityLevel(subdomain.stats.entryCount);
                  const consultantRole = getConsultantRole(subdomain.leadConsultant);
                  
                  return (
                    <TableRow key={subdomain.id} className="hover:bg-gray-50">
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedSubdomains.includes(subdomain.id)}
                          onChange={() => handleSelectSubdomain(subdomain.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </TableCell>
                      
                      <TableCell>
                        <div className="pl-6">
                          <div className="font-medium text-gray-900">
                            {subdomain.subdomainName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {subdomain.stats.scopesCount} scope{subdomain.stats.scopesCount !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {subdomain.leadConsultant ? (
                            <>
                              <div>
                                <div className="font-medium text-gray-900 flex items-center gap-1">
                                  {getConsultantDisplay(subdomain.leadConsultant)}
                                  {consultantRole === 'SUPER_USER' && (
                                    <Crown className="h-3 w-3 text-yellow-500" />
                                  )}
                                </div>
                                <div className="text-sm text-gray-500">
                                  @{subdomain.leadConsultant}
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="text-gray-500 italic">Unassigned</div>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge className={activityLevel.color}>
                              {activityLevel.label}
                            </Badge>
                            <span className="text-sm text-gray-600">
                              {subdomain.stats.entryCount} entries
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {subdomain.stats.activeConsultants} consultant{subdomain.stats.activeConsultants !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-sm text-gray-600">
                          {formatDate(subdomain.createdAt)}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(subdomain)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(subdomain)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}