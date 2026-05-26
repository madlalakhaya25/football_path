"use client";
import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function PlayerPhotoUpload({ playerId }: { playerId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  async function handleFile(file: File) {
    const supabase = createClient();
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `${playerId}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from("player-photos")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (uploadErr) { alert(uploadErr.message); return; }

    const { data: { publicUrl } } = supabase.storage
      .from("player-photos")
      .getPublicUrl(path);

    const { error: updateErr } = await supabase
      .from("players")
      .update({ photo_url: publicUrl })
      .eq("id", playerId);

    if (updateErr) { alert(updateErr.message); return; }
    router.refresh();
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          e.target.value = "";
          start(() => handleFile(file));
        }}
      />
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="size-4" aria-hidden="true" />
        {pending ? "Uploading…" : "Upload photo"}
      </Button>
    </>
  );
}
