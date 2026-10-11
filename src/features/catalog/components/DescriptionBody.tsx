import { Fragment } from "react";
import { cn } from "@/lib/utils";
import type { DescriptionBlock } from "@/features/catalog/description";

/** Renders `**bold**` spans; everything else is plain text (no HTML is ever injected). */
const Inline = ({ text }: { text: string }) => (
  <>
    {text.split(/(\*\*.+?\*\*)/g).map((part, i) =>
      part.startsWith("**") && part.endsWith("**") ? (
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      ) : (
        <Fragment key={i}>{part}</Fragment>
      ),
    )}
  </>
);

export const DescriptionBody = ({ blocks, className }: { blocks: DescriptionBlock[]; className?: string }) => (
  <div className={cn("space-y-5", className)}>
    {blocks.map((block, i) => {
      if (block.kind === "heading")
        return (
          <h3
            key={i}
            className="font-display text-[11px] uppercase tracking-wider text-primary pt-4 first:pt-0 border-t border-border first:border-t-0"
          >
            {block.text}
          </h3>
        );
      if (block.kind === "list")
        return (
          <ul key={i} className="space-y-3">
            {block.items.map((item, j) => (
              <li key={j} className="flex gap-3 font-body text-sm leading-relaxed text-muted-foreground">
                <span aria-hidden className="mt-[0.55rem] h-1.5 w-1.5 shrink-0 bg-primary" />
                <span>
                  <Inline text={item} />
                </span>
              </li>
            ))}
          </ul>
        );
      return (
        <p key={i} className="font-body text-sm leading-relaxed text-muted-foreground">
          <Inline text={block.text} />
        </p>
      );
    })}
  </div>
);
