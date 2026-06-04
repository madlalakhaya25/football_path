"use client";

import { useState, useTransition } from "react";
import { signDocumentDigitally, signConsentDocument, uploadDocumentScan } from "@/app/actions/records";

type CheckboxDef = { id: string; label: string; hint: string };

type DocDef = {
  type: string;
  label: string;
  form: string;
  signerRole: string;
  terms: string;
  uploadOnly?: boolean;
  accept?: string;
  checkboxes?: CheckboxDef[];
};

const DOCUMENTS: DocDef[] = [
  {
    type: "registration_agreement",
    label: "Player Registration Agreement",
    form: "GFA-REG-01",
    signerRole: "parent",
    terms:
      "By signing, the parent/guardian confirms:\n" +
      "• The player is not currently registered at any other SAFA/GDFA affiliated club in the same season.\n" +
      "• All personal information provided is accurate. Age documentation (birth certificate or SA ID) is correct and available for inspection on request.\n" +
      "• Academy monthly fees are due on the 1st of each month. Arrears of three or more months may result in the player's participation being suspended until the account is settled.\n" +
      "• The academy reserves the right to withdraw or suspend a player's registration for serious or repeated breaches of the Code of Ethics (GFA-ETH-04).\n" +
      "• Any dispute will first be referred to Academy management; if unresolved, it may be escalated to SAFA/GDFA in accordance with their disciplinary procedures.\n" +
      "• Personal data is collected and processed in accordance with the academy's POPIA Privacy Notice (GFA-DAT-05).",
  },
  {
    type: "consent_form",
    label: "Parent & Player Consent Form",
    form: "GFA-CON-02",
    signerRole: "parent",
    terms:
      "By signing, the parent/guardian confirms each of the consents ticked above. " +
      "This form is the authoritative consent record for the current season and supersedes any previously submitted consent. " +
      "Consents may be withdrawn in writing at any time; withdrawal of participation consent will end the current registration.",
    checkboxes: [
      {
        id: "participation_consent",
        label: "Participation",
        hint: "I consent to my child participating in all Growfit training sessions, matches, tournaments, and academy events for the current season.",
      },
      {
        id: "photo_consent",
        label: "Photo & media",
        hint: "I consent to photos and videos of my child being used on official Growfit channels (website, Instagram, Facebook). No full name or precise location will be published. Content will not be sold to third parties.",
      },
      {
        id: "transport_consent",
        label: "Transport",
        hint: "I consent to my child being transported to away fixtures and tournaments in academy-arranged, roadworthy, insured vehicles driven by licensed drivers.",
      },
      {
        id: "risk_acknowledged",
        label: "Risk acknowledgement",
        hint: "I acknowledge the inherent physical risks of participation in contact sport and confirm the academy's safety and first-aid procedures have been explained to me.",
      },
    ],
  },
  {
    type: "code_of_ethics",
    label: "Code of Ethics Agreement",
    form: "GFA-ETH-04",
    signerRole: "parent",
    terms:
      "I commit to upholding Growfit's values — Respect, Child First, Honesty, Fair Play, Accountability, Inclusion — in all interactions at and around the academy.\n\n" +
      "ON THE FIELD\n" +
      "• Show respect to coaches, referees, opponents, and teammates at all times.\n" +
      "• Accept the decisions of match officials without argument.\n" +
      "• Deliberate foul play or violent conduct will result in immediate disciplinary action.\n\n" +
      "ON THE SIDELINE (parents, guardians & spectators)\n" +
      "• Provide positive encouragement only — no negative coaching or criticism from the sideline during matches.\n" +
      "• Do not approach referees, opposition players, or coaches during or immediately after a match.\n" +
      "• Abusive, threatening, or discriminatory language will result in removal from the venue and may lead to a review of the player's registration.\n\n" +
      "SOCIAL MEDIA\n" +
      "• Do not post negative commentary about referees, opponents, or match officials.\n" +
      "• Do not share footage that could embarrass or identify under-18 players without their parent's explicit consent.\n" +
      "• Do not share internal club communications or documents publicly.\n\n" +
      "CONSEQUENCES\n" +
      "• First offence: verbal or written warning.\n" +
      "• Repeat offence: parent/guardian may be banned from attending matches.\n" +
      "• Serious or repeated breach: player's registration may be withdrawn.\n" +
      "• Matters may be referred to SAFA/GDFA disciplinary committee where applicable.",
  },
  {
    type: "medical_consent",
    label: "Medical Consent & Emergency Form",
    form: "GFA-MED-05",
    signerRole: "parent",
    terms:
      "I authorise Growfit Sports Academy to: seek emergency medical treatment including ambulance, emergency room, or surgery if I cannot be reached; administer first aid while awaiting medical assistance; contact emergency services on my behalf (112, 10177, or the nearest emergency hospital). " +
      "I confirm the medical information recorded in the academy's system is accurate and I will notify the academy immediately of any changes to the player's medical status.",
  },
  {
    type: "popia_consent",
    label: "Data Protection & Privacy Notice",
    form: "GFA-DAT-05",
    signerRole: "parent",
    terms:
      "Growfit Football Academy collects and processes personal information (name, date of birth, ID number, contact details, medical information, performance data) for the following purposes:\n" +
      "• Player registration and SAFA/GDFA affiliation\n" +
      "• Communication regarding training, fixtures, and academy events\n" +
      "• Player safety and emergency contact\n" +
      "• Performance tracking and player development\n\n" +
      "Your data is stored securely within South Africa and is not sold to third parties. It is shared only with:\n" +
      "• SAFA/GDFA for official registration\n" +
      "• Coaches and administrators within the Academy\n" +
      "• Medical personnel in an emergency\n\n" +
      "Your rights under POPIA:\n" +
      "• Access or correct your personal information at any time\n" +
      "• Request deletion of your data (subject to statutory retention requirements)\n" +
      "• Lodge a complaint with the Information Regulator of South Africa (inforegulator.org.za / complaints.IR@justice.gov.za)\n\n" +
      "By signing, you confirm you have read and understood this notice and consent to the processing of personal information as described above.",
  },
  {
    type: "id_document",
    label: "Identity Document / Birth Certificate",
    form: "GFA-ID-06",
    signerRole: "parent",
    terms: "",
    uploadOnly: true,
    accept: ".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png",
  },
];

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
        {doc.upload_url ? (
          <a href={doc.upload_url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
            View upload
          </a>
        ) : "Uploaded"}{date ? ` · ${date}` : ""}
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
  const [checkboxValues, setCheckboxValues] = useState<Record<string, boolean>>({});
  const [signError, setSignError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isUploading, startUploadTransition] = useTransition();

  const allCheckboxesTicked =
    !def.checkboxes ||
    def.checkboxes.every((cb) => checkboxValues[cb.id]);

  function handleSign() {
    if (!signerName.trim() || !agreed || !allCheckboxesTicked) return;
    setSignError(null);
    startTransition(async () => {
      let result: { error?: string } | undefined;
      if (def.type === "consent_form") {
        result = await signConsentDocument(playerId, season, signerName.trim(), {
          participation_consent: !!checkboxValues["participation_consent"],
          photo_consent: !!checkboxValues["photo_consent"],
          transport_consent: !!checkboxValues["transport_consent"],
          risk_acknowledged: !!checkboxValues["risk_acknowledged"],
        });
      } else {
        result = await signDocumentDigitally(playerId, def.type, season, signerName.trim(), def.signerRole);
      }
      if (result?.error) {
        setSignError(result.error);
      } else {
        setSignOpen(false);
        setSignerName("");
        setAgreed(false);
        setCheckboxValues({});
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
          {!def.uploadOnly && (
            <button
              type="button"
              onClick={() => { setSignOpen((v) => !v); setUploadOpen(false); }}
              className="inline-flex h-8 items-center rounded-md border border-input bg-background px-3 text-xs font-medium hover:bg-accent hover:text-accent-foreground"
            >
              Sign here
            </button>
          )}
          <button
            type="button"
            onClick={() => { setUploadOpen((v) => !v); setSignOpen(false); }}
            className="inline-flex h-8 items-center rounded-md border border-input bg-background px-3 text-xs font-medium hover:bg-accent hover:text-accent-foreground"
          >
            {def.uploadOnly ? "Upload scan" : "Upload PDF"}
          </button>
        </div>
      </div>

      {signOpen && !def.uploadOnly && (
        <div className="border-t border-border p-4 space-y-3 bg-muted/30">
          {def.checkboxes && (
            <div className="space-y-3 mb-2">
              {def.checkboxes.map((cb) => (
                <div key={cb.id} className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id={`${def.type}-${cb.id}`}
                    checked={!!checkboxValues[cb.id]}
                    onChange={(e) =>
                      setCheckboxValues((prev) => ({ ...prev, [cb.id]: e.target.checked }))
                    }
                    className="mt-0.5 h-4 w-4 rounded border-input"
                  />
                  <div>
                    <label htmlFor={`${def.type}-${cb.id}`} className="text-sm font-medium">{cb.label}</label>
                    <p className="text-xs text-muted-foreground mt-0.5">{cb.hint}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {def.terms && (
            <blockquote className="border-l-4 border-border pl-4 text-sm text-muted-foreground italic whitespace-pre-line">
              {def.terms}
            </blockquote>
          )}

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
            disabled={isPending || !signerName.trim() || !agreed || !allCheckboxesTicked}
            onClick={handleSign}
            className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {isPending ? "Signing…" : "Sign document"}
          </button>
        </div>
      )}

      {uploadOpen && (
        <div className="border-t border-border p-4 space-y-3 bg-muted/30">
          {def.type === "id_document" && (
            <p className="text-sm text-muted-foreground">
              Upload a clear scan or photo of the player&apos;s birth certificate or South African ID document. Accepted formats: PDF, JPEG, PNG.
            </p>
          )}
          <form onSubmit={handleUpload} encType="multipart/form-data" className="space-y-3">
            <input type="hidden" name="player_id" value={playerId} />
            <input type="hidden" name="document_type" value={def.type} />
            <input type="hidden" name="season" value={season} />

            <div className="space-y-1.5">
              <label htmlFor={`file-${def.type}`} className="text-sm font-medium">
                {def.uploadOnly ? "Select file" : "Select PDF file"}
              </label>
              <input
                id={`file-${def.type}`}
                type="file"
                name="file"
                accept={def.accept ?? ".pdf,application/pdf"}
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
