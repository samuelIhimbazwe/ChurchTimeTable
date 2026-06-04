# Ministry Funds (MF-5)

Funds hold balances via `MinistryFundTransaction` entries (sum of signed amounts).

## Types

GENERAL, WELFARE, PROJECT, EVENT, EMERGENCY, CUSTOM

## APIs

- `GET/POST /ministries/:id/finance/funds`
- `POST /ministries/:id/finance/funds/:fundId/deposits`
- `POST /ministries/:id/finance/transfers`
