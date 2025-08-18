// src/app/api/get-questions-by-code/route.js
import { NextResponse } from 'next/server';
import { getFirstUnansweredQuestionByCode, getUnansweredQuestionsByCode } from '../../../lib/database.js';

export async function POST(request) {
  try {
    const { code } = await request.json();
    
    if (!code) {
      return NextResponse.json({
        success: false,
        error: 'Assessment code is required'
      }, { status: 400 });
    }

    // Get first unanswered question for this code
    const result = await getFirstUnansweredQuestionByCode(code);
    
    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      questionNumber: result.questionNumber,
      code: result.code,
      totalAnswered: result.totalAnswered,
      totalQuestions: result.totalQuestions,
      completed: result.completed || false
    });
  } catch (error) {
    console.error('Error getting questions by code:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process request'
    }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    // Get code from URL parameter
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    
    if (!code) {
      return NextResponse.json({
        success: false,
        error: 'Assessment code is required'
      }, { status: 400 });
    }

    // Get all unanswered questions for this code
    const result = await getUnansweredQuestionsByCode(code);
    
    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      code: result.code,
      unansweredQuestions: result.unansweredQuestions,
      totalUnanswered: result.totalUnanswered,
      totalQuestions: result.totalQuestions
    });
  } catch (error) {
    console.error('Error getting unanswered questions:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process request'
    }, { status: 500 });
  }
}