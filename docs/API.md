# Sticky ToDo API（v1）

## エンドポイント

```text
GET /api/status
```

稼働状態だけをJSONで返します。現在のlocalStorageデータは返しません。

## 認証

Cloudflare Pages FunctionsのSecret `API_TOKEN` と、リクエストのBearerトークンを照合します。

```http
Authorization: Bearer <API_TOKEN>
```

トークンがない、または一致しない場合は `401 Unauthorized` を返します。

## 正常レスポンス

```json
{
  "service": "sticky-todo",
  "status": "ok",
  "apiVersion": "v1"
}
```

## Cloudflare側の設定

Cloudflare Pagesの対象プロジェクトで、Settings → Variables and Secretsに移動し、暗号化されたSecretとして `API_TOKEN` を登録します。トークンをソースコードやブラウザ側のJavaScriptに書いてはいけません。

## 確認例

```powershell
curl.exe -i https://sticky-todo.pages.dev/api/status
curl.exe -i -H "Authorization: Bearer YOUR_TOKEN" https://sticky-todo.pages.dev/api/status
```

最初の呼び出しは401、正しいSecretを設定した後の2つ目は200になります。

## 次の段階

タスクをAPIで返すには、ブラウザのlocalStorageではなく、Cloudflare D1などのサーバー側DBへ保存先を移行し、認証ユーザーまたはテナントIDで絞り込む必要があります。
