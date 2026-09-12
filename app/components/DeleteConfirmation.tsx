import { ActionButton } from "./ActionControl";

type DeleteConfirmationProps = {
  className: string;
  label: string;
  question: string;
  cancelLabel: string;
  confirmLabel: string;
  pending?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

/** Inline confirmation; owners retain deletion state and API behavior. */
export function DeleteConfirmation({
  className,
  label,
  question,
  cancelLabel,
  confirmLabel,
  pending = false,
  onCancel,
  onConfirm,
}: DeleteConfirmationProps) {
  return (
    <div className={className} role="group" aria-label={label}>
      <span>{question}</span>
      <ActionButton variant="secondary" onClick={onCancel}>
        {cancelLabel}
      </ActionButton>
      <ActionButton
        className="danger"
        variant="destructive"
        disabled={pending}
        onClick={onConfirm}
      >
        {confirmLabel}
      </ActionButton>
    </div>
  );
}
