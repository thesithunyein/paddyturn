<div align="center">
  <img src="public/paddyturn.svg" width="76" height="76" alt="PaddyTurn rice-stalk logo">
  <h1>PaddyTurn</h1>
  <p><strong>Know what to dry next.</strong></p>
  <p><a href="https://paddyturn.vercel.app/">Product homepage</a> · <a href="https://paddyturn.vercel.app/app">Mill workspace</a></p>

  [![Open workspace](https://img.shields.io/badge/Open_workspace-244c37?style=for-the-badge&logo=vercel&logoColor=white)](https://paddyturn.vercel.app/app)
  [![Next.js 16](https://img.shields.io/badge/Next.js-16-181818?style=for-the-badge&logo=nextdotjs)](package.json)
  [![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](tsconfig.json)
  [![Security policy](https://img.shields.io/badge/Security-policy-527046?style=for-the-badge&logo=github&logoColor=white)](SECURITY.md)
</div>

## Mill workspace

PaddyTurn helps small rice mills and cooperative drying stations assign one mechanical dryer slot when several paddy batches arrive together.

1. **Add batches.** Enter arrival time, measured moisture, and outdoor drying eligibility.
2. **Set the priority.** Choose **Wettest first** or **First to arrive**.
3. **Record outdoor conditions.** Enter them manually or check Telegraph when weather could change the next assignment.
4. **Assign the next batch.** Check the recommendation, then record the assignment in history.

The queue, preferences, and history are stored in the current browser. Other devices have their own workspaces. Use physical moisture measurements and mill procedures for storage decisions.

## How the next turn is chosen

```mermaid
flowchart TD
    A["Rank available batches"] --> B{"Can the top batch dry outdoors?"}
    B -->|No| C["Recommend the top batch"]
    B -->|Yes| D{"Outdoor conditions"}
    D -->|Rain expected| C
    D -->|Dry window| E["Recommend the highest-ranked indoor batch"]
    D -->|Unconfirmed| F["Ask the operator to check conditions"]
    C --> G["Operator confirms assignment"]
    E -->|Indoor batch available| G
    E -->|No indoor batch| H["Leave the dryer unassigned"]
    G --> I["Move batch from queue to history"]
```

## Architecture

```mermaid
flowchart TB
    subgraph Browser["Mill workspace"]
        UI["Next.js interface"] --> Rules["Deterministic scheduling engine"]
        UI <-->|Queue and assignments| Store[("Browser storage")]
        Rules --> UI
    end
    subgraph Forecast["Protected forecast service"]
        Probe["Workspace forecast check"] --> Client["Anjoman API client with a spend cap"]
        Client -->|Escrow-funded request| Telegraph["Telegraph"]
        Telegraph -->|Forecast sources, job ID and cost| Client
    end
    UI -->|Weather-dependent decision| Probe
```

A usable forecast informs the current recommendation. The operator confirms the assignment. Unavailable or expired data calls for operator review. [Scheduling rules](lib/schedule.ts) · [Forecast client](lib/telegraph.ts)

## Local development

Use Node.js 24 and npm.

```sh
npm ci
npm test
npm run dev
```

Open [localhost:3000](http://127.0.0.1:3000/app). Run `npm run build` to verify the production build.

For provider discovery, run `npm run probe`. Run `npm run probe -- --quote` to verify the Pathein request and inspect the Sepolia quote without signing or paying. The amount is in millionths of test USDC. For a paid testnet forecast, copy [the environment template](.env.example) to `.env.local`, configure a dedicated Sepolia wallet funded with test USDC, then run `npm run probe -- --buy`. The probe reports the receipt when available. [Telegraph x402 documentation](https://anjoman.ai/docs/using/x402-inference)

For the workspace forecast, configure server-side `TELEGRAPH_API_KEY` and `LOCAL_FORECAST_TOKEN`. Check your Anjoman account has available testnet escrow. Open **Optional forecast check** and enter the workspace access code. The server sends only forecast inputs, with a 0.03 USDC maximum per request. History saves the job ID and cost when the forecast informs an assignment. [Anjoman API setup](https://anjoman.ai/docs/using/api-keys)

## Verification

- **Workspace:** Browser walkthrough verified adding batches, switching weather choices, recording a dryer assignment, and recovering it from History after reload. The walkthrough used test batches.
- **Forecast:** Telegraph returned an x402 payment quote for the Pathein request. A funded Sepolia purchase, usable forecast response, and receipt have yet to be verified end to end.
- **Field use:** A mill-operator walkthrough and independent reproduction are still pending.

## Reviewer walkthrough

1. Open the workspace and add two test batches. Give the first a higher moisture reading and allow it to dry outdoors. Keep the second indoors.
2. Use **Wettest first** and **Not sure**. The workspace should ask for weather. Open **Optional forecast check**, enter the access code privately, and run an Anjoman forecast for the mill location.
3. Check the precipitation, threshold, job ID and cost. If the forecast is usable, confirm the recommended batch. Reload, open **History**, and expand **View evidence**.
4. For a failure case, use a deliberately invalid access code on a weather-dependent queue. The app should ask for operator review and show no paid job evidence.
5. Save the real job ID and cost for the submission. Label the queue as test data unless supplied by an operator. The quote alone does not prove settlement.

## Project policies

[Contributing](CONTRIBUTING.md) · [Security](SECURITY.md) · [Code of conduct](CODE_OF_CONDUCT.md)
