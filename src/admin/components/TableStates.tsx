import { Skeleton } from "@/components/ui/skeleton";
import { TableCell, TableRow } from "@/components/ui/table";

/** Skeleton rows while a table loads, or a centred message when it is empty. */
export function TableStates({ loading, empty, colSpan, message }: { loading: boolean; empty: boolean; colSpan: number; message: string }) {
  if (loading) {
    return (
      <>
        {Array.from({ length: 4 }).map((_, i) => (
          <TableRow key={i}>
            <TableCell colSpan={colSpan}>
              <Skeleton className="h-8 w-full" />
            </TableCell>
          </TableRow>
        ))}
      </>
    );
  }
  if (!empty) return null;
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="py-10 text-center text-sm text-muted-foreground">
        {message}
      </TableCell>
    </TableRow>
  );
}
