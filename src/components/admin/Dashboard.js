export default function Dashboard({ stats, codes }) {
  const statCards = [
    { name: 'Total', value: stats.totalCodes, color: 'bg-blue-500' },
    { name: 'Active', value: stats.activeCodes, color: 'bg-green-500' },
    { name: 'Used', value: stats.usedCodes, color: 'bg-orange-500' },
    { name: 'Expired', value: stats.expiredCodes, color: 'bg-red-500' },
  ];

  return (
    <div className="p-4">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Overview of assessment codes and system activity
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {statCards.map((item) => (
          <div key={item.name} className="bg-white overflow-hidden shadow-sm rounded-lg border">
            <div className="p-4">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${item.color}`}>
                  <div className="w-4 h-4 text-white flex items-center justify-center text-xs font-bold">
                    {item.value}
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">{item.name}</p>
                  <p className="text-lg font-semibold text-gray-900">{item.value}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white shadow-sm rounded-lg border">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Codes</h3>
        </div>
        <ul className="divide-y divide-gray-200">
          {codes.slice(0, 8).map((code) => (
            <li key={code.id}>
              <div className="px-4 py-3 flex items-center justify-between text-sm">
                <div className="flex items-center min-w-0 flex-1">
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                    code.assessment_type === 'quick' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {code.assessment_type}
                  </span>
                  <div className="ml-3 min-w-0 flex-1">
                    <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                      {code.code}
                    </span>
                    <p className="text-xs text-gray-500 mt-1 truncate">{code.organization_name}</p>
                  </div>
                </div>
                <div className="flex items-center ml-4">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
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
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}