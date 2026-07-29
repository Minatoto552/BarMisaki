import { BadgeCheck, Camera, CircleUserRound, LockKeyhole } from 'lucide-react';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';

import { ImageField } from '../components/ImageField';
import { useData } from '../lib/data';
import { validateDisplayName, validateImage } from '../lib/validation';

export const AccountPage = () => {
  const { profile, uid, saveProfile } = useData();
  const location = useLocation();
  const notice = (location.state as { notice?: string } | null)?.notice;
  const [name, setName] = useState(profile?.displayName || '');
  const [image, setImage] = useState<File | null>(null);
  const [editing, setEditing] = useState(!profile);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const submit = async () => {
    const nameError = validateDisplayName(name);
    const imageError = validateImage(image);
    if (nameError || imageError) { setError(nameError || imageError); return; }
    setBusy(true); setError(null);
    try { await saveProfile(name, image!); setSaved(true); setEditing(false); setImage(null); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'アカウントを保存できませんでした。'); }
    finally { setBusy(false); }
  };

  return (
    <div className="page account-page narrow-page">
      <div className="page-heading"><span className="eyebrow">YOUR PROFILE</span><h1>アカウント</h1><p>必要なのは名前とアイコンだけ。パスワード入力はありません。</p></div>
      {notice && <div className="notice-banner">{notice}</div>}
      {saved && <div className="saved-banner"><BadgeCheck />アカウントを保存しました。すべての画面に反映されています。</div>}
      <section className="account-card">
        {profile && !editing ? <div className="profile-view"><div className="profile-portrait"><img src={profile.iconUrl} alt={`${profile.displayName}のアイコン`} /><span><BadgeCheck /></span></div><div><span className="eyebrow">REGISTERED</span><h2>{profile.displayName}</h2><p className="uid-label">ID: {uid.slice(0, 8)}…</p></div><button className="secondary-button" type="button" onClick={() => { setEditing(true); setSaved(false); }}><Camera />名前・アイコンを変更</button></div> : <div className="profile-form"><div className="account-intro-icon"><CircleUserRound /></div><h2>{profile ? 'プロフィールを変更' : 'はじめに登録しましょう'}</h2><p>注文と緊急通知に表示する名前・アイコンを設定します。</p><label className="field"><span>VRChat名 <b>必須</b></span><input value={name} maxLength={32} onChange={(event) => setName(event.target.value)} placeholder="VRChatで使っている名前" /><small>{[...name].length}/32</small></label><div className="field"><span>アイコン <b>必須</b></span><ImageField file={image} onChange={setImage} label={profile ? '新しいアイコンを選択' : 'アイコンを選択'} /></div>{error && <p className="form-error">{error}</p>}<button className="primary-button" type="button" disabled={busy} onClick={() => void submit()}>{busy ? '登録中…' : profile ? '変更を保存する' : 'この内容で登録する'}</button>{profile && <button className="text-button centered" type="button" onClick={() => setEditing(false)}>変更をやめる</button>}</div>}
      </section>
      <aside className="privacy-card"><LockKeyhole /><div><strong>シンプルで安全なアカウント</strong><p>Firebase匿名認証で端末ごとのUIDを発行します。メールアドレスやパスワードは収集しません。</p></div></aside>
    </div>
  );
};
