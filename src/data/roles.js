// Role Configuration and Dimension Mapping
export const roleCategories = {
  EXECUTIVE: 'executive',
  IT_TECHNOLOGY: 'it_technology',
  BI_ANALYTICS: 'bi_analytics',
  BUSINESS_MANAGERS: 'business_managers',
  DATA_GOVERNANCE: 'data_governance'
};

export const roles = {
  [roleCategories.EXECUTIVE]: {
    id: roleCategories.EXECUTIVE,
    title: 'Executive/C-Suite Level',
    description: 'You make strategic decisions and set organizational direction',
    examples: ['CEO', 'COO', 'CTO', 'CDO', 'VP Strategy'],
    estimatedTime: '15-20 minutes',
    dimensionCount: 5,
    subdomains: [
      'strategy',
      'leadership', 
      'culture',
      'responsible',
      'security'
    ],
    icon: '🏢'
  },
  
  [roleCategories.IT_TECHNOLOGY]: {
    id: roleCategories.IT_TECHNOLOGY,
    title: 'IT/Technology Department',
    description: 'You manage technical systems and data infrastructure',
    examples: ['IT Director', 'Data Engineer', 'System Administrator', 'Infrastructure Manager'],
    estimatedTime: '10-15 minutes',
    dimensionCount: 3,
    subdomains: [
      'infrastructure',
      'quality',
      'security'
    ],
    icon: '💻'
  },
  
  [roleCategories.BI_ANALYTICS]: {
    id: roleCategories.BI_ANALYTICS,
    title: 'Business Intelligence/Analytics Team',
    description: 'You work with data analysis, reporting, and insights generation',
    examples: ['Data Analyst', 'BI Developer', 'Data Scientist', 'Analytics Manager'],
    estimatedTime: '10-15 minutes',
    dimensionCount: 3,
    subdomains: [
      'analysis',
      'application',
      'quality'
    ],
    icon: '📊'
  },
  
  [roleCategories.BUSINESS_MANAGERS]: {
    id: roleCategories.BUSINESS_MANAGERS,
    title: 'Department/Business Unit Managers',
    description: 'You lead teams and make operational decisions using data',
    examples: ['Department Head', 'Operations Manager', 'Product Manager', 'Business Manager'],
    estimatedTime: '10-15 minutes',
    dimensionCount: 3,
    subdomains: [
      'application',
      'strategy',
      'culture'
    ],
    icon: '👥'
  },
  
  [roleCategories.DATA_GOVERNANCE]: {
    id: roleCategories.DATA_GOVERNANCE,
    title: 'Data Governance/Compliance Team',
    description: 'You ensure data policies, compliance, and risk management',
    examples: ['Data Governance Manager', 'Compliance Officer', 'Privacy Officer', 'Risk Manager'],
    estimatedTime: '10-15 minutes',
    dimensionCount: 3,
    subdomains: [
      'responsible',
      'security',
      'quality'
    ],
    icon: '⚖️'
  }
};

// Helper function to get questions for a specific role
export const getQuestionsForRole = (roleId, allQuestions) => {
  const role = roles[roleId];
  if (!role) return [];
  
  return allQuestions.filter(question => 
    role.subdomains.includes(question.subdomain)
  );
};