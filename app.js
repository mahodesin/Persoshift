// Global variables for charts
let chartMain, chartCompare;

// Default values for resetting the form
const DEFAULT_MONTHLY_RATE = 100;
const DEFAULT_YEARS = 40;
const DEFAULT_INTEREST_PRESET = "7.6"; 
const DEFAULT_FREIBETRAG = 1000; 
const DEFAULT_STEUERSATZ = 26.375;
const DEFAULT_ETF_TYPE = "thesaurierend";
const DEFAULT_BASISZINS = 2.29; 
const DEFAULT_RATE_INCREASE = 0;
const DEFAULT_CURRENCY = 'EUR';

// Chart Colors
const CAPITAL_COLOR = 'rgba(52, 152, 219, 0.8)'; 
const GAIN_COLOR = 'rgba(243, 156, 18, 0.8)';     
const ANNUAL_PAYOUT_COLOR = 'rgba(39, 174, 96, 0.8)'; 
const TAX_COLOR_DIAGRAM = 'rgba(231, 76, 60, 0.7)'; 

// Chart.js default settings
Chart.defaults.font.family = 'Inter, sans-serif';
Chart.defaults.font.size = 13;
Chart.defaults.plugins.legend.position = 'bottom';
Chart.defaults.maintainAspectRatio = false;
Chart.defaults.responsive = true;

// DOM Element references
const advToggle = document.getElementById('advToggle');
const advBox = document.getElementById('advanced');
const currencyEl = document.getElementById('currency');

// Formatting function for currency values
const fmt = (n, currency = 'EUR') => {
    let locale = 'de-DE'; // Default to German locale
    if (currency === 'USD') locale = 'en-US';
    if (currency === 'GBP') locale = 'en-GB';
    if (currency === 'JPY') locale = 'ja-JP';
    if (currency === 'AUD') locale = 'en-AU';

    return n.toLocaleString(locale, { style: 'currency', currency: currency, maximumFractionDigits: 0 });
};

// More DOM Elements
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
const toggleWhyInvestBtn = document.getElementById('toggleWhyInvestBtn');
const whyInvestContent = document.getElementById('whyInvestContent');

// Data for informational modals
const modalData = { 
    modalSP500: {
        title: "Was ist der S&P 500?",
        content: `
            <p>Der S&P 500 ist ein Aktienindex, der die 500 größten börsennotierten US-Unternehmen abbildet. Er gilt als wichtiger Indikator für den US-Aktienmarkt.</p>
            <h3>Durchschnittliche Jahresrendite (p.a.)</h3>
            <p>Historisch lag die durchschnittliche Rendite bei ca. <strong>10% pro Jahr</strong> vor Inflation.</p>
            <p><strong>Wichtig:</strong> Vergangene Renditen sind keine Garantie für zukünftige Ergebnisse. Der Wert kann schwanken.</p>
            <p>Ein bekannter ETF ist der iShares Core S&P 500 UCITS ETF (<strong>ISIN: IE00B5BMR087</strong>).</p>
        `
    },
    modalMSCIWorld: {
        title: "Was ist der MSCI World?",
        content: `
            <p>Der MSCI World ist ein globaler Aktienindex, der ca. 1.500 Unternehmen aus 23 Industrieländern umfasst. Er bietet eine breite internationale Streuung.</p>
            <h3>Durchschnittliche Jahresrendite (p.a.)</h3>
            <p>Langfristig lag die durchschnittliche Rendite bei ca. <strong>7-9% pro Jahr</strong> vor Inflation.</p>
            <p><strong>Wichtig:</strong> Auch hier sind vergangene Werte keine Garantie für die Zukunft und Schwankungen sind normal.</p>
            <p>Ein bekannter ETF ist der iShares Core MSCI World UCITS ETF (<strong>ISIN: IE00B4L5Y983</strong>).</p>
        `
    },
    modalMonthlyRate: {
        title: "Wieviel soll ich investieren?",
        content: `
            <p><strong>Wichtig ist: Regelmäßigkeit schlägt Höhe.</strong></p>
            <p>Ein monatlicher ETF-Sparplan ab z.B. 100 € ist oft besser als gar nichts – und lässt sich jederzeit anpassen.</p>
            <p>Eine gängige Faustregel ist, <strong>10-15% des Nettoeinkommens</strong> für die Altersvorsorge zu investieren. Passen Sie den Betrag an Ihre persönliche finanzielle Situation an.</p>
        `
    },
    modalTaxInfo: {
        title: "Information zur Kapitalertragsteuer",
        content: `
            <p>In Deutschland unterliegen Kapitalerträge (z.B. Zinsen, Dividenden, realisierte Kursgewinne) der Abgeltungsteuer.</p>
            <p>Der hier verwendete Satz von <strong>26,375%</strong> setzt sich zusammen aus:</p>
            <ul>
                <li>25% Abgeltungsteuer</li>
                <li>+ 5,5% Solidaritätszuschlag auf die Abgeltungsteuer (25% * 0,055 = 1,375%)</li>
            </ul>
            <p>(Ggf. kommt noch Kirchensteuer hinzu, diese ist hier nicht berücksichtigt.)</p>
            <p>Der <strong>Sparer-Pauschbetrag (Freibetrag)</strong> von derzeit 1.000 € pro Person kann auf Kapitalerträge angerechnet werden.</p>
        `
    },
    modalEtfTypeInfo: {
        title: "ETF-Typen: Thesaurierend vs. Ausschüttend",
        content: `
            <h4>Thesaurierende ETFs:</h4>
            <p>Erträge (z.B. Dividenden) werden automatisch im Fondsvermögen wiederangelegt. Dies führt zu einem stärkeren Zinseszinseffekt. Jährlich wird eine <strong>Vorabpauschale</strong> als fiktiver Ertrag besteuert.</p>
            <h4>Ausschüttende ETFs:</h4>
            <p>Erträge werden direkt an die Anleger ausgezahlt. Diese Ausschüttungen sind im Jahr des Zuflusses steuerpflichtig (sofern sie den Freibetrag übersteigen).</p>
        `
    },
    modalBasiszinsInfo: {
        title: "Was ist der Basiszins?",
        content: `
            <p>Der Basiszins wird von der Deutschen Bundesbank festgelegt und ist die Grundlage für die Berechnung der <strong>Vorabpauschale</strong> bei thesaurierenden ETFs.</p>
            <p>Die Formel (vereinfacht):<br>
            <em>Vorabpauschale = Fondswert zu Jahresbeginn × Basiszins × 0,7</em></p>
            <p>Der Basiszins für das Jahr 2024 wurde auf <strong>2,29%</strong> festgelegt.</p>
        `
    },
    modalVerkaufsteuerInfo: {
        title: "Verkaufsteuer bei Thesaurierenden ETFs",
        content: `
            <p>Die hier angezeigte "Verkaufsteuer (hypothetisch)" ist eine Schätzung der Steuer, die anfallen würde, wenn das gesamte Depot am Ende der Laufzeit verkauft wird.</p>
            <p>Sie berechnet sich auf den Teil des Gewinns, der noch nicht durch die jährlichen Vorabpauschalen versteuert wurde. Dies ist eine Vereinfachung.</p>
        `
    },
    modalFreibetragInfo: {
        title: "Was ist der jährliche Freibetrag?",
        content: `
            <p>In Deutschland gibt es den <strong>Sparer-Pauschbetrag</strong>. Kapitalerträge bis zu dieser Höhe sind steuerfrei.</p>
            <ul>
                <li>Für Einzelpersonen: <strong>1.000 € pro Jahr</strong></li>
                <li>Für zusammenveranlagte Ehegatten: <strong>2.000 € pro Jahr</strong></li>
            </ul>
            <p>Nur der Teil der Erträge, der diesen Betrag übersteigt, wird versteuert.</p>
        `
    },
    modalSteuersatzInfo: {
        title: "Information zum Steuersatz",
        content: `
            <p>Der Steuersatz auf Kapitalerträge in Deutschland ist die <strong>Abgeltungsteuer</strong>.</p>
            <p>Der Standardsatz von <strong>26,375%</strong> setzt sich zusammen aus 25% Abgeltungsteuer + 5,5% Solidaritätszuschlag darauf.</p>
            <p>Falls Sie kirchensteuerpflichtig sind, erhöht sich der Satz. Dies ist hier nicht standardmäßig berücksichtigt, Sie können den Satz aber manuell anpassen.</p>
        `
    },
    modalDateTypeInfo: {
        title: "Laufjahr vs. Kalenderjahr",
        content: `
            <p>Hier legen Sie fest, wie Jahresangaben bei Auszahlungen interpretiert werden.</p>
            <h4>Laufjahr</h4>
            <p>Bezieht sich auf das Investitionsjahr. 'Jahr 5' ist das fünfte Jahr nach Investitionsstart.</p>
            <h4>Kalenderjahr</h4>
            <p>Bezieht sich auf ein spezifisches Kalenderjahr (z.B. 2035). Dies erfordert die Angabe eines Start-Kalenderjahres.</p>
        `
    }
};

// Functions to open and close modals
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

// Event listeners for modals
document.querySelectorAll('[data-modal-target]').forEach(button => button.addEventListener('click', () => openModal(button.getAttribute('data-modal-target'))));
modalCloseBtns.forEach(button => button.addEventListener('click', closeModal));
window.addEventListener('click', (event) => { if (event.target === infoModal) closeModal(); });


// --- "Why Invest" section NEW LOGIC ---
function updateWhyInvestContent() {
    const currency = 'EUR'; // Examples are in EUR
    
    // Scenario 1: 100€/month for 40 years at 7%
    let balance1 = 0;
    let interestRate = 0.07;
    for (let i = 0; i < 40 * 12; i++) {
        balance1 += 100;
        balance1 *= (1 + interestRate / 12);
    }
    const totalDeposits1 = 100 * 12 * 40;
    const finalValue1 = balance1;

    // Scenario 2: Payouts from finalValue1
    const monthlyInterestGross = (finalValue1 * interestRate) / 12;
    const monthlyInterestNet = monthlyInterestGross * (1 - 0.26375);

    // Scenario 3: Annuity payout over 20 years
    const r_annuity = interestRate / 12;
    const n_annuity = 20 * 12;
    const annuityFactor = (r_annuity * Math.pow(1 + r_annuity, n_annuity)) / (Math.pow(1 + r_annuity, n_annuity) - 1);
    const monthlyAnnuity = finalValue1 * annuityFactor;

    // Scenario 4: Saving for 20 years to reach target
    const r_save = interestRate / 12;
    const n_save = 20 * 12;
    const futureValueFactor = (Math.pow(1 + r_save, n_save) - 1) / r_save;
    const requiredSaving = finalValue1 / futureValueFactor;

    // Scenario 5: 50k start + 100€/month for 20 years
    let balance5 = 50000;
    for (let i = 0; i < 20 * 12; i++) {
        balance5 += 100;
        balance5 *= (1 + interestRate / 12);
    }
    const finalValue5 = balance5;
    
    whyInvestContent.innerHTML = `
        <div class="info-point">
            <p>Die gesetzliche Rente allein reicht oft nicht aus, um den Lebensstandard im Alter zu halten. Private Vorsorge ist unerlässlich.</p>
            <button class="point-toggle" data-target="details-1">1. Die Lücke der gesetzlichen Rente</button>
            <div id="details-1" class="point-details">
                <p>Die Renteninformation zeigt nur die Bruttorente – nicht, was am Ende wirklich auf dem Konto landet.</p>
                <h4>Beispiel: Kassierer mit 1.800 € brutto / 40 Jahre Arbeit</h4>
                <ul>
                    <li>Bruttorente (2050): ca. 1.415 €/Monat</li>
                    <li>Abzüge:
                        <ul class="sub-list">
                            <li>Krankenversicherung (~ 8 %)</li>
                            <li>Pflegeversicherung (~ 3,4 – 4 %)</li>
                            <li>Steuern (ab 2040: 100 % steuerpflichtig)</li>
                        </ul>
                    </li>
                    <li>Netto-Rente: ca. 1.050 – 1.150 €/Monat</li>
                    <li>Reale Kaufkraft (bei 2 % Inflation): <strong class="warning">nur ca. 650 – 750 €/Monat</strong></li>
                </ul>
                <p><strong class="warning">➡ Fazit: Selbst nach einem Leben voller Arbeit droht Altersarmut.</strong></p>
            </div>
        </div>
        <div class="info-point">
            <p>Selbst kleine, regelmäßige Beträge können über lange Zeiträume durch den Zinseszinseffekt zu einem erheblichen Vermögen anwachsen.</p>
            <button class="point-toggle" data-target="details-2">2. ETF-Sparplan: 100 €/Monat über 40 Jahre</button>
            <div id="details-2" class="point-details">
                <ul>
                    <li>Einzahlung insgesamt: ${fmt(totalDeposits1, currency)}</li>
                    <li>Erwartetes Depotvolumen (bei 7 % Jahresrendite): <strong class="highlight">${fmt(finalValue1, currency)}</strong></li>
                </ul>
                <p>Damit hast du dir neben der gesetzlichen Rente ein weiteres Polster aufgebaut.</p>
            </div>
        </div>
        <div class="info-point">
            <p>Ein aufgebautes Vermögen bietet finanzielle Flexibilität, sei es für eine frühere Rente, größere Anschaffungen oder einfach zur Absicherung.</p>
            <button class="point-toggle" data-target="details-3">3. Was bringt das konkret?</button>
            <div id="details-3" class="point-details">
                <h4>Zusatz-Rente durch Entnahmen (Kapital erhalten)</h4>
                <ul>
                    <li>Kapital nach 40 Jahren: ${fmt(finalValue1, currency)}</li>
                    <li>Monatlicher Nettozins (nach Steuern): <strong class="highlight">${fmt(monthlyInterestNet, currency)}</strong></li>
                </ul>
                <p>Bedeutung: Du kannst dir diesen Betrag pro Monat auszahlen lassen, ohne dein Kapital anzutasten.</p>
                <h4>Alternativ: Kapital planmäßig aufbrauchen (nach 20 Jahren leer)</h4>
                <ul>
                    <li>Monatliche Entnahme (brutto): <strong class="highlight">${fmt(monthlyAnnuity, currency)}</strong></li>
                </ul>
                <p>Ergebnis: Nach 20 Jahren ist das Depot leer – du hast es vollständig in monatliche Zahlungen umgewandelt.</p>
            </div>
        </div>
        <div class="info-point">
             <p>Auch ein späterer Einstieg lohnt sich. Höhere Sparraten oder ein Startkapital können die kürzere Laufzeit ausgleichen.</p>
            <button class="point-toggle" data-target="details-4">4. Beispiele für „ältere“ Anleger</button>
            <div id="details-4" class="point-details">
                <h4>Du bist 40 Jahre alt und willst mit 60 finanziell sorgenfrei sein?</h4>
                 <ul>
                    <li>Ziel: ${fmt(finalValue1, currency)} Kapital im Depot.</li>
                    <li>Nötige monatliche Sparrate (20 Jahre, 7% p.a.): <strong class="highlight">${fmt(requiredSaving, currency)}</strong></li>
                </ul>
                <h4>Oder: 50.000 € Startkapital + 100 € monatlich</h4>
                 <ul>
                    <li>Ergebnis nach 20 Jahren: <strong class="highlight">${fmt(finalValue5, currency)}</strong></li>
                </ul>
            </div>
        </div>
         <div class="info-point">
            <button class="point-toggle" data-target="details-5">5. Was bringt das konkret (Zusammenfassung)?</button>
            <div id="details-5" class="point-details">
                 <ul>
                    <li>Rente allein reicht oft nicht – private Vorsorge ist essenziell.</li>
                    <li>ETF-Sparplan ab 100 € im Monat kann nach 40 Jahren über <strong class="highlight">${fmt(240000, currency)}</strong> bringen.</li>
                    <li>Das ermöglicht z.B. über <strong class="highlight">${fmt(1000, currency)} Netto extra</strong> pro Monat auf lange Sicht.</li>
                    <li>Wer früh und regelmäßig beginnt, gewinnt im Alter Freiheit, Sicherheit und Würde.</li>
                </ul>
            </div>
        </div>
    `;
}

if (toggleWhyInvestBtn && whyInvestContent) { 
    toggleWhyInvestBtn.addEventListener('click', () => {
        const isHidden = whyInvestContent.style.display === 'none' || whyInvestContent.style.display === '';
        if (isHidden) {
            updateWhyInvestContent();
            whyInvestContent.style.display = 'block';
        } else {
            whyInvestContent.style.display = 'none';
        }
        toggleWhyInvestBtn.textContent = isHidden ? 'Weniger anzeigen' : 'Mehr erfahren';
    });

    whyInvestContent.addEventListener('click', function(e) {
        if (e.target.classList.contains('point-toggle')) {
            const button = e.target;
            const targetId = button.dataset.target;
            const details = document.getElementById(targetId);
            if (details) {
                button.classList.toggle('open');
                details.style.display = details.style.display === 'block' ? 'none' : 'block';
            }
        }
    });
}

const labelTexts = {
    'start': 'Startkapital',
    'rate': 'Monatsrate',
    'freibetrag': 'Jährlicher Freibetrag',
    'lumpsum': 'Einmalige Einzahlung',
    'payout': 'Einmalige Auszahlung',
    'payoutPlanAmount': 'Auszahlplan Betrag'
};


function updateCurrencyLabels(currencyCode) {
    const symbolMap = { 'EUR': '€', 'USD': '$', 'JPY': '¥', 'GBP': '£', 'AUD': 'A$' };
    const symbol = symbolMap[currencyCode] || currencyCode;

    for (const forAttr in labelTexts) {
        const label = document.querySelector(`label[for="${forAttr}"]`);
        if (label) {
            label.textContent = `${labelTexts[forAttr]} (${symbol})`;
        }
    }
    
    document.querySelectorAll('#oneTimePayoutEntriesContainer .main-entry-row label').forEach(label => {
      if(label.textContent.includes('Einmalige Auszahlung')) {
        label.textContent = `Einmalige Auszahlung (${symbol})`;
      }
    });
    document.querySelectorAll('#lumpsumEntriesContainer .main-entry-row label').forEach(label => {
        if(label.textContent.includes('Einmalige Einzahlung')) {
            label.textContent = `Einmalige Einzahlung (${symbol})`;
        }
    });
     document.querySelectorAll('#payoutPlanAmount').forEach(label => {
        if(label.parentElement.querySelector('label')) {
            label.parentElement.querySelector('label').textContent = `Auszahlplan Betrag (${symbol})`;
        }
    });
}

advToggle.onclick = () => {
    const open = advBox.style.display === 'block';
    advBox.style.display = open ? 'none' : 'block';
    advToggle.textContent = open ? 'Erweiterte Optionen ▼' : 'Erweiterte Optionen ▲';
};
interestRatePresetEl.addEventListener('change', function() {
    interestCustomEl.style.display = this.value === 'custom' ? 'block' : 'none';
    if (this.value === 'custom') {
        interestCustomEl.focus();
        if (!interestCustomEl.value) interestCustomEl.value = "7.6";
    }
});
currencyEl.addEventListener('change', () => {
    const newCurrency = currencyEl.value;
    updateCurrencyLabels(newCurrency);
    const activeCalcButton = document.querySelector('.btn-group .btn.active-calc-btn');
    const isNetto = activeCalcButton && activeCalcButton.textContent.includes('Netto');
    calc(isNetto);
});
stopMonthlyRateEnableEl.addEventListener('change', function() {
    stopMonthlyRateYearContainerEl.style.display = this.checked ? 'block' : 'none';
});
payoutIntervalEl.addEventListener('change', function() {
    payoutIntervalDaysEl.disabled = this.value !== 'custom';
    if (this.value === 'custom' && !payoutIntervalDaysEl.value) {
        payoutIntervalDaysEl.value = '30';
    } else if (this.value !== 'custom') {
        payoutIntervalDaysEl.value = '';
    }
});
steuerSatzEl.addEventListener('input', function() {
    taxRateDisplayEl.textContent = this.value || DEFAULT_STEUERSATZ.toString();
});

function addDynamicEntry(container, typeClassAmount, typeClassYear) {
    const newEntryRow = document.createElement('div');
    newEntryRow.className = 'row dynamic-entry-row';
    const amountDiv = document.createElement('div');
    const amountInput = document.createElement('input');
    amountInput.type = 'number';
    amountInput.min = '0';
    amountInput.value = '0';
    amountInput.className = typeClassAmount;
    const currency = currencyEl.value;
    const symbolMap = {
        'EUR': '€',
        'USD': '$',
        'JPY': '¥',
        'GBP': '£',
        'AUD': 'A$'
    };
    amountInput.placeholder = `Betrag (${symbolMap[currency] || currency})`;
    amountDiv.appendChild(amountInput);
    const yearDiv = document.createElement('div');
    const yearInput = document.createElement('input');
    yearInput.type = 'number';
    yearInput.min = '1';
    yearInput.value = '1';
    yearInput.className = typeClassYear;
    yearInput.placeholder = "Jahr";
    yearDiv.appendChild(yearInput);
    newEntryRow.appendChild(amountDiv);
    newEntryRow.appendChild(yearDiv);

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.textContent = 'X';
    removeBtn.className = 'remove-btn';
    removeBtn.onclick = () => newEntryRow.remove();
    newEntryRow.appendChild(removeBtn);
    container.appendChild(newEntryRow);
}
document.getElementById('addLumpsumBtn').addEventListener('click', () => addDynamicEntry(lumpsumEntriesContainer, 'lumpsum-amount', 'lumpsum-year'));
document.getElementById('addOneTimePayoutBtn').addEventListener('click', () => addDynamicEntry(oneTimePayoutEntriesContainer, 'payout-amount', 'payout-year'));

function getDynamicEntries(amountClass, yearClass) {
    const amounts = document.querySelectorAll(`.${amountClass}`);
    const years = document.querySelectorAll(`.${yearClass}`);
    const entries = [];
    for (let i = 0; i < amounts.length; i++) {
        const amount = parseFloat(amounts[i].value) || 0;
        const yearVal = parseInt(years[i].value) || 0;
        if (amount > 0 && yearVal > 0) {
            entries.push({
                amount,
                year: yearVal
            });
        }
    }
    return entries;
}

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
            <div><label for="lumpyear">Einmalige Einzahlung im Jahr (Laufjahr):</label><input id="lumpyear" type="number" value="1" min="1" class="lumpsum-year"></div>
        </div>`;

    oneTimePayoutEntriesContainer.innerHTML = `
        <div class="row main-entry-row">
            <div><label>Einmalige Auszahlung (€)</label><input id="payout" type="number" value="0" min="0" class="payout-amount"></div>
            <div><label>Auszahlung im Jahr:</label><input id="payoutYear" type="number" value="1" min="1" class="payout-year" placeholder="Jahr"></div>
        </div>`;

    payoutPlanAmountEl.value = 0;
    payoutStartYearEl.value = 1;
    payoutIntervalEl.value = 'monthly';
    payoutIntervalDaysEl.value = '';
    payoutIntervalEl.dispatchEvent(new Event('change'));

    chartAxisToggleEl.checked = false;
    warnEl.textContent = '';
    headlineEl.innerHTML = '';
    if (chartMain) {
        chartMain.destroy();
        chartMain = null;
    }
    if (chartCompare) {
        chartCompare.destroy();
        chartCompare = null;
    }

    document.querySelectorAll('.btn-group .btn').forEach(btn => btn.classList.remove('active-calc-btn'));
    document.querySelector('.btn[onclick="calc(false)"]').classList.add('active-calc-btn');

    updateCurrencyLabels(DEFAULT_CURRENCY);
    calc(false);
}

resetBtn.addEventListener('click', resetValuesAndCalc);

chartAxisToggleEl.addEventListener('change', () => {
    const activeCalcButton = document.querySelector('.btn-group .btn.active-calc-btn');
    const isNetto = activeCalcButton && activeCalcButton.textContent.includes('Netto');
    calc(isNetto);
});

document.querySelectorAll('.btn-group .btn').forEach(button => {
    button.addEventListener('click', function() {
        document.querySelectorAll('.btn-group .btn').forEach(btn => btn.classList.remove('active-calc-btn'));
        this.classList.add('active-calc-btn');
    });
});

function calc(withTax) {
  warnEl.textContent = '';
  const currency = currencyEl.value;

  // --- 1. Get all input values ---
  let baseMonthlyRate = parseFloat(rateEl.value) || 0;
  const monthlyRateIncrease = (parseFloat(monthlyRateIncreaseEl.value) || 0) / 100;
  const totalYears = parseInt(yearsEl.value) || 0;
  const investmentStartCalendarYear = parseInt(startCalendarYearEl.value) || new Date().getFullYear();
  let annualInterestRateValue = (interestRatePresetEl.value === 'custom') ? 
                                (parseFloat(interestCustomEl.value) || 0) : 
                                (parseFloat(interestRatePresetEl.value) || 0);
  const annualInterestRate = annualInterestRateValue / 100;
  const startCapital = parseFloat(startEl.value) || 0;
  const stopMonthlyRateEnabled = stopMonthlyRateEnableEl.checked;
  const stopMonthlyRateAtYear = parseInt(stopMonthlyRateYearEl.value) || 0;
  const currentEtfType = etfTypeEl.value;
  const currentFreibetrag = parseFloat(freibetragEl.value) || 0;
  const currentSteuerSatz = (parseFloat(steuerSatzEl.value) || 0) / 100;
  const currentBasiszins = (parseFloat(basiszinsEl.value) || 0) / 100;
  const globalPayoutYearType = payoutYearTypeEl.value;
  const allLumpsums = getDynamicEntries('lumpsum-amount', 'lumpsum-year');
  const allOneTimePayouts = getDynamicEntries('payout-amount', 'payout-year');
  const useCalendarYearAxis = chartAxisToggleEl.checked;
  const payoutPlanAmount = parseFloat(payoutPlanAmountEl.value) || 0;
  const payoutPlanStartYear = parseInt(payoutStartYearEl.value) || 0;
  const payoutPlanInterval = payoutIntervalEl.value;
  const payoutPlanIntervalDays = parseInt(payoutIntervalDaysEl.value) || 0;

  // --- 2. Validate inputs ---
  if (totalYears < 1) { warnEl.textContent = 'Bitte Laufzeit ≥ 1 Jahr eingeben.'; return; }
  for (const payout of allOneTimePayouts) {
    let effectiveYear = payout.year;
    if (payout.yearType === 'kalenderjahr') {
        effectiveYear = payout.year - investmentStartCalendarYear + 1;
    }
    if (effectiveYear < 1 || effectiveYear > totalYears) {
        warnEl.textContent = `Auszahlung im Jahr ${payout.year} liegt außerhalb der Laufzeit.`;
        return;
    }
  }


  // --- 3. Initialize calculation variables ---
  let balance = startCapital; 
  let cumulativeGrossDeposits = startCapital; 
  let cumulativeTotalPayouts = 0;
  let cumulativeTotalTax = 0; 
  let freibetragRestJahr = currentFreibetrag; 
  let allVPAsPaid = 0;

  const labels = [];
  const chartNetDepositsData = []; 
  const chartNetGainData = [];     
  const chartAnnualPayoutsData = []; 
  const chartCumulativeTaxData = []; 


  // --- 4. Loop through each year of the investment period ---
  for (let y = 1; y <= totalYears; y++) {
    const currentCalendarYear = investmentStartCalendarYear + y - 1;
    let yearlyPayoutSum = 0; 
    let balanceAtStartOfYear = balance; 
    let yearlyTax = 0;
    
    if (y > 1) { 
        freibetragRestJahr = currentFreibetrag;
        baseMonthlyRate *= (1 + monthlyRateIncrease); 
    }

    allLumpsums.forEach(lump => {
        if (lump.year === y) { 
            balance += lump.amount; 
            cumulativeGrossDeposits += lump.amount; 
            balanceAtStartOfYear += lump.amount; 
        }
    });

    let annualContributions = 0;
    if (!(stopMonthlyRateEnabled && y >= stopMonthlyRateAtYear)) {
        annualContributions = baseMonthlyRate * 12;
    }
    balance += annualContributions;
    cumulativeGrossDeposits += annualContributions;
    
    const balanceBeforeInterestThisYear = balance;
    balance *= (1 + annualInterestRate);
    const wertsteigerungDiesesJahr = balance - balanceBeforeInterestThisYear;
    
    allOneTimePayouts.forEach(payout => {
        let payoutOccursThisYear = (globalPayoutYearType === 'laufjahr' && payout.year === y) ||
                                 (globalPayoutYearType === 'kalenderjahr' && payout.year === currentCalendarYear);
        if (payoutOccursThisYear) {
            const actualPayoutAmount = Math.min(balance, payout.amount); 
            balance -= actualPayoutAmount; 
            cumulativeTotalPayouts += actualPayoutAmount;
            yearlyPayoutSum += actualPayoutAmount;
        }
    });

    if (y >= payoutPlanStartYear && payoutPlanAmount > 0) {
      let yearlyEquivalentPayout = 0;
      if (payoutPlanInterval === 'yearly') yearlyEquivalentPayout = payoutPlanAmount;
      else if (payoutPlanInterval === 'custom' && payoutPlanIntervalDays > 0) yearlyEquivalentPayout = payoutPlanAmount * (365 / payoutPlanIntervalDays);
      else if (payoutPlanInterval === 'monthly') yearlyEquivalentPayout = payoutPlanAmount * 12;
      
      const actualYearlyEquivalentPayout = Math.min(balance, yearlyEquivalentPayout);
      balance -= actualYearlyEquivalentPayout; 
      cumulativeTotalPayouts += actualYearlyEquivalentPayout;
      yearlyPayoutSum += actualYearlyEquivalentPayout;
    }
    
    if (withTax) {
        if (currentEtfType === 'thesaurierend') {
            const vorabpauschaleRoh = balanceAtStartOfYear * currentBasiszins * 0.7;
            const anzusetzenderErtragFuerVPA = Math.min(vorabpauschaleRoh, wertsteigerungDiesesJahr);
            allVPAsPaid += anzusetzenderErtragFuerVPA;
            const zuVersteuernVPA = Math.max(0, anzusetzenderErtragFuerVPA - freibetragRestJahr);
            yearlyTax = zuVersteuernVPA * currentSteuerSatz;
            freibetragRestJahr -= Math.min(anzusetzenderErtragFuerVPA, freibetragRestJahr);
        } else { // 'ausschüttend'
            const zuVersteuern = Math.max(0, wertsteigerungDiesesJahr - freibetragRestJahr);
            yearlyTax = zuVersteuern * currentSteuerSatz;
            freibetragRestJahr -= Math.min(wertsteigerungDiesesJahr, freibetragRestJahr);
        }
        yearlyTax = Math.max(0, yearlyTax);
        balance -= yearlyTax; 
        cumulativeTotalTax += yearlyTax;
    }
    
    labels.push(useCalendarYearAxis ? currentCalendarYear.toString() : 'Jahr ' + y);
    const netInvestedCapitalForYear = cumulativeGrossDeposits - cumulativeTotalPayouts;
    chartNetDepositsData.push(Math.max(0, netInvestedCapitalForYear));
    chartNetGainData.push(Math.max(0, balance - netInvestedCapitalForYear));
    chartAnnualPayoutsData.push(-yearlyPayoutSum); 
    chartCumulativeTaxData.push(cumulativeTotalTax); 
  }

  const finalBalance = balance; 
  const finalNetInvested = cumulativeGrossDeposits - cumulativeTotalPayouts;
  const finalTotalGain = finalBalance - finalNetInvested; 
  
  let verkaufsteuer = 0;
  let endkapitalNachVerkaufsteuer = finalBalance;

  let headlineHTML = `
    <div class="headline-item"><span class="headline-label">Brutto-Einzahlungen:</span> <span class="headline-sub-value">${fmt(cumulativeGrossDeposits, currency)}</span></div>
    <div class="headline-item"><span class="headline-label">Gesamter Gewinn ${withTax ? '(Netto vor Verkauf)' : '(Brutto)'}:</span> <span class="headline-value">${fmt(finalTotalGain, currency)}</span></div>
    <div class="headline-item"><span class="headline-label">Auszahlungen (kumuliert):</span> <span class="headline-sub-value">${fmt(cumulativeTotalPayouts, currency)}</span></div>`;

  if (withTax) {
    const totalGainOnSale = finalBalance - (cumulativeGrossDeposits - allVPAsPaid - cumulativeTotalPayouts);
    const taxableGainOnSale = Math.max(0, totalGainOnSale - currentFreibetrag);
    verkaufsteuer = taxableGainOnSale * currentSteuerSatz * 0.7;
    verkaufsteuer = Math.max(0, verkaufsteuer);
    endkapitalNachVerkaufsteuer = finalBalance - verkaufsteuer;

    headlineHTML += `<div class="headline-item"><span class="headline-label">Verkaufsteuer (hypothetisch):</span> <span class="headline-sub-value">${fmt(verkaufsteuer, currency)} <button type="button" class="info-btn" data-modal-target="modalVerkaufsteuerInfo" title="Info zur Verkaufsteuer">?</button></span></div>`;
    headlineHTML += `<div class="headline-item"><span class="headline-label">Endkapital (nach Verkaufsteuer):</span> <span class="headline-value">${fmt(endkapitalNachVerkaufsteuer, currency)}</span></div>`;
  } else {
    headlineHTML += `<div class="headline-item"><span class="headline-label">Endkapital:</span> <span class="headline-value">${fmt(finalBalance, currency)}</span></div>`;
  }
  headlineEl.innerHTML = headlineHTML;
  document.querySelectorAll('[data-modal-target="modalVerkaufsteuerInfo"]').forEach(button => {
        if(button.getAttribute('listener') !== 'true'){ 
            button.addEventListener('click', () => openModal('modalVerkaufsteuerInfo'));
            button.setAttribute('listener', 'true');
        }
  });

  const chartOptionsBase = { 
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
        tooltip: {
            callbacks: {
                label: function(context) {
                    let label = context.dataset.label || '';
                    if (label) label += ': ';
                    const value = context.dataset.label === 'Auszahlungen (jährlich)' ? Math.abs(context.parsed.y) : context.parsed.y;
                    label += fmt(value, currency);
                    return label;
                }
            }
        }
    },
    layout: { padding: { top: 20, bottom:10, left:10, right:10 } } 
  };

  if (chartMain) chartMain.destroy();
  const datasetsMain = [
    { label: 'Netto Einzahlungen', data: chartNetDepositsData, backgroundColor: CAPITAL_COLOR, stack: 'positiveStack' },
    { label: `Gewinn ${withTax ? '(Netto)' : '(Brutto)'}`, data: chartNetGainData, backgroundColor: GAIN_COLOR, stack: 'positiveStack' },
    { label: 'Auszahlungen (jährlich)', data: chartAnnualPayoutsData, backgroundColor: ANNUAL_PAYOUT_COLOR, stack: 'negativeStack' }
  ];
  if (withTax) { 
      datasetsMain.push({
          label: 'Steuer (kumuliert)', data: chartCumulativeTaxData, backgroundColor: TAX_COLOR_DIAGRAM, type: 'line', order: -1, yAxisID: 'y1'
      });
  }
  chartMain = new Chart(document.getElementById('chart').getContext('2d'), {
    type: 'bar', 
    data: { labels: labels, datasets: datasetsMain },
    options: {
        ...chartOptionsBase,
        scales: { 
            y: { stacked: true, title: { display: true, text: `Betrag (${currency.toUpperCase()})`}, beginAtZero: true }, 
            y1: { display: withTax, position: 'right', title: {display: true, text: 'Steuer kumuliert'}, grid: {drawOnChartArea: false} },
            x: { stacked: true, title: { display: true, text: useCalendarYearAxis ? 'Kalenderjahr' : 'Laufjahre'} } 
        }
    }
  });

  if (chartCompare) chartCompare.destroy();
  const etfGesamtwertentwicklung = finalBalance + cumulativeTotalPayouts; 
  
  let tdTotal = startCapital;
  allLumpsums.forEach(lump => { if (lump.amount > 0) tdTotal += lump.amount; });
  let dynamicRateForTd = parseFloat(rateEl.value) || 0;
  for (let yCalc = 1; yCalc <= totalYears; yCalc++) {
    if (yCalc > 1) dynamicRateForTd *= (1 + monthlyRateIncrease);
    let yearlyContributionForTd = (stopMonthlyRateEnabled && yCalc >= stopMonthlyRateAtYear) ? 0 : dynamicRateForTd * 12;
    tdTotal += yearlyContributionForTd;
    tdTotal *= (1 + 0.02);
  }
  
  const compareData = [etfGesamtwertentwicklung, tdTotal, cumulativeGrossDeposits]; 
  const compareLabels = ['ETF (Gesamtwertentwicklung)', 'Tagesgeld 2%', 'Bank 0% (Einzahlungen)'];
  compareChartTitleEl.textContent = "Vergleich (Gesamtwertentwicklung)";

  chartCompare = new Chart(document.getElementById('compare').getContext('2d'), {
    type: 'bar', 
    data: { labels: compareLabels, datasets: [{ data: compareData, backgroundColor: ['rgba(46,204,113,0.8)','rgba(52,152,219,0.8)','rgba(149,165,166,0.8)'], barPercentage: 0.7 }] },
    options: { 
        ...chartOptionsBase, 
        scales: { y: { title: { display: true, text: `Gesamtwert (${currency.toUpperCase()})`}}}, 
        plugins: { ...chartOptionsBase.plugins, legend: { display: false } }
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
    resetValuesAndCalc();
});
