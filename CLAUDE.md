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
