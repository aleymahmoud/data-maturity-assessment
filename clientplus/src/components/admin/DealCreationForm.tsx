// src/components/admin/DealCreationForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Calculator, Clock, AlertCircle, Check } from 'lucide-react';
import { calculateDealDays, formatDealCalculationSummary } from '@/utils/dealCalculations';

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
  date: Date;
  year: number;
  month: number;
  day: number;
}

interface DealCreationFormProps {
  consultants: Consultant[];
  onSuccess: () => void;
  onCancel?: () => void;
}

export function DealCreationForm({ consultants, onSuccess, onCancel }: DealCreationFormProps) {
  const [formData, setFormData] = useState({
    consultant: '',
    consultantType: '',
    startDate: '',
    endDate: '',
    partTimeDays: '10'
  });
  
  const [calculation, setCalculation] = useState<any>(null);
  const [holidays, setHolidays] = useState<PublicHoliday[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchHolidays();
  }, []);

  useEffect(() => {
    if (formData.consultant && formData.startDate && formData.endDate) {
      calculateDealDaysPreview();
    } else {
      setCalculation(null);
    }
  }, [formData, holidays]);

  const fetchHolidays = async () => {
    try {
      const response = await fetch('/api/admin/holidays');
      if (response.ok) {
        const data = await response.json();
        setHolidays(data.map((h: any) => ({
          ...h,
          date: new Date(h.date)
        })));
      }
    } catch (error) {
      console.error('Error fetching holidays:', error);
    }
  };

  const calculateDealDaysPreview = () => {
    if (!formData.startDate || !formData.endDate) return;

    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    
    if (startDate > endDate) {
      setCalculation(null);
      return;
    }

    const isPartTime = formData.consultantType === 'SUPPORTING';
    const partTimeDays = parseInt(formData.partTimeDays) || 10;

    const result = calculateDealDays({
      startDate,
      endDate,
      isPartTime,
      defaultPartTimeDays: partTimeDays,
      publicHolidays: holidays
    });

    setCalculation(result);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleConsultantChange = (consultantUsername: string) => {
    const consultant = consultants.find(c => c.username === consultantUsername);
    if (consultant) {
      const consultantType = consultant.role === 'SUPPORTING' ? 'SUPPORTING' : 'CONSULTANT';
      setFormData(prev => ({
        ...prev,
        consultant: consultantUsername,
        consultantType
      }));
    }
  };

  const handleSubmit = async () => {
    if (!formData.consultant || !formData.startDate || !formData.endDate || !calculation) {
      setError('Please fill in all required fields and ensure dates are valid');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const consultant = consultants.find(c => c.username === formData.consultant);
      if (!consultant) {
        setError('Selected consultant not found');
        return;
      }

      // Create deals for each month in the calculation
      const promises = calculation.monthlyBreakdown.map((month: any) => 
        fetch('/api/admin/deals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            year: month.year,
            month: month.month,
            consultantId: consultant.id,
            consultant: consultant.username,
            dealDays: month.dealDays,
            role: formData.consultantType
          })
        })
      );

      const responses = await Promise.all(promises);
      const failedResponses = responses.filter(r => !r.ok);

      if (failedResponses.length > 0) {
        const errorData = await failedResponses[0].json();
        setError(errorData.error || 'Failed to create some deals');
        return;
      }

      setSuccess('Deals created successfully!');
      setTimeout(() => {
        onSuccess();
      }, 1500);

    } catch (error) {
      console.error('Error creating deals:', error);
      setError('Failed to create deals. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedConsultant = consultants.find(c => c.username === formData.consultant);

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <Check className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Consultant Selection */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="consultant">Select Consultant *</Label>
          <Select value={formData.consultant} onValueChange={handleConsultantChange}>
            <SelectTrigger>
              <SelectValue placeholder="Choose consultant" />
            </SelectTrigger>
            <SelectContent>
              {consultants.map(consultant => (
                <SelectItem key={consultant.username} value={consultant.username}>
                  <div className="flex items-center space-x-2">
                    <span>{consultant.displayName}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      consultant.role === 'SUPPORTING' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {consultant.role === 'SUPPORTING' ? 'Part Time' : 'Full Time'}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedConsultant && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Selected: {selectedConsultant.displayName}</span>
              <span className={`text-xs px-2 py-1 rounded ${
                formData.consultantType === 'SUPPORTING' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-green-100 text-green-700'
              }`}>
                {formData.consultantType === 'SUPPORTING' ? 'Part Time' : 'Full Time'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Period Selection */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="startDate">Start Date *</Label>
          <Input
            id="startDate"
            type="date"
            value={formData.startDate}
            onChange={(e) => handleInputChange('startDate', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="endDate">End Date *</Label>
          <Input
            id="endDate"
            type="date"
            value={formData.endDate}
            onChange={(e) => handleInputChange('endDate', e.target.value)}
            min={formData.startDate}
          />
        </div>
      </div>

      {/* Part-time Days (only for part-time consultants) */}
      {formData.consultantType === 'SUPPORTING' && (
        <div>
          <Label htmlFor="partTimeDays">Part-time Days per Month</Label>
          <Input
            id="partTimeDays"
            type="number"
            min="1"
            max="31"
            value={formData.partTimeDays}
            onChange={(e) => handleInputChange('partTimeDays', e.target.value)}
            placeholder="10"
          />
          <p className="text-sm text-gray-500 mt-1">
            Default is 10 days per month for part-time consultants
          </p>
        </div>
      )}

      {/* Deal Calculation Preview */}
      {calculation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calculator className="h-5 w-5 mr-2" />
              Deal Days Calculation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {calculation.totalDealDays}
                  </div>
                  <div className="text-sm text-blue-700">Total Deal Days</div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {calculation.monthlyBreakdown.length}
                  </div>
                  <div className="text-sm text-green-700">Months</div>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {calculation.totalHolidays}
                  </div>
                  <div className="text-sm text-orange-700">Holidays Excluded</div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Monthly Breakdown:</h4>
                <div className="space-y-2">
                  {calculation.monthlyBreakdown.map((month: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="font-medium">
                        {month.monthName} {month.year}
                      </span>
                      <div className="flex items-center space-x-4 text-sm">
                        {month.holidays > 0 && (
                          <span className="text-orange-600">
                            {month.holidays} holiday{month.holidays > 1 ? 's' : ''}
                          </span>
                        )}
                        <span className="font-medium text-blue-600">
                          {month.dealDays} days
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {formData.consultantType !== 'SUPPORTING' && calculation.totalHolidays > 0 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start">
                    <Calendar className="h-4 w-4 text-yellow-600 mt-0.5 mr-2" />
                    <div className="text-sm text-yellow-800">
                      <strong>Public holidays excluded:</strong>
                      <ul className="mt-1 list-disc list-inside">
                        {calculation.monthlyBreakdown
                          .filter((m: any) => m.holidayDetails.length > 0)
                          .map((month: any, index: number) => (
                            <li key={index}>
                              {month.monthName}: {month.holidayDetails.map((h: any) => h.name).join(', ')}
                            </li>
                          ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button 
          onClick={handleSubmit} 
          disabled={!calculation || loading}
          className="min-w-[100px]"
        >
          {loading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Creating...
            </div>
          ) : (
            <>
              <Clock className="h-4 w-4 mr-2" />
              Create Deals
            </>
          )}
        </Button>
      </div>
    </div>
  );
}