# Persoshift

Personal Development Website

## Historische Kursdaten

Im Rechner kann zwischen einem **Vergleich** und der Anzeige einer
**Historischen Entwicklung** gewechselt werden. Für die historische Ansicht
können CSV-Dateien oder manuell eingefügte Daten verwendet werden. Das Format
ist simpel:

```
Jahr,Preis
2018,100
2019,110
2020,95
```

Quellen für solche Datensätze sind beispielsweise
[stooq.com](https://stooq.com) für ETFs oder
[CoinGecko](https://www.coingecko.com/de) für Kryptowährungen.

## License

This project is licensed under the [MIT License](LICENSE).


Persoshift is a simple personal development and finance tool. The main page `index.html` provides an ETF savings plan calculator with charts and information pop-ups.

## Features
- Interactive ETF savings plan calculator
- Monthly contributions with optional annual increases
- Add one-time deposits and configure payout plans
- Net vs. gross calculations with German capital gains tax support
- Charts comparing ETF performance to a savings account
- Info modals explaining ETFs, taxes and related topics

## Getting Started
Clone the repository and open or serve `index.html`.

```bash
git clone https://github.com/mahodesin/Persoshift.git
cd Persoshift
```

### Running via HTTP server
Serving the file avoids browser security warnings. The example below uses Python:

```bash
python3 -m http.server
```

Open `http://localhost:8000/index.html` in your browser.

### Direct browser open
You can also double-click `index.html` to open it directly. Some browsers may restrict local scripts, so running a web server is recommended.

## Usage
1. Fill in start capital, monthly rate, investment years and interest rate.
2. Expand **Erweiterte Optionen** to configure rate increases, lump-sum payments, or withdrawals.
3. Click **Berechnen (Brutto)** for calculations without tax or **Berechnen (Netto)** to include tax.
4. Review the generated charts and comparison to a savings account.

## Contributing
Contributions are welcome! Feel free to open issues or submit pull requests.

## Support
If you run into problems or have questions, open an issue on GitHub.


