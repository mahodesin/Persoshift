// ============================================
// PersoShift ETF-Rechner – Script (Dark Theme)
// ============================================

// --- Global Variables ---
var chartMain = null;
var chartCompare = null;
var currentMode = 'compare';
var loadedHistoricalRates = [];

// --- Default Values ---
var DEFAULT_MONTHLY_RATE = 100;
var DEFAULT_YEARS = 40;
var DEFAULT_INTEREST_PRESET = "7.6";
var DEFAULT_FREIBETRAG = 1000;
var DEFAULT_STEUERSATZ = 26.375;
var DEFAULT_ETF_TYPE = "thesaurierend";
var DEFAULT_BASISZINS = 2.29;
var DEFAULT_RATE_INCREASE = 0;
var DEFAULT_CURRENCY = 'EUR';

// --- Chart Colors (Dark Theme) ---
var CAPITAL_COLOR = 'rgba(108, 138, 255, 0.85)';
var GAIN_COLOR = 'rgba(251, 191, 36, 0.85)';
var ANNUAL_PAYOUT_COLOR = 'rgba(52, 211, 153, 0.85)';
var TAX_COLOR_DIAGRAM = 'rgba(248, 113, 113, 0.7)';
var COMPARE_COLORS = {
  etf: 'rgba(46, 204, 113, 0.85)',
  tagesgeld: 'rgba(52, 152, 219, 0.85)',
  bank: 'rgba(149, 165, 166, 0.7)',
  bitcoin: 'rgba(247, 147, 26, 0.85)',
  ethereum: 'rgba(98, 126, 234, 0.85)'
};

// --- Currency Helpers ---
var symbolMap = { EUR: '€', USD: '$', JPY: '¥', GBP: '£', AUD: 'A$' };
var localeMap = { EUR: 'de-DE', USD: 'en-US', GBP: 'en-GB', JPY: 'ja-JP', AUD: 'en-AU' };

function fmt(n, currency) {
  currency = currency || 'EUR';
  return n.toLocaleString(localeMap[currency] || 'de-DE', {
    style: 'currency', currency: currency, maximumFractionDigits: 0
  });
}

// --- Modal Data ---
var modalData = {
  modalSP500: {
    title: "Was ist der S&P 500?",
    content: '<p>Der S&P 500 ist ein Aktienindex, der die 500 größten börsennotierten US-Unternehmen abbildet.</p><h4>Durchschnittliche Jahresrendite</h4><p>Historisch ca. <strong>10% pro Jahr</strong> vor Inflation.</p><p><strong>Wichtig:</strong> Vergangene Renditen sind keine Garantie für zukünftige Ergebnisse.</p><p>Bekannter ETF: iShares Core S&P 500 UCITS ETF (<strong>ISIN: IE00B5BMR087</strong>)</p>'
  },
  modalMSCIWorld: {
    title: "Was ist der MSCI World?",
    content: '<p>Der MSCI World umfasst ca. 1.500 Unternehmen aus 23 Industrieländern – breite Streuung.</p><h4>Durchschnittliche Jahresrendite</h4><p>Langfristig ca. <strong>7–9% pro Jahr</strong> vor Inflation.</p><p>Bekannter ETF: iShares Core MSCI World UCITS ETF (<strong>ISIN: IE00B4L5Y983</strong>)</p>'
  },
  modalMonthlyRate: {
    title: "Wieviel soll ich investieren?",
    content: '<p><strong>Regelmäßigkeit schlägt Höhe.</strong></p><p>Ein Sparplan ab 100 € monatlich ist ein guter Start.</p><p>Faustregel: <strong>10–15% des Nettoeinkommens</strong> für die Altersvorsorge.</p>'
  },
  modalTaxInfo: {
    title: "Kapitalertragsteuer",
    content: '<p>Der Satz von <strong>26,375%</strong> setzt sich zusammen aus:</p><ul><li>25% Abgeltungsteuer</li><li>+ 1,375% Solidaritätszuschlag</li></ul><p>Ggf. kommt Kirchensteuer hinzu. Sparer-Pauschbetrag: 1.000 € pro Person.</p>'
  },
  modalEtfTypeInfo: {
    title: "Thesaurierend vs. Ausschüttend",
    content: '<h4>Thesaurierend</h4><p>Erträge werden automatisch wiederangelegt. Jährlich wird eine <strong>Vorabpauschale</strong> besteuert.</p><h4>Ausschüttend</h4><p>Erträge werden ausgezahlt und im Zuflussjahr versteuert.</p>'
  },
  modalBasiszinsInfo: {
    title: "Was ist der Basiszins?",
    content: '<p>Grundlage für die Vorabpauschale bei thesaurierenden ETFs.</p><p>Formel: <em>Fondswert × Basiszins × 0,7</em></p><p>Aktuell (2024): <strong>2,29%</strong></p>'
  },
  modalVerkaufsteuerInfo: {
    title: "Verkaufsteuer (hypothetisch)",
    content: '<p>Schätzung der Steuer bei Verkauf des gesamten Depots am Laufzeitende.</p><p>Berechnet auf den noch nicht durch Vorabpauschalen versteuerten Gewinn.</p>'
  },
  modalFreibetragInfo: {
    title: "Jährlicher Freibetrag",
    content: '<p>Der <strong>Sparer-Pauschbetrag</strong>:</p><ul><li>Einzelpersonen: <strong>1.000 €/Jahr</strong></li><li>Zusammenveranlagte: <strong>2.000 €/Jahr</strong></li></ul><p>Nur Erträge darüber werden versteuert.</p>'
  },
  modalSteuersatzInfo: {
    title: "Steuersatz",
    content: '<p>Standard: <strong>26,375%</strong> (25% + Soli). Bei Kirchensteuerpflicht höher. Hier manuell anpassbar.</p>'
  },
  modalDateTypeInfo: {
    title: "Laufjahr vs. Kalenderjahr",
    content: '<h4>Laufjahr</h4><p>"Jahr 5" = das 5. Jahr nach Investitionsstart.</p><h4>Kalenderjahr</h4><p>Ein konkretes Kalenderjahr (z.B. 2035). Erfordert Start-Kalenderjahr.</p>'
  }
};

// ============================================
// INIT – Wait for DOM to be ready
// ============================================
document.addEventListener('DOMContentLoaded', function() {

  // --- Chart.js Global Defaults (Dark Theme) ---
  try {
    Chart.defaults.font.family = "'DM Sans', sans-serif";
    Chart.defaults.font.size = 12;
    Chart.defaults.color = '#8b8fa6';
    Chart.defaults.maintainAspectRatio = false;
    Chart.defaults.responsive = true;
    if (Chart.defaults.plugins && Chart.defaults.plugins.legend) {
      Chart.defaults.plugins.legend.position = 'bottom';
    }
  } catch(e) {
    console.warn('Chart defaults:', e);
  }

  // --- Grab all DOM elements ---
  var advToggle = document.getElementById('advToggle');
  var advBox = document.getElementById('advanced');
  var currencyEl = document.getElementById('currency');
  var rateEl = document.getElementById('rate');
  var monthlyRateIncreaseEl = document.getElementById('monthlyRateIncrease');
  var yearsEl = document.getElementById('years');
  var startCalendarYearEl = document.getElementById('startCalendarYear');
  var interestRatePresetEl = document.getElementById('interestRatePreset');
  var interestCustomEl = document.getElementById('interestCustom');
  var startEl = document.getElementById('start');
  var warnEl = document.getElementById('warn');
  var headlineEl = document.getElementById('headline');
  var compareChartTitleEl = document.getElementById('compareChartTitle');
  var etfTypeEl = document.getElementById('etfType');
  var freibetragEl = document.getElementById('freibetrag');
  var steuerSatzEl = document.getElementById('steuerSatz');
  var basiszinsEl = document.getElementById('basiszins');
  var taxRateDisplayEl = document.getElementById('taxRateDisplay');
  var payoutYearTypeEl = document.getElementById('payoutYearType');
  var stopMonthlyRateEnableEl = document.getElementById('stopMonthlyRateEnable');
  var stopMonthlyRateYearContainerEl = document.getElementById('stopMonthlyRateYearContainer');
  var stopMonthlyRateYearEl = document.getElementById('stopMonthlyRateYear');
  var payoutPlanAmountEl = document.getElementById('payoutPlanAmount');
  var payoutStartYearEl = document.getElementById('payoutStartYear');
  var payoutIntervalEl = document.getElementById('payoutInterval');
  var payoutIntervalDaysEl = document.getElementById('payoutIntervalDays');
  var lumpsumEntriesContainer = document.getElementById('lumpsumEntriesContainer');
  var oneTimePayoutEntriesContainer = document.getElementById('oneTimePayoutEntriesContainer');
  var infoModal = document.getElementById('infoModal');
  var modalTitleEl = document.getElementById('modalTitle');
  var modalBodyEl = document.getElementById('modalBody');
  var resetBtn = document.getElementById('resetBtn');
  var chartAxisToggleEl = document.getElementById('chartAxisToggle');
  var btnCalcMode = document.getElementById('btnCalculator');
  var btnHistoricalMode = document.getElementById('btnHistorical');
  var historicalOptionsEl = document.getElementById('historicalOptions');
  var assetSelectEl = document.getElementById('assetSelect');
  var assetStartYearEl = document.getElementById('assetStartYear');
  var toggleWhyInvestBtn = document.getElementById('toggleWhyInvestBtn');
  var whyInvestContent = document.getElementById('whyInvestContent');
  var addLumpsumBtn = document.getElementById('addLumpsumBtn');
  var addOneTimePayoutBtn = document.getElementById('addOneTimePayoutBtn');

  // ========================================
  // MODAL FUNCTIONS
  // ========================================
  function openModal(targetId) {
    var data = modalData[targetId];
    if (data && infoModal) {
      modalTitleEl.textContent = data.title;
      modalBodyEl.innerHTML = data.content;
      infoModal.style.display = 'flex';
    }
  }

  function closeModal() {
    if (infoModal) infoModal.style.display = 'none';
  }

  // Attach modal listeners (can be called multiple times safely)
  function attachModalListeners() {
    document.querySelectorAll('[data-modal-target]').forEach(function(btn) {
      if (btn.getAttribute('data-modal-bound') !== 'true') {
        btn.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          openModal(this.getAttribute('data-modal-target'));
        });
        btn.setAttribute('data-modal-bound', 'true');
      }
    });
  }

  attachModalListeners();

  document.querySelectorAll('[data-close-modal]').forEach(function(btn) {
    btn.addEventListener('click', closeModal);
  });
  window.addEventListener('click', function(e) {
    if (e.target === infoModal) closeModal();
  });
  window.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeModal();
  });

  // ========================================
  // "WHY INVEST" SECTION
  // ========================================
  function updateWhyInvestContent() {
    var currency = 'EUR';
    var rate = 0.07;
    var bal = 0;
    for (var i = 0; i < 480; i++) { bal += 100; bal *= (1 + rate / 12); }
    var deps = 48000;
    var fv = bal;
    var mNet = ((fv * rate) / 12) * (1 - 0.26375);
    var r = rate / 12, n = 240;
    var annuity = fv * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    var fvf = (Math.pow(1 + r, n) - 1) / r;
    var reqSave = fv / fvf;
    var bal5 = 50000;
    for (var j = 0; j < 240; j++) { bal5 += 100; bal5 *= (1 + rate / 12); }

    whyInvestContent.innerHTML =
      '<div class="info-point">' +
        '<p>Die gesetzliche Rente reicht oft nicht für den Lebensstandard im Alter.</p>' +
        '<button class="point-toggle" data-target="details-1">1. Die Lücke der gesetzlichen Rente</button>' +
        '<div id="details-1" class="point-details">' +
          '<h4>Beispiel: 1.800 € brutto / 40 Jahre Arbeit</h4>' +
          '<ul><li>Bruttorente (2050): ca. 1.415 €/Monat</li><li>Abzüge: KV, PV, Steuern</li><li>Netto: ca. 1.050–1.150 €</li><li>Kaufkraft (2% Inflation): <strong class="warning">nur ca. 650–750 €</strong></li></ul>' +
          '<p><strong class="warning">→ Altersarmut droht trotz lebenslanger Arbeit.</strong></p>' +
        '</div>' +
      '</div>' +
      '<div class="info-point">' +
        '<p>Kleine Beträge wachsen durch den Zinseszinseffekt enorm.</p>' +
        '<button class="point-toggle" data-target="details-2">2. Sparplan: 100 €/Monat über 40 Jahre</button>' +
        '<div id="details-2" class="point-details">' +
          '<ul><li>Einzahlung: ' + fmt(deps, currency) + '</li><li>Depot (7% p.a.): <strong class="highlight">' + fmt(fv, currency) + '</strong></li></ul>' +
        '</div>' +
      '</div>' +
      '<div class="info-point">' +
        '<p>Aufgebautes Vermögen bietet Flexibilität.</p>' +
        '<button class="point-toggle" data-target="details-3">3. Was bringt das konkret?</button>' +
        '<div id="details-3" class="point-details">' +
          '<h4>Zusatz-Rente (Kapital erhalten)</h4><ul><li>Monatlicher Nettozins: <strong class="highlight">' + fmt(mNet, currency) + '</strong></li></ul>' +
          '<h4>Kapital aufbrauchen (20 Jahre)</h4><ul><li>Monatliche Entnahme: <strong class="highlight">' + fmt(annuity, currency) + '</strong></li></ul>' +
        '</div>' +
      '</div>' +
      '<div class="info-point">' +
        '<p>Späterer Einstieg lohnt sich auch.</p>' +
        '<button class="point-toggle" data-target="details-4">4. Ältere Anleger</button>' +
        '<div id="details-4" class="point-details">' +
          '<h4>Ziel: ' + fmt(fv, currency) + ' in 20 Jahren</h4><ul><li>Nötige Sparrate: <strong class="highlight">' + fmt(reqSave, currency) + '/Monat</strong></li></ul>' +
          '<h4>50.000 € Start + 100 €/Monat</h4><ul><li>Nach 20 Jahren: <strong class="highlight">' + fmt(bal5, currency) + '</strong></li></ul>' +
        '</div>' +
      '</div>' +
      '<div class="info-point">' +
        '<button class="point-toggle" data-target="details-5">5. Zusammenfassung</button>' +
        '<div id="details-5" class="point-details">' +
          '<ul><li>Rente allein reicht oft nicht.</li><li>100 €/Monat → nach 40 Jahren über <strong class="highlight">' + fmt(240000, currency) + '</strong>.</li><li>Frühzeitig beginnen = Freiheit im Alter.</li></ul>' +
        '</div>' +
      '</div>';
  }

  if (toggleWhyInvestBtn) {
    toggleWhyInvestBtn.addEventListener('click', function() {
      var hidden = !whyInvestContent.style.display || whyInvestContent.style.display === 'none';
      if (hidden) {
        updateWhyInvestContent();
        whyInvestContent.style.display = 'block';
      } else {
        whyInvestContent.style.display = 'none';
      }
      toggleWhyInvestBtn.textContent = hidden ? 'Weniger anzeigen' : 'Mehr erfahren';
    });
  }

  if (whyInvestContent) {
    whyInvestContent.addEventListener('click', function(e) {
      if (e.target.classList.contains('point-toggle')) {
        var det = document.getElementById(e.target.getAttribute('data-target'));
        if (det) {
          e.target.classList.toggle('open');
          det.style.display = det.style.display === 'block' ? 'none' : 'block';
        }
      }
    });
  }

  // ========================================
  // CURRENCY LABELS
  // ========================================
  var labelTexts = {
    start: 'Startkapital', rate: 'Monatsrate',
    freibetrag: 'Jährlicher Freibetrag', lumpsum: 'Einmalige Einzahlung',
    payout: 'Einmalige Auszahlung', payoutPlanAmount: 'Auszahlplan Betrag'
  };

  function updateCurrencyLabels(code) {
    var sym = symbolMap[code] || code;
    for (var id in labelTexts) {
      var lbl = document.querySelector('label[for="' + id + '"]');
      if (lbl) lbl.textContent = labelTexts[id] + ' (' + sym + ')';
    }
  }

  // ========================================
  // EVENT LISTENERS
  // ========================================
  advToggle.addEventListener('click', function() {
    var isOpen = advBox.style.display === 'block';
    advBox.style.display = isOpen ? 'none' : 'block';
    advToggle.classList.toggle('open', !isOpen);
    var arrow = advToggle.querySelector('.adv-toggle-arrow');
    if (arrow) arrow.textContent = isOpen ? '▼' : '▲';
  });

  interestRatePresetEl.addEventListener('change', function() {
    interestCustomEl.style.display = this.value === 'custom' ? 'block' : 'none';
    if (this.value === 'custom') {
      interestCustomEl.focus();
      if (!interestCustomEl.value) interestCustomEl.value = "7.6";
    }
  });

  currencyEl.addEventListener('change', function() {
    updateCurrencyLabels(currencyEl.value);
    triggerCalc();
  });

  stopMonthlyRateEnableEl.addEventListener('change', function() {
    stopMonthlyRateYearContainerEl.style.display = this.checked ? 'block' : 'none';
  });

  payoutIntervalEl.addEventListener('change', function() {
    payoutIntervalDaysEl.disabled = this.value !== 'custom';
    if (this.value === 'custom' && !payoutIntervalDaysEl.value) payoutIntervalDaysEl.value = '30';
    else if (this.value !== 'custom') payoutIntervalDaysEl.value = '';
  });

  steuerSatzEl.addEventListener('input', function() {
    taxRateDisplayEl.textContent = this.value || DEFAULT_STEUERSATZ.toString();
  });

  chartAxisToggleEl.addEventListener('change', function() { triggerCalc(); });

  document.querySelectorAll('.btn-group .btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.btn-group .btn').forEach(function(b) { b.classList.remove('active-calc-btn'); });
      this.classList.add('active-calc-btn');
    });
  });

  resetBtn.addEventListener('click', function() { resetValuesAndCalc(); });

  document.querySelectorAll('.asset-toggle').forEach(function(cb) {
    cb.addEventListener('change', function() { triggerCalc(); });
  });

  // Mode buttons
  btnCalcMode.addEventListener('click', function() { switchMode('compare'); });
  btnHistoricalMode.addEventListener('click', function() { switchMode('historical'); });
  assetSelectEl.addEventListener('change', function() { switchMode('historical'); });
  assetStartYearEl.addEventListener('change', function() { switchMode('historical'); });

  // Dynamic entries
  if (addLumpsumBtn) {
    addLumpsumBtn.addEventListener('click', function() {
      addDynamicEntry(lumpsumEntriesContainer, 'lumpsum-amount', 'lumpsum-year');
    });
  }
  if (addOneTimePayoutBtn) {
    addOneTimePayoutBtn.addEventListener('click', function() {
      addDynamicEntry(oneTimePayoutEntriesContainer, 'payout-amount', 'payout-year');
    });
  }

  // ========================================
  // DYNAMIC ENTRIES
  // ========================================
  function addDynamicEntry(container, amtClass, yearClass) {
    var row = document.createElement('div');
    row.className = 'row dynamic-entry-row';
    var sym = symbolMap[currencyEl.value] || currencyEl.value;

    var d1 = document.createElement('div');
    var inp1 = document.createElement('input');
    inp1.type = 'number'; inp1.min = '0'; inp1.value = '0';
    inp1.className = amtClass; inp1.placeholder = 'Betrag (' + sym + ')';
    d1.appendChild(inp1);

    var d2 = document.createElement('div');
    var inp2 = document.createElement('input');
    inp2.type = 'number'; inp2.min = '1'; inp2.value = '1';
    inp2.className = yearClass; inp2.placeholder = 'Jahr';
    d2.appendChild(inp2);

    var rb = document.createElement('button');
    rb.type = 'button'; rb.textContent = '✕'; rb.className = 'remove-btn';
    rb.addEventListener('click', function() { row.remove(); });

    row.appendChild(d1); row.appendChild(d2); row.appendChild(rb);
    container.appendChild(row);
  }

  function getDynamicEntries(amtClass, yearClass) {
    var amounts = document.querySelectorAll('.' + amtClass);
    var years = document.querySelectorAll('.' + yearClass);
    var entries = [];
    for (var i = 0; i < amounts.length; i++) {
      var a = parseFloat(amounts[i].value) || 0;
      var y = parseInt(years[i].value) || 0;
      if (a > 0 && y > 0) entries.push({ amount: a, year: y });
    }
    return entries;
  }

  // ========================================
  // HISTORICAL DATA
  // ========================================
  function fetchHistoricalRates() {
    var asset = assetSelectEl.value;
    var sy = parseInt(assetStartYearEl.value) || new Date().getFullYear();
    return new Promise(function(resolve) {
      try {
        if (asset === 'bitcoin') {
          var from = Math.floor(new Date(sy + '-01-01').getTime() / 1000);
          var to = Math.floor(Date.now() / 1000);
          fetch('https://api.coingecko.com/api/v3/coins/bitcoin/market_chart/range?vs_currency=usd&from=' + from + '&to=' + to)
            .then(function(r) { return r.json(); })
            .then(function(data) {
              var ym = {}, prices = [];
              (data.prices || []).forEach(function(p) {
                var yr = new Date(p[0]).getFullYear();
                if (!ym[yr]) ym[yr] = [];
                ym[yr].push(p[1]);
              });
              Object.keys(ym).sort().forEach(function(yr) {
                if (parseInt(yr) >= sy) {
                  var arr = ym[yr];
                  prices.push(arr.reduce(function(a, b) { return a + b; }, 0) / arr.length);
                }
              });
              loadedHistoricalRates = computeRates(prices);
              resolve();
            }).catch(function() { loadedHistoricalRates = []; resolve(); });
        } else {
          var sym = asset === 'gold' ? 'GLD' : 'URTH';
          fetch('https://www.alphavantage.co/query?function=TIME_SERIES_MONTHLY_ADJUSTED&symbol=' + sym + '&apikey=demo')
            .then(function(r) { return r.json(); })
            .then(function(json) {
              var s = json['Monthly Adjusted Time Series'] || {}, ym = {}, prices = [];
              Object.keys(s).forEach(function(d) {
                var yr = parseInt(d.slice(0, 4));
                if (yr >= sy) {
                  if (!ym[yr]) ym[yr] = [];
                  ym[yr].push(parseFloat(s[d]['5. adjusted close']));
                }
              });
              Object.keys(ym).sort().forEach(function(yr) {
                var arr = ym[yr];
                prices.push(arr.reduce(function(a, b) { return a + b; }, 0) / arr.length);
              });
              loadedHistoricalRates = computeRates(prices);
              resolve();
            }).catch(function() { loadedHistoricalRates = []; resolve(); });
        }
      } catch (e) { loadedHistoricalRates = []; resolve(); }
    });
  }

  function computeRates(prices) {
    var r = [];
    for (var i = 1; i < prices.length; i++) r.push(prices[i] / prices[i - 1] - 1);
    return r;
  }

  // ========================================
  // MODE SWITCHING
  // ========================================
  function switchMode(mode) {
    currentMode = mode;
    btnCalcMode.classList.toggle('active-mode-btn', mode === 'compare');
    btnHistoricalMode.classList.toggle('active-mode-btn', mode === 'historical');
    historicalOptionsEl.style.display = mode === 'historical' ? 'block' : 'none';
    if (mode === 'historical') {
      fetchHistoricalRates().then(function() { triggerCalc(); });
    } else {
      triggerCalc();
    }
  }

  // ========================================
  // HELPERS
  // ========================================
  function triggerCalc() {
    var ab = document.querySelector('.btn-group .btn.active-calc-btn');
    var isNetto = ab && ab.textContent.indexOf('Netto') !== -1;
    calc(isNetto);
  }

  function darkScale() {
    return { grid: { color: 'rgba(42,46,69,0.8)', drawBorder: false }, ticks: { color: '#8b8fa6' } };
  }

  function chartOpts(currency) {
    return {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        tooltip: {
          backgroundColor: '#1a1d2e', borderColor: '#333759', borderWidth: 1,
          titleColor: '#e2e4ec', bodyColor: '#8b8fa6', padding: 12, cornerRadius: 8,
          callbacks: {
            label: function(ctx) {
              var l = ctx.dataset.label || '';
              if (l) l += ': ';
              var v = (ctx.dataset.label === 'Auszahlungen (jährlich)') ? Math.abs(ctx.parsed.y) : ctx.parsed.y;
              return l + fmt(v, currency);
            }
          }
        },
        legend: { labels: { color: '#8b8fa6', usePointStyle: true, padding: 16 } }
      },
      layout: { padding: { top: 10, bottom: 5, left: 5, right: 5 } }
    };
  }

  function compTotal(start, lumps, bRate, rInc, aRate, yrs, stopOn, stopYr) {
    var t = start;
    lumps.forEach(function(l) { if (l.amount > 0) t += l.amount; });
    var dr = bRate;
    for (var y = 1; y <= yrs; y++) {
      if (y > 1) dr *= (1 + rInc);
      t += (stopOn && y >= stopYr) ? 0 : dr * 12;
      t *= (1 + aRate);
    }
    return t;
  }

  function updateCompare(etfT, tdT, bankT, btcT, ethT, cur) {
    if (chartCompare) { chartCompare.destroy(); chartCompare = null; }
    var sel = [];
    document.querySelectorAll('.asset-toggle:checked').forEach(function(c) { sel.push(c.value); });
    var lb = [], dt = [], co = [];
    if (sel.indexOf('etf') !== -1) { lb.push('ETF'); dt.push(etfT); co.push(COMPARE_COLORS.etf); }
    if (sel.indexOf('tagesgeld') !== -1) { lb.push('Tagesgeld 2%'); dt.push(tdT); co.push(COMPARE_COLORS.tagesgeld); }
    if (sel.indexOf('bank') !== -1) { lb.push('Bank 0%'); dt.push(bankT); co.push(COMPARE_COLORS.bank); }
    if (sel.indexOf('bitcoin') !== -1) { lb.push('Bitcoin'); dt.push(btcT); co.push(COMPARE_COLORS.bitcoin); }
    if (sel.indexOf('ethereum') !== -1) { lb.push('Ethereum'); dt.push(ethT); co.push(COMPARE_COLORS.ethereum); }
    if (lb.length === 0) return;

    var o = chartOpts(cur);
    var ds = darkScale();
    chartCompare = new Chart(document.getElementById('compare').getContext('2d'), {
      type: 'bar',
      data: { labels: lb, datasets: [{ data: dt, backgroundColor: co, barPercentage: 0.65, borderRadius: 4 }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: o.interaction, layout: o.layout,
        plugins: { tooltip: o.plugins.tooltip, legend: { display: false } },
        scales: {
          y: { grid: ds.grid, ticks: ds.ticks, title: { display: true, text: 'Gesamtwert (' + cur + ')', color: '#8b8fa6' } },
          x: ds
        }
      }
    });
  }

  // ========================================
  // RESET
  // ========================================
  function resetValuesAndCalc() {
    currencyEl.value = DEFAULT_CURRENCY;
    rateEl.value = DEFAULT_MONTHLY_RATE;
    monthlyRateIncreaseEl.value = DEFAULT_RATE_INCREASE;
    yearsEl.value = DEFAULT_YEARS;
    startCalendarYearEl.value = new Date().getFullYear();
    interestRatePresetEl.value = DEFAULT_INTEREST_PRESET;
    interestCustomEl.value = '';
    interestCustomEl.style.display = 'none';
    etfTypeEl.value = DEFAULT_ETF_TYPE;
    freibetragEl.value = DEFAULT_FREIBETRAG;
    steuerSatzEl.value = DEFAULT_STEUERSATZ;
    basiszinsEl.value = DEFAULT_BASISZINS;
    taxRateDisplayEl.textContent = DEFAULT_STEUERSATZ.toString();
    startEl.value = 0;
    stopMonthlyRateEnableEl.checked = false;
    stopMonthlyRateYearEl.value = 10;
    stopMonthlyRateYearContainerEl.style.display = 'none';
    payoutYearTypeEl.value = 'laufjahr';

    lumpsumEntriesContainer.innerHTML =
      '<div class="row main-entry-row"><div><label for="lumpsum">Einmalige Einzahlung (€)</label><input id="lumpsum" type="number" value="0" min="0" class="lumpsum-amount"></div><div><label for="lumpyear">Im Jahr (Laufjahr):</label><input id="lumpyear" type="number" value="1" min="1" class="lumpsum-year"></div></div>';
    oneTimePayoutEntriesContainer.innerHTML =
      '<div class="row main-entry-row"><div><label>Einmalige Auszahlung (€)</label><input id="payout" type="number" value="0" min="0" class="payout-amount"></div><div><label>Im Jahr:</label><input id="payoutYear" type="number" value="1" min="1" class="payout-year" placeholder="Jahr"></div></div>';

    payoutPlanAmountEl.value = 0;
    payoutStartYearEl.value = 1;
    payoutIntervalEl.value = 'monthly';
    payoutIntervalDaysEl.value = '';
    payoutIntervalDaysEl.disabled = true;
    assetSelectEl.value = 'gold';
    assetStartYearEl.value = 2015;
    loadedHistoricalRates = [];
    currentMode = 'compare';
    btnCalcMode.classList.add('active-mode-btn');
    btnHistoricalMode.classList.remove('active-mode-btn');
    historicalOptionsEl.style.display = 'none';
    chartAxisToggleEl.checked = false;
    warnEl.textContent = '';
    headlineEl.innerHTML = '';

    if (chartMain) { chartMain.destroy(); chartMain = null; }
    if (chartCompare) { chartCompare.destroy(); chartCompare = null; }

    document.querySelectorAll('.btn-group .btn').forEach(function(b) { b.classList.remove('active-calc-btn'); });
    var bb = document.querySelector('.btn-group .btn[onclick="calc(false)"]');
    if (bb) bb.classList.add('active-calc-btn');

    advBox.style.display = 'none';
    advToggle.classList.remove('open');
    var arr = advToggle.querySelector('.adv-toggle-arrow');
    if (arr) arr.textContent = '▼';

    updateCurrencyLabels(DEFAULT_CURRENCY);
    calc(false);
  }

  // ========================================
  // MAIN CALCULATION
  // ========================================
  function calc(withTax) {
    warnEl.textContent = '';
    var currency = currencyEl.value;
    var baseRate = parseFloat(rateEl.value) || 0;
    var rateInc = (parseFloat(monthlyRateIncreaseEl.value) || 0) / 100;
    var totalYrs = parseInt(yearsEl.value) || 0;
    var startYr = parseInt(startCalendarYearEl.value) || new Date().getFullYear();
    var intVal = (interestRatePresetEl.value === 'custom') ? (parseFloat(interestCustomEl.value) || 0) : (parseFloat(interestRatePresetEl.value) || 0);
    var annRate = intVal / 100;
    var startCap = parseFloat(startEl.value) || 0;
    var stopOn = stopMonthlyRateEnableEl.checked;
    var stopYr = parseInt(stopMonthlyRateYearEl.value) || 0;
    var etfTp = etfTypeEl.value;
    var frei = parseFloat(freibetragEl.value) || 0;
    var stSatz = (parseFloat(steuerSatzEl.value) || 0) / 100;
    var bz = (parseFloat(basiszinsEl.value) || 0) / 100;
    var pyType = payoutYearTypeEl.value;
    var lumps = getDynamicEntries('lumpsum-amount', 'lumpsum-year');
    var otPays = getDynamicEntries('payout-amount', 'payout-year');
    var calAxis = chartAxisToggleEl.checked;
    var plAmt = parseFloat(payoutPlanAmountEl.value) || 0;
    var plStart = parseInt(payoutStartYearEl.value) || 0;
    var plInt = payoutIntervalEl.value;
    var plDays = parseInt(payoutIntervalDaysEl.value) || 0;
    var hRates = (currentMode === 'historical') ? loadedHistoricalRates : [];

    if (totalYrs < 1) { warnEl.textContent = 'Bitte Laufzeit ≥ 1 Jahr eingeben.'; return; }
    for (var pi = 0; pi < otPays.length; pi++) {
      var ey = otPays[pi].year;
      if (pyType === 'kalenderjahr') ey = otPays[pi].year - startYr + 1;
      if (ey < 1 || ey > totalYrs) { warnEl.textContent = 'Auszahlung im Jahr ' + otPays[pi].year + ' liegt außerhalb der Laufzeit.'; return; }
    }

    var bal = startCap, cumDep = startCap, cumPay = 0, cumTax = 0, frRest = frei, allVPA = 0;
    var labels = [], ndD = [], ngD = [], pD = [], tD = [];
    var monthlyRate = baseRate;

    for (var y = 1; y <= totalYrs; y++) {
      var cy = startYr + y - 1;
      var yPay = 0, bStart = bal, yTax = 0;
      if (y > 1) { frRest = frei; monthlyRate *= (1 + rateInc); }

      for (var li = 0; li < lumps.length; li++) {
        if (lumps[li].year === y) { bal += lumps[li].amount; cumDep += lumps[li].amount; bStart += lumps[li].amount; }
      }

      var con = (!(stopOn && y >= stopYr)) ? monthlyRate * 12 : 0;
      bal += con; cumDep += con;

      var preI = bal;
      var rfy = annRate;
      if (hRates.length > 0) rfy = (hRates[y - 1] !== undefined) ? hRates[y - 1] : hRates[hRates.length - 1];
      bal *= (1 + rfy);
      var gain = bal - preI;

      for (var oi = 0; oi < otPays.length; oi++) {
        var occ = (pyType === 'laufjahr' && otPays[oi].year === y) || (pyType === 'kalenderjahr' && otPays[oi].year === cy);
        if (occ) { var am = Math.min(bal, otPays[oi].amount); bal -= am; cumPay += am; yPay += am; }
      }

      if (y >= plStart && plAmt > 0) {
        var ypl = 0;
        if (plInt === 'yearly') ypl = plAmt;
        else if (plInt === 'custom' && plDays > 0) ypl = plAmt * (365 / plDays);
        else ypl = plAmt * 12;
        var apl = Math.min(bal, ypl); bal -= apl; cumPay += apl; yPay += apl;
      }

      if (withTax) {
        if (etfTp === 'thesaurierend') {
          var vpR = bStart * bz * 0.7;
          var vpA = Math.min(vpR, gain);
          allVPA += vpA;
          var txb = Math.max(0, vpA - frRest);
          yTax = txb * stSatz;
          frRest -= Math.min(vpA, frRest);
        } else {
          var txbA = Math.max(0, gain - frRest);
          yTax = txbA * stSatz;
          frRest -= Math.min(gain, frRest);
        }
        yTax = Math.max(0, yTax);
        bal -= yTax; cumTax += yTax;
      }

      labels.push(calAxis ? cy.toString() : 'Jahr ' + y);
      var ni = cumDep - cumPay;
      ndD.push(Math.max(0, ni));
      ngD.push(Math.max(0, bal - ni));
      pD.push(-yPay);
      tD.push(cumTax);
    }

    var fBal = bal, fNI = cumDep - cumPay, fGain = fBal - fNI;

    // Build results HTML
    var h = '';
    h += '<div class="headline-item"><span class="headline-label">Brutto-Einzahlungen:</span><span class="headline-sub-value">' + fmt(cumDep, currency) + '</span></div>';
    h += '<div class="headline-item"><span class="headline-label">Gewinn ' + (withTax ? '(Netto vor Verkauf)' : '(Brutto)') + ':</span><span class="headline-value">' + fmt(fGain, currency) + '</span></div>';
    h += '<div class="headline-item"><span class="headline-label">Auszahlungen (kumuliert):</span><span class="headline-sub-value">' + fmt(cumPay, currency) + '</span></div>';

    if (withTax) {
      var sg = fBal - (cumDep - allVPA - cumPay);
      var st = Math.max(0, sg - frei);
      var sTx = Math.max(0, st * stSatz * 0.7);
      var aST = fBal - sTx;
      h += '<div class="headline-item"><span class="headline-label">Verkaufsteuer (hypothetisch):</span><span class="headline-sub-value">' + fmt(sTx, currency) + ' <button type="button" class="info-btn" data-modal-target="modalVerkaufsteuerInfo" title="Info">?</button></span></div>';
      h += '<div class="headline-item"><span class="headline-label">Endkapital (nach Verkaufsteuer):</span><span class="headline-value">' + fmt(aST, currency) + '</span></div>';
    } else {
      h += '<div class="headline-item"><span class="headline-label">Endkapital:</span><span class="headline-value">' + fmt(fBal, currency) + '</span></div>';
    }
    headlineEl.innerHTML = h;
    attachModalListeners();

    // Main chart
    if (chartMain) { chartMain.destroy(); chartMain = null; }
    var ds = [
      { label: 'Netto Einzahlungen', data: ndD, backgroundColor: CAPITAL_COLOR, stack: 'pos', borderRadius: 2 },
      { label: 'Gewinn ' + (withTax ? '(Netto)' : '(Brutto)'), data: ngD, backgroundColor: GAIN_COLOR, stack: 'pos', borderRadius: 2 },
      { label: 'Auszahlungen (jährlich)', data: pD, backgroundColor: ANNUAL_PAYOUT_COLOR, stack: 'neg', borderRadius: 2 }
    ];
    if (withTax) {
      ds.push({
        label: 'Steuer (kumuliert)', data: tD, backgroundColor: TAX_COLOR_DIAGRAM,
        borderColor: TAX_COLOR_DIAGRAM, type: 'line', order: -1, yAxisID: 'y1',
        pointRadius: 0, borderWidth: 2, fill: false, tension: 0.3
      });
    }
    var co = chartOpts(currency);
    var dsc = darkScale();
    chartMain = new Chart(document.getElementById('chart').getContext('2d'), {
      type: 'bar',
      data: { labels: labels, datasets: ds },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: co.interaction, layout: co.layout, plugins: co.plugins,
        scales: {
          y: { grid: dsc.grid, ticks: dsc.ticks, stacked: true, beginAtZero: true, title: { display: true, text: 'Betrag (' + currency + ')', color: '#8b8fa6' } },
          y1: { grid: { drawOnChartArea: false }, ticks: dsc.ticks, display: !!withTax, position: 'right', title: { display: true, text: 'Steuer kumuliert', color: '#8b8fa6' } },
          x: { grid: dsc.grid, ticks: dsc.ticks, stacked: true, title: { display: true, text: calAxis ? 'Kalenderjahr' : 'Laufjahre', color: '#8b8fa6' } }
        }
      }
    });

    // Compare chart
    var etfT = fBal + cumPay;
    var bR = parseFloat(rateEl.value) || 0;
    var tdT = compTotal(startCap, lumps, bR, rateInc, 0.02, totalYrs, stopOn, stopYr);
    var btcT = compTotal(startCap, lumps, bR, rateInc, 0.45, totalYrs, stopOn, stopYr);
    var ethT = compTotal(startCap, lumps, bR, rateInc, 0.30, totalYrs, stopOn, stopYr);
    updateCompare(etfT, tdT, cumDep, btcT, ethT, currency);
  }

  // Make calc globally accessible for onclick attributes in HTML
  window.calc = calc;

  // ========================================
  // START
  // ========================================
  resetValuesAndCalc();

}); // END DOMContentLoaded
