import PasswordInput from "./PasswordInput";
import CountryCodeSelect from "./CountryCodeSelect";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

export function TextField({ label, name, value, onChange, onBlur, error, type = "text", placeholder, ...rest }) {
	return (
		<Field data-invalid={!!error} className="mb-3.5">
			<FieldLabel htmlFor={name}>{label}</FieldLabel>
			<Input
				id={name}
				type={type}
				name={name}
				value={value}
				onChange={onChange}
				onBlur={onBlur}
				placeholder={placeholder}
				aria-invalid={!!error}
				{...rest}
			/>
			<FieldError>{error}</FieldError>
		</Field>
	);
}

export function SelectField({ label, name, value, onChange, onBlur, error, options, placeholder = "Select..." }) {
	return (
		<Field data-invalid={!!error} className="mb-3.5">
			<FieldLabel htmlFor={name}>{label}</FieldLabel>
			<Select
				value={value}
				onValueChange={(val) => onChange({ target: { name, value: val } })}
				onOpenChange={(open) => !open && onBlur?.({ target: { name } })}
			>
				<SelectTrigger id={name} aria-invalid={!!error}>
					<SelectValue placeholder={placeholder} />
				</SelectTrigger>
				<SelectContent>
					{options.map((opt) => {
						const optVal = typeof opt === "object" ? opt.value : opt;
						const optLabel = typeof opt === "object" ? opt.label : opt;
						return (
							<SelectItem key={optVal} value={optVal}>
								{optLabel}
							</SelectItem>
						);
					})}
				</SelectContent>
			</Select>
			<FieldError>{error}</FieldError>
		</Field>
	);
}

export function PasswordField({ label = "Password", name, value, onChange, onBlur, error, placeholder }) {
	return (
		<Field data-invalid={!!error} className="mb-3.5">
			<FieldLabel htmlFor={name}>{label}</FieldLabel>
			<PasswordInput name={name} value={value} onChange={onChange} onBlur={onBlur} placeholder={placeholder} hasError={!!error} />
			<FieldError>{error}</FieldError>
		</Field>
	);
}

// Password + Confirm Password, laid out as an explicit single grid row
// instead of wherever the 2-column auto-flow happens to land them.
// layout="row" (Doctor): the two fields sit side by side, one per column.
// layout="stacked" (Patient/Retailer, default): they stack in the left
// column, and `rightSlot` - typically the zip/PIN field - fills the right
// column instead of leaving it blank.
export function PasswordPairField({
	passwordLabel = "Password",
	confirmLabel = "Confirm Password",
	passwordPlaceholder,
	confirmPlaceholder,
	passwordValue,
	onPasswordChange,
	passwordError,
	confirmValue,
	onConfirmChange,
	confirmError,
	onBlur,
	layout = "stacked",
	rightSlot,
}) {
	if (layout === "row") {
		return (
			<div className="col-span-full grid grid-cols-1 gap-x-7 gap-y-2 sm:grid-cols-2">
				<PasswordField
					label={passwordLabel}
					placeholder={passwordPlaceholder}
					name="password"
					value={passwordValue}
					onChange={onPasswordChange}
					onBlur={onBlur}
					error={passwordError}
				/>
				<PasswordField
					label={confirmLabel}
					placeholder={confirmPlaceholder}
					name="confirmPassword"
					value={confirmValue}
					onChange={onConfirmChange}
					onBlur={onBlur}
					error={confirmError}
				/>
			</div>
		);
	}

	return (
		<div className="col-span-full grid grid-cols-1 gap-x-7 gap-y-2 sm:grid-cols-2">
			<div className="col-span-1 flex flex-col">
				<PasswordField
					label={passwordLabel}
					placeholder={passwordPlaceholder}
					name="password"
					value={passwordValue}
					onChange={onPasswordChange}
					onBlur={onBlur}
					error={passwordError}
				/>
				<PasswordField
					label={confirmLabel}
					placeholder={confirmPlaceholder}
					name="confirmPassword"
					value={confirmValue}
					onChange={onConfirmChange}
					onBlur={onBlur}
					error={confirmError}
				/>
			</div>
			{rightSlot ? <div className="col-span-1">{rightSlot}</div> : null}
		</div>
	);
}

export function PhoneField({ label = "Phone Number", countryCode, onCountryChange, phone, onPhoneChange, onBlur, countryError, phoneError, placeholder }) {
	return (
		<Field data-invalid={!!(countryError || phoneError)} className="mb-3.5">
			<FieldLabel htmlFor="phone">{label}</FieldLabel>
			<div className="flex gap-2">
				<CountryCodeSelect value={countryCode} onChange={onCountryChange} onBlur={onBlur} hasError={!!countryError} />
				<Input
					id="phone"
					type="tel"
					name="phone"
					value={phone}
					onChange={onPhoneChange}
					onBlur={onBlur}
					placeholder={placeholder || (countryCode === "+91" ? "10-digit number" : "Phone number")}
					aria-invalid={!!phoneError}
					className="min-w-0 flex-1"
				/>
			</div>
			<FieldError>{countryError || phoneError}</FieldError>
		</Field>
	);
}

export function FileField({ label, name, file, onChange, error, helperText, required: isRequired, accept, optionalText = "(optional)", selectedText = "Selected:" }) {
	return (
		<Field data-invalid={!!error} className="mb-3.5 rounded-lg bg-secondary p-4">
			<FieldLabel htmlFor={name}>
				{label}
				{!isRequired ? <span className="font-normal text-muted-foreground"> {optionalText}</span> : null}
			</FieldLabel>
			<input
				id={name}
				type="file"
				name={name}
				accept={accept}
				onChange={(e) => onChange(e.target.files?.[0] || null)}
				aria-invalid={!!error}
				className="text-sm text-foreground file:mr-3.5 file:cursor-pointer file:rounded-full file:border-0 file:bg-primary file:px-5 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground"
			/>
			{file ? <p className="mt-2 text-sm font-semibold text-primary">{selectedText} {file.name}</p> : null}
			{helperText ? <p className="mt-1.5 text-xs text-muted-foreground">{helperText}</p> : null}
			<FieldError>{error}</FieldError>
		</Field>
	);
}
