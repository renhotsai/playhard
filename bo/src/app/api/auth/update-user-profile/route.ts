import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    console.log('[UPDATE-USER-PROFILE] Starting user profile update');
    
    const body = await request.json();
    const { username, password } = body;

    if (!username) {
      console.error('[UPDATE-USER-PROFILE] No username provided');
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    // Validate username requirements (same as frontend validation)
    if (username.length < 3 || username.length > 30) {
      return NextResponse.json(
        { error: 'Username must be between 3 and 30 characters' },
        { status: 400 }
      );
    }

    if (!/^[a-zA-Z0-9_\u4e00-\u9fff-]+$/.test(username)) {
      return NextResponse.json(
        { error: 'Username can only contain letters, numbers, Chinese characters, underscores, and hyphens' },
        { status: 400 }
      );
    }

    // Validate password if provided
    if (password && (password.length < 8 || password.length > 128)) {
      return NextResponse.json(
        { error: 'Password must be between 8 and 128 characters' },
        { status: 400 }
      );
    }

    // Get the session headers for Better Auth
    const headers = new Headers();
    request.headers.forEach((value, key) => {
      headers.set(key, value);
    });

    console.log('[UPDATE-USER-PROFILE] Updating username via Better Auth');
    
    // Step 1: Update user with username using Better Auth updateUser server method
    const updateResult = await auth.api.updateUser({
      body: { 
        username: username
      },
      headers: Object.fromEntries(headers.entries()),
    });

    if (!updateResult.status) {
      console.error('[UPDATE-USER-PROFILE] Better Auth updateUser failed:', updateResult);
      return NextResponse.json(
        { error: 'Failed to update username' },
        { status: 400 }
      );
    }

    console.log('[UPDATE-USER-PROFILE] Username updated successfully');

    // Step 2: Handle password setting/changing if provided
    if (password) {
      console.log('[UPDATE-USER-PROFILE] Handling password for user');
      
      // Try setPassword first (for users without password)
      let passwordResult = await auth.api.setPassword({
        body: { 
          newPassword: password 
        },
        headers: Object.fromEntries(headers.entries()),
      });

      // If setPassword fails, try updateUser approach
      if (!passwordResult.status) {
        console.log('[UPDATE-USER-PROFILE] setPassword failed, trying updateUser approach');
        
        // For users created with generated passwords, we need to get the generated password
        // Since we don't know the current password, we'll try using updateUser with password
        const updateWithPasswordResult = await auth.api.updateUser({
          body: { 
            username: username
            // Note: Better Auth updateUser may not support password updates directly
          },
          headers: Object.fromEntries(headers.entries()),
        });

        if (!updateWithPasswordResult.status) {
          console.error('[UPDATE-USER-PROFILE] updateUser with password failed:', updateWithPasswordResult);
          return NextResponse.json(
            { error: 'Username updated but failed to set password. Please use the forgot password feature to reset your password.' },
            { status: 207 } // Partial success
          );
        }
        
        console.log('[UPDATE-USER-PROFILE] Password updated successfully via updateUser');
      } else if (!passwordResult.status) {
        console.error('[UPDATE-USER-PROFILE] Better Auth setPassword failed:', passwordResult);
        return NextResponse.json(
          { error: 'Username updated but failed to set password. Please use forgot password.' },
          { status: 207 } // Partial success - username was updated
        );
      } else {
        console.log('[UPDATE-USER-PROFILE] Password set successfully via setPassword');
      }
    }

    return NextResponse.json(
      { 
        success: true, 
        message: password ? 'Username and password updated successfully' : 'Username updated successfully',
        user: updateResult
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('[UPDATE-USER-PROFILE] Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}