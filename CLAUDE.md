# 概要
本WebページはGitHub Pagesで公開するホームページです。

## 会社概要
- 会社名: 株式会社サンエイクローバー
- 資本金: 990万円
- 住所: 〒170-0013 東京都豊島区東池袋 2丁目62番8号 BIGオフィスプラザ池袋1206
- 電話番号: 03-6876-4989

# 画面定義
会社のホームページを１ページに凝縮します。
その上で１社員＝１ページで公開します。

## 画面一覧
- トップページ (index.html)
- 404ページ (404.html)
- プライバシーポリシー (privacy.html)
- 私のプロフィール (profiles/takuya-nakanishi/index.html)

## Web問合せフォーム

送信先は自前のCloudflare Worker(`sc-products/apps/web-to-notion-cloudflare`)。
Workerが受けてNotionの「プロスペクト」DBへ登録し、Slackへ通知する。
**2026-08-27にSalesforce Web-to-Leadから移行した**(Salesforceを開く習慣がなく
問い合わせに気づけなかったため。受け皿だったDeveloper Edition組織は180日
ログインが無いと消える点も理由)。

### POST先:
https://web-to-notion-cloudflare.sanei-clover.workers.dev/

### フォームパラメータ
- `company` = 会社名 / Company 欄
- `name` = 氏名 / Name 欄(**姓名の分割は不要**。Worker側が1欄のまま扱う)
- `phone` = 電話 / Phone 欄
- `email` = メール / Email 欄
- `description` = ご相談内容 / Message 欄
- `_gotcha` = 自動投稿よけの隠しフィールド。**人には見せない**。値が入っていると
  Workerが送信を無視する(botに失敗を悟らせないため200を返す)

Worker側はname属性の揺れを候補表で吸収するため、上記以外の名前でも大抵通る。
候補に無いフィールドも捨てられず、Notionページの本文へ「その他の入力」として残る。

### 送信方式
`fetch()` でJSONレスポンス(`{"ok":true}`)を受け取り、成功/失敗を判定する。
以前の非表示iframe方式は、iframeのloadイベントが「何かが読み込まれた」ことしか
示さず**送信の成否を区別できなかった**ため廃止した。
失敗時は電話番号を添えて案内する(黙って飲み込まない)。

Workerは `ALLOWED_ORIGINS` でこのサイトのオリジンだけを受け付ける。
ローカル確認は `http://localhost:8080` も許可済み。

# ローカル動作確認
- ポートは 8080 を使う事

# Git 運用ルール
- 特段の指示がない限り、変更作業は `feature/{適切な名前}` ブランチで実施する
  - ブランチ名は Claude Code が変更内容から適切な kebab-case で命名する（例: `feature/mod-services-content`, `feature/clean-dead-code`）
  - 既存ブランチ命名規則（`mod-` / `add-` / `clean-` などの動詞接頭辞）に揃える
- コミット後は origin にpushし、main へのPRを作成する

# Google Analytics 4
- 測定ID: G-R362SW6WBR
- 設置対象: 全ページ (index.html / 404.html / privacy.html / profiles/*)
- 設置方法: Jekyll の `_includes/google-analytics.html` に gtag スニペットを定義し、各HTMLの `<head>` 内（できるだけ上部）で `{% include google-analytics.html %}` により読み込む
