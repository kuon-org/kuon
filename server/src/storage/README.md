# Storage abstraction

Kuon core code should depend on `FileStorage`, not provider SDKs or filesystem APIs.

Current providers: `local`, `s3`.

`FileStorage` owns provider-neutral object operations (`put`, `get`, `delete`, `exists`, `list`). Provider-specific concepts such as S3 buckets, Azure containers, presigned URLs, or SAS URLs must stay inside provider adapters.

Delivery mode is configured independently from the storage provider:

- `relay`: Kuon streams the object to the client.
- `redirect`: Kuon redirects to a temporary/signed provider URL. Providers that do not support temporary URLs must reject this mode.

Local example:

```env
KUON_STORAGE_PROVIDER=local
KUON_STORAGE_DELIVERY_MODE=relay
KUON_STORAGE_LOCAL_PATH=/app/public/uploads
```

S3-compatible example:

```env
KUON_STORAGE_PROVIDER=s3
KUON_STORAGE_DELIVERY_MODE=redirect
KUON_STORAGE_SIGNED_URL_EXPIRES_IN=300
KUON_STORAGE_S3_ENDPOINT=https://example.r2.cloudflarestorage.com
KUON_STORAGE_S3_REGION=auto
KUON_STORAGE_S3_BUCKET=kuon
KUON_STORAGE_S3_ACCESS_KEY_ID=...
KUON_STORAGE_S3_SECRET_ACCESS_KEY=...
KUON_STORAGE_S3_FORCE_PATH_STYLE=true
```

The S3 adapter speaks the S3-compatible API using AWS Signature Version 4 and does not expose S3-specific concepts to Kuon core code. This keeps the provider boundary usable for AWS S3, Cloudflare R2, MinIO, and similar services.

Current upload migrations:

- article images -> `FileStorage.put()`
- tag images -> `FileStorage.put()`
- local avatars -> `avatarStorage` -> `FileStorage.put()`
- external IdP avatars -> `avatarStorage` -> `FileStorage.put()`

Legacy `/uploads/...` paths remain in API/DB-facing code for compatibility. Delivery is resolved at request time, so the same path can be relayed through Kuon or redirected to a temporary provider URL.
