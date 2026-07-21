import React from "react";
import { ArrowUpRight, Mail, Phone } from "lucide-react";
import { Link } from "react-router-dom";

import { publicNavigation } from "./publicNavigation";
import logo from "../media/logo.png";

const socialLinks = [
  { label: "Facebook", href: "https://www.facebook.com/profile.php?id=61590780691533&sk=photos" },
  { label: "Instagram", href: "https://www.instagram.com/jeevanhub_ayurveda/?hl=en" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/jeevanhub-undefined-9b9128417/" },
];

function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.5fr_1fr_1fr_1fr] lg:px-8">
        <div className="max-w-sm">
          <Link to="/" className="mb-5 inline-flex items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
            <img src={logo} alt="" className="size-11 rounded-xl bg-primary-foreground/10 object-contain p-1" />
            <span className="font-display text-2xl font-semibold">JeevanHub</span>
          </Link>
          <p className="text-sm leading-7 text-primary-foreground/70">Authentic Ayurvedic care, connected to real practitioners and practical treatment plans you can follow at home.</p>
        </div>
        <div>
          <h2 className="mb-4 text-sm font-semibold text-primary-foreground">Explore</h2>
          <ul className="grid gap-3 text-sm text-primary-foreground/70">{publicNavigation.slice(1).map((item) => <li key={item.to}><Link to={item.to} className="transition-colors hover:text-primary-foreground">{item.label}</Link></li>)}</ul>
        </div>
        <div>
          <h2 className="mb-4 text-sm font-semibold text-primary-foreground">Reach us</h2>
          <div className="grid gap-3 text-sm text-primary-foreground/70"><a href="mailto:jeevanhub0@gmail.com" className="flex items-center gap-2 hover:text-primary-foreground"><Mail className="size-4" aria-hidden="true" />jeevanhub0@gmail.com</a><a href="tel:+918688324518" className="flex items-center gap-2 hover:text-primary-foreground"><Phone className="size-4" aria-hidden="true" />+91 86883 24518</a></div>
        </div>
        <div>
          <h2 className="mb-4 text-sm font-semibold text-primary-foreground">Follow along</h2>
          <ul className="grid gap-3 text-sm text-primary-foreground/70">{socialLinks.map((item) => <li key={item.label}><a href={item.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-primary-foreground">{item.label}<ArrowUpRight className="size-3.5" aria-hidden="true" /></a></li>)}</ul>
        </div>
      </div>
      <div className="border-t border-primary-foreground/10"><div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-primary-foreground/55 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8"><p>© {new Date().getFullYear()} JeevanHub. All rights reserved.</p><p>Authentic Ayurveda, modern access.</p></div></div>
    </footer>
  );
}

export default Footer;
