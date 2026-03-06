"use client";

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { signIn, signUp } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert } from "@/components/ui/alert";
import { Eye, EyeOff } from "lucide-react";

interface LoginDialogProps {
  children: React.ReactNode;
}

export default function LoginDialog({ children }: LoginDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("signin");

  const loginForm = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      setLoading(true);
      setError("");
      try {
        const result = await signIn.email({
          email: value.email,
          password: value.password,
        });
        
        if (result.error) {
          setError(result.error.message || "登入失敗");
        } else {
          setOpen(false);
        }
      } catch (err) {
        setError("發生未預期的錯誤");
      } finally {
        setLoading(false);
      }
    },
  });

  const registerForm = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    onSubmit: async ({ value }) => {
      setLoading(true);
      setError("");
      
      if (value.password !== value.confirmPassword) {
        setError("密碼不一致");
        setLoading(false);
        return;
      }
      
      try {
        const result = await signUp.email({
          name: value.name,
          email: value.email,
          password: value.password,
        });
        
        if (result.error) {
          setError(result.error.message || "註冊失敗");
        } else {
          setActiveTab("signin");
          setError("");
        }
      } catch (err) {
        setError("發生未預期的錯誤");
      } finally {
        setLoading(false);
      }
    },
  });

  const resetForm = () => {
    setError("");
    setShowPassword(false);
    setActiveTab("signin");
    loginForm.reset();
    registerForm.reset();
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) {
        resetForm();
      }
    }}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">歡迎來到玩硬劇本館</DialogTitle>
          <DialogDescription className="text-center">
            登入您的帳號或建立新帳號以開始預約
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">登入</TabsTrigger>
            <TabsTrigger value="signup">註冊</TabsTrigger>
          </TabsList>

          {error && (
            <Alert variant="destructive" className="mt-4">
              {error}
            </Alert>
          )}
          
          <TabsContent value="signin" className="space-y-4 mt-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                loginForm.handleSubmit();
              }}
              className="space-y-4"
            >
              <loginForm.Field
                name="email"
                validators={{
                  onChange: ({ value }) =>
                    !value ? "信箱為必填" : 
                    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? "信箱格式不正確" : 
                    undefined,
                }}
              >
                {(field) => (
                  <div>
                    <Label htmlFor="signin-email" className="mb-2 block">信箱 *</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="請輸入您的信箱"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                    />
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-red-600 mt-1">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </loginForm.Field>

              <loginForm.Field
                name="password"
                validators={{
                  onChange: ({ value }) =>
                    !value ? "密碼為必填" : 
                    value.length < 6 ? "密碼至少需要6個字元" : 
                    undefined,
                }}
              >
                {(field) => (
                  <div>
                    <Label htmlFor="signin-password" className="mb-2 block">密碼 *</Label>
                    <div className="relative">
                      <Input
                        id="signin-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="請輸入您的密碼"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-red-600 mt-1">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </loginForm.Field>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "登入中..." : "登入"}
              </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="signup" className="space-y-4 mt-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                registerForm.handleSubmit();
              }}
              className="space-y-4"
            >
              <registerForm.Field
                name="name"
                validators={{
                  onChange: ({ value }) =>
                    !value ? "姓名為必填" : 
                    value.length < 2 ? "姓名至少需要2個字元" : 
                    undefined,
                }}
              >
                {(field) => (
                  <div>
                    <Label htmlFor="signup-name" className="mb-2 block">姓名 *</Label>
                    <Input
                      id="signup-name"
                      placeholder="請輸入您的姓名"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                    />
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-red-600 mt-1">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </registerForm.Field>

              <registerForm.Field
                name="email"
                validators={{
                  onChange: ({ value }) =>
                    !value ? "信箱為必填" : 
                    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? "信箱格式不正確" : 
                    undefined,
                }}
              >
                {(field) => (
                  <div>
                    <Label htmlFor="signup-email" className="mb-2 block">信箱 *</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="請輸入您的信箱"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                    />
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-red-600 mt-1">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </registerForm.Field>

              <registerForm.Field
                name="password"
                validators={{
                  onChange: ({ value }) =>
                    !value ? "密碼為必填" : 
                    value.length < 6 ? "密碼至少需要6個字元" : 
                    undefined,
                }}
              >
                {(field) => (
                  <div>
                    <Label htmlFor="signup-password" className="mb-2 block">密碼 *</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="請輸入密碼 (至少6個字元)"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-red-600 mt-1">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </registerForm.Field>

              <registerForm.Field
                name="confirmPassword"
                validators={{
                  onChange: ({ value }) =>
                    !value ? "確認密碼為必填" : 
                    undefined,
                }}
              >
                {(field) => (
                  <div>
                    <Label htmlFor="signup-confirmPassword" className="mb-2 block">確認密碼 *</Label>
                    <Input
                      id="signup-confirmPassword"
                      type="password"
                      placeholder="請再次輸入密碼"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                    />
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-red-600 mt-1">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </registerForm.Field>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "註冊中..." : "建立帳號"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}