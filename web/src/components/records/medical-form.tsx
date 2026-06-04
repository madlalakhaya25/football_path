"use client";

import { useActionState, useState } from "react";
import { savePlayerMedical } from "@/app/actions/records";

type Props = {
  playerId: string;
  initial: Record<string, unknown> | null;
};

type ActionResult = { error?: string; success?: boolean } | null;

async function formAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const playerId = formData.get("playerId") as string;
  const data = {
    blood_type: formData.get("blood_type") as string,
    allergies: formData.get("allergies") as string,
    chronic_conditions: formData.get("chronic_conditions") as string,
    current_medication: formData.get("current_medication") as string,
    condition_notes: formData.get("condition_notes") as string,
    physical_restrictions: formData.get("physical_restrictions") as string,
    emergency_1_name: formData.get("emergency_1_name") as string,
    emergency_1_relationship: formData.get("emergency_1_relationship") as string,
    emergency_1_phone: formData.get("emergency_1_phone") as string,
    emergency_2_name: formData.get("emergency_2_name") as string,
    emergency_2_relationship: formData.get("emergency_2_relationship") as string,
    emergency_2_phone: formData.get("emergency_2_phone") as string,
    has_medical_aid: formData.get("has_medical_aid") === "on",
    medical_aid_scheme: formData.get("medical_aid_scheme") as string,
    medical_aid_number: formData.get("medical_aid_number") as string,
    medical_aid_principal: formData.get("medical_aid_principal") as string,
    doctor_clinic: formData.get("doctor_clinic") as string,
    nearest_hospital: formData.get("nearest_hospital") as string,
    treatment_authorised: formData.get("treatment_authorised") === "on",
    authorised_by: formData.get("authorised_by") as string,
    season: formData.get("season") as string,
  };
  return savePlayerMedical(playerId, data);
}

const inputClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const textareaClass =
  "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function MedicalForm({ playerId, initial }: Props) {
  const currentSeason = new Date().getFullYear().toString();
  const [hasMedicalAid, setHasMedicalAid] = useState<boolean>(
    !!(initial?.has_medical_aid)
  );
  const [treatmentAuthorised, setTreatmentAuthorised] = useState<boolean>(
    !!(initial?.treatment_authorised)
  );
  const [state, dispatch, isPending] = useActionState(formAction, null);

  return (
    <form action={dispatch} className="space-y-4">
      <input type="hidden" name="playerId" value={playerId} />
      <input type="hidden" name="season" value={currentSeason} />

      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mt-4 mb-2">
        Medical info
      </p>

      <div className="space-y-1.5">
        <label htmlFor="blood_type" className="text-sm font-medium">Blood type</label>
        <input
          id="blood_type"
          name="blood_type"
          defaultValue={initial?.blood_type as string | null ?? ""}
          className={inputClass}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="allergies" className="text-sm font-medium">Allergies</label>
        <textarea
          id="allergies"
          name="allergies"
          rows={2}
          defaultValue={initial?.allergies as string | null ?? ""}
          className={textareaClass}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="chronic_conditions" className="text-sm font-medium">Chronic conditions</label>
        <textarea
          id="chronic_conditions"
          name="chronic_conditions"
          rows={2}
          defaultValue={initial?.chronic_conditions as string | null ?? ""}
          className={textareaClass}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="current_medication" className="text-sm font-medium">Current medication</label>
        <textarea
          id="current_medication"
          name="current_medication"
          rows={2}
          defaultValue={initial?.current_medication as string | null ?? ""}
          className={textareaClass}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="condition_notes" className="text-sm font-medium">Condition notes</label>
        <textarea
          id="condition_notes"
          name="condition_notes"
          rows={2}
          defaultValue={initial?.condition_notes as string | null ?? ""}
          className={textareaClass}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="physical_restrictions" className="text-sm font-medium">Physical restrictions</label>
        <textarea
          id="physical_restrictions"
          name="physical_restrictions"
          rows={2}
          defaultValue={initial?.physical_restrictions as string | null ?? ""}
          className={textareaClass}
        />
      </div>

      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mt-4 mb-2">
        Emergency contact 1
      </p>

      <div className="space-y-1.5">
        <label htmlFor="emergency_1_name" className="text-sm font-medium">Name</label>
        <input
          id="emergency_1_name"
          name="emergency_1_name"
          defaultValue={initial?.emergency_1_name as string | null ?? ""}
          className={inputClass}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="emergency_1_relationship" className="text-sm font-medium">Relationship</label>
        <input
          id="emergency_1_relationship"
          name="emergency_1_relationship"
          defaultValue={initial?.emergency_1_relationship as string | null ?? ""}
          className={inputClass}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="emergency_1_phone" className="text-sm font-medium">Phone</label>
        <input
          id="emergency_1_phone"
          name="emergency_1_phone"
          defaultValue={initial?.emergency_1_phone as string | null ?? ""}
          className={inputClass}
        />
      </div>

      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mt-4 mb-2">
        Emergency contact 2
      </p>

      <div className="space-y-1.5">
        <label htmlFor="emergency_2_name" className="text-sm font-medium">Name</label>
        <input
          id="emergency_2_name"
          name="emergency_2_name"
          defaultValue={initial?.emergency_2_name as string | null ?? ""}
          className={inputClass}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="emergency_2_relationship" className="text-sm font-medium">Relationship</label>
        <input
          id="emergency_2_relationship"
          name="emergency_2_relationship"
          defaultValue={initial?.emergency_2_relationship as string | null ?? ""}
          className={inputClass}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="emergency_2_phone" className="text-sm font-medium">Phone</label>
        <input
          id="emergency_2_phone"
          name="emergency_2_phone"
          defaultValue={initial?.emergency_2_phone as string | null ?? ""}
          className={inputClass}
        />
      </div>

      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mt-4 mb-2">
        Medical aid
      </p>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="has_medical_aid"
          name="has_medical_aid"
          defaultChecked={!!(initial?.has_medical_aid)}
          onChange={(e) => setHasMedicalAid(e.target.checked)}
          className="h-4 w-4 rounded border-input"
        />
        <label htmlFor="has_medical_aid" className="text-sm font-medium">Has medical aid</label>
      </div>

      {hasMedicalAid && (
        <div className="space-y-4 pl-2 border-l-2 border-border">
          <div className="space-y-1.5">
            <label htmlFor="medical_aid_scheme" className="text-sm font-medium">Scheme</label>
            <input
              id="medical_aid_scheme"
              name="medical_aid_scheme"
              defaultValue={initial?.medical_aid_scheme as string | null ?? ""}
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="medical_aid_number" className="text-sm font-medium">Membership no.</label>
            <input
              id="medical_aid_number"
              name="medical_aid_number"
              defaultValue={initial?.medical_aid_number as string | null ?? ""}
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="medical_aid_principal" className="text-sm font-medium">Principal member</label>
            <input
              id="medical_aid_principal"
              name="medical_aid_principal"
              defaultValue={initial?.medical_aid_principal as string | null ?? ""}
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="doctor_clinic" className="text-sm font-medium">Doctor/clinic</label>
            <input
              id="doctor_clinic"
              name="doctor_clinic"
              defaultValue={initial?.doctor_clinic as string | null ?? ""}
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="nearest_hospital" className="text-sm font-medium">Nearest govt hospital</label>
            <input
              id="nearest_hospital"
              name="nearest_hospital"
              defaultValue={initial?.nearest_hospital as string | null ?? ""}
              className={inputClass}
            />
          </div>
        </div>
      )}

      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mt-4 mb-2">
        Emergency treatment
      </p>

      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          id="treatment_authorised"
          name="treatment_authorised"
          defaultChecked={!!(initial?.treatment_authorised)}
          onChange={(e) => setTreatmentAuthorised(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-input"
        />
        <label htmlFor="treatment_authorised" className="text-sm font-medium leading-snug">
          I authorise the academy to seek emergency medical treatment if I cannot be reached
        </label>
      </div>

      {treatmentAuthorised && (
        <div className="space-y-1.5">
          <label htmlFor="authorised_by" className="text-sm font-medium">Parent/guardian full name</label>
          <input
            id="authorised_by"
            name="authorised_by"
            defaultValue={initial?.authorised_by as string | null ?? ""}
            className={inputClass}
          />
        </div>
      )}

      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      {state?.success && (
        <p className="text-sm text-green-600">Saved successfully.</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {isPending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
