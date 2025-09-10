export default function Sidebar({ activeSection, setActiveSection, onLogout }) {
  const navigation = [
    {
      name: 'Dashboard',
      id: 'dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
        </svg>
      ),
    },
    {
      name: 'Codes',
      id: 'codes',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16" />
        </svg>
      ),
    },
    {
      name: 'Create',
      id: 'create',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex flex-col w-56 bg-gray-800 min-h-screen">
      <div className="flex flex-col h-0 flex-1">
        <div className="flex items-center h-14 flex-shrink-0 px-3 bg-gray-900">
          <div className="flex items-center">
            <div className="h-7 w-7 rounded bg-indigo-600 flex items-center justify-center">
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <div className="ml-2">
              <p className="text-sm font-medium text-white">Admin</p>
            </div>
          </div>
        </div>
        
        <div className="flex-1 flex flex-col pt-3 pb-4 overflow-y-auto">
          <nav className="mt-3 flex-1 px-2 space-y-1">
            {navigation.map((item) => (
              <button
                key={item.name}
                onClick={() => setActiveSection(item.id)}
                className={`${
                  activeSection === item.id
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                } group flex items-center px-3 py-2 text-sm font-medium rounded-md w-full text-left transition-colors`}
              >
                {item.icon}
                <span className="ml-2">{item.name}</span>
              </button>
            ))}
          </nav>
        </div>
        
        <div className="flex-shrink-0 border-t border-gray-700 p-2">
          <button
            onClick={onLogout}
            className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-300 rounded-md hover:bg-gray-700 hover:text-white group transition-colors"
          >
            <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7" />
            </svg>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}