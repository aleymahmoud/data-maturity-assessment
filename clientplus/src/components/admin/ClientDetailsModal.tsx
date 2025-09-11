// src/components/admin/ClientDetailsModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { X, Building2, Users, Clock, Activity, Calendar, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Client {
  id: number;
  clientName: string;
  type: string;
  status: string;
  activity: string;
}

interface ProjectEntry {
  id: number;
  year: number;
  monthNo: number;
  day: number;
  consultant: string;
  activityType: string;
  workingHours: number;
  notes: string;
  domain: string;
  subdomain: string;
  scope: string;
  createdAt: string;
}

interface ClientDetailsModalProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ClientDetailsModal({ client, isOpen, onClose }: ClientDetailsModalProps) {
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState<{
    projectHistory: ProjectEntry[];
    subdomain: any;
    stats: {
      totalProjects: number;
      totalHours: number;
      uniqueConsultants: number;
    };
  } | null>(null);

  useEffect(() => {
    if (client && isOpen) {
      fetchClientDetails();
    }
  }, [client, isOpen]);

  const fetchClientDetails = async () => {
    if (!client) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/clients/${client.id}`);
      const data = await response.json();
      
      if (response.ok) {
        setDetails(data);
      }
    } catch (error) {
      console.error('Error fetching client details:', error);
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            Client Details: {client?.clientName}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading client details...</span>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col space-y-4">
            {/* Client Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Type</p>
                <Badge className={client ? getTypeColor(client.type) : ''}>
                  {client ? getTypeLabel(client.type) : ''}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <Badge className={client?.status === 'A' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                  {client?.status === 'A' ? 'Active' : 'Ended'}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Hours</p>
                <p className="font-medium">{details?.stats.totalHours.toFixed(1)}h</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Consultants</p>
                <p className="font-medium">{details?.stats.uniqueConsultants}</p>
              </div>
            </div>

            {/* Subdomain Info */}
            {details?.subdomain && (
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium mb-2">Subdomain Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Subdomain:</span>
                    <span className="ml-2 font-mono">{details.subdomain.subdomainName}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Lead Consultant:</span>
                    <span className="ml-2 font-medium">{details.subdomain.leadConsultant}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Project History */}
            <div className="flex-1 overflow-hidden flex flex-col">
              <h3 className="font-medium mb-2">Recent Project History</h3>
              <div className="flex-1 overflow-auto border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Consultant</TableHead>
                      <TableHead>Activity</TableHead>
                      <TableHead>Hours</TableHead>
                      <TableHead>Domain/Subdomain</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {details?.projectHistory.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="text-sm">
                          {entry.monthNo}/{entry.day}/{entry.year}
                        </TableCell>
                        <TableCell className="font-medium">
                          {entry.consultant}
                        </TableCell>
                        <TableCell>{entry.activityType}</TableCell>
                        <TableCell>{entry.workingHours}h</TableCell>
                        <TableCell className="text-sm">
                          <div>
                            <span className="font-medium">{entry.domain}</span>
                            {entry.subdomain && (
                              <span className="text-gray-600"> / {entry.subdomain}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600 max-w-xs truncate">
                          {entry.notes}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}