import Link from "next/link";
import { ModeToggle } from "@/components/mode-toggle";
import UserMenu from "@/components/user-menu";

export default function Navigation() {
	return (
		<nav className="sticky top-0 z-50 w-full border-b border-border bg-nav-primary backdrop-blur">
			<div className="container flex h-16 items-center justify-between px-6">
				<div className="flex items-center space-x-6">
					<Link href="/" className="flex items-center space-x-2">
						<span className="font-bold text-xl text-nav-primary-foreground">玩硬劇本館</span>
					</Link>
					<nav className="flex items-center space-x-6 text-sm font-medium">
						<Link 
							href="/" 
							className="transition-colors hover:text-nav-primary-foreground/80 text-nav-primary-foreground/90"
						>
							首頁
						</Link>
						<Link 
							href="/games" 
							className="transition-colors hover:text-nav-primary-foreground/80 text-nav-primary-foreground/90"
						>
							劇本介紹
						</Link>
						<Link 
							href="/booking" 
							className="transition-colors hover:text-nav-primary-foreground/80 text-nav-primary-foreground/90"
						>
							線上預約
						</Link>
						<Link 
							href="/about" 
							className="transition-colors hover:text-nav-primary-foreground/80 text-nav-primary-foreground/90"
						>
							關於我們
						</Link>
						<Link 
							href="/qa" 
							className="transition-colors hover:text-nav-primary-foreground/80 text-nav-primary-foreground/90"
						>
							Q&A
						</Link>
						<Link 
							href="/contact" 
							className="transition-colors hover:text-nav-primary-foreground/80 text-nav-primary-foreground/90"
						>
							聯絡我們
						</Link>
					</nav>
				</div>
				<div className="flex items-center space-x-4">
					<UserMenu />
					<ModeToggle />
				</div>
			</div>
		</nav>
	);
}