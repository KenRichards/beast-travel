#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

die() {
    echo -e "${RED}ERROR:${NC} $1"
    exit 1
}

header() {
    echo
    echo -e "${BLUE}=========================================${NC}"
    echo -e "${BLUE} BEAST Travel Development Tool${NC}"
    echo -e "${BLUE}=========================================${NC}"
    echo
}

backup() {

    mkdir -p .backups

    local ts
    ts=$(date +%Y%m%d-%H%M%S)

    tar -czf ".backups/project-${ts}.tar.gz" \
        src \
        public \
        package.json \
        2>/dev/null || true

    echo -e "${GREEN}Backup created:${NC} .backups/project-${ts}.tar.gz"
}

validate() {

    echo
    echo "Checking docker..."

    docker compose ps >/dev/null || die "Docker Compose unavailable."

    echo
    echo "Checking project..."

    test -f package.json || die "package.json missing"

    test -d src || die "src missing"

    echo -e "${GREEN}Project OK${NC}"
}

status() {

    git status

    echo

    docker compose ps
}

case "${1:-}" in

backup)

    header
    backup
    ;;

validate)

    header
    validate
    ;;

status)

    header
    status
    ;;

*)

cat <<EOF

Usage:

./tools/beast-dev.sh backup
./tools/beast-dev.sh validate
./tools/beast-dev.sh status

EOF

;;

esac
