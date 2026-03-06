/**
 * Email Validation API
 * GET /api/validation/email?email={email} - Check if email is unique
 * Used for async validation in forms
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';
import { auth } from '@/lib/auth';
import { validators } from '@/lib/form-validators';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get email from query parameters
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    // Basic email format validation
    const emailError = validators.email(email);
    if (emailError) {
      return NextResponse.json(
        { 
          success: true, 
          isUnique: false, 
          error: emailError 
        }
      );
    }

    // Check if email exists in database
    const existingUser = await prisma.user.findUnique({
      where: { 
        email: email.toLowerCase().trim() 
      },
      select: { 
        id: true,
        email: true 
      }
    });

    const isUnique = !existingUser;

    return NextResponse.json({
      success: true,
      isUnique,
      message: isUnique 
        ? 'Email is available' 
        : 'Email is already in use'
    });

  } catch (error) {
    console.error('[Email Validation API] Error:', error);
    
    // Don't expose validation errors to maintain user privacy
    return NextResponse.json(
      { 
        success: true, 
        isUnique: true, // Default to true on error to not block form submission
        message: 'Unable to verify email availability'
      }
    );
  } finally {
    await prisma.$disconnect();
  }
}