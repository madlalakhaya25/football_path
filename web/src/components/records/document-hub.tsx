"use client";

import { useState, useTransition } from "react";
import { signDocumentDigitally, uploadDocumentScan } from "@/app/actions/records";

const DOCUMENTS = [
  {
    type: "registration_agreement",
    label: "Player Registration Agreement",
    form: "GFA-REG-01",
    signerRole: "parent",
    terms:
      "By signing, the parent/guardian confirms: all information provided is accurate; the player is not currently registered at any other SAFA/GDFA affiliated club; age documentation is accurate; fees are due monthly and persistent non-payment may affect the player's place; player data is held securely under POPIA.",
  },
  {
    type: "consent_form",
    label: "Parent & Player Consent Form",
    form: "GFA-CON-02",
    signerRole: "parent",
    terms:
      "I consent to my child's participation in all academy activities. I acknowledge the photo/media policy (official channels only, no full names or location tags). I consent to academy-arranged transport to away fixtures. I acknowledge the inherent physical risks of participation.",
  },
  {
    type: "code_of_ethics",
    label: "Code of Ethics Agreement",
    form: "GFA-ETH-04",
    signerRole: "parent",
    terms:
      "I commit to upholding Growfit's values — Respect, Child First, Honesty, Fair Play, Accountability, Inclusion — in everything I do at and around Growfit Sports Academy, on the field, on the sideline, online and in the community. Breaches are handled through the Discipline Policy.",
  },
  {
    type: "medical_consent",
    label: "Medical Consent & Emergency Form",
    form: "GFA-MED-05",
    signerRole: "parent",
    terms:
      "I authorise Growfit Sports Academy to: seek emergency medical treatment including ambulance, emergency room or surgery if I cannot be reached; administer first aid while awaiting medical assistance; contact emergency services on my behalf (112, 10177, or the nearest emergency hospital).",
  },
] as const;

type DocumentRecord = {
  document_type: string;
  status: string;
  signer_name?: string | null;
  signed_at?: string | null;
  uploaded_at?: string | null;
  upload_url?: string | null;
};

type Props = {
  playerId: string;
  season: string;
  documents: DocumentRecord[];
};

function StatusBadge({ doc }: { doc: DocumentRecord | undefined }) {
  if (!doc || doc.status === "unsigned") {
    return (
      <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
        Unsigned
      </span>
    );
  }
  if (doc.status === "signed") {
    const date = doc.signed_at
      ? new Date(doc.signed_at).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })
      : "";
    return (
      <span className="inline-flex items-center rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-semibold text-green-700">
        Signed digitally{date ? ` · ${date}` : ""}{doc.signer_name ? ` · ${doc.signer_name}` : ""}
      </span>
    );
  }
  if (doc.status === "uploaded") {
    const date = doc.uploaded_at
      ? new Date(doc.uploaded_at).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })
      : "";
    return (
      <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
        PDF uploaded{date ? ` · ${date}` : ""}
      </span>
    );
  }
  if (doc.status === "needs_renewal") {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-600">
        Needs renewal
      </span>
    );
  }
  return null;
}

type DocDef = (typeof DOCUMENTS)[number];

function DocumentRow({
  def,
  record,
  playerId,
  season,
}: {
  def: DocDef;
  record: DocumentRecord | undefined;
  playerId: string;
  season: string;
}) {
  const [signOpen, setSignOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [signerName, setSignerName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [signError, setSignError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isUploading, startUploadTransition] = useTransition();

  function handleSign() {
    if (!signerName.trim() || !agreed) return;
    setSignError(null);
    startTransition(async () => {
      const result = await signDocumentDigitally(playerId, def.type, season, signerName.trim(), def.signerRole);
      if (result?.error) {
        setSignError(result.error);
      } else {
        setSignOpen(false);
        setSignerName("");
        setAgreed(false);
      }
    });
  }

  function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    setUploadError(null);
    setUploadSuccess(false);
    startUploadTransition(async () => {
      const result = await uploadDocumentScan(formData);
      if (result?.error) {
        setUploadError(result.error);
      } else {
        setUploadSuccess(true);
        setUploadOpen(false);
        form.reset();
      }
    });
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex flex-wrap items-start gap-3 p-4">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{def.label}</p>
          <p className="text-xs text-muted-foreground">{def.form}</p>
          <div className="mt-1.5">
            <StatusBadge doc={record} />
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => { setSignOpen((v) => !v); setUploadOpen(false); }}
            className="inline-flex h-8 items-center rounded-md border border-input bg-background px-3 text-xs font-medium hover:bg-accent hover:text-accent-foreground"
          >
            Sign here
          </button>
          <button
            type="button"
            onClick={() => { setUploadOpen((v) => !v); setSignOpen(false); }}
            className="inline-flex h-8 items-center rounded-md border border-input bg-background px-3 text-xs font-medium hover:bg-accent hover:text-accent-foreground"
          >
            Upload PDF
          </button>
        </div>
      </div>

      {signOpen && (
        <div className="border-t border-border p-4 space-y-3 bg-muted/30">
          <blockquote className="border-l-4 border-border pl-4 text-sm text-muted-foreground italic my-3">
            {def.terms}
          </blockquote>

          <div className="space-y-1.5">
            <label htmlFor={`signer-${def.type}`} className="text-sm font-medium">
              Full name (as signature)
            </label>
            <input
              id={`signer-${def.type}`}
              type="text"
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`agree-${def.type}`}
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            <label htmlFor={`agree-${def.type}`} className="text-sm">
              I have read and agree to the above
            </label>
          </div>

          {signError && <p className="text-sm text-destructive">{signError}</p>}

          <button
            type="button"
            disabled={isPending || !signerName.trim() || !agreed}
            onClick={handleSign}
            className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {isPending ? "Signing…" : "Sign document"}
          </button>
        </div>
      )}

      {uploadOpen && (
        <div className="border-t border-border p-4 space-y-3 bg-muted/30">
          <form onSubmit={handleUpload} encType="multipart/form-data" className="space-y-3">
            <input type="hidden" name="player_id" value={playerId} />
            <input type="hidden" name="document_type" value={def.type} />
            <input type="hidden" name="season" value={season} />

            <div className="space-y-1.5">
              <label htmlFor={`file-${def.type}`} className="text-sm font-medium">
                Select PDF file
              </label>
              <input
                id={`file-${def.type}`}
                type="file"
                name="file"
                accept=".pdf,application/pdf"
                required
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring file:border-0 file:bg-transparent file:text-sm file:font-medium"
              />
            </div>

            {uploadError && <p className="text-sm text-destructive">{uploadError}</p>}
            {uploadSuccess && <p className="text-sm text-green-600">Uploaded successfully.</p>}

            <button
              type="submit"
              disabled={isUploading}
              className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isUploading ? "Uploading…" : "Upload"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export function DocumentHub({ playerId, season, documents }: Props) {
  const docMap = new Map(documents.map((d) => [d.document_type, d]));

  return (
    <div className="space-y-3">
      {DOCUMENTS.map((def) => (
        <DocumentRow
          key={def.type}
          def={def}
          record={docMap.get(def.type)}
          playerId={playerId}
          season={season}
        />
      ))}
    </div>
  );
}
