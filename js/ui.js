// PersoShift – UI
var chartMain = null, chartCompare = null, currentMode = 'compare', loadedHistoricalRates = [];
function fmt(n, c) { c = c || 'EUR'; var l = 'de-DE'; if (c==='USD') l='en-US'; if (c==='GBP') l='en-GB'; if (c==='JPY') l='ja-JP'; return n.toLocaleString(l, {style:'currency',currency:c,maximumFractionDigits:0}); }

// DOM refs
var advToggle=document.getElementById('advToggle'), advBox=document.getElementById('advanced'), currencyEl=document.getElementById('currency');
var rateEl=document.getElementById('rate'), monthlyRateIncreaseEl=document.getElementById('monthlyRateIncrease'), yearsEl=document.getElementById('years');
var startCalendarYearEl=document.getElementById('startCalendarYear'), interestRatePresetEl=document.getElementById('interestRatePreset'), interestCustomEl=document.getElementById('interestCustom');
var startEl=document.getElementById('start'), warnEl=document.getElementById('warn'), headlineEl=document.getElementById('headline');
var compareChartTitleEl=document.getElementById('compareChartTitle'), etfTypeEl=document.getElementById('etfType');
var freibetragEl=document.getElementById('freibetrag'), steuerSatzEl=document.getElementById('steuerSatz'), basiszinsEl=document.getElementById('basiszins');
var taxRateDisplayEl=document.getElementById('taxRateDisplay'), payoutYearTypeEl=document.getElementById('payoutYearType');
var stopMonthlyRateEnableEl=document.getElementById('stopMonthlyRateEnable'), stopMonthlyRateYearContainerEl=document.getElementById('stopMonthlyRateYearContainer');
var stopMonthlyRateYearEl=document.getElementById('stopMonthlyRateYear'), payoutPlanAmountEl=document.getElementById('payoutPlanAmount');
var payoutStartYearEl=document.getElementById('payoutStartYear'), payoutIntervalEl=document.getElementById('payoutInterval'), payoutIntervalDaysEl=document.getElementById('payoutIntervalDays');
var lumpsumEntriesContainer=document.getElementById('lumpsumEntriesContainer'), oneTimePayoutEntriesContainer=document.getElementById('oneTimePayoutEntriesContainer');
var infoModal=document.getElementById('infoModal'), modalTitleEl=document.getElementById('modalTitle'), modalBodyEl=document.getElementById('modalBody');
var resetBtn=document.getElementById('resetBtn'), chartAxisToggleEl=document.getElementById('chartAxisToggle');
var btnCalcMode=document.getElementById('btnCalculator'), btnHistoricalMode=document.getElementById('btnHistorical');
var historicalSectionEl=document.getElementById('historicalSection'), assetSelectEl=document.getElementById('assetSelect');
var assetStartYearEl=document.getElementById('assetStartYear');
var toggleWhyInvestBtn=document.getElementById('toggleWhyInvestBtn'), whyInvestContent=document.getElementById('whyInvestContent');
var assetToggleEls=document.querySelectorAll('.asset-toggle');

// Modals
function openModal(id) { var d=modalData[id]; if(d&&infoModal){modalTitleEl.textContent=d.title;modalBodyEl.innerHTML=d.content;infoModal.style.display='flex';} }
function closeModal() { if(infoModal) infoModal.style.display='none'; }
function attachModalListeners() { document.querySelectorAll('[data-modal-target]').forEach(function(b){ if(b.getAttribute('data-ml')!=='1'){b.addEventListener('click',function(){openModal(this.getAttribute('data-modal-target'));});b.setAttribute('data-ml','1');}}); }
attachModalListeners();
document.querySelectorAll('[data-close-modal]').forEach(function(b){b.addEventListener('click',closeModal);});
window.addEventListener('click',function(e){if(e.target===infoModal)closeModal();});
window.addEventListener('keydown',function(e){if(e.key==='Escape')closeModal();});

// Why Invest
function updateWhyInvestContent() {
  var c='EUR',r=0.07,b1=0;for(var i=0;i<40*12;i++){b1+=100;b1*=(1+r/12);}var td=100*12*40,fv=b1;
  var mig=(fv*r)/12,min=mig*(1-0.26375);var ra=r/12,na=20*12;var ma=fv*(ra*Math.pow(1+ra,na))/(Math.pow(1+ra,na)-1);
  var fvf=(Math.pow(1+ra,na)-1)/ra,rs=fv/fvf;var b5=50000;for(var j=0;j<20*12;j++){b5+=100;b5*=(1+r/12);}
  whyInvestContent.innerHTML='<div class="info-point"><p>Die gesetzliche Rente reicht oft nicht aus.</p><button class="point-toggle" data-target="d1">1. Die Lücke der gesetzlichen Rente</button><div id="d1" class="point-details"><h4>Beispiel: Kassierer mit 1.800 € brutto / 40 Jahre</h4><ul><li>Bruttorente: ca. 1.415 €/Monat</li><li>Abzüge: KV (~8%), PV (~3,4%), Steuern</li><li>Netto: ca. 1.050–1.150 €</li><li>Kaufkraft (2% Inflation): <strong class="warning">650–750 €</strong></li></ul><p class="warning"><strong>➡ Altersarmut droht.</strong></p></div></div>'+
  '<div class="info-point"><p>Kleine Beträge wachsen durch Zinseszins enorm.</p><button class="point-toggle" data-target="d2">2. 100 €/Monat über 40 Jahre</button><div id="d2" class="point-details"><ul><li>Einzahlung: '+fmt(td,c)+'</li><li>Depot (7% p.a.): <strong class="highlight">'+fmt(fv,c)+'</strong></li></ul></div></div>'+
  '<div class="info-point"><button class="point-toggle" data-target="d3">3. Was bringt das konkret?</button><div id="d3" class="point-details"><h4>Kapital erhalten</h4><ul><li>Monatlicher Nettozins: <strong class="highlight">'+fmt(min,c)+'</strong></li></ul><h4>Kapital aufbrauchen (20 Jahre)</h4><ul><li>Monatlich: <strong class="highlight">'+fmt(ma,c)+'</strong></li></ul></div></div>'+
  '<div class="info-point"><button class="point-toggle" data-target="d4">4. Späterer Einstieg</button><div id="d4" class="point-details"><h4>Ziel: '+fmt(fv,c)+' mit 60</h4><ul><li>Nötige Rate (20J, 7%): <strong class="highlight">'+fmt(rs,c)+'</strong></li></ul><h4>50.000 € Start + 100 €/Monat</h4><ul><li>Nach 20 Jahren: <strong class="highlight">'+fmt(b5,c)+'</strong></li></ul></div></div>'+
  '<div class="info-point"><button class="point-toggle" data-target="d5">5. Zusammenfassung</button><div id="d5" class="point-details"><ul><li>Rente allein reicht nicht.</li><li>100 €/Monat → über <strong class="highlight">'+fmt(240000,c)+'</strong> nach 40 Jahren.</li><li>Wer früh beginnt, gewinnt Freiheit.</li></ul></div></div>';
}
if(toggleWhyInvestBtn&&whyInvestContent){
  toggleWhyInvestBtn.addEventListener('click',function(){var h=!whyInvestContent.style.display||whyInvestContent.style.display==='none';if(h){updateWhyInvestContent();whyInvestContent.style.display='block';}else{whyInvestContent.style.display='none';}toggleWhyInvestBtn.textContent=h?'Weniger anzeigen':'Mehr erfahren';});
  whyInvestContent.addEventListener('click',function(e){if(e.target.classList.contains('point-toggle')){var d=document.getElementById(e.target.getAttribute('data-target'));if(d){e.target.classList.toggle('open');d.style.display=d.style.display==='block'?'none':'block';}}});
}

// UI listeners
function updateCurrencyLabels(code){var s={EUR:'€',USD:'$',JPY:'¥',GBP:'£',AUD:'A$'};var sym=s[code]||code;for(var id in labelTexts){var l=document.querySelector('label[for="'+id+'"]');if(l)l.textContent=labelTexts[id]+' ('+sym+')';}}
advToggle.onclick=function(){var o=advBox.style.display==='block';advBox.style.display=o?'none':'block';advToggle.textContent=o?'▸ Erweiterte Optionen':'▾ Erweiterte Optionen';};
interestRatePresetEl.addEventListener('change',function(){interestCustomEl.style.display=this.value==='custom'?'block':'none';if(this.value==='custom'){interestCustomEl.focus();if(!interestCustomEl.value)interestCustomEl.value="7.6";}});
currencyEl.addEventListener('change',function(){updateCurrencyLabels(currencyEl.value);var a=document.querySelector('.btn-group .btn.active-calc-btn');calc(a&&a.textContent.indexOf('Netto')!==-1);});
stopMonthlyRateEnableEl.addEventListener('change',function(){stopMonthlyRateYearContainerEl.style.display=this.checked?'block':'none';});
payoutIntervalEl.addEventListener('change',function(){payoutIntervalDaysEl.disabled=this.value!=='custom';if(this.value==='custom'&&!payoutIntervalDaysEl.value)payoutIntervalDaysEl.value='30';else if(this.value!=='custom')payoutIntervalDaysEl.value='';});
steuerSatzEl.addEventListener('input',function(){taxRateDisplayEl.textContent=this.value||DEFAULT_STEUERSATZ.toString();});
document.querySelectorAll('.btn-group .btn').forEach(function(b){b.addEventListener('click',function(){document.querySelectorAll('.btn-group .btn').forEach(function(x){x.classList.remove('active-calc-btn');});this.classList.add('active-calc-btn');});});

// Dynamic entries
function addDynamicEntry(c,ac,yc){var r=document.createElement('div');r.className='compact-row dynamic-entry-row';var d1=document.createElement('div'),i1=document.createElement('input');i1.type='number';i1.min='0';i1.value='0';i1.className=ac;d1.appendChild(i1);var d2=document.createElement('div'),i2=document.createElement('input');i2.type='number';i2.min='1';i2.value='1';i2.className=yc;i2.placeholder='Jahr';d2.appendChild(i2);r.appendChild(d1);r.appendChild(d2);var rb=document.createElement('button');rb.type='button';rb.textContent='X';rb.className='remove-btn';rb.addEventListener('click',function(){r.remove();});r.appendChild(rb);c.appendChild(r);}
document.getElementById('addLumpsumBtn').addEventListener('click',function(){addDynamicEntry(lumpsumEntriesContainer,'lumpsum-amount','lumpsum-year');});
document.getElementById('addOneTimePayoutBtn').addEventListener('click',function(){addDynamicEntry(oneTimePayoutEntriesContainer,'payout-amount','payout-year');});
function getDynamicEntries(ac,yc){var a=document.querySelectorAll('.'+ac),y=document.querySelectorAll('.'+yc),e=[];for(var i=0;i<a.length;i++){var am=parseFloat(a[i].value)||0,yr=parseInt(y[i].value)||0;if(am>0&&yr>0)e.push({amount:am,year:yr});}return e;}

// Slider sync
function setupLiveSlider(rId,hId,iId){var r=document.getElementById(rId),h=document.getElementById(hId),inp=document.getElementById(iId);if(!r||!h||!inp)return;function lc(){var a=document.querySelector('.btn-group .btn.active-calc-btn');if(typeof calc==='function')calc(a&&a.textContent.indexOf('Netto')!==-1);}r.addEventListener('input',function(){h.value=this.value;inp.value=this.value;lc();});inp.addEventListener('input',function(){var v=parseFloat(this.value)||0;h.value=v;if(v>parseFloat(r.max))r.max=v;r.value=v;lc();});}
setupLiveSlider('startRange','start','startRangeValue');
setupLiveSlider('rateRange','rate','rateRangeValue');
setupLiveSlider('yearsRange','years','yearsRangeValue');
