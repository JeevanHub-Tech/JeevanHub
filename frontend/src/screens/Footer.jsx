import React from "react";
import { ArrowUpRight, Mail, Phone, MapPin, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

import { publicNavigation } from "./publicNavigation";
import logo from "../media/logo.png";

const socialLinks = [
  { label: "Facebook", href: "https://www.facebook.com/profile.php?id=61590780691533&sk=photos" },
  { label: "Instagram", href: "https://www.instagram.com/jeevanhub_ayurveda/?hl=en" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/jeevanhub-undefined-9b9128417/" },
];

const legalLinks = [
  { label: "Terms & Conditions", to: "/terms-and-conditions" },
  { label: "Privacy Policy", to: "/privacy-policy" },
  { label: "Cancellation & Refund", to: "/cancellation-refund-policy" },
  { label: "Shipping Policy", to: "/shipping-policy" },
];

function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 sm:grid-cols-2 lg:grid-cols-5 lg:px-8">
        {/* Brand & Corporate Entity */}
        <div className="sm:col-span-2 lg:col-span-1">
          <Link to="/" className="mb-4 inline-flex items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
            <img src={logo} alt="JeevanHub Logo" className="size-10 rounded-xl bg-primary-foreground/10 object-contain p-1" />
            <span className="font-display text-2xl font-semibold">JeevanHub</span>
          </Link>
          <p className="text-xs leading-relaxed text-primary-foreground/75 mb-3">
            Authentic Ayurvedic care, connected to verified practitioners and personalized treatment plans you can follow at home.
          </p>
          <div className="rounded-lg bg-primary-foreground/10 p-2.5 text-[11px] leading-relaxed text-primary-foreground/85 border border-primary-foreground/15">
            <p className="font-semibold flex items-center gap-1">
              <ShieldCheck className="size-3.5 shrink-0 text-primary-foreground" />
              MYSTERY DOMES PVT. LTD.
            </p>
            <p className="text-primary-foreground/70 text-[10px] mt-0.5">
              CIN: U85499DL2025PTC441545
            </p>
          </div>
        </div>

        {/* Explore */}
        <div>
          <h2 className="mb-4 text-sm font-semibold text-primary-foreground">Explore</h2>
          <ul className="grid gap-2.5 text-sm text-primary-foreground/75">
            {publicNavigation.slice(1).map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="transition-colors hover:text-primary-foreground">
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/contact-us" className="transition-colors hover:text-primary-foreground font-medium">
                Contact Us
              </Link>
            </li>
          </ul>
        </div>

        {/* Legal Policies */}
        <div>
          <h2 className="mb-4 text-sm font-semibold text-primary-foreground">Legal &amp; Policies</h2>
          <ul className="grid gap-2.5 text-sm text-primary-foreground/75">
            {legalLinks.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="transition-colors hover:text-primary-foreground">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Reach Us */}
        <div>
          <h2 className="mb-4 text-sm font-semibold text-primary-foreground">Reach Us</h2>
          <div className="grid gap-3 text-xs sm:text-sm text-primary-foreground/75">
            <div className="flex items-start gap-2">
              <MapPin className="size-4 shrink-0 mt-0.5 text-primary-foreground/90" />
              <span className="text-xs leading-relaxed text-primary-foreground/70">
                KG-3/66 S/F, Near Karala School, Vikas Puri, New Delhi - 110018, Delhi, India
              </span>
            </div>
            <a href="mailto:jeevanhub0@gmail.com" className="flex items-center gap-2 hover:text-primary-foreground">
              <Mail className="size-4 shrink-0 text-primary-foreground/90" />
              <span className="text-xs">jeevanhub0@gmail.com</span>
            </a>
            <a href="tel:+918688324518" className="flex items-center gap-2 hover:text-primary-foreground">
              <Phone className="size-4 shrink-0 text-primary-foreground/90" />
              <span className="text-xs">+91 86883 24518</span>
            </a>
            <Link to="/contact-us" className="inline-flex items-center gap-1 text-xs font-semibold text-primary-foreground hover:underline pt-1">
              Visit Contact Page &rarr;
            </Link>
          </div>
        </div>

        {/* Follow Along */}
        <div>
          <h2 className="mb-4 text-sm font-semibold text-primary-foreground">Follow along</h2>
          <ul className="grid gap-2.5 text-sm text-primary-foreground/75">
            {socialLinks.map((item) => (
              <li key={item.label}>
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-primary-foreground"
                >
                  {item.label}
                  <ArrowUpRight className="size-3.5" aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-primary-foreground/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-primary-foreground/60 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} JeevanHub. Owned and operated by MYSTERY DOMES PRIVATE LIMITED. All rights reserved.</p>
          <p className="flex items-center gap-3 text-[11px]">
            <span>CIN: U85499DL2025PTC441545</span>
            <span>•</span>
            <Link to="/privacy-policy" className="hover:underline">Privacy</Link>
            <span>•</span>
            <Link to="/terms-and-conditions" className="hover:underline">Terms</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
