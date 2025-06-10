#!/bin/bash

set -euo pipefail

# === CONFIGURATION ===
LIVEKIT_DIR="/opt/livekit"
DOCKER_BIN_DIR="$LIVEKIT_DIR/docker-binaries"
NFS_MOUNT="/mnt/livekit-nfs"
AUDIT_RULES_FILE="/etc/audit/rules.d/docker.rules"

echo "[INFO] Starting security-hardened LiveKit deployment..."

# -----------------------------------------------------------------------------
# 1. SECURITY HARDENING SETUP (SELinux, auditd, permissions)
# -----------------------------------------------------------------------------

echo "[INFO] Enforcing SELinux mode..."
sudo setenforce 1
sudo sed -i 's/^SELINUX=.*/SELINUX=enforcing/' /etc/selinux/config

echo "[INFO] Enabling SELinux booleans for NFS and host networking..."
sudo setsebool -P container_use_nfs on
sudo setsebool -P container_use_hostnet on

echo "[INFO] Installing SELinux utilities..."
sudo dnf install -y policycoreutils policycoreutils-python-utils

echo "[INFO] Labeling LiveKit and NFS directories for container access..."
sudo semanage fcontext -a -t container_file_t "$LIVEKIT_DIR(/.*)?"
sudo semanage fcontext -a -t container_file_t "$NFS_MOUNT(/.*)?"
sudo restorecon -Rv "$LIVEKIT_DIR"
sudo restorecon -Rv "$NFS_MOUNT"

echo "[INFO] Setting secure ownership and permissions on LiveKit directory..."
sudo chown -R root:root "$LIVEKIT_DIR"
sudo chmod -R go-rwx "$LIVEKIT_DIR"

echo "[INFO] Adding Docker-related audit rules..."
sudo tee "$AUDIT_RULES_FILE" <<'EOF'
-w /var/lib/docker/ -p wa -k docker_varlib
-w /etc/docker/ -p wa -k docker_etc
-w /etc/docker/daemon.json -p wa -k docker_daemon_json
-w /etc/sysconfig/docker -p wa -k docker_sysconfig
-w /etc/default/docker -p wa -k docker_default
-w /usr/bin/containerd -p x -k docker_containerd
-w /usr/sbin/runc -p x -k docker_runc
-w /lib/systemd/system/docker.service -p wa -k docker_service
-w /lib/systemd/system/docker.socket -p wa -k docker_socket
-w /usr/bin/dockerd -p x -k docker_daemon
-w /var/run/docker.sock -p wa -k docker_sock
EOF

sudo augenrules --load
sudo systemctl restart auditd

# -----------------------------------------------------------------------------
# 2. DOCKER INSTALLATION & CONFIGURATION
# -----------------------------------------------------------------------------

echo "[INFO] Installing Docker from local RPMs..."
sudo dnf install -y \
  "$DOCKER_BIN_DIR"/containerd.io-*.rpm \
  "$DOCKER_BIN_DIR"/docker-ce-*.rpm \
  "$DOCKER_BIN_DIR"/docker-ce-cli-*.rpm \
  "$DOCKER_BIN_DIR"/docker-buildx-plugin-*.rpm \
  "$DOCKER_BIN_DIR"/docker-compose-plugin-*.rpm

echo "[INFO] Enabling and starting Docker..."
sudo systemctl enable --now docker

echo "[INFO] Docker version and seccomp profile:"
docker --version
docker info | grep -i seccomp

# -----------------------------------------------------------------------------
# 3. LIVEKIT SYSTEMD SERVICE DEPLOYMENT
# -----------------------------------------------------------------------------

echo "[INFO] Creating systemd service for LiveKit..."
sudo tee /etc/systemd/system/livekit-server.service <<EOF
[Unit]
Description=LiveKit Server Container
After=docker.service
Requires=docker.service

[Service]
LimitNOFILE=500000
Restart=always
WorkingDirectory=$LIVEKIT_DIR
ExecStartPre=docker compose -f docker-compose.yaml down
ExecStart=docker compose -f docker-compose.yaml up -d
ExecStop=docker compose -f docker-compose.yaml down
Type=simple
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
EOF

echo "[INFO] Enabling and starting LiveKit systemd service..."
sudo systemctl daemon-reload
sudo systemctl enable livekit-server
sudo systemctl start livekit-server

echo "[✅ DONE] Hardened LiveKit setup complete."
echo "[⚠️ REMINDER] In docker-compose.yaml, mount NFS with SELinux relabeling: :z"
echo "Example: - $NFS_MOUNT:/livekit/data:rw,z"
