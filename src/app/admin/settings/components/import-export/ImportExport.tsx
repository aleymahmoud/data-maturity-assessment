'use client';

import { useState, useEffect, useRef } from 'react';
import { Upload, Download, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

interface Domain {
  id: string;
  name_en: string;
}

interface Subdomain {
  id: string;
  domain_id: string;
  name_en: string;
}

interface Question {
  id: string;
  title_en: string;
  subdomain_id: string;
  subdomain_name_en?: string;
}

interface MaturityLevel {
  id: string;
  level_number: number;
  name: string;
}

export function ImportExport() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [subdomains, setSubdomains] = useState<Subdomain[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [maturityLevels, setMaturityLevels] = useState<MaturityLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const questionsFileRef = useRef<HTMLInputElement>(null);
  const optionsFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [domainsRes, subdomainsRes, questionsRes, levelsRes] = await Promise.all([
        fetch('/api/admin/domains'),
        fetch('/api/admin/subdomains'),
        fetch('/api/admin/questions?page=1&limit=1000'),
        fetch('/api/admin/maturity-levels')
      ]);

      const domainsData = await domainsRes.json();
      const subdomainsData = await subdomainsRes.json();
      const questionsData = await questionsRes.json();
      const levelsData = await levelsRes.json();

      if (domainsData.success) setDomains(domainsData.domains);
      if (subdomainsData.success) setSubdomains(subdomainsData.subdomains);
      if (questionsData.success) setQuestions(questionsData.questions);
      if (levelsData.success) setMaturityLevels(levelsData.levels || levelsData.maturityLevels || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      showMessage('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  // Download Questions Template (Excel with dropdowns)
  const downloadQuestionsTemplate = () => {
    // Create workbook
    const wb = XLSX.utils.book_new();

    // Main data sheet with headers and example row
    const headers = [
      'Domain (Select)',
      'Subdomain (Select)',
      'Title (EN)',
      'Title (AR)',
      'Text (EN)',
      'Text (AR)',
      'Help Text (EN)',
      'Help Text (AR)',
      'Icon',
      'Display Order'
    ];

    const exampleRow = [
      domains[0]?.name_en || 'Select Domain',
      subdomains[0]?.name_en || 'Select Subdomain',
      'Question Title',
      'عنوان السؤال',
      'Full question text?',
      'نص السؤال الكامل؟',
      'Help text for the question',
      'نص المساعدة',
      '',
      '1'
    ];

    const wsData = [headers, exampleRow];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths
    ws['!cols'] = [
      { wch: 25 }, // Domain
      { wch: 25 }, // Subdomain
      { wch: 30 }, // Title EN
      { wch: 30 }, // Title AR
      { wch: 40 }, // Text EN
      { wch: 40 }, // Text AR
      { wch: 30 }, // Help EN
      { wch: 30 }, // Help AR
      { wch: 10 }, // Icon
      { wch: 15 }  // Display Order
    ];

    // Create domain list for dropdown
    const domainNames = domains.map(d => d.name_en);
    const subdomainNames = subdomains.map(s => s.name_en);

    // Add data validation for Domain column (column A, rows 2-100)
    if (domainNames.length > 0) {
      ws['!dataValidation'] = ws['!dataValidation'] || [];
      ws['!dataValidation'].push({
        sqref: 'A2:A100',
        type: 'list',
        formula1: `"${domainNames.join(',')}"`,
        showDropDown: true
      });
    }

    // Add data validation for Subdomain column (column B, rows 2-100)
    if (subdomainNames.length > 0) {
      ws['!dataValidation'].push({
        sqref: 'B2:B100',
        type: 'list',
        formula1: `"${subdomainNames.join(',')}"`,
        showDropDown: true
      });
    }

    XLSX.utils.book_append_sheet(wb, ws, 'Questions');

    // Create reference sheet with Domain-Subdomain mapping
    const refHeaders = ['Domain ID', 'Domain Name', 'Subdomain ID', 'Subdomain Name'];
    const refData = [refHeaders];

    subdomains.forEach(sub => {
      const domain = domains.find(d => d.id === sub.domain_id);
      refData.push([
        sub.domain_id,
        domain?.name_en || '',
        sub.id,
        sub.name_en
      ]);
    });

    const wsRef = XLSX.utils.aoa_to_sheet(refData);
    wsRef['!cols'] = [
      { wch: 40 },
      { wch: 30 },
      { wch: 40 },
      { wch: 30 }
    ];
    XLSX.utils.book_append_sheet(wb, wsRef, 'Reference - Domain Subdomain');

    // Download
    XLSX.writeFile(wb, 'questions_import_template.xlsx');
  };

  // Download Options Template (Excel with dropdowns)
  const downloadOptionsTemplate = () => {
    const wb = XLSX.utils.book_new();

    // Main data sheet
    const headers = [
      'Question (Select)',
      'Option Type (Select)',
      'Maturity Level (Select)',
      'Text (EN)',
      'Text (AR)',
      'Score Value',
      'Display Order'
    ];

    // Create example rows for each maturity level + NA/NS
    const wsData = [headers];

    if (questions.length > 0 && maturityLevels.length > 0) {
      // Add maturity level options
      maturityLevels.forEach((level, index) => {
        wsData.push([
          questions[0]?.title_en || 'Select Question',
          'Maturity',
          level.name,
          `Level ${level.level_number} answer text`,
          `نص الإجابة المستوى ${level.level_number}`,
          String(level.level_number),
          String(index + 1)
        ]);
      });
      // Add NA option example
      wsData.push([
        questions[0]?.title_en || 'Select Question',
        'NA',
        '',
        'Not Applicable',
        'غير منطبق',
        '0',
        String(maturityLevels.length + 1)
      ]);
      // Add NS option example
      wsData.push([
        questions[0]?.title_en || 'Select Question',
        'NS',
        '',
        'Not Sure / Don\'t Know',
        'غير متأكد / لا أعرف',
        '0',
        String(maturityLevels.length + 2)
      ]);
    } else {
      wsData.push([
        'Select Question',
        'Maturity',
        'Select Level',
        'Answer text',
        'نص الإجابة',
        '1',
        '1'
      ]);
    }

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths
    ws['!cols'] = [
      { wch: 50 }, // Question
      { wch: 15 }, // Option Type
      { wch: 20 }, // Maturity Level
      { wch: 40 }, // Text EN
      { wch: 40 }, // Text AR
      { wch: 12 }, // Score
      { wch: 15 }  // Display Order
    ];

    // Create question list for dropdown
    const questionTitles = questions.map(q => q.title_en.substring(0, 100)); // Excel has limits
    const levelNames = maturityLevels.map(l => l.name);
    const optionTypes = ['Maturity', 'NA', 'NS'];

    // Add data validation for Question column (column A, rows 2-500)
    ws['!dataValidation'] = ws['!dataValidation'] || [];
    if (questionTitles.length > 0) {
      ws['!dataValidation'].push({
        sqref: 'A2:A500',
        type: 'list',
        formula1: `"${questionTitles.slice(0, 50).join(',')}"`, // Limit due to Excel formula length
        showDropDown: true
      });
    }

    // Add data validation for Option Type column (column B, rows 2-500)
    ws['!dataValidation'].push({
      sqref: 'B2:B500',
      type: 'list',
      formula1: `"${optionTypes.join(',')}"`,
      showDropDown: true
    });

    // Add data validation for Maturity Level column (column C, rows 2-500)
    if (levelNames.length > 0) {
      ws['!dataValidation'].push({
        sqref: 'C2:C500',
        type: 'list',
        formula1: `"${levelNames.join(',')}"`,
        showDropDown: true
      });
    }

    XLSX.utils.book_append_sheet(wb, ws, 'Options');

    // Create reference sheet with Questions
    const refHeaders = ['Question ID', 'Question Title', 'Subdomain'];
    const refData = [refHeaders];

    questions.forEach(q => {
      refData.push([q.id, q.title_en, q.subdomain_name_en || '']);
    });

    const wsRef = XLSX.utils.aoa_to_sheet(refData);
    wsRef['!cols'] = [
      { wch: 40 },
      { wch: 60 },
      { wch: 30 }
    ];
    XLSX.utils.book_append_sheet(wb, wsRef, 'Reference - Questions');

    // Create reference sheet with Maturity Levels
    const levelHeaders = ['Level ID', 'Level Number', 'Level Name'];
    const levelData = [levelHeaders];

    maturityLevels.forEach(l => {
      levelData.push([l.id, String(l.level_number), l.name]);
    });

    const wsLevels = XLSX.utils.aoa_to_sheet(levelData);
    wsLevels['!cols'] = [
      { wch: 40 },
      { wch: 15 },
      { wch: 20 }
    ];
    XLSX.utils.book_append_sheet(wb, wsLevels, 'Reference - Maturity Levels');

    // Create reference sheet for Option Types
    const typeHeaders = ['Option Type', 'Description', 'Score Value'];
    const typeData = [
      typeHeaders,
      ['Maturity', 'Scored option linked to a maturity level', '1-5 based on level'],
      ['NA', 'Not Applicable - question does not apply', '0 (excluded)'],
      ['NS', 'Not Sure / Don\'t Know - uncertain response', '0 (excluded)']
    ];

    const wsTypes = XLSX.utils.aoa_to_sheet(typeData);
    wsTypes['!cols'] = [
      { wch: 15 },
      { wch: 45 },
      { wch: 25 }
    ];
    XLSX.utils.book_append_sheet(wb, wsTypes, 'Reference - Option Types');

    // Download
    XLSX.writeFile(wb, 'options_import_template.xlsx');
  };

  // Import Questions from Excel
  const handleQuestionsImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];

      // Skip header row
      const rows = jsonData.slice(1).filter(row => row.length > 0 && row[0]);

      let successCount = 0;
      let errorCount = 0;

      for (const row of rows) {
        const domainName = row[0];
        const subdomainName = row[1];
        const titleEn = row[2];
        const titleAr = row[3];
        const textEn = row[4];
        const textAr = row[5];
        const helpTextEn = row[6];
        const helpTextAr = row[7];
        const icon = row[8];
        const displayOrder = row[9];

        // Find subdomain by name
        const subdomain = subdomains.find(s => s.name_en === subdomainName);
        if (!subdomain) {
          console.error(`Subdomain not found: ${subdomainName}`);
          errorCount++;
          continue;
        }

        try {
          const response = await fetch('/api/admin/questions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              subdomain_id: subdomain.id,
              title_en: titleEn,
              title_ar: titleAr || '',
              text_en: textEn || '',
              text_ar: textAr || '',
              help_text_en: helpTextEn || '',
              help_text_ar: helpTextAr || '',
              icon: icon || '',
              display_order: parseInt(displayOrder) || 0
            })
          });

          const result = await response.json();
          if (result.success) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch {
          errorCount++;
        }
      }

      showMessage(`Import complete: ${successCount} questions added, ${errorCount} failed`, successCount > 0 ? 'success' : 'error');
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error importing questions:', error);
      showMessage('Failed to import questions', 'error');
    } finally {
      setImporting(false);
      if (questionsFileRef.current) questionsFileRef.current.value = '';
    }
  };

  // Import Options from Excel
  const handleOptionsImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];

      // Skip header row
      const rows = jsonData.slice(1).filter(row => row.length > 0 && row[0]);

      let successCount = 0;
      let errorCount = 0;

      for (const row of rows) {
        const questionTitle = row[0];
        const optionType = row[1]; // 'Maturity', 'NA', or 'NS'
        const levelName = row[2];
        const textEn = row[3];
        const textAr = row[4];
        const scoreValue = row[5];
        const displayOrder = row[6];

        // Find question by title
        const question = questions.find(q => q.title_en === questionTitle);
        if (!question) {
          console.error(`Question not found: ${questionTitle}`);
          errorCount++;
          continue;
        }

        // Check if it's a special option (NA or NS)
        const isSpecialOption = optionType === 'NA' || optionType === 'NS';

        // For maturity options, find the maturity level
        let level = null;
        if (!isSpecialOption) {
          level = maturityLevels.find(l => l.name === levelName);
          if (!level) {
            console.error(`Maturity level not found: ${levelName}`);
            errorCount++;
            continue;
          }
        }

        try {
          const response = await fetch('/api/admin/question-options', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              question_id: question.id,
              maturity_level_id: isSpecialOption ? null : level?.id,
              text: textEn || '',
              text_ar: textAr || '',
              is_special: isSpecialOption,
              special_type: isSpecialOption ? optionType : null,
              score_value: isSpecialOption ? 0 : (parseInt(scoreValue) || level?.level_number || 1),
              display_order: parseInt(displayOrder) || 0
            })
          });

          const result = await response.json();
          if (result.success) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch {
          errorCount++;
        }
      }

      showMessage(`Import complete: ${successCount} options added, ${errorCount} failed`, successCount > 0 ? 'success' : 'error');
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error importing options:', error);
      showMessage('Failed to import options', 'error');
    } finally {
      setImporting(false);
      if (optionsFileRef.current) optionsFileRef.current.value = '';
    }
  };

  if (loading) {
    return <div style={{ padding: '24px', textAlign: 'center' }}>Loading...</div>;
  }

  const sectionStyle = {
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    padding: '24px',
    marginBottom: '24px',
    border: '1px solid #e5e7eb'
  };

  const buttonStyle = {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500' as const,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px'
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: 0, marginBottom: '8px' }}>
          Import / Export Data
        </h3>
        <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
          Download Excel templates with dropdowns, fill them, and upload to import data
        </p>
      </div>

      {/* Message Display */}
      {message && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '6px',
          marginBottom: '24px',
          backgroundColor: message.type === 'success' ? '#dcfce7' : '#fee2e2',
          color: message.type === 'success' ? '#166534' : '#991b1b',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {message.text}
        </div>
      )}

      {/* Questions Import Section */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <FileSpreadsheet size={24} color="#059669" />
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: 0 }}>
              Import Questions
            </h4>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0 0' }}>
              Template includes Domain and Subdomain dropdown lists
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={downloadQuestionsTemplate}
            style={{
              ...buttonStyle,
              backgroundColor: '#059669',
              color: 'white'
            }}
          >
            <Download size={16} />
            Download Template
          </button>

          <input
            ref={questionsFileRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleQuestionsImport}
            style={{ display: 'none' }}
          />
          <button
            onClick={() => questionsFileRef.current?.click()}
            disabled={importing}
            style={{
              ...buttonStyle,
              backgroundColor: importing ? '#9ca3af' : '#2563eb',
              color: 'white',
              cursor: importing ? 'not-allowed' : 'pointer'
            }}
          >
            <Upload size={16} />
            {importing ? 'Importing...' : 'Upload Excel File'}
          </button>
        </div>
      </div>

      {/* Options Import Section */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <FileSpreadsheet size={24} color="#7c3aed" />
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: 0 }}>
              Import Answer Options
            </h4>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0 0' }}>
              Template includes Question and Maturity Level dropdown lists
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={downloadOptionsTemplate}
            style={{
              ...buttonStyle,
              backgroundColor: '#7c3aed',
              color: 'white'
            }}
          >
            <Download size={16} />
            Download Template
          </button>

          <input
            ref={optionsFileRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleOptionsImport}
            style={{ display: 'none' }}
          />
          <button
            onClick={() => optionsFileRef.current?.click()}
            disabled={importing}
            style={{
              ...buttonStyle,
              backgroundColor: importing ? '#9ca3af' : '#2563eb',
              color: 'white',
              cursor: importing ? 'not-allowed' : 'pointer'
            }}
          >
            <Upload size={16} />
            {importing ? 'Importing...' : 'Upload Excel File'}
          </button>
        </div>
      </div>

      {/* Reference Info */}
      <div style={{
        backgroundColor: '#eff6ff',
        borderRadius: '8px',
        padding: '16px',
        border: '1px solid #bfdbfe'
      }}>
        <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#1e40af', margin: '0 0 8px 0' }}>
          How to use templates
        </h4>
        <ul style={{ fontSize: '13px', color: '#1e40af', margin: 0, paddingLeft: '20px' }}>
          <li>Download the template - it contains dropdown lists in the first columns</li>
          <li>Select values from dropdowns or type matching names</li>
          <li>Reference sheets contain ID mappings if needed</li>
          <li>Fill in the remaining columns and save the file</li>
          <li>Upload the completed Excel file to import</li>
        </ul>
      </div>
    </div>
  );
}
