# Issue #33 implementation

Local account registration can be disabled with the `allow_local_account_registration` server setting. The effective registration state always remains enabled while the instance has no users, protecting initial setup from lockout.

The client reads `GET /registration-status` to hide the registration link and show a direct-access notice when local registration is disabled. The server independently enforces the same rule on `POST /register`.
