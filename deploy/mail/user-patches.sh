#!/bin/bash
# docker-mailserver runs this automatically, late in startup, on every boot.
# It idempotently provisions the Fixa mailboxes, aliases and DKIM key from the
# MAIL_*_PASSWORD environment variables, so a fresh `docker compose up` comes up
# fully configured with no manual account creation. Safe to re-run.
set -euo pipefail

ACCOUNTS=/tmp/docker-mailserver/postfix-accounts.cf
DOMAIN=fixa.site
DKIM_TXT="/tmp/docker-mailserver/opendkim/keys/${DOMAIN}/mail.txt"

add_account() {
  local addr="$1" pass="$2"
  if [ -z "${pass}" ]; then
    echo "user-patches: no password for ${addr}, skipping"
    return
  fi
  if [ -f "${ACCOUNTS}" ] && grep -qi "^${addr}|" "${ACCOUNTS}"; then
    return  # already exists
  fi
  echo "user-patches: creating mailbox ${addr}"
  setup email add "${addr}" "${pass}"
}

add_alias() {
  setup alias add "$1" "$2" >/dev/null 2>&1 || true
}

add_account "no-reply@${DOMAIN}" "${MAIL_NOREPLY_PASSWORD:-}"
add_account "support@${DOMAIN}"  "${MAIL_SUPPORT_PASSWORD:-}"
add_account "pros@${DOMAIN}"     "${MAIL_PROS_PASSWORD:-}"

add_alias "postmaster@${DOMAIN}" "support@${DOMAIN}"
add_alias "abuse@${DOMAIN}"      "support@${DOMAIN}"

# Generate the DKIM keypair once. The public record is printed by
# deploy/mail/print-dns.sh for you to add as a TXT record.
if [ ! -f "${DKIM_TXT}" ]; then
  echo "user-patches: generating DKIM key for ${DOMAIN}"
  setup config dkim keysize 2048 selector mail domain "${DOMAIN}" || true
fi

echo "user-patches: provisioning complete"
