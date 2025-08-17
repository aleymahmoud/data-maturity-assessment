BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS admin_users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT DEFAULT 'admin', -- 'admin', 'super_admin'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    is_active BOOLEAN DEFAULT TRUE
);
CREATE TABLE IF NOT EXISTS assessment_codes (
    code TEXT PRIMARY KEY,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT NOT NULL, -- admin user who created it
    expires_at DATETIME,
    is_used BOOLEAN DEFAULT FALSE,
    organization_name TEXT,
    intended_recipient TEXT,
    notes TEXT,
    usage_count INTEGER DEFAULT 0,
    max_uses INTEGER DEFAULT 1,
    FOREIGN KEY (created_by) REFERENCES admin_users (id)
);
CREATE TABLE IF NOT EXISTS assessment_results (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    overall_score REAL NOT NULL,
    overall_maturity_level TEXT NOT NULL,
    strengths_summary_en TEXT,
    strengths_summary_ar TEXT,
    improvement_areas_en TEXT,
    improvement_areas_ar TEXT,
    recommendations_en TEXT,
    recommendations_ar TEXT,
    generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES assessment_sessions (id)
);
CREATE TABLE IF NOT EXISTS assessment_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    session_start DATETIME DEFAULT CURRENT_TIMESTAMP,
    session_end DATETIME,
    status TEXT DEFAULT 'in_progress', -- 'in_progress', 'completed', 'abandoned'
    language_preference TEXT DEFAULT 'en', -- 'en' or 'ar'
    total_questions INTEGER,
    answered_questions INTEGER DEFAULT 0,
    completion_percentage REAL DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users (id)
);
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    user_type TEXT NOT NULL, -- 'admin', 'user'
    user_id TEXT,
    action TEXT NOT NULL,
    details TEXT,
    ip_address TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS domains (
    id TEXT PRIMARY KEY,
    name_en TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    description_en TEXT,
    description_ar TEXT,
    display_order INTEGER
);
CREATE TABLE IF NOT EXISTS email_logs (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    recipient_email TEXT NOT NULL,
    email_type TEXT NOT NULL, -- 'executive_summary', 'pdf_report', 'code_notification'
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'pending', -- 'sent', 'failed', 'pending'
    error_message TEXT,
    FOREIGN KEY (session_id) REFERENCES assessment_sessions (id)
);
CREATE TABLE IF NOT EXISTS maturity_levels (
    level_number INTEGER PRIMARY KEY,
    level_name TEXT NOT NULL,
    level_description_en TEXT NOT NULL,
    level_description_ar TEXT NOT NULL,
    score_range_min REAL NOT NULL,
    score_range_max REAL NOT NULL,
    color_code TEXT -- For visualization
);
CREATE TABLE IF NOT EXISTS question_options (
    id TEXT PRIMARY KEY,
    question_id TEXT NOT NULL,
    option_key TEXT NOT NULL, -- 'A', 'B', 'C', 'D', 'E', 'NA', 'NS'
    option_text_en TEXT NOT NULL,
    option_text_ar TEXT NOT NULL,
    score_value INTEGER NOT NULL, -- 1-5 for A-E, 0 for NA/NS
    maturity_level TEXT, -- 'Initial', 'Developing', 'Defined', 'Advanced', 'Optimized'
    explanation_en TEXT,
    explanation_ar TEXT,
    display_order INTEGER,
    FOREIGN KEY (question_id) REFERENCES questions (id)
);
CREATE TABLE IF NOT EXISTS questions (
    id TEXT PRIMARY KEY,
    subdomain_id TEXT,
    title_en TEXT,
    title_ar TEXT,
    text_en TEXT,
    text_ar TEXT,
    scenario_en TEXT,
    scenario_ar TEXT,
    icon TEXT,
    display_order INTEGER,
    FOREIGN KEY (subdomain_id) REFERENCES subdomains (id)
);
CREATE TABLE IF NOT EXISTS session_scores (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    domain_id TEXT,
    subdomain_id TEXT,
    score_type TEXT NOT NULL, -- 'domain', 'subdomain', 'overall'
    raw_score REAL NOT NULL,
    percentage_score REAL NOT NULL,
    maturity_level TEXT NOT NULL,
    questions_answered INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES assessment_sessions (id),
    FOREIGN KEY (domain_id) REFERENCES domains (id),
    FOREIGN KEY (subdomain_id) REFERENCES subdomains (id)
);
CREATE TABLE IF NOT EXISTS subdomains (
    id TEXT PRIMARY KEY,
    domain_id TEXT NOT NULL,
    name_en TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    description_en TEXT,
    description_ar TEXT,
    display_order INTEGER,
    FOREIGN KEY (domain_id) REFERENCES domains (id)
);
CREATE TABLE IF NOT EXISTS user_responses (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    question_id TEXT NOT NULL,
    option_key TEXT NOT NULL, -- 'A', 'B', 'C', 'D', 'E', 'NA'
    score_value INTEGER NOT NULL,
    answered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES assessment_sessions (id),
    FOREIGN KEY (question_id) REFERENCES questions (id),
    UNIQUE(session_id, question_id) -- One response per question per session
);
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    organization TEXT NOT NULL,
    role_title TEXT NOT NULL,
    email TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "admin_users" ("id","username","password_hash","full_name","email","role","created_at","last_login","is_active") VALUES ('admin-001','admin','temp_hash','System Administrator','admin@system.local','super_admin','2025-07-21 19:35:35',NULL,1);
INSERT INTO "assessment_codes" ("code","created_at","created_by","expires_at","is_used","organization_name","intended_recipient","notes","usage_count","max_uses") VALUES ('DEMO1234','2025-07-21 19:35:35','admin-001','2025-08-20 19:35:35',0,'Demo Organization','Test User',NULL,0,1),
 ('TEST5678','2025-07-21 19:35:35','admin-001','2025-08-20 19:35:35',0,'Test Company','Demo User',NULL,0,1),
 ('EVAL9999','2025-07-21 19:35:35','admin-001','2025-08-20 19:35:35',0,'Evaluation Corp','Assessment User',NULL,0,1);
INSERT INTO "audit_logs" ("id","user_type","user_id","action","details","ip_address","timestamp") VALUES ('log_1754133971138_v8b7cni3o','user',NULL,'code_validation_attempt','Code: DEMO1234, Valid: true','::1','2025-08-02 11:26:11'),
 ('log_1754134242774_7ddx5inic','user',NULL,'code_validation_attempt','Code: DEMO1234, Valid: true','::1','2025-08-02 11:30:42'),
 ('log_1754134250888_bxfgen8lp','user',NULL,'code_validation_attempt','Code: DEMO1233, Valid: false','::1','2025-08-02 11:30:50'),
 ('log_1754134256241_m5zpxb1ew','user',NULL,'code_validation_attempt','Code: DEMO1234, Valid: true','::1','2025-08-02 11:30:56'),
 ('log_1754134261110_sun3u2hkd','user',NULL,'code_validation_attempt','Code: DEMO1234, Valid: true','::1','2025-08-02 11:31:01'),
 ('log_1754134735377_z8k9e5wso','user',NULL,'code_validation_attempt','Code: DEMO1234, Valid: true','::1','2025-08-02 11:38:55'),
 ('log_1754135129537_4ikq6eogu','user',NULL,'code_validation_attempt','Code: DEMO1234, Valid: true','::1','2025-08-02 11:45:29'),
 ('log_1754137579659_rv309uq3x','user',NULL,'code_validation_attempt','Code: TEST5678, Valid: true','::1','2025-08-02 12:26:19'),
 ('log_1754151775577_ojfxiywbu','user',NULL,'code_validation_attempt','Code: DEMO1234, Valid: true','::1','2025-08-02 16:22:55'),
 ('log_1754152105084_n03tk26qk','user',NULL,'code_validation_attempt','Code: TEST5678, Valid: true','::1','2025-08-02 16:28:25'),
 ('log_1754152163631_ys6hfmf7v','user',NULL,'code_validation_attempt','Code: DEMO1234, Valid: true','::1','2025-08-02 16:29:23'),
 ('log_1754152251944_ucaxpsefr','user',NULL,'code_validation_attempt','Code: DEMO1234, Valid: true','::1','2025-08-02 16:30:51'),
 ('log_1754153008043_9qf2by087','user',NULL,'code_validation_attempt','Code: DEMO1234, Valid: true','::1','2025-08-02 16:43:28'),
 ('log_1754153694651_66c42bgur','user',NULL,'code_validation_attempt','Code: DEMO1234, Valid: true','127.0.0.1','2025-08-02 16:54:54'),
 ('log_1754155007748_2yw8guoe9','user',NULL,'code_validation_attempt','Code: DEMO1234, Valid: true','127.0.0.1','2025-08-02 17:16:47'),
 ('log_1754155287865_g4lqy6ikc','user',NULL,'code_validation_attempt','Code: DEMO1234, Valid: true','127.0.0.1','2025-08-02 17:21:27');
INSERT INTO "domains" ("id","name_en","name_ar","description_en","description_ar","display_order") VALUES ('DATA_LIFECYCLE','Data Lifecycle','دورة حياة البيانات','The core operational capabilities for managing data from collection through strategic use','القدرات التشغيلية الأساسية لإدارة البيانات من الجمع إلى الاستخدام الاستراتيجي',1),
 ('GOVERNANCE_PROTECTION','Governance & Protection','الحوكمة والحماية','Risk management, compliance, and ethical frameworks that enable safe and responsible data use','إدارة المخاطر والامتثال والأطر الأخلاقية التي تمكن الاستخدام الآمن والمسؤول للبيانات',2),
 ('ORGANIZATIONAL_ENABLERS','Organizational Enablers','الممكنات التنظيمية','Human and cultural factors that enable or constrain organizational data maturity','العوامل البشرية والثقافية التي تمكن أو تقيد نضج البيانات التنظيمية',3);
INSERT INTO "maturity_levels" ("level_number","level_name","level_description_en","level_description_ar","score_range_min","score_range_max","color_code") VALUES (1,'Initial','Ad-hoc, reactive approaches with minimal formalization','نهج مخصص وردود فعل مع الحد الأدنى من الرسمية',1.0,1.8,'#FF6B6B'),
 (2,'Developing','Basic capabilities with inconsistent implementation','قدرات أساسية مع تنفيذ غير متسق',1.8,2.6,'#FFD93D'),
 (3,'Defined','Standardized approaches with documented processes','نهج موحد مع عمليات موثقة',2.6,3.4,'#6BCF7F'),
 (4,'Advanced','Enterprise-wide integration with proactive management','تكامل على مستوى المؤسسة مع إدارة استباقية',3.4,4.2,'#4ECDC4'),
 (5,'Optimized','Innovative approaches with continuous improvement','نهج مبتكرة مع التحسين المستمر',4.2,5.0,'#45B7D1');
INSERT INTO "questions" ("id","subdomain_id","title_en","title_ar","text_en","text_ar","scenario_en","scenario_ar","icon","display_order") VALUES ('Q1','DATA_COLLECTION','Data Needs Identification',NULL,'How does your organization typically identify what data needs to be collected?',NULL,'Your organization needs to systematically collect data from various sources including customers, operations, systems, and external partners to support decision-making and operations.',NULL,'🎯',1),
 ('Q2','DATA_COLLECTION','Collection Process Design',NULL,'When your organization starts collecting data from a new source, what''s your typical approach?',NULL,'Your organization needs to systematically collect data from various sources including customers, operations, systems, and external partners to support decision-making and operations.',NULL,'⚙️',2),
 ('Q3','DATA_COLLECTION','Collection Standardization',NULL,'How does your organization ensure data is collected consistently across different departments or locations?',NULL,'Your organization needs to systematically collect data from various sources including customers, operations, systems, and external partners to support decision-making and operations.',NULL,'📏',3),
 ('Q4','INFRASTRUCTURE','Data Integration Capability',NULL,'When your organization needs to combine data from different sources for analysis, what''s the typical experience?',NULL,'Your organization relies on various technology systems to store, manage, process, and integrate data effectively to support your operations and analysis needs.',NULL,'🔗',4),
 ('Q5','INFRASTRUCTURE','System Reliability and Performance',NULL,'When your organization''s data systems experience problems or slowdowns, what typically happens?',NULL,'Your organization relies on various technology systems to store, manage, process, and integrate data effectively to support your operations and analysis needs.',NULL,'🖥️',5),
 ('Q6','INFRASTRUCTURE','Scalability and Capacity Management',NULL,'How does your organization typically handle growing data storage and processing needs?',NULL,'Your organization relies on various technology systems to store, manage, process, and integrate data effectively to support your operations and analysis needs.',NULL,'📈',6),
 ('Q7','QUALITY','Error Detection and Correction',NULL,'When staff notice errors or inconsistencies in your organization''s data, what typically happens?',NULL,'Your organization collects and manages large amounts of data from multiple sources, and ensuring this data is accurate, complete, and reliable is critical for making good decisions.',NULL,'🔍',7),
 ('Q8','QUALITY','Data Consistency Management',NULL,'When the same information appears in multiple systems across your organization, how consistent is it?',NULL,'Your organization collects and manages large amounts of data from multiple sources, and ensuring this data is accurate, complete, and reliable is critical for making good decisions.',NULL,'⚖️',8),
 ('Q9','QUALITY','Data Standards and Documentation',NULL,'When new staff join your organization, how do they learn what different data fields mean and how to use them properly?',NULL,'Your organization collects and manages large amounts of data from multiple sources, and ensuring this data is accurate, complete, and reliable is critical for making good decisions.',NULL,'📚',9),
 ('Q10','ANALYSIS','Causal Analysis Capability',NULL,'When trying to understand why something happened in your organization, what''s your typical approach?',NULL,'Your organization faces complex operational challenges and needs to understand what''s causing certain outcomes, identify patterns, and predict future trends to make informed decisions.',NULL,'🔬',10),
 ('Q11','ANALYSIS','Predictive Analysis and Planning',NULL,'When planning for the upcoming year, how does your organization typically approach potential future challenges?',NULL,'Your organization faces complex operational challenges and needs to understand what''s causing certain outcomes, identify patterns, and predict future trends to make informed decisions.',NULL,'🔮',11),
 ('Q12','ANALYSIS','Program Evaluation Rigor',NULL,'How does your organization typically investigate whether your programs are working effectively?',NULL,'Your organization faces complex operational challenges and needs to understand what''s causing certain outcomes, identify patterns, and predict future trends to make informed decisions.',NULL,'📊',12),
 ('Q13','ANALYSIS','Comparative Analysis and Benchmarking',NULL,'When comparing your organization''s performance to others, what approach do you typically take?',NULL,'Your organization faces complex operational challenges and needs to understand what''s causing certain outcomes, identify patterns, and predict future trends to make informed decisions.',NULL,'📈',13),
 ('Q14','APPLICATION','Insight Implementation Process',NULL,'When your organization identifies a significant data insight, what typically happens next?',NULL,'Your organization has been analyzing data and has identified interesting patterns and insights. Now you need to decide what to do with these findings to improve operations and achieve better results.',NULL,'⚡',14),
 ('Q15','APPLICATION','Performance Problem Response',NULL,'When a program shows poor performance in your data, how does your organization typically respond?',NULL,'Your organization has been analyzing data and has identified interesting patterns and insights. Now you need to decide what to do with these findings to improve operations and achieve better results.',NULL,'🔧',15),
 ('Q16','APPLICATION','Change Management for Data-Driven Insights',NULL,'How does your organization typically handle situations where data contradicts established practices?',NULL,'Your organization has been analyzing data and has identified interesting patterns and insights. Now you need to decide what to do with these findings to improve operations and achieve better results.',NULL,'🔄',16),
 ('Q17','STRATEGY','Data-Driven Resource Allocation',NULL,'When budget discussions arise, what information does your organization typically reference first?',NULL,'Your organization is making important strategic decisions about resource allocation, new initiatives, market expansion, and communicating value to stakeholders using data insights.',NULL,'💰',17),
 ('Q18','STRATEGY','Strategic Expansion Analysis',NULL,'How does your organization typically make decisions about entering new markets or program areas?',NULL,'Your organization is making important strategic decisions about resource allocation, new initiatives, market expansion, and communicating value to stakeholders using data insights.',NULL,'🚀',18),
 ('Q19','STRATEGY','Impact Communication and Accountability',NULL,'When stakeholders ask about your organization''s impact and effectiveness, how do you typically respond?',NULL,'Your organization is making important strategic decisions about resource allocation, new initiatives, market expansion, and communicating value to stakeholders using data insights.',NULL,'📢',19),
 ('Q20','SECURITY','Access Control Management',NULL,'How does your organization typically handle requests for access to sensitive data?',NULL,'Your organization handles sensitive information that needs to be protected from unauthorized access, breaches, and loss while still allowing authorized staff to access the data they need for their work.',NULL,'🔐',20),
 ('Q21','SECURITY','Security Lifecycle Management',NULL,'When staff leave your organization, what happens to their access to data systems?',NULL,'Your organization handles sensitive information that needs to be protected from unauthorized access, breaches, and loss while still allowing authorized staff to access the data they need for their work.',NULL,'👋',21),
 ('Q22','SECURITY','Disaster Recovery and Business Continuity',NULL,'If your organization''s data systems were compromised, how confident are you in your ability to recover?',NULL,'Your organization handles sensitive information that needs to be protected from unauthorized access, breaches, and loss while still allowing authorized staff to access the data they need for their work.',NULL,'🛡️',22),
 ('Q23','RESPONSIBLE','Privacy and Consent Management',NULL,'When collecting personal information from clients or customers, how does your organization ensure they understand how their data will be used?',NULL,'Your organization collects personal information from clients and customers, and you need to ensure this data is used ethically, transparently, and in compliance with relevant regulations and privacy laws.',NULL,'🔒',23),
 ('Q24','RESPONSIBLE','Regulatory Compliance Management',NULL,'How does your organization stay current with regulations that affect your data practices?',NULL,'Your organization collects personal information from clients and customers, and you need to ensure this data is used ethically, transparently, and in compliance with relevant regulations and privacy laws.',NULL,'📋',24),
 ('Q25','RESPONSIBLE','Ethical Data Use Evaluation',NULL,'When considering new uses for existing data, how does your organization evaluate whether those uses are appropriate?',NULL,'Your organization collects personal information from clients and customers, and you need to ensure this data is used ethically, transparently, and in compliance with relevant regulations and privacy laws.',NULL,'⚖️',25),
 ('Q26','LEADERSHIP','Leadership Data Advocacy',NULL,'How actively does senior leadership champion data-driven decision making throughout the organization?',NULL,'Your organization''s senior leadership team is responsible for setting direction, making strategic decisions, investing in capabilities, and creating an environment where data can be effectively used throughout the organization.',NULL,'👑',26),
 ('Q27','LEADERSHIP','Leadership Adaptability to Data Insights',NULL,'When data reveals uncomfortable truths, how constructively does your organization''s leadership respond and adapt?',NULL,'Your organization''s senior leadership team is responsible for setting direction, making strategic decisions, investing in capabilities, and creating an environment where data can be effectively used throughout the organization.',NULL,'🎯',27),
 ('Q28','LEADERSHIP','Strategic Investment in Data Capabilities',NULL,'When investing in new technology or capabilities, how does your leadership prioritize data-related improvements?',NULL,'Your organization''s senior leadership team is responsible for setting direction, making strategic decisions, investing in capabilities, and creating an environment where data can be effectively used throughout the organization.',NULL,'💡',28),
 ('Q29','LEADERSHIP','Change Management for Data Initiatives',NULL,'When implementing data-driven changes, how effectively does leadership manage organizational resistance and change?',NULL,'Your organization''s senior leadership team is responsible for setting direction, making strategic decisions, investing in capabilities, and creating an environment where data can be effectively used throughout the organization.',NULL,'🌟',29),
 ('Q30','TALENT','Technical and Analytical Talent Adequacy',NULL,'To what extent does your organization have the right mix of technical and analytical talent to support data initiatives?',NULL,'Your organization needs people with the right skills and capabilities to collect, analyze, and use data effectively at all levels, and must develop these capabilities over time as needs evolve.',NULL,'🧠',30),
 ('Q31','TALENT','Organization-wide Data Literacy Development',NULL,'How well does your organization develop data fluency among staff at all levels, not just technical roles?',NULL,'Your organization needs people with the right skills and capabilities to collect, analyze, and use data effectively at all levels, and must develop these capabilities over time as needs evolve.',NULL,'🎓',31),
 ('Q32','TALENT','Analytical Talent Acquisition and Retention',NULL,'How successfully does your organization recruit and retain talent with strong analytical and data interpretation skills?',NULL,'Your organization needs people with the right skills and capabilities to collect, analyze, and use data effectively at all levels, and must develop these capabilities over time as needs evolve.',NULL,'🏆',32),
 ('Q33','CULTURE','Data-Driven Innovation Culture',NULL,'How effectively does your organization foster a culture where staff feel empowered to question assumptions using data?',NULL,'Your organization''s culture determines how comfortable people feel using data, sharing insights, collaborating across departments, experimenting with new approaches, and learning from both successes and failures.',NULL,'💡',33),
 ('Q34','CULTURE','Cross-Functional Data Collaboration',NULL,'How well does your organization create cross-functional collaboration between technical data teams and program staff?',NULL,'Your organization''s culture determines how comfortable people feel using data, sharing insights, collaborating across departments, experimenting with new approaches, and learning from both successes and failures.',NULL,'🤝',34),
 ('Q35','CULTURE','Experimentation and Learning Culture',NULL,'To what extent does your organization''s culture encourage experimentation and learning from data-driven pilot programs?',NULL,'Your organization''s culture determines how comfortable people feel using data, sharing insights, collaborating across departments, experimenting with new approaches, and learning from both successes and failures.',NULL,'🔬',35);
INSERT INTO "subdomains" ("id","domain_id","name_en","name_ar","description_en","description_ar","display_order") VALUES ('DATA_COLLECTION','DATA_LIFECYCLE','Data Collection','جمع البيانات','The organization''s approach to systematically identifying, gathering, and capturing data from various sources','نهج المؤسسة لتحديد وجمع والتقاط البيانات بشكل منهجي من مصادر مختلفة',1),
 ('INFRASTRUCTURE','DATA_LIFECYCLE','Infrastructure','البنية التحتية','Technical foundation and systems capability for storing, processing, and integrating data effectively','الأساس التقني وقدرات الأنظمة لتخزين ومعالجة ودمج البيانات بفعالية',2),
 ('QUALITY','DATA_LIFECYCLE','Quality','الجودة','Systematic management of data accuracy, consistency, and reliability throughout the organization','الإدارة المنهجية لدقة البيانات واتساقها وموثوقيتها في جميع أنحاء المؤسسة',3),
 ('ANALYSIS','DATA_LIFECYCLE','Analysis','التحليل','Sophistication and depth of organizational capability to examine data, understand patterns, and generate insights','تطور وعمق القدرة التنظيمية لفحص البيانات وفهم الأنماط وتوليد الرؤى',4),
 ('APPLICATION','DATA_LIFECYCLE','Application','التطبيق','Organizational effectiveness in converting data insights into concrete actions and operational improvements','الفعالية التنظيمية في تحويل رؤى البيانات إلى إجراءات ملموسة وتحسينات تشغيلية',5),
 ('STRATEGY','DATA_LIFECYCLE','Strategy','الاستراتيجية','Integration of data insights into high-level organizational decision-making and strategic planning','دمج رؤى البيانات في صنع القرار التنظيمي عالي المستوى والتخطيط الاستراتيجي',6),
 ('SECURITY','GOVERNANCE_PROTECTION','Security','الأمان','Protection of data assets through access controls, monitoring, and recovery capabilities','حماية أصول البيانات من خلال ضوابط الوصول والمراقبة وقدرات الاسترداد',7),
 ('RESPONSIBLE','GOVERNANCE_PROTECTION','Responsible Use','الاستخدام المسؤول','Ethical data practices, regulatory compliance, and stakeholder trust through transparent and responsible data use','ممارسات البيانات الأخلاقية والامتثال التنظيمي وثقة أصحاب المصلحة من خلال الاستخدام الشفاف والمسؤول للبيانات',8),
 ('LEADERSHIP','ORGANIZATIONAL_ENABLERS','Leadership','القيادة','Executive commitment, support, and modeling of data-driven decision making throughout the organization','التزام التنفيذيين ودعمهم ونمذجة صنع القرار المدفوع بالبيانات في جميع أنحاء المؤسسة',9),
 ('TALENT','ORGANIZATIONAL_ENABLERS','Talent','المواهب','Organizational capability to attract, develop, and retain the human skills necessary for effective data use','القدرة التنظيمية على جذب وتطوير والاحتفاظ بالمهارات البشرية اللازمة للاستخدام الفعال للبيانات',10),
 ('CULTURE','ORGANIZATIONAL_ENABLERS','Culture','الثقافة','Organizational attitudes, behaviors, and norms that encourage or inhibit effective data use and collaboration','المواقف والسلوكيات والمعايير التنظيمية التي تشجع أو تثبط الاستخدام الفعال للبيانات والتعاون',11);
CREATE INDEX idx_session_scores_session ON session_scores(session_id);
CREATE INDEX idx_sessions_user ON assessment_sessions(user_id);
CREATE INDEX idx_user_responses_question ON user_responses(question_id);
CREATE INDEX idx_user_responses_session ON user_responses(session_id);
COMMIT;
