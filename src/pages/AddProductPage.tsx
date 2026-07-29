import { ArrowLeft, Check, PackagePlus, UploadCloud } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ImageField } from '../components/ImageField';
import { useData } from '../lib/data';
import { validateProduct } from '../lib/validation';
import { categoryLabels, productCategories, type ProductCategory } from '../types';

export const AddProductPage = () => {
  const { profile, addProduct } = useData();
  const navigate = useNavigate();
  const [category, setCategory] = useState<ProductCategory>('normal_cocktail');
  const [name, setName] = useState('');
  const [recipe, setRecipe] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const preview = useMemo(() => image ? URL.createObjectURL(image) : null, [image]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const review = () => {
    if (!profile) { navigate('/account', { state: { notice: '商品を追加する前にアカウントを登録してください。' } }); return; }
    const next = validateProduct(category, name, image, recipe);
    setErrors(next); if (!next.length) setConfirming(true);
  };

  const submit = async () => {
    if (!image) return;
    setBusy(true); setErrors([]);
    try { await addProduct({ category, name, recipe, image }); navigate('/', { replace: true }); }
    catch (reason) { setErrors([reason instanceof Error ? reason.message : '商品を登録できませんでした。']); }
    finally { setBusy(false); }
  };

  return (
    <div className="page narrow-page">
      <div className="page-heading"><span className="eyebrow">ADD A NEW ITEM</span><h1>商品を追加</h1><p>登録された商品は、すべての端末のメニューへすぐ反映されます。</p></div>
      <div className="step-indicator"><span className="done"><Check />カテゴリー</span><i /><span className={confirming ? 'done' : 'current'}>{confirming ? <Check /> : '2'}商品情報</span><i /><span className={confirming ? 'current' : ''}>3 確認</span></div>

      <section className="form-card">
        {!confirming ? <>
          <fieldset className="field-group"><legend>1. カテゴリー</legend><div className="category-choice-grid">{productCategories.map((value) => <button type="button" key={value} className={category === value ? 'selected' : ''} onClick={() => setCategory(value)}><span>{value === 'food' ? '🍽️' : value === 'juice' ? '🧃' : value === 'original_cocktail' ? '✨' : '🍹'}</span><b>{categoryLabels[value]}</b></button>)}</div></fieldset>
          <label className="field"><span>2. 商品名 <b>必須</b></span><input value={name} maxLength={60} onChange={(event) => setName(event.target.value)} placeholder="例：月灯りのクリームソーダ" /><small>{[...name].length}/60</small></label>
          <div className="field"><span>3. 商品画像 <b>必須</b></span><ImageField file={image} onChange={setImage} /></div>
          {category === 'original_cocktail' && <label className="field recipe-field"><span>4. レシピ <b>必須</b></span><textarea value={recipe} maxLength={2000} rows={8} onChange={(event) => setRecipe(event.target.value)} placeholder={'材料と作り方を入力してください\n例：シロップ 20ml\nソーダ 100ml'} /><small>{[...recipe].length}/2000</small><em>レシピは注文するお客様には表示されず、スタッフの注文票から確認できます。</em></label>}
          <div className="safety-note"><UploadCloud /><p><strong>安全な登録について</strong><br />画像は5MB以下に制限され、登録者UIDが保存されます。連続送信も自動で抑制します。</p></div>
        </> : <div className="product-review"><span className="eyebrow">FINAL CHECK</span><h2>登録内容を確認</h2><div className="review-product-card">{preview && <img src={preview} alt="商品画像プレビュー" />}<div><span className="category-badge">{categoryLabels[category]}</span><h3>{name}</h3><p>登録者：{profile?.displayName}</p></div></div>{category === 'original_cocktail' && <div className="recipe-preview"><b>レシピ</b><p>{recipe}</p></div>}<p className="review-note">登録すると、メニューへリアルタイムで公開されます。</p></div>}
        {errors.length > 0 && <div className="error-list">{errors.map((error) => <p key={error}>{error}</p>)}</div>}
        <div className="form-actions">{confirming && <button className="secondary-button" type="button" disabled={busy} onClick={() => setConfirming(false)}><ArrowLeft />修正する</button>}<button className="primary-button" type="button" disabled={busy} onClick={() => void (confirming ? submit() : review())}>{busy ? '登録中…' : confirming ? <><PackagePlus />商品を登録する</> : '登録内容を確認する'}</button></div>
      </section>
    </div>
  );
};
