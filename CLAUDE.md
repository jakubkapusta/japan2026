# Plan podróży po Japonii — instrukcja edycji

Cały plan jest w jednym pliku `index.html` — dane, styl i logika renderowania.
Treść planu to blok tekstowy parsowany przez JS na sekcje, dni i punkty harmonogramu.

## Struktura sekcji

Sekcje rozdzielone nagłówkami `###` (META, REZERWACJE, WAZNE, PAKOWANIE, JEDZENIE, ROZMOWKI, ODLICZANIE, PLAN, CIEKAWOSTKI). Renderowane jako zakładki w UI.

### Części i dni (sekcja PLAN)

```
# Część 1: Kioto / Osaka / Nara        ← nagłówek części (part)
== Dzień 1 | pt 31.07 | Przylot + Gion | KABIN Minamiza, Kioto   ← nagłówek dnia
Opis dnia — wolny tekst, renderowany jako intro.                   ← linia pod nagłówkiem
- 9:00 | 🏯 Tytuł punktu | Opis. Szczegóły. | Nazwa na mapie      ← punkt harmonogramu
- 10:30 | 🍜 Lunch | Opis | Map Query Name
```

Format punktu harmonogramu: `- CZAS | EMOJI TYTUŁ | OPIS | OPCJONALNY_MAP_QUERY`
- Map query (po ostatnim `|`) — trafia do linku Google Maps (`maps/search/?api=1&query=...`)
- Emoji na początku tytułu to ikona punktu

Części (parts): 1 = Kioto/Osaka/Nara, 2 = Alpy/Nagano, 3 = Tokio.

## Ciekawostki (sekcja CIEKAWOSTKI)

Rozwijane detale przyczepiające się do punktów harmonogramu po dopasowaniu dnia i godziny.

```
DNUM | CZAS | IKONA | TYTUŁ | TREŚĆ
```

Przykład:
```
D11 | 9:15 | 🎭 | Jak małpy odkryły onsen | Jedyne miejsce na świecie...
D11 | 11:30 | 💡 | Piekarnia ponad chmurami | 横手山頂ヒュッテ to najwyżej...
```

- `DNUM` — numer dnia z prefiksem `D` (np. `D11`)
- `CZAS` — musi dokładnie zgadzać się z czasem punktu w harmonogramie, do którego ma się przykleić
- Ikony: `💡` = praktyczna porada, `🎭` = historia/kultura, `📖` = legenda/opowieść
- Treść — jeden ciągły akapit, bez łamania linii

**Po każdej zmianie harmonogramu** sprawdź, czy czasy istniejących ciekawostek nadal pasują do punktów. Jeśli punkt się przesunął — zaktualizuj czas ciekawostki. Dodaj nowe ciekawostki do nowych/zmienionych punktów tam, gdzie pasują.

## Tablica dystansów (zakładka Statystyki)

Tablica `DAYS` w JS (~linia 1150):

```js
{d:11, n:'Snow Monkey → Yokote-yama → Obuse', walk:5, metro:0, car:140, train:0, part:2},
```

- `d` — numer dnia
- `n` — krótka nazwa (wyświetlana w tabeli)
- `walk` — km pieszo (szacunek)
- `metro` — **minuty** metro/bus (uwaga: NIE km — tabela renderuje to jako „X min")
- `car` — km autem
- `train` — **minuty** pociągiem (uwaga: NIE km — tabela renderuje to jako „X min")
- `part` — 1/2/3 (część podróży, do kolorowania)

## Tablica budżetu (zakładka Budżet)

Tablica `BUDGET` w JS (~linia 1256):

```js
{d:11, n:'Snow Monkey → Yokote-yama → Obuse', t:0, e:2700, f:4000, o:1000, part:2},
```

- `t` — transport (¥)
- `e` — wejściówki/bilety (¥)
- `f` — jedzenie (¥)
- `o` — inne/zakupy (¥)
- `part` — 1/2/3

**Wszystkie kwoty są NA OSOBĘ w jenach (¥).** Kod mnoży ×3 automatycznie dla „cała trójka". Nie mnóż ×3 w danych.

Komentarz nad tablicą: `// Budżet — szacunki wydatków na miejscu, per dzień, na osobę (bez hoteli/lotów/auta)`

## Service worker (`sw.js`) — cache offline

`sw.js` cache'uje statyczne pliki do trybu offline. Tablica `CORE` musi zawierać dokładnie te pliki, które istnieją — `cache.addAll()` w evencie `install` failuje w całości, jeśli choćby jeden URL zwróci 404 (czyli service worker przestaje się instalować dla nowych/odwiedzających klientów).

**Zawsze gdy dodajesz/usuwasz/zmieniasz nazwę pliku w `img/` (albo innego pliku z `CORE`):**
1. Zaktualizuj listę `CORE` w `sw.js` tak, żeby 1:1 zgadzała się z plikami faktycznie obecnymi w repo i referencjami w `DAY_IMG` w `index.html`.
2. Podbij wersję `CACHE` (np. `japonia2026-v14` → `v15`) — inaczej przeglądarki z już zainstalowanym service workerem nie zobaczą zmiany i będą serwować starą, potencjalnie martwą listę z cache.

Szybka weryfikacja przed commitem:
```bash
grep -oP "img/day\d+-[^']*\.jpg" sw.js | sort -u
ls img/ | sed 's|^|img/|' | sort
# obie listy powinny być identyczne
```

## Checklist po zmianie planu dnia

1. Zaktualizuj harmonogram dnia (punkty `- CZAS | ...`)
2. Sprawdź i popraw czasy ciekawostek (`DNUM | CZAS`) — usuń nieaktualne, dodaj nowe
3. Zaktualizuj wiersz w `DAYS` — km pieszo/auto/pociąg
4. Zaktualizuj wiersz w `BUDGET` — wejściówki/transport (wartości na osobę w ¥)
5. Zaktualizuj nazwę dnia (`n:`) w obu tablicach
