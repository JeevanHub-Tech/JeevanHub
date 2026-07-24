import React, { useState } from "react";
import { Menu, MapPin, X } from "lucide-react";
import { NavLink } from "react-router-dom";

import { Button } from "@/components/ui/button";
import GlobalSearchBox from "@/components/layout/GlobalSearchBox";
import { exploreOptions, publicNavigation } from "./publicNavigation";
import { useUserLocation } from "../hooks/useUserLocation";
import defaultProfilePic from "../media/default-profile.png";
import logo from "../media/logo2.png";

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

function Navbar() {
  const [showMenu, setShowMenu] = useState(false);
  const userLocation = useUserLocation();

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-primary-foreground/10 bg-primary text-primary-foreground shadow-[var(--jh-shadow-rest)]">
      <div className="mx-auto flex min-h-20 max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <NavLink to="/" className="flex shrink-0 items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          <img src={logo} alt="JeevanHub" className="size-11 rounded-xl bg-primary-foreground/10 object-contain p-1" />
          <span className="hidden font-display text-xl font-semibold tracking-tight sm:inline">JeevanHub</span>
        </NavLink>

        <div className="hidden min-w-0 flex-1 items-center justify-center lg:flex">
          <GlobalSearchBox exploreOptions={exploreOptions} className="w-full max-w-xl" />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="hidden items-center gap-1.5 text-xs font-medium text-primary-foreground/70 xl:flex"><MapPin className="size-3.5" aria-hidden="true" />{userLocation}</span>
          <NavLink to="/signin" className="hidden h-9 items-center justify-center rounded-md bg-primary-foreground px-4 text-sm font-semibold text-primary transition-colors hover:bg-primary-foreground/90 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:inline-flex">Sign in</NavLink>
          <NavLink to="/signin" aria-label="Sign in" className="sm:hidden">
            <img src={defaultProfilePic} alt="" className="size-9 rounded-full border border-primary-foreground/40 object-cover" />
          </NavLink>
          <Button variant="ghost" size="icon" aria-label={showMenu ? "Close navigation menu" : "Open navigation menu"} aria-expanded={showMenu} onClick={() => setShowMenu((open) => !open)} className="text-primary-foreground hover:bg-primary-foreground/10 lg:hidden">
            {showMenu ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      <nav className="hidden border-t border-primary-foreground/10 lg:block" aria-label="Primary navigation">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 sm:px-6 lg:px-8">
          <span className="flex items-center gap-1.5 text-xs font-medium text-primary-foreground/70"><MapPin className="size-3.5" aria-hidden="true" />{userLocation}</span>
          <div className="flex items-center gap-1">{publicNavigation.map((item) => <NavigationLink key={item.to} item={item} />)}</div>
          <span className="w-28" aria-hidden="true" />
        </div>
      </nav>

      {showMenu ? (
        <div className="border-t border-primary-foreground/10 bg-primary px-4 pb-5 pt-3 lg:hidden">
          <GlobalSearchBox
            exploreOptions={exploreOptions}
            showTypeSelect={false}
            className="mb-3"
            onNavigate={() => setShowMenu(false)}
          />
          <nav className="grid gap-1" aria-label="Mobile navigation">{publicNavigation.map((item) => <NavigationLink key={item.to} item={item} onNavigate={() => setShowMenu(false)} />)}</nav>
        </div>
      ) : null}
    </header>
  );
}

export default Navbar;
