// ============================================
// PersoShift – Data (Constants, Defaults, Texts)
// ============================================

// Default values for resetting
var DEFAULT_MONTHLY_RATE = 100;
var DEFAULT_YEARS = 40;
var DEFAULT_INTEREST_PRESET = "7.6";
var DEFAULT_FREIBETRAG = 1000;
var DEFAULT_STEUERSATZ = 26.375;
var DEFAULT_ETF_TYPE = "thesaurierend";
var DEFAULT_BASISZINS = 2.29;
var DEFAULT_RATE_INCREASE = 0;
var DEFAULT_CURRENCY = 'EUR';

// Chart colors
var CAPITAL_COLOR = 'rgba(52, 152, 219, 0.8)';
var GAIN_COLOR = 'rgba(243, 156, 18, 0.8)';
var ANNUAL_PAYOUT_COLOR = 'rgba(39, 174, 96, 0.8)';
var TAX_COLOR_DIAGRAM = 'rgba(231, 76, 60, 0.7)';
var COMPARE_COLORS = {
  etf: 'rgba(46,204,113,0.8)',
  tagesgeld: 'rgba(52,152,219,0.8)',
  bank: 'rgba(149,165,166,0.8)',
  bitcoin: 'rgba(247,147,26,0.8)',
  ethereum: 'rgba(98,126,234,0.8)'
};

// Currency label mapping
var labelTexts = {
  'start': 'Startkapital',
  'rate': 'Monatsrate',
  'freibetrag': 'Jährlicher Freibetrag',
  'lumpsum': 'Einmalige Einzahlung',
  'payout': 'Einmalige Auszahlung',
  'payoutPlanAmount': 'Auszahlplan Betrag'
};

// Modal content
var modalData = {
  modalSP500: { title: "Was ist der S&P 500?", content: '<p>Der S&P 500 ist ein Aktienindex, der die 500 größten börsennotierten US-Unternehmen abbildet. Er gilt als wichtiger Indikator für den US-Aktienmarkt.</p><h3>Durchschnittliche Jahresrendite (p.a.)</h3><p>Historisch lag die durchschnittliche Rendite bei ca. <strong>10% pro Jahr</strong> vor Inflation.</p><p><strong>Wichtig:</strong> Vergangene Renditen sind keine Garantie für zukünftige Ergebnisse. Der Wert kann schwanken.</p><p>Ein bekannter ETF ist der iShares Core S&P 500 UCITS ETF (<strong>ISIN: IE00B5BMR087</strong>).</p>' },
  modalMSCIWorld: { title: "Was ist der MSCI World?", content: '<p>Der MSCI World ist ein globaler Aktienindex, der ca. 1.500 Unternehmen aus 23 Industrieländern umfasst. Er bietet eine breite internationale Streuung.</p><h3>Durchschnittliche Jahresrendite (p.a.)</h3><p>Langfristig lag die durchschnittliche Rendite bei ca. <strong>7-9% pro Jahr</strong> vor Inflation.</p><p><strong>Wichtig:</strong> Auch hier sind vergangene Werte keine Garantie für die Zukunft und Schwankungen sind normal.</p><p>Ein bekannter ETF ist der iShares Core MSCI World UCITS ETF (<strong>ISIN: IE00B4L5Y983</strong>).</p>' },
  modalMonthlyRate: { title: "Wieviel soll ich investieren?", content: '<p><strong>Wichtig ist: Regelmäßigkeit schlägt Höhe.</strong></p><p>Ein monatlicher ETF-Sparplan ab z.B. 100 € ist oft besser als gar nichts – und lässt sich jederzeit anpassen.</p><p>Eine gängige Faustregel ist, <strong>10-15% des Nettoeinkommens</strong> für die Altersvorsorge zu investieren.</p>' },
  modalTaxInfo: { title: "Information zur Kapitalertragsteuer", content: '<p>In Deutschland unterliegen Kapitalerträge der Abgeltungsteuer.</p><p>Der Satz von <strong>26,375%</strong> setzt sich zusammen aus:</p><ul><li>25% Abgeltungsteuer</li><li>+ 5,5% Solidaritätszuschlag (= 1,375%)</li></ul><p>Der <strong>Sparer-Pauschbetrag</strong> von 1.000 € pro Person kann angerechnet werden.</p>' },
  modalEtfTypeInfo: { title: "ETF-Typen: Thesaurierend vs. Ausschüttend", content: '<h4>Thesaurierende ETFs:</h4><p>Erträge werden automatisch wiederangelegt. Stärkerer Zinseszinseffekt. Jährlich wird eine <strong>Vorabpauschale</strong> besteuert.</p><h4>Ausschüttende ETFs:</h4><p>Erträge werden direkt ausgezahlt und im Zuflussjahr versteuert.</p>' },
  modalBasiszinsInfo: { title: "Was ist der Basiszins?", content: '<p>Der Basiszins wird von der Bundesbank festgelegt und ist Grundlage der <strong>Vorabpauschale</strong>.</p><p>Formel: <em>Fondswert zu Jahresbeginn × Basiszins × 0,7</em></p><p>Für 2024: <strong>2,29%</strong></p>' },
  modalVerkaufsteuerInfo: { title: "Verkaufsteuer bei Thesaurierenden ETFs", content: '<p>Schätzung der Steuer bei Verkauf des gesamten Depots am Laufzeitende.</p><p>Berechnet auf den noch nicht durch Vorabpauschalen versteuerten Gewinn.</p>' },
  modalFreibetragInfo: { title: "Jährlicher Freibetrag", content: '<p>Der <strong>Sparer-Pauschbetrag</strong>:</p><ul><li>Einzelpersonen: <strong>1.000 € pro Jahr</strong></li><li>Zusammenveranlagte: <strong>2.000 € pro Jahr</strong></li></ul><p>Nur Erträge über diesem Betrag werden versteuert.</p>' },
  modalSteuersatzInfo: { title: "Steuersatz", content: '<p>Standardsatz: <strong>26,375%</strong> (25% Abgeltungsteuer + 5,5% Soli).</p><p>Bei Kirchensteuerpflicht erhöht sich der Satz. Hier manuell anpassbar.</p>' },
  modalDateTypeInfo: { title: "Laufjahr vs. Kalenderjahr", content: '<h4>Laufjahr</h4><p>Jahr 5 = das fünfte Jahr nach Investitionsstart.</p><h4>Kalenderjahr</h4><p>Ein spezifisches Kalenderjahr (z.B. 2035). Erfordert Start-Kalenderjahr.</p>' }
};
