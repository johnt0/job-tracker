import { useEffect, useRef } from "react";
import type { FormEvent, MouseEvent } from "react";

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
}

function ConfirmDialog({
  title,
  message,
  confirmLabel,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
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

  function handleCancel(e: FormEvent) {
    e.preventDefault();
    requestClose();
  }

  function handleBackdropClick(e: MouseEvent<HTMLDialogElement>) {
    if (e.target === dialogRef.current) requestClose();
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
        <h2 className="font-display font-semibold text-lg">{title}</h2>
        <button
          type="button"
          onClick={requestClose}
          className="border border-rule rounded-lg w-7 h-7 flex items-center justify-center leading-none cursor-pointer press"
        >
          ×
        </button>
      </div>

      <p className="text-sm text-ink-soft mb-4">{message}</p>

      <div className="flex gap-3 mt-4">
        <button
          type="button"
          className="btn press flex-1"
          onClick={requestClose}
        >
          Cancel
        </button>
        <button
          type="button"
          className="btn-primary btn-danger press flex-1"
          onClick={onConfirm}
        >
          {confirmLabel}
        </button>
      </div>
    </dialog>
  );
}

export default ConfirmDialog;
