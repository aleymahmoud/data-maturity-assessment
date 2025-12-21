import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma.js';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('lang') || 'en';
    const assessmentCode = searchParams.get('code');

    // Get snapshotted question list from assessment code
    let questionList = [];
    if (assessmentCode) {
      const codeData = await prisma.assessmentCode.findUnique({
        where: { code: assessmentCode },
        select: { questionList: true, assessmentType: true }
      });

      if (codeData && codeData.questionList) {
        // Handle question_list - can be JSON array, comma-separated string, or already parsed array
        if (Array.isArray(codeData.questionList)) {
          questionList = codeData.questionList;
        } else if (typeof codeData.questionList === 'string') {
          const listStr = codeData.questionList.trim();
          if (listStr.startsWith('[')) {
            // It's a JSON string
            questionList = JSON.parse(listStr);
          } else if (listStr.length > 0) {
            // It's a comma-separated string
            questionList = listStr.split(',').map(q => q.trim()).filter(q => q.length > 0);
          }
        }
      }
    }

    // If no question list found, fall back to all questions (for backward compatibility)
    if (questionList.length === 0) {
      const allQuestions = await prisma.question.findMany({
        select: { code: true },
        orderBy: { displayOrder: 'asc' }
      });
      questionList = allQuestions.map(q => q.code).filter(Boolean);
    }

    // Get only the snapshotted questions - search by code (Q1, Q2, etc.) not by id
    let questions = [];
    if (questionList.length > 0) {
      questions = await prisma.question.findMany({
        where: { code: { in: questionList } },
        select: {
          id: true,
          code: true,
          subdomainId: true,
          title: true,
          titleAr: true,
          text: true,
          textAr: true,
          helpText: true,
          helpTextAr: true,
          icon: true,
          displayOrder: true
        },
        orderBy: { displayOrder: 'asc' }
      });
    }

    // Get options for each question from the answer_options table
    const questionsWithOptions = await Promise.all(
      questions.map(async (question) => {
        // Get options from answer_options table
        const options = await prisma.answerOption.findMany({
          where: { questionId: question.id },
          select: {
            id: true,
            text: true,
            textAr: true,
            scoreValue: true,
            displayOrder: true,
            isSpecial: true,
            specialType: true,
            maturityLevel: {
              select: {
                levelNumber: true,
                name: true
              }
            }
          },
          orderBy: [
            { displayOrder: 'asc' },
            { scoreValue: 'asc' }
          ]
        });

        // Separate regular options from special options (NA/NS)
        const regularOptions = options.filter(opt => !opt.isSpecial && opt.specialType !== 'NA' && opt.specialType !== 'NS');
        const specialOptions = options.filter(opt => opt.isSpecial || opt.specialType === 'NA' || opt.specialType === 'NS');

        // Shuffle regular options randomly
        const shuffledRegular = regularOptions.sort(() => Math.random() - 0.5);

        // Combine: shuffled regular options + special options at end
        const allOptions = [...shuffledRegular, ...specialOptions];

        return {
          id: question.id,
          subdomain: question.subdomainId,
          title: language === 'ar' ? (question.titleAr || question.title) : question.title,
          question: language === 'ar' ? (question.textAr || question.text) : question.text,
          scenario: language === 'ar' ? (question.helpTextAr || question.helpText) : question.helpText,
          icon: question.icon || '📋',
          options: allOptions.map(opt => {
            // Handle special options (NA/NS)
            if (opt.isSpecial || opt.specialType === 'NA' || opt.specialType === 'NS') {
              return {
                value: opt.specialType === 'NA' ? 'na' : opt.specialType === 'NS' ? 'ns' : opt.scoreValue,
                text: language === 'ar' ? (opt.textAr || opt.text) : opt.text
              };
            }
            // Regular maturity level options
            return {
              value: opt.scoreValue,
              text: language === 'ar' ? (opt.textAr || opt.text) : opt.text
            };
          })
        };
      })
    );

    return NextResponse.json({
      success: true,
      questions: questionsWithOptions,
      language: language
    });

  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch questions',
      details: error.message
    }, { status: 500 });
  }
}
