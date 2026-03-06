import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isSystemAdmin } from '@/lib/permissions';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: 'No session found' }, { status: 401 });
    }

    const debugInfo = {
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
      },
      permissions: {
        isSystemAdmin: isSystemAdmin(session.user.role),
      },
      session: {
        sessionId: session.sessionId,
        expires: session.expiresAt,
      }
    };

    return NextResponse.json(debugInfo);
  } catch (error) {
    console.error('Debug current user error:', error);
    return NextResponse.json({ 
      error: 'Failed to get current user info',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}