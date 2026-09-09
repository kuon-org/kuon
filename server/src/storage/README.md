# Storage abstraction

Kuon core code should depend on `FileStorage`, not provider SDKs or filesystem APIs.

Current provider: `local`.

Delivery mode is configured independently from the storage provider. `relay` is supported by the local provider. `redirect` is reserved for providers that can create temporary URLs.

Environment variables:

- `KUON_STORAGE_PROVIDER=local`
- `KUON_STORAGE_DELIVERY_MODE=relay`
- `KUON_STORAGE_LOCAL_PATH=/app/public/uploads`
