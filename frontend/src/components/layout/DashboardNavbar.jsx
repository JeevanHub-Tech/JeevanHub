import { useContext, useState } from "react";
import { Menu, MapPin, Search, X, Bell, LogOut, ShoppingCart } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { exploreOptions as defaultExploreOptions } from "@/screens/publicNavigation";
import { useUserLocation } from "@/hooks/useUserLocation";
import { AuthContext } from "@/context/AuthContext";
import defaultProfilePic from "@/media/default-profile.png";
import logo from "@/media/logo2.png";

function NavigationLink({ item, onNavigate }) {
	return (
		<NavLink
			to={item.to}
			onClick={onNavigate}
			className={({ isActive }) =>
				`relative flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${
					isActive
						? "bg-accent text-accent-foreground"
						: "text-primary-foreground/75 hover:bg-primary-foreground/10 hover:text-primary-foreground"
				}`
			}
		>
			{item.label}
			{item.badge > 0 ? (
				<Badge variant="destructive" className="h-4 min-w-4 justify-center rounded-full px-1 text-[10px]">
					{item.badge}
				</Badge>
			) : null}
		</NavLink>
	);
}

// Shared dashboard navbar shell for the Doctor, Retailer, and Admin roles — one
// `navItems` array rendered once (desktop row + mobile disclosure), same
// Explore/search/location treatment as the public nav. Role files own their own
// data fetching (SSE badge counts, path-aware sublinks) and pass the result in.
function DashboardNavbar({ navItems, profileTo, notificationsTo, cartTo, logoTo = "/", exploreOptions = defaultExploreOptions }) {
	const [showMenu, setShowMenu] = useState(false);
	const [exploreTarget, setExploreTarget] = useState(() => exploreOptions.find((o) => o.value === "doctor") || exploreOptions[0]);
	const [searchQuery, setSearchQuery] = useState("");
	const { auth, logout } = useContext(AuthContext);
	const userLocation = useUserLocation("Your location", auth.user?.address || auth.user?.zipCode);
	const navigate = useNavigate();

	const userName = auth.user ? `${auth.user.firstName || ""} ${auth.user.lastName || ""}`.trim() : "Guest";
	const profileImage = auth.user?.profileImage || defaultProfilePic;

	const handleExplore = (value) => {
		const option = exploreOptions.find((item) => item.value === value);
		if (option) {
			setExploreTarget(option);
			navigate(option.to);
		}
	};

	const runSearch = () => {
		const query = searchQuery.trim();
		if (!query || !exploreTarget) return;
		navigate(`${exploreTarget.to}?q=${encodeURIComponent(query)}`);
	};

	const handleSignOut = () => {
		logout();
		navigate("/signin");
	};

	return (
		<header className="fixed inset-x-0 top-0 z-50 border-b border-primary-foreground/10 bg-primary text-primary-foreground shadow-(--jh-shadow-rest)">
			<div className="mx-auto flex min-h-20 max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
				<NavLink to={logoTo} className="flex shrink-0 items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
					<img src={logo} alt="JeevanHub" className="size-11 rounded-xl bg-primary-foreground/10 object-contain p-1" />
					<span className="hidden font-display text-xl font-semibold tracking-tight sm:inline">JeevanHub</span>
				</NavLink>

				<div className="hidden min-w-0 flex-1 items-center justify-center lg:flex">
					<div className="flex h-11 w-full max-w-xl items-center gap-2 rounded-lg bg-primary-foreground/10 pl-3 pr-1 text-primary-foreground/70 ring-1 ring-inset ring-primary-foreground/15 focus-within:ring-2 focus-within:ring-primary-foreground/60">
						<Search className="size-4 shrink-0" aria-hidden="true" />
						<Select onValueChange={handleExplore} items={exploreOptions}>
							<SelectTrigger
								aria-label="Explore JeevanHub"
								className="h-8 w-28 shrink-0 gap-1.5 border-0 bg-transparent px-2 text-sm font-semibold text-primary-foreground hover:bg-primary-foreground/10 focus-visible:ring-0 [&_svg]:text-primary-foreground/70"
							>
								<SelectValue placeholder="Explore" />
							</SelectTrigger>
							<SelectContent>
								{exploreOptions.map((option) => (
									<SelectItem key={option.value} value={option.value}>
										{option.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<span className="h-5 w-px shrink-0 bg-primary-foreground/20" aria-hidden="true" />
						<Input
							aria-label="Search JeevanHub"
							placeholder="Search care, doctors, or medicines"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							onKeyDown={(e) => { if (e.key === "Enter") runSearch(); }}
							className="h-9 border-0 bg-transparent px-1 text-primary-foreground shadow-none placeholder:text-primary-foreground/55 focus-visible:ring-0"
						/>
					</div>
				</div>

				<div className="ml-auto flex items-center gap-2">
					<span className="hidden items-center gap-1.5 text-xs font-medium text-primary-foreground/70 xl:flex"><MapPin className="size-3.5" aria-hidden="true" />{userLocation}</span>

					{cartTo ? (
						<NavLink to={cartTo} aria-label="Cart" className="hidden rounded-md p-2 text-primary-foreground/80 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground sm:inline-flex">
							<ShoppingCart className="size-5" aria-hidden="true" />
						</NavLink>
					) : null}

					<NavLink to={notificationsTo} aria-label="Notifications" className="hidden rounded-md p-2 text-primary-foreground/80 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground sm:inline-flex">
						<Bell className="size-5" aria-hidden="true" />
					</NavLink>

					<button
						type="button"
						onClick={() => navigate(profileTo)}
						className="hidden items-center gap-2 rounded-md px-1.5 py-1 transition-colors hover:bg-primary-foreground/10 sm:flex"
					>
						<Avatar size="sm">
							<AvatarImage src={profileImage} alt="" />
							<AvatarFallback className="bg-primary-foreground/20 text-primary-foreground">{userName.charAt(0)}</AvatarFallback>
						</Avatar>
						<span className="max-w-32 truncate text-sm font-semibold">{userName}</span>
					</button>

					<Button variant="ghost" size="icon" aria-label="Sign out" onClick={handleSignOut} className="hidden text-primary-foreground hover:bg-primary-foreground/10 sm:inline-flex">
						<LogOut className="size-4" />
					</Button>

					<NavLink to={profileTo} aria-label="Profile" className="sm:hidden">
						<Avatar size="sm">
							<AvatarImage src={profileImage} alt="" />
							<AvatarFallback className="bg-primary-foreground/20 text-primary-foreground">{userName.charAt(0)}</AvatarFallback>
						</Avatar>
					</NavLink>

					<Button variant="ghost" size="icon" aria-label={showMenu ? "Close navigation menu" : "Open navigation menu"} aria-expanded={showMenu} onClick={() => setShowMenu((open) => !open)} className="text-primary-foreground hover:bg-primary-foreground/10 lg:hidden">
						{showMenu ? <X /> : <Menu />}
					</Button>
				</div>
			</div>

			<nav className="hidden border-t border-primary-foreground/10 lg:block" aria-label="Primary navigation">
				<div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 sm:px-6 lg:px-8">
					<span className="flex items-center gap-1.5 text-xs font-medium text-primary-foreground/70"><MapPin className="size-3.5" aria-hidden="true" />{userLocation}</span>
					<div className="flex items-center gap-1">{navItems.map((item) => <NavigationLink key={item.to} item={item} />)}</div>
					<span className="w-28" aria-hidden="true" />
				</div>
			</nav>

			{showMenu ? (
				<div className="border-t border-primary-foreground/10 bg-primary px-4 pb-5 pt-3 lg:hidden">
					<nav className="grid gap-1" aria-label="Mobile navigation">{navItems.map((item) => <NavigationLink key={item.to} item={item} onNavigate={() => setShowMenu(false)} />)}</nav>
					<div className="mt-3 flex items-center justify-between border-t border-primary-foreground/10 pt-3">
						<NavLink to={profileTo} onClick={() => setShowMenu(false)} className="flex items-center gap-2 text-sm font-semibold">
							<Avatar size="sm">
								<AvatarImage src={profileImage} alt="" />
								<AvatarFallback className="bg-primary-foreground/20 text-primary-foreground">{userName.charAt(0)}</AvatarFallback>
							</Avatar>
							{userName}
						</NavLink>
						<div className="flex items-center gap-1">
							{cartTo ? (
								<NavLink to={cartTo} aria-label="Cart" onClick={() => setShowMenu(false)} className="rounded-md p-2 text-primary-foreground/80 hover:bg-primary-foreground/10">
									<ShoppingCart className="size-5" aria-hidden="true" />
								</NavLink>
							) : null}
							<NavLink to={notificationsTo} aria-label="Notifications" onClick={() => setShowMenu(false)} className="rounded-md p-2 text-primary-foreground/80 hover:bg-primary-foreground/10">
								<Bell className="size-5" aria-hidden="true" />
							</NavLink>
							<Button variant="ghost" size="icon" aria-label="Sign out" onClick={handleSignOut} className="text-primary-foreground hover:bg-primary-foreground/10">
								<LogOut className="size-4" />
							</Button>
						</div>
					</div>
				</div>
			) : null}
		</header>
	);
}

export default DashboardNavbar;
