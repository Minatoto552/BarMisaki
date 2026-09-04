import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";
export const Modal = ({
  title,
  children,
  onClose,
  wide = false,
  fullScreen = false,
  drawer = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
  fullScreen?: boolean;
  drawer?: boolean;
}) => {
  const id = useId();
  const panel = useRef<HTMLElement>(null);
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  }, [onClose]);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        close.current();
      }
      if (event.key !== "Tab") return;
      const controls = Array.from(
        panel.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]',
        ) || [],
      ).filter((el) => el.getClientRects().length > 0);
      const first = controls[0];
      const last = controls.at(-1);
      if (!first) {
        event.preventDefault();
        return;
      }
      if (
        event.shiftKey &&
        (document.activeElement === first ||
          document.activeElement === panel.current)
      ) {
        event.preventDefault();
        last?.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last ||
          document.activeElement === panel.current)
      ) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", keydown);
    return () => {
      window.removeEventListener("keydown", keydown);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);
  return (
    <div
      className={`modal-backdrop ${drawer ? "drawer-backdrop" : ""}`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        ref={panel}
        tabIndex={-1}
        className={`modal-panel ${wide ? "modal-wide" : ""} ${fullScreen ? "modal-fullscreen" : ""} ${drawer ? "modal-drawer" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
      >
        <header className="modal-header">
          <h2 id={id}>{title}</h2>
          <button className="icon-button" onClick={onClose} aria-label="閉じる">
            <X />
          </button>
        </header>
        <div className="modal-content">{children}</div>
      </section>
    </div>
  );
};
