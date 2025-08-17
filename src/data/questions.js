// Assessment Questions Data Structure
export const subdomains = {
  DATA_COLLECTION: 'data_collection',
  INFRASTRUCTURE: 'infrastructure', 
  QUALITY: 'quality',
  ANALYSIS: 'analysis',
  APPLICATION: 'application',
  STRATEGY: 'strategy',
  SECURITY: 'security',
  RESPONSIBLE: 'responsible',
  LEADERSHIP: 'leadership',
  TALENT: 'talent',
  CULTURE: 'culture'
};

export const domainGroups = {
  DATA_LIFECYCLE: 'data_lifecycle',
  GOVERNANCE_PROTECTION: 'governance_protection',
  ORGANIZATIONAL_ENABLERS: 'organizational_enablers'
};

export const questions = [
  // DATA COLLECTION (Q1-Q3)
  {
    id: 'Q1',
    subdomain: subdomains.DATA_COLLECTION,
    domainGroup: domainGroups.DATA_LIFECYCLE,
    title: 'Data Needs Identification',
    question: 'How does your organization typically identify what data needs to be collected?',
    scenario: 'Your organization needs to systematically collect data from various sources including customers, operations, systems, and external partners to support decision-making and operations.',
    options: [
      { value: 1, text: 'We collect whatever data is easily available or required by regulations' },
      { value: 2, text: 'We gather data that senior staff think might be useful' },
      { value: 3, text: 'We identify data needs based on current reporting and operational requirements' },
      { value: 4, text: 'We systematically assess what data would help us achieve our strategic objectives' },
      { value: 5, text: 'We continuously evaluate and optimize our data collection based on changing business needs' }
    ]
  },
  {
    id: 'Q2',
    subdomain: subdomains.DATA_COLLECTION,
    domainGroup: domainGroups.DATA_LIFECYCLE,
    title: 'Collection Process Design',
    question: 'When your organization starts collecting data from a new source, what\'s your typical approach?',
    scenario: 'Your organization needs to systematically collect data from various sources including customers, operations, systems, and external partners to support decision-making and operations.',
    options: [
      { value: 1, text: 'We begin collecting and figure out how to use it later' },
      { value: 2, text: 'We start with basic collection and improve the process over time' },
      { value: 3, text: 'We plan the collection process and test it before full implementation' },
      { value: 4, text: 'We design comprehensive collection procedures with quality controls from the start' },
      { value: 5, text: 'We implement sophisticated collection systems with real-time validation and feedback' }
    ]
  },
  {
    id: 'Q3',
    subdomain: subdomains.DATA_COLLECTION,
    domainGroup: domainGroups.DATA_LIFECYCLE,
    title: 'Collection Standardization',
    question: 'How does your organization ensure data is collected consistently across different departments or locations?',
    scenario: 'Your organization needs to systematically collect data from various sources including customers, operations, systems, and external partners to support decision-making and operations.',
    options: [
      { value: 1, text: 'Each department collects data in their own way' },
      { value: 2, text: 'We provide basic guidelines but allow flexibility in implementation' },
      { value: 3, text: 'We have standard procedures that most departments follow' },
      { value: 4, text: 'We enforce consistent collection standards across the organization' },
      { value: 5, text: 'We use automated systems that ensure uniform collection regardless of location or person' }
    ]
  }
  // Note: This is a sample with first 3 questions. Full implementation would include all 35 questions
];

export const maturityLevels = {
  1: { level: 'Initial', range: '1.0-1.8', description: 'Ad-hoc, reactive approaches with minimal formalization' },
  2: { level: 'Developing', range: '1.9-2.6', description: 'Basic capabilities with inconsistent implementation' },
  3: { level: 'Defined', range: '2.7-3.4', description: 'Standardized approaches with documented processes' },
  4: { level: 'Advanced', range: '3.5-4.2', description: 'Enterprise-wide integration with proactive management' },
  5: { level: 'Optimized', range: '4.3-5.0', description: 'Innovative approaches with continuous improvement' }
};


// Add NA/NS options to all questions
questions.forEach(question => {
  question.options.push(
    { value: 'na', text: 'Not Applicable to my role/organization' },
    { value: 'ns', text: 'Not Sure/Don\'t Know' }
  );
});

// Subdomain configuration with proper order and details
export const subdomainConfig = [
  { 
    id: subdomains.DATA_COLLECTION, 
    name: 'Data Collection', 
    description: 'How your organization identifies and gathers data from various sources',
    domainGroup: domainGroups.DATA_LIFECYCLE 
  },
  { 
    id: subdomains.INFRASTRUCTURE, 
    name: 'Infrastructure', 
    description: 'Technical systems for storing, processing, and integrating data',
    domainGroup: domainGroups.DATA_LIFECYCLE 
  },
  { 
    id: subdomains.QUALITY, 
    name: 'Quality', 
    description: 'Ensuring data accuracy, consistency, and reliability',
    domainGroup: domainGroups.DATA_LIFECYCLE 
  }
  // Note: Only showing first 3 for testing - we'll add all 11 later
];

// Helper function to get questions by subdomain
export const getQuestionsBySubdomain = (subdomainId) => {
  return questions.filter(question => question.subdomain === subdomainId);
};