import React from "react";
import { useTranslation } from "react-i18next";
import { Languages } from "lucide-react";

/**
 * LanguageToggle component:
 * Seamlessly toggles application language between English (en) and Hindi (hi)
 * using react-i18next for instant, flicker-free native UI translation.
 */
export default function LanguageToggle({ className = "" }) {
	const { i18n } = useTranslation();
	const currentLang = i18n.language?.startsWith("hi") ? "hi" : "en";

	const toggleLanguage = () => {
		const nextLang = currentLang === "hi" ? "en" : "hi";
		i18n.changeLanguage(nextLang);
		localStorage.setItem("jh_language", nextLang);
	};

	return (
		<div className={`relative inline-flex items-center ${className}`}>
			<button
				type="button"
				onClick={toggleLanguage}
				title={currentLang === "hi" ? "Switch to English" : "हिंदी में बदलें"}
				aria-label="Toggle language between English and Hindi"
				className="flex items-center gap-1.5 rounded-lg border border-primary-foreground/20 bg-primary-foreground/10 px-2.5 py-1.5 text-xs font-semibold text-primary-foreground backdrop-blur-sm transition-all hover:bg-primary-foreground/20 hover:border-primary-foreground/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground/50 active:scale-95 cursor-pointer"
			>
				<Languages className="size-3.5 text-primary-foreground/90 shrink-0" />
				<span className="flex items-center tracking-tight">
					<span className={currentLang === "en" ? "font-bold text-white" : "text-primary-foreground/60"}>
						EN
					</span>
					<span className="mx-1 text-primary-foreground/40 text-[10px]">/</span>
					<span className={currentLang === "hi" ? "font-bold text-white font-serif" : "text-primary-foreground/60"}>
						हिं
					</span>
				</span>
			</button>
		</div>
	);
}
