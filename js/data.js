// PersoShift – Data
var DEFAULT_MONTHLY_RATE = 100;
var DEFAULT_YEARS = 30;
var DEFAULT_INTEREST_PRESET = "7.6";
var DEFAULT_FREIBETRAG = 1000;
var DEFAULT_STEUERSATZ = 26.375;
var DEFAULT_ETF_TYPE = "thesaurierend";
var DEFAULT_BASISZINS = 2.29;
var DEFAULT_RATE_INCREASE = 0;
var DEFAULT_CURRENCY = 'EUR';
var CAPITAL_COLOR = 'rgba(52, 152, 219, 0.8)';
var GAIN_COLOR = 'rgba(243, 156, 18, 0.8)';
var ANNUAL_PAYOUT_COLOR = 'rgba(39, 174, 96, 0.8)';
var TAX_COLOR_DIAGRAM = 'rgba(231, 76, 60, 0.7)';
var COMPARE_COLORS = { etf:'rgba(46,204,113,0.8)', tagesgeld:'rgba(52,152,219,0.8)', bank:'rgba(149,165,166,0.8)', bitcoin:'rgba(247,147,26,0.8)', ethereum:'rgba(98,126,234,0.8)' };
var labelTexts = { 'start':'Startkapital', 'rate':'Monatsrate', 'freibetrag':'Jährlicher Freibetrag', 'lumpsum':'Einmalige Einzahlung', 'payout':'Einmalige Auszahlung', 'payoutPlanAmount':'Auszahlplan Betrag' };
var modalData = {
  modalSP500:{title:"Was ist der S&P 500?",content:'<p>Der S&P 500 ist ein Aktienindex der 500 größten US-Unternehmen. Historisch ca. <strong>10% p.a.</strong> Rendite.</p><p>ETF: iShares Core S&P 500 (<strong>IE00B5BMR087</strong>)</p>'},
  modalMSCIWorld:{title:"Was ist der MSCI World?",content:'<p>Globaler Index mit ca. 1.500 Unternehmen aus 23 Ländern. Historisch ca. <strong>7-9% p.a.</strong></p><p>ETF: iShares Core MSCI World (<strong>IE00B4L5Y983</strong>)</p>'},
  modalMonthlyRate:{title:"Wieviel investieren?",content:'<p><strong>Regelmäßigkeit schlägt Höhe.</strong> Ein Sparplan ab 100 € ist besser als nichts. Faustregel: <strong>10-15% des Nettoeinkommens</strong>.</p>'},
  modalTaxInfo:{title:"Kapitalertragsteuer",content:'<p><strong>26,375%</strong> = 25% Abgeltungsteuer + 5,5% Soli. Sparer-Pauschbetrag: 1.000 €/Person.</p>'},
  modalEtfTypeInfo:{title:"Thesaurierend vs. Ausschüttend",content:'<h4>Thesaurierend:</h4><p>Erträge werden wiederangelegt. Jährlich Vorabpauschale.</p><h4>Ausschüttend:</h4><p>Erträge werden ausgezahlt und sofort versteuert.</p>'},
  modalBasiszinsInfo:{title:"Basiszins",content:'<p>Grundlage der Vorabpauschale: <em>Fondswert × Basiszins × 0,7</em>. Für 2024: <strong>2,29%</strong></p>'},
  modalVerkaufsteuerInfo:{title:"Verkaufsteuer",content:'<p>Geschätzte Steuer bei Verkauf am Laufzeitende, abzgl. bereits gezahlter Vorabpauschalen.</p>'},
  modalFreibetragInfo:{title:"Freibetrag",content:'<p>Einzelpersonen: <strong>1.000 €</strong>, Zusammenveranlagte: <strong>2.000 €</strong> pro Jahr steuerfrei.</p>'},
  modalSteuersatzInfo:{title:"Steuersatz",content:'<p>Standard: 26,375%. Bei Kirchensteuer höher. Hier anpassbar.</p>'},
  modalDateTypeInfo:{title:"Laufjahr vs. Kalenderjahr",content:'<p><strong>Laufjahr:</strong> Jahr 5 = fünftes Jahr nach Start.<br><strong>Kalenderjahr:</strong> z.B. 2035.</p>'}
};
