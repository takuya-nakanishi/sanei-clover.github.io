#!/usr/bin/env bash
# クラウドのセッションで ~/.claude の共通の規約とスキル(agent-commons host/global)を揃える。agent-commons J-007。
# 手元(Surface)は install.sh のリンクが既にあるので何もしない。
# 標準出力はセッションの文脈に入るので、成功したときは何も出さない。失敗してもセッションは止めない。
[ "${CLAUDE_CODE_REMOTE:-}" = true ] || exit 0
DIR=${AGENT_COMMONS:-$HOME/workspace/agent-commons}
if [ -d "$DIR/.git" ]; then
  git -C "$DIR" pull -q --ff-only >/dev/null 2>&1 || true
else
  git clone -q --depth 1 https://github.com/takuya-nakanishi/agent-commons.git "$DIR" >/dev/null 2>&1 \
    || { echo "agent-commons を clone できなかった。共通の規約とスキル(questions-jobs 等)はこのセッションでは効いていない"; exit 0; }
fi
bash "$DIR/host/global/install.sh" >/dev/null 2>&1 \
  || echo "agent-commons の install.sh が失敗した。共通の規約とスキルはこのセッションでは効いていない"
exit 0
