# BarMisaki POS UI redesign

## Structure

- `/` and the old `/menu` link redirect to `/order`. The home/hero/gallery route is removed.
- Four destinations: order, orders, products, account. `/add` opens product creation inside product management.
- The shared cart provider lives above routes. Navigation preserves items and the selected table; submitting an order still requires a separate confirmation.
- `ProductForm` is shared by create/edit/duplicate. Existing transactions, revision checks and order snapshots remain in use; no Firestore schema migration is required.
- The app uses `pos.css`; the older presentation styles and gallery are not imported into the app bundle.
- Notifications move to the top-bar drawer. Existing service-day filtering, announcement toast, emergency categories and Firebase subscriptions remain.
- Sound can be muted from the top bar. Order cards group the existing per-item documents by cart ID, show quantities, and prioritize older active orders. Waiting indicators change at 5 and 10 minutes; NEW lasts 30 seconds.

## Reference roles

- Order layout: [Square Restaurants](https://squareup.com/jp/ja/point-of-sale/restaurants) and [Shopify Smart Grid](https://help.shopify.com/en/manual/sell-in-person/getting-started/smart-grid).
- Operational order tickets: [Toast Orders Hub](https://doc.toasttab.com/doc/platformguide/platformUsingOrdersHub.html).
- Management navigation/forms: [shadcn Sidebar](https://ui.shadcn.com/docs/components/sidebar) and [Blocks](https://ui.shadcn.com/blocks).
- Focus, touch targets and feedback: [Vercel Interface Guidelines](https://vercel.com/design/guidelines).

## Verification

Validated locally in isolated sample mode (no production orders/products/notices were written by these checks):

- 60 automated tests: cart quantities, table range 1–18, required cocktail options, search, confirmation-before-send, send failure retention, service day, grouped orders, product edit/delete snapshots and revision conflicts, duplication, profile icon preservation, notifications and sound mute.
- Browser: direct add → quantity 2 → table 18 → confirmation → submit → one grouped ticket with quantity 2.
- Browser: pending → preparing → completed; completed ticket disappears from All and stays in Completed.
- Browser: product duplicate keeps original; shared drawer shows image/recipe; delete confirmation covered by automated tests.
- Browser: recipe photo and adjustable large text on desktop and mobile; horizontal yes/no options in the customizer.
- Browser: notice creation, top toast, drawer list, and toast expiry; emergency create → acknowledge → resolve removes the banner.
- Browser: Ctrl/Cmd+K name/category search, modal focus containment, Tab wrapping, Escape and trigger focus return.
- Browser: moving to Account and back preserves cart contents.
- Viewport checks: 390×844, 768×1024, 1024×768, 1366×768, 1920×1080 and 2560×1440. No document horizontal overflow; desktop uses 3–4 product columns, smaller widths 2, and mobile uses bottom navigation/cart sheet.
- TypeScript/Vite production build passed. Output CSS approximately 31.5 KB (7.3 KB gzip); hero preload and homepage code removed from the initial app.

## Boundaries

- Responsive checks use a browser viewport, not physical iOS/Android hardware. Native photo chooser and actual speaker playback should still be checked on event devices.
- Firebase authentication, rules, permissions and existing subscription queries were not redesigned. This is not a new staff-role/security system.
- Production data mutations and Firestore emulator/rule tests were not part of these UI checks. Existing history is filtered at 05:00 Japan time rather than permanently deleted.
- No hosting migration: the existing GitHub Pages workflow remains responsible for deployment.
