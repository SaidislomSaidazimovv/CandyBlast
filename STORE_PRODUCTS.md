# Candy Blast store products

Candy Blast uses a freemium model. All 20 launch levels remain playable without payment. The first store catalog contains only consumable Gold Bars, which never expire:

| Product ID | Content | Type |
| --- | --- | --- |
| `candyblast.gold.50` | 50 Gold Bars | Consumable |
| `candyblast.gold.120` | 120 Gold Bars | Consumable |
| `candyblast.gold.300` | 300 Gold Bars | Consumable |

Gold can buy +5 Moves (7), a Lollipop Hammer (9), a Rainbow Prism (12), or a full five-heart refill (15). Prices shown to players must come from the active store, never from hardcoded text.

The client does not credit purchases. Android purchase tokens and Apple signed transactions must be sent to a Supabase Edge Function, validated with Google Play Developer API or App Store Server API, then passed to `economy_grant_verified_purchase` using `service_role`. The transaction ledger rejects replayed receipts. Do not ship purchasing until both store accounts, products, server credentials, refund notifications and sandbox tests are complete.
