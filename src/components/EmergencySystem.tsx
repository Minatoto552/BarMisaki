import { AlertTriangle, BellRing, Check, ShieldAlert } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  emergencyKindLabels,
  emergencyKinds,
  type EmergencyKind,
} from "../types";
import { useData } from "../lib/data";
import { playEmergencySound } from "../lib/notification-sounds";
import { Modal } from "./Modal";

export const EmergencySystem = () => {
  const { profile, emergencies, isStaff, sendEmergency, updateEmergency } =
    useData();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<EmergencyKind>("help");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const initialized = useRef(false);
  const heard = useRef(new Set<string>());
  const active = emergencies.filter((item) => item.status !== "resolved");
  const latest = active[0];

  const advance = async () => {
    if (!latest || updating) return;
    setUpdating(true);
    setUpdateError("");
    try {
      await updateEmergency(
        latest.id,
        latest.status === "active" ? "acknowledged" : "resolved",
      );
    } catch {
      setUpdateError("更新できませんでした。もう一度お試しください。");
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    if (!initialized.current) {
      emergencies.forEach((item) => heard.current.add(item.id));
      initialized.current = true;
      return;
    }
    const next = emergencies.find((item) => {
      const age = Date.now() - new Date(item.createdAt).getTime();
      return (
        item.status === "active" &&
        !heard.current.has(item.id) &&
        age >= 0 &&
        age < 20_000
      );
    });
    emergencies.forEach((item) => heard.current.add(item.id));
    if (next) playEmergencySound();
  }, [emergencies]);

  const submit = async () => {
    if (!profile) {
      setOpen(false);
      navigate("/account");
      return;
    }
    if (message.length > 200) {
      setError("補足は200文字以内で入力してください。");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await sendEmergency(kind, message);
      setOpen(false);
      setMessage("");
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "緊急通知を送信できませんでした。",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {latest && (
        <aside
          className={`emergency-banner status-${latest.status}`}
          aria-live="assertive"
        >
          <div className="emergency-banner-icon">
            <BellRing />
          </div>
          <div className="emergency-banner-copy">
            <strong>{emergencyKindLabels[latest.kind]}</strong>
            <span>
              {latest.creatorName}
              {latest.message ? ` — ${latest.message}` : ""}
            </span>
            {updateError && <span role="alert">{updateError}</span>}
          </div>
          {isStaff && latest.status === "active" && (
            <button
              type="button"
              disabled={updating}
              onClick={() => void advance()}
            >
              <Check size={18} />
              {updating ? "更新中…" : "確認"}
            </button>
          )}
          {isStaff && latest.status === "acknowledged" && (
            <button
              type="button"
              disabled={updating}
              onClick={() => void advance()}
            >
              <Check size={18} />
              {updating ? "更新中…" : "解決"}
            </button>
          )}
        </aside>
      )}
      <button
        type="button"
        className="emergency-fab"
        onClick={() => setOpen(true)}
        aria-label="緊急システムを開く"
      >
        <ShieldAlert />
        <span>緊急</span>
        {active.length > 0 && <b>{active.length}</b>}
      </button>
      {open && (
        <Modal title="緊急システム" onClose={() => setOpen(false)}>
          <div className="emergency-intro">
            <span className="eyebrow">URGENT CALL / FLOOR SUPPORT</span>
            <p>状況を選択し、スタッフへすぐに共有します。</p>
          </div>
          <div className="alert-note">
            <AlertTriangle />
            <p>
              <strong>すぐに危険がある場合</strong>
              <br />
              VRChat内のスタッフにも直接声をかけてください。
            </p>
          </div>
          <fieldset className="field-group">
            <legend>内容を選択</legend>
            <div className="choice-grid emergency-choices">
              {emergencyKinds.map((value) => (
                <button
                  type="button"
                  aria-pressed={kind === value}
                  className={kind === value ? "selected" : ""}
                  key={value}
                  onClick={() => setKind(value)}
                >
                  {emergencyKindLabels[value]}
                </button>
              ))}
            </div>
          </fieldset>
          <label className="field">
            <span>補足（任意）</span>
            <textarea
              value={message}
              maxLength={200}
              rows={3}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="場所や状況を簡潔に入力"
            />
            <small>{message.length}/200</small>
          </label>
          {error && <p className="form-error">{error}</p>}
          <button
            className="primary-button danger-button"
            type="button"
            disabled={busy}
            onClick={() => void submit()}
          >
            {busy ? "送信中…" : "緊急通知を送る"}
          </button>
        </Modal>
      )}
    </>
  );
};
