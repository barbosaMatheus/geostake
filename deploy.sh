#!/usr/bin/env bash
#
# deploy.sh - Build, upload, and (re)deploy GeoStake onto a remote host on
# your local network. The production image is built on the remote host and
# served as a single Docker container.
#
# Usage:
#   ./deploy.sh                        # prompts for IP and install location
#   ./deploy.sh 192.168.0.208          # uses given IP, prompts for location
#   ./deploy.sh 192.168.0.208 /opt/geostake
#
# Optionally installs a systemd unit on the remote host so the app starts
# when the host's network comes up (e.g. after a reboot):
#   ./deploy.sh --systemd 192.168.0.208 /opt/geostake  # install unit
#   ./deploy.sh --no-systemd ...                       # never install
#   ./deploy.sh ...                # when neither flag is given, you are prompted
#
# Auth: the sudo password for the remote host is read from HOST_PWD
# (from a local .env file or an exported environment variable). Passwords are
# never stored on the remote; the password only authenticates the sudo session.
#
# The app is exposed on GEOSTAKE_PORT (default 8888). The Docker image listens
# on port 8080 internally (nginx-unprivileged), so the host mapping is always
# ${GEOSTAKE_PORT}:8080.
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ARCHIVE="/tmp/geostake-upload.tar.gz"

# --- Options -------------------------------------------------------------
# INSTALL_SYSTEMD: ask | yes | no
INSTALL_SYSTEMD="ask"
POSITIONAL_ARGS=()

for arg in "$@"; do
    case "$arg" in
        --systemd) INSTALL_SYSTEMD="yes" ;;
        --no-systemd) INSTALL_SYSTEMD="no" ;;
        --help|-h)
            echo "Usage: $0 [--systemd|--no-systemd] [HOST_IP [INSTALL_DIR]]"
            echo
            echo "  --systemd     install a systemd unit so the app starts on network start"
            echo "  --no-systemd  do not install the systemd unit"
            exit 0
            ;;
        -*)
            echo "Error: unknown option: $arg" >&2
            exit 1
            ;;
        *) POSITIONAL_ARGS+=("$arg") ;;
    esac
done

# --- Load sudo password from env vars ------------------------------------
if [[ -f "$SCRIPT_DIR/.env" ]]; then
    # shellcheck disable=SC1091
    source "$SCRIPT_DIR/.env"
fi
HOST_PWD="${HOST_PWD:-}"
if [[ -z "$HOST_PWD" ]]; then
    echo "Error: HOST_PWD not set in .env or env vars. Cannot authenticate sudo on the remote host." >&2
    exit 1
fi

GEOSTAKE_PORT="${GEOSTAKE_PORT:-8888}"

# --- Prompts -------------------------------------------------------------
if [[ ${#POSITIONAL_ARGS[@]} -ge 1 ]]; then
    HOST_IP="${POSITIONAL_ARGS[0]}"
else
    read -rp "Remote host IP (e.g. 192.168.0.208): " HOST_IP
fi

if [[ ${#POSITIONAL_ARGS[@]} -ge 2 ]]; then
    INSTALL_DIR="${POSITIONAL_ARGS[1]}"
else
    read -rp "Install location on the host (e.g. /opt/geostake): " INSTALL_DIR
fi

read -rp "SSH user for ${HOST_IP} (default: $(whoami)): " SSH_USER
SSH_USER="${SSH_USER:-$(whoami)}"

if [[ -z "${HOST_IP}" || -z "${INSTALL_DIR}" ]]; then
    echo "Error: IP and install location are required." >&2
    exit 1
fi

SSH_TARGET="${SSH_USER}@${HOST_IP}"

if [[ "$INSTALL_SYSTEMD" == "ask" ]]; then
    read -rp "Install a systemd unit to start the app when the network comes up? [y/N] " SYSTEMD_ANSWER
    case "$SYSTEMD_ANSWER" in
        y|Y|yes|Yes|YES) INSTALL_SYSTEMD="yes" ;;
        *) INSTALL_SYSTEMD="no" ;;
    esac
fi

echo "----"
echo "Deploying to: ${SSH_TARGET}:${INSTALL_DIR}"
if [[ "$INSTALL_SYSTEMD" == "yes" ]]; then
    echo "Systemd auto-start: yes"
else
    echo "Systemd auto-start: no"
fi
echo "----"

# --- Package the app code ------------------------------------------------
echo "Packaging app..."
tar -czf "$ARCHIVE" \
    --exclude='.git' \
    --exclude='.env' \
    --exclude='*/node_modules*' \
    --exclude='dist' \
    --exclude='.DS_Store' \
    -C "$SCRIPT_DIR" \
    ./*

# --- Upload the archive --------------------------------------------------
echo "Uploading archive..."
scp "$ARCHIVE" "${SSH_TARGET}:/tmp/geostake-upload.tar.gz"

# --- Deploy on the remote host --------------------------------------------
# Runs on the remote host: creates the install dir, extracts the archive,
# builds the production Docker image there, then starts the app. When
# --systemd was chosen, a start script and a systemd service (ordered after
# network-online.target) are installed so the app starts on network start.
ssh "$SSH_TARGET" "bash -s" <<REMOTE
set -euo pipefail
echo "$HOST_PWD" | sudo -S -v
echo "$HOST_PWD" | sudo -S mkdir -p "$INSTALL_DIR"
echo "$HOST_PWD" | sudo -S tar -xzf /tmp/geostake-upload.tar.gz -C "$INSTALL_DIR"
cd "$INSTALL_DIR"

echo "Building production image..."
echo "$HOST_PWD" | sudo -S docker build --tag geostake .

# Start script: replaces the container in place so re-deploys never fail with
# a "container name already in use" error; --restart brings it back if it
# crashes. The port is baked in because \$INSTALL_DIR and \$GEOSTAKE_PORT are
# expanded on the deploy host when this script is uploaded.
echo "$HOST_PWD" | sudo -S tee "$INSTALL_DIR/start.sh" > /dev/null <<'START_SCRIPT'
#!/usr/bin/env bash
set -euo pipefail
cd "$INSTALL_DIR"
docker rm --force geostake 2>/dev/null || true
docker run --detach --restart unless-stopped --name geostake --publish "${GEOSTAKE_PORT}:8080" geostake
START_SCRIPT
echo "$HOST_PWD" | sudo -S chmod +x "$INSTALL_DIR/start.sh"

if [[ "$INSTALL_SYSTEMD" == "yes" ]]; then
    # --- Systemd unit: start the app once the network is up --------------
    echo "$HOST_PWD" | sudo -S tee /etc/systemd/system/geostake.service > /dev/null <<SYSTEMD_UNIT
[Unit]
Description=GeoStake App (docker)
Requires=docker.service
Wants=network-online.target
After=network-online.target docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$INSTALL_DIR
ExecStart=$INSTALL_DIR/start.sh
TimeoutStartSec=1200

[Install]
WantedBy=multi-user.target
SYSTEMD_UNIT
    echo "$HOST_PWD" | sudo -S systemctl daemon-reload
    echo "$HOST_PWD" | sudo -S systemctl enable --now geostake.service
else
    echo "$HOST_PWD" | sudo -S "$INSTALL_DIR/start.sh"
fi
REMOTE

echo "----"
echo "Deploy complete. Open http://${HOST_IP}:${GEOSTAKE_PORT} on any machine on your network."
if [[ "$INSTALL_SYSTEMD" == "yes" ]]; then
    echo "A systemd unit 'geostake.service' is enabled and will start the app on network start."
fi
echo "----"