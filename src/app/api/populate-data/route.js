import { NextResponse } from 'next/server';
import { openDatabase } from '../../../lib/database.js';

export async function POST(request) {
  try {
    const database = await openDatabase();

    // Drop existing tables to ensure clean state with consistent collation
    await database.execute('SET FOREIGN_KEY_CHECKS = 0');
    await database.execute('DROP TABLE IF EXISTS question_options');
    await database.execute('DROP TABLE IF EXISTS user_responses');
    await database.execute('DROP TABLE IF EXISTS session_scores');
    await database.execute('DROP TABLE IF EXISTS assessment_results');
    await database.execute('DROP TABLE IF EXISTS assessment_sessions');
    await database.execute('DROP TABLE IF EXISTS users');
    await database.execute('DROP TABLE IF EXISTS questions');
    await database.execute('DROP TABLE IF EXISTS subdomains');
    await database.execute('DROP TABLE IF EXISTS domains');
    await database.execute('DROP TABLE IF EXISTS roles');
    await database.execute('DROP TABLE IF EXISTS assessment_codes');
    await database.execute('SET FOREIGN_KEY_CHECKS = 1');

    // Create tables with consistent charset and collation
    await database.execute(`
      CREATE TABLE IF NOT EXISTS domains (
        id VARCHAR(255) PRIMARY KEY,
        name_en VARCHAR(500) NOT NULL,
        name_ar VARCHAR(500) NOT NULL,
        description_en TEXT,
        description_ar TEXT,
        display_order INTEGER
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await database.execute(`
      CREATE TABLE IF NOT EXISTS subdomains (
        id VARCHAR(255) PRIMARY KEY,
        domain_id VARCHAR(255) NOT NULL,
        name_en VARCHAR(500) NOT NULL,
        name_ar VARCHAR(500) NOT NULL,
        description_en TEXT,
        description_ar TEXT,
        display_order INTEGER
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await database.execute(`
      CREATE TABLE IF NOT EXISTS roles (
        id VARCHAR(255) PRIMARY KEY,
        name_en VARCHAR(500) NOT NULL,
        name_ar VARCHAR(500) NOT NULL,
        description_en TEXT,
        description_ar TEXT,
        focus_en TEXT,
        focus_ar TEXT,
        recommendations_en TEXT,
        recommendations_ar TEXT,
        display_order INTEGER
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await database.execute(`
      CREATE TABLE IF NOT EXISTS questions (
        id VARCHAR(255) PRIMARY KEY,
        subdomain_id VARCHAR(255),
        title_en VARCHAR(1000),
        title_ar VARCHAR(1000),
        text_en TEXT,
        text_ar TEXT,
        scenario_en TEXT,
        scenario_ar TEXT,
        icon VARCHAR(255),
        display_order INTEGER,
        priority INTEGER DEFAULT 0
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await database.execute(`
      CREATE TABLE IF NOT EXISTS question_options (
        id VARCHAR(255) PRIMARY KEY,
        question_id VARCHAR(255) NOT NULL,
        option_key VARCHAR(50) NOT NULL,
        option_text_en TEXT NOT NULL,
        option_text_ar TEXT NOT NULL,
        score_value INTEGER NOT NULL,
        maturity_level VARCHAR(100),
        explanation_en TEXT,
        explanation_ar TEXT,
        display_order INTEGER
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await database.execute(`
      CREATE TABLE IF NOT EXISTS assessment_codes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        organization_name VARCHAR(255) NOT NULL,
        intended_recipient VARCHAR(255) NOT NULL,
        created_by VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL,
        assessment_type ENUM('full', 'quick') DEFAULT 'full',
        is_used BOOLEAN DEFAULT FALSE,
        used_at TIMESTAMP NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await database.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        organization VARCHAR(255) NOT NULL,
        role_title VARCHAR(255) NOT NULL,
        selected_role_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await database.execute(`
      CREATE TABLE IF NOT EXISTS assessment_sessions (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        code VARCHAR(50) NOT NULL,
        status ENUM('in_progress', 'completed') DEFAULT 'in_progress',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP NULL,
        total_questions INTEGER DEFAULT 0,
        questions_answered INTEGER DEFAULT 0
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await database.execute(`
      CREATE TABLE IF NOT EXISTS user_responses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id VARCHAR(255) NOT NULL,
        question_id VARCHAR(255) NOT NULL,
        selected_option VARCHAR(50) NOT NULL,
        score_value INTEGER NOT NULL,
        answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await database.execute(`
      CREATE TABLE IF NOT EXISTS session_scores (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id VARCHAR(255) NOT NULL,
        subdomain_id VARCHAR(255) NOT NULL,
        raw_score DECIMAL(5,2) NOT NULL,
        percentage_score DECIMAL(5,2) NOT NULL,
        questions_answered INTEGER NOT NULL,
        calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Clear existing data
    await database.execute('DELETE FROM question_options');
    await database.execute('DELETE FROM questions');
    await database.execute('DELETE FROM subdomains');
    await database.execute('DELETE FROM domains');
    await database.execute('DELETE FROM roles');

    // Insert domains
    const domains = [
      ['data_lifecycle', 'Data Lifecycle', 'دورة حياة البيانات', 'Managing data from creation to disposal', 'إدارة البيانات من الإنشاء إلى التخلص', 1],
      ['governance_protection', 'Data Governance & Protection', 'حوكمة وحماية البيانات', 'Policies and procedures for data management', 'السياسات والإجراءات لإدارة البيانات', 2],
      ['organizational_enablers', 'Organizational Enablers', 'المُمكِّنات التنظيمية', 'Resources and capabilities supporting data initiatives', 'الموارد والقدرات الداعمة لمبادرات البيانات', 3]
    ];

    for (const domain of domains) {
      await database.execute(
        'INSERT INTO domains (id, name_en, name_ar, description_en, description_ar, display_order) VALUES (?, ?, ?, ?, ?, ?)',
        domain
      );
    }

    // Insert roles
    const roles = [
      ['executive', 'Executive/C-Suite', 'التنفيذي/المستوى التنفيذي', 'Senior executives and C-level leadership', 'المديرين التنفيذيين والقيادة على مستوى C', 'Strategic data governance and organizational transformation', 'حوكمة البيانات الاستراتيجية والتحول التنظيمي', 'Focus on strategic initiatives and organizational alignment', 'التركيز على المبادرات الاستراتيجية والمواءمة التنظيمية', 1],
      ['it_technology', 'IT/Technology', 'تكنولوجيا المعلومات/التكنولوجيا', 'IT professionals and technology managers', 'مهنيي تكنولوجيا المعلومات ومديري التكنولوجيا', 'Technical infrastructure and data architecture', 'البنية التحتية التقنية وهندسة البيانات', 'Strengthen technical capabilities and infrastructure', 'تعزيز القدرات التقنية والبنية التحتية', 2],
      ['bi_analytics', 'BI/Analytics', 'ذكاء الأعمال/التحليلات', 'Business intelligence and analytics professionals', 'مهنيي ذكاء الأعمال والتحليلات', 'Data analysis and business insights', 'تحليل البيانات ورؤى الأعمال', 'Enhance analytical capabilities and reporting', 'تعزيز القدرات التحليلية والتقارير', 3],
      ['business_managers', 'Business Managers', 'مديري الأعمال', 'Business unit managers and department heads', 'مديري وحدات الأعمال ورؤساء الأقسام', 'Data-driven decision making and operations', 'اتخاذ القرار المبني على البيانات والعمليات', 'Improve data utilization in business processes', 'تحسين استخدام البيانات في العمليات التجارية', 4],
      ['data_governance', 'Data Governance', 'حوكمة البيانات', 'Data governance specialists and compliance officers', 'متخصصي حوكمة البيانات وموظفي الامتثال', 'Data governance policies and compliance', 'سياسات حوكمة البيانات والامتثال', 'Establish robust governance frameworks', 'إنشاء أطر حوكمة قوية', 5]
    ];

    for (const role of roles) {
      await database.execute(
        'INSERT INTO roles (id, name_en, name_ar, description_en, description_ar, focus_en, focus_ar, recommendations_en, recommendations_ar, display_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        role
      );
    }

    // Insert subdomains
    const subdomains = [
      ['data_sources', 'data_lifecycle', 'Data Sources', 'مصادر البيانات', 'Internal and external data sources', 'مصادر البيانات الداخلية والخارجية', 1],
      ['data_integration', 'data_lifecycle', 'Data Integration', 'تكامل البيانات', 'Combining data from different sources', 'دمج البيانات من مصادر مختلفة', 2],
      ['data_processing', 'data_lifecycle', 'Data Processing & Analysis', 'معالجة وتحليل البيانات', 'Processing and analyzing data', 'معالجة وتحليل البيانات', 3]
    ];

    for (const subdomain of subdomains) {
      await database.execute(
        'INSERT INTO subdomains (id, domain_id, name_en, name_ar, description_en, description_ar, display_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
        subdomain
      );
    }

    // Insert sample questions
    const questions = [
      ['Q1', 'data_sources', 'Data Source Inventory', 'جرد مصادر البيانات', 'How well does your organization maintain an inventory of all data sources?', 'ما مدى جودة احتفاظ مؤسستك بجرد لجميع مصادر البيانات؟', 'Consider internal databases, external feeds, APIs, manual data entry, and third-party sources.', 'فكر في قواعد البيانات الداخلية والتغذيات الخارجية وواجهات برمجة التطبيقات وإدخال البيانات اليدوي ومصادر الطرف الثالث.', 'database', 1, 1],
      ['Q2', 'data_integration', 'Data Integration Processes', 'عمليات تكامل البيانات', 'How mature are your data integration and ETL processes?', 'ما مدى نضج عمليات تكامل البيانات و ETL الخاصة بك؟', 'Evaluate automated data pipelines, real-time integration, and data transformation capabilities.', 'قيم خطوط البيانات الآلية والتكامل في الوقت الفعلي وقدرات تحويل البيانات.', 'shuffle', 2, 1],
      ['Q3', 'data_processing', 'Data Analysis Capabilities', 'قدرات تحليل البيانات', 'What is the sophistication level of your data analysis and processing capabilities?', 'ما هو مستوى تطور قدرات تحليل ومعالجة البيانات لديكم؟', 'Consider advanced analytics, machine learning, statistical analysis, and processing speed.', 'فكر في التحليلات المتقدمة وتعلم الآلة والتحليل الإحصائي وسرعة المعالجة.', 'trending-up', 3, 1]
    ];

    for (const question of questions) {
      await database.execute(
        'INSERT INTO questions (id, subdomain_id, title_en, title_ar, text_en, text_ar, scenario_en, scenario_ar, icon, display_order, priority) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        question
      );
    }

    // Insert question options for each question
    const questionOptions = [
      // Q1 Options
      ['Q1_1', 'Q1', '1', 'No inventory exists', 'لا يوجد جرد', 1, 'Initial', 'No systematic tracking of data sources', 'لا يوجد تتبع منهجي لمصادر البيانات', 1],
      ['Q1_2', 'Q1', '2', 'Basic manual inventory', 'جرد يدوي أساسي', 2, 'Developing', 'Manual documentation of some data sources', 'توثيق يدوي لبعض مصادر البيانات', 2],
      ['Q1_3', 'Q1', '3', 'Documented inventory with updates', 'جرد موثق مع التحديثات', 3, 'Defined', 'Regular updates to documented inventory', 'تحديثات منتظمة للجرد الموثق', 3],
      ['Q1_4', 'Q1', '4', 'Automated inventory management', 'إدارة جرد آلية', 4, 'Advanced', 'Automated discovery and cataloging', 'الاكتشاف والفهرسة الآلية', 4],
      ['Q1_5', 'Q1', '5', 'Intelligent automated system', 'نظام آلي ذكي', 5, 'Optimized', 'AI-driven data discovery and management', 'اكتشاف وإدارة البيانات المدفوعة بالذكاء الاصطناعي', 5],
      ['Q1_NA', 'Q1', 'na', 'Not Applicable', 'غير قابل للتطبيق', 0, 'N/A', 'This question does not apply', 'هذا السؤال غير قابل للتطبيق', 6],
      ['Q1_NS', 'Q1', 'ns', 'Not Sure', 'غير متأكد', 0, 'Unknown', 'Uncertain about current state', 'غير متأكد من الوضع الحالي', 7],

      // Q2 Options
      ['Q2_1', 'Q2', '1', 'Manual data movement', 'نقل البيانات اليدوي', 1, 'Initial', 'Manual processes for data integration', 'عمليات يدوية لتكامل البيانات', 1],
      ['Q2_2', 'Q2', '2', 'Basic automated tools', 'أدوات آلية أساسية', 2, 'Developing', 'Some automation in data integration', 'بعض الأتمتة في تكامل البيانات', 2],
      ['Q2_3', 'Q2', '3', 'Established ETL processes', 'عمليات ETL راسخة', 3, 'Defined', 'Standard ETL processes in place', 'عمليات ETL معيارية مطبقة', 3],
      ['Q2_4', 'Q2', '4', 'Real-time integration', 'التكامل في الوقت الفعلي', 4, 'Advanced', 'Real-time data integration capabilities', 'قدرات تكامل البيانات في الوقت الفعلي', 4],
      ['Q2_5', 'Q2', '5', 'Intelligent data pipelines', 'خطوط البيانات الذكية', 5, 'Optimized', 'Self-managing intelligent pipelines', 'خطوط البيانات الذكية ذاتية الإدارة', 5],
      ['Q2_NA', 'Q2', 'na', 'Not Applicable', 'غير قابل للتطبيق', 0, 'N/A', 'This question does not apply', 'هذا السؤال غير قابل للتطبيق', 6],
      ['Q2_NS', 'Q2', 'ns', 'Not Sure', 'غير متأكد', 0, 'Unknown', 'Uncertain about current state', 'غير متأكد من الوضع الحالي', 7],

      // Q3 Options
      ['Q3_1', 'Q3', '1', 'Basic reporting only', 'تقارير أساسية فقط', 1, 'Initial', 'Simple reporting capabilities', 'قدرات تقارير بسيطة', 1],
      ['Q3_2', 'Q3', '2', 'Standard analytics tools', 'أدوات تحليل معيارية', 2, 'Developing', 'Basic analytical capabilities', 'قدرات تحليلية أساسية', 2],
      ['Q3_3', 'Q3', '3', 'Advanced analytics', 'تحليلات متقدمة', 3, 'Defined', 'Statistical analysis and modeling', 'التحليل الإحصائي والنمذجة', 3],
      ['Q3_4', 'Q3', '4', 'Predictive analytics', 'تحليلات تنبؤية', 4, 'Advanced', 'Machine learning and predictions', 'تعلم الآلة والتنبؤات', 4],
      ['Q3_5', 'Q3', '5', 'AI-driven insights', 'رؤى مدفوعة بالذكاء الاصطناعي', 5, 'Optimized', 'Automated AI-powered analytics', 'تحليلات آلية مدعومة بالذكاء الاصطناعي', 5],
      ['Q3_NA', 'Q3', 'na', 'Not Applicable', 'غير قابل للتطبيق', 0, 'N/A', 'This question does not apply', 'هذا السؤال غير قابل للتطبيق', 6],
      ['Q3_NS', 'Q3', 'ns', 'Not Sure', 'غير متأكد', 0, 'Unknown', 'Uncertain about current state', 'غير متأكد من الوضع الحالي', 7]
    ];

    for (const option of questionOptions) {
      await database.execute(
        'INSERT INTO question_options (id, question_id, option_key, option_text_en, option_text_ar, score_value, maturity_level, explanation_en, explanation_ar, display_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        option
      );
    }

    // Ensure TEST001 code exists
    await database.execute(
      'INSERT IGNORE INTO assessment_codes (code, organization_name, intended_recipient, created_by, expires_at, assessment_type) VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY), ?)',
      ['TEST001', 'Test Organization', 'Test User', 'admin', 'full']
    );

    return NextResponse.json({
      success: true,
      message: 'Database populated successfully with sample data'
    });

  } catch (error) {
    console.error('Error populating database:', error);
    return NextResponse.json({
      success: false,
      error: `Failed to populate database: ${error.message}`
    }, { status: 500 });
  }
}