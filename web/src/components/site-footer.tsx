import { Button } from "@/components/ui/button";
import AuthButton from "@/components/auth-button";
import Link from "next/link";

interface SiteFooterProps {
  title?: string;
  description?: string;
  variant?: "default" | "accent";
}

export default function SiteFooter({ 
  title = "準備開始您的推理之旅？",
  description = "瀏覽我們的劇本選擇，或直接預約您的遊戲時段",
  variant = "default"
}: SiteFooterProps) {
  const isAccentVariant = variant === "accent";
  
  return (
    <section className={isAccentVariant ? "" : "py-16"}>
      <div className={`container mx-auto px-4 text-center ${
        isAccentVariant 
          ? "mt-12 bg-accent p-8 rounded-lg" 
          : ""
      }`}>
        <h2 className={`font-bold mb-6 ${
          isAccentVariant 
            ? "text-2xl text-accent-foreground mb-4" 
            : "text-3xl"
        }`}>
          {title}
        </h2>
        <p className={`mb-8 max-w-2xl mx-auto ${
          isAccentVariant 
            ? "text-accent-foreground/80 mb-6" 
            : "text-xl text-muted-foreground"
        }`}>
          {description}
        </p>
        <div className="flex gap-4 justify-center">
          <AuthButton size="lg" loginText="立即預約">
            <Button asChild size="lg">
              <Link href="/booking">立即預約</Link>
            </Button>
          </AuthButton>
          <Button asChild size="lg" variant="outline">
            <Link href="/games">瀏覽劇本</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}