// PersoShift – Calculator
Chart.defaults.font.family='Inter,sans-serif';Chart.defaults.font.size=13;Chart.defaults.plugins.legend.position='bottom';Chart.defaults.maintainAspectRatio=false;Chart.defaults.responsive=true;

function computeRatesFromPrices(p){var r=[];for(var i=1;i<p.length;i++)r.push(p[i]/p[i-1]-1);return r;}

var loadedHistoricalPrices=[];// {year, price} array

// Embedded historical yearly average prices (no API needed)
var HISTORICAL_DATA = {
  gold: { // GLD ETF average yearly close
    2005:44.5,2006:58.2,2007:66.5,2008:83.5,2009:97.2,2010:122.3,2011:153.6,2012:163.1,
    2013:130.3,2014:121.2,2015:109.3,2016:118.7,2017:121.7,2018:121.2,2019:134.9,
    2020:168.2,2021:168.0,2022:167.4,2023:185.5,2024:213.8,2025:240.5
  },
  msci: { // URTH / MSCI World approximate yearly avg
    2008:42,2009:45,2010:53,2011:52,2012:58,2013:70,2014:74,2015:74,2016:75,
    2017:86,2018:82,2019:96,2020:99,2021:124,2022:104,2023:118,2024:137,2025:142
  },
  spy: { // S&P 500 ETF yearly avg
    2000:139,2001:120,2002:101,2003:101,2004:113,2005:120,2006:127,2007:146,
    2008:126,2009:94,2010:113,2011:126,2012:136,2013:159,2014:190,2015:205,
    2016:209,2017:243,2018:274,2019:296,2020:326,2021:423,2022:404,2023:444,
    2024:502,2025:530
  },
  eem: { // Emerging Markets yearly avg
    2005:26,2006:32,2007:42,2008:31,2009:31,2010:41,2011:40,2012:40,
    2013:40,2014:41,2015:34,2016:35,2017:42,2018:42,2019:42,2020:43,
    2021:51,2022:39,2023:39,2024:42,2025:43
  },
  vt: { // FTSE All-World yearly avg
    2008:44,2009:38,2010:46,2011:47,2012:49,2013:56,2014:59,2015:59,
    2016:60,2017:69,2018:71,2019:75,2020:78,2021:101,2022:88,2023:95,
    2024:108,2025:113
  }
};

function fetchHistoricalPrices(){
  var asset=assetSelectEl.value;
  var startYear=parseInt(startCalendarYearEl.value)||2015;
  var bisEl=document.getElementById('bisCalendarYear');
  var endYear=parseInt(bisEl?bisEl.value:0)||new Date().getFullYear();
  if(assetStartYearEl)assetStartYearEl.value=startYear;
  var prices=[];loadedHistoricalPrices=[];

  return new Promise(function(resolve){
    // Check for embedded data first (predefined assets)
    var embeddedKey = asset; // gold, msci, spy, eem, vt
    if(HISTORICAL_DATA[embeddedKey]){
      var data=HISTORICAL_DATA[embeddedKey];
      Object.keys(data).sort().forEach(function(y){
        var yr=parseInt(y);
        if(yr>=startYear&&yr<=endYear){
          prices.push(data[y]);
          loadedHistoricalPrices.push({year:yr,price:data[y]});
        }
      });
      loadedHistoricalRates=computeRatesFromPrices(prices);
      updateBadge(loadedHistoricalPrices.length);
      resolve();
      return;
    }

    // Bitcoin via CoinGecko (free, no key needed)
    if(asset==='bitcoin'){
      try{
        var from=Math.floor(new Date(startYear+'-01-01').getTime()/1000),to=Math.floor(new Date(endYear+'-12-31').getTime()/1000);
        fetch('https://api.coingecko.com/api/v3/coins/bitcoin/market_chart/range?vs_currency=usd&from='+from+'&to='+to)
        .then(function(r){return r.json();}).then(function(d){
          var ym={};(d.prices||[]).forEach(function(p){var y=new Date(p[0]).getFullYear();if(!ym[y])ym[y]=[];ym[y].push(p[1]);});
          Object.keys(ym).sort().forEach(function(y){if(y>=startYear&&y<=endYear){var avg=ym[y].reduce(function(a,b){return a+b;},0)/ym[y].length;prices.push(avg);loadedHistoricalPrices.push({year:parseInt(y),price:avg});}});
          loadedHistoricalRates=computeRatesFromPrices(prices);
          updateBadge(loadedHistoricalPrices.length);
          resolve();
        }).catch(function(){loadedHistoricalRates=[];loadedHistoricalPrices=[];updateBadge(0);resolve();});
      }catch(e){resolve();}
      return;
    }

    // Custom ticker – try Yahoo Finance chart API (better CORS than AlphaVantage)
    if(asset.indexOf('custom_')===0){
      var opt=assetSelectEl.options[assetSelectEl.selectedIndex];
      var sym=opt?(opt.getAttribute('data-ticker')||asset.replace('custom_','')):asset.replace('custom_','');
      try{
        var period1=Math.floor(new Date(startYear+'-01-01').getTime()/1000);
        var period2=Math.floor(new Date(endYear+'-12-31').getTime()/1000);
        fetch('https://query1.finance.yahoo.com/v8/finance/chart/'+sym+'?period1='+period1+'&period2='+period2+'&interval=1mo')
        .then(function(r){return r.json();}).then(function(json){
          var ts=json&&json.chart&&json.chart.result&&json.chart.result[0];
          if(ts&&ts.timestamp&&ts.indicators&&ts.indicators.adjclose){
            var stamps=ts.timestamp,closes=ts.indicators.adjclose[0].adjclose,ym={};
            for(var i=0;i<stamps.length;i++){
              if(closes[i]===null)continue;
              var yr=new Date(stamps[i]*1000).getFullYear();
              if(!ym[yr])ym[yr]=[];
              ym[yr].push(closes[i]);
            }
            Object.keys(ym).sort().forEach(function(y){
              var yr=parseInt(y);
              if(yr>=startYear&&yr<=endYear){
                var avg=ym[y].reduce(function(a,b){return a+b;},0)/ym[y].length;
                prices.push(avg);loadedHistoricalPrices.push({year:yr,price:avg});
              }
            });
          }
          loadedHistoricalRates=computeRatesFromPrices(prices);
          updateBadge(loadedHistoricalPrices.length);
          resolve();
        }).catch(function(){
          // Yahoo also failed – no data
          loadedHistoricalRates=[];loadedHistoricalPrices=[];
          updateBadge(0);
          resolve();
        });
      }catch(e){resolve();}
      return;
    }

    // Fallback: no data
    updateBadge(0);
    resolve();
  });
}

function updateBadge(count){
  var badge=document.getElementById('historicalBadge');
  if(!badge)return;
  var selOpt=assetSelectEl.options[assetSelectEl.selectedIndex];
  var name=selOpt?selOpt.text:'';
  if(count>0)badge.innerHTML='Aktuell: <strong>'+name+'</strong> ('+count+' Jahre)';
  else badge.innerHTML='Aktuell: <strong>'+name+'</strong> – <span style="color:var(--danger)">Keine Daten verfügbar</span>';
}

function computeComparisonTotal(start,lumps,br,ri,ar,yrs,se,sy){
  var t=start;lumps.forEach(function(l){if(l.amount>0)t+=l.amount;});var dr=br;
  for(var y=1;y<=yrs;y++){if(y>1)dr*=(1+ri);t+=(se&&y>=sy)?0:dr*12;t*=(1+ar);}return t;
}

function updateCompareChart(eT,tT,bT,btT,ethT,cur){
  if(chartCompare)chartCompare.destroy();
  var sel=Array.from(document.querySelectorAll('.asset-toggle:checked')).map(function(c){return c.value;});
  var lb=[],da=[],co=[];
  if(sel.indexOf('etf')!==-1){lb.push('ETF');da.push(eT);co.push(COMPARE_COLORS.etf);}
  if(sel.indexOf('tagesgeld')!==-1){lb.push('Tagesgeld 2%');da.push(tT);co.push(COMPARE_COLORS.tagesgeld);}
  if(sel.indexOf('bank')!==-1){lb.push('Bank 0%');da.push(bT);co.push(COMPARE_COLORS.bank);}
  if(sel.indexOf('bitcoin')!==-1){lb.push('Bitcoin');da.push(btT);co.push(COMPARE_COLORS.bitcoin);}
  if(sel.indexOf('ethereum')!==-1){lb.push('Ethereum');da.push(ethT);co.push(COMPARE_COLORS.ethereum);}
  chartCompare=new Chart(document.getElementById('compare').getContext('2d'),{type:'bar',data:{labels:lb,datasets:[{data:da,backgroundColor:co,barPercentage:0.7}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:function(c){return c.label+': '+fmt(c.parsed.y,cur);}}}},scales:{y:{title:{display:true,text:'Gesamtwert ('+cur+')'}}}}});
}

// Mode Switching
function updateMode(newMode){
  currentMode=newMode;
  var bc=document.getElementById('btnCalculator'),bh=document.getElementById('btnHistorical');
  if(bc)bc.classList.toggle('active-tab',newMode==='compare');
  if(bh)bh.classList.toggle('active-tab',newMode==='historical');
  if(historicalSectionEl)historicalSectionEl.style.display=newMode==='historical'?'block':'none';
  // Swap Start-Jahr ↔ Ab Jahr label
  var lbl=document.getElementById('startYearLabel');
  var bisW=document.getElementById('bisJahrWrapper');
  var renditeW=document.getElementById('renditeWrapper');
  if(lbl)lbl.textContent=newMode==='historical'?'Ab Jahr':'Start-Jahr';
  if(bisW)bisW.style.display=newMode==='historical'?'block':'none';
  // Hide Rendite and Laufzeit slider in historical mode
  if(renditeW)renditeW.style.display=newMode==='historical'?'none':'block';
  var laufzeitRow=document.getElementById('laufzeitSliderRow');
  if(laufzeitRow)laufzeitRow.style.display=newMode==='historical'?'none':'';
  // Set default Bis Jahr to current year
  var bisEl=document.getElementById('bisCalendarYear');
  if(bisEl&&!bisEl.value)bisEl.value=new Date().getFullYear();
  // In historical mode, default Ab Jahr to 2015 if empty or looks like a start year
  if(newMode==='historical'){
    var sv=parseInt(startCalendarYearEl.value);
    if(!sv||sv>new Date().getFullYear())startCalendarYearEl.value=2015;
  }
  // Sync startCalendarYear to assetStartYear
  if(assetStartYearEl)assetStartYearEl.value=startCalendarYearEl.value||2015;
  // Update badge
  var badge=document.getElementById('historicalBadge');
  if(badge&&newMode==='historical'){var s=assetSelectEl.options[assetSelectEl.selectedIndex];badge.innerHTML='Aktuell: <strong>'+(s?s.text:'')+'</strong>';}
  if(newMode==='historical'){
    // Show loading state
    var kE=document.getElementById('kpiEndkapital'),kES=document.getElementById('kpiEndkapitalSub');
    if(kE){kE.textContent='Laden...';kES.textContent='';}
    fetchHistoricalPrices().then(function(){
      if(loadedHistoricalPrices.length<=1){
        if(kE){kE.textContent='–';kES.textContent='Keine Daten gefunden';}
        // Show message on chart
        if(chartMain)chartMain.destroy();
        var ctx=document.getElementById('chart').getContext('2d');
        chartMain=new Chart(ctx,{type:'bar',data:{labels:['Keine Daten'],datasets:[{data:[0],backgroundColor:'rgba(100,100,100,0.3)'}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},title:{display:true,text:'Keine historischen Daten verfügbar. Versuche einen anderen Ticker oder Zeitraum.',color:'var(--muted)',font:{size:13}}}}});
      } else {
        triggerCalc();
      }
    });
  }else{loadedHistoricalRates=[];loadedHistoricalPrices=[];triggerCalc();}
}
window.updateMode=updateMode;

function triggerCalc(){var a=document.querySelector('.btn-group .btn.active-calc-btn');calc(a&&a.textContent.indexOf('Netto')!==-1);}

btnCalcMode.addEventListener('click',function(){updateMode('compare');});
btnHistoricalMode.addEventListener('click',function(){updateMode('historical');});
assetSelectEl.addEventListener('change',function(){
  var badge=document.getElementById('historicalBadge');
  if(badge)badge.innerHTML='Aktuell: <strong>'+this.options[this.selectedIndex].text+'</strong>';
  if(currentMode==='historical'){
    var kE=document.getElementById('kpiEndkapital'),kES=document.getElementById('kpiEndkapitalSub');
    if(kE){kE.textContent='Laden...';kES.textContent='';}
    fetchHistoricalPrices().then(function(){
      if(loadedHistoricalPrices.length>1)triggerCalc();
      else if(kE){kE.textContent='–';kES.textContent='Keine Daten';}
    });
  }
});
// When Ab Jahr or Bis Jahr changes in historical mode, refetch
startCalendarYearEl.addEventListener('change',function(){
  if(currentMode==='historical'){if(assetStartYearEl)assetStartYearEl.value=this.value;fetchHistoricalPrices().then(function(){triggerCalc();});}
});
var bisCalEl=document.getElementById('bisCalendarYear');
if(bisCalEl)bisCalEl.addEventListener('change',function(){if(currentMode==='historical')fetchHistoricalPrices().then(function(){triggerCalc();});});
assetToggleEls.forEach(function(cb){cb.addEventListener('change',function(){triggerCalc();});});
chartAxisToggleEl.addEventListener('change',function(){triggerCalc();});

// Reset
function resetValuesAndCalc(){
  currencyEl.value=DEFAULT_CURRENCY;rateEl.value=DEFAULT_MONTHLY_RATE;monthlyRateIncreaseEl.value=DEFAULT_RATE_INCREASE;
  yearsEl.value=DEFAULT_YEARS;startCalendarYearEl.value=new Date().getFullYear();
  interestRatePresetEl.value=DEFAULT_INTEREST_PRESET;interestCustomEl.value='';interestRatePresetEl.dispatchEvent(new Event('change'));
  etfTypeEl.value=DEFAULT_ETF_TYPE;freibetragEl.value=DEFAULT_FREIBETRAG;steuerSatzEl.value=DEFAULT_STEUERSATZ;basiszinsEl.value=DEFAULT_BASISZINS;
  taxRateDisplayEl.textContent=DEFAULT_STEUERSATZ.toString();startEl.value=0;
  stopMonthlyRateEnableEl.checked=false;stopMonthlyRateYearEl.value=10;stopMonthlyRateEnableEl.dispatchEvent(new Event('change'));
  payoutYearTypeEl.value='laufjahr';
  lumpsumEntriesContainer.innerHTML='<div class="compact-row main-entry-row"><div><label for="lumpsum">Betrag (€)</label><input id="lumpsum" type="number" value="0" min="0" class="lumpsum-amount"></div><div><label for="lumpyear">Jahr</label><input id="lumpyear" type="number" value="1" min="1" class="lumpsum-year"></div></div>';
  oneTimePayoutEntriesContainer.innerHTML='<div class="compact-row main-entry-row"><div><label>Betrag (€)</label><input id="payout" type="number" value="0" min="0" class="payout-amount"></div><div><label>Jahr</label><input id="payoutYear" type="number" value="1" min="1" class="payout-year"></div></div>';
  payoutPlanAmountEl.value=0;payoutStartYearEl.value=1;payoutIntervalEl.value='monthly';payoutIntervalDaysEl.value='';payoutIntervalEl.dispatchEvent(new Event('change'));
  assetSelectEl.value='gold';startCalendarYearEl.value=2015;assetStartYearEl.value=2015;loadedHistoricalRates=[];loadedHistoricalPrices=[];
  updateMode('compare');chartAxisToggleEl.checked=false;warnEl.textContent='';headlineEl.innerHTML='';
  if(chartMain){chartMain.destroy();chartMain=null;}if(chartCompare){chartCompare.destroy();chartCompare=null;}
  document.querySelectorAll('.btn-group .btn').forEach(function(b){b.classList.remove('active-calc-btn');});
  var bb=document.querySelector('.btn[onclick="calc(false)"]');if(bb)bb.classList.add('active-calc-btn');
  updateCurrencyLabels(DEFAULT_CURRENCY);
  // Reset sliders
  var sr=document.getElementById('startRange'),sv=document.getElementById('startRangeValue');if(sr){sr.value=0;}if(sv){sv.value=0;}
  var rr=document.getElementById('rateRange'),rv=document.getElementById('rateRangeValue');if(rr){rr.value=DEFAULT_MONTHLY_RATE;}if(rv){rv.value=DEFAULT_MONTHLY_RATE;}
  var yr=document.getElementById('yearsRange'),yv=document.getElementById('yearsRangeValue');if(yr){yr.value=DEFAULT_YEARS;}if(yv){yv.value=DEFAULT_YEARS;}
  calc(false);
}
resetBtn.addEventListener('click',resetValuesAndCalc);

// MAIN CALC
function calc(withTax){
  warnEl.textContent='';var currency=currencyEl.value;
  var baseMonthlyRate=parseFloat(rateEl.value)||0,monthlyRateIncrease=(parseFloat(monthlyRateIncreaseEl.value)||0)/100;
  var totalYears=parseInt(yearsEl.value)||0,investStartYear=parseInt(startCalendarYearEl.value)||new Date().getFullYear();
  var intVal=(interestRatePresetEl.value==='custom')?(parseFloat(interestCustomEl.value)||0):(parseFloat(interestRatePresetEl.value)||0);
  var annualRate=intVal/100,startCapital=parseFloat(startEl.value)||0;
  var stopEnabled=stopMonthlyRateEnableEl.checked,stopYear=parseInt(stopMonthlyRateYearEl.value)||0;
  var etfType=etfTypeEl.value,freibetrag=parseFloat(freibetragEl.value)||0,steuerSatz=(parseFloat(steuerSatzEl.value)||0)/100;
  var basiszins=(parseFloat(basiszinsEl.value)||0)/100,pyType=payoutYearTypeEl.value;
  var lumpsums=getDynamicEntries('lumpsum-amount','lumpsum-year'),otPayouts=getDynamicEntries('payout-amount','payout-year');
  var calAxis=chartAxisToggleEl.checked,planAmt=parseFloat(payoutPlanAmountEl.value)||0;
  var planStart=parseInt(payoutStartYearEl.value)||0,planInt=payoutIntervalEl.value,planDays=parseInt(payoutIntervalDaysEl.value)||0;
  var hRates=(currentMode==='historical')?loadedHistoricalRates:[];
  if(totalYears<1){warnEl.textContent='Bitte Laufzeit >= 1 Jahr.';return;}

  var balance=startCapital,cumDep=startCapital,cumPay=0,cumTax=0,frRest=freibetrag,allVPA=0;
  var labels=[],ndD=[],ngD=[],apD=[],ctD=[];
  for(var y=1;y<=totalYears;y++){
    var cy=investStartYear+y-1,yPay=0,bStart=balance,yTax=0;
    if(y>1){frRest=freibetrag;baseMonthlyRate*=(1+monthlyRateIncrease);}
    lumpsums.forEach(function(l){if(l.year===y){balance+=l.amount;cumDep+=l.amount;bStart+=l.amount;}});
    var contrib=(!(stopEnabled&&y>=stopYear))?baseMonthlyRate*12:0;balance+=contrib;cumDep+=contrib;
    var preI=balance,rfy=annualRate;
    if(hRates.length>0)rfy=hRates[y-1]!==undefined?hRates[y-1]:hRates[hRates.length-1];
    balance*=(1+rfy);var gain=balance-preI;
    otPayouts.forEach(function(p){var occ=(pyType==='laufjahr'&&p.year===y)||(pyType==='kalenderjahr'&&p.year===cy);if(occ){var am=Math.min(balance,p.amount);balance-=am;cumPay+=am;yPay+=am;}});
    if(y>=planStart&&planAmt>0){var ypl=0;if(planInt==='yearly')ypl=planAmt;else if(planInt==='custom'&&planDays>0)ypl=planAmt*(365/planDays);else ypl=planAmt*12;var apl=Math.min(balance,ypl);balance-=apl;cumPay+=apl;yPay+=apl;}
    if(withTax){
      if(etfType==='thesaurierend'){var vpR=bStart*basiszins*0.7,vpA=Math.min(vpR,gain);allVPA+=vpA;var txb=Math.max(0,vpA-frRest);yTax=txb*steuerSatz;frRest-=Math.min(vpA,frRest);}
      else{var txbA=Math.max(0,gain-frRest);yTax=txbA*steuerSatz;frRest-=Math.min(gain,frRest);}
      yTax=Math.max(0,yTax);balance-=yTax;cumTax+=yTax;
    }
    labels.push(calAxis?cy.toString():'Jahr '+y);var ni=cumDep-cumPay;
    ndD.push(Math.max(0,ni));ngD.push(Math.max(0,balance-ni));apD.push(-yPay);ctD.push(cumTax);
  }

  var fBal=balance,fNI=cumDep-cumPay,fGain=fBal-fNI,vk=0,enk=fBal;
  // Headline (hidden but needed for compat)
  var h='<div class="headline-item"><span class="headline-label">Einzahlungen:</span><span class="headline-sub-value">'+fmt(cumDep,currency)+'</span></div>';
  h+='<div class="headline-item"><span class="headline-label">Gewinn:</span><span class="headline-value">'+fmt(fGain,currency)+'</span></div>';
  if(withTax){var sg=fBal-(cumDep-allVPA-cumPay),st=Math.max(0,sg-freibetrag);vk=Math.max(0,st*steuerSatz*0.7);enk=fBal-vk;}
  headlineEl.innerHTML=h;attachModalListeners();

  // KPI Cards
  var kE=document.getElementById('kpiEndkapital'),kES=document.getElementById('kpiEndkapitalSub');
  var kEi=document.getElementById('kpiEinzahlungen'),kEiS=document.getElementById('kpiEinzahlungenSub');
  var kG=document.getElementById('kpiGewinn'),kGS=document.getElementById('kpiGewinnSub');
  var kSt=document.getElementById('kpiSteuern'),kStS=document.getElementById('kpiSteuernSub');
  if(kE){kE.textContent=fmt(withTax?enk:fBal,currency);kES.textContent=withTax?'Netto':'Brutto';}
  if(kEi){kEi.textContent=fmt(cumDep,currency);kEiS.textContent=fmt(parseFloat(rateEl.value)||0,currency)+'/M × '+totalYears+'J';}
  if(kG){kG.textContent=fmt(fGain,currency);kGS.textContent='+'+(cumDep>0?((fGain/cumDep)*100).toFixed(1):'0')+'%';}
  if(kSt){if(withTax){kSt.textContent=fmt(cumTax+vk,currency);kStS.textContent='VPA + Verkauf';}else{kSt.textContent='–';kStS.textContent='nur bei Netto';}}

  // Main chart
  if(chartMain)chartMain.destroy();

  // HISTORICAL MODE: show portfolio growth using actual market returns
  if(currentMode==='historical'&&loadedHistoricalPrices.length>1){
    var hLabels=[],hContrib=[],hGrowth=[],hTax=[];
    var monthlyRate=parseFloat(rateEl.value)||0;
    var initCapital=parseFloat(startEl.value)||0;
    var portfolioValue=initCapital;
    var totalDeposited=initCapital;
    var cumHistTax=0, histFreibetragRest=freibetrag, histAllVPA=0;

    for(var hi=0;hi<loadedHistoricalPrices.length;hi++){
      var hp=loadedHistoricalPrices[hi];
      hLabels.push(hp.year.toString());

      var balanceStart=portfolioValue;
      // Add yearly contributions
      totalDeposited+=monthlyRate*12;
      portfolioValue+=monthlyRate*12;

      // Apply real market return for this year
      if(hi>0){
        var yearReturn=loadedHistoricalPrices[hi].price/loadedHistoricalPrices[hi-1].price;
        portfolioValue=(balanceStart*yearReturn)+monthlyRate*12;
      }

      var yearGain=portfolioValue-balanceStart-monthlyRate*12;

      // Tax calculation (if Netto)
      if(withTax&&hi>0){
        if(hi>0)histFreibetragRest=freibetrag; // reset per year
        var histYearTax=0;
        if(etfType==='thesaurierend'){
          var vpRoh=balanceStart*basiszins*0.7;
          var vpAnz=Math.min(vpRoh,Math.max(0,yearGain));
          histAllVPA+=vpAnz;
          var vpTaxable=Math.max(0,vpAnz-histFreibetragRest);
          histYearTax=vpTaxable*steuerSatz;
          histFreibetragRest-=Math.min(vpAnz,histFreibetragRest);
        } else {
          var taxableGain=Math.max(0,yearGain-histFreibetragRest);
          histYearTax=taxableGain*steuerSatz;
          histFreibetragRest-=Math.min(yearGain,histFreibetragRest);
        }
        histYearTax=Math.max(0,histYearTax);
        portfolioValue-=histYearTax;
        cumHistTax+=histYearTax;
      }

      hContrib.push(Math.round(totalDeposited));
      hGrowth.push(Math.max(0,Math.round(portfolioValue-totalDeposited)));
      hTax.push(Math.round(cumHistTax));
    }

    // Verkaufsteuer bei Netto
    var histVK=0;
    if(withTax){
      var histGainOnSale=portfolioValue-(totalDeposited-histAllVPA);
      var histTaxableOnSale=Math.max(0,histGainOnSale-freibetrag);
      histVK=Math.max(0,histTaxableOnSale*steuerSatz*0.7);
    }
    var histEndkapital=withTax?(portfolioValue-histVK):portfolioValue;
    var histTotalGain=histEndkapital-totalDeposited;

    // Update KPIs
    if(kE){kE.textContent=fmt(histEndkapital,currency);kES.textContent=withTax?'Netto (nach Steuern)':'Brutto';}
    if(kEi){kEi.textContent=fmt(totalDeposited,currency);kEiS.textContent=fmt(monthlyRate,currency)+'/M × '+loadedHistoricalPrices.length+'J';}
    if(kG){kG.textContent=fmt(histTotalGain,currency);kGS.textContent=(totalDeposited>0?((histTotalGain/totalDeposited)*100).toFixed(1):'0')+'%';}
    if(kSt){
      if(withTax){kSt.textContent=fmt(cumHistTax+histVK,currency);kStS.textContent='VPA + Verkauf';}
      else{kSt.textContent='–';kStS.textContent='nur bei Netto';}
    }

    // Build chart datasets
    var histDatasets=[
      {label:'Einzahlungen',data:hContrib,backgroundColor:'rgba(52,152,219,0.7)',stack:'s'},
      {label:'Wertsteigerung'+(withTax?' (nach Steuer)':''),data:hGrowth,backgroundColor:'rgba(46,204,113,0.7)',stack:'s'}
    ];
    if(withTax){
      histDatasets.push({label:'Steuer (kum.)',data:hTax,backgroundColor:TAX_COLOR_DIAGRAM,type:'line',order:-1,yAxisID:'y1',fill:true,tension:0.3,borderWidth:2,pointRadius:0});
    }

    chartMain=new Chart(document.getElementById('chart').getContext('2d'),{type:'bar',
      data:{labels:hLabels,datasets:histDatasets},
      options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},
        plugins:{tooltip:{callbacks:{label:function(c){return c.dataset.label+': '+fmt(Math.abs(c.parsed.y),currency);}}}},
        scales:{y:{stacked:true,beginAtZero:true},y1:{display:!!withTax,position:'right',grid:{drawOnChartArea:false}},x:{stacked:true}}
      }
    });
    // Skip compare chart in historical mode
    if(chartCompare)chartCompare.destroy();
    return;
  } else if(currentMode==='historical'&&loadedHistoricalPrices.length<=1){
    // No data available
    document.getElementById('chart').getContext('2d');
    if(kE){kE.textContent='–';kES.textContent='Keine Daten';}
    return;
  }

  // CALCULATOR MODE: standard stacked chart
  var ds=[{label:'Netto Einzahlungen',data:ndD,backgroundColor:CAPITAL_COLOR,stack:'pos'},{label:'Gewinn '+(withTax?'(Netto)':'(Brutto)'),data:ngD,backgroundColor:GAIN_COLOR,stack:'pos'},{label:'Auszahlungen',data:apD,backgroundColor:ANNUAL_PAYOUT_COLOR,stack:'neg'}];
  if(withTax)ds.push({label:'Steuer (kum.)',data:ctD,backgroundColor:TAX_COLOR_DIAGRAM,type:'line',order:-1,yAxisID:'y1'});
  chartMain=new Chart(document.getElementById('chart').getContext('2d'),{type:'bar',data:{labels:labels,datasets:ds},options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},plugins:{tooltip:{callbacks:{label:function(c){return(c.dataset.label||'')+': '+fmt(Math.abs(c.parsed.y),currency);}}}},scales:{y:{stacked:true,beginAtZero:true},y1:{display:!!withTax,position:'right',grid:{drawOnChartArea:false}},x:{stacked:true}}}});

  // Compare
  var eT=fBal+cumPay,bR=parseFloat(rateEl.value)||0;
  var tT=computeComparisonTotal(startCapital,lumpsums,bR,monthlyRateIncrease,0.02,totalYears,stopEnabled,stopYear);
  var btT=computeComparisonTotal(startCapital,lumpsums,bR,monthlyRateIncrease,0.45,totalYears,stopEnabled,stopYear);
  var ethT=computeComparisonTotal(startCapital,lumpsums,bR,monthlyRateIncrease,0.30,totalYears,stopEnabled,stopYear);
  updateCompareChart(eT,tT,cumDep,btT,ethT,currency);
}

document.addEventListener('DOMContentLoaded',function(){resetValuesAndCalc();});
