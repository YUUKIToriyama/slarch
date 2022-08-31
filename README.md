# slarch

Slack の過去ログを保存します

## メソッド一覧

### getChannels

- description
  - Bot から見えるチャンネルの一覧を取得します。
- permission
  - `channels:read` `groups:read` `mpim:read` `im:read`

### archiveMessages

- description
  - 指定したチャンネルのメッセージ一覧を取得します。
- permission
  - `users:read` `channels:history`
