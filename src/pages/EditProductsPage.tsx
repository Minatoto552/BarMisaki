import { Pencil, Search, Trash2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';

import { ImageField } from '../components/ImageField';
import { Modal } from '../components/Modal';
import { useData } from '../lib/data';
import { validateProduct } from '../lib/validation';
import { categoryLabels, productCategories, type Product, type ProductCategory } from '../types';

export const EditProductsPage = () => {
  const { products, profile, ready } = useData();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<ProductCategory | 'all'>('all');
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [notice, setNotice] = useState('');
  const normalize = (value: string) => value.normalize('NFKC').toLocaleLowerCase('ja-JP').trim();
  const visible = products.filter((product) => (category === 'all' || product.category === category)
    && normalize(product.name).includes(normalize(search)));

  return <div className="page edit-products-page">
    <div className="page-heading"><span className="eyebrow">MANAGE ITEMS</span><h1>商品編集</h1><p>名前・画像・カテゴリー・レシピを編集できます。変更は全端末のメニューに反映されます。</p></div>
    <p className="product-management-note">編集・削除しても、受付済みの注文の商品名やレシピは注文時の内容で残ります。標準のカラーツインは、ノーマルカクテルが未登録の場合も表示されます。</p>
    {!profile && <p className="product-management-note">編集・削除するには、<Link to="/account">名前とアイコンを登録</Link>してください。</p>}
    {notice && <p className="product-feedback" role="status">{notice}</p>}
    <div className="product-management-toolbar">
      <label className="search-box"><Search /><input aria-label="編集する商品を検索" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="商品名で検索" /></label>
      <label className="product-category-filter">カテゴリー<select value={category} onChange={(event) => setCategory(event.target.value as ProductCategory | 'all')}><option value="all">すべて</option>{productCategories.map((value) => <option key={value} value={value}>{categoryLabels[value]}</option>)}</select></label>
      <span>{visible.length}件</span>
    </div>
    {!ready ? <p role="status">商品を読み込んでいます…</p> : visible.length ? <div className="product-management-list">{visible.map((product) => <article className="product-management-row" key={product.id}>
      <img src={product.imageUrl} alt="" loading="lazy" />
      <div className="product-management-info"><span>{categoryLabels[product.category]}</span><h2>{product.name}</h2><small>登録者：{product.creatorName}{!product.isAvailable && ' ／ 非表示'}</small></div>
      <div className="product-management-actions">
        <button type="button" className="edit-product-button" disabled={!profile} aria-label={`${product.name}を編集`} onClick={() => { setNotice(''); setEditing(product); }}><Pencil />編集</button>
        <button type="button" className="delete-product-button" disabled={!profile} aria-label={`${product.name}を削除`} onClick={() => { setNotice(''); setDeleting(product); }}><Trash2 />削除</button>
      </div>
    </article>)}</div> : <div className="empty-state"><h3>{products.length ? '検索に一致する商品がありません' : '編集できる登録商品はありません'}</h3><Link to="/add">商品を追加する</Link></div>}
    {editing && <ProductEditor key={editing.id} product={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); setNotice('商品を更新しました。'); }} />}
    {deleting && <DeleteProductDialog product={deleting} onClose={() => setDeleting(null)} onDeleted={() => { setDeleting(null); setNotice('商品を削除しました。受付済みの注文は保持されています。'); }} />}
  </div>;
};

const ProductEditor = ({ product, onClose, onSaved }: { product: Product; onClose: () => void; onSaved: () => void }) => {
  const { updateProduct } = useData();
  const [name, setName] = useState(product.name);
  const [category, setCategory] = useState(product.category);
  const [recipe, setRecipe] = useState(product.category === 'original_cocktail' ? product.recipe : '');
  const [image, setImage] = useState<File | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    const nextErrors = validateProduct(category, name, image, recipe, product.imageUrl);
    setErrors(nextErrors);
    if (nextErrors.length) return;
    setBusy(true);
    try { await updateProduct(product.id, { name, category, recipe, image }, product.updatedAt); onSaved(); }
    catch (reason) { setErrors([reason instanceof Error ? reason.message : '商品の更新に失敗しました。']); }
    finally { setBusy(false); }
  };

  return <Modal title="商品を編集" onClose={() => { if (!busy) onClose(); }} wide>
    <form className="product-editor" onSubmit={(event) => void submit(event)}>
      <fieldset disabled={busy} className="product-editor-fields">
        <label className="field"><span>カテゴリー</span><select value={category} onChange={(event) => setCategory(event.target.value as ProductCategory)}>{productCategories.map((value) => <option key={value} value={value}>{categoryLabels[value]}</option>)}</select></label>
        <label className="field"><span>商品名 <b>必須</b></span><input value={name} maxLength={60} onChange={(event) => setName(event.target.value)} /></label>
        <div className="field"><span>商品画像</span><ImageField file={image} onChange={setImage} existingImageUrl={product.imageUrl} /><small>選び直さなければ現在の画像を使います。</small>{image && <button type="button" className="text-button" onClick={() => setImage(null)}>元の画像に戻す</button>}</div>
        {category === 'original_cocktail' && <label className="field recipe-field"><span>レシピ <b>必須</b></span><textarea value={recipe} maxLength={2000} rows={8} onChange={(event) => setRecipe(event.target.value)} /><small>{[...recipe].length}/2000文字</small></label>}
      </fieldset>
      {errors.length > 0 && <div className="error-list" role="alert">{errors.map((error) => <p key={error}>{error}</p>)}</div>}
      <div className="form-actions"><button type="button" className="secondary-button" disabled={busy} onClick={onClose}>キャンセル</button><button type="submit" className="primary-button" disabled={busy}>{busy ? '保存中…' : '変更を保存する'}</button></div>
    </form>
  </Modal>;
};

const DeleteProductDialog = ({ product, onClose, onDeleted }: { product: Product; onClose: () => void; onDeleted: () => void }) => {
  const { deleteProduct } = useData();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const remove = async () => {
    if (busy) return;
    setBusy(true); setError('');
    try { await deleteProduct(product.id, product.updatedAt); onDeleted(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : '商品の削除に失敗しました。'); }
    finally { setBusy(false); }
  };
  return <Modal title="商品を削除しますか？" onClose={() => { if (!busy) onClose(); }}>
    <div className="delete-product-confirmation"><h3>{product.name}</h3><p>全端末のメニューから削除されます。この操作は取り消せません。</p><p>受付済みの注文と、その注文のレシピは残ります。</p>
      {error && <p className="error-list" role="alert">{error}</p>}
      <div className="form-actions"><button type="button" className="secondary-button" disabled={busy} onClick={onClose}>キャンセル</button><button type="button" className="delete-product-button" disabled={busy} onClick={() => void remove()}>{busy ? '削除中…' : 'この商品を削除する'}</button></div>
    </div>
  </Modal>;
};
