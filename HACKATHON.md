# PaddyTurn — Telegraph Season II submission pack

**Track:** Apps & Agents  
**Mission:** 06 — Resources & Agriculture  
**Network:** Telegraph testnet / Ethereum Sepolia settlement where returned by the supported flow

## One-line pitch

PaddyTurn helps a small rice mill decide which paddy batch gets its single dryer next by buying a verified local rainfall window through Telegraph and preserving the cost and evidence behind the recommendation.

## What works today

- An operator can add batches, choose a queue policy, record outdoor eligibility, and confirm a dryer assignment.
- When the highest-priority batch could dry outdoors, the app can request a bounded-cost weather check rather than silently guessing.
- The recommendation changes only when a current forecast covers the requested window; otherwise the operator is asked to review conditions.
- Forecast evidence is retained with the assigned batch: requested window, rainfall threshold, job ID, provider when returned, intent, and observed cost.

## Claims to make only after verification

Do not state any item below until it is visible in the app and saved as evidence:

- A successful paid forecast request.
- A usable returned forecast that changed or confirmed a dryer recommendation.
- The actual job ID, cost, provider, and receipt/settlement evidence.
- Independent mill-operator use or independent developer reproduction.

## Judge walkthrough

1. Open `/app` and add two test batches. Make **PT-024** 18.4% moisture and outdoor eligible; make **PT-025** 16.2% and indoor only.
2. Select **Wettest first** and **Not sure** for weather. PaddyTurn should require weather before assigning PT-024.
3. Expand **Optional forecast check**, enter the access code privately, and request a three-hour forecast for the mill location.
4. Verify the window, rainfall threshold, result, job ID, cost, intent, and provider/evidence. The app must make a real decision from the returned result.
5. Assign the recommended batch, reload, and open **History → View evidence**.
6. Failure test: use an invalid access code. The app must keep the recommendation in operator-review state and display no paid evidence.

## Submission evidence checklist

- [ ] Public repository and working deployment links.
- [ ] Star `telegraphprotocol/bounties` from the submitting GitHub account.
- [ ] One successful paid testnet forecast with saved job ID, cost, result, and receipt/transaction evidence where available.
- [ ] Screenshot/video of the same forecast changing or confirming the dryer decision.
- [ ] Screen recording of the failure path.
- [ ] A fresh-browser reproduction by an independent developer or mill operator, with permission to link their feedback.
- [ ] Three dated original public updates, each with a useful technical takeaway.

## Two-minute demo script

**0:00–0:15 — Problem.** “A small rice mill has one dryer, several arriving batches, and a weather-sensitive choice. Picking wrong can waste the dryer slot or leave wet paddy exposed.”

**0:15–0:35 — Product.** Show the queue with PT-024 and PT-025. “PaddyTurn ranks measured batch conditions, but it does not invent weather. When the top batch is outdoor eligible, it buys the signal it needs.”

**0:35–1:25 — Real flow.** Open the forecast check, request the forecast, then show result, threshold, job ID, cost, provider/receipt evidence, and the recommendation. State the testnet network and actual cost clearly.

**1:25–1:45 — Outcome.** Assign the recommended batch. Reload and show History with the retained evidence.

**1:45–2:00 — Reliability.** Show the invalid-code failure path: “Without verified forecast evidence, PaddyTurn asks the operator to review. It never records a paid decision without evidence.”

## Public update drafts

### Update 1 — problem

Building PaddyTurn for Telegraph Season II Mission 06: one dryer, several wet paddy batches, and a weather-dependent decision. The goal is not another forecast screen—it is a bounded-cost, auditable recommendation for which batch to dry next. I will share the real testnet evidence and the failure path as I build. #TelegraphHackathon

### Update 2 — integration

PaddyTurn now asks Telegraph for a weather-verification window only when the queue actually needs it. The decision record keeps the requested window, rain threshold, job ID, intent, provider evidence, and observed cost. Next I am validating the paid testnet result end to end and documenting the exact reproduction steps. #TelegraphHackathon

### Update 3 — result (fill only after proof)

PaddyTurn’s end-to-end testnet weather decision is now reproducible: [link]. A Telegraph request for [location/window] returned [result] at [actual cost], and the evidence is retained with the dryer assignment. The repo includes a failure-path test and setup steps for another developer to reproduce it. Testnet only; no production or field-adoption claim. #TelegraphHackathon
