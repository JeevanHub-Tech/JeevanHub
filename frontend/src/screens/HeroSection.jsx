import React, { useContext } from "react";
import { ArrowRight, Check, Leaf } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { AuthContext } from "../context/AuthContext";
import heroBg from "../media/homebg.png";

function HeroSection() {
  const navigate = useNavigate();
  const { auth } = useContext(AuthContext);

  const handleConsultButtonClick = () => {
    navigate(auth?.token ? "/doctors" : "/signin");
  };

  return (
    <section className="relative overflow-hidden bg-background" aria-label="Find Ayurvedic care">
      <div className="mx-auto grid min-h-[min(760px,calc(100vh-6rem))] max-w-7xl items-center gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:px-8 lg:py-20">
        <div className="relative z-10 max-w-2xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-semibold text-primary"><Leaf className="size-4" aria-hidden="true" />Care rooted in Ayurveda</div>
          <h1 className="max-w-xl font-display text-5xl leading-[1.02] tracking-tight text-foreground sm:text-6xl lg:text-7xl">A calmer way to find your path to <span className="text-primary">better health.</span></h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground sm:text-xl">Talk to a certified Ayurvedic doctor, understand what your body needs, and follow a plan made for your daily life.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" onClick={handleConsultButtonClick} className="h-12 rounded-md px-6 text-base">Book a consultation <ArrowRight className="size-4" /></Button>
            <Button variant="outline" size="lg" onClick={() => navigate("/treatments")} className="h-12 rounded-md px-6 text-base">Explore treatments</Button>
          </div>
          <ul className="mt-8 grid gap-3 text-sm font-medium text-muted-foreground sm:grid-cols-3 sm:gap-5">
            {["Real practitioner guidance", "Plans made for you", "Care from home"].map((item) => <li key={item} className="flex items-center gap-2"><span className="flex size-5 items-center justify-center rounded-full bg-secondary text-primary"><Check className="size-3.5" aria-hidden="true" /></span>{item}</li>)}
          </ul>
        </div>

        <div className="relative min-h-[420px] lg:min-h-[600px]">
          <div className="absolute -right-16 -top-16 size-48 rounded-full bg-accent/60 blur-3xl" aria-hidden="true" />
          <div className="relative h-full min-h-[420px] overflow-hidden rounded-[2rem] border border-border bg-card shadow-[var(--jh-shadow-card)] lg:min-h-[600px]">
            <img src={heroBg} alt="Warm botanical Ayurvedic care setting" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/85 via-primary/10 to-transparent" />
            <div className="absolute inset-x-5 bottom-5 rounded-2xl border border-primary-foreground/20 bg-primary/85 p-5 text-primary-foreground backdrop-blur-sm sm:inset-x-7 sm:bottom-7 sm:p-6">
              <p className="text-sm font-semibold text-primary-foreground/70">Your next step</p>
              <p className="mt-1 font-display text-2xl leading-tight">Start with a conversation, not a guess.</p>
              <p className="mt-3 text-sm leading-6 text-primary-foreground/75">A qualified practitioner helps you move from symptoms to a plan you can trust.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
