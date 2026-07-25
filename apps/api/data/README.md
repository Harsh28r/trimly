# Your test shops

Each shop needs its **own** owner login:

```json
{
  "ownerEmail": "myshop@trimly.test",
  "ownerName": "My Name",
  "name": "My Shop",
  ...
}
```

Edit this file, then Debug → **Reseed shops.json** (or `npm run seed` in `apps/api`).

## Seed logins

Password for all: `Password123!`

| Account | Email |
|---|---|
| Customer | `customer@trimly.test` |
| The Yellow Chair | `yellowchair@trimly.test` |
| Bombay Blade Co. | `bombayblade@trimly.test` |
| Bandra Cuts | `bandracuts@trimly.test` |
| North Line Salon | `northline@trimly.test` |
| Marine Drive Grooming | `marinedrive@trimly.test` |

`coordinates` = **`[lng, lat]`**.
