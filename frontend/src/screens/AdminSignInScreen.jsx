import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthContext } from "../context/AuthContext";
import { BACKEND_URL } from "../config";
import logo from "../media/logo.png";

// Dedicated, unlisted admin entry point — deliberately not reachable from the
// public role dropdown. Stand-in for the eventual admin.jeevanhub.com split
// (separate domain/subdomain is an infra change, out of frontend scope).
function AdminSignInScreen() {
	const { auth, setAuth } = useContext(AuthContext);
	const navigate = useNavigate();
	const [formData, setFormData] = useState({ email: "", password: "" });
	const [showPassword, setShowPassword] = useState(false);

	useEffect(() => {
		if (auth?.user && (auth.role || localStorage.getItem("role")) === "admin") {
			navigate("/admin-home", { replace: true });
		}
	}, [auth, navigate]);

	const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

	const handleSubmit = async (e) => {
		e.preventDefault();
		try {
			const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
				method: "POST",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ ...formData, role: "admin" }),
			});
			const result = await response.json();
			if (response.ok) {
				localStorage.setItem("token", result.token);
				localStorage.setItem("email", formData.email);
				localStorage.setItem("role", "admin");
				setAuth({ token: result.token, user: result.user, role: "admin" });
				navigate(result.forcePasswordReset ? "/admin/profile" : "/admin-home");
			} else {
				alert(result.message || result.error || "Invalid credentials");
			}
		} catch (error) {
			console.error("Admin sign-in error:", error);
		}
	};

	return (
		<div className="grid min-h-screen lg:grid-cols-2">
			<div className="relative hidden flex-col justify-between overflow-hidden bg-(--jh-ink-strong) px-10 py-12 text-(--jh-cream) lg:flex">
				<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,color-mix(in_oklch,var(--jh-cream)_8%,transparent)_0%,transparent_55%)]" />
				<a href="/" className="relative flex items-center gap-2.5">
					<img src={logo} alt="JeevanHub" className="size-9 rounded-full object-contain" />
					<span className="font-display text-lg text-(--jh-cream)">JeevanHub</span>
				</a>

				<div className="relative flex flex-col gap-4">
					<h1 className="font-display text-4xl leading-tight text-(--jh-cream)">
						The console for
						<br />
						running JeevanHub.
					</h1>
					<p className="max-w-sm text-(--jh-cream)/70">
						A dedicated, unlisted entry point for platform administrators.
					</p>
				</div>

				<p className="relative text-sm text-(--jh-cream)/50">Restricted access &middot; staff only.</p>
			</div>

			<div className="flex items-center justify-center px-6 py-16 sm:px-10">
				<div className="w-full max-w-sm">
					<div className="flex items-center gap-2 text-primary">
						<ShieldCheck size={20} />
						<span className="text-sm font-semibold uppercase tracking-wide">Admin access</span>
					</div>
					<h1 className="mt-3 font-display text-3xl text-foreground">Sign in to the console</h1>

					<form className="mt-8 flex flex-col gap-4" onSubmit={handleSubmit}>
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="admin-email">Email</Label>
						<Input id="admin-email" type="email" name="email" value={formData.email} onChange={handleChange} required className="h-11" />
					</div>
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="admin-password">Password</Label>
						<div className="relative">
							<Input
								id="admin-password"
								type={showPassword ? "text" : "password"}
								name="password"
								value={formData.password}
								onChange={handleChange}
								required
								className="h-11 pr-10"
							/>
							<button
								type="button"
								tabIndex={-1}
								onClick={() => setShowPassword((s) => !s)}
								aria-label={showPassword ? "Hide password" : "Show password"}
								className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
							>
								{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
							</button>
						</div>
					</div>
					<Button type="submit" size="lg" className="mt-2 w-full">
						Sign in
					</Button>
				</form>
			</div>
		</div>
	</div>
	);
}

export default AdminSignInScreen;
