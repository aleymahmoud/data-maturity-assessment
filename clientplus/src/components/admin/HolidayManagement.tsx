// src/components/admin/HolidayManagement.tsx
'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Download, FileText, AlertCircle, CheckCircle, Calendar } from 'lucide-react';

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

interface HolidayManagementProps {
  holidays: PublicHoliday[];
  onHolidayAdded: () => void;
  onClose: () => void;
}

export function HolidayManagement({ holidays, onHolidayAdded, onClose }: HolidayManagementProps) {
  const [form, setForm] = useState({ name: '', date: '', isRecurring: false });
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ success: boolean; message: string; details?: any } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    try {
      const response = await fetch('/api/admin/holidays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      if (response.ok) {
        setForm({ name: '', date: '', isRecurring: false });
        onHolidayAdded();
      }
    } catch (error) {
      console.error('Error adding holiday:', error);
    }
  };

  const downloadSampleFile = () => {
    const sampleData = [
      {
        name: "New Year's Day",
        date: "2025-01-01",
        isRecurring: true,
        country: "EG"
      },
      {
        name: "Revolution Day",
        date: "2025-01-25",
        isRecurring: true,
        country: "EG"
      },
      {
        name: "Sinai Liberation Day",
        date: "2025-04-25",
        isRecurring: true,
        country: "EG"
      },
      {
        name: "Labor Day",
        date: "2025-05-01",
        isRecurring: true,
        country: "EG"
      },
      {
        name: "Eid al-Fitr (Example)",
        date: "2025-04-10",
        isRecurring: false,
        country: "EG"
      }
    ];

    const csvContent = [
      'name,date,isRecurring,country',
      ...sampleData.map(item => 
        `"${item.name}","${item.date}","${item.isRecurring}","${item.country}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_holidays.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const exportHolidays = () => {
    if (holidays.length === 0) {
      alert('No holidays to export');
      return;
    }

    const csvContent = [
      'name,date,isRecurring,country',
      ...holidays.map(holiday => 
        `"${holiday.name}","${holiday.date}","${holiday.isRecurring}","${holiday.country}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `holidays_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setUploadResult({
        success: false,
        message: 'Please upload a CSV file'
      });
      return;
    }

    setUploading(true);
    setUploadResult(null);

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error('File must contain at least a header and one data row');
      }

      // Parse CSV (simple parsing - assumes CSV is well-formed)
      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
      
      // Validate headers
      const requiredHeaders = ['name', 'date'];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      if (missingHeaders.length > 0) {
        throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
      }

      const holidaysToUpload = [];
      const errors = [];

      for (let i = 1; i < lines.length; i++) {
        try {
          const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
          const row: any = {};
          
          headers.forEach((header, index) => {
            row[header] = values[index];
          });

          // Validate required fields
          if (!row.name || !row.date) {
            errors.push(`Row ${i + 1}: Missing name or date`);
            continue;
          }

          // Validate date format
          const date = new Date(row.date);
          if (isNaN(date.getTime())) {
            errors.push(`Row ${i + 1}: Invalid date format (${row.date})`);
            continue;
          }

          holidaysToUpload.push({
            name: row.name,
            date: row.date,
            isRecurring: row.isRecurring === 'true' || row.isRecurring === 'TRUE',
            country: row.country || 'EG'
          });
        } catch (error) {
          errors.push(`Row ${i + 1}: ${error}`);
        }
      }

      if (holidaysToUpload.length === 0) {
        throw new Error('No valid holidays found in file');
      }

      // Upload to server
      const response = await fetch('/api/admin/holidays/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ holidays: holidaysToUpload })
      });

      const result = await response.json();

      if (response.ok) {
        setUploadResult({
          success: true,
          message: `Successfully imported ${result.created} holidays`,
          details: {
            created: result.created,
            errors: [...errors, ...result.errors]
          }
        });
        onHolidayAdded();
      } else {
        throw new Error(result.error || 'Upload failed');
      }

    } catch (error) {
      setUploadResult({
        success: false,
        message: `Upload failed: ${error}`
      });
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <Tabs defaultValue="add" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="add">Add Holiday</TabsTrigger>
        <TabsTrigger value="import">Import/Export</TabsTrigger>
        <TabsTrigger value="list">View Holidays ({holidays.length})</TabsTrigger>
      </TabsList>
      
      <TabsContent value="add" className="space-y-4">
        <div className="space-y-4">
          <div>
            <Label htmlFor="holidayName">Holiday Name</Label>
            <Input
              id="holidayName"
              value={form.name}
              onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. New Year's Day"
            />
          </div>

          <div>
            <Label htmlFor="holidayDate">Date</Label>
            <Input
              id="holidayDate"
              type="date"
              value={form.date}
              onChange={(e) => setForm(prev => ({ ...prev, date: e.target.value }))}
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isRecurring"
              checked={form.isRecurring}
              onChange={(e) => setForm(prev => ({ ...prev, isRecurring: e.target.checked }))}
            />
            <Label htmlFor="isRecurring">Recurring yearly</Label>
          </div>

          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose}>Close</Button>
            <Button onClick={handleSubmit} disabled={!form.name || !form.date}>
              Add Holiday
            </Button>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="import" className="space-y-4">
        <div className="space-y-6">
          {/* Download Sample */}
          <div className="border rounded-lg p-4">
            <h3 className="font-medium flex items-center mb-2">
              <Download className="h-4 w-4 mr-2" />
              Download Sample File
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Download a sample CSV file with the correct format for importing holidays.
            </p>
            <Button variant="outline" onClick={downloadSampleFile}>
              <FileText className="h-4 w-4 mr-2" />
              Download Sample CSV
            </Button>
          </div>

          {/* Upload File */}
          <div className="border rounded-lg p-4">
            <h3 className="font-medium flex items-center mb-2">
              <Upload className="h-4 w-4 mr-2" />
              Import Holidays from CSV
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Upload a CSV file with columns: name, date, isRecurring (optional), country (optional)
            </p>
            
            <div className="space-y-3">
              <Input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                disabled={uploading}
              />
              
              {uploading && (
                <div className="flex items-center text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  Processing file...
                </div>
              )}

              {uploadResult && (
                <Alert variant={uploadResult.success ? "default" : "destructive"}>
                  {uploadResult.success ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertDescription>
                    {uploadResult.message}
                    {uploadResult.details && uploadResult.details.errors.length > 0 && (
                      <details className="mt-2">
                        <summary className="cursor-pointer font-medium">
                          View errors ({uploadResult.details.errors.length})
                        </summary>
                        <ul className="list-disc list-inside mt-1 text-sm">
                          {uploadResult.details.errors.slice(0, 5).map((error: string, index: number) => (
                            <li key={index}>{error}</li>
                          ))}
                          {uploadResult.details.errors.length > 5 && (
                            <li>... and {uploadResult.details.errors.length - 5} more</li>
                          )}
                        </ul>
                      </details>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>

          {/* Export Current Holidays */}
          <div className="border rounded-lg p-4">
            <h3 className="font-medium flex items-center mb-2">
              <Download className="h-4 w-4 mr-2" />
              Export Current Holidays
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Download all current holidays as a CSV file for backup or editing.
            </p>
            <Button 
              variant="outline" 
              onClick={exportHolidays}
              disabled={holidays.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Holidays CSV
            </Button>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="list" className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-medium">Current Holidays ({holidays.length})</h3>
          {holidays.length > 0 && (
            <Button variant="outline" size="sm" onClick={exportHolidays}>
              <Download className="h-3 w-3 mr-1" />
              Export
            </Button>
          )}
        </div>
        
        {/* Debug info - remove this after testing */}
        <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
          Debug: Received {holidays.length} holidays
          {holidays.length > 0 && (
            <div className="mt-1">
              First holiday: {JSON.stringify(holidays[0], null, 2)}
            </div>
          )}
        </div>
        
        <div className="max-h-64 overflow-y-auto">
          {holidays.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p>No holidays added yet.</p>
              <p className="text-sm">Add holidays manually or import from CSV file.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {holidays
                .sort((a, b) => {
                  // Handle both string and Date objects
                  const dateA = new Date(a.date);
                  const dateB = new Date(b.date);
                  return dateA.getTime() - dateB.getTime();
                })
                .map(holiday => {
                  // Handle date formatting more safely
                  let formattedDate = 'Invalid Date';
                  try {
                    const holidayDate = new Date(holiday.date);
                    if (!isNaN(holidayDate.getTime())) {
                      formattedDate = holidayDate.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      });
                    }
                  } catch (error) {
                    console.error('Date formatting error:', error);
                  }

                  return (
                    <div key={holiday.id} className="flex justify-between items-center p-3 border rounded-lg bg-white">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">{holiday.name || 'Unnamed Holiday'}</span>
                          <span className="text-sm text-gray-500">
                            {formattedDate}
                          </span>
                        </div>
                        <div className="flex space-x-2 mt-2">
                          {holiday.isRecurring && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                              Recurring
                            </span>
                          )}
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                            {holiday.country || 'EG'}
                          </span>
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                            ID: {holiday.id}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}