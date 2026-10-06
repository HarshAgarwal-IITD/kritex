import { isUnfilled, PLACEHOLDERS, type PlaceholderKey } from "./placeholders";

/** Renders a business fact from PLACEHOLDERS; unfilled values are highlighted so they are easy to find. */
const Ph = ({ k }: { k: PlaceholderKey }) => {
  const value = PLACEHOLDERS[k];
  if (!isUnfilled(value)) return <>{value}</>;
  return (
    <mark data-placeholder={k} className="bg-accent/15 text-accent font-display text-[0.9em] px-1 rounded-sm">
      {value}
    </mark>
  );
};

export default Ph;
