# ShopAssist

Mobile app (Expo) for Jacobs Cycles — floor staff tool connected to the shop API via **Cloudflare tunnel**.

## API URLs

| Environment | URL | Backend |
|-------------|-----|---------|
| **Production** | `https://api.jacobscycles.com/api` | Dell (`jacobs-server`) + `electropos-cloudflared` |
| **Development** | `https://api-dev.jacobscycles.com/api` | Steve + `cloudflared tunnel run jacobs-cycles_tunnel` |

Production APK defaults to **prod**. Expo Go defaults to **api-dev**.

See [../docs/cloudflare-tunnel.md](../docs/cloudflare-tunnel.md) for tunnel setup, DNS, and troubleshooting.

### One-time prod tunnel (Dell)

```bash
cd ~/Workspace/electroPOS
./scripts/setup-prod-cloudflare-tunnel.sh
```

## Run (development)

```bash
cd ShopAssist
npm install
npm start
```

Open in **Expo Go** → **Server** → **Admin enroll** → **Badge / password sign-in** → **Search** → **Scan barcode** (camera) or type SKU/name → tap a product → edit stock/barcode (warehouse+) or name/price (manager/admin).

Camera scanning requires a physical device (not web). Grant camera permission when prompted.

Saving a product bumps **catalog revision** on the server; POS tills and Back Office Products refresh within ~30s.

## Build APK (production / sideload)

Installable Android builds use [EAS Build](https://docs.expo.dev/build/introduction/) (no Android Studio required).

### One-time

```bash
npm install -g eas-cli
eas login
cd ShopAssist
eas init    # links this app to your Expo account (creates projectId in app.json)
```

### Build & install

```bash
npm run build:apk
```

When the build finishes, open the download link on each store phone (or transfer the `.apk`) and install. Allow “Install unknown apps” if Android prompts.

- **Preview** (internal testing): `npm run build:apk:preview`
- App icon: `assets/images/appIcon.png` (CogniPOS purple adaptive background `#350d66`)
- After install: **Server** → set prod API URL → **Enroll** (admin once per device) → staff badge/password login

Bump `version` in `app.json` before each new release build.

## Change server URL

Home → **Server settings**, or `/setup` before login.
