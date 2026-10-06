import type { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Section = ({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) => (
  <Card className="rounded-none bg-card/50" aria-label={title} role="region">
    <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
      <div className="space-y-1.5">
        <CardTitle className="font-display text-sm">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </div>
      {actions}
    </CardHeader>
    <CardContent className="space-y-4">{children}</CardContent>
  </Card>
);
