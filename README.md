# BarMisaki Order System

VRChat内の店舗イベント向けに、商品登録・注文・キッチン管理・簡易アカウント・緊急通知をリアルタイムで扱うWebアプリです。既存の `event-cafe-2026` とは別の、新規Firebaseプロジェクトと新規GitHubリポジトリで運用する前提です。

## 実装済み機能

- ノーマルカクテル／オリジナルカクテル／フードの商品一覧
- 匿名認証ユーザーによる商品追加、画像プレビュー、Storageアップロード
- ノーマルカクテルの2色選択（同色可）、炭酸、媚薬
- 複数カテゴリーの商品をまとめるカートと、注文時のテーブル番号入力
- カート確認後の一括注文、商品スナップショットを保持する注文データ
- 注文状態「未対応／対応中／完了」とリアルタイム更新
- スタッフ注文票から開けるスクロール対応レシピ
- 名前とアイコンだけのアカウント登録
- 全画面から使える緊急ボタン、リアルタイムバナー、スタッフの確認／解決
- Firebase未設定でもブラウザ内で動くデモモード
- スマートフォン下部ナビゲーションとPC向けヘッダー

## データ構造

### `users/{uid}`

`id`, `displayName`, `iconUrl`, `createdAt`, `updatedAt`。メールアドレスやパスワードは保存しません。権限はプロフィール文書ではなくFirebase Authのカスタムクレームで管理します。

### `products/{productId}`

共通項目は `name`, `imageUrl`, `category`, `createdBy`, `creatorName`, `isAvailable`, `createdAt`, `updatedAt`。`original_cocktail` だけ `recipe` を持ちます。

### `orders/{orderId}`

注文時点の `productName`, `productImageUrl`, `category`、注文者、状態、日時をスナップショットとして保存します。ノーマルカクテルだけ `color1`, `color2`, `carbonated`, `aphrodisiac`、オリジナルだけ `recipe` を持ちます。

### `emergencies/{emergencyId}`

`kind`, `message`, `createdBy`, `creatorName`, `creatorIconUrl`, `status`, `createdAt`, `updatedAt`。状態は `active` → `acknowledged` → `resolved` です。

全コレクションはFirestore `onSnapshot` で購読します。一般ユーザーは自分の注文だけ、`staff` または `admin` クレームを持つユーザーは全注文を購読します。

## ローカル起動

Node.js 20以上を用意します。

```bash
npm install
npm run dev
```

Firebase値が空のままでもデモモードで画面と操作を確認できます。デモデータはLocal Storageへ保存され、同じブラウザの別タブにも更新が伝わります。

## 新しいFirebaseプロジェクトの作成

既存プロジェクトを誤って使わないため、このリポジトリには実値入り `.firebaserc` を含めていません。

1. Firebase Consoleで新しいプロジェクトを作成する（例: `vrc-order-management`）。
2. 「プロジェクトの設定」からWebアプリを追加する。
3. Authentication → Sign-in methodで「匿名」を有効にする。
4. Firestore Databaseを作成する。
5. Storageを開始する。
6. Hostingを開始する。
7. `.env.example` を `.env.local` にコピーし、新しいWebアプリの値だけを入れる。
8. `.firebaserc.example` を `.firebaserc` にコピーし、新しいProject IDへ置き換える。
9. Rules、Indexes、Hostingをデプロイする。

```bash
npx firebase login
npx firebase use --add
npx firebase deploy --only firestore:rules,firestore:indexes,storage
npm run build
npx firebase deploy --only hosting
```

`.env.local` と `.firebaserc` はGitへ追加しないでください。Firebase Web APIキーはクライアント設定値ですが、アクセス制御は必ず同梱RulesとAuthで行います。

## スタッフ権限

注文状態と緊急通知状態の変更には、対象ユーザーのAuthトークンへ `staff: true` または `admin: true` のカスタムクレームが必要です。Admin SDKを使える安全な管理環境で設定してください。

```js
await getAuth().setCustomUserClaims(uid, { staff: true });
```

設定後、対象ユーザーはページの再読み込みまたは再認証を行います。クレーム設定用のサービスアカウント鍵は、このリポジトリやブラウザコードに置かないでください。

## セキュリティ

- 商品追加・注文・緊急通知は匿名認証と登録済みプロフィールが必要
- 商品編集・削除は登録者本人またはスタッフ（初期UIでは未提供）
- 注文／緊急状態変更はスタッフまたは管理者のみ
- 画像はJPEG、PNG、WebP、GIFかつ5MB未満
- 商品名60文字、名前32文字、レシピ2000文字、緊急補足200文字まで
- クライアントで1.8秒の連続操作抑制
- 公開時はFirebase App Checkも有効化推奨

## テストと確認

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

Firebase Emulator Suiteを導入した環境では `firebase.json` のAuth、Firestore、Storageエミュレーターを使用できます。

## GitHubへ保存する前の確認

このディレクトリは独立したGitリポジトリとして初期化済みです。remoteは未設定です。新規リポジトリを作成し、リポジトリ名・ブランチ・変更ファイルを確認してから接続／pushしてください。

```bash
git status
git branch --show-current
git remote -v
```

推奨リポジトリ名: `vrc-order-management`  
現在の作業ブランチ: `codex/emergency-account-system`

## 仮定した仕様

- 緊急通知は登録ユーザー全員が送信でき、全ログイン端末へ表示されます。
- 緊急通知の確認・解決はスタッフ／管理者だけが行います。
- 一般ユーザーの注文管理画面には自分の注文だけを表示します。
- アカウントは端末の匿名UIDに紐づくため、別端末への自動引き継ぎはありません。将来必要ならVRChat OAuth等へ移行できます。
