import {
  AlertTriangle,
  BellRing,
  CheckCircle2,
  ChefHat,
  Clock3,
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
            onClick={() => setFilter(status)}
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
          <div className="category-tabs" aria-label="注文状態">
            {(["all", ...orderStatuses] as StatusFilter[]).map((status) => (
              <button
                key={status}
                className={filter === status ? "active" : ""}
                aria-pressed={filter === status}
                onClick={() => setFilter(status)}
              >
                {status === "all" ? "すべて" : orderStatusLabels[status]}
                <span className="count-badge">{counts[status]}</span>
              </button>
            ))}
          </div>
          <small>履歴は毎日5:00に表示をリセット</small>
        </div>
        {visible.length ? (
          <div className="order-list">
            {visible.map((group) => (
              <OrderCard
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
const OrderCard = ({
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
  const lines = summarizeOrderItems(group.orders);
  return (
    <article
      className={`order-ticket ${group.status !== "completed" ? age.level : ""}`}
    >
      <header>
        <div>
          <b>#{group.receiptNumber}</b>
          {age.isNew && group.status !== "completed" && (
            <span className="new-badge">NEW</span>
          )}
        </div>
        <span
          className={`order-timer ${group.status === "completed" ? "" : age.level}`}
        >
          <Clock3 />
          {group.status === "completed" ? "完了" : age.label}
        </span>
      </header>
      <div className="order-meta">
        <span className="table-label">
          TABLE <b>{group.tableNumber}</b>
        </span>
        <span>
          <UserRound />
          {group.ordererName}
        </span>
        <time dateTime={group.createdAt}>{time(group.createdAt)}</time>
      </div>
      <div className="ticket-lines">
        {lines.map(({ order, quantity }) => (
          <div className="ticket-line" key={order.id}>
            <div>
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
            <b>×{quantity}</b>
          </div>
        ))}
      </div>
      <footer>
        <span className={`status-pill ${group.status}`}>
          <i />
          {orderStatusLabels[group.status]}
        </span>
        <small>{group.orders.length}点</small>
      </footer>
      {isStaff && (
        <div className="status-actions">
          {group.status !== "completed" ? (
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
            <>
              <span className="completed-label">
                <CheckCircle2 />
                完了
              </span>
              <button
                className="text-button"
                disabled={busy}
                onClick={() => onStatus("pending")}
              >
                未対応へ戻す
              </button>
            </>
          )}
        </div>
      )}
    </article>
  );
};
