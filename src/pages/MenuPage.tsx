import { Check, ChevronRight, Grid2X2, List, Minus, Plus, Search, ShoppingBag } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Modal } from '../components/Modal';
import { useData } from '../lib/data';
import { addCartItem, getCartQuantity, setCartItemQuantity } from '../lib/cart';
import { builtInNormalCocktail } from '../lib/sample-data';
import { filterMenuProducts } from '../lib/menu-search';
import { validateOrderOptions, validateTableNumber } from '../lib/validation';
import {
  categoryLabels, cocktailColors, colorLabels, productCategories,
  type CartItem, type CocktailColor, type OrderOptions, type Product, type ProductCategory,
} from '../types';

const ColorChoice = ({ value, selected, onClick, label }: { value: CocktailColor; selected: boolean; onClick: () => void; label: string }) => (
  <button type="button" className={`color-choice color-${value} ${selected ? 'selected' : ''}`} onClick={onClick}>
    <span /><b>{colorLabels[value]}</b><small>{label}</small>{selected && <Check />}
  </button>
);

export const MenuPage = () => {
  const { profile, products, placeCart } = useData();
  const navigate = useNavigate();
  const [category, setCategory] = useState<ProductCategory>('normal_cocktail');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'compact'>('cards');
  const [selected, setSelected] = useState<Product | null>(null);
  const [options, setOptions] = useState<OrderOptions>({});
  const [confirming, setConfirming] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [tableNumber, setTableNumber] = useState('');
  const [cartNotice, setCartNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [receiptNumber, setReceiptNumber] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const menuProducts = useMemo(() => {
    const hasNormalCocktail = products.some((product) => product.category === 'normal_cocktail' && product.isAvailable);
    return hasNormalCocktail ? products : [builtInNormalCocktail, ...products];
  }, [products]);

  const visible = useMemo(() => filterMenuProducts(menuProducts, category, search), [category, menuProducts, search]);
  const cartQuantity = useMemo(() => getCartQuantity(cart), [cart]);

  const openOrder = (product: Product) => {
    if (!profile) { navigate('/account', { state: { notice: '注文する前に、名前とアイコンを登録してください。' } }); return; }
    setSelected(product); setOptions({}); setConfirming(product.category !== 'normal_cocktail'); setErrors([]);
  };

  const goConfirm = () => {
    if (!selected) return;
    const nextErrors = validateOrderOptions(selected.category, options);
    setErrors(nextErrors);
    if (!nextErrors.length) setConfirming(true);
  };

  const addSelectedToCart = () => {
    if (!selected) return;
    const nextErrors = validateOrderOptions(selected.category, options);
    if (nextErrors.length) { setErrors(nextErrors); return; }
    setCart((current) => addCartItem(current, selected, options));
    setCartNotice(`${selected.name}をカートに追加しました`);
    window.setTimeout(() => setCartNotice(null), 2400);
    setSelected(null); setOptions({}); setConfirming(false); setErrors([]);
  };

  const addConfiguredToCart = (product: Product, configuredOptions: OrderOptions) => {
    if (!profile) { navigate('/account', { state: { notice: 'カートへ追加する前に、名前とアイコンを登録してください。' } }); return; }
    setCart((current) => addCartItem(current, product, configuredOptions));
    setCartNotice(`${product.name}をカートに追加しました`);
    window.setTimeout(() => setCartNotice(null), 2400);
    setErrors([]);
  };

  const checkout = async () => {
    const tableError = validateTableNumber(tableNumber);
    if (!cart.length) { setErrors(['カートに商品を追加してください。']); return; }
    if (tableError) { setErrors([tableError]); return; }
    setBusy(true); setErrors([]);
    try {
      const nextReceipt = await placeCart(cart, tableNumber);
      setReceiptNumber(nextReceipt); setCart([]); setTableNumber('');
    } catch (reason) {
      setErrors([reason instanceof Error ? reason.message : '注文を送信できませんでした。']);
    } finally { setBusy(false); }
  };

  const closeCart = () => { setCartOpen(false); setReceiptNumber(null); setErrors([]); };

  return (
    <div className="page menu-page">
      <section className="menu-section">
        <div className="section-title-row"><div><span className="eyebrow">ORDER MENU</span><h2>MENU</h2><p>商品を選択し、カートからまとめて注文。</p></div><div className="menu-tools"><label className="search-box"><Search /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="全カテゴリーから商品を検索" /></label><div className="menu-view-toggle" aria-label="商品表示タイプ"><button type="button" className={viewMode === 'cards' ? 'active' : ''} aria-pressed={viewMode === 'cards'} onClick={() => setViewMode('cards')}><Grid2X2 />現在の表示</button><button type="button" className={viewMode === 'compact' ? 'active' : ''} aria-pressed={viewMode === 'compact'} onClick={() => setViewMode('compact')}><List />商品名のみ</button><small>ノーマルカクテル以外に適用</small></div></div></div>
        <div className="tab-list" role="tablist" aria-label="商品カテゴリー">
          {productCategories.map((value) => <button role="tab" aria-selected={category === value} className={category === value ? 'active' : ''} key={value} onClick={() => setCategory(value)}>{categoryLabels[value]}<span>{menuProducts.filter((item) => item.category === value && item.isAvailable).length}</span></button>)}
        </div>

        {search.trim() && <p className="search-result-count">全カテゴリーから <b>{visible.length}件</b> 見つかりました</p>}
        {visible.length ? <div className={`product-grid ${viewMode === 'compact' ? 'product-grid-compact' : ''}`}>{visible.map((product) => product.category === 'normal_cocktail' ? (
          <NormalCocktailBuilder key={product.id} product={product} onAdd={addConfiguredToCart} />
        ) : viewMode === 'compact' ? (
          <article className="compact-product-card" key={product.id}><h3>{product.name}</h3><button type="button" onClick={() => openOrder(product)}><ShoppingBag />カートへ<ChevronRight /></button></article>
        ) : (
          <article className="product-card" key={product.id}>
            <div className="product-image"><img src={product.imageUrl} alt={product.name} /><span>{categoryLabels[product.category]}</span></div>
            <div className="product-body"><div><h3>{product.name}</h3><p>by {product.creatorName}</p></div><button type="button" onClick={() => openOrder(product)}><ShoppingBag />カートへ追加<ChevronRight /></button></div>
          </article>
        ))}</div> : <div className="empty-state"><CoffeeIcon /><h3>{search.trim() ? '検索に一致する商品がありません' : 'このカテゴリーの商品はまだありません'}</h3><p>{search.trim() ? '商品名やカテゴリー名を変えて検索してください。' : '「商品追加」から最初のメニューを登録できます。'}</p>{!search.trim() && <button className="secondary-button" onClick={() => navigate('/add')}>商品を追加する</button>}</div>}
      </section>

      <button className="cart-fab" type="button" onClick={() => { setCartOpen(true); setErrors([]); }} aria-label={`カートを開く、${cartQuantity}点`}><ShoppingBag /><span>カート</span><b>{cartQuantity}</b></button>
      {cartNotice && <div className="cart-toast" role="status"><Check /><span><b>カートに追加しました</b>{cartNotice}</span></div>}

      {selected && <Modal title={confirming ? 'カートへ追加する内容' : 'カクテルをカスタマイズ'} onClose={() => setSelected(null)} wide>
        <div className="order-flow">
          <div className="order-product-summary"><img src={selected.imageUrl} alt="" /><div><span>{categoryLabels[selected.category]}</span><h3>{selected.name}</h3><p>ご注文者：{profile?.displayName}</p></div></div>
          {!confirming && selected.category === 'normal_cocktail' && <div className="customize-stack">
            <fieldset className="field-group"><legend><b>1</b>1色目を選択</legend><div className="color-grid">{cocktailColors.map((color) => <ColorChoice key={color} value={color} selected={options.color1 === color} onClick={() => setOptions((current) => ({ ...current, color1: color }))} label="1色目" />)}</div></fieldset>
            <fieldset className="field-group"><legend><b>2</b>2色目を選択 <small>同じ色も選べます</small></legend><div className="color-grid">{cocktailColors.map((color) => <ColorChoice key={color} value={color} selected={options.color2 === color} onClick={() => setOptions((current) => ({ ...current, color2: color }))} label="2色目" />)}</div></fieldset>
            <BinaryField legend="炭酸" value={options.carbonated} onChange={(value) => setOptions((current) => ({ ...current, carbonated: value }))} />
            <BinaryField legend="媚薬" value={options.aphrodisiac} onChange={(value) => setOptions((current) => ({ ...current, aphrodisiac: value }))} />
          </div>}
          {confirming && <div className="confirmation-card"><span className="eyebrow">CART ITEM</span><h3>この内容をカートへ入れますか？</h3>
            {selected.category === 'normal_cocktail' && <dl><div><dt>色</dt><dd><span className={`mini-color color-${options.color1}`} />{colorLabels[options.color1!]} ＋ <span className={`mini-color color-${options.color2}`} />{colorLabels[options.color2!]}</dd></div><div><dt>炭酸</dt><dd>{options.carbonated ? 'あり' : 'なし'}</dd></div><div><dt>媚薬</dt><dd>{options.aphrodisiac ? 'あり' : 'なし'}</dd></div></dl>}
            {selected.category !== 'normal_cocktail' && <p>{selected.category === 'original_cocktail' ? 'オリジナルカクテルのレシピはスタッフへ引き継がれます。' : '追加オプションはありません。'}</p>}
          </div>}
          {errors.length > 0 && <div className="error-list">{errors.map((error) => <p key={error}>{error}</p>)}</div>}
          <div className="modal-actions">{confirming && selected.category === 'normal_cocktail' && <button className="secondary-button" type="button" onClick={() => setConfirming(false)}>選び直す</button>}<button className="primary-button" type="button" onClick={() => confirming ? addSelectedToCart() : goConfirm()}>{confirming ? 'カートに入れる' : '内容を確認する'}</button></div>
        </div>
      </Modal>}

      {cartOpen && <Modal title={receiptNumber ? '注文完了' : `カート（${cartQuantity}点）`} onClose={closeCart} wide>
        {receiptNumber ? <div className="success-state"><div className="success-icon"><Check /></div><span className="eyebrow">ORDER NUMBER</span><h3>受付番号 #{receiptNumber}</h3><p>BarMisakiへ注文を送信しました。<br />テーブルまでお届けします。</p><button className="primary-button" onClick={closeCart}>メニューへ戻る</button></div> : <div className="cart-checkout">
          {cart.length ? <div className="cart-list">{cart.map((item) => <article className="cart-item" key={item.id}><img src={item.product.imageUrl} alt="" /><div><span>{categoryLabels[item.product.category]}</span><h3>{item.product.name}</h3>{item.product.category === 'normal_cocktail' && <p><i className={`mini-color color-${item.options.color1}`} />{colorLabels[item.options.color1!]} ＋ <i className={`mini-color color-${item.options.color2}`} />{colorLabels[item.options.color2!]} ／ 炭酸 {item.options.carbonated ? 'あり' : 'なし'} ／ 媚薬 {item.options.aphrodisiac ? 'あり' : 'なし'}</p>}</div><div className="quantity-stepper" aria-label={`${item.product.name}の個数`}><button type="button" onClick={() => setCart((current) => setCartItemQuantity(current, item.id, item.quantity - 1))} aria-label="1個減らす"><Minus /></button><output aria-live="polite">{item.quantity}</output><button type="button" onClick={() => setCart((current) => setCartItemQuantity(current, item.id, item.quantity + 1))} aria-label="1個増やす"><Plus /></button></div></article>)}</div> : <div className="cart-empty"><ShoppingBag /><h3>カートは空です</h3><p>メニューから商品を追加してください。</p></div>}
          <fieldset className="table-number-field"><legend>テーブル番号 <b>必須</b></legend><div className="table-number-grid">{Array.from({ length: 8 }, (_, index) => String(index + 1)).map((number) => <button type="button" key={number} className={tableNumber === number ? 'selected' : ''} aria-pressed={tableNumber === number} onClick={() => setTableNumber(number)}>{number}</button>)}</div><em>お届け先のテーブル番号を1〜8から選択してください。</em></fieldset>
          {errors.length > 0 && <div className="error-list">{errors.map((error) => <p key={error}>{error}</p>)}</div>}
          <button className="primary-button cart-submit" type="button" disabled={busy || !cartQuantity} onClick={() => void checkout()}>{busy ? '注文を送信中…' : `${cartQuantity}点を注文する`}</button>
        </div>}
      </Modal>}
    </div>
  );
};

const BinaryField = ({ legend, value, onChange }: { legend: string; value: boolean | undefined; onChange: (value: boolean) => void }) => (
  <fieldset className="field-group binary-field"><legend>{legend}</legend><div className="segmented"><button type="button" className={value === true ? 'selected' : ''} onClick={() => onChange(true)}>あり</button><button type="button" className={value === false ? 'selected' : ''} onClick={() => onChange(false)}>なし</button></div></fieldset>
);

const NormalCocktailBuilder = ({ product, onAdd }: { product: Product & { category: 'normal_cocktail' }; onAdd: (product: Product, options: OrderOptions) => void }) => {
  const [builderOptions, setBuilderOptions] = useState<OrderOptions>({});
  const [builderErrors, setBuilderErrors] = useState<string[]>([]);

  const add = () => {
    const nextErrors = validateOrderOptions(product.category, builderOptions);
    setBuilderErrors(nextErrors);
    if (!nextErrors.length) onAdd(product, builderOptions);
  };

  return <article className="normal-builder">
    <div className="normal-builder-visual"><img src={product.imageUrl} alt={product.name} /><span>BUILD YOUR COCKTAIL</span><div><small>ノーマルカクテル</small><h3>{product.name}</h3><p>同じ色の組み合わせも選べます。</p></div></div>
    <div className="normal-builder-controls">
      <div className="builder-heading"><span className="eyebrow">CUSTOM ORDER</span><h3>カクテルをつくる</h3><p>4つの項目を選択してカートへ追加してください。</p></div>
      <fieldset className="field-group builder-color-field"><legend><b>01</b>1色目</legend><div className="color-grid">{cocktailColors.map((color) => <ColorChoice key={color} value={color} selected={builderOptions.color1 === color} onClick={() => setBuilderOptions((current) => ({ ...current, color1: color }))} label="1色目" />)}</div></fieldset>
      <fieldset className="field-group builder-color-field"><legend><b>02</b>2色目 <small>同色OK</small></legend><div className="color-grid">{cocktailColors.map((color) => <ColorChoice key={color} value={color} selected={builderOptions.color2 === color} onClick={() => setBuilderOptions((current) => ({ ...current, color2: color }))} label="2色目" />)}</div></fieldset>
      <div className="builder-binary-grid"><BinaryField legend="03 炭酸" value={builderOptions.carbonated} onChange={(value) => setBuilderOptions((current) => ({ ...current, carbonated: value }))} /><BinaryField legend="04 媚薬" value={builderOptions.aphrodisiac} onChange={(value) => setBuilderOptions((current) => ({ ...current, aphrodisiac: value }))} /></div>
      {builderErrors.length > 0 && <div className="error-list">{builderErrors.map((error) => <p key={error}>{error}</p>)}</div>}
      <button className="primary-button builder-add-button" type="button" onClick={add}><ShoppingBag />選択した内容をカートへ追加</button>
    </div>
  </article>;
};

const CoffeeIcon = () => <div className="empty-icon"><ShoppingBag /></div>;
