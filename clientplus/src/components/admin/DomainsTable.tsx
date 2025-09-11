// src/components/admin/DomainsTable.tsx
'use client';

import { 
  Building2, 
  Users, 
  Layers, 
  FileText, 
  Activity, 
  Edit, 
  Trash2, 
  MoreVertical,
  Calendar
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

interface Domain {
  id: number;
  domainName: string;
  createdAt: string;
  updatedAt: string;
  stats: {
    userCount: number;
    subdomainCount: number;
    templateCount: number;
    entryCount: number;
    activeConsultants: number;
  };
}

interface DomainsTableProps {
  domains: Domain[];
  onRefresh: () => void;
  onEdit: (domain: Domain) => void;
  onDelete: (domain: Domain) => void;
}

export function DomainsTable({ domains, onRefresh, onEdit, onDelete }: DomainsTableProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getActivityLevel = (entryCount: number) => {
    if (entryCount === 0) return { label: 'No Activity', color: 'bg-gray-100 text-gray-800' };
    if (entryCount < 50) return { label: 'Low', color: 'bg-yellow-100 text-yellow-800' };
    if (entryCount < 200) return { label: 'Medium', color: 'bg-blue-100 text-blue-800' };
    return { label: 'High', color: 'bg-green-100 text-green-800' };
  };

  if (domains.length === 0) {
    return (
      <div className="bg-white rounded-lg border">
        <div className="p-8 text-center">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No domains found</h3>
          <p className="text-gray-500">
            Get started by creating your first domain to organize your services.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Domain Name</TableHead>
            <TableHead>Subdomains</TableHead>
            <TableHead>Users</TableHead>
            <TableHead>Activity</TableHead>
            <TableHead>Templates</TableHead>
            <TableHead>Consultants</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {domains.map((domain) => {
            const activityLevel = getActivityLevel(domain.stats.entryCount);
            
            return (
              <TableRow key={domain.id} className="hover:bg-gray-50">
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Building2 className="h-4 w-4 text-blue-600" />
                    <div>
                      <div className="font-medium text-gray-900">
                        {domain.domainName}
                      </div>
                      <div className="text-xs text-gray-500">
                        ID: {domain.id}
                      </div>
                    </div>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <Layers className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">
                      {domain.stats.subdomainCount}
                    </span>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">
                      {domain.stats.userCount}
                    </span>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="space-y-1">
                    <Badge variant="secondary" className={activityLevel.color}>
                      {activityLevel.label}
                    </Badge>
                    <div className="text-xs text-gray-500">
                      {domain.stats.entryCount.toLocaleString()} entries
                    </div>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">
                      {domain.stats.templateCount}
                    </span>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <Activity className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-green-600">
                      {domain.stats.activeConsultants}
                    </span>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center space-x-1 text-sm text-gray-500">
                    <Calendar className="h-3 w-3" />
                    {formatDate(domain.createdAt)}
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
                      <DropdownMenuItem onClick={() => onEdit(domain)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Domain
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onDelete(domain)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Domain
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}