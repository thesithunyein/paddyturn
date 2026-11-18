# PaddyTurn

**Know which paddy batch to dry next.**

PaddyTurn is a single-shift planning tool for small rice mills and cooperative drying stations in Myanmar’s Ayeyarwady Delta. It ranks incoming batches under an operator-selected rule, then considers whether a dry window would change the next mechanical dryer assignment.

Telegraph Season II · Apps & Agents · Mission 06, Resources and Agriculture.

## Run the demo

Use Node.js 24 and npm.

```sh
npm ci
npm test
npm run dev
```

Open http://127.0.0.1:3000. With the sample batches, Dry replay assigns P-02 to the dryer and lists P-01 as an outdoor candidate. Rain replay assigns P-01. Unavailable replay asks for operator review. To exercise the no-purchase path, clear the first batch’s outdoor eligibility. The replays use simulated weather and issue no requests.

## Try a real testnet forecast

1. Copy `.env.example` to `.env.local`. Use a dedicated Sepolia test wallet and fund it with test USDC via the faucet linked in the [Telegraph x402 docs](https://anjoman.ai/docs/using/x402-inference).
2. Run `npm run probe` to check discovery. Confirm the provider supports your test location, intent, coordinate keys, and hourly output schema. The default is the discovered LiveCert miner (ID 4433). The adapter accepts a window start, hourly count and peak hourly precipitation, or a complete `result.hourly` series with ISO `time` and numeric `precipitation_mm`. A provider with a different response needs an adapter update.
3. Run `npm run probe -- --buy` to try a single paid forecast for Pathein, or use Live testnet in the app. For the app, configure a random local access token of at least 24 bytes and enter it in the form. The app remains local and keeps the signing key server-side.
4. Compare the result with the receipt and signal hash. The scheduler requires complete hourly coverage for the window beginning at the current UTC hour. At or above the selected hourly precipitation threshold, it keeps the original dryer priority. Missing or unusable data requires operator review.

The wallet accepts only the documented Sepolia test asset. Default maximum is 10,000 micro-USDC per payment, with one purchase attempt per running process. Review the network settlement and wallet activity before restarting after a failure. Use a fresh dedicated test wallet and keep `.env.local` private. See [request schemas](https://anjoman.ai/docs/using/intent-schema) and [request documentation](https://anjoman.ai/docs/using/engine-ask).

## Status

The scheduling demo is implemented. Live provider coverage for Ayeyarwady, the response schema, and a paid settlement require verification. Priority and rain thresholds are demonstration settings. Operators should validate their own rules and use physical moisture measurements for storage decisions.
