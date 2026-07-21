import { useEffect, useId, useMemo, useRef, useState } from "react";

import { COUNTRY_CODES } from "./countryCodes";
import { Input } from "@/components/ui/input";

// Searchable dial-code picker: typing "+91" or "india" both filter to India.
function CountryCodeSelect({ value, onChange, onBlur, hasError }) {
	const listboxId = useId();
	const selected = useMemo(() => COUNTRY_CODES.find((c) => c.dial === value) || null, [value]);
	const [query, setQuery] = useState("");
	const [isOpen, setIsOpen] = useState(false);
	const wrapRef = useRef(null);

	useEffect(() => {
		const handleClickOutside = (e) => {
			if (wrapRef.current && !wrapRef.current.contains(e.target)) {
				setIsOpen(false);
				setQuery("");
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!q) return COUNTRY_CODES;
		return COUNTRY_CODES.filter(
			(c) => c.name.toLowerCase().includes(q) || c.dial.includes(q) || c.dial.replace("+", "").includes(q)
		);
	}, [query]);

	const handleSelect = (country) => {
		onChange(country.dial);
		setIsOpen(false);
		setQuery("");
	};

	return (
		<div className="relative w-full flex-none sm:w-48" ref={wrapRef}>
			<Input
				type="text"
				value={isOpen ? query : selected ? selected.label : ""}
				placeholder="Search country or dial code"
				onFocus={() => {
					setIsOpen(true);
					setQuery("");
				}}
				onChange={(e) => setQuery(e.target.value)}
				onBlur={onBlur}
				aria-invalid={hasError}
				className="cursor-pointer"
				// Chrome frequently ignores a literal autocomplete="off" on text
				// inputs and shows its own field-value-history suggestions list on
				// top of our dropdown anyway. A nonsense token isn't a recognized
				// autofill category, which reliably suppresses it where "off" alone
				// doesn't.
				autoComplete="jh-country-search-no-autofill"
				name="jh-country-search"
				autoCorrect="off"
				autoCapitalize="off"
				spellCheck="false"
				role="combobox"
				aria-expanded={isOpen}
				aria-autocomplete="list"
				aria-controls={listboxId}
			/>
			{isOpen ? (
				<ul
					className="absolute top-[calc(100%+4px)] left-0 z-50 max-h-64 w-64 overflow-y-auto rounded-lg border border-input bg-popover p-1.5 shadow-lg sm:w-full"
					role="listbox"
					id={listboxId}
				>
					{filtered.length === 0 ? (
						<li className="p-2.5 text-center text-sm text-muted-foreground">No matches</li>
					) : null}
					{filtered.map((country) => (
						<li
							key={country.iso}
							role="option"
							aria-selected={country.dial === value}
							className={
								country.dial === value
									? "flex cursor-pointer items-center gap-2 rounded-md bg-accent p-2 text-sm text-popover-foreground"
									: "flex cursor-pointer items-center gap-2 rounded-md p-2 text-sm text-popover-foreground hover:bg-accent"
							}
							onMouseDown={(e) => {
								e.preventDefault(); // keep focus so onBlur doesn't fire before the click registers
								handleSelect(country);
							}}
						>
							<span>{country.flag}</span>
							<span className="flex-1 truncate">{country.name}</span>
							<span className="text-xs text-muted-foreground">{country.dial}</span>
						</li>
					))}
				</ul>
			) : null}
		</div>
	);
}

export default CountryCodeSelect;
