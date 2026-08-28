import { X } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';

export const Modal = ({ title, children, onClose, wide = false, fullScreen = false }: {
  title: string; children: ReactNode; onClose: () => void; wide?: boolean; fullScreen?: boolean;
}) => {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKeyDown);
    document.body.classList.add('modal-open');
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.classList.remove('modal-open');
    };
  }, [onClose]);

  return (
    <div className={`modal-backdrop${fullScreen ? ' modal-backdrop-fullscreen' : ''}`} role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className={`modal-panel ${wide ? 'modal-wide' : ''}${fullScreen ? ' modal-fullscreen' : ''}`} role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <header className="modal-header">
          <div><span className="eyebrow">BARMISAKI</span><h2 id="modal-title">{title}</h2></div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="閉じる"><X /></button>
        </header>
        <div className="modal-content">{children}</div>
      </section>
    </div>
  );
};
