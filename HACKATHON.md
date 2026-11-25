# PaddyTurn — Telegraph Season II submission pack

**Track:** Apps & Agents  
**Mission:** 06 — Resources & Agriculture  
**Network:** Telegraph testnet. Workspace checks are paid from Anjoman testnet escrow; the probe pays by x402 on Ethereum Sepolia.

## One-line pitch

PaddyTurn helps a small rice mill decide which paddy batch gets its single dryer next by buying a ranked rain-chance forecast through Telegraph, and keeps the receipt, signal hash and cost behind every weather-dependent decision.

## Commercial summary

- **Who it is for:** small rice mills and drying cooperatives that share one dryer and can dry some batches outdoors. The verified testnet example uses Pathein, Myanmar. Reviewers can enter their own mill location, subject to forecast provider coverage.
- **What it improves:** the call on which batch takes the dryer when wet paddy arrives together. A wrong call wastes the dryer slot or leaves wet paddy exposed to rain.
- **What it does today:** ranks batches by moisture or arrival, buys a rain-chance check only when an outdoor-eligible batch is at the top, and records the decision with Telegraph evidence. Testnet only.
- **Why someone would adopt it:** a free weather app gives no record. PaddyTurn gives an auditable trail — ranked provider, returned rain chance, cost, signal hash, receipt — for cooperative disputes, owner review and crop-loss claims, at about one cent per decision.
- **How to try it:** open https://paddyturn.vercel.app/app, add two batches, and follow the judge walkthrough below. Developers can run `npm run probe -- --quote` with no wallet.

## What works today

- An operator can add batches, choose a queue policy, record outdoor eligibility, and confirm a dryer assignment.
- When the highest-priority batch could dry outdoors, the app makes a routed, budgeted Telegraph ask for `WEATHER_FORECAST_GENERAL` instead of guessing.
- The decision uses `precipitation_probability_pct` only when its `field_status` is `ok`, fulfillment is complete, cost is within budget, and a signal hash or receipt is returned. Otherwise the operator reviews conditions.
- Each request has a budget cap and the server has a daily budget, so a leaked access code cannot drain escrow.
- Evidence is retained with the assigned batch: location, window, rain chance, limit, provider, cost, signal hash and payment receipts.

## Claims to make only after verification

Do not state any item below until it is visible in the app and saved as evidence:

- A successful paid forecast request.
- A usable returned forecast that changed or confirmed a dryer recommendation.
- The actual receipt, signal hash, cost and provider.
- Independent mill-operator use or independent developer reproduction.

## Judge walkthrough

1. Open `/app` and add two test batches. Make **PT-024** 18.4% moisture and outdoor eligible; make **PT-025** 16.2% and indoor only.
2. Select **Wettest first** and **Not sure** for weather. PaddyTurn should require weather before assigning PT-024.
3. Expand **Optional forecast check**, enter the access code privately, and request a three-hour forecast for the mill location (or any town).
4. Verify the rain chance, limit, provider, cost, receipt and signal hash. Check the signal with `curl https://devnode.telegraphprotocol.com/engine/v1/signal/<signal_hash>`. The app must make a real decision from the returned rain chance.
5. Assign the recommended batch, reload, and open **History → View evidence**.
6. Failure test: use an invalid access code. The app must keep the recommendation in operator-review state and display no paid evidence.

## Submission evidence checklist

- [ ] Public repository and working deployment links.
- [ ] Star `telegraphprotocol/bounties` from the submitting GitHub account.
- [ ] One successful paid testnet forecast with saved receipt, signal hash, cost and result.
- [ ] Screenshot/video of the same forecast changing or confirming the dryer decision.
- [ ] Screen recording of the failure path.
- [ ] A fresh-browser reproduction by an independent developer or mill operator, with permission to link their feedback.
- [ ] Three dated original public updates, each with a useful technical takeaway (planned: Nov 23, Nov 27, Nov 30).
- [ ] 2–3 GitHub issues from independent developers who ran `npm run probe -- --quote` or the workspace, linked in the submission.
- [ ] Reviewer access code shared privately in the submission evidence field.
- [ ] 2–5 minute demo video.

## Two-minute demo script

**0:00–0:15 — Problem.** “A small rice mill has one dryer, several arriving batches, and a weather-sensitive choice. Picking wrong can waste the dryer slot or leave wet paddy exposed.”

**0:15–0:35 — Product.** Show the queue with PT-024 and PT-025. “PaddyTurn ranks measured batch conditions, but it does not invent weather. When the top batch is outdoor eligible, it buys the signal it needs.”

**0:35–1:25 — Real flow.** Open the forecast check, request the forecast, then show the rain chance, limit, provider, cost, receipt and signal hash, and the recommendation. Look up the signal hash with curl. State the testnet network and actual cost clearly.

**1:25–1:45 — Outcome.** Assign the recommended batch. Reload and show History with the retained evidence.

**1:45–2:00 — Reliability.** Show the invalid-code failure path: “Without verified forecast evidence, PaddyTurn asks the operator to review. It never records a paid decision without evidence.”

## Public update drafts

### Update 1 — problem

Building PaddyTurn for Telegraph Season II Mission 06: one dryer, several wet paddy batches, and a weather-dependent decision. The goal is not another forecast screen—it is a bounded-cost, auditable recommendation for which batch to dry next. I will share the real testnet evidence and the failure path as I build. #TelegraphHackathon

### Update 2 — integration

Lesson from integrating Telegraph: read the intent's response schema first (`GET /engine/v1/intents/WEATHER_FORECAST_GENERAL`). I had built for hourly rainfall in mm; the intent returns a peak rain chance, so PaddyTurn now decides on that and only when its `field_status` is `ok`. Each check is a routed, budgeted ask and keeps the receipt and signal hash with the dryer decision. Next I am validating the paid testnet result end to end and documenting the exact reproduction steps. #TelegraphHackathon

### Update 3 — result (fill only after proof)

PaddyTurn’s end-to-end testnet weather decision is now reproducible: [link]. A Telegraph request for [location/window] returned [result] at [actual cost], and the evidence is retained with the dryer assignment. The repo includes a failure-path test and setup steps for another developer to reproduce it. Testnet only; no production or field-adoption claim. #TelegraphHackathon
