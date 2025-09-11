// src/app/admin/deals/page.tsx - ENHANCED WITH EDIT & HOLIDAY MANAGEMENT
'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { DealCreationForm } from '@/components/admin/DealCreationForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Filter, X, Calendar, Users, Calculator, Edit2, Trash2, Upload, Download, AlertCircle } from 'lucide-react';
// Import the enhanced holiday management component
import { HolidayManagement } from '@/components/admin/HolidayManagement';


interface Deal {
  id: number;
  year: number;
  month: number;
  consultantId: number;
  consultant: string;
  dealDays: number;
  role: 'CONSULTANT' | 'SUPPORTING';
}

interface Consultant {
  id: number;
  username: string;
  firstName?: string;
  lastName?: string;
  role: string;
  displayName: string;
}

interface PublicHoliday {
  id: number;
  name: string;
  date: string;
  year: number;
  month: number;
  day: number;
  isRecurring: boolean;
  country: string;
}

interface Filters {
  year: string;
  month: string;
  consultant: string;
  userType: string;
}

export default function DealsManagementPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [holidays, setHolidays] = useState<PublicHoliday[]>([]);
  const [filters, setFilters] = useState<Filters>({
    year: new Date().getFullYear().toString(),
    month: 'all',
    consultant: 'all',
    userType: 'all'
  });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [holidayForm, setHolidayForm] = useState({
    name: '',
    date: '',
    isRecurring: false
  });

  // Current year and month options
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  const months = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  useEffect(() => {
    fetchDeals();
    fetchConsultants();
    fetchHolidays();
  }, [filters]);

  const fetchDeals = async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          params.append(key, value);
        }
      });
      
      const response = await fetch(`/api/admin/deals?${params}`);
      if (response.ok) {
        const data = await response.json();
        setDeals(data);
      }
    } catch (error) {
      console.error('Error fetching deals:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchConsultants = async () => {
    try {
      const response = await fetch('/api/admin/consultants');
      if (response.ok) {
        const data = await response.json();
        setConsultants(data);
      }
    } catch (error) {
      console.error('Error fetching consultants:', error);
    }
  };

  const fetchHolidays = async () => {
    try {
      const response = await fetch('/api/admin/holidays');
      if (response.ok) {
        const data = await response.json();
        setHolidays(data);
      }
    } catch (error) {
      console.error('Error fetching holidays:', error);
    }
  };

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      year: new Date().getFullYear().toString(),
      month: 'all',
      consultant: 'all',
      userType: 'all'
    });
  };

  const handleEditDeal = (deal: Deal) => {
    setEditingDeal(deal);
    setIsEditModalOpen(true);
  };

  const handleUpdateDeal = async (dealId: number, dealDays: number) => {
    try {
      const response = await fetch(`/api/admin/deals/${dealId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealDays })
      });

      if (response.ok) {
        fetchDeals();
        setIsEditModalOpen(false);
        setEditingDeal(null);
      }
    } catch (error) {
      console.error('Error updating deal:', error);
    }
  };

  const handleDeleteDeal = async (dealId: number) => {
    if (!confirm('Are you sure you want to delete this deal?')) return;

    try {
      const response = await fetch(`/api/admin/deals/${dealId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchDeals();
      }
    } catch (error) {
      console.error('Error deleting deal:', error);
    }
  };

  const handleAddHoliday = async () => {
    try {
      const response = await fetch('/api/admin/holidays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(holidayForm)
      });

      if (response.ok) {
        fetchHolidays();
        setHolidayForm({ name: '', date: '', isRecurring: false });
        setIsHolidayModalOpen(false);
      }
    } catch (error) {
      console.error('Error adding holiday:', error);
    }
  };

  const getConsultantDisplayName = (consultant: Consultant) => {
    return consultant.firstName && consultant.lastName 
      ? `${consultant.firstName} ${consultant.lastName}`
      : consultant.username;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Consultant Deal Management</h1>
            <p className="text-gray-600">Manage monthly deal days for consultants and public holidays</p>
          </div>
          
          <div className="flex space-x-3">
            <Dialog open={isHolidayModalOpen} onOpenChange={setIsHolidayModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  Manage Holidays
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Public Holiday Management</DialogTitle>
                </DialogHeader>
                <HolidayManagement 
                  holidays={holidays}
                  onHolidayAdded={fetchHolidays}
                  onClose={() => setIsHolidayModalOpen(false)}
                />
              </DialogContent>
            </Dialog>

            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Deal
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Deal</DialogTitle>
                </DialogHeader>
                <DealCreationForm 
                  consultants={consultants}
                  onSuccess={() => {
                    setIsCreateModalOpen(false);
                    fetchDeals();
                  }}
                  onCancel={() => setIsCreateModalOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filters Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <Label htmlFor="year">Year</Label>
                <Select value={filters.year} onValueChange={(value) => handleFilterChange('year', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map(year => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="month">Month</Label>
                <Select value={filters.month} onValueChange={(value) => handleFilterChange('month', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All months" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All months</SelectItem>
                    {months.map(month => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="consultant">Consultant</Label>
                <Select value={filters.consultant} onValueChange={(value) => handleFilterChange('consultant', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All consultants" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All consultants</SelectItem>
                    {consultants.map(consultant => (
                      <SelectItem key={consultant.id} value={consultant.username}>
                        {getConsultantDisplayName(consultant)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="userType">User Type</Label>
                <Select value={filters.userType} onValueChange={(value) => handleFilterChange('userType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    <SelectItem value="CONSULTANT">Full Time</SelectItem>
                    <SelectItem value="SUPPORTING">Part Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button variant="outline" onClick={clearFilters} className="w-full">
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Deals Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Consultant Deals ({deals.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3">Loading deals...</span>
              </div>
            ) : deals.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-8 w-8 mx-auto mb-3 text-gray-400" />
                <p>No deals found for the selected filters.</p>
                <p className="text-sm">Try adjusting your filters or create a new deal.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Year</TableHead>
                      <TableHead>Month</TableHead>
                      <TableHead>Consultant</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Deal Days</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deals.map((deal) => (
                      <TableRow key={deal.id}>
                        <TableCell className="font-medium">{deal.year}</TableCell>
                        <TableCell>{months.find(m => m.value === deal.month.toString())?.label}</TableCell>
                        <TableCell>{deal.consultant}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            deal.role === 'CONSULTANT' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {deal.role === 'CONSULTANT' ? 'Full Time' : 'Part Time'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Calculator className="h-4 w-4 mr-1 text-gray-400" />
                            {deal.dealDays} days
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditDeal(deal)}
                            >
                              <Edit2 className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDeleteDeal(deal.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Deal Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Deal</DialogTitle>
            </DialogHeader>
            {editingDeal && (
              <EditDealForm 
                deal={editingDeal}
                onUpdate={handleUpdateDeal}
                onCancel={() => setIsEditModalOpen(false)}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

// Edit Deal Form Component
interface EditDealFormProps {
  deal: Deal;
  onUpdate: (dealId: number, dealDays: number) => void;
  onCancel: () => void;
}

function EditDealForm({ deal, onUpdate, onCancel }: EditDealFormProps) {
  const [dealDays, setDealDays] = useState(deal.dealDays.toString());

  const handleSubmit = () => {
    const days = parseInt(dealDays);
    if (days > 0 && days <= 31) {
      onUpdate(deal.id, days);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Consultant</Label>
        <div className="p-2 bg-gray-50 rounded">{deal.consultant}</div>
      </div>
      
      <div className="space-y-2">
        <Label>Period</Label>
        <div className="p-2 bg-gray-50 rounded">
          {new Date(deal.year, deal.month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="dealDays">Deal Days</Label>
        <Input
          id="dealDays"
          type="number"
          min="1"
          max="31"
          value={dealDays}
          onChange={(e) => setDealDays(e.target.value)}
        />
      </div>

      <div className="flex justify-end space-x-3">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSubmit}>Update Deal</Button>
      </div>
    </div>
  );
}

