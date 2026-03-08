"use client";

import { useState, useEffect } from "react";
import { useForm } from "@tanstack/react-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScriptCombobox } from "@/components/script-combobox";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle } from "lucide-react";
import LoginDialog from "@/components/login-dialog";
import { useAuth } from "@/lib/auth-context";
import { useScripts, useBookingInfo, useSubmitBooking } from "@/hooks/use-scripts";
import { LogIn, Calendar, Users } from "lucide-react";

type BookingFormData = {
  name: string;
  phone: string;
  email: string;
  script: string;
  date: string;
  time: string;
  players: string;
  notes: string;
};

export default function BookingPage() {
  const [minDate, setMinDate] = useState("");
  const [currentScript, setCurrentScript] = useState("");
  const [bookingResult, setBookingResult] = useState<{ success: boolean; message: string } | null>(null);
  const { user, loading: authLoading } = useAuth();

  const { data: scripts, isLoading: scriptsLoading, error: scriptsError } = useScripts();
  const { data: bookingInfo, isLoading: bookingInfoLoading } = useBookingInfo();
  const submitBookingMutation = useSubmitBooking();

  // TanStack Form setup
  const form = useForm({
    defaultValues: {
      name: user?.user_metadata?.full_name || "",
      phone: user?.user_metadata?.phone || "",
      email: user?.email || "",
      script: "",
      date: "",
      time: "",
      players: "",
      notes: ""
    } as BookingFormData,
    onSubmit: async ({ value }) => {
      try {
        const response = await submitBookingMutation.mutateAsync(value);
        if (response.success) {
          setBookingResult({ success: true, message: `${response.message}　預約編號：${response.bookingId}` });
          form.reset();
        } else {
          setBookingResult({ success: false, message: response.message });
        }
      } catch (error) {
        setBookingResult({ success: false, message: "預約送出時發生錯誤，請稍後再試或直接撥打客服專線。" });
        console.error("Booking submission error:", error);
      }
    }
  });

  useEffect(() => {
    // 設定最小日期為今天+3天
    const today = new Date();
    const minBookingDate = new Date(today);
    minBookingDate.setDate(today.getDate() + 3);
    const minDateString = minBookingDate.toISOString().split('T')[0];
    
    setMinDate(minDateString);
    
    // 設定預設日期也是今天+3天
    form.setFieldValue('date', minDateString);
  }, [form]);

  // Update current script and reset time when script changes
  const updateCurrentScript = (script: string) => {
    setCurrentScript(script);
    form.setFieldValue('time', '');
  };

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background py-8 flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 mx-auto mb-4 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">載入中...</p>
        </div>
      </div>
    );
  }

  // Show login requirement if user is not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">線上預約</h1>
            <p className="text-xl text-muted-foreground">
              預約劇本殺體驗，開始您的推理之旅
            </p>
          </div>

          <Card className="text-center py-12">
            <CardContent className="space-y-6">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <LogIn className="h-8 w-8 text-primary" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold">需要登入才能預約</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  為了確保預約資料的準確性和安全性，請先登入或註冊您的帳號
                </p>
              </div>

              <div className="space-y-4">
                <LoginDialog>
                  <Button size="lg" className="w-full max-w-xs">
                    <LogIn className="mr-2 h-5 w-5" />
                    登入 / 註冊
                  </Button>
                </LoginDialog>
                
                <div className="text-sm text-muted-foreground">
                  <p>登入後即可享受：</p>
                  <div className="flex justify-center gap-6 mt-2">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>快速預約</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>預約記錄</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">線上預約</h1>
          <p className="text-xl text-muted-foreground mb-4">
            填寫以下資訊完成預約，我們將盡快與您聯繫確認
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-sm">
            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
            <span>歡迎，{user.user_metadata?.full_name || user.email?.split('@')[0]}！</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>預約資訊</CardTitle>
                <CardDescription>請詳細填寫以下資訊</CardDescription>
              </CardHeader>
              <CardContent>
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    void form.handleSubmit();
                  }} 
                  className="space-y-6"
                >
                  <div className="grid md:grid-cols-2 gap-4">
                    <form.Field
                      name="name"
                      validators={{
                        onChange: ({ value }) => 
                          !value ? "請輸入姓名" : undefined
                      }}
                    >
                      {(field) => (
                        <div>
                          <Label htmlFor={field.name} className="mb-2 block">姓名 *</Label>
                          <Input
                            id={field.name}
                            name={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder="請輸入您的姓名"
                            className={field.state.meta.errors.length > 0 ? "border-destructive" : ""}
                          />
                          {field.state.meta.errors.length > 0 && (
                            <p className="text-sm text-destructive mt-1">{field.state.meta.errors[0]}</p>
                          )}
                        </div>
                      )}
                    </form.Field>
                    
                    <form.Field
                      name="phone"
                      validators={{
                        onChange: ({ value }) => 
                          !value ? "請輸入聯絡電話" : undefined
                      }}
                    >
                      {(field) => (
                        <div>
                          <Label htmlFor={field.name} className="mb-2 block">聯絡電話 *</Label>
                          <Input
                            id={field.name}
                            name={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder="請輸入聯絡電話"
                            className={field.state.meta.errors.length > 0 ? "border-destructive" : ""}
                          />
                          {field.state.meta.errors.length > 0 && (
                            <p className="text-sm text-destructive mt-1">{field.state.meta.errors[0]}</p>
                          )}
                        </div>
                      )}
                    </form.Field>
                  </div>

                  <form.Field
                    name="email"
                  >
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name} className="mb-2 block">電子信箱</Label>
                        <Input
                          id={field.name}
                          name={field.name}
                          type="email"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="選填，用於接收確認信"
                        />
                      </div>
                    )}
                  </form.Field>

                  <form.Field
                    name="script"
                    validators={{
                      onChange: ({ value }) => 
                        !value ? "請選擇劇本" : undefined
                    }}
                  >
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name} className="mb-2 block">劇本選擇 *</Label>
                        
                        {/* Loading State */}
                        {scriptsLoading && (
                          <Skeleton className="h-10 w-full" />
                        )}
                        
                        {/* Error State */}
                        {scriptsError && (
                          <div className="text-sm text-destructive">
                            載入劇本列表失敗，請重新整理頁面
                          </div>
                        )}
                        
                        {/* Script Selection */}
                        {scripts && !scriptsLoading && (
                          <ScriptCombobox
                            scripts={scripts}
                            value={field.state.value}
                            onValueChange={(value) => {
                              field.handleChange(value);
                              updateCurrentScript(value);
                            }}
                            placeholder="選擇劇本"
                            className={field.state.meta.errors.length > 0 ? "border-destructive" : ""}
                          />
                        )}
                        
                        {field.state.meta.errors.length > 0 && (
                          <p className="text-sm text-destructive mt-1">{field.state.meta.errors[0]}</p>
                        )}
                      </div>
                    )}
                  </form.Field>

                  <div className="grid md:grid-cols-2 gap-4">
                    <form.Field
                      name="date"
                      validators={{
                        onChange: ({ value }) => 
                          !value ? "請選擇預約日期" : undefined
                      }}
                    >
                      {(field) => (
                        <div>
                          <Label htmlFor={field.name} className="mb-2 block">預約日期 *</Label>
                          <Input
                            id={field.name}
                            name={field.name}
                            type="date"
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            min={minDate}
                            className={field.state.meta.errors.length > 0 ? "border-destructive" : ""}
                          />
                          {field.state.meta.errors.length > 0 && (
                            <p className="text-sm text-destructive mt-1">{field.state.meta.errors[0]}</p>
                          )}
                        </div>
                      )}
                    </form.Field>
                    
                    <form.Field
                      name="time"
                      validators={{
                        onChange: ({ value }) => 
                          !value ? "請選擇時段" : undefined
                      }}
                    >
                      {(field) => (
                        <div>
                          <Label htmlFor={field.name} className="mb-2 block">時段 *</Label>
                          
                          <Select
                            value={field.state.value}
                            onValueChange={(value) => field.handleChange(value)}
                          >
                            <SelectTrigger className={field.state.meta.errors.length > 0 ? "border-destructive" : ""}>
                              <SelectValue placeholder="選擇時段" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="14:00-17:00">14:00-17:00 下午場</SelectItem>
                              <SelectItem value="14:00-18:00">14:00-18:00 下午場</SelectItem>
                              <SelectItem value="18:00-22:00">18:00-22:00 晚間場</SelectItem>
                              <SelectItem value="19:00-22:00">19:00-22:00 晚間場</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          {field.state.meta.errors.length > 0 && (
                            <p className="text-sm text-destructive mt-1">{field.state.meta.errors[0]}</p>
                          )}
                        </div>
                      )}
                    </form.Field>
                  </div>

                  <form.Field
                    name="players"
                    validators={{
                      onChange: ({ value }) => {
                        if (!value) return "請輸入遊戲人數";
                        const num = parseInt(value);
                        if (isNaN(num)) return "請輸入有效數字";
                        if (num < 3 || num > 10) return "人數需在3-10人之間";
                        return undefined;
                      }
                    }}
                  >
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name} className="mb-2 block">遊戲人數 *</Label>
                        <Input
                          id={field.name}
                          name={field.name}
                          type="number"
                          min="3"
                          max="10"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="請輸入人數 (3-10人)"
                          className={field.state.meta.errors.length > 0 ? "border-destructive" : ""}
                        />
                        {field.state.meta.errors.length > 0 && (
                          <p className="text-sm text-destructive mt-1">{field.state.meta.errors[0]}</p>
                        )}
                      </div>
                    )}
                  </form.Field>

                  <form.Field
                    name="notes"
                  >
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name} className="mb-2 block">備註</Label>
                        <Textarea
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="如有特殊需求或備註事項，請在此說明"
                          rows={3}
                        />
                      </div>
                    )}
                  </form.Field>

                  {bookingResult && (
                    <Alert variant={bookingResult.success ? "default" : "destructive"}>
                      {bookingResult.success ? <CheckCircle2 /> : <XCircle />}
                      <AlertDescription>{bookingResult.message}</AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={submitBookingMutation.isPending}
                  >
                    {submitBookingMutation.isPending ? "送出中..." : "送出預約申請"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Selected Script Info */}
            {currentScript && scripts && (
              <Card>
                <CardHeader>
                  <CardTitle>所選劇本資訊</CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const selectedScript = scripts.find(script => 
                      `${script.title} (${script.players}, ${script.duration})` === currentScript
                    );
                    
                    if (!selectedScript) return null;
                    
                    return (
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-lg">{selectedScript.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {selectedScript.category} • {selectedScript.players} • {selectedScript.duration}
                            {selectedScript.difficulty && ` • 難度：${selectedScript.difficulty}`}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm leading-relaxed">{selectedScript.description}</p>
                        </div>
                        <div>
                          <h5 className="font-medium mb-2">遊戲特色</h5>
                          <div className="flex flex-wrap gap-1">
                            {selectedScript.features.map((feature) => (
                              <span key={feature} className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">
                                {feature}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>預約須知</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                {bookingInfoLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : bookingInfo ? (
                  <>
                    <div>
                      <h4 className="font-medium text-primary mb-2">預約流程</h4>
                      <ul className="space-y-1 text-muted-foreground">
                        {bookingInfo.policies.procedures.map((procedure, index) => (
                          <li key={index}>• {procedure}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-primary mb-2">取消政策</h4>
                      <ul className="space-y-1 text-muted-foreground">
                        {bookingInfo.policies.cancellation.map((policy, index) => (
                          <li key={index}>• {policy}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-primary mb-2">注意事項</h4>
                      <ul className="space-y-1 text-muted-foreground">
                        {bookingInfo.policies.notes.map((note, index) => (
                          <li key={index}>• {note}</li>
                        ))}
                      </ul>
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    載入預約資訊中...
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>聯絡方式</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">電話：</span>
                  <span className="text-muted-foreground">02-1234-5678</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">地址：</span>
                  <span className="text-muted-foreground">台北市大安區XX路XX號</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">營業時間：</span>
                  <span className="text-muted-foreground">每日 14:00-22:00</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}