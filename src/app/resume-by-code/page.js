'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function ResumeByCodePage() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const language = searchParams.get('lang') || 'en';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/get-questions-by-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Failed to validate code');
        setLoading(false);
        return;
      }

      if (data.completed) {
        setError('This assessment has been completed. No unanswered questions remaining.');
        setLoading(false);
        return;
      }

      // Redirect to the assessment page with the question number and code
      router.push(`/assessment?question=${data.questionNumber}&code=${code}&lang=en`);
    } catch (error) {
      console.error('Error validating code:', error);
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  // Language-specific content
  const getContent = () => {
    const content = {
      en: {
        title: 'Resume Assessment',
        subtitle: 'Enter your assessment code to resume where you left off.',
        codeLabel: 'Assessment Code',
        buttonText: loading ? 'Checking...' : 'Continue Assessment',
        backLink: 'Back to Home',
        language: 'Language:'
      },
      ar: {
        title: 'استئناف التقييم',
        subtitle: 'أدخل رمز التقييم الخاص بك للمتابعة من حيث توقفت.',
        codeLabel: 'رمز التقييم',
        buttonText: loading ? 'جاري التحقق...' : 'متابعة التقييم',
        backLink: 'العودة إلى الصفحة الرئيسية',
        language: 'اللغة:'
      }
    };
    return content[language] || content.en;
  };

  const content = getContent();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-2">{content.title}</h1>
        <p className="text-center mb-4">{content.subtitle}</p>

        {error && (
          <div className="p-3 mb-4 text-red-700 bg-red-100 border border-red-400 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="code" className="block mb-2">{content.codeLabel}</label>
            <input
              id="code"
              type="text"
              className="w-full p-2 border rounded"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="w-full p-2 text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-gray-400"
            disabled={loading || !code}
          >
            {content.buttonText}
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link href={`/?lang=${language}`} className="text-blue-600 hover:underline">
            {content.backLink}
          </Link>
        </div>

        <div className="mt-4 text-center">
          <span>{content.language} </span>
          <Link href={`/resume-by-code?lang=en`} className={`mx-1 ${language === 'en' ? 'font-bold' : ''}`}>English</Link> | 
          <Link href={`/resume-by-code?lang=ar`} className={`mx-1 ${language === 'ar' ? 'font-bold' : ''}`}>العربية</Link>
        </div>
      </div>
    </div>
  );
}