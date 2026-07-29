import { AlertTriangle, BellRing, CheckCircle2, ChefHat, Clock3, Eye, Radio, ShieldCheck, UserRound } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Modal } from '../components/Modal';
import { useData } from '../lib/data';
import {
  categoryLabels, colorLabels, emergencyKindLabels, orderStatusLabels, orderStatuses,
  type Emergency, type Order, type OrderStatus,
} from '../types';

type StatusFilter = 'all' | OrderStatus;

const formatTime = (value: string) => new Intl.DateTimeFormat('ja-JP', { hour: '2-digit', minute: '2-digit', month: 'numeric', day: 'numeric' }).format(new Date(value));

export const OrdersPage = () => {
  const { uid, isStaff, orders, emergencies, updateOrder, updateEmergency } = useData();
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [recipeOrder, setRecipeOrder] = useState<Order | null>(null);
  const [emergencyDetail, setEmergencyDetail] = useState<Emergency | null>(null);
  const baseOrders = isStaff ? orders : orders.filter((order) => order.orderedBy === uid);
  const visible = useMemo(() => baseOrders.filter((order) => filter === 'all' || order.status === filter), [baseOrders, filter]);
  const activeEmergency = emergencies.filter((item) => item.status !== 'resolved');
  const counts: Record<StatusFilter, number> = {
    all: baseOrders.length,
    pending: baseOrders.filter((item) => item.status === 'pending').length,
    preparing: baseOrders.filter((item) => item.status === 'preparing').length,
    completed: baseOrders.filter((item) => item.status === 'completed').length,
  };

  return (
    <div className="page orders-page">
      <div className="page-heading split-heading"><div><span className="eyebrow">LIVE KITCHEN</span><h1>{isStaff ? '注文管理' : '注文状況'}</h1><p>{isStaff ? '新しい注文と状態変更を、全端末へリアルタイムで同期します。' : 'あなたの注文が現在どの状態か確認できます。'}</p></div><div className="live-indicator"><Radio /><span><b>LIVE</b>常時更新中</span></div></div>

      {isStaff && <section className="emergency-desk">
        <div className="desk-title"><div className="desk-icon"><BellRing /></div><div><span className="eyebrow light">EMERGENCY DESK</span><h2>緊急通知</h2></div><b>{activeEmergency.length}件 対応中</b></div>
        {activeEmergency.length ? <div className="emergency-list">{activeEmergency.map((item) => <article key={item.id} className={`emergency-ticket status-${item.status}`}><img src={item.creatorIconUrl} alt="" /><div><strong>{emergencyKindLabels[item.kind]}</strong><span>{item.creatorName}・{formatTime(item.createdAt)}</span><p>{item.message || '補足はありません'}</p></div><div className="ticket-actions"><button type="button" className="ghost-button" onClick={() => setEmergencyDetail(item)}><Eye />詳細</button>{item.status === 'active' ? <button type="button" onClick={() => void updateEmergency(item.id, 'acknowledged')}>対応を開始</button> : <button type="button" onClick={() => void updateEmergency(item.id, 'resolved')}><CheckCircle2 />解決</button>}</div></article>)}</div> : <div className="desk-empty"><ShieldCheck />現在、未解決の緊急通知はありません</div>}
      </section>}

      <section className="orders-board">
        <div className="orders-toolbar"><div className="status-tabs">{(['all', ...orderStatuses] as StatusFilter[]).map((status) => <button type="button" key={status} className={filter === status ? 'active' : ''} onClick={() => setFilter(status)}>{status === 'all' ? 'すべて' : orderStatusLabels[status]}<span>{counts[status]}</span></button>)}</div><p>新しい注文順</p></div>
        {visible.length ? <div className="order-list">{visible.map((order) => <OrderTicket key={order.id} order={order} isStaff={isStaff} onStatus={(status) => void updateOrder(order.id, status)} onRecipe={() => setRecipeOrder(order)} />)}</div> : <div className="empty-state"><div className="empty-icon"><ChefHat /></div><h3>該当する注文はありません</h3><p>新しい注文が入ると、ここへ自動で表示されます。</p></div>}
      </section>

      {recipeOrder?.category === 'original_cocktail' && <Modal title={`${recipeOrder.productName}のレシピ`} onClose={() => setRecipeOrder(null)}><div className="recipe-modal"><div className="order-product-summary"><img src={recipeOrder.productImageUrl} alt="" /><div><span>受付番号 #{recipeOrder.receiptNumber}</span><h3>{recipeOrder.productName}</h3></div></div><div className="recipe-paper"><span>RECIPE</span><p>{recipeOrder.recipe}</p></div><button className="primary-button" onClick={() => setRecipeOrder(null)}>レシピを閉じる</button></div></Modal>}
      {emergencyDetail && <Modal title="緊急通知の詳細" onClose={() => setEmergencyDetail(null)}><div className="emergency-detail"><div className="alert-note"><AlertTriangle /><p><strong>{emergencyKindLabels[emergencyDetail.kind]}</strong><br />{emergencyDetail.creatorName}・{formatTime(emergencyDetail.createdAt)}</p></div><dl><div><dt>補足</dt><dd>{emergencyDetail.message || 'なし'}</dd></div><div><dt>状態</dt><dd>{emergencyDetail.status === 'active' ? '未確認' : '対応中'}</dd></div></dl><button className="primary-button" onClick={() => { void updateEmergency(emergencyDetail.id, emergencyDetail.status === 'active' ? 'acknowledged' : 'resolved'); setEmergencyDetail(null); }}>{emergencyDetail.status === 'active' ? '対応を開始する' : '解決済みにする'}</button></div></Modal>}
    </div>
  );
};

const OrderTicket = ({ order, isStaff, onStatus, onRecipe }: { order: Order; isStaff: boolean; onStatus: (status: OrderStatus) => void; onRecipe: () => void }) => (
  <article className={`order-ticket order-${order.status}`}>
    <div className="receipt-number"><small>ORDER</small><b>#{order.receiptNumber}</b><strong className="table-badge">TABLE {order.tableNumber}</strong><span className={`status-pill ${order.status}`}>{orderStatusLabels[order.status]}</span></div>
    <img className="order-thumb" src={order.productImageUrl} alt="" />
    <div className="order-main"><span>{categoryLabels[order.category]}</span><h3>{order.productName}</h3><p><UserRound />{order.ordererName}<Clock3 />{formatTime(order.createdAt)}</p>
      {order.category === 'normal_cocktail' && <div className="order-options"><span><i className={`mini-color color-${order.color1}`} />{colorLabels[order.color1]} ＋ <i className={`mini-color color-${order.color2}`} />{colorLabels[order.color2]}</span><span>炭酸 <b>{order.carbonated ? 'あり' : 'なし'}</b></span><span>媚薬 <b>{order.aphrodisiac ? 'あり' : 'なし'}</b></span></div>}
      {order.category === 'original_cocktail' && <button type="button" className="recipe-button" onClick={onRecipe}><Eye />レシピを開く</button>}
    </div>
    {isStaff && <div className="status-actions">{order.status === 'pending' && <button type="button" className="status-action status-action-pending" onClick={() => onStatus('preparing')}><ChefHat />対応を開始</button>}{order.status === 'preparing' && <button type="button" className="status-action status-action-preparing" onClick={() => onStatus('completed')}><CheckCircle2 />完了にする</button>}{order.status === 'completed' && <button type="button" className="status-action status-action-completed" onClick={() => onStatus('pending')}>未対応へ戻す</button>}</div>}
  </article>
);
