# Plan podróży po Japonii — instrukcja edycji

Cały plan jest w jednym pliku `index.html` — dane, styl i logika renderowania.
Treść planu to blok tekstowy parsowany przez JS na sekcje, dni i punkty harmonogramu.

## Struktura sekcji

Sekcje rozdzielone nagłówkami `###` (META, TERMINY, WAZNE, PAKOWANIE, JEDZENIE, ZAKUPY, ROZMOWKI, PLAN, CIEKAWOSTKI). Renderowane jako zakładki w UI.

## Terminy (sekcja TERMINY, zakładka Terminy)

Jedna lista łącząca rezerwacje (z checkboxem) i zwykłe wydarzenia/przypomnienia (bez checkboxa) — dopasowanie na jednym wspólnym modelu danych (`D.items`, pole `kind:'res'|'evt'`), posortowana po dacie przy renderze.

```
DATA | TYTUŁ | KRÓTKI_KONTEKST | OPCJONALNE_SZCZEGÓŁY
```

- `DATA` — ISO `YYYY-MM-DD`, decyduje o pozycji na liście i o etykiecie czasu ("za X dni" itd.)
- `TYTUŁ` — z emoji na początku
- `KRÓTKI_KONTEKST` — krótka linijka pod tytułem (np. termin wizyty/dnia planu)
- `OPCJONALNE_SZCZEGÓŁY` (4. pole) — **jeśli obecne**, wpis renderuje się jako rezerwacja: checkbox do odhaczenia + rozwijane „Szczegóły i link potwierdzenia" z tą treścią. **Jeśli nieobecne** (tylko 3 pola), wpis to zwykłe wydarzenie na osi czasu, bez checkboxa.

Przykład (rezerwacja z checkboxem):
```
2026-07-05 | 🏯 Zamek Matsumoto — bilet online | Wizyta sob 8.08 ~10:00 | Bilet z datownikiem online 1 200 ¥...
```
Przykład (wydarzenie bez checkboxa):
```
2026-07-30 | ✈️ Start podróży — wylot z Polski | Początek przygody! Wylot z Krakowa 11:20...
```

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

⚠️ **Segment `🕐` musi być OSTATNIĄ rzeczą w opisie.** `fmtNote()` nie ma ogranicznika końca — owija wszystko od pierwszego `🕐` do końca opisu w `<span class="hrs">` (turkus + pogrubienie = „twarde ograniczenie czasowe"). Zdanie dopisane po godzinach zostanie pomalowane jak godziny otwarcia i rozmyje ten sygnał.

```
- 16:15 | 🛕 Byōdō-in | ... 700 ¥. Wnętrze pawilonu odpuszczamy. 🕐 Teren do 17:30. | Byodo-in Temple, Uji   ✅
- 16:15 | 🛕 Byōdō-in | ... 700 ¥. 🕐 Teren do 17:30. Wnętrze pawilonu odpuszczamy. | Byodo-in Temple, Uji   ❌
```

Test (konsola przeglądarki) — powinien zwrócić pustą tablicę:

```js
[...document.querySelectorAll('.sr')].filter(e=>{const h=e.querySelector('.hrs');
return h&&/\.\s+[A-ZŻŹĆĄŚĘŁÓŃ]/.test(h.textContent.replace(/^🕐\s*/,''))})
.map(e=>e.dataset.tm+' '+e.querySelector('.hrs').textContent)
```

Części (parts): 1 = Kioto/Osaka/Nara, 2 = Alpy/Nagano, 3 = Tokio.

### Warianty dnia A/B (rozwidlenia)

Dni, które rozgrywa się na dwa sposoby (pogoda, upał, poziom sił), mają przełącznik z przyciskami. Wybór zapisuje się w `localStorage` (`jp26_variant`), `'ALL'` = pokaż oba warianty naraz z badge'ami A/B.

Deklaracja w bloku dnia, **zaraz pod linią opisu dnia**:

```
? ⚖️ Wariant dnia — kiedy i na jakiej podstawie zapada decyzja.     ← nagłówek (linia bez „ | ")
? A | 🌿 Etykieta | Krótki opis wariantu | Kiedy go wybrać
? B* | 🍣 Etykieta | Krótki opis wariantu | Kiedy go wybrać
```

- `*` przy kluczu = wariant domyślny (bez gwiazdki domyślny jest pierwszy)
- Klucz to jedna wielka litera (`A`, `B`, …)

Punkt należący do wariantu dostaje prefiks przed czasem:

```
- A> 12:05 | 🏯 Kenroku-en | Opis... | Kenrokuen Garden, Kanazawa
- B> 12:05 | 🍣 Omicho Market | Opis... | Omicho Market, Kanazawa
- 17:35 | 🚗 Wyjazd do Takayamy | Punkt bez prefiksu = wspólny dla obu wariantów
```

**Zasady pisania rozwidleń:**
1. Punkty **wspólne** (bez prefiksu) muszą mieć czas identyczny w obu wariantach. Jeśli po rozwidleniu godzina się rozjeżdża (np. przyjazd 15:20 vs 14:35) — punkt trzeba zduplikować do obu gałęzi, a nie zostawiać jako wspólny.
2. W źródle pisz **całą gałąź A, potem całą gałąź B**. W obrębie jednej gałęzi czasy muszą rosnąć — dzięki temu po wybraniu wariantu oś czasu jest chronologiczna.
3. Każdy wariant musi mieć wypełnione pole „kiedy go wybrać" — to jest realne kryterium decyzji w terenie, nie ozdobnik.

**Ciekawostki dla punktów wariantowych** — pole czasu przyjmuje ten sam prefiks, a kilka punktów naraz rozdziela się średnikiem:

```
D2 | A>16:00; B>6:00 | 🎭 | Skok z Kiyomizu | Ta sama ciekawostka przykleja się do Kiyomizu w obu wariantach, mimo różnych godzin.
D6 | A>12:05 | ⚡ | Poke-studzienka Milotic | Tylko w wariancie A (Kenroku-en).
```

Dni z wariantami: **2** (klasyczny / odwrócony pod upał), **6** (ogród / targ), **9** (wasabi / Tsugaike), **17** (muzeum / Yanaka), **18** (baza+Shibuya / Odaiba).

⚠️ Tabele `DAYS` i `BUDGET` mają **jeden wiersz na dzień** i nie znają wariantów — wartości odpowiadają wariantowi domyślnemu.

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
- Ikony: `💡` = praktyczna porada, `🎭` = historia/kultura, `📖` = legenda/opowieść, `⚡` = Pokémon (sklepy Pokémon Center i poke-studzienki Pokéfuta na trasie — pod kątem Michała/Pokémon GO), `⚙️` = inżynieria/architektura (Kuba jest inżynierem, syn w technikum — te wpisy mają mieć konkretne liczby: rozpiętości, masy, głębokości, zasada działania, a nie ogólniki „imponująca budowla")
- Treść — jeden ciągły akapit, bez łamania linii

⚠️ **Przed dodaniem ciekawostki sprawdź, co już wisi na tym punkcie** — inaczej łatwo o duplikat (zdarzyło się przy KIX i Skytree). Test w konsoli:

```js
(d,tm)=>D.tips.filter(t=>t.day===d&&(t.keys||[]).some(k=>k.tm===tm)).map(t=>t.icon+' '+t.ti)
```

Kilka ciekawostek na jednym punkcie jest OK i częste — ale każda musi brać inny kąt (np. D14 13:30: `🎭` liczba 634 i podświetlenie, `⚙️` tłumienie centralnym słupem).

**Po każdej zmianie harmonogramu** sprawdź, czy czasy istniejących ciekawostek nadal pasują do punktów. Jeśli punkt się przesunął — zaktualizuj czas ciekawostki. Dodaj nowe ciekawostki do nowych/zmienionych punktów tam, gdzie pasują.

Szybki test „osieroconych" ciekawostek (wklej w konsoli przeglądarki na otwartej stronie) — powinien zwrócić pustą tablicę:

```js
(()=>{const days={};D.parts.flatMap(p=>p.days).forEach(d=>{const m=d.lb.match(/\d+/);if(m)days[m[0]]=d});
const orphan=[];D.tips.forEach(t=>(t.keys||[]).forEach(k=>{const d=days[t.day];
if(d&&!d.sc.some(s=>s.tm===k.tm&&(s.v||'')===(k.v||'')))orphan.push('D'+t.day+' '+(k.v?k.v+'>':'')+k.tm+' :: '+t.ti)}));return orphan})()
```

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
