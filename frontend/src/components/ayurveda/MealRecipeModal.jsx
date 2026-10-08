import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
	ChefHat,
	Clock,
	Flame,
	Users,
	Sparkles,
	Leaf,
	Lightbulb,
	Copy,
	Check,
	X,
	AlertCircle,
	RefreshCw,
	Utensils,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { authFetch } from "@/utils/authFetch";
import { BACKEND_URL } from "@/config";

const API = BACKEND_URL || "http://localhost:8080";

// In-memory cache for recipes loaded during the current session
const recipeCache = new Map();

export default function MealRecipeModal({
	isOpen,
	onClose,
	mealKey,
	day,
	items = [],
	portion,
	patientId,
}) {
	const { t, i18n } = useTranslation();
	const currentLang = i18n.language?.startsWith("hi") ? "hi" : "en";

	const [loading, setLoading] = useState(false);
	const [recipe, setRecipe] = useState(null);
	const [error, setError] = useState(null);
	const [copied, setCopied] = useState(false);

	const cacheKey = `${patientId || "self"}_${day || "day"}_${mealKey || "meal"}_${items.join(",")}_${currentLang}`;

	useEffect(() => {
		if (!isOpen || (!items.length && !mealKey)) return;

		// Check cache first
		if (recipeCache.has(cacheKey)) {
			setRecipe(recipeCache.get(cacheKey));
			setError(null);
			setLoading(false);
			return;
		}

		fetchRecipe();
	}, [isOpen, cacheKey]);

	const fetchRecipe = async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await authFetch(`${API}/api/ayurveda/diet-plan/meal-recipe`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					mealContext: mealKey,
					day,
					items,
					portion,
					patientId,
					lang: currentLang,
				}),
			});

			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				throw new Error(data.message || data.error || "Failed to generate recipe");
			}

			const data = await res.json();
			if (data.recipe) {
				recipeCache.set(cacheKey, data.recipe);
				setRecipe(data.recipe);
			} else {
				throw new Error("No recipe data returned");
			}
		} catch (err) {
			console.error("Error fetching meal recipe:", err);
			setError(err.message || t("ayurveda.recipe.fetchError", "Unable to load recipe. Please try again."));
		} finally {
			setLoading(false);
		}
	};

	const handleCopy = () => {
		if (!recipe) return;
		const text = `🍳 ${recipe.dishName}\n⏱ Prep: ${recipe.prepTimeMinutes}m | Cook: ${recipe.cookTimeMinutes}m | Servings: ${recipe.servings}\n\n🥗 INGREDIENTS:\n${(recipe.ingredients || [])
			.map((ing) => `- ${ing.item}${ing.ayurvedicRole ? ` (${ing.ayurvedicRole})` : ""}`)
			.join("\n")}\n\n🥣 PREPARATION METHOD:\n${(recipe.steps || [])
			.map((s, i) => `${i + 1}. ${s}`)
			.join("\n")}\n\n🌿 AYURVEDIC BENEFITS:\n${recipe.ayurvedicBenefits || ""}\n\n💡 TIPS:\n${(recipe.cookingTips || []).map((tip) => `• ${tip}`).join("\n")}`;

		navigator.clipboard.writeText(text);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
			<div
				className="relative flex flex-col w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-(--jh-radius-xl) border border-border bg-card text-card-foreground shadow-(--jh-shadow-hover) animate-in zoom-in-95 duration-200"
				role="dialog"
				aria-modal="true"
			>
				{/* Top Modal Header */}
				<div className="flex items-center justify-between border-b border-border bg-muted/40 px-6 py-4">
					<div className="flex items-center gap-2.5">
						<span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
							<ChefHat size={20} />
						</span>
						<div>
							<h3 className="font-display text-base sm:text-lg font-bold text-foreground">
								{recipe?.dishName || (items.length ? items[0] : t("ayurveda.recipe.title", "Ayurvedic Recipe & Prep"))}
							</h3>
							<div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-muted-foreground">
								{day && <span className="font-medium text-foreground">{day}</span>}
								{day && mealKey && <span>•</span>}
								{mealKey && <span className="capitalize">{mealKey}</span>}
								{portion && (
									<>
										<span>•</span>
										<Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
											{portion}
										</Badge>
									</>
								)}
							</div>
						</div>
					</div>

					<button
						type="button"
						onClick={onClose}
						className="flex size-8 items-center justify-center rounded-(--jh-radius-sm) text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
						aria-label={t("common.close", "Close")}
					>
						<X size={18} />
					</button>
				</div>

				{/* Modal Scrollable Body */}
				<div className="flex-1 overflow-y-auto p-6 space-y-6">
					{loading ? (
						<div className="space-y-5">
							<div className="flex items-center gap-3 p-3.5 rounded-lg border border-primary/20 bg-primary/5 text-primary text-xs animate-pulse">
								<Sparkles size={16} className="animate-spin" />
								<span>{t("ayurveda.recipe.generating", "Crafting authentic Ayurvedic culinary steps & dosha balance notes with AI...")}</span>
							</div>

							<div className="grid grid-cols-3 gap-3">
								<Skeleton className="h-14 w-full rounded-lg" />
								<Skeleton className="h-14 w-full rounded-lg" />
								<Skeleton className="h-14 w-full rounded-lg" />
							</div>

							<div className="space-y-2">
								<Skeleton className="h-5 w-32" />
								<Skeleton className="h-4 w-full" />
								<Skeleton className="h-4 w-5/6" />
								<Skeleton className="h-4 w-4/6" />
							</div>

							<div className="space-y-2">
								<Skeleton className="h-5 w-40" />
								<Skeleton className="h-12 w-full rounded-lg" />
								<Skeleton className="h-12 w-full rounded-lg" />
							</div>
						</div>
					) : error ? (
						<div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
							<div className="size-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
								<AlertCircle size={24} />
							</div>
							<p className="text-sm font-medium text-foreground max-w-sm">{error}</p>
							<Button variant="outline" size="sm" onClick={fetchRecipe} className="gap-2">
								<RefreshCw size={14} /> {t("common.tryAgain", "Try Again")}
							</Button>
						</div>
					) : recipe ? (
						<>
							{/* Quick Info Badges Bar */}
							<div className="grid grid-cols-3 gap-2.5 sm:gap-4">
								<div className="flex flex-col items-center justify-center p-3 rounded-xl border border-border bg-secondary/40 text-center">
									<div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
										<Clock size={13} className="text-primary" />
										<span>{t("ayurveda.recipe.prepTime", "Prep Time")}</span>
									</div>
									<span className="font-display font-semibold text-sm sm:text-base text-foreground">
										{recipe.prepTimeMinutes || 10} {t("common.mins", "mins")}
									</span>
								</div>

								<div className="flex flex-col items-center justify-center p-3 rounded-xl border border-border bg-secondary/40 text-center">
									<div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
										<Flame size={13} className="text-amber-500" />
										<span>{t("ayurveda.recipe.cookTime", "Cook Time")}</span>
									</div>
									<span className="font-display font-semibold text-sm sm:text-base text-foreground">
										{recipe.cookTimeMinutes || 15} {t("common.mins", "mins")}
									</span>
								</div>

								<div className="flex flex-col items-center justify-center p-3 rounded-xl border border-border bg-secondary/40 text-center">
									<div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
										<Users size={13} className="text-emerald-500" />
										<span>{t("ayurveda.recipe.servings", "Servings")}</span>
									</div>
									<span className="font-display font-semibold text-sm sm:text-base text-foreground">
										{recipe.servings || "1-2"}
									</span>
								</div>
							</div>

							{/* Section 1: Ingredients */}
							{recipe.ingredients?.length > 0 && (
								<div className="space-y-3">
									<div className="flex items-center justify-between">
										<h4 className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wide text-foreground">
											<Utensils size={15} className="text-primary" />
											{t("ayurveda.recipe.ingredientsTitle", "Key Ingredients & Ayurvedic Role")}
										</h4>
										<span className="text-xs text-muted-foreground">
											{recipe.ingredients.length} {t("ayurveda.recipe.items", "items")}
										</span>
									</div>

									<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
										{recipe.ingredients.map((ing, idx) => (
											<div
												key={idx}
												className="flex flex-col justify-center p-2.5 rounded-lg border border-border bg-card/60 hover:bg-secondary/30 transition-colors"
											>
												<div className="flex items-center gap-2 text-xs font-semibold text-foreground">
													<span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
													<span>{ing.item}</span>
												</div>
												{ing.ayurvedicRole && (
													<p className="pl-3.5 text-[11px] text-muted-foreground italic mt-0.5">
														{ing.ayurvedicRole}
													</p>
												)}
											</div>
										))}
									</div>
								</div>
							)}

							{/* Section 2: Step by Step Method */}
							{recipe.steps?.length > 0 && (
								<div className="space-y-3">
									<h4 className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wide text-foreground">
										<ChefHat size={15} className="text-primary" />
										{t("ayurveda.recipe.methodTitle", "Ayurvedic Preparation Steps")}
									</h4>

									<div className="space-y-2.5">
										{recipe.steps.map((step, idx) => (
											<div
												key={idx}
												className="flex gap-3 p-3 rounded-lg border border-border/80 bg-card hover:border-primary/30 transition-all"
											>
												<span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
													{idx + 1}
												</span>
												<p className="text-xs sm:text-sm text-foreground leading-relaxed">
													{step}
												</p>
											</div>
										))}
									</div>
								</div>
							)}

							{/* Section 3: Ayurvedic Benefits / Agni Impact */}
							{recipe.ayurvedicBenefits && (
								<div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-4 space-y-1.5">
									<div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
										<Leaf size={15} />
										<span>{t("ayurveda.recipe.benefitsTitle", "Ayurvedic & Dosha Balance Insight")}</span>
									</div>
									<p className="text-xs sm:text-sm text-foreground leading-relaxed">
										{recipe.ayurvedicBenefits}
									</p>
								</div>
							)}

							{/* Section 4: Kitchen Tips */}
							{recipe.cookingTips?.length > 0 && (
								<div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 space-y-2">
									<div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300">
										<Lightbulb size={15} />
										<span>{t("ayurveda.recipe.tipsTitle", "Vaidya's Kitchen Wisdom")}</span>
									</div>
									<ul className="space-y-1 pl-4 list-disc text-xs text-foreground">
										{recipe.cookingTips.map((tip, idx) => (
											<li key={idx} className="leading-relaxed">
												{tip}
											</li>
										))}
									</ul>
								</div>
							)}
						</>
					) : null}
				</div>

				{/* Modal Footer */}
				<div className="flex items-center justify-between border-t border-border bg-muted/20 px-6 py-3.5">
					{recipe ? (
						<Button
							variant="outline"
							size="sm"
							onClick={handleCopy}
							className="gap-1.5 text-xs font-medium"
						>
							{copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
							{copied ? t("common.copied", "Copied!") : t("ayurveda.recipe.copyRecipe", "Copy Recipe")}
						</Button>
					) : (
						<div />
					)}

					<Button variant="secondary" size="sm" onClick={onClose} className="text-xs">
						{t("common.close", "Close")}
					</Button>
				</div>
			</div>
		</div>
	);
}
