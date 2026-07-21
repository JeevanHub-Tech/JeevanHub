import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty";
import { cn } from "@/lib/utils";

function EmptyState({ icon: Icon, title, description, action, className, ...props }) {
  return (
    <Empty className={cn("border border-dashed border-border bg-card/50", className)} {...props}>
      <EmptyHeader>
        {Icon ? (
          <EmptyMedia variant="icon" className="size-12 rounded-full bg-secondary text-primary [&_svg:not([class*='size-'])]:size-6">
            <Icon aria-hidden="true" />
          </EmptyMedia>
        ) : null}
        {title ? <EmptyTitle className="font-display text-lg font-normal tracking-normal text-foreground">{title}</EmptyTitle> : null}
        {description ? <EmptyDescription>{description}</EmptyDescription> : null}
      </EmptyHeader>
      {action ? <EmptyContent>{action}</EmptyContent> : null}
    </Empty>
  );
}

export { EmptyState };
