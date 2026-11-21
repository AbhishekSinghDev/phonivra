#!/usr/bin/env bash
# Build local-audio FFmpeg tools from checksum-pinned source archives.
set -euo pipefail

target="$1"
mkdir -p "$2"
output=$(cd "$2" && pwd)
recipe=$(cd "$(dirname "$0")" && pwd)/build_media.sh
scratch=$(mktemp -d)
trap 'rm -rf "$scratch"' EXIT
cd "$scratch"
mkdir archives prefix bundle
prefix="$scratch/prefix"
export PKG_CONFIG_PATH="$prefix/lib/pkgconfig${PKG_CONFIG_PATH:+:$PKG_CONFIG_PATH}"
jobs=$(getconf _NPROCESSORS_ONLN 2>/dev/null || printf '2')
export MAKEFLAGS="-j$jobs"

digest() {
  if command -v sha256sum >/dev/null; then sha256sum "$1"; else shasum -a 256 "$1"; fi
}

fetch() {
  local name="$1" url="$2" expected="$3" checksum
  curl --fail --silent --show-error --location --proto '=https' \
    --connect-timeout 20 --max-time 180 --retry 3 --output "archives/$name" "$url"
  checksum=$(digest "archives/$name")
  if [[ "${checksum%% *}" != "$expected" ]]; then
    printf 'Invalid source checksum for %s\n' "$name" >&2
    exit 1
  fi
  printf '%s  %s  %s\n' "$expected" "$name" "$url" >> archives/SOURCE-DIGESTS.txt
  tar -xf "archives/$name"
}

host_flag=
platform_flags=()
suffix=
case "$target:$(uname -s):$(uname -m)" in
  linux-x64:Linux:x86_64)
    platform_flags+=(--enable-libpulse)
    ;;
  mac-arm64:Darwin:arm64)
    export MACOSX_DEPLOYMENT_TARGET=14.0
    platform_flags+=(--enable-avfoundation --enable-indev=avfoundation)
    ;;
  win-x64:MINGW64*:x86_64)
    host_flag=--host=x86_64-w64-mingw32
    platform_flags+=(--target-os=mingw32 --arch=x86_64 --disable-pthreads --extra-ldflags=-static-libgcc)
    suffix=.exe
    ;;
  *)
    printf 'Build %s from its native platform. On Windows, use the MSYS2 MINGW64 shell.\n' "$target" >&2
    exit 1
    ;;
esac

fetch ffmpeg-9.0.2.tar.xz https://ffmpeg.org/releases/ffmpeg-9.0.2.tar.xz \
  8c3850283eb25fa026482078a04051e0be17347b09ef81a0849bec15a96e002e
fetch libogg-1.3.6.tar.xz https://downloads.xiph.org/releases/ogg/libogg-1.3.6.tar.xz \
  5c8253428e181840cd20d41f3ca16557a9cc04bad4a3d04cce84808677fa1061
fetch libvorbis-1.3.7.tar.xz https://downloads.xiph.org/releases/vorbis/libvorbis-1.3.7.tar.xz \
  b33cc4934322bcbf6efcbacf49e3ca01aadbea4114ec9589d1b1e9d20f72954b
fetch lame-4.0.tar.gz https://downloads.sourceforge.net/project/lame/lame/4.0/lame-4.0.tar.gz \
  3df5124d5ad3a98312ffd7ba6a9b36230e4f8a3e66d3ce0f425e336c32d216eb

# The Xiph and LAME libraries travel inside the media executables. FFmpeg links
# Linux PulseAudio from the OS, and the native media frameworks on macOS and Windows.
build_library() (
  cd "$1"
  shift
  ./configure ${host_flag:+"$host_flag"} --prefix="$prefix" --disable-shared --enable-static "$@"
  make
  make install
)
build_library libogg-1.3.6
if [[ "$target" == mac-arm64 ]]; then
  # Vorbis 1.3.7 adds an obsolete Darwin linker option to its compiler flags.
  sed -i.bak 's/ -force_cpusubtype_ALL//g' libvorbis-1.3.7/configure
fi
build_library libvorbis-1.3.7 --with-ogg="$prefix"
build_library lame-4.0 --disable-frontend --disable-decoder

(
  cd ffmpeg-9.0.2
  ./configure --disable-autodetect --disable-network --disable-doc --disable-debug \
    --disable-ffplay --disable-x86asm --enable-static --disable-shared \
    --pkg-config-flags=--static --enable-libmp3lame --enable-libvorbis \
    --extra-cflags="-I$prefix/include" --extra-ldflags="-L$prefix/lib" \
    "${platform_flags[@]}" || { tail -n 40 ffbuild/config.log >&2; exit 1; }
  if [[ "$target" == mac-arm64 ]] && ! grep -qx 'CONFIG_AVFOUNDATION_INDEV=yes' ffbuild/config.mak; then
    echo 'FFmpeg could not configure AVFoundation recording.' >&2
    tail -n 40 ffbuild/config.log >&2
    exit 1
  fi
  make "ffmpeg$suffix" "ffprobe$suffix"
)
cp "ffmpeg-9.0.2/ffmpeg$suffix" "ffmpeg-9.0.2/ffprobe$suffix" bundle/
cp "$recipe" archives/
cp ffmpeg-9.0.2/config.h ffmpeg-9.0.2/ffbuild/config.mak archives/
{
  printf 'FFmpeg media tools for Phonivra (%s)\n\n' "$target"
  printf 'Corresponding source, build script and configuration: ffmpeg-%s-sources.tar.xz\n\n' "$target"
  cat archives/SOURCE-DIGESTS.txt
  printf '\n'
  "bundle/ffmpeg$suffix" -version
  printf '\nFFmpeg LGPL license\n'
  cat ffmpeg-9.0.2/COPYING.LGPLv2.1
  printf '\nLAME license\n'
  cat lame-4.0/COPYING
  printf '\nXiph libogg license\n'
  cat libogg-1.3.6/COPYING
  printf '\nXiph libvorbis license\n'
  cat libvorbis-1.3.7/COPYING
} > bundle/THIRD-PARTY-NOTICES.txt

tar -cJf "ffmpeg-$target-sources.tar.xz" -C archives .
(cd bundle && zip -q "../ffmpeg-$target.zip" "ffmpeg$suffix" "ffprobe$suffix" THIRD-PARTY-NOTICES.txt)
digest "ffmpeg-$target.zip" > "ffmpeg-$target.sha256"
mv "ffmpeg-$target-sources.tar.xz" "ffmpeg-$target.zip" "ffmpeg-$target.sha256" "$output/"
