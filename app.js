// ============================================
// PersoShift ETF-Rechner – Script (Dark Theme)
// ============================================

// --- Global Variables ---
let chartMain, chartCompare;
let currentMode = 'compare';
let loadedHistoricalRates = [];

// --- Default Values ---
const DEFAULT_MONTHLY_RATE = 100;
const DEFAULT_YEARS = 40;
const DEFAULT_INTEREST_PRESET = "7.6";
const DEFAULT_FREIBETRAG = 1000;
const DEFAULT_STEUERSATZ = 26.375;
const DEFAULT_ETF_TYPE = "thesaurierend";
const DEFAULT_BASISZINS = 2.29;
const DEFAULT_RATE_INCREASE = 0;
const DEFAULT_CURRENCY = 'EUR';

// --- Chart Colors (Dark Theme) ---
const CAPITAL_COLOR = 'rgba(108, 138, 255, 0.85)';
const GAIN_COLOR = 'rgba(251, 191, 36, 0.85)';
const ANNUAL_PAYOUT_COLOR = 'rgba(52, 211, 153, 0.85)';
const TAX_COLOR_DIAGRAM = 'rgba(248, 113, 113, 0.7)';
const COMPARE_COLORS = {
  etf: 'rgba(46, 204, 113, 0.85)',
  tagesgeld: 'rgba(52, 152, 219, 0.85)',
  bank: 'rgba(149, 165, 166, 0.7)',
  bitcoin: 'rgba(247, 147, 26, 0.85)',
  ethereum: 'rgba(98, 126, 234, 0.85)'
};

// --- Chart.js Global Defaults (Dark Theme) ---
Chart.defaults.font.family = "'DM Sans', sans-serif";
Chart.defaults.font.size = 12;
Chart.defaults.color = '#8b8fa6';
Chart.defaults.plugins.legend.position = 'bottom';
Chart.defaults.plugins.legend.labels.usePointStyle = true;
Chart.defaults.plugins.legend.labels.padding = 16;
Chart.defaults.maintainAspectRatio = false;
Chart.defaults.responsive = true;
Chart.defaults.scales = Chart.defaults.scales || {};

// --- DOM References ---
const advToggle = document.getElementById('advToggle');
const advBox = document.getElementById('advanced');
const currencyEl = document.getElementById('currency');
const rateEl = document.getElementById('rate');
const monthlyRateIncreaseEl = document.getElementById('monthlyRateIncrease');
const yearsEl = document.getElementById('years');
const startCalendarYearEl = document.getElementById('startCalendarYear');
const interestRatePresetEl = document.getElementById('interestRatePreset');
const interestCustomEl = document.getElementById('interestCustom');
const startEl = document.getElementById('start');
const warnEl = document.getElementById('warn');
const headlineEl = document.getElementById('headline');
const compareChartTitleEl = document.getElementById('compareChartTitle');
const etfTypeEl = document.getElementById('etfType');
const freibetragEl = document.getElementById('freibetrag');
const steuerSatzEl = document.getElementById('steuerSatz');
const basiszinsEl = document.getElementById('basiszins');
const taxRateDisplayEl = document.getElementById('taxRateDisplay');
const payoutYearTypeEl = document.getElementById('payoutYearType');
const stopMonthlyRateEnableEl = document.getElementById('stopMonthlyRateEnable');
const stopMonthlyRateYearContainerEl = document.getElementById('stopMonthlyRateYearContainer');
const stopMonthlyRateYearEl = document.getElementById('stopMonthlyRateYear');
const payoutPlanAmountEl = document.getElementById('payoutPlanAmount');
const payoutStartYearEl = document.getElementById('payoutStartYear');
const payoutIntervalEl = document.getElementById('payoutInterval');
const payoutIntervalDaysEl = document.getElementById('payoutIntervalDays');
const lumpsumEntriesContainer = document.getElementById('lumpsumEntriesContainer');
const oneTimePayoutEntriesContainer = document.getElementById('oneTimePayoutEntriesContainer');
const infoModal = document.getElementById('infoModal');
const modalTitleEl = document.getElementById('modalTitle');
const modalBodyEl = document.getElementById('modalBody');
const modalCloseBtns = document.querySelectorAll('[data-close-modal]');
const resetBtn = document.getElementById('resetBtn');
const chartAxisToggleEl = document.getElementById('chartAxisToggle');
const btnCalcMode = document.getElementById('btnCalculator');
const btnHistoricalMode = document.getElementById('btnHistorical');
const historicalOptionsEl = document.getElementById('historicalOptions');
const assetSelectEl = document.getElementById('assetSelect');
const assetStartYearEl = document.getElementById('assetStartYear');
const toggleWhyInvestBtn = document.getElementById('toggleWhyInvestBtn');
const whyInvestContent = document.getElementById('whyInvestContent');
const assetToggleEls = document.querySelectorAll('.asset-toggle');

// --- Currency Formatter ---
const fmt = (n, currency = 'EUR') => {
  const locales = { EUR: 'de-DE', USD: 'en-US', GBP: 'en-GB', JPY: 'ja-JP', AUD: 'en-AU' };
  return n.toLocaleString(locales[currency] || 'de-DE', {
    style: 'currency', currency, maximumFractionDigits: 0
  });
};

// --- Modal Data ---
const modalData = {
  modalSP500: {
    title: "Was ist der S&P 500?",
    content: `
      <p>Der S&P 500 ist ein Aktienindex, der die 500 größten börsennotierten US-Unternehmen abbildet.</p>
      <h4>Durchschnittliche Jahresrendite</h4>
      <p>Historisch ca. <strong>10% pro Jahr</strong> vor Inflation.</p>
      <p><strong>Wichtig:</strong> Vergangene Renditen sind keine Garantie für zukünftige Ergebnisse.</p>
      <p>Bekannter ETF: iShares Core S&P 500 UCITS ETF (<strong>ISIN: IE00B5BMR087</strong>)</p>`
  },
  modalMSCIWorld: {
    title: "Was ist der MSCI World?",
    content: `
      <p>Der MSCI World umfasst ca. 1.500 Unternehmen aus 23 Industrieländern – breite internationale Streuung.</p>
      <h4>Durchschnittliche Jahresrendite</h4>
      <p>Langfristig ca. <strong>7–9% pro Jahr</strong> vor Inflation.</p>
      <p>Bekannter ETF: iShares Core MSCI World UCITS ETF (<strong>ISIN: IE00B4L5Y983</strong>)</p>`
  },
  modalMonthlyRate: {
    title: "Wieviel soll ich investieren?",
    content: `
      <p><strong>Regelmäßigkeit schlägt Höhe.</strong></p>
      <p>Ein Sparplan ab 100 € monatlich ist ein guter Start und lässt sich jederzeit anpassen.</p>
      <p>Faustregel: <strong>10–15% des Nettoeinkommens</strong> für die Altersvorsorge.</p>`
  },
  modalTaxInfo: {
    title: "Kapitalertragsteuer",
    content: `
      <p>Der Satz von <strong>26,375%</strong> setzt sich zusammen aus:</p>
      <ul>
        <li>25% Abgeltungsteuer</li>
        <li>+ 1,375% Solidaritätszuschlag (5,5% auf die 25%)</li>
      </ul>
      <p>Ggf. kommt Kirchensteuer hinzu. Der Sparer-Pauschbetrag beträgt 1.000 € pro Person.</p>`
  },
  modalEtfTypeInfo: {
    title: "Thesaurierend vs. Ausschüttend",
    content: `
      <h4>Thesaurierend</h4>
      <p>Erträge werden automatisch wiederangelegt → stärkerer Zinseszinseffekt. Jährlich wird eine <strong>Vorabpauschale</strong> besteuert.</p>
      <h4>Ausschüttend</h4>
      <p>Erträge werden ausgezahlt und im Zuflussjahr versteuert.</p>`
  },
  modalBasiszinsInfo: {
    title: "Was ist der Basiszins?",
    content: `
      <p>Grundlage für die Vorabpauschale bei thesaurierenden ETFs. Wird von der Bundesbank festgelegt.</p>
      <p>Formel: <em>Fondswert × Basiszins × 0,7</em></p>
      <p>Aktuell (2024): <strong>2,29%</strong></p>`
  },
  modalVerkaufsteuerInfo: {
    title: "Verkaufsteuer (hypothetisch)",
    content: `
      <p>Schätzung der Steuer bei Verkauf des gesamten Depots am Laufzeitende.</p>
      <p>Berechnet auf den noch nicht durch Vorabpauschalen versteuerten Gewinn.</p>`
  },
  modalFreibetragInfo: {
    title: "Jährlicher Freibetrag",
    content: `
      <p>Der <strong>Sparer-Pauschbetrag</strong> in Deutschland:</p>
      <ul>
        <li>Einzelpersonen: <strong>1.000 €/Jahr</strong></li>
        <li>Zusammenveranlagte: <strong>2.000 €/Jahr</strong></li>
      </ul>
      <p>Nur Erträge über diesem Betrag werden versteuert.</p>`
  },
  modalSteuersatzInfo: {
    title: "Steuersatz",
    content: `
      <p>Standard: <strong>26,375%</strong> (25% Abgeltungsteuer + Soli).</p>
      <p>Bei Kirchensteuerpflicht ist der Satz höher. Hier manuell anpassbar.</p>`
  },
  modalDateTypeInfo: {
    title: "Laufjahr vs. Kalenderjahr",
    content: `
      <h4>Laufjahr</h4>
      <p>"Jahr 5" = das 5. Jahr nach Investitionsstart.</p>
      <h4>Kalenderjahr</h4>
      <p>Ein konkretes Kalenderjahr (z.B. 2035). Erfordert die Angabe eines Start-Kalenderjahres.</p>`
  }
};

// --- Modal Functions ---
function openModal(targetId) {
  const data = modalData[targetId];
  if (data && infoModal) {
    modalTitleEl.textContent = data.title;
    modalBodyEl.innerHTML = data.content;
    infoModal.style.display = 'flex';
  }
}
function closeModal() {
  if (infoModal) infoModal.style.display = 'none';
}

document.querySelectorAll('[data-modal-target]').forEach(btn =>
  btn.addEventListener('click', () => openModal(btn.getAttribute('data-modal-target')))
);
modalCloseBtns.forEach(btn => btn.addEventListener('click', closeModal));
window.addEventListener('click', e => { if (e.target === infoModal) closeModal(); });
window.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// --- "Why Invest" Section ---
function updateWhyInvestContent() {
  const currency = 'EUR';
  const interestRate = 0.07;

  // Scenario 1: 100€/month, 40 years, 7%
  let balance1 = 0;
  for (let i = 0; i < 40 * 12; i++) {
    balance1 += 100;
    balance1 *= (1 + interestRate / 12);
  }
  const totalDeposits1 = 100 * 12 * 40;
  const finalValue1 = balance1;

  // Scenario 2: Monthly interest from finalValue1
  const monthlyInterestNet = ((finalValue1 * interestRate) / 12) * (1 - 0.26375);

  // Scenario 3: Annuity over 20 years
  const r = interestRate / 12;
  const n = 20 * 12;
  const monthlyAnnuity = finalValue1 * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);

  // Scenario 4: Required saving for 20 years
  const futureValueFactor = (Math.pow(1 + r, n) - 1) / r;
  const requiredSaving = finalValue1 / futureValueFactor;

  // Scenario 5: 50k start + 100€/month, 20 years
  let balance5 = 50000;
  for (let i = 0; i < 20 * 12; i++) {
    balance5 += 100;
    balance5 *= (1 + interestRate / 12);
  }

  whyInvestContent.innerHTML = `
    <div class="info-point">
      <p>Die gesetzliche Rente allein reicht oft nicht, um den Lebensstandard im Alter zu halten.</p>
      <button class="point-toggle" data-target="details-1">1. Die Lücke der gesetzlichen Rente</button>
      <div id="details-1" class="point-details">
        <p>Die Renteninformation zeigt nur die Bruttorente.</p>
        <h4>Beispiel: 1.800 € brutto / 40 Jahre Arbeit</h4>
        <ul>
          <li>Bruttorente (2050): ca. 1.415 €/Monat</li>
          <li>Abzüge: KV (~8%), PV (~3,4–4%), Steuern (ab 2040: 100%)</li>
          <li>Netto-Rente: ca. 1.050–1.150 €/Monat</li>
          <li>Reale Kaufkraft (2% Inflation): <strong class="warning">nur ca. 650–750 €</strong></li>
        </ul>
        <p><strong class="warning">→ Selbst nach einem Leben voller Arbeit droht Altersarmut.</strong></p>
      </div>
    </div>
    <div class="info-point">
      <p>Kleine regelmäßige Beträge wachsen durch den Zinseszinseffekt über lange Zeiträume enorm.</p>
      <button class="point-toggle" data-target="details-2">2. ETF-Sparplan: 100 €/Monat über 40 Jahre</button>
      <div id="details-2" class="point-details">
        <ul>
          <li>Einzahlung: ${fmt(totalDeposits1, currency)}</li>
          <li>Depotvolumen (7% p.a.): <strong class="highlight">${fmt(finalValue1, currency)}</strong></li>
        </ul>
      </div>
    </div>
    <div class="info-point">
      <p>Ein aufgebautes Vermögen bietet finanzielle Flexibilität im Alter.</p>
      <button class="point-toggle" data-target="details-3">3. Was bringt das konkret?</button>
      <div id="details-3" class="point-details">
        <h4>Zusatz-Rente (Kapital erhalten)</h4>
        <ul>
          <li>Monatlicher Nettozins: <strong class="highlight">${fmt(monthlyInterestNet, currency)}</strong></li>
        </ul>
        <h4>Alternativ: Kapital aufbrauchen (20 Jahre)</h4>
        <ul>
          <li>Monatliche Entnahme: <strong class="highlight">${fmt(monthlyAnnuity, currency)}</strong></li>
        </ul>
      </div>
    </div>
    <div class="info-point">
      <p>Auch ein späterer Einstieg lohnt sich.</p>
      <button class="point-toggle" data-target="details-4">4. Beispiele für „ältere" Anleger</button>
      <div id="details-4" class="point-details">
        <h4>Ziel: ${fmt(finalValue1, currency)} in 20 Jahren</h4>
        <ul><li>Nötige Sparrate: <strong class="highlight">${fmt(requiredSaving, currency)}/Monat</strong></li></ul>
        <h4>50.000 € Start + 100 €/Monat</h4>
        <ul><li>Nach 20 Jahren: <strong class="highlight">${fmt(balance5, currency)}</strong></li></ul>
      </div>
    </div>
    <div class="info-point">
      <button class="point-toggle" data-target="details-5">5. Zusammenfassung</button>
      <div id="details-5" class="point-details">
        <ul>
          <li>Rente allein reicht oft nicht – private Vorsorge ist essenziell.</li>
          <li>100 €/Monat → nach 40 Jahren über <strong class="highlight">${fmt(240000, currency)}</strong>.</li>
          <li>Wer früh beginnt, gewinnt Freiheit und Sicherheit im Alter.</li>
        </ul>
      </div>
    </div>`;
}

if (toggleWhyInvestBtn && whyInvestContent) {
  toggleWhyInvestBtn.addEventListener('click', () => {
    const isHidden = !whyInvestContent.style.display || whyInvestContent.style.display === 'none';
    if (isHidden) {
      updateWhyInvestContent();
      whyInvestContent.style.display = 'block';
    } else {
      whyInvestContent.style.display = 'none';
    }
    toggleWhyInvestBtn.textContent = isHidden ? 'Weniger anzeigen' : 'Mehr erfahren';
  });

  whyInvestContent.addEventListener('click', e => {
    if (e.target.classList.contains('point-toggle')) {
      const details = document.getElementById(e.target.dataset.target);
      if (details) {
        e.target.classList.toggle('open');
        details.style.display = details.style.display === 'block' ? 'none' : 'block';
      }
    }
  });
}

// --- Currency Label Updates ---
const labelTexts = {
  start: 'Startkapital',
  rate: 'Monatsrate',
  freibetrag: 'Jährlicher Freibetrag',
  lumpsum: 'Einmalige Einzahlung',
  payout: 'Einmalige Auszahlung',
  payoutPlanAmount: 'Auszahlplan Betrag'
};

const symbolMap = { EUR: '€', USD: '$', JPY: '¥', GBP: '£', AUD: 'A$' };

function updateCurrencyLabels(code) {
  const sym = symbolMap[code] || code;
  for (const id in labelTexts) {
    const label = document.querySelector(`label[for="${id}"]`);
    if (label) label.textContent = `${labelTexts[id]} (${sym})`;
  }
}

// --- Event Listeners ---
advToggle.onclick = () => {
  const open = advBox.style.display === 'block';
  advBox.style.display = open ? 'none' : 'block';
  advToggle.classList.toggle('open', !open);
  advToggle.querySelector('.adv-toggle-arrow').textContent = open ? '▼' : '▲';
};

interestRatePresetEl.addEventListener('change', function () {
  interestCustomEl.style.display = this.value === 'custom' ? 'block' : 'none';
  if (this.value === 'custom') {
    interestCustomEl.focus();
    if (!interestCustomEl.value) interestCustomEl.value = "7.6";
  }
});

currencyEl.addEventListener('change', () => {
  updateCurrencyLabels(currencyEl.value);
  triggerCalc();
});

stopMonthlyRateEnableEl.addEventListener('change', function () {
  stopMonthlyRateYearContainerEl.style.display = this.checked ? 'block' : 'none';
});

payoutIntervalEl.addEventListener('change', function () {
  payoutIntervalDaysEl.disabled = this.value !== 'custom';
  if (this.value === 'custom' && !payoutIntervalDaysEl.value) payoutIntervalDaysEl.value = '30';
  else if (this.value !== 'custom') payoutIntervalDaysEl.value = '';
});

steuerSatzEl.addEventListener('input', function () {
  taxRateDisplayEl.textContent = this.value || DEFAULT_STEUERSATZ.toString();
});

chartAxisToggleEl.addEventListener('change', () => triggerCalc());

// Calc button active state
document.querySelectorAll('.btn-group .btn').forEach(button => {
  button.addEventListener('click', function () {
    document.querySelectorAll('.btn-group .btn').forEach(b => b.classList.remove('active-calc-btn'));
    this.classList.add('active-calc-btn');
  });
});

// --- Dynamic Entries ---
function addDynamicEntry(container, amtClass, yearClass) {
  const row = document.createElement('div');
  row.className = 'row dynamic-entry-row';
  const sym = symbolMap[currencyEl.value] || currencyEl.value;

  const amtDiv = document.createElement('div');
  const amtInput = document.createElement('input');
  amtInput.type = 'number'; amtInput.min = '0'; amtInput.value = '0';
  amtInput.className = amtClass; amtInput.placeholder = `Betrag (${sym})`;
  amtDiv.appendChild(amtInput);

  const yearDiv = document.createElement('div');
  const yearInput = document.createElement('input');
  yearInput.type = 'number'; yearInput.min = '1'; yearInput.value = '1';
  yearInput.className = yearClass; yearInput.placeholder = 'Jahr';
  yearDiv.appendChild(yearInput);

  const removeBtn = document.createElement('button');
  removeBtn.type = 'button'; removeBtn.textContent = '✕';
  removeBtn.className = 'remove-btn';
  removeBtn.onclick = () => row.remove();

  row.append(amtDiv, yearDiv, removeBtn);
  container.appendChild(row);
}

document.getElementById('addLumpsumBtn').addEventListener('click',
  () => addDynamicEntry(lumpsumEntriesContainer, 'lumpsum-amount', 'lumpsum-year'));
document.getElementById('addOneTimePayoutBtn').addEventListener('click',
  () => addDynamicEntry(oneTimePayoutEntriesContainer, 'payout-amount', 'payout-year'));

function getDynamicEntries(amtClass, yearClass) {
  const amounts = document.querySelectorAll(`.${amtClass}`);
  const years = document.querySelectorAll(`.${yearClass}`);
  const entries = [];
  for (let i = 0; i < amounts.length; i++) {
    const amount = parseFloat(amounts[i].value) || 0;
    const year = parseInt(years[i].value) || 0;
    if (amount > 0 && year > 0) entries.push({ amount, year });
  }
  return entries;
}

// --- Historical Data ---
function computeRatesFromPrices(prices) {
  return prices.slice(1).map((p, i) => p / prices[i] - 1);
}

async function fetchHistoricalRates() {
  const asset = assetSelectEl.value;
  const startYear = parseInt(assetStartYearEl.value) || new Date().getFullYear();
  let prices = [];

  try {
    if (asset === 'bitcoin') {
      const from = Math.floor(new Date(startYear + '-01-01').getTime() / 1000);
      const to = Math.floor(Date.now() / 1000);
      const res = await fetch(`https://api.coingecko.com/api/v3/coins/bitcoin/market_chart/range?vs_currency=usd&from=${from}&to=${to}`);
      const data = await res.json();
      const yearMap = {};
      (data.prices || []).forEach(p => {
        const y = new Date(p[0]).getFullYear();
        if (!yearMap[y]) yearMap[y] = [];
        yearMap[y].push(p[1]);
      });
      Object.keys(yearMap).sort().forEach(y => {
        if (parseInt(y) >= startYear) {
          const arr = yearMap[y];
          prices.push(arr.reduce((a, b) => a + b, 0) / arr.length);
        }
      });
    } else {
      const symbol = asset === 'gold' ? 'GLD' : 'URTH';
      const res = await fetch(`https://www.alphavantage.co/query?function=TIME_SERIES_MONTHLY_ADJUSTED&symbol=${symbol}&apikey=demo`);
      const json = await res.json();
      const series = json['Monthly Adjusted Time Series'] || {};
      const yearMap = {};
      Object.keys(series).forEach(date => {
        const y = parseInt(date.slice(0, 4));
        if (y >= startYear) {
          if (!yearMap[y]) yearMap[y] = [];
          yearMap[y].push(parseFloat(series[date]['5. adjusted close']));
        }
      });
      Object.keys(yearMap).sort().forEach(y => {
        const arr = yearMap[y];
        prices.push(arr.reduce((a, b) => a + b, 0) / arr.length);
      });
    }
  } catch (err) {
    console.warn('Historical data fetch failed:', err);
  }
  loadedHistoricalRates = computeRatesFromPrices(prices);
}

// --- Mode Switching ---
function updateMode(newMode) {
  currentMode = newMode;
  btnCalcMode.classList.toggle('active-mode-btn', newMode === 'compare');
  btnHistoricalMode.classList.toggle('active-mode-btn', newMode === 'historical');
  historicalOptionsEl.style.display = newMode === 'historical' ? 'block' : 'none';
  if (newMode === 'historical') {
    fetchHistoricalRates().then(() => triggerCalc());
  } else {
    triggerCalc();
  }
}

btnCalcMode.addEventListener('click', () => updateMode('compare'));
btnHistoricalMode.addEventListener('click', () => updateMode('historical'));
assetSelectEl.addEventListener('change', () => updateMode('historical'));
assetStartYearEl.addEventListener('change', () => updateMode('historical'));
assetToggleEls.forEach(cb => cb.addEventListener('change', () => triggerCalc()));

// --- Helper: Get active calc state ---
function triggerCalc() {
  const activeBtn = document.querySelector('.btn-group .btn.active-calc-btn');
  const isNetto = activeBtn && activeBtn.textContent.includes('Netto');
  calc(isNetto);
}

// --- Compare Calculation ---
function computeComparisonTotal(start, lumpsums, baseRate, rateIncrease, annualRate, years, stopEnabled, stopYear) {
  let total = start;
  lumpsums.forEach(l => { if (l.amount > 0) total += l.amount; });
  let dynRate = baseRate;
  for (let y = 1; y <= years; y++) {
    if (y > 1) dynRate *= (1 + rateIncrease);
    const contrib = (stopEnabled && y >= stopYear) ? 0 : dynRate * 12;
    total += contrib;
    total *= (1 + annualRate);
  }
  return total;
}

function updateCompareChart(etfTotal, tdTotal, bankTotal, btcTotal, ethTotal, currency) {
  if (chartCompare) chartCompare.destroy();
  const selected = Array.from(document.querySelectorAll('.asset-toggle:checked')).map(cb => cb.value);
  const labels = [], data = [], colors = [];
  if (selected.includes('etf'))       { labels.push('ETF'); data.push(etfTotal); colors.push(COMPARE_COLORS.etf); }
  if (selected.includes('tagesgeld')) { labels.push('Tagesgeld 2%'); data.push(tdTotal); colors.push(COMPARE_COLORS.tagesgeld); }
  if (selected.includes('bank'))      { labels.push('Bank 0%'); data.push(bankTotal); colors.push(COMPARE_COLORS.bank); }
  if (selected.includes('bitcoin'))   { labels.push('Bitcoin'); data.push(btcTotal); colors.push(COMPARE_COLORS.bitcoin); }
  if (selected.includes('ethereum'))  { labels.push('Ethereum'); data.push(ethTotal); colors.push(COMPARE_COLORS.ethereum); }

  chartCompare = new Chart(document.getElementById('compare').getContext('2d'), {
    type: 'bar',
    data: { labels, datasets: [{ data, backgroundColor: colors, barPercentage: 0.65, borderRadius: 4 }] },
    options: {
      ...getChartOptionsBase(currency),
      scales: {
        y: { ...darkScaleDefaults(), title: { display: true, text: `Gesamtwert (${currency})`, color: '#8b8fa6' } },
        x: { ...darkScaleDefaults() }
      },
      plugins: { ...getChartOptionsBase(currency).plugins, legend: { display: false } }
    }
  });
}

// --- Chart Style Helpers ---
function darkScaleDefaults() {
  return {
    grid: { color: 'rgba(42, 46, 69, 0.8)', drawBorder: false },
    ticks: { color: '#8b8fa6' }
  };
}

function getChartOptionsBase(currency) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      tooltip: {
        backgroundColor: '#1a1d2e',
        borderColor: '#333759',
        borderWidth: 1,
        titleColor: '#e2e4ec',
        bodyColor: '#8b8fa6',
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: function (ctx) {
            let label = ctx.dataset.label || '';
            if (label) label += ': ';
            const val = ctx.dataset.label === 'Auszahlungen (jährlich)' ? Math.abs(ctx.parsed.y) : ctx.parsed.y;
            return label + fmt(val, currency);
          }
        }
      },
      legend: {
        labels: { color: '#8b8fa6', usePointStyle: true, padding: 16 }
      }
    },
    layout: { padding: { top: 10, bottom: 5, left: 5, right: 5 } }
  };
}

// --- Reset ---
function resetValuesAndCalc() {
  currencyEl.value = DEFAULT_CURRENCY;
  rateEl.value = DEFAULT_MONTHLY_RATE;
  monthlyRateIncreaseEl.value = DEFAULT_RATE_INCREASE;
  yearsEl.value = DEFAULT_YEARS;
  startCalendarYearEl.value = new Date().getFullYear();
  interestRatePresetEl.value = DEFAULT_INTEREST_PRESET;
  interestCustomEl.value = '';
  interestRatePresetEl.dispatchEvent(new Event('change'));
  etfTypeEl.value = DEFAULT_ETF_TYPE;
  freibetragEl.value = DEFAULT_FREIBETRAG;
  steuerSatzEl.value = DEFAULT_STEUERSATZ;
  basiszinsEl.value = DEFAULT_BASISZINS;
  taxRateDisplayEl.textContent = DEFAULT_STEUERSATZ.toString();
  startEl.value = 0;
  stopMonthlyRateEnableEl.checked = false;
  stopMonthlyRateYearEl.value = 10;
  stopMonthlyRateEnableEl.dispatchEvent(new Event('change'));
  payoutYearTypeEl.value = 'laufjahr';

  lumpsumEntriesContainer.innerHTML = `
    <div class="row main-entry-row">
      <div><label for="lumpsum">Einmalige Einzahlung (€)</label><input id="lumpsum" type="number" value="0" min="0" class="lumpsum-amount"></div>
      <div><label for="lumpyear">Im Jahr (Laufjahr):</label><input id="lumpyear" type="number" value="1" min="1" class="lumpsum-year"></div>
    </div>`;
  oneTimePayoutEntriesContainer.innerHTML = `
    <div class="row main-entry-row">
      <div><label>Einmalige Auszahlung (€)</label><input id="payout" type="number" value="0" min="0" class="payout-amount"></div>
      <div><label>Im Jahr:</label><input id="payoutYear" type="number" value="1" min="1" class="payout-year" placeholder="Jahr"></div>
    </div>`;

  payoutPlanAmountEl.value = 0;
  payoutStartYearEl.value = 1;
  payoutIntervalEl.value = 'monthly';
  payoutIntervalDaysEl.value = '';
  payoutIntervalEl.dispatchEvent(new Event('change'));
  assetSelectEl.value = 'gold';
  assetStartYearEl.value = 2015;
  loadedHistoricalRates = [];
  updateMode('compare');
  chartAxisToggleEl.checked = false;
  warnEl.textContent = '';
  headlineEl.innerHTML = '';
  if (chartMain) { chartMain.destroy(); chartMain = null; }
  if (chartCompare) { chartCompare.destroy(); chartCompare = null; }
  document.querySelectorAll('.btn-group .btn').forEach(b => b.classList.remove('active-calc-btn'));
  document.querySelector('.btn[onclick="calc(false)"]').classList.add('active-calc-btn');
  updateCurrencyLabels(DEFAULT_CURRENCY);
  calc(false);
}

resetBtn.addEventListener('click', resetValuesAndCalc);

// =============================================
// MAIN CALCULATION
// =============================================
function calc(withTax) {
  warnEl.textContent = '';
  const currency = currencyEl.value;

  // 1. Inputs
  let baseMonthlyRate = parseFloat(rateEl.value) || 0;
  const monthlyRateIncrease = (parseFloat(monthlyRateIncreaseEl.value) || 0) / 100;
  const totalYears = parseInt(yearsEl.value) || 0;
  const investmentStartCalendarYear = parseInt(startCalendarYearEl.value) || new Date().getFullYear();
  const annualInterestRateValue = (interestRatePresetEl.value === 'custom')
    ? (parseFloat(interestCustomEl.value) || 0)
    : (parseFloat(interestRatePresetEl.value) || 0);
  const annualInterestRate = annualInterestRateValue / 100;
  const startCapital = parseFloat(startEl.value) || 0;
  const stopEnabled = stopMonthlyRateEnableEl.checked;
  const stopYear = parseInt(stopMonthlyRateYearEl.value) || 0;
  const etfType = etfTypeEl.value;
  const freibetrag = parseFloat(freibetragEl.value) || 0;
  const steuerSatz = (parseFloat(steuerSatzEl.value) || 0) / 100;
  const basiszins = (parseFloat(basiszinsEl.value) || 0) / 100;
  const payoutYearType = payoutYearTypeEl.value;
  const lumpsums = getDynamicEntries('lumpsum-amount', 'lumpsum-year');
  const oneTimePayouts = getDynamicEntries('payout-amount', 'payout-year');
  const useCalendarAxis = chartAxisToggleEl.checked;
  const planAmount = parseFloat(payoutPlanAmountEl.value) || 0;
  const planStartYear = parseInt(payoutStartYearEl.value) || 0;
  const planInterval = payoutIntervalEl.value;
  const planDays = parseInt(payoutIntervalDaysEl.value) || 0;
  const historicalRates = (currentMode === 'historical') ? loadedHistoricalRates : [];

  // 2. Validate
  if (totalYears < 1) { warnEl.textContent = 'Bitte Laufzeit ≥ 1 Jahr eingeben.'; return; }
  for (const p of oneTimePayouts) {
    let ey = p.year;
    if (payoutYearType === 'kalenderjahr') ey = p.year - investmentStartCalendarYear + 1;
    if (ey < 1 || ey > totalYears) {
      warnEl.textContent = `Auszahlung im Jahr ${p.year} liegt außerhalb der Laufzeit.`;
      return;
    }
  }

  // 3. Initialize
  let balance = startCapital;
  let cumDeposits = startCapital;
  let cumPayouts = 0;
  let cumTax = 0;
  let freibetragRest = freibetrag;
  let allVPAs = 0;

  const labels = [], netDepositsData = [], netGainData = [], payoutData = [], taxData = [];

  // 4. Year Loop
  for (let y = 1; y <= totalYears; y++) {
    const calYear = investmentStartCalendarYear + y - 1;
    let yearPayouts = 0;
    let balanceStart = balance;
    let yearTax = 0;

    if (y > 1) {
      freibetragRest = freibetrag;
      baseMonthlyRate *= (1 + monthlyRateIncrease);
    }

    // Lump sums
    lumpsums.forEach(l => {
      if (l.year === y) {
        balance += l.amount;
        cumDeposits += l.amount;
        balanceStart += l.amount;
      }
    });

    // Monthly contributions
    let contrib = 0;
    if (!(stopEnabled && y >= stopYear)) contrib = baseMonthlyRate * 12;
    balance += contrib;
    cumDeposits += contrib;

    // Interest
    const preInterest = balance;
    let rateForYear = annualInterestRate;
    if (historicalRates.length > 0) {
      rateForYear = historicalRates[y - 1] !== undefined ? historicalRates[y - 1] : historicalRates[historicalRates.length - 1];
    }
    balance *= (1 + rateForYear);
    const gain = balance - preInterest;

    // One-time payouts
    oneTimePayouts.forEach(p => {
      const occurs = (payoutYearType === 'laufjahr' && p.year === y)
                  || (payoutYearType === 'kalenderjahr' && p.year === calYear);
      if (occurs) {
        const amt = Math.min(balance, p.amount);
        balance -= amt;
        cumPayouts += amt;
        yearPayouts += amt;
      }
    });

    // Payout plan
    if (y >= planStartYear && planAmount > 0) {
      let yearlyPlan = 0;
      if (planInterval === 'yearly') yearlyPlan = planAmount;
      else if (planInterval === 'custom' && planDays > 0) yearlyPlan = planAmount * (365 / planDays);
      else yearlyPlan = planAmount * 12;
      const actual = Math.min(balance, yearlyPlan);
      balance -= actual;
      cumPayouts += actual;
      yearPayouts += actual;
    }

    // Tax
    if (withTax) {
      if (etfType === 'thesaurierend') {
        const vpRaw = balanceStart * basiszins * 0.7;
        const vpAmount = Math.min(vpRaw, gain);
        allVPAs += vpAmount;
        const taxable = Math.max(0, vpAmount - freibetragRest);
        yearTax = taxable * steuerSatz;
        freibetragRest -= Math.min(vpAmount, freibetragRest);
      } else {
        const taxable = Math.max(0, gain - freibetragRest);
        yearTax = taxable * steuerSatz;
        freibetragRest -= Math.min(gain, freibetragRest);
      }
      yearTax = Math.max(0, yearTax);
      balance -= yearTax;
      cumTax += yearTax;
    }

    // Chart data
    labels.push(useCalendarAxis ? calYear.toString() : 'Jahr ' + y);
    const netInvested = cumDeposits - cumPayouts;
    netDepositsData.push(Math.max(0, netInvested));
    netGainData.push(Math.max(0, balance - netInvested));
    payoutData.push(-yearPayouts);
    taxData.push(cumTax);
  }

  // 5. Results
  const finalBalance = balance;
  const finalNetInvested = cumDeposits - cumPayouts;
  const finalGain = finalBalance - finalNetInvested;

  let headlineHTML = `
    <div class="headline-item"><span class="headline-label">Brutto-Einzahlungen:</span><span class="headline-sub-value">${fmt(cumDeposits, currency)}</span></div>
    <div class="headline-item"><span class="headline-label">Gewinn ${withTax ? '(Netto vor Verkauf)' : '(Brutto)'}:</span><span class="headline-value">${fmt(finalGain, currency)}</span></div>
    <div class="headline-item"><span class="headline-label">Auszahlungen (kumuliert):</span><span class="headline-sub-value">${fmt(cumPayouts, currency)}</span></div>`;

  if (withTax) {
    const saleGain = finalBalance - (cumDeposits - allVPAs - cumPayouts);
    const saleTaxable = Math.max(0, saleGain - freibetrag);
    const saleTax = Math.max(0, saleTaxable * steuerSatz * 0.7);
    const afterSaleTax = finalBalance - saleTax;

    headlineHTML += `
      <div class="headline-item"><span class="headline-label">Verkaufsteuer (hypothetisch):</span><span class="headline-sub-value">${fmt(saleTax, currency)} <button type="button" class="info-btn" data-modal-target="modalVerkaufsteuerInfo" title="Info">?</button></span></div>
      <div class="headline-item"><span class="headline-label">Endkapital (nach Verkaufsteuer):</span><span class="headline-value">${fmt(afterSaleTax, currency)}</span></div>`;
  } else {
    headlineHTML += `<div class="headline-item"><span class="headline-label">Endkapital:</span><span class="headline-value">${fmt(finalBalance, currency)}</span></div>`;
  }

  headlineEl.innerHTML = headlineHTML;
  document.querySelectorAll('[data-modal-target="modalVerkaufsteuerInfo"]').forEach(btn => {
    if (btn.getAttribute('listener') !== 'true') {
      btn.addEventListener('click', () => openModal('modalVerkaufsteuerInfo'));
      btn.setAttribute('listener', 'true');
    }
  });

  // 6. Main Chart
  if (chartMain) chartMain.destroy();
  const datasets = [
    { label: 'Netto Einzahlungen', data: netDepositsData, backgroundColor: CAPITAL_COLOR, stack: 'pos', borderRadius: 2 },
    { label: `Gewinn ${withTax ? '(Netto)' : '(Brutto)'}`, data: netGainData, backgroundColor: GAIN_COLOR, stack: 'pos', borderRadius: 2 },
    { label: 'Auszahlungen (jährlich)', data: payoutData, backgroundColor: ANNUAL_PAYOUT_COLOR, stack: 'neg', borderRadius: 2 }
  ];
  if (withTax) {
    datasets.push({
      label: 'Steuer (kumuliert)', data: taxData, backgroundColor: TAX_COLOR_DIAGRAM,
      type: 'line', order: -1, yAxisID: 'y1', borderColor: TAX_COLOR_DIAGRAM,
      pointRadius: 0, borderWidth: 2, fill: false, tension: 0.3
    });
  }

  const opts = getChartOptionsBase(currency);
  chartMain = new Chart(document.getElementById('chart').getContext('2d'), {
    type: 'bar',
    data: { labels, datasets },
    options: {
      ...opts,
      scales: {
        y: { ...darkScaleDefaults(), stacked: true, title: { display: true, text: `Betrag (${currency})`, color: '#8b8fa6' }, beginAtZero: true },
        y1: { ...darkScaleDefaults(), display: withTax, position: 'right', title: { display: true, text: 'Steuer kumuliert', color: '#8b8fa6' }, grid: { drawOnChartArea: false } },
        x: { ...darkScaleDefaults(), stacked: true, title: { display: true, text: useCalendarAxis ? 'Kalenderjahr' : 'Laufjahre', color: '#8b8fa6' } }
      }
    }
  });

  // 7. Compare Chart
  const etfTotal = finalBalance + cumPayouts;
  const baseRate = parseFloat(rateEl.value) || 0;
  const tdTotal = computeComparisonTotal(startCapital, lumpsums, baseRate, monthlyRateIncrease, 0.02, totalYears, stopEnabled, stopYear);
  const btcTotal = computeComparisonTotal(startCapital, lumpsums, baseRate, monthlyRateIncrease, 0.45, totalYears, stopEnabled, stopYear);
  const ethTotal = computeComparisonTotal(startCapital, lumpsums, baseRate, monthlyRateIncrease, 0.30, totalYears, stopEnabled, stopYear);
  updateCompareChart(etfTotal, tdTotal, cumDeposits, btcTotal, ethTotal, currency);
}

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
  resetValuesAndCalc();
});
