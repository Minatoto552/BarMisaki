import { BadgeCheck, UserRound } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ImageField } from "../components/ImageField";
import { useData } from "../lib/data";
import { validateDisplayName, validateImage } from "../lib/validation";
export const AccountPage = () => {
  const { profile } = useData();
  return <ProfileSettings key={profile?.id || "new"} />;
};
const ProfileSettings = () => {
  const { profile, saveProfile } = useData();
  const navigate = useNavigate();
  const location = useLocation();
  const [name, setName] = useState(profile?.displayName || "");
  const [image, setImage] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const previewUrl = useMemo(
    () => (image ? URL.createObjectURL(image) : ""),
    [image],
  );
  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );
  const notice = (location.state as { notice?: string } | null)?.notice;
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const invalid =
      validateDisplayName(name) ||
      (image || !profile ? validateImage(image) : null);
    if (invalid) {
      setError(invalid);
      return;
    }
    setBusy(true);
    setError("");
    try {
      await saveProfile(name, image);
      setSaved(true);
      if (!profile) navigate("/order", { replace: true });
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "保存できませんでした。",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="page account-page">
      <header className="page-heading">
        <div>
          <span className="eyebrow">PROFILE / STAFF IDENTITY</span>
          <h1>アカウント</h1>
          <p>注文・通知に表示されるプロフィールを管理します。</p>
        </div>
      </header>
      {notice && <p className="product-management-note">{notice}</p>}
      <section className="settings-card">
        <div className="settings-description">
          <div className="identity-card">
            <div className="identity-masthead">
              <span>Bar Misaki</span>
              <small>STAFF IDENTITY</small>
            </div>
            <div className="identity-portrait">
              {(image ? previewUrl : profile?.iconUrl) ? (
                <img
                  src={image ? previewUrl : profile?.iconUrl}
                  alt="プロフィールプレビュー"
                />
              ) : (
                <UserRound aria-hidden="true" />
              )}
            </div>
            <div className="identity-caption">
              <span>YOUR NAME</span>
              <strong>{name.trim() || "Your identity"}</strong>
              <small>LOUNGE & GUEST SERVICE</small>
            </div>
          </div>
          <p className="identity-note">
            あなたの名前とアイコンが、注文や通知に表示されます。
          </p>
        </div>
        <form onSubmit={(e) => void submit(e)}>
          <div className="profile-form-heading">
            <span className="eyebrow">PERSONAL DETAILS</span>
            <h2>プロフィールを整える</h2>
            <p>接客の場で使う名前とアイコンを設定してください。</p>
          </div>
          <fieldset disabled={busy}>
            <label className="field">
              <span>
                表示名 <b>必須</b>
              </span>
              <input
                autoComplete="nickname"
                value={name}
                maxLength={32}
                onChange={(e) => setName(e.target.value)}
                placeholder="VRChat名"
              />
            </label>
            <div className="field">
              <span>アイコン</span>
              <ImageField
                file={image}
                onChange={setImage}
                existingImageUrl={profile?.iconUrl}
                label="アイコンを選択"
              />
            </div>
          </fieldset>
          {error && (
            <p role="alert" className="error-list">
              {error}
            </p>
          )}
          {saved && (
            <p className="product-feedback" role="status">
              <BadgeCheck />
              保存しました。
            </p>
          )}
          <button className="primary-button" disabled={busy}>
            {busy ? "保存中…" : profile ? "変更を保存" : "登録して注文へ"}
          </button>
        </form>
      </section>
    </div>
  );
};
