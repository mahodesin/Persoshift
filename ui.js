// ============================================
// PersoShift – UI (DOM, Modals, Toggles, Inputs)
// Depends on: data.js
// ============================================

// --- Global state ---
var chartMain = null;
var chartCompare = null;
var currentMode = 'compare';
var loadedHistoricalRates = [];

// --- Currency formatter ---
function fmt(n, currency) {
  currency = currency || 'EUR';
  var locale = 'de-DE';
  if (currency === 'USD') locale = 'en-US';
  if (currency === 'GBP') locale = 'en-GB';
  if (currency === 'JPY') locale = 'ja-JP';
  if (currency === 'AUD') locale = 'en-AU';
  return n.toLocaleString(locale, { style: 'currency', currency: currency, maximumFractionDigits: 0 });
}

// --- DOM References ---
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
var assetToggleEls = document.querySelectorAll('.asset-toggle');

// --- Modal Functions ---
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

// Attach modal listeners (safe to call multiple times)
function attachModalListeners() {
  document.querySelectorAll('[data-modal-target]').forEach(function(btn) {
    if (btn.getAttribute('data-ml') !== '1') {
      btn.addEventListener('click', function() { openModal(this.getAttribute('data-modal-target')); });
      btn.setAttribute('data-ml', '1');
    }
  });
}
attachModalListeners();
document.querySelectorAll('[data-close-modal]').forEach(function(btn) { btn.addEventListener('click', closeModal); });
window.addEventListener('click', function(e) { if (e.target === infoModal) closeModal(); });
window.addEventListener('keydown', function(e) { if (e.key === 'Escape') closeModal(); });

// --- "Why Invest" Section (FULL TEXT) ---
function updateWhyInvestContent() {
  var currency = 'EUR';
  var interestRate = 0.07;
  var balance1 = 0;
  for (var i = 0; i < 40 * 12; i++) { balance1 += 100; balance1 *= (1 + interestRate / 12); }
  var totalDeposits1 = 100 * 12 * 40;
  var finalValue1 = balance1;
  var monthlyInterestGross = (finalValue1 * interestRate) / 12;
  var monthlyInterestNet = monthlyInterestGross * (1 - 0.26375);
  var r_a = interestRate / 12, n_a = 20 * 12;
  var monthlyAnnuity = finalValue1 * (r_a * Math.pow(1 + r_a, n_a)) / (Math.pow(1 + r_a, n_a) - 1);
  var futureValueFactor = (Math.pow(1 + r_a, n_a) - 1) / r_a;
  var requiredSaving = finalValue1 / futureValueFactor;
  var balance5 = 50000;
  for (var j = 0; j < 20 * 12; j++) { balance5 += 100; balance5 *= (1 + interestRate / 12); }

  whyInvestContent.innerHTML =
    '<div class="info-point"><p>Die gesetzliche Rente allein reicht oft nicht aus, um den Lebensstandard im Alter zu halten. Private Vorsorge ist unerlässlich.</p>' +
    '<button class="point-toggle" data-target="details-1">1. Die Lücke der gesetzlichen Rente</button>' +
    '<div id="details-1" class="point-details"><p>Die Renteninformation zeigt nur die Bruttorente – nicht, was am Ende wirklich auf dem Konto landet.</p>' +
    '<h4>Beispiel: Kassierer mit 1.800 € brutto / 40 Jahre Arbeit</h4>' +
    '<ul><li>Bruttorente (2050): ca. 1.415 €/Monat</li>' +
    '<li>Abzüge:<ul class="sub-list"><li>Krankenversicherung (~ 8 %)</li><li>Pflegeversicherung (~ 3,4 – 4 %)</li><li>Steuern (ab 2040: 100 % steuerpflichtig)</li></ul></li>' +
    '<li>Netto-Rente: ca. 1.050 – 1.150 €/Monat</li>' +
    '<li>Reale Kaufkraft (bei 2 % Inflation): <strong class="warning">nur ca. 650 – 750 €/Monat</strong></li></ul>' +
    '<p><strong class="warning">➡ Fazit: Selbst nach einem Leben voller Arbeit droht Altersarmut.</strong></p></div></div>' +

    '<div class="info-point"><p>Selbst kleine, regelmäßige Beträge können über lange Zeiträume durch den Zinseszinseffekt zu einem erheblichen Vermögen anwachsen.</p>' +
    '<button class="point-toggle" data-target="details-2">2. ETF-Sparplan: 100 €/Monat über 40 Jahre</button>' +
    '<div id="details-2" class="point-details"><ul>' +
    '<li>Einzahlung insgesamt: ' + fmt(totalDeposits1, currency) + '</li>' +
    '<li>Erwartetes Depotvolumen (bei 7 % Jahresrendite): <strong class="highlight">' + fmt(finalValue1, currency) + '</strong></li></ul>' +
    '<p>Damit hast du dir neben der gesetzlichen Rente ein weiteres Polster aufgebaut.</p></div></div>' +

    '<div class="info-point"><p>Ein aufgebautes Vermögen bietet finanzielle Flexibilität, sei es für eine frühere Rente, größere Anschaffungen oder einfach zur Absicherung.</p>' +
    '<button class="point-toggle" data-target="details-3">3. Was bringt das konkret?</button>' +
    '<div id="details-3" class="point-details">' +
    '<h4>Zusatz-Rente durch Entnahmen (Kapital erhalten)</h4><ul>' +
    '<li>Kapital nach 40 Jahren: ' + fmt(finalValue1, currency) + '</li>' +
    '<li>Monatlicher Nettozins (nach Steuern): <strong class="highlight">' + fmt(monthlyInterestNet, currency) + '</strong></li></ul>' +
    '<p>Du kannst dir diesen Betrag pro Monat auszahlen lassen, ohne dein Kapital anzutasten.</p>' +
    '<h4>Alternativ: Kapital planmäßig aufbrauchen (nach 20 Jahren leer)</h4><ul>' +
    '<li>Monatliche Entnahme (brutto): <strong class="highlight">' + fmt(monthlyAnnuity, currency) + '</strong></li></ul>' +
    '<p>Nach 20 Jahren ist das Depot leer – vollständig in monatliche Zahlungen umgewandelt.</p></div></div>' +

    '<div class="info-point"><p>Auch ein späterer Einstieg lohnt sich. Höhere Sparraten oder ein Startkapital können die kürzere Laufzeit ausgleichen.</p>' +
    '<button class="point-toggle" data-target="details-4">4. Beispiele für ältere Anleger</button>' +
    '<div id="details-4" class="point-details">' +
    '<h4>Du bist 40 Jahre alt und willst mit 60 finanziell sorgenfrei sein?</h4><ul>' +
    '<li>Ziel: ' + fmt(finalValue1, currency) + ' Kapital im Depot.</li>' +
    '<li>Nötige monatliche Sparrate (20 Jahre, 7% p.a.): <strong class="highlight">' + fmt(requiredSaving, currency) + '</strong></li></ul>' +
    '<h4>Oder: 50.000 € Startkapital + 100 € monatlich</h4><ul>' +
    '<li>Ergebnis nach 20 Jahren: <strong class="highlight">' + fmt(balance5, currency) + '</strong></li></ul></div></div>' +

    '<div class="info-point"><button class="point-toggle" data-target="details-5">5. Was bringt das konkret (Zusammenfassung)?</button>' +
    '<div id="details-5" class="point-details"><ul>' +
    '<li>Rente allein reicht oft nicht – private Vorsorge ist essenziell.</li>' +
    '<li>ETF-Sparplan ab 100 € im Monat kann nach 40 Jahren über <strong class="highlight">' + fmt(240000, currency) + '</strong> bringen.</li>' +
    '<li>Das ermöglicht z.B. über <strong class="highlight">' + fmt(1000, currency) + ' Netto extra</strong> pro Monat auf lange Sicht.</li>' +
    '<li>Wer früh und regelmäßig beginnt, gewinnt im Alter Freiheit, Sicherheit und Würde.</li></ul></div></div>';
}

if (toggleWhyInvestBtn && whyInvestContent) {
  toggleWhyInvestBtn.addEventListener('click', function() {
    var isHidden = !whyInvestContent.style.display || whyInvestContent.style.display === 'none';
    if (isHidden) { updateWhyInvestContent(); whyInvestContent.style.display = 'block'; }
    else { whyInvestContent.style.display = 'none'; }
    toggleWhyInvestBtn.textContent = isHidden ? 'Weniger anzeigen' : 'Mehr erfahren';
  });
  whyInvestContent.addEventListener('click', function(e) {
    if (e.target.classList.contains('point-toggle')) {
      var details = document.getElementById(e.target.getAttribute('data-target'));
      if (details) { e.target.classList.toggle('open'); details.style.display = details.style.display === 'block' ? 'none' : 'block'; }
    }
  });
}

// --- Currency Label Updates ---
function updateCurrencyLabels(code) {
  var symbols = { EUR: '€', USD: '$', JPY: '¥', GBP: '£', AUD: 'A$' };
  var sym = symbols[code] || code;
  for (var id in labelTexts) {
    var lbl = document.querySelector('label[for="' + id + '"]');
    if (lbl) lbl.textContent = labelTexts[id] + ' (' + sym + ')';
  }
}

// --- UI Event Listeners ---
advToggle.onclick = function() {
  var open = advBox.style.display === 'block';
  advBox.style.display = open ? 'none' : 'block';
  advToggle.textContent = open ? 'Erweiterte Optionen ▼' : 'Erweiterte Optionen ▲';
};

interestRatePresetEl.addEventListener('change', function() {
  interestCustomEl.style.display = this.value === 'custom' ? 'block' : 'none';
  if (this.value === 'custom') { interestCustomEl.focus(); if (!interestCustomEl.value) interestCustomEl.value = "7.6"; }
});

currencyEl.addEventListener('change', function() {
  updateCurrencyLabels(currencyEl.value);
  var a = document.querySelector('.btn-group .btn.active-calc-btn');
  calc(a && a.textContent.indexOf('Netto') !== -1);
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

document.querySelectorAll('.btn-group .btn').forEach(function(button) {
  button.addEventListener('click', function() {
    document.querySelectorAll('.btn-group .btn').forEach(function(b) { b.classList.remove('active-calc-btn'); });
    this.classList.add('active-calc-btn');
  });
});

// --- Dynamic Entries ---
function addDynamicEntry(container, amtClass, yearClass) {
  var row = document.createElement('div');
  row.className = 'row dynamic-entry-row';
  var d1 = document.createElement('div');
  var inp1 = document.createElement('input');
  inp1.type = 'number'; inp1.min = '0'; inp1.value = '0'; inp1.className = amtClass;
  d1.appendChild(inp1);
  var d2 = document.createElement('div');
  var inp2 = document.createElement('input');
  inp2.type = 'number'; inp2.min = '1'; inp2.value = '1'; inp2.className = yearClass; inp2.placeholder = 'Jahr';
  d2.appendChild(inp2);
  row.appendChild(d1); row.appendChild(d2);
  var rb = document.createElement('button');
  rb.type = 'button'; rb.textContent = 'X'; rb.className = 'remove-btn';
  rb.addEventListener('click', function() { row.remove(); });
  row.appendChild(rb);
  container.appendChild(row);
}

document.getElementById('addLumpsumBtn').addEventListener('click', function() {
  addDynamicEntry(lumpsumEntriesContainer, 'lumpsum-amount', 'lumpsum-year');
});
document.getElementById('addOneTimePayoutBtn').addEventListener('click', function() {
  addDynamicEntry(oneTimePayoutEntriesContainer, 'payout-amount', 'payout-year');
});

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

// --- Range Slider Sync (Live) ---
function setupLiveSlider(rangeId, numberId, valueId, suffix) {
  var range = document.getElementById(rangeId);
  var number = document.getElementById(numberId);
  var display = document.getElementById(valueId);
  if (!range || !number) return;

  function updateDisplay(val) {
    if (display) {
      var num = parseFloat(val) || 0;
      if (suffix === ' Jahre') display.textContent = num + suffix;
      else display.textContent = num.toLocaleString('de-DE') + suffix;
    }
  }

  function liveCalc() {
    var a = document.querySelector('.btn-group .btn.active-calc-btn');
    if (typeof calc === 'function') calc(a && a.textContent.indexOf('Netto') !== -1);
  }

  range.addEventListener('input', function() {
    number.value = this.value;
    updateDisplay(this.value);
    liveCalc();
  });

  number.addEventListener('input', function() {
    var val = parseFloat(this.value) || 0;
    if (val > parseFloat(range.max)) range.max = val;
    range.value = val;
    updateDisplay(val);
  });

  // Initial display
  updateDisplay(range.value);
}

setupLiveSlider('startRange', 'start', 'startRangeValue', ' €');
setupLiveSlider('rateRange', 'rate', 'rateRangeValue', ' €');
setupLiveSlider('yearsRange', 'years', 'yearsRangeValue', ' Jahre');
