import hmac, sys, os

key = b"key-guard"

digest = hmac.new(key, digestmod="sha512")

with open("./ws_rsa", "r") as r:
    digest.update(r.buffer.read())

print(digest.hexdigest())
