#!/usr/bin/env bash
# Prints every DNS record you must add for fixa.site mail to send and receive
# reliably. Run from the repo root on the server AFTER `docker compose up` has
# booted the mailserver at least once (the DKIM key is generated on first boot).
#
#   ./deploy/mail/print-dns.sh
set -euo pipefail

DOMAIN=fixa.site
IP="$(curl -fsS https://api.ipify.org 2>/dev/null || echo 'YOUR.SERVER.IP')"

cat <<EOF
=== DNS records for ${DOMAIN} mail ===

A     mail            ${IP}
MX    @               10 mail.${DOMAIN}.
TXT   @               "v=spf1 mx ~all"
TXT   _dmarc          "v=DMARC1; p=quarantine; rua=mailto:postmaster@${DOMAIN}; adkim=s; aspf=s"

--- DKIM (public key, add as a TXT record) ---
EOF

docker compose exec -T mailserver cat "/tmp/docker-mailserver/opendkim/keys/${DOMAIN}/mail.txt" 2>/dev/null \
  || echo '(mailserver not running yet, or DKIM not generated — start the stack, then re-run)'

cat <<EOF

--- Set these at your VPS / hosting provider (not at your DNS registrar) ---
PTR (reverse DNS)   ${IP}  ->  mail.${DOMAIN}
Outbound TCP port 25 must be UNBLOCKED (many hosts block it by default; open a ticket).

--- Verify after propagation ---
  dig MX ${DOMAIN} +short
  dig TXT mail._domainkey.${DOMAIN} +short
  Send a test to https://www.mail-tester.com and aim for 10/10.
EOF
