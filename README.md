# ShopAssist

Mobile app (Expo) for Jacobs Cycles — floor staff tool connected to the shop API via **Cloudflare tunnel**.

## Default API URL

`https://api-dev.jacobscycles.com/api`

Requires on Steve:

1. `npm run dev` in `server/` (port 4000)
2. `cloudflared tunnel run jacobs-cycles_tunnel`

## Run

```bash
cd ShopAssist
npm install
npm start
```

Open in **Expo Go** → **Server** → **Sign in** → **Search** → **Scan barcode** (camera) or type SKU/name → tap a product → edit stock/barcode (warehouse+) or name/price (manager/admin).

Camera scanning requires a physical device (not web). Grant camera permission when prompted.

Saving a product bumps **catalog revision** on the server; POS tills and Back Office Products refresh within ~30s.

## Change server URL

Home → **Server settings**, or `/setup` before login.
