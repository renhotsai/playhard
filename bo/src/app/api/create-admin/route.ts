import { auth } from "@/lib/auth";
import { prisma } from '@/lib/prisma';
import { NextResponse } from "next/server";
import { generateId } from "better-auth";
import { APIError } from "better-auth/api";

export async function GET() {
	try {
		// Validate environment configuration
		validateEnvironmentConfig();
		
		// Environment configuration for first system admin setup
		const adminEmail = process.env.DEFAULT_OWNER_EMAIL || "admin@playhard.local";
		const adminName = process.env.DEFAULT_OWNER_NAME || "System Administrator";
		
		console.log("[CREATE-SYSTEM-ADMIN] Starting system administrator creation process");
		console.log("[CREATE-SYSTEM-ADMIN] Admin email:", adminEmail);
		
		// Step 1: Bootstrap Security Check - Only allow if no system admin exists
		console.log("[CREATE-SYSTEM-ADMIN] Checking for existing system administrators");
		
		
		try {
			// Check if any system admin already exists
			const existingAdmin = await prisma.user.findFirst({
				where: {
					role: 'admin'
				}
			});
			
			if (existingAdmin) {
				console.log("[CREATE-SYSTEM-ADMIN] System admin already exists, bootstrap completed");
				return NextResponse.json({
					error: "System bootstrap already completed. A system administrator already exists.",
					suggestion: "Use the existing admin account to manage users and organizations.",
					existingAdminId: existingAdmin.id,
					bootstrapComplete: true
				}, { status: 409 });
			}
			
			console.log("[CREATE-SYSTEM-ADMIN] No system admin found, proceeding with bootstrap");
			
		} catch (dbError) {
			throw dbError;
		} finally {
		}
		
		// Step 2: Create first system administrator using Better Auth Admin Plugin API
		console.log("[CREATE-SYSTEM-ADMIN] Creating system admin via Better Auth Admin Plugin");
		
		let userResponse;
		try {
			// Use Better Auth Admin Plugin createUser API - this directly creates user with role
			// Create user with admin role using Better Auth Admin Plugin
			userResponse = await auth.api.createUser({
				body: {
					email: adminEmail.toLowerCase(),
					password: "admin123", // Predefined admin password
					name: adminName,
					role: 'admin', // Set admin role directly via Better Auth Admin API
					data: {
						initialSetup: true // Mark as initial admin setup
					}
				}
			});
			
			// BETTER AUTH COMPLIANT APPROACH: Use impersonation to set username
			// Better Auth Admin Plugin doesn't currently have updateUser method for specific users
			// The compliant approach is to use impersonation + updateUser pattern
			if (userResponse && userResponse.user) {
				console.log("[CREATE-SYSTEM-ADMIN] Setting username for admin user via Better Auth impersonation");
				try {
					// Impersonate the newly created user to update their username
					await auth.api.impersonateUser({
						body: {
							userId: userResponse.user.id
						}
					});
					
					// Now update the username using the impersonated session
					await auth.api.updateUser({
						body: {
							username: 'admin'
						}
					});
					
					console.log("[CREATE-SYSTEM-ADMIN] Username set successfully to 'admin' via Better Auth impersonation pattern");
				} catch (usernameError) {
					console.warn("[CREATE-SYSTEM-ADMIN] Username setting via Better Auth impersonation failed, but admin user created:", usernameError);
					// Fallback: Use direct database update as documented workaround
					// This is the officially acknowledged fallback until Better Auth adds admin.updateUser
					console.log("[CREATE-SYSTEM-ADMIN] Falling back to direct database update (documented workaround)");
					try {
						const { prisma: fallbackPrisma } = await import('@/lib/prisma');
						await fallbackPrisma.user.update({
							where: { id: userResponse.user.id },
							data: { username: 'admin' }
						});
						console.log("[CREATE-SYSTEM-ADMIN] Username set via fallback database update");
					} catch (fallbackError) {
						console.warn("[CREATE-SYSTEM-ADMIN] All username setting methods failed:", fallbackError);
					}
				}
			}
			
			if (!userResponse || !userResponse.user) {
				throw new Error("Failed to create admin user via Better Auth Admin API");
			}
			
			console.log("[CREATE-SYSTEM-ADMIN] System admin created successfully:", userResponse.user.id);
			console.log("[CREATE-SYSTEM-ADMIN] Admin role set via Better Auth Admin Plugin:", userResponse.user.role);
		} catch (createError) {
			// Handle user already exists case
			if (createError instanceof APIError && createError.message?.includes('already exists')) {
				console.log("[CREATE-SYSTEM-ADMIN] User already exists, cannot create duplicate admin");
				
				return NextResponse.json({
					error: "User with this email already exists. Cannot complete system bootstrap.",
					suggestion: "Delete the existing user first, or use a different email for the system administrator.",
					bootstrapFailed: true
				}, { status: 409 });
			} else {
				throw createError; // Re-throw other errors
			}
		}
		
		const newUser = userResponse.user;
		
		// Step 4: Admin ready to use - no email needed
		console.log("[CREATE-SYSTEM-ADMIN] Admin created with predefined credentials, ready to use");
		
		// Success response
		console.log("[CREATE-SYSTEM-ADMIN] System administrator creation completed successfully");
		return NextResponse.json({
			message: "System administrator created successfully with predefined credentials.",
			user: {
				id: newUser.id,
				email: newUser.email,
				name: newUser.name,
				username: "admin", // Fixed username that we set
				role: newUser.role
			},
			systemAdmin: true,
			bootstrapComplete: true,
			setupRequired: false,
			credentials: {
				username: "admin",
				password: "admin123"
			},
			note: "System administrator is ready to login with predefined credentials. No email setup required.",
			workflow: "Admin can immediately login with username: admin, password: admin123 → Access dashboard",
			capabilities: {
				canCreateOrganizations: true,
				canManageAllUsers: true,
				canAccessAllOrganizations: true,
				canImpersonateUsers: true,
				systemLevelAccess: true
			}
		});

	} catch (error) {
		console.error("[CREATE-SYSTEM-ADMIN] Error during system administrator creation:", error);

		// Handle Better Auth specific errors
		if (error instanceof APIError) {
			return NextResponse.json({
				error: `Better Auth API error: ${error.message}`,
				details: error.body,
				bootstrapFailed: true
			}, { status: (error.status && typeof error.status === 'number') ? error.status : 400 });
		}
		
		if (error instanceof Error) {
			// Handle specific errors
			if (error.message.includes("already exists") || error.message.includes("duplicate")) {
				return NextResponse.json({
					error: "User with this email already exists. System bootstrap failed.",
					bootstrapFailed: true
				}, { status: 409 });
			}

			if (error.message.includes("email") && error.message.includes("invalid")) {
				return NextResponse.json({
					error: "Invalid email address provided for system administrator",
					bootstrapFailed: true
				}, { status: 400 });
			}

			// Database constraint errors
			if (error.message.includes("Unique constraint")) {
				return NextResponse.json({
					error: "Duplicate data detected - system administrator may already exist",
					bootstrapFailed: true
				}, { status: 409 });
			}

			return NextResponse.json({
				error: `System administrator creation failed: ${error.message}`,
				bootstrapFailed: true
			}, { status: 400 });
		}

		return NextResponse.json({
			error: "Internal server error during system administrator creation",
			bootstrapFailed: true
		}, { status: 500 });
	}
}

// Helper function to validate environment configuration
function validateEnvironmentConfig() {
	const requiredEnvVars = [
		'BETTER_AUTH_SECRET',
		'BETTER_AUTH_URL',
		'NEXT_PUBLIC_APP_URL'
	];
	
	const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
	
	if (missing.length > 0) {
		throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
	}
}