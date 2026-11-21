#!/usr/bin/env bash
set -euo pipefail

package=$(realpath -- "$1")
image="$2"
scripts=$(cd "$(dirname "$0")" && pwd)
engine=$(cd "$scripts/../../engine" && pwd)
test "$(dpkg-deb --field "$package" Architecture)" = amd64

docker run --rm -i --memory=6g --pids-limit=256 --security-opt=no-new-privileges \
  --mount "type=bind,src=$package,dst=/release/phonivra.deb,readonly" \
  --mount "type=bind,src=$scripts/smoke_runtime.py,dst=/test/apps/desktop/scripts/smoke_runtime.py,readonly" \
  --mount "type=bind,src=$engine/src/contract.json,dst=/test/apps/engine/src/contract.json,readonly" \
  --env DEBIAN_FRONTEND=noninteractive "$image" bash -se <<'BASH'
apt-get -qq update
apt-get -qq install --no-install-recommends /release/phonivra.deb >/tmp/install.log 2>&1 || {
  tail -60 /tmp/install.log
  exit 1
}
runtime=/opt/Phonivra/resources/engine
test "$(readlink -f /usr/bin/phonivra)" = /opt/Phonivra/phonivra
test -f /usr/share/applications/phonivra.desktop
for binary in /opt/Phonivra/phonivra "$runtime/media/ffmpeg" "$runtime/media/ffprobe"; do
  dependencies=$(ldd "$binary" 2>&1) || {
    printf '%s\n' "$dependencies"
    exit 1
  }
  if grep -F 'not found' <<< "$dependencies"; then
    exit 1
  fi
done

useradd -m phonivra-test
runuser -u phonivra-test -- "$runtime/python/bin/python3" -B \
  /test/apps/desktop/scripts/smoke_runtime.py "$runtime"
profile=/home/phonivra-test/.config/phonivra
runuser -u phonivra-test -- mkdir -p "$profile"
runuser -u phonivra-test -- touch "$profile/workspace-check"
apt-get -qq purge phonivra
test ! -e /usr/bin/phonivra
test ! -L /usr/bin/phonivra
test ! -e /opt/Phonivra/phonivra
test -e "$profile/workspace-check"
BASH
