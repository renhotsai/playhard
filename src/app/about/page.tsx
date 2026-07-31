import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import { businessInfo } from "@/lib/business-info";

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto px-4 py-16 w-full text-center">
        <h1 className="text-3xl font-bold font-heading text-gold mb-2">{businessInfo.name}</h1>
        <p className="text-white/60 mb-10">單專業「劇本殺」遊戲體驗服務</p>

        <div className="bg-surface border border-white/10 rounded-lg p-8 text-left space-y-6">
          <div>
            <h2 className="text-sm font-semibold text-gold mb-1">📝 地址</h2>
            <p className="text-white/80">{businessInfo.address}</p>
            <p className="text-white/50 text-sm">{businessInfo.addressNote}</p>
            <a
              href={businessInfo.mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-2 text-gold hover:text-gold-dark text-sm underline"
            >
              在 Google Map 開啟
            </a>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-gold mb-1">🕓 營業時間</h2>
            <p className="text-white/80">{businessInfo.hours}</p>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-gold mb-1">💬 聯絡方式</h2>
            <ul className="text-white/80 space-y-1">
              <li>
                LINE：{businessInfo.lineId}（
                <a href={businessInfo.lineUrl} target="_blank" rel="noopener noreferrer" className="text-gold hover:text-gold-dark underline">
                  傳送門
                </a>
                ）
              </li>
              <li>Email：{businessInfo.email}</li>
              <li>
                <a href={businessInfo.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-gold hover:text-gold-dark underline">
                  Instagram
                </a>{" "}
                ・{" "}
                <a href={businessInfo.facebookUrl} target="_blank" rel="noopener noreferrer" className="text-gold hover:text-gold-dark underline">
                  Facebook
                </a>
              </li>
            </ul>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
