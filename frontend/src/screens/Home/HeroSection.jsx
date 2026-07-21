import React, { useContext } from "react";
import { ArrowRight, Check, Leaf } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { AuthContext } from "../../context/AuthContext";
import heroBg from "../../media/homebg.png";

function HeroSection() {
  const navigate = useNavigate();
  const { auth } = useContext(AuthContext);

  const handleConsultButtonClick = () => {
    navigate(auth?.token ? "/doctors" : "/signin");
  };

  return (
    <section className="relative isolate overflow-hidden" aria-label="Find Ayurvedic care">
      <img
        src={heroBg}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 -z-20 size-full object-cover"
      />
      <div className="absolute inset-0 -z-10 bg-linear-to-r from-background via-background/90 to-background/40" aria-hidden="true" />
      <div className="mx-auto flex min-h-[min(760px,calc(100vh-6rem))] max-w-7xl items-center px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
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
      </div>
    </section>
  );
}

export default HeroSection;
