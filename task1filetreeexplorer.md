# Zadanie rekrutacyjne: FileTree Explorer

## Wymagania techniczne

- React 18+
- TypeScript (strict mode)
- React Router v6
- Vite (rekomendowany)
- Node.js 18+
- Stylowanie dowolne (Tailwind, CSS Modules, styled-components itp.)

---

## Kontekst

Budujesz moduł do wewnętrznego narzędzia developerskiego. Użytkownik wkleja lub wgrywa plik JSON reprezentujący strukturę katalogów, a aplikacja wizualizuje ją i umożliwia nawigację.

Format wejściowy:

```json
{
  "name": "root",
  "type": "folder",
  "children": [
    {
      "name": "src",
      "type": "folder",
      "children": [
        { "name": "index.ts", "type": "file", "size": 1024 },
        {
          "name": "components",
          "type": "folder",
          "children": [
            { "name": "Button.tsx", "type": "file", "size": 512 }
          ]
        }
      ]
    },
    { "name": "package.json", "type": "file", "size": 300 }
  ]
}
```

Struktura może być dowolnie głęboko zagnieżdżona.

---

## Wymagania funkcjonalne

### Widoki (React Router)

| Ścieżka | Opis |
|---|---|
| `/` | Strona główna z polem do wklejenia lub wgrania JSON |
| `/tree` | Widok drzewa z możliwością rozwijania i zwijania folderów |
| `/tree/:nodePath` | Szczegóły węzła, gdzie `nodePath` to zakodowana ścieżka, np. `src/components/Button.tsx` |

### Widok szczegółów pliku

- Nazwa
- Rozmiar (formatowany jako B / KB / MB)
- Pełna ścieżka od roota

### Widok szczegółów folderu

- Nazwa
- Liczba bezpośrednich dzieci
- Całkowity rozmiar wszystkich plików w podrzewie
- Lista dzieci z linkami

### Wyszukiwanie

Wyszukiwanie po nazwie przeszukujące całe drzewo z wyświetlaniem pełnej ścieżki każdego wyniku. Wyniki wyszukiwania powinny być odporne na odświeżenie strony.

---

## Deliverable

Repozytorium GitHub z działającą aplikacją:

```bash
npm install && npm run dev
```

README powinno zawierać:

- opis podjętych decyzji architektonicznych
- co zostałoby zrobione przy większej ilości czasu
- znane ograniczenia
