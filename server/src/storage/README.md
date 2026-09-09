# Storage abstraction

Kuon core code should depend on `FileStorage`, not provider SDKs or filesystem APIs.

Current provider: `local`.

`FileStorage` owns provider-neutral object operations (`put`, `get`, `delete`, `exists`, `list`). Provider-specific concepts such as S3 buckets, Azure containers, presigned URLs, or SAS URLs must stay inside provider adapters.

Delivery mode is configured independently from the storage provider:

- `relay`: Kuon streams the object to the client.
- `redirect`: Kuon redirects to a temporary/signed provider URL. Providers that do not support temporary URLs must reject this mode.

Environment variables:

- `KUON_STORAGE_PROVIDER=local`
- `KUON_STORAGE_DELIVERY_MODE=relay`
- `KUON_STORAGE_LOCAL_PATH=/app/public/uploads`

Current upload migrations:

- article images -> `FileStorage.put()`
- tag images -> `FileStorage.put()`
- local avatars -> `avatarStorage` -> `FileStorage.put()`

Legacy `/uploads/...` paths remain in API/DB-facing code for local compatibility while delivery abstraction is introduced separately.
