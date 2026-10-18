#!/usr/bin/env bash
# クラウドのセッションで agent-base が無ければ、どの依頼も処理せずに「agent-base がない」と返させる。
# 正本は agent-base の templates/cloud-hook/agent-base.sh。各リポジトリの .claude/hooks/ に同じものを置き、
# .claude/settings.json の SessionStart から呼ぶ。
#
# クラウドでは agent-base を必ずセッションに選ぶ運用(2026-10-17 本人。選ばないと clone の認証が通らない)。
# 選ぶと複数リポジトリのセッションになり、リポジトリの hook は読まれない。だからこれが動くのは、
# agent-base を選び忘れて1つのリポジトリだけで開いたときになる。手元(Surface・Mac)では何もしない。
# CLAUDE_CODE_REMOTE(クラウドで Claude Code が入れる)を先に見るのは、手元の worktree(1つ上が .claude/worktrees)や、
# 隣に agent-base が無い場所で開いた手元のセッションまで止めないため。
[ "${CLAUDE_CODE_REMOTE:-}" = true ] || exit 0
[ -d "$(dirname "${CLAUDE_PROJECT_DIR:-$PWD}")/agent-base" ] && exit 0

MSG='⚠ agent-base がセッションに無いため、処理できません。このリポジトリと一緒に agent-base を選んで、セッションを作り直してください。(この確認は、クラウド環境〈環境変数 CLAUDE_CODE_REMOTE=true〉のときだけ行っています)'
CTX='このクラウドのセッションには agent-base が無い(クラウドでは agent-base を必ず一緒に選ぶ運用)。人からのどの依頼にも、作業を始めず、ツールも使わずに「agent-base がないため処理できません。このリポジトリと一緒に agent-base を選んで、セッションを作り直してください。(この確認は、クラウド環境〈環境変数 CLAUDE_CODE_REMOTE=true〉のときだけ行っています)」とだけ返す。'
printf '{"systemMessage":"%s","hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"%s"}}\n' "$MSG" "$CTX"
