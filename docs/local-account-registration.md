# Local account registration

Kuon administrators can control whether new local accounts may be created with the `allow_local_account_registration` server setting.

## Behavior

- The default is `true`.
- When `false`, `POST /register` returns `403` and the client hides the registration link.
- Existing local accounts can still sign in.
- External IdP authentication and JIT provisioning are not affected.
- When no users exist, local registration is always allowed regardless of the setting so that the initial administrator account can be created.

The effective registration state is available from `GET /registration-status`.
