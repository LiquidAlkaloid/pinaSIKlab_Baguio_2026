#!/usr/bin/env bash
# MYRACLE setup for macOS (and Linux): checks for Node.js, installs it if it is missing or too
# old, then installs the project's packages. Run it from the project folder:  bash setup.sh
# Node.js is installed for this user only, in ~/.myracle/node, so no admin password is needed.
set -euo pipefail

NEED_MAJOR=22                # @sveltejs/kit 3 needs Node 22.17 or newer
NEED_MINOR=17
NODE_DIST="https://nodejs.org/dist/latest-v24.x"   # the Node.js LTS line we install
NODE_ROOT="$HOME/.myracle"
NODE_HOME="$NODE_ROOT/node"  # always points at the version we installed last
PATH_LINE='export PATH="$HOME/.myracle/node/bin:$PATH"  # MYRACLE: Node.js'

cd "$(dirname "$0")"

say() { printf '\n\033[1m%s\033[0m\n' "$*"; }
warn() { printf '\033[33m%s\033[0m\n' "$@"; }
fail() { printf '\n\033[31m%s\033[0m\n' "$*" >&2; exit 1; }

node_ok() {
	command -v node >/dev/null 2>&1 || return 1
	local v major rest minor
	v=$(node -p 'process.versions.node' 2>/dev/null) || return 1
	major=${v%%.*}
	rest=${v#*.}
	minor=${rest%%.*}
	((major > NEED_MAJOR || (major == NEED_MAJOR && minor >= NEED_MINOR)))
}

# Add Node.js to the PATH of every new Terminal window, once.
add_to_profiles() {
	local profiles=()
	case "$(uname -s)" in
	Darwin) profiles=("$HOME/.zprofile") ;;
	*) profiles=("$HOME/.profile") ;;
	esac
	# bash users get it too
	if [ -f "$HOME/.bash_profile" ] || [[ "${SHELL:-}" == */bash ]]; then profiles+=("$HOME/.bash_profile"); fi
	for f in "${profiles[@]}"; do
		touch "$f"
		grep -qF '.myracle/node/bin' "$f" || printf '\n%s\n' "$PATH_LINE" >>"$f"
	done
}

install_node_user() {
	local os arch tmp file dir
	case "$(uname -s)" in
	Darwin) os=darwin ;;
	Linux) os=linux ;;
	*) fail "Unknown system. Install Node.js 24 LTS from https://nodejs.org, then run this again." ;;
	esac
	case "$(uname -m)" in
	arm64 | aarch64) arch=arm64 ;;
	x86_64) arch=x64 ;;
	*) fail "Unknown processor $(uname -m). Install Node.js 24 LTS from https://nodejs.org, then run this again." ;;
	esac

	tmp=$(mktemp -d)
	trap "rm -rf '$tmp'" EXIT

	curl -fsSL "$NODE_DIST/SHASUMS256.txt" -o "$tmp/SHASUMS256.txt" ||
		fail "Could not reach nodejs.org. Check your internet connection and try again."
	file=$(grep -E " node-v[0-9.]+-$os-$arch\.tar\.gz\$" "$tmp/SHASUMS256.txt" | awk '{ print $2 }')
	[ -n "$file" ] || fail "Could not find Node.js for $os-$arch on nodejs.org."

	say "Downloading $file ..."
	curl -fL --progress-bar "$NODE_DIST/$file" -o "$tmp/$file"

	# Make sure the download is exactly the file nodejs.org published.
	(cd "$tmp" && grep " $file\$" SHASUMS256.txt | shasum -a 256 -c - >/dev/null) ||
		fail "The download did not match its checksum. Run the script again."

	say "Installing Node.js in $NODE_HOME (just for you, no password needed) ..."
	mkdir -p "$NODE_ROOT"
	tar -xzf "$tmp/$file" -C "$NODE_ROOT"
	dir="$NODE_ROOT/${file%.tar.gz}"
	ln -sfn "$dir" "$NODE_HOME"
	# Remove versions installed by earlier runs.
	find "$NODE_ROOT" -maxdepth 1 -name 'node-v*' ! -path "$dir" -exec rm -rf {} +

	add_to_profiles
	export PATH="$NODE_HOME/bin:$PATH"
	hash -r
}

say "Checking for Node.js ..."
if node_ok; then
	echo "Found Node.js $(node -v). Good."
else
	old_node=$(command -v node || true)
	if [ -n "$old_node" ]; then
		echo "Found Node.js $(node -v) at $old_node, but MYRACLE needs $NEED_MAJOR.$NEED_MINOR or newer."
	else
		echo "Node.js is not installed."
	fi
	install_node_user
	node_ok || fail "Node.js was installed but does not run. Close this Terminal window, open a new one and run: bash setup.sh"
	echo "Installed Node.js $(node -v)."

	# An older Node.js from Homebrew or nvm can still come first in new Terminal windows
	# (nvm loads after ~/.zprofile), and then `npm run dev` fails.
	if [ -n "$old_node" ] && [ "$old_node" != "$NODE_HOME/bin/node" ]; then
		echo
		warn "Heads up: an older Node.js is still at $old_node and new Terminal windows may use it." \
			"If it came from Homebrew, run: brew upgrade node.  If it came from nvm, run: nvm install 24 && nvm alias default 24." \
			"Or remove it. This window already uses the new one."
	fi
fi

say "Installing the project's packages ..."
# npm ci installs exactly what package-lock.json lists, so everyone gets the same versions.
npm ci || fail "Installing packages failed. Read the messages above, or ask in the team chat."

say "All set. To start MYRACLE any time, open a NEW Terminal window in this folder and run:  npm run dev"
echo "(If you use VS Code, restart it once so its terminal finds Node.js.)"

if [ -t 0 ]; then
	read -r -p "Start it now? [Y/n] " answer
	case "${answer:-y}" in
	[Yy]*) exec npm run dev -- --open ;;
	esac
fi
