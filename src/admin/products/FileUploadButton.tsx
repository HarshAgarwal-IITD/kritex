import { useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ACCEPT_BY_PURPOSE, uploadFile } from "../api/uploads";
import type { UploadPurpose } from "../api/types";

/** Picks files, uploads each via the presigned flow and reports the public URLs. */
export function FileUploadButton({
  purpose,
  label,
  multiple = false,
  disabled,
  onUploaded,
}: {
  purpose: UploadPurpose;
  label: string;
  multiple?: boolean;
  disabled?: boolean;
  onUploaded: (file: File, url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(0);

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const list = Array.from(files);
    setBusy((n) => n + list.length);
    await Promise.all(
      list.map(async (file) => {
        try {
          onUploaded(file, await uploadFile(file, purpose));
        } catch (e) {
          toast.error(e instanceof Error ? e.message : `${file.name}: upload failed`);
        } finally {
          setBusy((n) => n - 1);
        }
      }),
    );
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        accept={ACCEPT_BY_PURPOSE[purpose]}
        multiple={multiple}
        aria-label={label}
        tabIndex={-1}
        onChange={(e) => onFiles(e.target.files)}
      />
      <Button type="button" variant="outline" size="sm" disabled={disabled || busy > 0} onClick={() => inputRef.current?.click()}>
        {busy > 0 ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        {busy > 0 ? `Uploading ${busy}…` : label}
      </Button>
    </>
  );
}
