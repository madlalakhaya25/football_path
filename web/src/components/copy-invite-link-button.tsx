"use client";
import { useState } from "react";
import { Link2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CopyInviteLinkButton({ inviteCode }: { inviteCode: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const url = `${window.location.origin}/join/${inviteCode}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2 shrink-0">
      {copied ? (
        <><Check className="size-4 text-green-600" aria-hidden="true" /> Copied!</>
      ) : (
        <><Link2 className="size-4" aria-hidden="true" /> Copy invite link</>
      )}
    </Button>
  );
}
