#!/usr/bin/env bash
# クラウドのセッションで ~/.claude の共通の規約とスキル(agent-commons host/global)を揃える。agent-commons J0007。
# 手元(Surface・Mac など)は install.sh のリンクが既にあるので何もしない。
# agent-commons は、このリポジトリと同じディレクトリに置く(リポジトリは並べて clone する。agent-commons J0012)。
# クラウドでは /home/user/<リポジトリ> の隣になる。セッションに agent-commons が入っていれば、それをそのまま使う
# (pull しない。セッションの作業ブランチを動かさないため)。
# 標準出力はセッションの文脈に入るので、成功したときは何も出さない。失敗してもセッションは止めない。
[ "${CLAUDE_CODE_REMOTE:-}" = true ] || exit 0
DIR=${AGENT_COMMONS:-$(dirname "${CLAUDE_PROJECT_DIR:-$PWD}")/agent-commons}
if [ ! -e "$DIR/.git" ]; then   # worktree なら .git はファイル
  git clone -q --depth 1 https://github.com/takuya-nakanishi/agent-commons.git "$DIR" >/dev/null 2>&1 \
    || { echo "agent-commons を clone できなかった。共通の規約とスキル(questions-jobs 等)はこのセッションでは効いていない"; exit 0; }
fi
bash "$DIR/host/global/install.sh" >/dev/null 2>&1 \
  || echo "agent-commons の install.sh が失敗した。共通の規約とスキルはこのセッションでは効いていない"
exit 0
