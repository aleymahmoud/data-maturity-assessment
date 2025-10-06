-- Populate MySQL database with essential application data
USE data_maturity;

-- Clear existing data (in case tables exist)
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE user_responses;
TRUNCATE TABLE assessment_sessions;
TRUNCATE TABLE assessment_results;
TRUNCATE TABLE users;
TRUNCATE TABLE questions;
TRUNCATE TABLE subdomains;
TRUNCATE TABLE domains;
TRUNCATE TABLE roles;
SET FOREIGN_KEY_CHECKS = 1;

-- Insert domains
INSERT INTO domains (id, name_en, name_ar, description_en, description_ar, display_order) VALUES
('data_lifecycle', 'Data Lifecycle', 'دورة حياة البيانات', 'Managing data from creation to disposal', 'إدارة البيانات من الإنشاء إلى التخلص', 1),
('governance_protection', 'Data Governance & Protection', 'حوكمة وحماية البيانات', 'Policies and procedures for data management', 'السياسات والإجراءات لإدارة البيانات', 2),
('organizational_enablers', 'Organizational Enablers', 'المُمكِّنات التنظيمية', 'Resources and capabilities supporting data initiatives', 'الموارد والقدرات الداعمة لمبادرات البيانات', 3);

-- Insert subdomains
INSERT INTO subdomains (id, domain_id, name_en, name_ar, description_en, description_ar, display_order) VALUES
-- Data Lifecycle subdomains
('data_sources', 'data_lifecycle', 'Data Sources', 'مصادر البيانات', 'Internal and external data sources', 'مصادر البيانات الداخلية والخارجية', 1),
('data_integration', 'data_lifecycle', 'Data Integration', 'تكامل البيانات', 'Combining data from different sources', 'دمج البيانات من مصادر مختلفة', 2),
('data_processing', 'data_lifecycle', 'Data Processing & Analysis', 'معالجة وتحليل البيانات', 'Processing and analyzing data', 'معالجة وتحليل البيانات', 3),
('data_distribution', 'data_lifecycle', 'Data Distribution & Visualization', 'توزيع وتصور البيانات', 'Sharing and visualizing data', 'مشاركة وتصور البيانات', 4),

-- Governance & Protection subdomains
('data_governance', 'governance_protection', 'Data Governance', 'حوكمة البيانات', 'Data governance framework', 'إطار حوكمة البيانات', 1),
('data_quality', 'governance_protection', 'Data Quality', 'جودة البيانات', 'Data quality management', 'إدارة جودة البيانات', 2),
('data_security', 'governance_protection', 'Data Security & Privacy', 'أمان وخصوصية البيانات', 'Protecting data security and privacy', 'حماية أمان وخصوصية البيانات', 3),
('data_compliance', 'governance_protection', 'Data Compliance & Ethics', 'امتثال وأخلاقيات البيانات', 'Compliance with regulations and ethical standards', 'الامتثال للوائح والمعايير الأخلاقية', 4),

-- Organizational Enablers subdomains
('data_strategy', 'organizational_enablers', 'Data Strategy & Leadership', 'استراتيجية وقيادة البيانات', 'Strategic approach to data management', 'النهج الاستراتيجي لإدارة البيانات', 1),
('data_culture', 'organizational_enablers', 'Data Culture & Literacy', 'ثقافة ومحو أمية البيانات', 'Building data-driven culture', 'بناء ثقافة مدفوعة بالبيانات', 2),
('data_technology', 'organizational_enablers', 'Data Technology & Architecture', 'تكنولوجيا وهندسة البيانات', 'Technology infrastructure for data', 'البنية التحتية التكنولوجية للبيانات', 3);

-- Insert roles
INSERT INTO roles (id, name_en, name_ar, description_en, description_ar, focus_en, focus_ar, recommendations_en, recommendations_ar, display_order) VALUES
('executive', 'Executive/C-Suite', 'التنفيذي/المستوى التنفيذي', 'Senior executives and C-level leadership', 'المديرين التنفيذيين والقيادة على مستوى C', 'Strategic data governance and organizational transformation', 'حوكمة البيانات الاستراتيجية والتحول التنظيمي', 'Focus on strategic initiatives and organizational alignment', 'التركيز على المبادرات الاستراتيجية والمواءمة التنظيمية', 1),
('it_technology', 'IT/Technology', 'تكنولوجيا المعلومات/التكنولوجيا', 'IT professionals and technology managers', 'مهنيي تكنولوجيا المعلومات ومديري التكنولوجيا', 'Technical infrastructure and data architecture', 'البنية التحتية التقنية وهندسة البيانات', 'Strengthen technical capabilities and infrastructure', 'تعزيز القدرات التقنية والبنية التحتية', 2),
('bi_analytics', 'BI/Analytics', 'ذكاء الأعمال/التحليلات', 'Business intelligence and analytics professionals', 'مهنيي ذكاء الأعمال والتحليلات', 'Data analysis and business insights', 'تحليل البيانات ورؤى الأعمال', 'Enhance analytical capabilities and reporting', 'تعزيز القدرات التحليلية والتقارير', 3),
('business_managers', 'Business Managers', 'مديري الأعمال', 'Business unit managers and department heads', 'مديري وحدات الأعمال ورؤساء الأقسام', 'Data-driven decision making and operations', 'اتخاذ القرار المبني على البيانات والعمليات', 'Improve data utilization in business processes', 'تحسين استخدام البيانات في العمليات التجارية', 4),
('data_governance', 'Data Governance', 'حوكمة البيانات', 'Data governance specialists and compliance officers', 'متخصصي حوكمة البيانات وموظفي الامتثال', 'Data governance policies and compliance', 'سياسات حوكمة البيانات والامتثال', 'Establish robust governance frameworks', 'إنشاء أطر حوكمة قوية', 5);

-- Insert sample questions (essential ones for testing)
INSERT INTO questions (id, subdomain_id, title_en, title_ar, text_en, text_ar, scenario_en, scenario_ar, icon, display_order, priority) VALUES
('Q1', 'data_sources', 'Data Source Inventory', 'جرد مصادر البيانات', 'How well does your organization maintain an inventory of all data sources?', 'ما مدى جودة احتفاظ مؤسستك بجرد لجميع مصادر البيانات؟', 'Consider internal databases, external feeds, APIs, manual data entry, and third-party sources.', 'فكر في قواعد البيانات الداخلية والتغذيات الخارجية وواجهات برمجة التطبيقات وإدخال البيانات اليدوي ومصادر الطرف الثالث.', 'database', 1, 1),
('Q2', 'data_integration', 'Data Integration Processes', 'عمليات تكامل البيانات', 'How mature are your data integration and ETL processes?', 'ما مدى نضج عمليات تكامل البيانات و ETL الخاصة بك؟', 'Evaluate automated data pipelines, real-time integration, and data transformation capabilities.', 'قيم خطوط البيانات الآلية والتكامل في الوقت الفعلي وقدرات تحويل البيانات.', 'shuffle', 2, 1),
('Q3', 'data_processing', 'Data Analysis Capabilities', 'قدرات تحليل البيانات', 'What is the sophistication level of your data analysis and processing capabilities?', 'ما هو مستوى تطور قدرات تحليل ومعالجة البيانات لديكم؟', 'Consider advanced analytics, machine learning, statistical analysis, and processing speed.', 'فكر في التحليلات المتقدمة وتعلم الآلة والتحليل الإحصائي وسرعة المعالجة.', 'trending-up', 3, 1);

-- Insert question options (sample for testing)
INSERT INTO question_options (id, question_id, option_key, option_text_en, option_text_ar, score_value, maturity_level, explanation_en, explanation_ar, display_order) VALUES
-- Q1 Options
('Q1_1', 'Q1', '1', 'No inventory exists', 'لا يوجد جرد', 1, 'Initial', 'No systematic tracking of data sources', 'لا يوجد تتبع منهجي لمصادر البيانات', 1),
('Q1_2', 'Q1', '2', 'Basic manual inventory', 'جرد يدوي أساسي', 2, 'Developing', 'Manual documentation of some data sources', 'توثيق يدوي لبعض مصادر البيانات', 2),
('Q1_3', 'Q1', '3', 'Documented inventory with updates', 'جرد موثق مع التحديثات', 3, 'Defined', 'Regular updates to documented inventory', 'تحديثات منتظمة للجرد الموثق', 3),
('Q1_4', 'Q1', '4', 'Automated inventory management', 'إدارة جرد آلية', 4, 'Advanced', 'Automated discovery and cataloging', 'الاكتشاف والفهرسة الآلية', 4),
('Q1_5', 'Q1', '5', 'Intelligent automated system', 'نظام آلي ذكي', 5, 'Optimized', 'AI-driven data discovery and management', 'اكتشاف وإدارة البيانات المدفوعة بالذكاء الاصطناعي', 5),

-- Q2 Options
('Q2_1', 'Q2', '1', 'Manual data movement', 'نقل البيانات اليدوي', 1, 'Initial', 'Manual processes for data integration', 'عمليات يدوية لتكامل البيانات', 1),
('Q2_2', 'Q2', '2', 'Basic automated tools', 'أدوات آلية أساسية', 2, 'Developing', 'Some automation in data integration', 'بعض الأتمتة في تكامل البيانات', 2),
('Q2_3', 'Q2', '3', 'Established ETL processes', 'عمليات ETL راسخة', 3, 'Defined', 'Standard ETL processes in place', 'عمليات ETL معيارية مطبقة', 3),
('Q2_4', 'Q2', '4', 'Real-time integration', 'التكامل في الوقت الفعلي', 4, 'Advanced', 'Real-time data integration capabilities', 'قدرات تكامل البيانات في الوقت الفعلي', 4),
('Q2_5', 'Q2', '5', 'Intelligent data pipelines', 'خطوط البيانات الذكية', 5, 'Optimized', 'Self-managing intelligent pipelines', 'خطوط البيانات الذكية ذاتية الإدارة', 5),

-- Q3 Options
('Q3_1', 'Q3', '1', 'Basic reporting only', 'تقارير أساسية فقط', 1, 'Initial', 'Simple reporting capabilities', 'قدرات تقارير بسيطة', 1),
('Q3_2', 'Q3', '2', 'Standard analytics tools', 'أدوات تحليل معيارية', 2, 'Developing', 'Basic analytical capabilities', 'قدرات تحليلية أساسية', 2),
('Q3_3', 'Q3', '3', 'Advanced analytics', 'تحليلات متقدمة', 3, 'Defined', 'Statistical analysis and modeling', 'التحليل الإحصائي والنمذجة', 3),
('Q3_4', 'Q3', '4', 'Predictive analytics', 'تحليلات تنبؤية', 4, 'Advanced', 'Machine learning and predictions', 'تعلم الآلة والتنبؤات', 4),
('Q3_5', 'Q3', '5', 'AI-driven insights', 'رؤى مدفوعة بالذكاء الاصطناعي', 5, 'Optimized', 'Automated AI-powered analytics', 'تحليلات آلية مدعومة بالذكاء الاصطناعي', 5);

-- Add NA/NS options for all questions
INSERT INTO question_options (id, question_id, option_key, option_text_en, option_text_ar, score_value, maturity_level, explanation_en, explanation_ar, display_order) VALUES
('Q1_NA', 'Q1', 'na', 'Not Applicable', 'غير قابل للتطبيق', 0, 'N/A', 'This question does not apply', 'هذا السؤال غير قابل للتطبيق', 6),
('Q1_NS', 'Q1', 'ns', 'Not Sure', 'غير متأكد', 0, 'Unknown', 'Uncertain about current state', 'غير متأكد من الوضع الحالي', 7),
('Q2_NA', 'Q2', 'na', 'Not Applicable', 'غير قابل للتطبيق', 0, 'N/A', 'This question does not apply', 'هذا السؤال غير قابل للتطبيق', 6),
('Q2_NS', 'Q2', 'ns', 'Not Sure', 'غير متأكد', 0, 'Unknown', 'Uncertain about current state', 'غير متأكد من الوضع الحالي', 7),
('Q3_NA', 'Q3', 'na', 'Not Applicable', 'غير قابل للتطبيق', 0, 'N/A', 'This question does not apply', 'هذا السؤال غير قابل للتطبيق', 6),
('Q3_NS', 'Q3', 'ns', 'Not Sure', 'غير متأكد', 0, 'Unknown', 'Uncertain about current state', 'غير متأكد من الوضع الحالي', 7);

-- Ensure TEST001 code exists
INSERT IGNORE INTO assessment_codes (code, organization_name, intended_recipient, created_by, expires_at, assessment_type)
VALUES ('TEST001', 'Test Organization', 'Test User', 'admin', DATE_ADD(NOW(), INTERVAL 30 DAY), 'full');