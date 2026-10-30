#!/usr/bin/env bash
# MYRACLE setup for macOS: checks for Node.js, installs it if it is missing or too old,
# then installs the project's packages. Run it from the project folder:  bash setup.sh
set -euo pipefail

NEED_MAJOR=22                # @sveltejs/kit 3 needs Node 22.17 or newer
NEED_MINOR=17
NODE_LINE="latest-v24.x"     # the Node.js LTS line we install
NODE_DIST="https://nodejs.org/dist/$NODE_LINE"

cd "$(dirname "$0")"

say() { printf '\n\033[1m%s\033[0m\n' "$*"; }
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

install_node_mac() {
	local tmp pkg
	tmp=$(mktemp -d)
	trap "rm -rf '$tmp'" EXIT

	curl -fsSL "$NODE_DIST/SHASUMS256.txt" -o "$tmp/SHASUMS256.txt" ||
		fail "Could not reach nodejs.org. Check your internet connection and try again."
	pkg=$(awk '/\.pkg$/ { print $2 }' "$tmp/SHASUMS256.txt")
	[ -n "$pkg" ] || fail "Could not find the Node.js installer on nodejs.org."

	say "Downloading $pkg ..."
	curl -fL --progress-bar "$NODE_DIST/$pkg" -o "$tmp/$pkg"

	# Make sure the download is exactly the file nodejs.org published.
	(cd "$tmp" && grep " $pkg\$" SHASUMS256.txt | shasum -a 256 -c - >/dev/null) ||
		fail "The download did not match its checksum. Run the script again."

	say "Installing Node.js. macOS will ask for your Mac password."
	sudo installer -pkg "$tmp/$pkg" -target / ||
		fail "Node.js was not installed. Installing needs an admin password on this Mac. Ask whoever set up the Mac, then run the script again."
	export PATH="/usr/local/bin:$PATH"
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
	case "$(uname -s)" in
	Darwin) install_node_mac ;;
	*) fail "This script installs Node.js on macOS only. Install Node.js 24 LTS from https://nodejs.org, then run it again." ;;
	esac
	node_ok || fail "Node.js was installed but is not on your PATH yet. Close this Terminal window, open a new one and run: bash setup.sh"
	echo "Installed Node.js $(node -v)."

	# The new Node.js is in /usr/local/bin. An older one from Homebrew or nvm can still come
	# first in new Terminal windows, and then `npm run dev` fails.
	if [ -n "$old_node" ] && [ "$old_node" != /usr/local/bin/node ]; then
		printf '\n\033[33m%s\n%s\n%s\033[0m\n' \
			"Heads up: an older Node.js is still at $old_node and new Terminal windows may use it." \
			"If it came from Homebrew, run: brew upgrade node.  If it came from nvm, run: nvm install 24 && nvm alias default 24." \
			"Or remove it. This window already uses the new one."
	fi
fi

say "Installing the project's packages ..."
# npm ci installs exactly what package-lock.json lists, so everyone gets the same versions.
npm ci || fail "Installing packages failed. Read the messages above, or ask in the team chat."

say "All set. To start MYRACLE any time:  npm run dev"

if [ -t 0 ]; then
	read -r -p "Start it now? [Y/n] " answer
	case "${answer:-y}" in
	[Yy]*) exec npm run dev -- --open ;;
	esac
fi
