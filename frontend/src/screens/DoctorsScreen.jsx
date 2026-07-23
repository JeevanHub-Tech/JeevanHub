import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Loader2, Sparkles, Stethoscope, X } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { authFetch } from "../utils/authFetch";
import { BACKEND_URL } from "../config";

function isValidImage(src) {
  return Boolean(src) && src !== "undefined" && src !== "null";
}

function getInitials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function DoctorAvatar({ src, name }) {
  return (
    <Avatar size="lg">
      {isValidImage(src) && <AvatarImage src={src} alt={name} />}
      <AvatarFallback className="bg-secondary font-semibold text-primary">
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}

const DEFAULT_FILTERS = {
  specialization: "",
  experience: "",
  priceRange: "",
  location: "",
  language: "",
  sort: "",
  rating: "",
  gender: "",
};

// Human-readable chip text per filter key — keys not listed here (e.g. "sort",
// which orders results rather than narrowing them) never render as a chip.
const FILTER_CHIP_LABELS = {
  specialization: (v) => v,
  experience: (v) => ({ "1": "1 year or less", "2-5": "2-5 years experience", "5+": "5+ years experience" }[v] || v),
  priceRange: (v) => ({ Low: "Under ₹500", Medium: "₹500 - ₹1000", High: "Over ₹1000" }[v] || v),
  location: (v) => v,
  language: (v) => v,
  rating: (v) => `${v}★`,
  gender: (v) => v,
};

const SPECIALIZATION_OPTIONS = [
  { value: "Skin Diseases", label: "Skin Diseases" },
  { value: "Digestive and Metabolic", label: "Digestive and Metabolic" },
  { value: "Respiratory Diseases", label: "Respiratory Diseases" },
];
const EXPERIENCE_OPTIONS = [
  { value: "1", label: "1 year or less" },
  { value: "2-5", label: "2 - 5 years" },
  { value: "5+", label: "More than 5 years" },
];
const PRICE_RANGE_OPTIONS = [
  { value: "Low", label: "Less than ₹500" },
  { value: "Medium", label: "₹500 - ₹1000" },
  { value: "High", label: "More than ₹1000" },
];
const LOCATION_OPTIONS = [
  { value: "Jamshedpur, Jharkhand", label: "Jamshedpur, Jharkhand" },
  { value: "Gurugram, Haryana", label: "Gurugram, Haryana" },
];
const LANGUAGE_OPTIONS = [
  { value: "English", label: "English" },
  { value: "Hindi", label: "Hindi" },
];
const GENDER_OPTIONS = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
];
const RATING_OPTIONS = [
  { value: "1.0", label: "1 star" },
  { value: "2.0", label: "2 star" },
  { value: "3.0", label: "3 star" },
  { value: "4.0", label: "4 star" },
  { value: "5.0", label: "5 star" },
];
const SORT_OPTIONS = [
  { value: "lowToHigh", label: "Rating: Low to High" },
  { value: "highToLow", label: "Rating: High to Low" },
];

function FilterSelect({ id, label, placeholder, options, value, onValueChange, disabled }) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger id={id}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

function DoctorsScreen() {
  const navigate = useNavigate();
  const [showFilter, setShowFilter] = useState(
    () => typeof window === "undefined" || window.innerWidth > 860,
  );
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [doctors, setDoctors] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error

  // AI illness-match state.
  const [aiQuery, setAiQuery] = useState("");
  const [aiStatus, setAiStatus] = useState("idle"); // idle | loading | ready | clarify | error
  const [aiError, setAiError] = useState("");
  const [aiRanking, setAiRanking] = useState(null); // Map(id -> { score, reason }) | null
  const [aiQueryUsed, setAiQueryUsed] = useState("");
  const [aiMessage, setAiMessage] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    authFetch(`${BACKEND_URL}/api/doctors/publicDoctors`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        const approvedDoctors = data.filter((doc) => doc.approvalStatus === "Approved");

        const mappedDoctors = approvedDoctors.map((doctor) => ({
          id: doctor._id,
          name: `${doctor.firstName} ${doctor.lastName}`,
          specialization: Array.isArray(doctor.specialization)
            ? doctor.specialization.join(", ") || "N/A"
            : doctor.specialization || "N/A",
          experience: doctor.experience ? `${doctor.experience} years` : "0 years",
          email: `${doctor.email}`,
          pricepoint: `${doctor.price || "0"}`,
          priceRange:
            doctor.price < 500 ? "Low" : doctor.price >= 500 && doctor.price <= 1000 ? "Medium" : "High",
          location: doctor.zipCode || "N/A",
          language: doctor.languages?.join(", ") || "English",
          rating: 4.0,
          gender: doctor.gender ? doctor.gender.charAt(0).toUpperCase() + doctor.gender.slice(1) : "N/A",
          profileImage: doctor.profileImage || null,
        }));
        setDoctors(mappedDoctors);
        setStatus("ready");
      })
      .catch((error) => {
        console.error("Error fetching doctors:", error);
        setStatus("error");
      });
  }, []);

  const filteredDoctors = doctors.filter(
    (doctor) =>
      (filters.specialization ? doctor.specialization === filters.specialization : true) &&
      (filters.experience
        ? (filters.experience === "1" && parseInt(doctor.experience) <= 1) ||
          (filters.experience === "2-5" && parseInt(doctor.experience) >= 2 && parseInt(doctor.experience) <= 5) ||
          (filters.experience === "5+" && parseInt(doctor.experience) > 5)
        : true) &&
      (filters.priceRange ? doctor.priceRange === filters.priceRange : true) &&
      (filters.location ? doctor.location === filters.location : true) &&
      (filters.language ? doctor.language.includes(filters.language) : true) &&
      (filters.rating ? doctor.rating === parseFloat(filters.rating) : true) &&
      (filters.gender ? doctor.gender === filters.gender : true),
  );

  const aiActive = aiRanking != null;

  // When AI matching is active, keep only ranked doctors and order by AI score
  // instead of the chosen sort; hard filters above still apply, so AI +
  // filters compose.
  const sortedDoctors = useMemo(() => {
    if (aiActive) {
      return filteredDoctors
        .filter((d) => aiRanking.has(d.id))
        .map((d) => ({ ...d, ai: aiRanking.get(d.id) }))
        .sort((a, b) => b.ai.score - a.ai.score);
    }
    return [...filteredDoctors].sort((a, b) => {
      if (filters.sort === "lowToHigh") return a.rating - b.rating;
      if (filters.sort === "highToLow") return b.rating - a.rating;
      return 0;
    });
  }, [filteredDoctors, aiActive, aiRanking, filters.sort]);

  // Chips reflect narrowing filters only — "sort" changes order, not results,
  // so it's excluded here and from the count.
  const activeChips = useMemo(
    () =>
      Object.entries(filters)
        .filter(([key, value]) => value !== "" && FILTER_CHIP_LABELS[key])
        .map(([key, value]) => ({ key, value, text: FILTER_CHIP_LABELS[key](value) })),
    [filters],
  );

  const setFilterValue = (key) => (value) => setFilters((prev) => ({ ...prev, [key]: value }));
  const clearFilter = (key) => setFilters((prev) => ({ ...prev, [key]: "" }));

  const handleDoctorClick = (doctor) => {
    navigate("/doctor-detail", { state: { doctor } });
  };

  const runAiMatch = useCallback(async () => {
    const query = aiQuery.trim();
    if (!query) return;
    setAiStatus("loading");
    setAiError("");
    try {
      const token = localStorage.getItem("token");
      const res = await authFetch(`${BACKEND_URL}/api/doctors/ai-match`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "AI matching failed.");

      if (data.status === "clarify") {
        setAiRanking(null);
        setAiQueryUsed("");
        setAiMessage(data.message || "Could you share a bit more about what you're experiencing?");
        setAiSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []);
        setAiStatus("clarify");
        return;
      }

      const map = new Map((data.ranked || []).map((r) => [r.id, { score: r.score, reason: r.reason }]));
      setAiRanking(map);
      setAiQueryUsed(query);
      setAiMessage("");
      setAiSuggestions([]);
      setAiStatus("ready");
    } catch (e) {
      setAiError(e.message || "Something went wrong. Please try again.");
      setAiStatus("error");
    }
  }, [aiQuery]);

  const clearAiMatch = () => {
    setAiRanking(null);
    setAiQueryUsed("");
    setAiMessage("");
    setAiSuggestions([]);
    setAiStatus("idle");
    setAiError("");
  };

  return (
    <div className="relative -mt-8 min-h-screen bg-linear-to-b from-(--jh-cream-tint) to-background pt-8 pb-20">
      <div className="mx-auto mb-10 max-w-2xl px-6 text-center">
        <h1 className="font-display text-3xl leading-tight text-foreground sm:text-4xl">
          Find Your Ayurvedic Doctor
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          Describe your concern and let AI find your best-matched practitioners — or browse and filter profiles yourself.
        </p>
      </div>

      <div className="mx-auto mb-8 max-w-3xl px-4 sm:px-6 lg:px-8">
        <Card
          className={cn(
            "gap-3 border-primary/20 bg-(--jh-sage-pale) p-5 shadow-(--jh-shadow-rest) transition-colors sm:p-6",
            aiActive && "border-primary/40",
          )}
        >
          <div className="flex flex-col gap-1.5">
            <Badge className="w-fit">
              <Sparkles className="size-3.5" aria-hidden="true" /> AI Match
            </Badge>
            <h2 className="font-display text-xl text-foreground">Describe your concern, meet your doctor</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Tell us your symptoms or condition in your own words. Our AI ranks the doctors best suited to help.
            </p>
          </div>

          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start">
            <Textarea
              className="min-h-16 flex-1 bg-card"
              placeholder="e.g. I've had chronic acidity and bloating after meals for a few months…"
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) runAiMatch();
              }}
              rows={2}
              maxLength={800}
            />
            <Button
              type="button"
              className="sm:w-auto"
              onClick={runAiMatch}
              disabled={aiStatus === "loading" || !aiQuery.trim()}
            >
              {aiStatus === "loading" ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Analyzing…
                </>
              ) : (
                "Find my match"
              )}
            </Button>
          </div>

          {aiStatus === "error" && <p className="text-sm font-medium text-destructive">{aiError}</p>}

          {aiStatus === "clarify" && (
            <div className="flex flex-col gap-2 rounded-lg border border-primary/20 bg-card p-3.5">
              <p className="text-sm leading-relaxed text-foreground">{aiMessage}</p>
              {aiSuggestions.length > 0 && (
                <ul className="flex flex-col gap-1">
                  {aiSuggestions.map((suggestion, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-sm leading-relaxed text-muted-foreground">
                      <span aria-hidden="true">•</span> {suggestion}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {aiActive && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-sm">
              <span className="text-muted-foreground">
                Showing AI matches for: <strong className="text-foreground">&ldquo;{aiQueryUsed}&rdquo;</strong>
              </span>
              <Button type="button" variant="link" size="sm" className="h-auto p-0" onClick={clearAiMatch}>
                Clear AI match
              </Button>
            </div>
          )}
        </Card>
      </div>

      <div className="mx-auto flex max-w-6xl items-start gap-6 px-4 sm:px-6 lg:px-8">
        <aside className="sticky top-6 w-full flex-none max-md:static md:w-70">
          <button
            type="button"
            className="flex w-full items-center justify-between gap-2 rounded-xl border border-border bg-card px-4.5 py-4 text-left text-base font-semibold text-foreground shadow-(--jh-shadow-rest)"
            aria-expanded={showFilter}
            onClick={() => setShowFilter((v) => !v)}
          >
            <span className="inline-flex items-center gap-2">
              Filter doctors
              {activeChips.length > 0 && (
                <Badge className="min-w-5 justify-center">{activeChips.length}</Badge>
              )}
            </span>
            <ChevronDown
              className={cn("size-4 shrink-0 text-primary transition-transform duration-200", showFilter && "rotate-180")}
              aria-hidden="true"
            />
          </button>

          <div
            className={cn(
              "grid transition-[grid-template-rows] duration-300 ease-out",
              showFilter ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
            )}
          >
            <div className="min-h-0 overflow-hidden">
              <Card className="mt-2.5 gap-4 p-4.5 shadow-(--jh-shadow-rest)">
                <div className="flex items-center justify-between">
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Narrow the list by specialization, budget, and more.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto self-start p-0 text-(--jh-bark-brown) disabled:opacity-50"
                  disabled={activeChips.length === 0}
                  onClick={() => setFilters(DEFAULT_FILTERS)}
                >
                  Clear all
                </Button>

                <FilterSelect
                  id="specialization"
                  label="Specialization"
                  placeholder="All specializations"
                  options={SPECIALIZATION_OPTIONS}
                  value={filters.specialization}
                  onValueChange={setFilterValue("specialization")}
                />

                <div className="grid grid-cols-2 gap-3.5">
                  <FilterSelect
                    id="experience"
                    label="Experience"
                    placeholder="Any"
                    options={EXPERIENCE_OPTIONS}
                    value={filters.experience}
                    onValueChange={setFilterValue("experience")}
                  />
                  <FilterSelect
                    id="priceRange"
                    label="Price range"
                    placeholder="All"
                    options={PRICE_RANGE_OPTIONS}
                    value={filters.priceRange}
                    onValueChange={setFilterValue("priceRange")}
                  />
                  <FilterSelect
                    id="location"
                    label="Location"
                    placeholder="All locations"
                    options={LOCATION_OPTIONS}
                    value={filters.location}
                    onValueChange={setFilterValue("location")}
                  />
                  <FilterSelect
                    id="language"
                    label="Language"
                    placeholder="All languages"
                    options={LANGUAGE_OPTIONS}
                    value={filters.language}
                    onValueChange={setFilterValue("language")}
                  />
                  <FilterSelect
                    id="gender"
                    label="Gender"
                    placeholder="Any"
                    options={GENDER_OPTIONS}
                    value={filters.gender}
                    onValueChange={setFilterValue("gender")}
                  />
                  <FilterSelect
                    id="rating"
                    label="Rating"
                    placeholder="Any"
                    options={RATING_OPTIONS}
                    value={filters.rating}
                    onValueChange={setFilterValue("rating")}
                  />
                </div>

                <div className="border-t border-border pt-4">
                  <FilterSelect
                    id="sort"
                    label="Sort by"
                    placeholder="Default"
                    options={SORT_OPTIONS}
                    value={filters.sort}
                    onValueChange={setFilterValue("sort")}
                    disabled={aiActive}
                  />
                  {aiActive && (
                    <p className="mt-1.5 text-xs text-muted-foreground">Sorting is set by AI match</p>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mb-4.5 flex min-h-8 flex-wrap items-center gap-x-4 gap-y-2.5">
            <span className="text-sm font-semibold whitespace-nowrap text-muted-foreground">
              {status === "ready"
                ? `${sortedDoctors.length} doctor${sortedDoctors.length === 1 ? "" : "s"} ${aiActive ? "matched" : "found"}`
                : " "}
            </span>

            {activeChips.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {activeChips.map((chip) => (
                  <button
                    type="button"
                    key={chip.key}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-(--jh-sage-pale) py-1.5 pr-2.5 pl-3.5 text-sm font-semibold text-(--jh-olive-deep) transition-colors hover:bg-(--jh-sage-pale-2)"
                    onClick={() => clearFilter(chip.key)}
                  >
                    {chip.text}
                    <X className="size-3.5" aria-hidden="true" />
                    <span className="sr-only">Remove {chip.text} filter</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] items-stretch gap-5">
            {status === "loading" &&
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="gap-3 p-6" aria-hidden="true">
                  <Skeleton className="size-13 rounded-full" />
                  <Skeleton className="h-3.5 w-3/5" />
                  <Skeleton className="h-3.5 w-4/5" />
                  <Skeleton className="h-3.5 w-7/10" />
                  <Skeleton className="mt-2 h-10.5 w-full" />
                </Card>
              ))}

            {status === "error" && (
              <EmptyState
                className="col-span-full"
                icon={Stethoscope}
                title="Couldn't load doctors"
                description="Please refresh the page and try again."
              />
            )}

            {status === "ready" && sortedDoctors.length === 0 && (
              <EmptyState
                className="col-span-full"
                icon={Stethoscope}
                title={aiActive ? "No doctors matched your description" : "No doctors match your filters"}
                description={
                  aiActive
                    ? "Try describing your concern differently, or clear your filters to see more results."
                    : "Try clearing a filter to see more results."
                }
                action={
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setFilters(DEFAULT_FILTERS);
                      clearAiMatch();
                    }}
                  >
                    Clear filters
                  </Button>
                }
              />
            )}

            {status === "ready" &&
              sortedDoctors.map((doctor) => (
                <Card
                  key={doctor.id}
                  className={cn(
                    "cursor-pointer justify-between gap-3.5 p-6 shadow-(--jh-shadow-card) transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-(--jh-shadow-hover)",
                    doctor.ai && "border-primary/40",
                  )}
                  onClick={() => handleDoctorClick(doctor)}
                >
                  <div className="flex flex-col gap-2">
                    <div className="mb-1.5 flex items-center gap-3">
                      <DoctorAvatar src={doctor.profileImage} name={doctor.name} />
                      <div className="font-display text-lg font-semibold text-foreground">Dr. {doctor.name}</div>
                    </div>

                    {doctor.ai && (
                      <div className="mb-1 flex flex-col gap-1 rounded-lg bg-(--jh-sage-pale) p-2.5">
                        <Badge className="w-fit">
                          <Sparkles className="size-3.5" aria-hidden="true" /> {doctor.ai.score}% match
                        </Badge>
                        <p className="text-sm leading-relaxed text-(--jh-olive-deep)">{doctor.ai.reason}</p>
                      </div>
                    )}

                    <p className="text-sm leading-relaxed text-muted-foreground">
                      <span className="mr-1 font-bold text-foreground">Specialization</span>
                      {doctor.specialization}
                    </p>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      <span className="mr-1 font-bold text-foreground">Experience</span>
                      {doctor.experience}
                    </p>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      <span className="mr-1 font-bold text-foreground">Location</span>
                      {doctor.location}
                    </p>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      <span className="mr-1 font-bold text-foreground">Languages</span>
                      {doctor.language}
                    </p>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      <span className="mr-1 font-bold text-foreground">Gender</span>
                      {doctor.gender}
                    </p>
                  </div>

                  <Button
                    type="button"
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDoctorClick(doctor);
                    }}
                  >
                    Book Consultation
                  </Button>
                </Card>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DoctorsScreen;
