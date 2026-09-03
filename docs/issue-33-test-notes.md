# Issue #33 verification notes

Suggested manual checks:

1. With no users in the database, confirm `/register` is available even if `allow_local_account_registration=false`.
2. Create the initial administrator account.
3. Disable local account registration from Server Settings.
4. Confirm the login page no longer shows the registration link.
5. Confirm direct access to `/register` shows the disabled-registration notice.
6. Confirm `POST /api/register` returns `403` while existing local login still works.
7. Re-enable local account registration and confirm registration is available again.
