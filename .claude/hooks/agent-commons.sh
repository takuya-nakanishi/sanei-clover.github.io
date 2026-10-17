#!/usr/bin/env bash
# クラウドのセッション(Surface が使えないときの予備)の入口。各リポジトリの .claude/hooks/ に同じものを置く。
# 正本は agent-commons の templates/cloud-hook/agent-commons.sh。全リポジトリで同じかは host/cloud/check-entry.sh で見る。
#
# この入口は「隣の agent-commons を用意して、本体(host/cloud/session-hook.sh)へ渡す」だけ。処理を直すときは本体を直し、
# 入口は変えない(クラウドは開くたびに最新の agent-commons を clone するので、本体の修正はそのまま届く)。
# agent-commons を用意できなかったときだけ、入口が最低限の警告を出す(本体が無いので)。
#
# .claude/settings.json の SessionStart と UserPromptSubmit から呼ぶ(templates/cloud-hook/settings-snippet.json)。
# 手元(Surface・Mac)は CLAUDE_CODE_REMOTE が無いので何もしない。
[ "${CLAUDE_CODE_REMOTE:-}" = true ] || exit 0

INPUT=$(cat)
EVENT=$(printf '%s' "$INPUT" | sed -n 's/.*"hook_event_name" *: *"\([A-Za-z]*\)".*/\1/p')

# agent-commons はこのリポジトリの隣に置く。worktree の中では本体の clone の隣を見る(.git の共通ディレクトリの親が本体)
ROOT=${CLAUDE_PROJECT_DIR:-$PWD}
COMMON=$(git -C "$ROOT" rev-parse --path-format=absolute --git-common-dir 2>/dev/null) && ROOT=$(dirname "$COMMON")
DIR=${AGENT_COMMONS:-$(dirname "$ROOT")/agent-commons}
BODY=$DIR/host/cloud/session-hook.sh

if [ ! -f "$BODY" ]; then
  [ "$EVENT" = SessionStart ] || exit 0   # 依頼のたびには取りに行かない。開始時に警告済み
  if [ ! -e "$DIR/.git" ]; then           # worktree なら .git はファイル
    git clone -q --depth 1 https://github.com/takuya-nakanishi/agent-commons.git "$DIR" >/dev/null 2>&1
  fi
  if [ ! -f "$BODY" ]; then
    MSG='⚠ クラウドのセッションです。agent-commons を取得できなかったので、共通の規約・skill(questions-jobs など)・agent-commons のプラグインはどれも効いていません。'
    CTX='この環境はクラウド(CLAUDE_CODE_REMOTE=true)で、agent-commons を取得できなかった。全体共通の規約・skill・agent-commons のプラグイン(codex-review・notify・ask-llm・session-digest)は読み込まれていない。それらや、規約で Surface(ローカルPC)でしかできないとされている作業を求められたら、実行も代わりの実装も試みず、Surface が使えるようになってから行うよう先に伝える。'
    printf '{"systemMessage":"%s","hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"%s"}}\n' "$MSG" "$CTX"
    exit 0
  fi
fi

printf '%s' "$INPUT" | AGENT_COMMONS_DIR=$DIR bash "$BODY"
exit 0
