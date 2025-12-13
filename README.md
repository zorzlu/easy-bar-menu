# Menu del Giorno - Sito Web Statico

Un sito web statico per visualizzare il "menu del giorno" di un bar, con i dati provenienti da un foglio Google Sheets pubblicato come CSV.

## Caratteristiche

- 📱 **Mobile-first**: Ottimizzato per la visualizzazione su smartphone
- 🌐 **Multilingua**: Supporto italiano/inglese con fallback automatico
- 🔄 **Aggiornamento intelligente**: Il menu si aggiorna quando torni sulla pagina
- ⚠️ **Gestione allergeni**: 14 allergeni con icone e filtro di esclusione
- 🌿 **Filtri dietetici**: Filtra per Tutti, Vegetariano o Vegano
- 🍽️ **Due menu**: Supporto per menu "Cucina" e "Bar" separati
- 🚀 **Nessun framework**: Solo HTML, CSS e JavaScript vanilla
- 📊 **Dati da Google Sheets**: Facile gestione tramite foglio di calcolo

---

## Configurazione

### 1. Creare il Foglio Google Sheets

1. Vai su [Google Sheets](https://sheets.google.com) e crea un nuovo foglio
2. Nomina il foglio, ad esempio "Menu Bar"
3. Inserisci le intestazioni nella **prima riga** (vedi schema sotto)

### 2. Schema delle Colonne (Headers)

La prima riga deve contenere esattamente queste intestazioni (in italiano):

#### Colonne Obbligatorie

| Colonna | Tipo | Descrizione |
|---------|------|-------------|
| `categoria` | Testo | Categoria del piatto (es. "Panini", "Cucina", "Cocktail") |
| `nome_it` | Testo | Nome del piatto in italiano |
| `descrizione_it` | Testo | Descrizione in italiano (opzionale) |
| `prezzo` | Numero | Prezzo in Euro (accetta sia `6,50` che `6.50`) |
| `tipo` | Testo | Tipo di piatto: `standard`, `vegetariano`, o `vegano` |
| `attivo` | Checkbox | Seleziona per mostrare il piatto nel menu |

> ⚠️ **Nota**: La colonna `valuta` non è più necessaria. Tutti i prezzi sono in Euro (€).

#### Colonne Opzionali per Ordinamento

| Colonna | Tipo | Descrizione |
|---------|------|-------------|
| `ordine_categoria` | Numero | Ordine di visualizzazione della categoria |
| `ordine_prodotto` | Numero | Ordine del piatto dentro la categoria |
| `ultimo_aggiornamento` | Testo | Data/ora ultimo aggiornamento (mostrata nel sito) |

#### Colonne Opzionali per Inglese

| Colonna | Tipo | Descrizione |
|---------|------|-------------|
| `nome_en` | Testo | Nome in inglese (fallback: italiano) |
| `descrizione_en` | Testo | Descrizione in inglese (fallback: italiano) |

#### Colonne Allergeni (TRUE/FALSE)

Aggiungi una colonna per ogni allergene utilizzando **checkbox** (caselle di controllo):

| Colonna | Allergene | Icona |
|---------|-----------|-------|
| `all_1_glutine` | Glutine | 🌾 |
| `all_2_crostacei` | Crostacei | 🦐 |
| `all_3_uova` | Uova | 🥚 |
| `all_4_pesce` | Pesce | 🐟 |
| `all_5_arachidi` | Arachidi | 🥜 |
| `all_6_soia` | Soia | 🫘 |
| `all_7_latte` | Latte | 🥛 |
| `all_8_frutta_a_guscio` | Frutta a guscio | 🌰 |
| `all_9_sedano` | Sedano | 🥬 |
| `all_10_senape` | Senape | 🟡 |
| `all_11_sesamo` | Sesamo | 🫛 |
| `all_12_solfiti` | Solfiti | 🍷 |
| `all_13_lupini` | Lupini | 🌸 |
| `all_14_molluschi` | Molluschi | 🐚 |

---

### 3. Tipi di Piatto

La colonna `tipo` determina come viene mostrato il piatto:

| Valore | Descrizione | Badge |
|--------|-------------|-------|
| `standard` | Piatto normale (carne, pesce, ecc.) | Nessun badge |
| `vegetariano` | Senza carne, può contenere latticini/uova | 🌿 Vegetariano |
| `vegano` | Senza prodotti animali | 🌱 Vegano |

> 💡 **Logica del filtro**: 
> - "Tutti" mostra tutto
> - "Vegetariano" mostra vegetariano + vegano
> - "Vegano" mostra solo vegano

---

### 4. Riga di Esempio

```csv
categoria,nome_it,descrizione_it,prezzo,tipo,attivo,ordine_categoria,ordine_prodotto,nome_en,descrizione_en,all_1_glutine,all_3_uova,all_7_latte
Primi,Pasta al Pomodoro,Spaghetti con salsa fresca,9.00,vegano,TRUE,1,1,Tomato Pasta,Fresh tomato sauce,TRUE,FALSE,FALSE
Secondi,Insalata Caprese,Mozzarella e pomodoro,10.00,vegetariano,TRUE,2,1,Caprese Salad,Mozzarella and tomato,FALSE,FALSE,TRUE
Dolci,Sorbetto Limone,Fresco e leggero,5.00,vegano,TRUE,3,1,Lemon Sorbet,Fresh and light,FALSE,FALSE,FALSE
```

---

### 5. Pubblicare il Foglio come CSV

1. Nel foglio Google Sheets, vai su **File** → **Condividi** → **Pubblica sul web**
2. Nella finestra che si apre:
   - Scegli il **foglio specifico** (non "Intero documento") se hai più fogli
   - Seleziona **CSV** come formato
3. Clicca su **Pubblica**
4. Copia l'URL generato

---

### 6. Configurare il Sito

1. Apri il file `app.js`
2. Trova la sezione `CONFIG` all'inizio del file:
   ```javascript
   const CONFIG = {
       cuisine: {
           url: "PASTE_CUISINE_CSV_URL_HERE", // URL per il menu Cucina
           name: "Cucina"
       },
       bar: {
           url: "PASTE_BAR_CSV_URL_HERE",     // URL per il menu Bar
           name: "Bar"
       }
   };
   ```
3. Incolla i due URL dei CSV pubblicati nei rispettivi campi.

> 💡 **Modalità offline**: Se non configuri gli URL, il sito usa i file `cuisine.csv` e `bar.csv` locali inclusi nel progetto.

---

## Funzionalità per gli Utenti

### Filtri Dietetici

Gli utenti possono filtrare il menu usando i pulsanti nella barra filtri:
- **Tutti**: Mostra tutti i piatti
- **Vegetariano**: Mostra solo piatti vegetariani e vegani
- **Vegano**: Mostra solo piatti vegani

### Esclusione Allergeni

1. Clicca sul pulsante **⚠️ Allergeni**
2. Seleziona gli allergeni da escludere
3. Clicca **Applica**
4. I piatti contenenti quegli allergeni verranno nascosti

Un badge rosso sul pulsante indica quanti allergeni sono esclusi.

---

## Ospitare su GitHub Pages

1. Crea un nuovo repository su GitHub
2. Carica i file del progetto:
   - `index.html`
   - `styles.css`
   - `app.js`
   - `cuisine.csv` (opzionale, per fallback)
   - `bar.csv` (opzionale, per fallback)
3. Vai in **Settings** → **Pages**
4. In "Source", seleziona:
   - Branch: `main`
   - Folder: `/ (root)`
5. Clicca **Save**

---

## Struttura File

```
menu-del-giorno/
├── index.html      # Pagina principale
├── styles.css      # Stili CSS
├── app.js          # Logica JavaScript
├── cuisine.csv     # Dati menu cucina (fallback locale)
├── bar.csv         # Dati menu bar (fallback locale)
└── README.md       # Questa documentazione
```

---

## Licenza

Questo progetto è rilasciato con licenza MIT.
