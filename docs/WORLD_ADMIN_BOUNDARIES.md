# Dünya idari sınırları — veri kaynakları ve lisanslar

Bu oyun için hedef, ülkeleri (ADM0), birinci seviye idari birimleri (ADM1: eyalet/il/bölge) ve gerektiğinde ikinci seviye birimleri (ADM2: ilçe/ county) ayrı stratejik alanlar olarak kullanmaktır. Her ülkenin idari yapısı aynı değildir; ADM1 ve ADM2 isimleri ülkeye göre değişebilir.

## Önerilen ana kaynak: geoBoundaries gbOpen

- Proje: https://www.geoboundaries.org/
- API belgeleri: https://www.geoboundaries.org/api
- API biçimi: `https://www.geoboundaries.org/api/current/gbOpen/{ISO3}/{ADM_LEVEL}/`
- Küresel katalog: `https://www.geoboundaries.org/api/current/gbOpen/ALL/{ADM_LEVEL}/`
- Kapsam: 234 ISO kodu için metadata; ADM0–ADM5, ülkeye göre değişen kapsama; GeoJSON ve TopoJSON indirmeleri.
- Lisans yaklaşımı: gbOpen, atıf şartıyla CC BY 4.0 uyumlu açık veri koleksiyonudur. API her sınır için kaynak, temsil edilen yıl, orijinal lisans ve lisans notlarını da sunar. Her indirilen dosyanın metadata'sı korunmalı ve atıf bilgisi kaybolmamalıdır.
- Oyun kullanımı: ülke bazında dosya indirme ve gerektiğinde basitleştirilmiş geometri kullanma. Küresel tek GeoJSON dosyasını doğrudan Canvas'a yüklemek yerine ülke/zoom bazında yükleme yapılmalı.

**Önemli:** Sınır verileri farklı kurumların farklı yıllardaki kaynaklarından derlenir. Ülkelerin ADM1/ADM2 sayısı ve güncelliği eşit değildir. Sınır çizgileri oyun amaçlıdır; hukuki/kadastro doğruluğu iddiası taşımaz. Tartışmalı alanların temsili için kaynakların kendi tanımları korunmalı, tek bir siyasi yorum gerçekmiş gibi sabitlenmemelidir.

## Alternatif: Terrae — OSM tabanlı, hiyerarşisi tutarlı dünya bölümleri

- Proje ve yöntem: https://github.com/terraecore/world-administrative-boundaries
- İndirici: https://terraecore.github.io/world-administrative-boundaries/
- Veri deposu: https://huggingface.co/buckets/geodataset/terrae
- Sürüm sayfasında belirtilen kapsam: 255 ADM0, 3.907 ADM1, 50.231 ADM2; 2026.10.
- GeoPackage, WGS84; dünya veya ülke bazında, dört ayrıntı düzeyi.
- Lisans: Open Database License 1.0 (ODbL). Atıf ve türetilmiş veritabanı paylaşım koşulları vardır. OSM türevi veriyi geoBoundaries/CC BY verisiyle tek bir türetilmiş veritabanında birleştirmeden önce ODbL yükümlülükleri değerlendirilmelidir.

Terrae özellikle komşulukların ve ADM0→ADM1→ADM2 iç içeliğinin tutarlı olması için iyi bir karşılaştırma/QA kaynağıdır. Web oyunu için GeoPackage'ı doğrudan kullanmak yerine ülke bazlı GeoJSON/TopoJSON dışa aktarımı veya sunucu tarafında dönüştürme gerekir.

## Hafif dünya görünümü: Natural Earth

- Kaynak: https://www.naturalearthdata.com/downloads/
- Ülkeler (ADM0), eyaletler/iller (ADM1) ve yerleşim noktaları bulunur.
- Küçük, genelleştirilmiş harita geometrileri; dünya görünümünde hızlı çizim için uygundur.
- Kamu malı olarak yayımlanır. Bu projedeki mevcut dünya ülke sınırları ayrıca geojson-atlas üzerinden CC0 1.0 olarak belgelenmiştir.
- 1:110m ölçekli ADM1 katmanı ayrıntılı fetih haritası için yeterli değildir; sadece küçük ölçekli dünya görünümü/fallback olarak kullanılmalıdır.

## Yardımcı kaynaklar

| Kaynak | Kullanım | Lisans / dikkat |
|---|---|---|
| OSM / Geofabrik | Ülke bazlı güncel OSM çıkarımları ve idari poligonlar | ODbL 1.0; hiyerarşi ve deniz alanları için ön işleme gerekebilir |
| Overture Maps — Admins | Büyük ölçekli yerleşim ve idari birim referansları | CDLA-Permissive v2; OSM'den türeyen bölümler ODbL olabilir |
| UNICEF GeoRepo | İnsani yardım/ülke operasyonlarında standartlaştırılmış ADM0–ADM4 sınırları | Erişim ve veri seti koşulları ülkeye/veri setine göre doğrulanmalı; bazı indirmeler hesap gerektirir |
| GTAmap | 2000–2025/26 yılları için zaman serili ADM0–ADM2, kaynak ve güven seviyesi | Her veri seti için kendi lisans ve kaynak alanları doğrulanmalı |

Bağlantılar:
- Geofabrik: https://download.geofabrik.de/ ve https://www.geofabrik.de/en/data/admin-polygons.html
- Overture: https://overturemaps.org/ ve https://docs.overturemaps.org/
- UNICEF GeoRepo: https://github.com/unicef-drp/georepo-data
- GTAmap: https://gtamapdata.org/download

## İçe aktarma

Node.js 18+ ile harici paket kurmadan:

```bash
node scripts/download-admin-boundaries.mjs --levels=ADM1,ADM2 --detail=simplified
```

Belirli ülkeler için:

```bash
node scripts/download-admin-boundaries.mjs --iso=TUR,USA,DEU,FRA --levels=ADM1,ADM2
```

İndirilenler `data/admin-boundaries/{ADM_LEVEL}/{ISO3}.geojson` altında, kaynak/lisans/yıl bilgileri ise `data/admin-boundaries/manifest.json` içinde tutulur. Büyük veri indirmeleri bilinçli olarak Git'e otomatik eklenmez; dosya boyutları ve kaynak lisansları kontrol edildikten sonra sürümlenmelidir.

## Oyun mimarisi için karar

1. Dünya görünümü: mevcut hafif ADM0 geometrisi.
2. Ülke seçildiğinde: o ülkenin ADM1 katmanını yükle.
3. Bir il/eyalet seçildiğinde: gerekiyorsa o birimin ADM2 alt birimlerini yükle.
4. Harita verisinden oyun sahipliği, garnizon, ekonomi, ikmal ve savaş durumunu ayrı tut. Kaynak GeoJSON hiçbir zaman oyun state'inin kendisi olmamalı.
5. Her feature için sabit bir oyun kimliği üret: `ISO3:ADM_LEVEL:boundaryID`; adlar ve idari hiyerarşi kaynak metadata'sından türetilmeli.
6. Veri lisansı, kaynak atfı, kaynak yılı, build sürümü ve checksum manifestte korunmalı.
