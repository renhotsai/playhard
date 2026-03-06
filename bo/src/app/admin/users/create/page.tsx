"use client";

import { AdminCreateUserForm } from "@/components/forms/admin-create-user-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

/**
 * Admin Create User Page
 * Demonstrates the comprehensive TanStack Form implementation
 */
export default function AdminCreateUserPage() {
  const router = useRouter();

  const handleSuccess = (data: any) => {
    console.log('User created successfully:', data);
    // Navigate back to users list
    router.push('/admin/users');
  };

  const handleCancel = () => {
    router.push('/admin/users');
  };

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Create New User</h1>
          <p className="text-muted-foreground">
            Add a new user to the murder mystery platform with appropriate role assignment.
          </p>
        </div>
      </div>

      {/* Form */}
      <AdminCreateUserForm 
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
}