#!/usr/bin/env bash
# Delete a named EC2 key pair in every AWS Region where it exists.
#
# Note: EC2 key pairs are regional resources (not per Availability Zone).
# This script enumerates all enabled regions and calls DeleteKeyPair per hit.
#
# Credentials: root `.env` in this repo (AWS_KEY/AWS_SECRET or standard AWS_* names),
# or existing AWS_ACCESS_KEY_ID / AWS_PROFILE in the environment.
#
# Usage:
#   ./scripts/aws/delete_ec2_keypair_all_regions.sh [key-name]
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
KEY_NAME="${1:-buatbelisdfgmsobilbaim}"

if [[ -f "$ROOT/.env" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ROOT/.env"
  set +a
fi

export AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID:-${AWS_KEY:-${AWSKEY:-}}}"
export AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY:-${AWS_SECRET:-}}"

if [[ -z "${AWS_ACCESS_KEY_ID:-}" || -z "${AWS_SECRET_ACCESS_KEY:-}" ]]; then
  echo "Missing AWS credentials. Set them in $ROOT/.env (see .env.example) or export AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY." >&2
  exit 1
fi

echo "Caller identity:"
aws sts get-caller-identity --output json
echo
echo "Scanning all regions for key pair name: ${KEY_NAME}"

# macOS ships Bash 3.2 (no `mapfile`); build the region list portably.
REGIONS=()
while IFS= read -r line; do
  [[ -n "$line" ]] && REGIONS+=("$line")
done < <(aws ec2 describe-regions --query 'Regions[].RegionName' --output text | tr '\t' '\n' | sort)

deleted=0
missing=0
errors=0

for region in "${REGIONS[@]}"; do
  if aws ec2 describe-key-pairs --region "$region" --key-names "$KEY_NAME" --output text >/dev/null 2>&1; then
    echo "[${region}] deleting ${KEY_NAME} ..."
    if aws ec2 delete-key-pair --region "$region" --key-name "$KEY_NAME" --output text; then
      deleted=$((deleted + 1))
    else
      errors=$((errors + 1))
    fi
  else
    missing=$((missing + 1))
  fi
done

echo
echo "Summary: deleted=${deleted} (regions where key existed), no-match-regions=${missing}, errors=${errors}"
