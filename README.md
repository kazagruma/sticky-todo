# Sticky ToDo（Athena構成）

React 19 + TypeScript + Vite、Tauri 2 + Rust で構成した Windows デスクトップアプリです。

- 保存ファイル：SQLite ベースの `.tdf`（ToDo File）
- ファイルの作成・選択：Tauri Dialog プラグイン
- UI：Lucide React アイコン、8つの固定レーン、期限・優先度ソート、期限色
- 完了タブ：完了日時順の履歴、鍵（ロック）のON/OFF、「完了を削除」
- カテゴリ：追加、レーン名の右クリック変更、レーンごとの横スクロール
- 「セーブ」「ロード」による任意タイミングの手動保存・再読み込み

## 開発

`npm install` 後、`npm run tauri dev`。Windows ビルドは `npm run tauri build`。

初回には任意の保存先を指定してください。タスクの変更はその `.tdf` ファイルへ自動保存されます。
