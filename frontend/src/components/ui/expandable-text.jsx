import { useState } from "react";
import { cn } from "@/lib/utils";

function ExpandableText({
  text = "",
  maxLength = 180,
  showAllText = "Show all",
  showLessText = "Show less",
  className,
  buttonClassName,
  as: Component = "p",
  ...props
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!text || typeof text !== "string") {
    return null;
  }

  const isLong = text.length > maxLength;

  if (!isLong) {
    return (
      <Component
        data-slot="expandable-text"
        className={cn("whitespace-pre-line break-words text-sm text-muted-foreground", className)}
        {...props}
      >
        {text}
      </Component>
    );
  }

  const getTruncatedText = () => {
    const sub = text.slice(0, maxLength);
    const lastSpace = sub.lastIndexOf(" ");
    return (lastSpace > maxLength * 0.5 ? sub.slice(0, lastSpace) : sub).trim();
  };

  return (
    <Component
      data-slot="expandable-text"
      className={cn("whitespace-pre-line break-words text-sm text-muted-foreground", className)}
      {...props}
    >
      {isExpanded ? text : `${getTruncatedText()}... `}
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className={cn(
          "inline-block cursor-pointer font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-xs",
          buttonClassName
        )}
        aria-expanded={isExpanded}
      >
        {isExpanded ? showLessText : showAllText}
      </button>
    </Component>
  );
}

export { ExpandableText };
