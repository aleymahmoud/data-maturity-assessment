'use client';

import { useState } from 'react';
import { QuestionsManagement } from '../questions/QuestionsManagement';
import { AnswerOptionsConfig } from '../questions/AnswerOptionsConfig';
import { SubdomainMapping } from '../questions/SubdomainMapping';
import { ImportExport } from '../import-export/ImportExport';

export function QuestionsOptionsTab() {
  const [activeSubTab, setActiveSubTab] = useState('questions');

  const subTabs = [
    { id: 'questions', name: 'Questions Management' },
    { id: 'options', name: 'Answer Options' },
    { id: 'mapping', name: 'Subdomain Mapping' },
    { id: 'import-export', name: 'Import/Export' }
  ];

  return (
    <div>
      {/* Sub-tabs */}
      <div style={{
        display: 'flex',
        gap: '4px',
        borderBottom: '1px solid #e5e7eb',
        marginBottom: '24px'
      }}>
        {subTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            style={{
              padding: '12px 20px',
              border: 'none',
              backgroundColor: 'transparent',
              color: activeSubTab === tab.id ? '#0066cc' : '#6b7280',
              borderBottom: activeSubTab === tab.id ? '2px solid #0066cc' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: activeSubTab === tab.id ? '600' : '500',
              transition: 'all 0.2s'
            }}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeSubTab === 'questions' && <QuestionsManagement />}
      {activeSubTab === 'options' && <AnswerOptionsConfig />}
      {activeSubTab === 'mapping' && <SubdomainMapping />}
      {activeSubTab === 'import-export' && <ImportExport />}
    </div>
  );
}
