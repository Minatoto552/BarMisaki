import {
  AlertTriangle,
  BellRing,
  CheckCircle2,
  ChefHat,
  Eye,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Modal } from "../components/Modal";
import { RecipeViewer } from "../components/RecipeViewer";
import { OptionSummary } from "../components/CartPanel";
import { useData } from "../lib/data";
import {
  groupOrdersByCart,
  matchesOrderGroupFilter,
  type OrderGroup,
} from "../lib/order-groups";
import { summarizeOrderItems, getOrderAge } from "../lib/order-presentation";
import { getCurrentServiceDayStart } from "../lib/service-day";
import {
  emergencyKindLabels,
  orderStatusLabels,
  orderStatuses,
  type Emergency,
  type Order,
  type OrderStatus,
} from "../types";
type StatusFilter = "all" | OrderStatus;
const time = (value: string) =>
  new Date(value).toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  });
export const OrdersPage = () => {
  const {
    uid,
    isStaff,
    orders,
    emergencies,
    updateOrder,
    updateEmergency,
    ready,
    runtimeMode,
    error: connectionError,
  } = useData();
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [recipe, setRecipe] = useState<Order | null>(null);
  const [detail, setDetail] = useState<Emergency | null>(null);
  const [now, setNow] = useState(Date.now);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 10_000);
    return () => window.clearInterval(timer);
  }, []);
  const dayStart = getCurrentServiceDayStart(new Date(now));
  const groups = useMemo(
    () =>
      groupOrdersByCart(
        orders.filter(
          (o) =>
            (isStaff || o.orderedBy === uid) &&
            new Date(o.createdAt).getTime() >= dayStart,
        ),
      ),
    [orders, isStaff, uid, dayStart],
  );
  const visible = useMemo(
    () =>
      groups
        .filter((g) => matchesOrderGroupFilter(g.status, filter))
        .sort((a, b) =>
          filter === "completed"
            ? b.createdAt.localeCompare(a.createdAt)
            : a.createdAt.localeCompare(b.createdAt),
        ),
    [groups, filter],
  );
  const counts = {
    all: groups.filter((g) => g.status !== "completed").length,
    pending: groups.filter((g) => g.status === "pending").length,
    preparing: groups.filter((g) => g.status === "preparing").length,
    completed: groups.filter((g) => g.status === "completed").length,
  };
  const active = emergencies.filter((e) => e.status !== "resolved");
  const change = async (group: OrderGroup, status: OrderStatus) => {
    if (busy) return;
    setBusy(group.id);
    setError("");
    try {
      await Promise.all(
        group.orders
          .filter((o) => o.status !== status)
          .map((o) => updateOrder(o.id, status)),
      );
    } catch {
      setError(
        "一部の状態を更新できませんでした。接続を確認し、もう一度お試しください。",
      );
    } finally {
      setBusy(null);
    }
  };
  const changeEmergency = async (item: Emergency) => {
    setError("");
    try {
      await updateEmergency(
        item.id,
        item.status === "active" ? "acknowledged" : "resolved",
      );
      setDetail(null);
    } catch {
      setError("緊急通知を更新できませんでした。もう一度お試しください。");
    }
  };
  return (
    <div className="page orders-page">
      <header className="page-heading">
        <div>
          <span className="eyebrow">FLOOR SERVICE / LIVE ORDERS</span>
          <h1>{isStaff ? "注文管理" : "注文状況"}</h1>
          <p>古い注文から優先して表示しています。</p>
        </div>
        <span
          className={`connection-status ${connectionError ? "offline" : ""}`}
        >
          <i />
          {connectionError
            ? "接続エラー"
            : !ready
              ? "接続中"
              : runtimeMode === "sample"
                ? "DEMO"
                : "LIVE"}
        </span>
      </header>
      <div className="order-summary">
        {orderStatuses.map((status) => (
          <button
            key={status}
            className={`summary-card ${status}`}
            aria-pressed={filter === status}
            onClick={() =>
              setFilter((current) => (current === status ? "all" : status))
            }
          >
            <span>
              <i />
              {orderStatusLabels[status]}
            </span>
            <b key={counts[status]}>{counts[status]}</b>
            <small>注文</small>
          </button>
        ))}
      </div>
      {error && (
        <p className="error-list" role="alert">
          {error}
        </p>
      )}
      {isStaff && active.length > 0 && (
        <section className="emergency-desk">
          <header>
            <h2>
              <BellRing />
              緊急通知
            </h2>
            <span>{active.length}件</span>
          </header>
          <div className="emergency-list">
            {active.map((item) => (
              <article className="emergency-ticket" key={item.id}>
                <div>
                  <strong>{emergencyKindLabels[item.kind]}</strong>
                  <p>
                    {item.creatorName} · {time(item.createdAt)}
                  </p>
                  <p>{item.message}</p>
                </div>
                <div className="ticket-actions">
                  <button
                    className="secondary-button"
                    onClick={() => setDetail(item)}
                  >
                    <Eye />
                    詳細
                  </button>
                  <button
                    className="danger-button"
                    onClick={() => void changeEmergency(item)}
                  >
                    {item.status === "active" ? "対応を開始" : "解決済みにする"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
      <section className="orders-board">
        <div className="orders-toolbar">
          <small>履歴は毎日5:00に表示をリセット</small>
        </div>
        {visible.length ? (
          <div className="order-table-scroll">
            <div className="order-table" role="table" aria-label="注文一覧">
              <div className="order-table-head" role="row">
                <span role="columnheader">注文番号</span>
                <span role="columnheader">注文商品</span>
                <span role="columnheader">テーブル</span>
                <span role="columnheader">担当</span>
                <span role="columnheader">注文時刻</span>
                <span role="columnheader">経過時間</span>
                <span role="columnheader">状態</span>
                <span role="columnheader">操作</span>
              </div>
              {visible.map((group) => (
                <OrderRow
                  key={group.id}
                  group={group}
                  now={now}
                  isStaff={isStaff}
                  busy={!!busy}
                  onStatus={(status) => void change(group, status)}
                  onRecipe={setRecipe}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <ChefHat />
            <h2>該当する注文はありません</h2>
            <p>新しい注文が入ると自動で表示されます。</p>
          </div>
        )}
      </section>
      {recipe?.category === "original_cocktail" && (
        <RecipeViewer order={recipe} onClose={() => setRecipe(null)} />
      )}
      {detail && (
        <Modal title="緊急通知の詳細" onClose={() => setDetail(null)}>
          <div className="alert-note">
            <AlertTriangle />
            <div>
              <strong>{emergencyKindLabels[detail.kind]}</strong>
              <p>
                {detail.creatorName} · {time(detail.createdAt)}
              </p>
            </div>
          </div>
          <p>{detail.message || "補足はありません"}</p>
          <button
            className="danger-button full-width"
            onClick={() => void changeEmergency(detail)}
          >
            {detail.status === "active" ? "対応を開始" : "解決済みにする"}
          </button>
        </Modal>
      )}
    </div>
  );
};
const elapsed = (createdAt: string, now: number) => {
  const total = Math.max(0, Math.floor((now - Date.parse(createdAt)) / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const value = [minutes, seconds]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");
  return {
    value: hours ? `${String(hours).padStart(2, "0")}:${value}` : value,
    tone:
      total >= 900
        ? "critical"
        : total >= 600
          ? "late"
          : total >= 300
            ? "waiting"
            : "normal",
  };
};
const OrderRow = ({
  group,
  now,
  isStaff,
  busy,
  onStatus,
  onRecipe,
}: {
  group: OrderGroup;
  now: number;
  isStaff: boolean;
  busy: boolean;
  onStatus: (status: OrderStatus) => void;
  onRecipe: (order: Order) => void;
}) => {
  const age = getOrderAge(group.createdAt, now);
  const duration = elapsed(group.createdAt, now);
  const lines = summarizeOrderItems(group.orders);
  return (
    <article
      className={`order-catalog-row ${group.status !== "completed" ? duration.tone : ""}`}
      role="row"
    >
      <div className="order-number-cell" role="cell">
        <strong>#{group.receiptNumber}</strong>
        <div>
          {age.isNew && group.status !== "completed" && (
            <span className="new-badge">NEW</span>
          )}
        </div>
      </div>
      <div className="order-products-cell" role="cell">
        {lines.map(({ order, quantity }) => (
          <div className="order-product-line" key={order.id}>
            <div className="order-product-thumb">
              {order.productImageUrl ? (
                <img
                  src={order.productImageUrl}
                  alt=""
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <ChefHat aria-hidden="true" />
              )}
            </div>
            <div className="order-product-copy">
              <strong>{order.productName}</strong>
              {order.category === "normal_cocktail" && (
                <OptionSummary options={order} />
              )}
              {order.category === "original_cocktail" && (
                <button
                  className="recipe-button"
                  onClick={() => onRecipe(order)}
                >
                  <Eye />
                  写真・レシピ
                </button>
              )}
            </div>
            <b className="order-product-quantity">×{quantity}</b>
          </div>
        ))}
      </div>
      <div className="order-table-cell table-cell" role="cell">
        <small>TABLE</small>
        <strong>{String(group.tableNumber).padStart(2, "0")}</strong>
      </div>
      <div className="order-table-cell assignee-cell" role="cell">
        <span className="assignee-avatar">
          <UserRound />
        </span>
        <span>{group.ordererName}</span>
      </div>
      <time
        className="order-table-cell ordered-time-cell"
        role="cell"
        dateTime={group.createdAt}
      >
        {time(group.createdAt)}
      </time>
      <div
        className={`order-table-cell elapsed-cell ${group.status === "completed" ? "completed" : duration.tone}`}
        role="cell"
      >
        {group.status === "completed" ? "—" : duration.value}
      </div>
      <div className="order-table-cell status-cell" role="cell">
        <span className={`status-pill ${group.status}`}>
          <i />
          {orderStatusLabels[group.status]}
        </span>
      </div>
      <div className="order-action-cell" role="cell">
        {isStaff ? (
          group.status !== "completed" ? (
            <button
              disabled={busy}
              className={`status-action ${group.status}`}
              onClick={() =>
                onStatus(group.status === "pending" ? "preparing" : "completed")
              }
            >
              {group.status === "pending" ? <ChefHat /> : <CheckCircle2 />}
              {busy
                ? "更新中…"
                : group.status === "pending"
                  ? "対応を開始"
                  : "完了にする"}
            </button>
          ) : (
            <button
              className="text-button"
              disabled={busy}
              onClick={() => onStatus("pending")}
            >
              未対応へ戻す
            </button>
          )
        ) : (
          <span className="muted">—</span>
        )}
      </div>
    </article>
  );
};
