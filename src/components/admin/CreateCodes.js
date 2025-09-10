export default function CreateCodes({ codeForm, setCodeForm, onCreateCodes, isCreatingCodes, createSuccess }) {
  return (
    <div className="p-4">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Create Assessment Codes</h1>
        <p className="mt-1 text-sm text-gray-600">
          Generate new assessment codes for organizations and users
        </p>
      </div>

      {createSuccess && (
        <div className="mb-6 rounded-md bg-green-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                Success!
              </h3>
              <div className="mt-2 text-sm text-green-700">
                <p>{createSuccess}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={onCreateCodes} className="space-y-8">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">Code Configuration</h3>
            
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label htmlFor="organization-name" className="block text-sm font-medium text-gray-700">
                  Organization Name *
                </label>
                <input
                  type="text"
                  id="organization-name"
                  required
                  value={codeForm.organizationName}
                  onChange={(e) => setCodeForm({...codeForm, organizationName: e.target.value})}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Enter organization name"
                />
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="intended-recipient" className="block text-sm font-medium text-gray-700">
                  Intended Recipient
                </label>
                <input
                  type="text"
                  id="intended-recipient"
                  value={codeForm.intendedRecipient}
                  onChange={(e) => setCodeForm({...codeForm, intendedRecipient: e.target.value})}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Enter recipient name (optional)"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="assessment-type" className="block text-sm font-medium text-gray-700">
                  Assessment Type
                </label>
                <select
                  id="assessment-type"
                  value={codeForm.assessmentType}
                  onChange={(e) => setCodeForm({...codeForm, assessmentType: e.target.value})}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="full">Full Assessment (35 questions)</option>
                  <option value="quick">Quick Assessment (11 questions)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="max-uses" className="block text-sm font-medium text-gray-700">
                  Max Uses
                </label>
                <input
                  type="number"
                  id="max-uses"
                  min="1"
                  value={codeForm.maxUses}
                  onChange={(e) => setCodeForm({...codeForm, maxUses: parseInt(e.target.value)})}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="bulk-count" className="block text-sm font-medium text-gray-700">
                  Number of Codes
                </label>
                <input
                  type="number"
                  id="bulk-count"
                  min="1"
                  max="50"
                  value={codeForm.bulkCount}
                  onChange={(e) => setCodeForm({...codeForm, bulkCount: parseInt(e.target.value)})}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="expires-at" className="block text-sm font-medium text-gray-700">
                  Expiration Date (Optional)
                </label>
                <input
                  type="datetime-local"
                  id="expires-at"
                  value={codeForm.expiresAt}
                  onChange={(e) => setCodeForm({...codeForm, expiresAt: e.target.value})}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                <p className="mt-2 text-sm text-gray-500">
                  Leave empty for codes that never expire
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Summary</h3>
            <div className="mt-3 max-w-xl text-sm text-gray-500">
              <p>
                You are about to create <span className="font-medium text-gray-900">{codeForm.bulkCount}</span> {codeForm.assessmentType} assessment code{codeForm.bulkCount > 1 ? 's' : ''} 
                for <span className="font-medium text-gray-900">{codeForm.organizationName || '[Organization]'}</span>.
              </p>
              {codeForm.expiresAt && (
                <p className="mt-2">
                  Codes will expire on <span className="font-medium text-gray-900">{new Date(codeForm.expiresAt).toLocaleDateString()}</span>.
                </p>
              )}
              <p className="mt-2">
                Each code can be used up to <span className="font-medium text-gray-900">{codeForm.maxUses}</span> time{codeForm.maxUses > 1 ? 's' : ''}.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isCreatingCodes || !codeForm.organizationName}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreatingCodes ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating {codeForm.bulkCount} Code{codeForm.bulkCount > 1 ? 's' : ''}...
              </>
            ) : (
              `Create ${codeForm.bulkCount} Code${codeForm.bulkCount > 1 ? 's' : ''}`
            )}
          </button>
        </div>
      </form>
    </div>
  );
}