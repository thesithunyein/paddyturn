# PaddyTurn

PaddyTurn helps small rice mills choose which paddy batch gets the next dryer turn.

## Use the workspace

1. Add each incoming batch with its arrival time, measured moisture, and outdoor drying eligibility.
2. Choose whether the queue prioritizes highest moisture or earliest arrival.
3. Record outdoor conditions for the current drying window. When the first batch can dry outdoors, PaddyTurn uses that choice to recommend the next batch or ask for review.
4. Assign the recommended batch to the dryer to move it into history. Check conditions again when planning a new shift.

The queue, preferences, and assignment history are stored in this browser. Each browser has its own workspace. The app provides a scheduling recommendation. Follow mill procedures and measure moisture before making storage decisions.

## Local development

Use Node.js 24.

```sh
npm ci
npm test
npm run dev
```

Open http://127.0.0.1:3000.

## Forecast integration

The workspace uses operator-entered conditions. The separate Telegraph probe checks forecast availability without changing the workspace.

Run `npm run probe` for provider discovery. To check a paid response, copy `.env.example` to `.env.local`, use a dedicated Sepolia wallet funded with test USDC, and run `npm run probe -- --buy`. The client limits spend and returns the receipt when available. See the [Telegraph x402 documentation](https://anjoman.ai/docs/using/x402-inference).
