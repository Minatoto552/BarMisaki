import { AlertTriangle, Bell, Plus, Send } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { useData } from "../lib/data";
import { getCurrentServiceDayStart } from "../lib/service-day";
import { announcementKindLabels, type AnnouncementKind } from "../types";
import { Modal } from "./Modal";
export const NotificationDrawer = ({ onClose }: { onClose: () => void }) => {
  const { announcements, profile, isStaff, sendAnnouncement } = useData();
  const [start, setStart] = useState(() => getCurrentServiceDayStart());
  const [composing, setComposing] = useState(false);
  const [kind, setKind] = useState<AnnouncementKind>("notice");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  useEffect(() => {
    const timer = window.setInterval(
      () => setStart(getCurrentServiceDayStart()),
      30_000,
    );
    return () => window.clearInterval(timer);
  }, []);
  const current = announcements
    .filter((a) => new Date(a.createdAt).getTime() >= start)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy || !message.trim()) return;
    setBusy(true);
    setFeedback("");
    try {
      await sendAnnouncement(kind, message);
      setMessage("");
      setComposing(false);
      setFeedback("送信しました。全員の画面に20秒間表示されます。");
    } catch (reason) {
      setFeedback(
        reason instanceof Error ? reason.message : "送信できませんでした。",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      title="通知"
      onClose={() => {
        if (!busy) onClose();
      }}
      drawer
    >
      <div className="notifications-heading">
        <div>
          <h3>本日のお知らせ</h3>
          <p>毎日 午前5時に表示をリセット</p>
        </div>
        <span className="count-badge">{current.length}</span>
      </div>
      {isStaff && profile && (
        <button
          className="secondary-button full-width"
          onClick={() => setComposing(!composing)}
          aria-expanded={composing}
        >
          <Plus />
          お知らせを作成
        </button>
      )}
      {composing && (
        <form
          className="announcement-composer"
          onSubmit={(e) => void submit(e)}
        >
          <fieldset disabled={busy}>
            <label className="field">
              <span>カテゴリー</span>
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value as AnnouncementKind)}
              >
                <option value="notice">連絡</option>
                <option value="urgent">緊急</option>
              </select>
            </label>
            <label className="field">
              <span>お知らせ内容</span>
              <textarea
                aria-label="お知らせ内容"
                required
                maxLength={300}
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="全員へ伝える内容を入力"
              />
              <small>{message.length}/300</small>
            </label>
            <button
              className={`primary-button full-width ${kind === "urgent" ? "danger-button" : ""}`}
              disabled={!message.trim() || busy}
            >
              <Send />
              {busy ? "送信中…" : "お知らせを送信"}
            </button>
          </fieldset>
        </form>
      )}
      {feedback && (
        <p role="status" className="product-feedback">
          {feedback}
        </p>
      )}
      <div className="notification-list">
        {current.length ? (
          current.map((item) => (
            <article className={`notification-card ${item.kind}`} key={item.id}>
              <header>
                <span>
                  {item.kind === "urgent" ? <AlertTriangle /> : <Bell />}
                  {announcementKindLabels[item.kind]}
                </span>
                <time dateTime={item.createdAt}>
                  {new Date(item.createdAt).toLocaleTimeString("ja-JP", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </time>
              </header>
              <p>{item.message}</p>
              <small>{item.creatorName}</small>
            </article>
          ))
        ) : (
          <div className="empty-state">
            <Bell />
            <h3>まだお知らせはありません</h3>
            <p>新しい連絡がここに届きます。</p>
          </div>
        )}
      </div>
    </Modal>
  );
};
