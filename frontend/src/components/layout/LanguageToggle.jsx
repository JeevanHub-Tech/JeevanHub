import React, { useState, useEffect, useCallback } from "react";
import { Languages, Check } from "lucide-react";

/**
 * LanguageToggle component:
 * Integrates with Google Website Translator to provide seamless English ⇄ Hindi switching.
 * Stores selection in cookies ('googtrans') and localStorage for persistent user preference.
 */
export default function LanguageToggle({ className = "" }) {
	const [currentLang, setCurrentLang] = useState("en");
	const [isOpen, setIsOpen] = useState(false);

	// Determine active language from cookie or localStorage
	const detectCurrentLanguage = useCallback(() => {
		const match = document.cookie.match(/(?:^|;\s*)googtrans=([^;]+)/);
		if (match) {
			const val = decodeURIComponent(match[1]);
			if (val.includes("/hi")) return "hi";
			if (val.includes("/en")) return "en";
		}
		return localStorage.getItem("jh_language") || "en";
	}, []);

	useEffect(() => {
		setCurrentLang(detectCurrentLanguage());

		// Enforce clean layout: Prevent Google Translate from shifting the page down
		const cleanBodyTop = () => {
			if (document.body.style.top && document.body.style.top !== "0px") {
				document.body.style.top = "0px";
			}
		};

		cleanBodyTop();
		const observer = new MutationObserver(cleanBodyTop);
		observer.observe(document.body, { attributes: true, attributeFilter: ["style"] });

		return () => observer.disconnect();
	}, [detectCurrentLanguage]);

	const applyLanguage = (langCode) => {
		setCurrentLang(langCode);
		localStorage.setItem("jh_language", langCode);

		const targetTrans = langCode === "hi" ? "/en/hi" : "/en/en";

		// 1. Set Google Translate cookies for both standard and domain root
		document.cookie = `googtrans=${targetTrans}; path=/;`;
		const hostname = window.location.hostname;
		if (hostname && hostname !== "localhost") {
			document.cookie = `googtrans=${targetTrans}; domain=.${hostname}; path=/;`;
		}

		// 2. Try to trigger Google Translate's hidden DOM select combo
		const selectElem = document.querySelector(".goog-te-combo");
		if (selectElem) {
			selectElem.value = langCode;
			selectElem.dispatchEvent(new Event("change", { bubbles: true }));
		} else {
			// If widget not initialized in DOM yet, reload with updated cookie
			window.location.reload();
		}

		setIsOpen(false);
	};

	const toggleLanguage = () => {
		const nextLang = currentLang === "hi" ? "en" : "hi";
		applyLanguage(nextLang);
	};

	return (
		<div className={`relative inline-flex items-center ${className}`}>
			<button
				type="button"
				onClick={toggleLanguage}
				title={currentLang === "hi" ? "Switch to English" : "हिंदी में बदलें"}
				aria-label="Toggle language between English and Hindi"
				className="flex items-center gap-1.5 rounded-lg border border-primary-foreground/20 bg-primary-foreground/10 px-2.5 py-1.5 text-xs font-semibold text-primary-foreground backdrop-blur-sm transition-all hover:bg-primary-foreground/20 hover:border-primary-foreground/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground/50 active:scale-95"
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
