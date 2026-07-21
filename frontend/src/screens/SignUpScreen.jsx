import React from "react";
import { useNavigate } from "react-router-dom";
import { Stethoscope, Store, User } from "lucide-react";

import logo from "../media/logo.png";

const ROLES = [
	{ role: "patient", label: "Patient", description: "Book consultations and manage your Ayurvedic care.", icon: User },
	{ role: "doctor", label: "Doctor", description: "Offer consultations and manage your practice.", icon: Stethoscope },
	{ role: "retailer", label: "Retailer", description: "List and sell Ayurvedic medicines online.", icon: Store },
];

function SignUpScreen() {
	const navigate = useNavigate();

	const handleSignIn = () => navigate("/signin");
	const handleSignUp = (role) => navigate(`/signup-${role}`);

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
						One platform,
						<br />
						every role covered.
					</h1>
					<p className="max-w-sm text-(--jh-cream)/70">
						Patients, doctors, and retailers each get a workspace built for how they use Ayurvedic care.
					</p>
				</div>

				<p className="relative text-sm text-(--jh-cream)/50">Trusted by patients, doctors, and retailers across India.</p>
			</div>

			<div className="flex items-center justify-center px-6 py-16 sm:px-10">
				<div className="w-full max-w-sm">
					<h1 className="font-display text-3xl text-foreground">Who are you registering as?</h1>
					<p className="mt-1.5 text-sm text-muted-foreground">Pick a role to start your JeevanHub account.</p>

					<div className="mt-8 flex flex-col gap-3">
						{ROLES.map(({ role, label, description, icon: Icon }) => (
							<button
								key={role}
								type="button"
								onClick={() => handleSignUp(role)}
								className="flex items-center gap-4 rounded-(--jh-radius-lg) border border-border bg-card p-4 text-left shadow-(--jh-shadow-rest) transition-colors hover:border-primary hover:bg-secondary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
							>
								<span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
									<Icon size={20} />
								</span>
								<span>
									<span className="block font-display text-base text-foreground">{label}</span>
									<span className="block text-sm text-muted-foreground">{description}</span>
								</span>
							</button>
						))}
					</div>

					<p className="mt-6 text-center text-sm text-muted-foreground">
						Already have an account?{" "}
						<button type="button" onClick={handleSignIn} className="font-semibold text-primary hover:underline">
							Sign in
						</button>
					</p>
				</div>
			</div>
		</div>
	);
}

export default SignUpScreen;
