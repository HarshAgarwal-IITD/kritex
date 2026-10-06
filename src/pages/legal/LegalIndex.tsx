import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import LegalLayout from "./LegalLayout";
import { policies } from "./policies";

const LegalIndex = () => (
  <LegalLayout
    path="/legal"
    title="Policies"
    description="Kritex store policies: terms and conditions, privacy, refunds and returns, shipping, cancellation, and grievance contact."
  >
    <p>
      These policies apply to purchases from the Kritex online store and to your use of kritex.in. Institutional and
      bulk procurement is also governed by the terms of the relevant quote or purchase order.
    </p>
    <ul className="!list-none !pl-0 grid gap-px bg-border border border-border mt-8">
      {policies.map((p) => (
        <li key={p.path} className="!mb-0 !pl-0 bg-background">
          <Link
            to={p.path}
            className="group flex items-start justify-between gap-4 p-5 !no-underline hover:bg-secondary transition-colors duration-200"
          >
            <span>
              <span className="block font-display text-sm uppercase tracking-wider text-foreground group-hover:text-primary transition-colors duration-200">
                {p.title}
              </span>
              <span className="mt-2 block text-muted-foreground text-sm">{p.description}</span>
            </span>
            <ArrowRight size={16} className="mt-0.5 shrink-0 text-muted-foreground group-hover:text-primary" aria-hidden="true" />
          </Link>
        </li>
      ))}
    </ul>
  </LegalLayout>
);

export default LegalIndex;
