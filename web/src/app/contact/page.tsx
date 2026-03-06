"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMainVenue } from "@/hooks/use-venues";

export default function ContactPage() {
  const { data: mainVenue, isLoading: isVenueLoading } = useMainVenue();
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: ""
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name) newErrors.name = "請輸入姓名";
    if (!formData.email) newErrors.email = "請輸入電子信箱";
    if (!formData.subject) newErrors.subject = "請輸入主旨";
    if (!formData.message) newErrors.message = "請輸入訊息內容";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      alert("感謝您的來信，我們將盡快回覆！");
      console.log("聯絡表單:", formData);
      setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-6">聯絡我們</h1>
          <p className="text-xl max-w-2xl mx-auto">
            有任何問題或建議嗎？我們很樂意聽到您的聲音
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        {/* Contact Form - Top */}
        <div className="mb-12">
          <Card>
            <CardHeader>
              <CardTitle>聯絡表單</CardTitle>
              <CardDescription>請填寫以下資訊，我們將盡快回覆您</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">姓名 *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      placeholder="請輸入您的姓名"
                      className={errors.name ? "border-destructive" : ""}
                    />
                    {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <Label htmlFor="phone">聯絡電話</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      placeholder="選填"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">電子信箱 *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="請輸入您的電子信箱"
                    className={errors.email ? "border-destructive" : ""}
                  />
                  {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
                </div>

                <div>
                  <Label htmlFor="subject">主旨 *</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => handleInputChange("subject", e.target.value)}
                    placeholder="請輸入主旨"
                    className={errors.subject ? "border-destructive" : ""}
                  />
                  {errors.subject && <p className="text-sm text-destructive mt-1">{errors.subject}</p>}
                </div>

                <div>
                  <Label htmlFor="message">訊息內容 *</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => handleInputChange("message", e.target.value)}
                    placeholder="請輸入您想告訴我們的內容"
                    rows={5}
                    className={errors.message ? "border-destructive" : ""}
                  />
                  {errors.message && <p className="text-sm text-destructive mt-1">{errors.message}</p>}
                </div>

                <Button type="submit" className="w-full" size="lg">
                  送出訊息
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Contact Information - Bottom Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>快速聯絡</CardTitle>
              <CardDescription>需要即時協助或有緊急問題嗎？</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isVenueLoading ? (
                <div className="space-y-4">
                  <div className="animate-pulse">
                    <div className="h-4 bg-muted rounded w-20 mb-2"></div>
                    <div className="h-4 bg-muted rounded w-32 mb-1"></div>
                    <div className="h-3 bg-muted rounded w-28"></div>
                  </div>
                  <div className="animate-pulse">
                    <div className="h-4 bg-muted rounded w-20 mb-2"></div>
                    <div className="h-4 bg-muted rounded w-40 mb-1"></div>
                    <div className="h-3 bg-muted rounded w-24"></div>
                  </div>
                </div>
              ) : mainVenue ? (
                <>
                  <div>
                    <h4 className="font-medium text-primary mb-2">客服專線</h4>
                    <p className="text-muted-foreground">{mainVenue.contact.phone}</p>
                    <p className="text-sm text-muted-foreground mt-1">營業時間內提供電話諮詢</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-primary mb-2">電子信箱</h4>
                    <p className="text-muted-foreground">{mainVenue.contact.email}</p>
                    <p className="text-sm text-muted-foreground mt-1">24小時內回覆</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-primary mb-2">地址</h4>
                    <p className="text-muted-foreground">{mainVenue.contact.address}</p>
                    <p className="text-sm text-muted-foreground mt-1">{mainVenue.contact.transportation}</p>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">載入場館資訊中...</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>社群媒體</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">Facebook</span>
                <Button variant="outline" size="sm">追蹤我們</Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Instagram</span>
                <Button variant="outline" size="sm">追蹤我們</Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">LINE官方帳號</span>
                <Button variant="outline" size="sm">加好友</Button>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}

