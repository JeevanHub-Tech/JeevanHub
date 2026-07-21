import { useContext, useEffect, useState } from "react";
import { Bell, LogOut, MapPin, Menu, Search, ShoppingCart, X } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthContext } from "../../context/AuthContext";
import { OPENCAGE_API_KEY } from "../../config";
import { patientExploreOptions, patientNavigation } from "./patientNavigation";
import defaultProfilePic from "../../media/default-profile.png";
import logo from "../../media/logo2.png";

function NavigationLink({ item, onNavigate }) {
	return (
		<NavLink
			to={item.to}
			onClick={onNavigate}
			className={({ isActive }) =>
				`relative rounded-md px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${
					isActive
						? "bg-accent text-accent-foreground"
						: "text-primary-foreground/75 hover:bg-primary-foreground/10 hover:text-primary-foreground"
				}`
			}
		>
			{item.label}
		</NavLink>
	);
}

function PatientNavBar() {
	const navigate = useNavigate();
	const { auth, logout } = useContext(AuthContext);
	const [showMenu, setShowMenu] = useState(false);
	const [userLocation, setUserLocation] = useState("Your location");

	const profilePic = auth.user?.profileImage || null;
	const userName = [auth.user?.firstName, auth.user?.lastName].filter(Boolean).join(" ") || "Guest";

	useEffect(() => {
		if (!navigator.geolocation || !OPENCAGE_API_KEY) return;

		navigator.geolocation.getCurrentPosition(
			async ({ coords }) => {
				try {
					const response = await fetch(
						`https://api.opencagedata.com/geocode/v1/json?q=${coords.latitude}+${coords.longitude}&key=${OPENCAGE_API_KEY}`,
					);
					const data = await response.json();
					const components = data.results?.[0]?.components;
					setUserLocation(components?.city || components?.town || "Your location");
				} catch {
					setUserLocation("Your location");
				}
			},
			() => setUserLocation("Your location"),
			{ maximumAge: 300000, timeout: 5000 },
		);
	}, []);

	const handleExplore = (event) => {
		const option = patientExploreOptions.find((item) => item.value === event.target.value);
		if (option) navigate(option.to);
	};

	const handleSignOut = () => {
		logout();
		navigate("/signin");
	};

	return (
		<header className="fixed inset-x-0 top-0 z-50 border-b border-primary-foreground/10 bg-primary text-primary-foreground shadow-(--jh-shadow-rest)">
			<div className="mx-auto flex min-h-20 max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
				<NavLink
					to="/patient-home"
					className="flex shrink-0 items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
				>
					<img src={logo} alt="JeevanHub" className="size-11 rounded-xl bg-primary-foreground/10 object-contain p-1" />
					<span className="hidden font-display text-xl font-semibold tracking-tight sm:inline">JeevanHub</span>
				</NavLink>

				<div className="hidden min-w-0 flex-1 items-center justify-center lg:flex">
					<label className="flex h-11 w-full max-w-xl items-center gap-2 rounded-lg bg-primary-foreground/10 px-3 text-primary-foreground/70 ring-1 ring-inset ring-primary-foreground/15 focus-within:ring-2 focus-within:ring-primary-foreground/60">
						<Search className="size-4 shrink-0" aria-hidden="true" />
						<select
							aria-label="Explore JeevanHub"
							defaultValue=""
							onChange={handleExplore}
							className="h-full shrink-0 bg-transparent text-sm font-semibold text-primary-foreground outline-none"
						>
							<option value="" disabled>Explore</option>
							{patientExploreOptions.map((option) => (
								<option key={option.value} value={option.value} className="text-foreground">
									{option.label}
								</option>
							))}
						</select>
						<Input
							aria-label="Search JeevanHub"
							placeholder="Search care, doctors, or medicines"
							className="h-9 border-0 bg-transparent px-1 text-primary-foreground shadow-none placeholder:text-primary-foreground/55 focus-visible:ring-0"
						/>
					</label>
				</div>

				<div className="ml-auto flex items-center gap-1.5">
					<span className="hidden items-center gap-1.5 text-xs font-medium text-primary-foreground/70 xl:flex">
						<MapPin className="size-3.5" aria-hidden="true" />
						{userLocation}
					</span>
					<Button variant="ghost" size="icon" aria-label="Cart" render={<NavLink to="/cart" />} className="text-primary-foreground hover:bg-primary-foreground/10">
						<ShoppingCart />
					</Button>
					<Button variant="ghost" size="icon" aria-label="Notifications" render={<NavLink to="/notifications" />} className="text-primary-foreground hover:bg-primary-foreground/10">
						<Bell />
					</Button>
					<NavLink
						to="/profile/patient"
						className="hidden items-center gap-2 rounded-md px-2 py-1 text-sm font-semibold hover:bg-primary-foreground/10 sm:flex"
					>
						<img
							src={profilePic || defaultProfilePic}
							alt=""
							className="size-8 rounded-full border border-primary-foreground/40 object-cover"
						/>
						<span className="max-w-28 truncate">{userName}</span>
					</NavLink>
					<NavLink to="/profile/patient" aria-label="Your profile" className="sm:hidden">
						<img src={profilePic || defaultProfilePic} alt="" className="size-9 rounded-full border border-primary-foreground/40 object-cover" />
					</NavLink>
					<Button
						variant="ghost"
						size="icon"
						aria-label="Sign out"
						onClick={handleSignOut}
						className="hidden text-primary-foreground hover:bg-primary-foreground/10 sm:inline-flex"
					>
						<LogOut />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						aria-label={showMenu ? "Close navigation menu" : "Open navigation menu"}
						aria-expanded={showMenu}
						onClick={() => setShowMenu((open) => !open)}
						className="text-primary-foreground hover:bg-primary-foreground/10 lg:hidden"
					>
						{showMenu ? <X /> : <Menu />}
					</Button>
				</div>
			</div>

			<nav className="hidden border-t border-primary-foreground/10 lg:block" aria-label="Patient navigation">
				<div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 sm:px-6 lg:px-8">
					<span className="flex items-center gap-1.5 text-xs font-medium text-primary-foreground/70">
						<MapPin className="size-3.5" aria-hidden="true" />
						{userLocation}
					</span>
					<div className="flex items-center gap-1">
						{patientNavigation.map((item) => (
							<NavigationLink key={item.to} item={item} />
						))}
					</div>
					<span className="w-28" aria-hidden="true" />
				</div>
			</nav>

			{showMenu ? (
				<div className="border-t border-primary-foreground/10 bg-primary px-4 pb-5 pt-3 lg:hidden">
					<div className="mb-3 flex items-center gap-2 rounded-lg bg-primary-foreground/10 px-3 py-2">
						<Search className="size-4 shrink-0 text-primary-foreground/70" aria-hidden="true" />
						<Input
							aria-label="Search JeevanHub"
							placeholder="Search JeevanHub"
							className="h-9 border-0 bg-transparent text-primary-foreground placeholder:text-primary-foreground/55 focus-visible:ring-0"
						/>
					</div>
					<nav className="grid gap-1" aria-label="Mobile patient navigation">
						{patientNavigation.map((item) => (
							<NavigationLink key={item.to} item={item} onNavigate={() => setShowMenu(false)} />
						))}
					</nav>
					<Button variant="outline" onClick={handleSignOut} className="mt-3 w-full border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
						<LogOut className="size-4" /> Sign out
					</Button>
				</div>
			) : null}
		</header>
	);
}

export default PatientNavBar;
