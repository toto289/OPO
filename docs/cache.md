# Cache Strategy

This project uses a small in-memory cache for frequently queried data. Each
`get*` function wraps its database call with a `cached` helper that stores the
result by key. Mutating operations (`add*`, `update*`, `delete*`) call
`invalidateCache` with the corresponding key to clear stale entries so that the
next call refetches from the database.

| Data set            | Cache key           | Mutations that invalidate |
| ------------------- | ------------------- | ------------------------- |
| Equipment           | `equipment`         | add/update/delete/log     |
| Stores              | `stores`            | add/update/delete         |
| Users               | `users`             | add/update                |
| Warehouse components| `warehouse_components` | (read-only)           |
| Warehouse insumos   | `warehouse_insumos` | (read-only)               |

This manual invalidation strategy keeps API responses consistent after writes
while avoiding unnecessary database queries.
