# smbi.dk

Undervisningssite med interaktive simuleringer til naturgeografi og biologi på
gymnasieniveau. Statiske HTML-sider, ingen build, ingen framework — hostet på
GitHub Pages (`CNAME` → smbi.dk). Alt indhold er på **dansk**, også kommentarer,
commit-beskeder og variabelnavne i nyere filer.

## Sådan ser man en side

```bash
python3 -m http.server 8777       # og åbn http://localhost:8777/...
```

Sider linker til `/geografi.html`, `/contact.html` osv. med rod-relative stier,
så de kun virker rigtigt over en server — ikke via `file://`.

---

@design_rules.md

## Commits

Danske, i bydeform, med en kort forklarende krop når ændringen er stor. Fx:
`Stigningsregn i sidens nye design: samme model, pænere ramme`.
