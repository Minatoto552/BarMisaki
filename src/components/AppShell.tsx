import {
  Bell,
  CircleUserRound,
  ClipboardList,
  Coffee,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Volume2,
  VolumeX,
} from "lucide-react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { useData } from "../lib/data";
import {
  installNotificationSoundUnlock,
  playAnnouncementSound,
} from "../lib/notification-sounds";
import { getCurrentServiceDayStart } from "../lib/service-day";
import { EmergencySystem } from "./EmergencySystem";
import { AnnouncementToast } from "./AnnouncementToast";
import { NotificationDrawer } from "./NotificationDrawer";
const links = [
  { to: "/order", label: "注文", icon: Coffee },
  { to: "/orders", label: "注文管理", icon: ClipboardList },
  { to: "/products", label: "商品管理", icon: Package },
  { to: "/account", label: "アカウント", icon: CircleUserRound },
];
export const AppShell = () => {
  const { profile, runtimeMode, ready, error, orders, announcements, isStaff } =
    useData();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem("barmisaki-sidebar") === "collapsed",
  );
  const [notifications, setNotifications] = useState(false);
  const [sound, setSound] = useState(
    () => localStorage.getItem("barmisaki-sound") !== "off",
  );
  const [lastSeen, setLastSeen] = useState(() =>
    Number(localStorage.getItem("barmisaki-notices-seen") || 0),
  );
  const [clock, setClock] = useState(Date.now);
  const [newNotice, setNewNotice] = useState("");
  const started = useRef(Date.now());
  const seenOrders = useRef(new Set<string>());
  const dayStart = getCurrentServiceDayStart(new Date(clock));
  const pending = useMemo(
    () =>
      new Set(
        orders
          .filter(
            (o) =>
              o.status !== "completed" &&
              new Date(o.createdAt).getTime() >= dayStart,
          )
          .map((o) => o.cartId || o.id),
      ).size,
    [orders, dayStart],
  );
  const unread = announcements.filter(
    (a) =>
      new Date(a.createdAt).getTime() >= dayStart &&
      new Date(a.createdAt).getTime() > lastSeen,
  ).length;
  useEffect(() => installNotificationSoundUnlock(), []);
  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    document.title = `${links.find((link) => location.pathname === link.to)?.label || "注文"} | BarMisaki`;
    window.scrollTo(0, 0);
  }, [location.pathname]);
  useEffect(() => {
    const fresh = new Set<string>();
    orders.forEach((order) => {
      const key = order.cartId || order.id;
      if (
        !seenOrders.current.has(key) &&
        new Date(order.createdAt).getTime() >= started.current &&
        order.status === "pending"
      )
        fresh.add(key);
    });
    orders.forEach((order) => seenOrders.current.add(order.cartId || order.id));
    if (fresh.size && isStaff) {
      setNewNotice(`新しい注文が${fresh.size}件届きました`);
      playAnnouncementSound();
    }
  }, [orders, isStaff]);
  useEffect(() => {
    if (!newNotice) return;
    const timer = window.setTimeout(() => setNewNotice(""), 6000);
    return () => window.clearTimeout(timer);
  }, [newNotice]);
  const toggleSound = () => {
    const next = !sound;
    setSound(next);
    localStorage.setItem("barmisaki-sound", next ? "on" : "off");
  };
  const readNotices = () => {
    const now = Date.now();
    setLastSeen(now);
    localStorage.setItem("barmisaki-notices-seen", String(now));
    setNotifications(true);
  };
  const nav = (mobile = false) => (
    <nav
      className={mobile ? "mobile-nav" : "sidebar-nav"}
      aria-label={mobile ? "モバイルナビゲーション" : "メインナビゲーション"}
    >
      {links.map(({ to, label, icon: Icon }) => (
        <NavLink
          to={to}
          key={to}
          aria-label={label}
          title={!mobile ? label : undefined}
        >
          <Icon />
          <span>{label}</span>
          {to === "/orders" && pending > 0 && (
            <b className="nav-badge">{pending}</b>
          )}
        </NavLink>
      ))}
    </nav>
  );
  return (
    <div className={`app-shell ${collapsed ? "sidebar-collapsed" : ""}`}>
      <a
        className="skip-link"
        href="#main-content"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("main-content")?.focus();
        }}
      >
        メインコンテンツへ
      </a>
      <aside className="sidebar">
        <NavLink
          to="/order"
          className="brand"
          aria-label="BarMisaki 注文画面へ"
        >
          <span className="brand-mark">
            <span aria-hidden="true">M</span>
          </span>
          <span>
            <b>Bar Misaki</b>
            <small>LOUNGE OPERATIONS</small>
          </span>
        </NavLink>
        <p className="nav-section-label">FLOOR CONTROL</p>
        {nav()}
        <div className="sidebar-bottom">
          <div className="sidebar-signature" aria-hidden="true">
            <span>海咲</span>
            <small>A NIGHT TO REMEMBER</small>
          </div>
          <button
            className="sidebar-toggle"
            onClick={() => {
              setCollapsed(!collapsed);
              localStorage.setItem(
                "barmisaki-sidebar",
                collapsed ? "expanded" : "collapsed",
              );
            }}
            aria-label={collapsed ? "サイドバーを展開" : "サイドバーを縮小"}
          >
            {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
            <span>折りたたむ</span>
          </button>
          <NavLink
            to="/account"
            className="profile-chip"
            aria-label={`${profile?.displayName || "未登録"}のプロフィール`}
          >
            {profile ? (
              <img src={profile.iconUrl} alt="" />
            ) : (
              <CircleUserRound />
            )}
            <span>
              <b>{profile?.displayName || "未登録"}</b>
              <small>プロフィール</small>
            </span>
          </NavLink>
        </div>
      </aside>
      <div className="app-body">
        <header className="topbar">
          <div className="topbar-context">
            <span>BarMisaki</span>
            <span>/</span>
            <b>
              {links.find((l) => l.to === location.pathname)?.label || "注文"}
            </b>
          </div>
          <div className="topbar-tools">
            <span className={`connection-status ${error ? "offline" : ""}`}>
              <i />
              {error
                ? "接続エラー"
                : !ready
                  ? "接続中"
                  : runtimeMode === "sample"
                    ? "DEMO"
                    : "LIVE"}
            </span>
            <button
              className="icon-button"
              aria-label={sound ? "通知音をオフにする" : "通知音をオンにする"}
              aria-pressed={sound}
              onClick={toggleSound}
            >
              {sound ? <Volume2 /> : <VolumeX />}
            </button>
            <button
              className="icon-button notification-trigger"
              aria-label={`お知らせを開く、未読${unread}件`}
              onClick={readNotices}
            >
              <Bell />
              {unread > 0 && <i />}
            </button>
          </div>
        </header>
        {runtimeMode === "sample" && (
          <div className="demo-bar">
            デモモード：操作はこのブラウザ内に保存されます
          </div>
        )}
        {error && (
          <div className="global-error" role="alert">
            {error}
          </div>
        )}
        <EmergencySystem />
        <main id="main-content" tabIndex={-1} aria-busy={!ready}>
          <Outlet />
        </main>
      </div>
      {nav(true)}
      <AnnouncementToast />
      {newNotice && (
        <div className="new-order-toast" role="status">
          <ClipboardList />
          <span>{newNotice}</span>
          <NavLink to="/orders" onClick={() => setNewNotice("")}>
            注文管理へ
          </NavLink>
        </div>
      )}
      {notifications && (
        <NotificationDrawer
          onClose={() => {
            setNotifications(false);
            const now = Date.now();
            setLastSeen(now);
            localStorage.setItem("barmisaki-notices-seen", String(now));
          }}
        />
      )}
    </div>
  );
};
