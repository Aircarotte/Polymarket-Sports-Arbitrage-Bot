# Polymarket Sports Arb Trading Bot (TypeScript)

TypeScript migration of the Python sports arbitrage pipeline and paper auto-trader.

## Setup

```bash
npm install
cp .env.example .env
```

## Run full pipeline + paper auto-trader

```bash
npm run fetch:markets
npm run filter:markets
npm run fetch:odds-comparison
npm run detect:arb
TRADING_DRY_RUN=false npm run run:auto-trader -- --cycles 3
npm run summarize:session
```

## One command

```bash
npm run fetch:markets && npm run filter:markets && npm run fetch:odds-comparison && npm run detect:arb && TRADING_DRY_RUN=false npm run run:auto-trader -- --cycles 3 && npm run summarize:session
```

## Notes

- `paper` mode is supported for auto-trading simulation.
- `live` mode is guarded; it requires wallet env vars and still exits because live adapter is intentionally not implemented in this TS build.
- Key outputs are generated in `data/` and `data/trading/`.
