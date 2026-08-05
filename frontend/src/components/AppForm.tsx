import { useEffect, useRef, useState } from "react";
import type {
  ChangeEvent,
  SubmitEvent,
  SyntheticEvent,
  MouseEvent,
} from "react";
import type { Application, Schema } from "../types";
import { apiFetch } from "../api";

const typeMap: Record<string, string> = {
  string: "text",
  date: "date",
  integer: "number",
  url: "url",
  email: "email",
  boolean: "checkbox",
};

interface AppFormProps {
  schema: Schema | null;
  application?: Application | null;
  onClose: () => void;
  onCreated?: (app: Application) => void;
  onUpdated?: (app: Application) => void;
}

function AppForm({
  schema,
  application,
  onClose,
  onCreated,
  onUpdated,
}: AppFormProps) {
  const isEdit = Boolean(application);
  const [formData, setFormData] = useState<Partial<Application>>(
    application || {},
  );
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  function requestClose() {
    const dialog = dialogRef.current;
    if (!dialog || dialog.classList.contains("closing")) return;

    dialog.classList.add("closing");
    dialog.addEventListener("transitionend", () => dialog.close(), {
      once: true,
    });
  }

  function handleNativeClose() {
    onClose();
  }

  function handleCancel(e: SyntheticEvent) {
    e.preventDefault();
    requestClose();
  }

  function handleBackdropClick(e: MouseEvent<HTMLDialogElement>) {
    if (e.target === dialogRef.current) requestClose();
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const url =
      isEdit && application
        ? `/api/applications/${application.id}/`
        : "/api/applications/";

    const res = await apiFetch(url, {
      method: isEdit ? "PATCH" : "POST",
      body: JSON.stringify(
        isEdit ? formData : { ...formData, state: "APPLIED" },
      ),
    });

    if (!res.ok) {
      setError(`Could not ${isEdit ? "update" : "save"} application.`);
      return;
    }

    const saved: Application = await res.json();
    if (isEdit) onUpdated?.(saved);
    else onCreated?.(saved);
    requestClose();
  }

  function renderField(name: keyof Application) {
    if (!schema) return null;
    const field = schema[name];

    return (
      <div className="mb-4">
        <label className="block text-sm text-ink-soft mb-1">
          {field.label}
        </label>
        <input
          type={typeMap[field.type] || "text"}
          name={name}
          value={(formData[name] as string) || ""}
          onChange={handleChange}
          required={field.required}
          className="w-full rounded-lg border border-rule-strong px-3 py-2 font-body outline-none"
        />
      </div>
    );
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={handleNativeClose}
      onCancel={handleCancel}
      onClick={handleBackdropClick}
      className="app-dialog bg-paper border border-rule shadow-modal rounded-xl p-6 w-full max-w-md"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-semibold text-lg">
          {isEdit ? "Edit Application" : "Add Application"}
        </h2>
        <button
          type="button"
          onClick={requestClose}
          className="border border-rule rounded-lg w-7 h-7 flex items-center justify-center leading-none cursor-pointer press"
        >
          ×
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {renderField("title")}
        {renderField("company")}
        <div className="flex gap-3 mb-4">
          <div className="flex-1">{renderField("date_applied")}</div>
          <div className="flex-1">{renderField("link")}</div>
        </div>
        {error && (
          <p
            className="text-sm mb-3"
            style={{ color: "var(--color-rejected)" }}
          >
            {error}
          </p>
        )}
        <div className="flex gap-3 mt-4">
          <button
            type="button"
            className="btn press flex-1"
            onClick={requestClose}
          >
            Cancel
          </button>
          <button type="submit" className="btn-primary press flex-1">
            {isEdit ? "Save" : "Add"}
          </button>
        </div>
      </form>
    </dialog>
  );
}

export default AppForm;
