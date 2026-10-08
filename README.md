# bistro-burger

Vercel serverless endpoint `GET /api/burger`. Načte polední menu z https://beethoven.breaktimebistro.cz a zjistí, jestli je tento týden burger.

Odpověď (JSON):

```json
{ "hasBurger": true,  "message": "Ve čtvrtek 8.10. je 🍔 (Burger Kentucky, ...)", "burgers": [{ "date": "2026-10-08", "dish": "..." }] }
{ "hasBurger": false, "message": "", "burgers": [] }
```

Když se stránku nepodaří načíst, vrací HTTP 502 a pole `error`.

Nasazení: naimportovat repo ve Vercelu (Add New → Project), bez build nastavení.
