import { useState } from 'react';

export default function CodesManagement({ codes, filters, setFilters, onDeleteCode }) {
  const [selectedCodes, setSelectedCodes] = useState(new Set());

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedCodes(new Set(codes.map(code => code.id)));
    } else {
      setSelectedCodes(new Set());
    }
  };

  const handleSelectCode = (codeId) => {
    const newSelected = new Set(selectedCodes);
    if (newSelected.has(codeId)) {
      newSelected.delete(codeId);
    } else {
      newSelected.add(codeId);
    }
    setSelectedCodes(newSelected);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="p-4">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Assessment Codes</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage and monitor all assessment codes in your system
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Filter Codes</h3>
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-2">
              <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700">
                Assessment Type
              </label>
              <select
                id="type-filter"
                value={filters.type}
                onChange={(e) => setFilters({...filters, type: e.target.value})}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="">All Types</option>
                <option value="quick">Quick Assessment</option>
                <option value="full">Full Assessment</option>
              </select>
            </div>
            
            <div className="sm:col-span-2">
              <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                id="status-filter"
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="used">Used</option>
                <option value="expired">Expired</option>
              </select>
            </div>
            
            <div className="sm:col-span-2 flex items-end">
              <button
                type="button"
                onClick={() => setFilters({ type: '', status: '' })}
                className="w-full bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Codes Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Codes ({codes.length})
            </h3>
            {selectedCodes.size > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Delete ${selectedCodes.size} selected codes?`)) {
                    selectedCodes.forEach(codeId => onDeleteCode(codeId));
                    setSelectedCodes(new Set());
                  }
                }}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Delete Selected ({selectedCodes.size})
              </button>
            )}
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="relative px-6 py-3">
                  <input
                    type="checkbox"
                    className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    checked={selectedCodes.size === codes.length && codes.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Organization
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recipient
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usage
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {codes.map((code) => (
                <tr key={code.id} className="hover:bg-gray-50">
                  <td className="relative px-6 py-4">
                    <input
                      type="checkbox"
                      className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      checked={selectedCodes.has(code.id)}
                      onChange={() => handleSelectCode(code.id)}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-mono font-medium bg-gray-100 text-gray-800">
                        {code.code}
                      </span>
                      <button
                        onClick={() => copyToClipboard(code.code)}
                        className="ml-2 text-gray-400 hover:text-gray-600 focus:outline-none"
                        title="Copy code"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {code.organization_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {code.intended_recipient || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      code.assessment_type === 'quick' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {code.assessment_type === 'quick' ? 'Quick' : 'Full'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      code.is_used 
                        ? 'bg-gray-100 text-gray-800' 
                        : code.expires_at && new Date(code.expires_at) < new Date()
                        ? 'bg-red-100 text-red-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {code.is_used 
                        ? 'Used' 
                        : code.expires_at && new Date(code.expires_at) < new Date()
                        ? 'Expired'
                        : 'Active'
                      }
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-sm">
                          <div>{code.usage_count}/{code.max_uses}</div>
                        </div>
                        <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-indigo-600 h-2 rounded-full" 
                            style={{ width: `${Math.min((code.usage_count / code.max_uses) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(code.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => onDeleteCode(code.id)}
                      className="text-red-600 hover:text-red-900 focus:outline-none"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}