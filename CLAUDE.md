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
- Agent Workspace 紹介 (agent-workspace.html → `/products/agent-workspace/`)。Google OAuth 同意画面
  (GCP `citric-earth-449901-e7`)の「アプリケーションのホームページ」に登録するページ。審査要件のため
  アプリ名「Agent Workspace」の表記・`/privacy.html#google-user-data` への導線・`noindex` 無しを維持すること

## Web問合せフォーム

送信先は自作 CRM「Works」(`perfect-crm`)の Web フォームの受け口。認証なしで受け、
「リード」テーブルへ 1 件のレコードとして直に登録する。
**2026-10-05 に Cloudflare Worker(`sc-products/apps/web-to-notion-cloudflare`。Notion の
「プロスペクト」DB へ登録し Slack へ通知)から移した。**その前は 2026-08-27 まで Salesforce Web-to-Lead。
**旧 Worker が送っていた Slack への通知は、この切り替えで止まった。**通知が要るなら Works 側
(リードの作成時に Slack へ送るワークフロー)で用意する。

### POST先:
https://works.sanei-clover.com/api/v1/forms/bqe28tu44p

URL の末尾は Works の環境設定 → Web フォームの「鍵」。漏れて悪用されたら Works で鍵を作り直し、
ここの `action` を差し替える(古い URL は 404 になる)。

### フォームパラメータ
**name 属性は Works の「リード」の列名そのもの。**Works は受け付ける列(フォームの定義の「受け付ける項目」)に
無い名前を黙って捨てるので、名前を変えたら値が消える。列名は Works の MCP の `list_tables` で確かめられる。

| 欄 | name 属性 | Works の項目 |
|---|---|---|
| 会社名 / Company | `company` | 会社名 |
| 氏名 / Name | `name` | 名前(**姓名の分割は不要**) |
| メール / Email | `email` | メール |
| 電話 / Phone | `phone` | 電話 |
| ご相談内容 / Message | `description` | 内容 |
| (隠し欄) | `lead_source` | リードソース。`type="hidden"` で値は `homepage`(選択肢「ホームページ」の**値**。ラベルではない) |
| (隠し欄) | `_gotcha` | 自動投稿よけ。**人には見せない**。値が入っていると Works は何も登録せず、成功に見せかけた 200 を返す |

リードソースはこのフォームが送る(Works の既定値には入れていない。2026-10-05 本人の決定)。
Works の「リードソース」に無い値を送ると、登録全体が 400 で失敗する。値を変えるときは、先に Works に選択肢を足す。

### 送信方式
`fetch()` で `Accept: application/json` を付けて送り、成功なら作ったレコード(`{"record": …}`)、
失敗なら `{code, message}` が返る。Works は受け口の応答に `Access-Control-Allow-Origin: *` を付けている
(perfect-crm `docs/design/04-api.md` §10 の 7)ので、どのオリジン(ローカル確認の `http://localhost:8080` を含む)からも読める。
以前の非表示iframe方式は、iframeのloadイベントが「何かが読み込まれた」ことしか
示さず**送信の成否を区別できなかった**ため廃止した。
失敗時は電話番号を添えて案内する(黙って飲み込まない)。
同じ受け口・送り元(IP)から 1 分に 10 件を超えると 429 になる。

**ローカル確認でも本番の Works に登録される。**試し送りで作ったリードは Works の画面から消すこと。

## 共通ヘッダ・フッタ
`_includes/header.html` / `_includes/footer.html` を各ページで `{% include %}` する(Jekyllがビルド時に埋め込む)。
**以前のクライアント側 `fetch("/includes/…")` 方式は2026-09-07に廃止した。**断片HTMLが単体で200を返す
公開URLになり、Googleに重複・薄いページとして拾われうるため。`site.js` は `</body>` 直前で読み込む。

# 検索エンジン対応(2026-09-07 Search Console の指摘を受けて導入)
- **canonical**: 全ページの `<head>` に `<link rel="canonical" href="{{ page.url | absolute_url }}">`。
  `/` と `/index.html`、`/privacy` と `/privacy.html` のように同じ内容が複数URLで200を返すため、
  正規URLを明示しないとGoogleが勝手に選ぶ(「重複しています。ユーザーにより正規ページとして選択されていません」の原因)
- **sitemap.xml / robots.txt**: `jekyll-sitemap` が自動生成。`404.html` は front matter の `sitemap: false` と
  `<meta name="robots" content="noindex">` で除外(`/404.html` 自体は200で配信されるため)
- **旧URLの転送**: 削除・改名したページは `jekyll-redirect-from` の `redirect_from` を移行先ページの front matter に
  書く(GitHub Pagesはサーバ側301が使えないため、meta refresh + canonical の転送ページを生成する)。
  ページを消すときは必ず移行先へ `redirect_from` を追加すること
- 使用プラグインは GitHub Pages が公式サポートするものに限る(`_config.yml` の `plugins`)

# ローカル動作確認
- ポートは 8080 を使う事
- 本番と同じ条件でビルドするには GitHub Pages 公式イメージを使う(Ruby/Jekyll のローカル導入は不要):
  ```
  docker run --rm -v "$PWD":/github/workspace -w /github/workspace -e GITHUB_WORKSPACE=/github/workspace \
    -e GITHUB_REPOSITORY=sanei-clover/sanei-clover.github.io -e PAGES_REPO_NWO=sanei-clover/sanei-clover.github.io \
    -e INPUT_SOURCE=. -e INPUT_DESTINATION=./_site -e INPUT_FUTURE=false -e INPUT_BUILD_REVISION= \
    -e INPUT_VERBOSE=false -e INPUT_TOKEN="$(gh auth token)" -e JEKYLL_ENV=production \
    ghcr.io/actions/jekyll-build-pages:v1.0.13
  ```
  生成物 `_site/` は root 所有になる。`.gitignore` 済みだが、消すときは `sudo` か alpine コンテナ経由で `rm -rf`

# セッション運用
- セッションは本リポジトリのディレクトリで起こす。セッション名は `.env` の `REPO_SLUG`(= `schp`)を使って
  `schp-{キーワード}` とし、どのリポジトリのセッションか一目で分かるようにする(他リポジトリと同じ規約)

# Git 運用ルール
- 特段の指示がない限り、変更作業は `feature/{適切な名前}` ブランチで実施する
  - ブランチ名は Claude Code が変更内容から適切な kebab-case で命名する（例: `feature/mod-services-content`, `feature/clean-dead-code`）
  - 既存ブランチ命名規則（`mod-` / `add-` / `clean-` などの動詞接頭辞）に揃える
- コミット後は origin にpushし、main へのPRを作成する

# Google Analytics 4
- 測定ID: G-R362SW6WBR
- 設置対象: 全ページ (index.html / 404.html / privacy.html / profiles/*)
- 設置方法: Jekyll の `_includes/google-analytics.html` に gtag スニペットを定義し、各HTMLの `<head>` 内（できるだけ上部）で `{% include google-analytics.html %}` により読み込む
