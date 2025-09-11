'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Users,
  Briefcase,
  Edit,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface LeadConsultant {
  id: string;
  username: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  profileImage: string | null;
  isActive: boolean;
  assignedSubdomains: {
    id: number;
    subdomainName: string;
    domain: {
      domainName: string;
    };
  }[];
  workload: number;
}

interface LeadConsultantsTableProps {
  consultants: LeadConsultant[];
  onRefresh: () => void;
  onManageAssignments: (consultant: LeadConsultant) => void;
}

export function LeadConsultantsTable({
  consultants,
  onRefresh,
  onManageAssignments,
}: LeadConsultantsTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRowExpansion = (username: string) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(username)) {
      newExpandedRows.delete(username);
    } else {
      newExpandedRows.add(username);
    }
    setExpandedRows(newExpandedRows);
  };

  const getWorkloadBadge = (workload: number) => {
    if (workload === 0) {
      return <Badge variant="secondary">Not Assigned</Badge>;
    }
    if (workload <= 2) {
      return <Badge className="bg-green-100 text-green-800">Low</Badge>;
    }
    if (workload <= 5) {
      return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
    }
    return <Badge className="bg-red-100 text-red-800">High</Badge>;
  };

  return (
    <div className="bg-white rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead>Consultant</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Workload</TableHead>
            <TableHead className="w-24">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {consultants.map((consultant) => (
            <>
              <TableRow key={consultant.id}>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleRowExpansion(consultant.username)}
                  >
                    {expandedRows.has(consultant.username) ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </TableCell>
                <TableCell>
                  <div className="font-medium">
                    {consultant.firstName} {consultant.lastName}
                  </div>
                  <div className="text-sm text-gray-500">
                    {consultant.email}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={consultant.isActive ? 'default' : 'destructive'}
                  >
                    {consultant.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getWorkloadBadge(consultant.workload)}
                    <span>{consultant.workload} subdomains</span>
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
                      <DropdownMenuItem
                        onClick={() => onManageAssignments(consultant)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Manage Assignments
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
              {expandedRows.has(consultant.username) && (
                <TableRow>
                  <TableCell colSpan={5} className="p-0">
                    <div className="p-4 bg-gray-50">
                      <h4 className="font-semibold mb-2">
                        Assigned Subdomains
                      </h4>
                      {consultant.assignedSubdomains.length > 0 ? (
                        <ul className="space-y-1">
                          {consultant.assignedSubdomains.map((sub) => (
                            <li
                              key={sub.id}
                              className="flex items-center justify-between p-2 rounded-md bg-white border"
                            >
                              <div>
                                <span className="font-medium">
                                  {sub.subdomainName}
                                </span>
                                <span className="text-sm text-gray-500 ml-2">
                                  ({sub.domain.domainName})
                                </span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500">
                          No subdomains assigned.
                        </p>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </>
          ))}
        </TableBody>
      </Table>
      {consultants.length === 0 && (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No Lead Consultants Found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Assign the &quot;LEAD_CONSULTANT&quot; role to users to see them here.
          </p>
        </div>
      )}
    </div>
  );
}
