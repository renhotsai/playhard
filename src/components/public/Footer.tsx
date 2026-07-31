import Link from "next/link";
import { businessInfo } from "@/lib/business-info";

export default function Footer() {
  return (
    <footer className="bg-surface border-t border-white/10 text-white/60 py-10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 text-center space-y-2">
        <p className="text-lg font-semibold font-heading text-gold">{businessInfo.name}</p>
        <p className="text-sm">提供最優質的劇本殺體驗</p>
        <p className="text-sm">
          {businessInfo.hours} ・ {businessInfo.address}
        </p>
        <p className="text-sm">
          LINE {businessInfo.lineId} ・{" "}
          <a href={businessInfo.instagramUrl} target="_blank" rel="noopener noreferrer" className="hover:text-gold">
            Instagram
          </a>{" "}
          ・{" "}
          <a href={businessInfo.facebookUrl} target="_blank" rel="noopener noreferrer" className="hover:text-gold">
            Facebook
          </a>{" "}
          ・{" "}
          <Link href="/about" className="hover:text-gold">
            關於我們
          </Link>
        </p>
        <p className="text-xs mt-4">&copy; {new Date().getFullYear()} {businessInfo.name}. 版權所有。</p>
      </div>
    </footer>
  );
}
