import { CalendarDays } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function DatePicker({
  value = "",
  onChange,
  placeholder = "Select a date",
  disabled = false,
  className,
  ...props
}) {
  return (
    <div className={cn("relative", className)}>
      <Input
        type="date"
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        disabled={disabled}
        aria-label={props["aria-label"] || placeholder}
        {...props}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        tabIndex={-1}
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground"
      >
        <CalendarDays />
      </Button>
    </div>
  );
}

export { DatePicker };
