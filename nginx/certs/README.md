# Place your TLS certs here for HTTPS.
# nginx.conf references /etc/nginx/certs/fullchain.pem and /etc/nginx/certs/privkey.pem
# (the HTTPS server block is commented out by default — uncomment after adding certs).
#
# Generate a self-signed pair for local dev:
#   openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
#     -keyout privkey.pem -out fullchain.pem -subj "/CN=localhost"
