"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export function ModeToggle () {
	const { setTheme, theme } = useTheme()
	const [mounted, setMounted] = React.useState(false)

	React.useEffect(() => {
		setMounted(true)
	}, [])

	if (!mounted) {
		return (
			<Button 
				variant="outline" 
				size="icon" 
				className="bg-nav-primary border-nav-primary-foreground/20 hover:bg-nav-primary/90 text-nav-primary-foreground hover:text-nav-primary-foreground"
			>
				<Sun className="h-[1.2rem] w-[1.2rem]"/>
				<span className="sr-only">Toggle theme</span>
			</Button>
		)
	}

	const handleThemeChange = () => {
		setTheme(theme === "dark" ? "light" : "dark")
	}

	return (
		<Button 
			variant="outline" 
			size="icon" 
			onClick={handleThemeChange}
			className="bg-nav-primary border-nav-primary-foreground/20 hover:bg-nav-primary/90 text-nav-primary-foreground hover:text-nav-primary-foreground"
		>
			<Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90"/>
			<Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0"/>
			<span className="sr-only">Toggle theme</span>
		</Button>
	)
}
