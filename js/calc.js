// ============================================
// PersoShift – Calculator Logic
// Depends on: data.js, ui.js
// ============================================

// --- Chart.js Defaults ---
Chart.defaults.font.family = 'Inter, sans-serif';
Chart.defaults.font.size = 13;
Chart.defaults.plugins.legend.position = 'bottom';
Chart.defaults.maintainAspectRatio = false;
Chart.defaults.responsive = true;

// --- Historical Rate Functions ---
function computeRatesFromPrices(prices) {
  var rates = [];
  for (var i = 1; i < prices.length; i++) rates.push(prices[i] / prices[i - 1] - 1);
  return rates;
}

function fetchHistoricalRates() {
  var asset = assetSelectEl.value;
  var startYear = parseInt(assetStartYearEl.value) || new Date().getFullYear();
  var prices = [];
  return new Promise(function(resolve) {
    try {
      if (asset === 'bitcoin') {
        var from = Math.floor(new Date(startYear + '-01-01').getTime() / 1000);
        var to = Math.floor(Date.now() / 1000);
        fetch('https://api.coingecko.com/api/v3/coins/bitcoin/market_chart/range?vs_currency=usd&from=' + from + '&to=' + to)
          .then(function(r) { return r.json(); })
          .then(function(data) {
            var ym = {};
            (data.prices || []).forEach(function(p) { var y = new Date(p[0]).getFullYear(); if (!ym[y]) ym[y] = []; ym[y].push(p[1]); });
            Object.keys(ym).sort().forEach(function(y) { if (y >= startYear) prices.push(ym[y].reduce(function(a, b) { return a + b; }, 0) / ym[y].length); });
            loadedHistoricalRates = computeRatesFromPrices(prices);
            resolve();
          }).catch(function() { loadedHistoricalRates = []; resolve(); });
      } else {
        var sym = asset === 'gold' ? 'GLD' : 'URTH';
        fetch('https://www.alphavantage.co/query?function=TIME_SERIES_MONTHLY_ADJUSTED&symbol=' + sym + '&apikey=demo')
          .then(function(r) { return r.json(); })
          .then(function(json) {
            var s = json['Monthly Adjusted Time Series'] || {}, ym = {};
            Object.keys(s).forEach(function(d) { var y = parseInt(d.slice(0, 4)); if (y >= startYear) { if (!ym[y]) ym[y] = []; ym[y].push(parseFloat(s[d]['5. adjusted close'])); } });
            Object.keys(ym).sort().forEach(function(y) { prices.push(ym[y].reduce(function(a, b) { return a + b; }, 0) / ym[y].length); });
            loadedHistoricalRates = computeRatesFromPrices(prices);
            resolve();
          }).catch(function() { loadedHistoricalRates = []; resolve(); });
      }
    } catch (e) { loadedHistoricalRates = []; resolve(); }
  });
}

// --- Comparison Helper ---
function computeComparisonTotal(start, lumpsums, baseRate, rateIncrease, annualRate, years, stopEnabled, stopYear) {
  var total = start;
  lumpsums.forEach(function(l) { if (l.amount > 0) total += l.amount; });
  var dynRate = baseRate;
  for (var y = 1; y <= years; y++) {
    if (y > 1) dynRate *= (1 + rateIncrease);
    total += (stopEnabled && y >= stopYear) ? 0 : dynRate * 12;
    total *= (1 + annualRate);
  }
  return total;
}

// --- Compare Chart ---
function updateCompareChart(etfTotal, tdTotal, bankTotal, btcTotal, ethTotal, currency) {
  if (chartCompare) chartCompare.destroy();
  var selected = Array.from(document.querySelectorAll('.asset-toggle:checked')).map(function(cb) { return cb.value; });
  var labels = [], data = [], colors = [];
  if (selected.indexOf('etf') !== -1) { labels.push('ETF'); data.push(etfTotal); colors.push(COMPARE_COLORS.etf); }
  if (selected.indexOf('tagesgeld') !== -1) { labels.push('Tagesgeld 2%'); data.push(tdTotal); colors.push(COMPARE_COLORS.tagesgeld); }
  if (selected.indexOf('bank') !== -1) { labels.push('Bank 0%'); data.push(bankTotal); colors.push(COMPARE_COLORS.bank); }
  if (selected.indexOf('bitcoin') !== -1) { labels.push('Bitcoin'); data.push(btcTotal); colors.push(COMPARE_COLORS.bitcoin); }
  if (selected.indexOf('ethereum') !== -1) { labels.push('Ethereum'); data.push(ethTotal); colors.push(COMPARE_COLORS.ethereum); }
  compareChartTitleEl.textContent = 'Vergleich (Gesamtwertentwicklung)';
  var opts = { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
    plugins: { tooltip: { callbacks: { label: function(ctx) { return ctx.label + ': ' + fmt(ctx.parsed.y, currency); } } }, legend: { display: false } },
    scales: { y: { title: { display: true, text: 'Gesamtwert (' + currency.toUpperCase() + ')' } } },
    layout: { padding: { top: 20, bottom: 10, left: 10, right: 10 } } };
  chartCompare = new Chart(document.getElementById('compare').getContext('2d'), {
    type: 'bar', data: { labels: labels, datasets: [{ data: data, backgroundColor: colors, barPercentage: 0.7 }] }, options: opts
  });
}

// --- Mode Switching ---
function updateMode(newMode) {
  currentMode = newMode;
  btnCalcMode.classList.toggle('active-mode-btn', newMode === 'compare');
  btnHistoricalMode.classList.toggle('active-mode-btn', newMode === 'historical');
  historicalOptionsEl.style.display = newMode === 'historical' ? 'block' : 'none';
  if (newMode === 'historical') {
    fetchHistoricalRates().then(function() { triggerCalc(); });
  } else { triggerCalc(); }
}

function triggerCalc() {
  var a = document.querySelector('.btn-group .btn.active-calc-btn');
  calc(a && a.textContent.indexOf('Netto') !== -1);
}

btnCalcMode.addEventListener('click', function() { updateMode('compare'); });
btnHistoricalMode.addEventListener('click', function() { updateMode('historical'); });
assetSelectEl.addEventListener('change', function() { updateMode('historical'); });
assetStartYearEl.addEventListener('change', function() { updateMode('historical'); });
assetToggleEls.forEach(function(cb) { cb.addEventListener('change', function() { triggerCalc(); }); });
chartAxisToggleEl.addEventListener('change', function() { triggerCalc(); });

// --- Reset ---
function resetValuesAndCalc() {
  currencyEl.value = DEFAULT_CURRENCY; rateEl.value = DEFAULT_MONTHLY_RATE;
  monthlyRateIncreaseEl.value = DEFAULT_RATE_INCREASE; yearsEl.value = DEFAULT_YEARS;
  startCalendarYearEl.value = new Date().getFullYear();
  interestRatePresetEl.value = DEFAULT_INTEREST_PRESET; interestCustomEl.value = '';
  interestRatePresetEl.dispatchEvent(new Event('change'));
  etfTypeEl.value = DEFAULT_ETF_TYPE; freibetragEl.value = DEFAULT_FREIBETRAG;
  steuerSatzEl.value = DEFAULT_STEUERSATZ; basiszinsEl.value = DEFAULT_BASISZINS;
  taxRateDisplayEl.textContent = DEFAULT_STEUERSATZ.toString();
  startEl.value = 0; stopMonthlyRateEnableEl.checked = false; stopMonthlyRateYearEl.value = 10;
  stopMonthlyRateEnableEl.dispatchEvent(new Event('change'));
  payoutYearTypeEl.value = 'laufjahr';
  lumpsumEntriesContainer.innerHTML = '<div class="row main-entry-row"><div><label for="lumpsum">Einmalige Einzahlung (€)</label><input id="lumpsum" type="number" value="0" min="0" class="lumpsum-amount"></div><div><label for="lumpyear">Einmalige Einzahlung im Jahr (Laufjahr):</label><input id="lumpyear" type="number" value="1" min="1" class="lumpsum-year"></div></div>';
  oneTimePayoutEntriesContainer.innerHTML = '<div class="row main-entry-row"><div><label>Einmalige Auszahlung (€)</label><input id="payout" type="number" value="0" min="0" class="payout-amount"></div><div><label>Auszahlung im Jahr:</label><input id="payoutYear" type="number" value="1" min="1" class="payout-year" placeholder="Jahr"></div></div>';
  payoutPlanAmountEl.value = 0; payoutStartYearEl.value = 1; payoutIntervalEl.value = 'monthly';
  payoutIntervalDaysEl.value = ''; payoutIntervalEl.dispatchEvent(new Event('change'));
  assetSelectEl.value = 'gold'; assetStartYearEl.value = 2015; loadedHistoricalRates = [];
  updateMode('compare'); chartAxisToggleEl.checked = false; warnEl.textContent = ''; headlineEl.innerHTML = '';
  if (chartMain) { chartMain.destroy(); chartMain = null; }
  if (chartCompare) { chartCompare.destroy(); chartCompare = null; }
  document.querySelectorAll('.btn-group .btn').forEach(function(b) { b.classList.remove('active-calc-btn'); });
  var bb = document.querySelector('.btn[onclick="calc(false)"]'); if (bb) bb.classList.add('active-calc-btn');
  updateCurrencyLabels(DEFAULT_CURRENCY); calc(false);
}
resetBtn.addEventListener('click', resetValuesAndCalc);

// --- MAIN CALCULATION ---
function calc(withTax) {
  warnEl.textContent = '';
  var currency = currencyEl.value;
  var baseMonthlyRate = parseFloat(rateEl.value) || 0;
  var monthlyRateIncrease = (parseFloat(monthlyRateIncreaseEl.value) || 0) / 100;
  var totalYears = parseInt(yearsEl.value) || 0;
  var investStartYear = parseInt(startCalendarYearEl.value) || new Date().getFullYear();
  var intVal = (interestRatePresetEl.value === 'custom') ? (parseFloat(interestCustomEl.value) || 0) : (parseFloat(interestRatePresetEl.value) || 0);
  var annualRate = intVal / 100;
  var startCapital = parseFloat(startEl.value) || 0;
  var stopEnabled = stopMonthlyRateEnableEl.checked;
  var stopYear = parseInt(stopMonthlyRateYearEl.value) || 0;
  var etfType = etfTypeEl.value;
  var freibetrag = parseFloat(freibetragEl.value) || 0;
  var steuerSatz = (parseFloat(steuerSatzEl.value) || 0) / 100;
  var basiszins = (parseFloat(basiszinsEl.value) || 0) / 100;
  var pyType = payoutYearTypeEl.value;
  var lumpsums = getDynamicEntries('lumpsum-amount', 'lumpsum-year');
  var otPayouts = getDynamicEntries('payout-amount', 'payout-year');
  var calAxis = chartAxisToggleEl.checked;
  var planAmt = parseFloat(payoutPlanAmountEl.value) || 0;
  var planStart = parseInt(payoutStartYearEl.value) || 0;
  var planInt = payoutIntervalEl.value;
  var planDays = parseInt(payoutIntervalDaysEl.value) || 0;
  var hRates = (currentMode === 'historical') ? loadedHistoricalRates : [];

  if (totalYears < 1) { warnEl.textContent = 'Bitte Laufzeit >= 1 Jahr eingeben.'; return; }
  for (var pi = 0; pi < otPayouts.length; pi++) {
    var ey = otPayouts[pi].year;
    if (pyType === 'kalenderjahr') ey = otPayouts[pi].year - investStartYear + 1;
    if (ey < 1 || ey > totalYears) { warnEl.textContent = 'Auszahlung im Jahr ' + otPayouts[pi].year + ' liegt ausserhalb der Laufzeit.'; return; }
  }

  var balance = startCapital, cumDep = startCapital, cumPay = 0, cumTax = 0, frRest = freibetrag, allVPA = 0;
  var labels = [], ndD = [], ngD = [], apD = [], ctD = [];

  for (var y = 1; y <= totalYears; y++) {
    var cy = investStartYear + y - 1, yPay = 0, bStart = balance, yTax = 0;
    if (y > 1) { frRest = freibetrag; baseMonthlyRate *= (1 + monthlyRateIncrease); }
    lumpsums.forEach(function(l) { if (l.year === y) { balance += l.amount; cumDep += l.amount; bStart += l.amount; } });
    var contrib = (!(stopEnabled && y >= stopYear)) ? baseMonthlyRate * 12 : 0;
    balance += contrib; cumDep += contrib;
    var preI = balance;
    var rfy = annualRate;
    if (hRates.length > 0) rfy = hRates[y - 1] !== undefined ? hRates[y - 1] : hRates[hRates.length - 1];
    balance *= (1 + rfy);
    var gain = balance - preI;
    otPayouts.forEach(function(p) {
      var occ = (pyType === 'laufjahr' && p.year === y) || (pyType === 'kalenderjahr' && p.year === cy);
      if (occ) { var am = Math.min(balance, p.amount); balance -= am; cumPay += am; yPay += am; }
    });
    if (y >= planStart && planAmt > 0) {
      var ypl = 0;
      if (planInt === 'yearly') ypl = planAmt;
      else if (planInt === 'custom' && planDays > 0) ypl = planAmt * (365 / planDays);
      else ypl = planAmt * 12;
      var apl = Math.min(balance, ypl); balance -= apl; cumPay += apl; yPay += apl;
    }
    if (withTax) {
      if (etfType === 'thesaurierend') {
        var vpR = bStart * basiszins * 0.7, vpA = Math.min(vpR, gain); allVPA += vpA;
        var txb = Math.max(0, vpA - frRest); yTax = txb * steuerSatz; frRest -= Math.min(vpA, frRest);
      } else {
        var txbA = Math.max(0, gain - frRest); yTax = txbA * steuerSatz; frRest -= Math.min(gain, frRest);
      }
      yTax = Math.max(0, yTax); balance -= yTax; cumTax += yTax;
    }
    labels.push(calAxis ? cy.toString() : 'Jahr ' + y);
    var ni = cumDep - cumPay;
    ndD.push(Math.max(0, ni)); ngD.push(Math.max(0, balance - ni)); apD.push(-yPay); ctD.push(cumTax);
  }

  var fBal = balance, fNI = cumDep - cumPay, fGain = fBal - fNI;
  var vk = 0, enk = fBal;

  // Headline
  var h = '<div class="headline-item"><span class="headline-label">Brutto-Einzahlungen:</span><span class="headline-sub-value">' + fmt(cumDep, currency) + '</span></div>';
  h += '<div class="headline-item"><span class="headline-label">Gewinn ' + (withTax ? '(Netto vor Verkauf)' : '(Brutto)') + ':</span><span class="headline-value">' + fmt(fGain, currency) + '</span></div>';
  h += '<div class="headline-item"><span class="headline-label">Auszahlungen (kumuliert):</span><span class="headline-sub-value">' + fmt(cumPay, currency) + '</span></div>';
  if (withTax) {
    var sg = fBal - (cumDep - allVPA - cumPay), st = Math.max(0, sg - freibetrag);
    vk = Math.max(0, st * steuerSatz * 0.7); enk = fBal - vk;
    h += '<div class="headline-item"><span class="headline-label">Verkaufsteuer (hypothetisch):</span><span class="headline-sub-value">' + fmt(vk, currency) + ' <button type="button" class="info-btn" data-modal-target="modalVerkaufsteuerInfo" title="Info">?</button></span></div>';
    h += '<div class="headline-item"><span class="headline-label">Endkapital (nach Verkaufsteuer):</span><span class="headline-value">' + fmt(enk, currency) + '</span></div>';
  } else {
    h += '<div class="headline-item"><span class="headline-label">Endkapital:</span><span class="headline-value">' + fmt(fBal, currency) + '</span></div>';
  }
  headlineEl.innerHTML = h;
  attachModalListeners();

  // KPI Cards
  var kE = document.getElementById('kpiEndkapital');
  var kES = document.getElementById('kpiEndkapitalSub');
  var kEi = document.getElementById('kpiEinzahlungen');
  var kEiS = document.getElementById('kpiEinzahlungenSub');
  var kG = document.getElementById('kpiGewinn');
  var kGS = document.getElementById('kpiGewinnSub');
  var kF = document.getElementById('kpiFaktor');
  var kFS = document.getElementById('kpiFaktorSub');
  var kSt = document.getElementById('kpiSteuern');
  var kStS = document.getElementById('kpiSteuernSub');
  if (kE) {
    kE.textContent = fmt(withTax ? enk : fBal, currency);
    kES.textContent = withTax ? 'Netto' : 'Brutto';
  }
  if (kEi) {
    kEi.textContent = fmt(cumDep, currency);
    kEiS.textContent = fmt(parseFloat(rateEl.value) || 0, currency) + '/Monat × ' + totalYears + ' J.';
  }
  if (kG) {
    kG.textContent = fmt(fGain, currency);
    var pct = cumDep > 0 ? ((fGain / cumDep) * 100).toFixed(1) : '0';
    kGS.textContent = '+' + pct + '%';
  }
  if (kF) {
    var faktor = cumDep > 0 ? ((withTax ? enk : fBal) / cumDep).toFixed(2) : '–';
    kF.textContent = faktor + 'x';
    kFS.textContent = '';
  }
  if (kSt) {
    if (withTax) {
      kSt.textContent = fmt(cumTax + vk, currency);
      kStS.textContent = 'VPA + Verkauf';
    } else {
      kSt.textContent = '–';
      kStS.textContent = 'nur bei Netto';
    }
  }

  // Main chart
  var chartOpts = { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
    plugins: { tooltip: { callbacks: { label: function(ctx) { var l = ctx.dataset.label || ''; if (l) l += ': '; return l + fmt(Math.abs(ctx.parsed.y), currency); } } } },
    layout: { padding: { top: 20, bottom: 10, left: 10, right: 10 } } };
  if (chartMain) chartMain.destroy();
  var ds = [
    { label: 'Netto Einzahlungen', data: ndD, backgroundColor: CAPITAL_COLOR, stack: 'pos' },
    { label: 'Gewinn ' + (withTax ? '(Netto)' : '(Brutto)'), data: ngD, backgroundColor: GAIN_COLOR, stack: 'pos' },
    { label: 'Auszahlungen (jährlich)', data: apD, backgroundColor: ANNUAL_PAYOUT_COLOR, stack: 'neg' }
  ];
  if (withTax) ds.push({ label: 'Steuer (kumuliert)', data: ctD, backgroundColor: TAX_COLOR_DIAGRAM, type: 'line', order: -1, yAxisID: 'y1' });
  chartMain = new Chart(document.getElementById('chart').getContext('2d'), {
    type: 'bar', data: { labels: labels, datasets: ds },
    options: Object.assign({}, chartOpts, {
      scales: {
        y: { stacked: true, title: { display: true, text: 'Betrag (' + currency.toUpperCase() + ')' }, beginAtZero: true },
        y1: { display: !!withTax, position: 'right', title: { display: true, text: 'Steuer kumuliert' }, grid: { drawOnChartArea: false } },
        x: { stacked: true, title: { display: true, text: calAxis ? 'Kalenderjahr' : 'Laufjahre' } }
      }
    })
  });

  // Compare
  var etfT = fBal + cumPay, bR = parseFloat(rateEl.value) || 0;
  var tdT = computeComparisonTotal(startCapital, lumpsums, bR, monthlyRateIncrease, 0.02, totalYears, stopEnabled, stopYear);
  var btcT = computeComparisonTotal(startCapital, lumpsums, bR, monthlyRateIncrease, 0.45, totalYears, stopEnabled, stopYear);
  var ethT = computeComparisonTotal(startCapital, lumpsums, bR, monthlyRateIncrease, 0.30, totalYears, stopEnabled, stopYear);
  updateCompareChart(etfT, tdT, cumDep, btcT, ethT, currency);
}

// --- Init ---
document.addEventListener('DOMContentLoaded', function() { resetValuesAndCalc(); });
