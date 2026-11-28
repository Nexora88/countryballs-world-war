# Countryballs: Sovereign

**v1.0.0 — MVP Complete**

Kişilik odaklı, web tabanlı, kurulumsuz Countryballs strateji oyunu.

## Özellikler

- **Özgün dünya haritası** — Detaylı kıta silüetleri (klon değil)
- **20 ülke**, her birinin Ulusal Karakteri var
- **Savaş sistemi** — Ordu gönder, güç hesabı, sonuçlar
- **Kişilikli AI** — Agresif / Diplomatik / Fırsatçı / İdeolojik / İzolasyonist
- **Ekonomi + yükseltmeler** (askeri, ekonomi, istikrar, teknoloji, nükleer)
- **Diplomasi** — İttifak, ticaret, tehdit, ateşkes
- **Cascade olaylar** — Müttefik katılımı, krizler
- **Nükleer** — Yüksek risk, dünya tepkisi
- **Ses** — Web Audio (savaş, ittifak, nükleer, bildirim)
- **Zafer koşulları** — Askeri / Ekonomik / Diplomatik / Teknolojik / Nükleer

## Dünya idari sınır verileri\n\nDünya genelindeki ADM1/ADM2 il, eyalet ve bölge sınırları için açık veri kaynakları, lisans notları ve indirme aracı: [WORLD_ADMIN_BOUNDARIES.md](docs/WORLD_ADMIN_BOUNDARIES.md). İndirme aracı Node.js 18+ ile çalışır: `node scripts/download-admin-boundaries.mjs --levels=ADM1,ADM2`.\n\n## Çalıştırma

```bash
npx serve .
```

Tarayıcıda aç → Yeni Oyun → Ülke seç → Oyna.

## Kontroller

- Ülkeye tıkla → panel
- Kendi ülkende: yatırımlar
- Diğer ülkelerde: diplomasi + savaş
- Hız butonları ile zamanı kontrol et

---

Özgün tasarım. Telifli oyunların klonu değildir.
