import { RoleSelectDemo } from "@/components/forms/role-select-demo";

export default function RoleSelectDemoPage() {
  return (
    <div className="container py-8">
      <RoleSelectDemo 
        onSubmit={(data) => {
          // In a real implementation, this would call your API
          console.log("Demo form submitted:", data);
          alert(`User created with role: ${data.role}`);
        }}
      />
    </div>
  );
}