# bistro-burger

Vercel serverless endpoint `GET /api/burger`. Načte polední menu z https://beethoven.breaktimebistro.cz a zjistí, jestli je tento týden burger.

Endpoint: https://bistro-burger.vercel.app/api/burger

Odpověď (JSON):

```json
{ "hasBurger": true,  "message": "Burger alert 🍔: ve čtvrtek 8.10. je Burger Kentucky, ...", "burgers": [{ "date": "2026-10-08", "dish": "..." }] }
{ "hasBurger": false, "message": "", "burgers": [] }
```

Když se stránku nepodaří načíst, vrací HTTP 502 a pole `error`.

Nasazení: naimportovat repo ve Vercelu (Add New → Project), bez build nastavení. Každý push na `main` se nasadí sám.

## Power Automate, aneb jak zavolat URL v roce 2026

Plán byl jednoduchý: Power Automate v pondělí v 8:55 zavolá endpoint a pošle výsledek do Teams. Jedna HTTP akce. Co by se mohlo pokazit.

- **HTTP akce** je *Premium*. Poslat GET požadavek je zjevně luxusní technologie, kterou si běžný smrtelník nezaslouží. Zítra bude Premium i sčítání, pozítří proměnné.
- **RSS konektor** (standardní, takže zadarmo) by to krásně obešel, jenže je v naší organizaci zakázaný. Kdyby si náhodou někdo přečetl zprávičky. Endpoint `/api/rss` proto zase zmizel.
- **OneDrive for Business** ovšem povolený je. A má akci *Upload file from URL*, která, světe div se, stáhne URL. Takže JSON nejdřív „nahrajeme“ na OneDrive a hned si ho odtamtud zase přečteme. Enterprise architektura v celé své kráse.

### Flow

1. **Recurrence**: pondělí 8:55, časové pásmo Praha.
2. **OneDrive for Business → Upload file from URL**
   - Source URL: `https://bistro-burger.vercel.app/api/burger`
   - Destination File Path: např. `/PowerAutomate/burger.json`
   - Overwrite: Yes
3. **OneDrive for Business → Get file content**: File = dynamická hodnota **Id** z předchozího kroku. *Get file content using path* by fungovalo taky, pokud ho v nabídce najdete.
4. **Parse JSON**
   - Content (výraz): `base64ToString(body('Get_file_content')?['$content'])`
   - Schema vygenerovat z ukázky: `{"hasBurger":true,"message":"x","burgers":[{"date":"2026-10-08","dish":"x"}]}`
5. **Condition**: `hasBurger` (dynamická hodnota) *is equal to* `true` (zadat jako **výraz**, ne text, jinak se porovnává řetězec `"true"` a podmínka nikdy neplatí).
   - **True** → Teams **Post message in a chat or channel**, Post as `Flow bot`, Post in `Channel`, Message = dynamická hodnota **message**.
   - **False** → nic, bez burgeru není o čem psát.

Na test stačí v posledním kroku *Post in: Chat with Flow bot* a jako Recipient vlastní e-mail. Zpráva dorazí do chatu s aplikací **Workflows**. Pozor, akce *Post message to self* pošle zprávu do chatu „(Vy)“, kde ji nikdo hledat nebude.
