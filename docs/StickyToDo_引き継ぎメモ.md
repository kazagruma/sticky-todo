# Sticky ToDo 引き継ぎメモ

更新日：2026-09-13  
対象：Windows版 1.0.0 / React 19 + Tauri 2

このメモは、次の開発者が現行版を理解し、安全に修正・再ビルドするための資料です。

## 1. プロジェクトの場所

開発プロジェクト：

`C:\Users\LEGION\Documents\Codex\2026-09-12\new-chat\work\StickyTodoAthena`

配布物：

`C:\Users\LEGION\Documents\Codex\2026-09-12\outputs\StickyToDo-Athena`

## 2. 全体構成

```text
StickyTodoAthena/
├─ src/
│  ├─ App.tsx          # 画面全体、状態管理、付箋紙・カテゴリ操作
│  ├─ types.ts         # Task / TaskDraft / Category / Priority 型
│  ├─ styles.css       # UI全体のスタイル
│  └─ main.tsx         # Reactエントリポイント
├─ src-tauri/
│  ├─ src/lib.rs       # Tauriコマンド、SQLite読み書き、データ変換
│  ├─ src/main.rs      # Windowsエントリポイント
│  ├─ Cargo.toml       # Rust依存関係
│  ├─ tauri.conf.json  # Tauri・Windowsウィンドウ・バンドル設定
│  ├─ capabilities/    # Tauri権限（Dialogなど）
│  └─ icons/icon.ico   # Windowsアプリアイコン
├─ index.html
├─ package.json
├─ vite.config.ts
└─ tsconfig*.json
```

## 3. 技術とデータフロー

### フロントエンド

- React 19 + TypeScript
- Viteで `dist/` を生成
- Tauri APIの `invoke` でRustコマンドを呼ぶ
- `@tauri-apps/plugin-dialog` でファイル選択・ネイティブ確認を行う
- Lucide Reactでアイコンを表示

### Rust / SQLite

`src-tauri/src/lib.rs` の2コマンドが中心です。

- `open_database(path)`：`.tdf` を開き、全タスクを返す
- `save_tasks(path, tasks)`：トランザクションで全タスクを保存する

`.tdf` は通常のSQLiteファイルです。SQLCipherやパスワード処理はありません。

テーブルは `tasks` 1つで、主なカラムは次のとおりです。

`id`, `category`, `title`, `body`, `due_date`, `priority`, `created_at`, `done`, `done_at`, `locked`

起動時、既存の古いDBに `done_at` / `locked` が無い場合は `ALTER TABLE` を試みます。すでに存在する場合のエラーは意図的に無視しています。

## 4. 状態と主要な処理

### タスク状態

- `done=false`：ボードに表示
- `done=true`：完了タブに表示
- `doneAt`：完了日時。完了タブの並び順にも使用
- `locked=true`：完了タブの一括削除から保護

### 「ボードに戻す」

完了付箋紙の右クリックメニューから実行します。元の内容を保ったまま、次を変更します。

```text
done    = false
doneAt  = null
locked  = false
```

鍵が付いていても復元できます。復元後は元のカテゴリの期限・優先度ソートに戻ります。

### カテゴリ削除

`App.tsx` の `deleteCategory` が担当します。

1. 対象カテゴリの全タスクを検索
2. 鍵付き完了タスクがあれば警告して即時中止
3. タスクが残っていれば `confirmDialog` でネイティブ確認
4. 「はい」の場合だけカテゴリと所属タスクを削除

標準のブラウザ `confirm()` はTauri WebViewで期待どおり表示されないことがあるため、カテゴリ削除では必ず `@tauri-apps/plugin-dialog` の `confirm` を使います。

### カテゴリの保存

カテゴリ一覧は現在 `localStorage` にも保存しています。`.tdf` にはタスクが保存され、ロード時にタスクが使用している追加カテゴリを標準カテゴリへ合成します。

空の追加カテゴリを別PCや別プロファイルへ完全に移行する必要が出た場合は、カテゴリ専用テーブルを `.tdf` に追加する改修が必要です。

## 5. 主要ファイル別の修正ポイント

### `src/App.tsx`

UIとほぼすべての操作ロジックが1ファイルにまとまっています。

- `tasks`：現在開いているタスク配列
- `filePath`：現在の `.tdf` パス
- `categories`：レーン一覧
- `tab`：`board` / `done`
- `menu`：付箋紙の右クリックメニュー位置・対象
- `categoryMenu`：カテゴリ右クリックメニュー位置・対象
- `persist`：Rustの `save_tasks` 呼び出し
- `load`：Rustの `open_database` 呼び出し
- `Lane`：カテゴリレーンと未完了付箋紙
- `ContextMenu`：付箋紙の右クリックメニュー
- `CategoryMenu`：カテゴリの右クリックメニュー
- `Editor`：新規作成・編集ダイアログ

操作を追加する場合は、状態更新だけで終わらせず、必ず `persist(nextTasks)` まで呼んで自動保存されることを確認してください。

### `src/types.ts`

Rustの `serde(rename_all = "camelCase")` と対応しています。Rust側のフィールドを変更した場合は、TypeScriptの `Task` も同時に更新してください。

### `src/styles.css`

付箋紙色、レーン、完了タブ、メニューのスタイルを定義しています。

- `.note.normal`：通常・期限なし
- `.note.soon`：3〜6日
- `.note.urgent`：1〜2日
- `.note.danger`：当日・期限超過
- `.context`：右クリックメニュー
- `.done-row`：完了タブの行

メニュー文言が折り返される場合は、`.context` の `width` と `white-space: nowrap` を確認します。

### `src-tauri/src/lib.rs`

SQLiteスキーマを変更するときは、既存の `.tdf` が開けることを必ず確認してください。新カラム追加には後方互換用の `ALTER TABLE` を追加し、既存DBでの「column already exists」は許容します。

`save_tasks` は全件削除後に全件INSERTする方式です。部分更新ではありません。将来タスク数が大きくなった場合は、UPSERT方式への変更を検討してください。

### `src-tauri/tauri.conf.json`

- `frontendDist`：`../dist`
- `devUrl`：`http://127.0.0.1:1420`
- バンドル対象：`nsis`
- Windowsウィンドウサイズ・最小サイズ

設定を変更した場合は、Tauriのスキーマエラーが出やすいので、ビルド前に `npm run build` と `npm run tauri build` を実行してください。

## 6. 開発・ビルド手順

PowerShellでプロジェクトへ移動します。

```powershell
cd C:\Users\LEGION\Documents\Codex\2026-09-12\new-chat\work\StickyTodoAthena
```

依存関係の導入：

```powershell
npm install
```

フロントエンドの型チェックと本番ビルド：

```powershell
npm run build
```

Tauri開発起動：

```powershell
npm run tauri dev
```

Windowsのリリースビルド：

```powershell
npm run tauri build
```

成果物は通常ここに出ます。

```text
src-tauri/target/release/sticky-todo.exe
src-tauri/target/release/bundle/nsis/Sticky ToDo_1.0.0_x64-setup.exe
```

配布用にコピーする場合は、名前を `StickyToDo.exe` と `StickyToDo_1.0.0_x64-setup.exe` に揃えます。

## 7. 修正時の確認チェックリスト

- `npm run build` が成功する
- `cargo check` が成功する
- 新規 `.tdf` を作成できる
- 既存 `.tdf` を開ける
- タスク作成・編集・削除・完了が保存される
- 完了タブでカテゴリ、期限日、優先度、本文が確認できる
- 鍵のON/OFFと一括削除保護が機能する
- 鍵付き完了付箋紙を含むカテゴリ削除が拒否される
- 付箋紙のあるカテゴリ削除で「はい／いいえ」が表示される
- 完了付箋紙を右クリックしてボードに戻せる
- 復元時に鍵と完了日時が解除される
- 追加カテゴリの改名・削除が機能する
- 期限色とレーン内横スクロールが壊れていない
- Windowsの通常権限で起動できる

## 8. 既知の注意点

1. `.tdf` は暗号化されていない。機密情報を保存する用途には使わない。
2. `save_tasks` は全件置換保存のため、将来大量データになる場合は性能を確認する。
3. カテゴリ一覧の永続化は現状 `localStorage` とタスクデータの合成。空の追加カテゴリをファイル単位で移行する要件が出たらスキーマ拡張が必要。
4. Windowsのサンドボックス環境ではTauri起動がアクセス拒否になることがある。通常のWindows権限での起動確認を行う。
5. `src-tauri/src/main.rs` は起動時パニックを `%TEMP%\sticky-todo-startup-error.txt` に書き出す診断処理を持つ。原因調査後も残してよいが、製品方針に応じてログ設計を整理する。

## 9. 配布物

- `StickyToDo.exe`：インストール不要の単体版
- `StickyToDo_1.0.0_x64-setup.exe`：NSISインストーラー
- `StickyToDo_使い方マニュアル.pdf`：初めての人向け操作説明
- `StickyToDo_仕様書_完成版.md`：現行仕様
