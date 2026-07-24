import { useState } from "react";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useGlobalSearch } from "@/hooks/useGlobalSearch";

const TYPE_ROUTES_WITH_QUERY = new Set(["medicine", "disease"]);

function GlobalSearchBox({
  exploreOptions,
  defaultType = "medicine",
  showTypeSelect = true,
  className = "",
  onNavigate,
}) {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState(defaultType);
  const { query, setQuery, results, open, setOpen, clear } = useGlobalSearch(selectedType);

  const goTo = (to) => {
    navigate(to);
    clear();
    onNavigate?.();
  };

  const handleTypeChange = (value) => {
    setSelectedType(value);
    const option = exploreOptions.find((item) => item.value === value);
    if (option) navigate(option.to);
  };

  const handleKeyDown = (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();

    const trimmed = query.trim();
    if (!trimmed) return;

    if (results.length > 0) {
      goTo(results[0].to);
      return;
    }

    const option = exploreOptions.find((item) => item.value === selectedType);
    const base = option?.to || "/medicines";
    goTo(TYPE_ROUTES_WITH_QUERY.has(selectedType) ? `${base}?q=${encodeURIComponent(trimmed)}` : base);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="flex h-11 w-full items-center gap-2 rounded-lg bg-primary-foreground/10 pl-3 pr-1 text-primary-foreground/70 ring-1 ring-inset ring-primary-foreground/15 focus-within:ring-2 focus-within:ring-primary-foreground/60">
        <Search className="size-4 shrink-0" aria-hidden="true" />

        {showTypeSelect ? (
          <>
            <Select value={selectedType} onValueChange={handleTypeChange} items={exploreOptions}>
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
          </>
        ) : null}

        <Input
          aria-label="Search JeevanHub"
          placeholder="Search care, doctors, or medicines"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setOpen(true)}
          className="h-9 border-0 bg-transparent px-1 text-primary-foreground shadow-none placeholder:text-primary-foreground/55 focus-visible:ring-0"
        />
      </div>

      {open && query.trim() ? (
        <div className="absolute top-full left-0 z-50 mt-1 w-full overflow-hidden rounded-lg border border-border bg-popover shadow-lg">
          {results.length > 0 ? (
            results.slice(0, 8).map((result) => (
              <button
                key={result.key}
                type="button"
                onClick={() => goTo(result.to)}
                className="block w-full px-3 py-2 text-left text-sm text-popover-foreground hover:bg-accent"
              >
                {result.label}
              </button>
            ))
          ) : (
            <p className="px-3 py-2 text-sm text-muted-foreground">No results found</p>
          )}
        </div>
      ) : null}
    </div>
  );
}

export default GlobalSearchBox;
