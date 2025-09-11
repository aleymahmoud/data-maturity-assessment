// src/components/admin/ClientsTable.tsx
'use client';

import { 
  Users, 
  Building2, 
  Calendar, 
  Clock,
  Edit, 
  Trash2, 
  Eye,
  MoreVertical,
  Activity
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

interface ClientStats {
  projectCount: number;
  totalHours: number;
  lastActivityDate: string | null;
  hasSubdomain: boolean;
  leadConsultant: string | null;
}

interface Client {
  id: number;
  clientName: string;
  type: 'PRJ' | 'RET' | 'FFNT';
  status: 'A' | 'E';
  activity: string;
  createdAt: string;
  updatedAt: string;
  stats: ClientStats;
}

interface ClientsTableProps {
  clients: Client[];
  loading: boolean;
  onView: (client: Client) => void;
  onEdit: (client: Client) => void;
  onDeactivate: (client: Client) => void;
}

export function ClientsTable({ clients, loading, onView, onEdit, onDeactivate }: ClientsTableProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'PRJ': return 'Project';
      case 'RET': return 'Retainer';
      case 'FFNT': return 'Internal';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'PRJ': return 'bg-blue-100 text-blue-800';
      case 'RET': return 'bg-green-100 text-green-800';
      case 'FFNT': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'A' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border">
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading clients...</p>
        </div>
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <div className="bg-white rounded-lg border">
        <div className="p-8 text-center">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No clients found</h3>
          <p className="text-gray-500">
            Get started by adding your first client to begin tracking consulting work.
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
            <TableHead>Client Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Entries</TableHead>
            <TableHead>Total Hours</TableHead>
            <TableHead>Last Activity</TableHead>
            <TableHead>Subdomain</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => (
            <TableRow key={client.id}>
              <TableCell className="font-medium">
                <div className="flex items-center space-x-2">
                  <Building2 className="h-4 w-4 text-gray-400" />
                  <span>{client.clientName}</span>
                </div>
              </TableCell>
              
              <TableCell>
                <Badge className={getTypeColor(client.type)}>
                  {getTypeLabel(client.type)}
                </Badge>
              </TableCell>
              
              <TableCell>
                <Badge className={getStatusColor(client.status)}>
                  {client.status === 'A' ? 'Active' : 'Ended'}
                </Badge>
              </TableCell>
              
              <TableCell>
                <div className="flex items-center space-x-1">
                  <Activity className="h-4 w-4 text-gray-400" />
                  <span>{client.stats.projectCount}</span>
                </div>
              </TableCell>
              
              <TableCell>
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span>{Number(client.stats.totalHours || 0).toFixed(1)}h</span>
                  </div>
              </TableCell>
              
              <TableCell>
                {client.stats.lastActivityDate ? (
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">
                      {formatDate(client.stats.lastActivityDate)}
                    </span>
                  </div>
                ) : (
                  <span className="text-gray-400 text-sm">No activity</span>
                )}
              </TableCell>
              
              <TableCell>
                {client.stats.hasSubdomain ? (
                  <Badge className="bg-green-100 text-green-800">
                    ✓ {client.stats.leadConsultant}
                  </Badge>
                ) : (
                  <Badge className="bg-yellow-100 text-yellow-800">
                    ⚠ Missing
                  </Badge>
                )}
              </TableCell>
              
              <TableCell className="text-sm text-gray-600">
                {formatDate(client.createdAt)}
              </TableCell>
              
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onView(client)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(client)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Client
                    </DropdownMenuItem>
                    {client.status === 'A' && (
                      <DropdownMenuItem 
                        onClick={() => onDeactivate(client)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Deactivate
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}