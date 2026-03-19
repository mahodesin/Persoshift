// ============================================
// PersoShift – Chart Beautifier & Bug Fixes
// Loaded AFTER the inline script in index.html
// ============================================

(function() {
  'use strict';

  // --- 1. BETTER CHART.JS GLOBAL DEFAULTS ---
  Chart.defaults.elements.bar.borderRadius = 5;
  Chart.defaults.elements.bar.borderSkipped = false;
  Chart.defaults.elements.line.tension = 0.35;
  Chart.defaults.elements.line.borderWidth = 2.5;
  Chart.defaults.elements.point.radius = 0;
  Chart.defaults.elements.point.hoverRadius = 5;
  Chart.defaults.plugins.legend.labels.usePointStyle = true;
  Chart.defaults.plugins.legend.labels.padding = 18;
  Chart.defaults.plugins.legend.labels.font = { size: 12, weight: '500' };
  Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(255,255,255,0.96)';
  Chart.defaults.plugins.tooltip.titleColor = '#2d3436';
  Chart.defaults.plugins.tooltip.bodyColor = '#555';
  Chart.defaults.plugins.tooltip.borderColor = '#e0e0e0';
  Chart.defaults.plugins.tooltip.borderWidth = 1;
  Chart.defaults.plugins.tooltip.cornerRadius = 10;
  Chart.defaults.plugins.tooltip.padding = 12;
  Chart.defaults.plugins.tooltip.boxPadding = 6;
  Chart.defaults.plugins.tooltip.usePointStyle = true;
  Chart.defaults.scale.grid.color = 'rgba(0,0,0,0.06)';
  Chart.defaults.scale.grid.drawBorder = false;
  Chart.defaults.scale.ticks.color = '#888';
  Chart.defaults.scale.ticks.font = { size: 11 };
  Chart.defaults.scale.title.font = { size: 12, weight: '500' };
  Chart.defaults.scale.title.color = '#777';

  // --- 2. NICER COLOR PALETTE ---
  // Overwrite the flat chart color constants (they're declared with const in the inline script,
  // but we can't re-assign them. Instead we'll apply colors directly in our overridden functions.)
  var COLORS = {
    capital:  'rgba(74, 159, 214, 0.75)',   // Soft blue
    gain:     'rgba(240, 169, 68, 0.8)',     // Warm amber  
    payout:   'rgba(46, 204, 113, 0.75)',    // Fresh green
    taxLine:  'rgba(228, 91, 91, 0.65)',     // Soft red
    taxFill:  'rgba(228, 91, 91, 0.08)',     // Very light red fill
    compare: {
      etf:       'rgba(46, 204, 113, 0.8)',
      tagesgeld: 'rgba(74, 159, 214, 0.75)',
      bank:      'rgba(176, 176, 176, 0.6)',
      bitcoin:   'rgba(247, 147, 26, 0.8)',
      ethereum:  'rgba(98, 126, 234, 0.8)'
    }
  };

  // --- 3. OVERRIDE calc() TO USE BETTER CHARTS ---
  // We store the original and call it, then destroy & rebuild charts with nicer config
  var _originalCalc = window.calc || calc;

  window.calc = function(withTax) {
    // Run original calculation (populates all data, headline, etc.)
    _originalCalc(withTax);

    // Now grab the chart instances and rebuild them with better styling
    var currency = document.getElementById('currency').value;
    var useCalendarYearAxis = document.getElementById('chartAxisToggle').checked;

    // --- Rebuild MAIN chart ---
    if (window.chartMain) {
      var oldMain = window.chartMain;
      var mainData = {
        labels: oldMain.data.labels.slice(),
        datasets: oldMain.data.datasets.map(function(ds) { return Object.assign({}, ds, { data: ds.data.slice() }); })
      };
      var wasWithTax = mainData.datasets.length > 3;
      oldMain.destroy();

      // Enhance datasets
      mainData.datasets.forEach(function(ds, i) {
        if (i === 0) { // Netto Einzahlungen
          ds.backgroundColor = COLORS.capital;
          ds.hoverBackgroundColor = 'rgba(74, 159, 214, 0.95)';
          ds.borderRadius = 5;
          ds.borderSkipped = false;
        } else if (i === 1) { // Gewinn
          ds.backgroundColor = COLORS.gain;
          ds.hoverBackgroundColor = 'rgba(240, 169, 68, 1)';
          ds.borderRadius = 5;
          ds.borderSkipped = false;
        } else if (i === 2) { // Auszahlungen
          ds.backgroundColor = COLORS.payout;
          ds.hoverBackgroundColor = 'rgba(46, 204, 113, 0.95)';
          ds.borderRadius = 5;
          ds.borderSkipped = false;
        } else if (i === 3) { // Steuer-Linie
          ds.backgroundColor = COLORS.taxFill;
          ds.borderColor = COLORS.taxLine;
          ds.pointRadius = 0;
          ds.pointHoverRadius = 5;
          ds.pointHoverBackgroundColor = COLORS.taxLine;
          ds.borderWidth = 2.5;
          ds.tension = 0.35;
          ds.fill = true;
        }
      });

      window.chartMain = new Chart(document.getElementById('chart').getContext('2d'), {
        type: 'bar',
        data: mainData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          animation: {
            duration: 600,
            easing: 'easeOutQuart'
          },
          plugins: {
            tooltip: {
              callbacks: {
                label: function(ctx) {
                  var label = ctx.dataset.label || '';
                  if (label) label += ': ';
                  var val = (ctx.dataset.label === 'Auszahlungen (jährlich)') ? Math.abs(ctx.parsed.y) : ctx.parsed.y;
                  return label + fmt(val, currency);
                }
              }
            },
            legend: {
              position: 'bottom',
              labels: {
                usePointStyle: true,
                padding: 18,
                font: { size: 12, weight: '500' }
              }
            }
          },
          layout: { padding: { top: 15, bottom: 5, left: 8, right: 8 } },
          scales: {
            y: {
              stacked: true,
              beginAtZero: true,
              title: { display: true, text: 'Betrag (' + currency.toUpperCase() + ')' },
              grid: { color: 'rgba(0,0,0,0.05)' }
            },
            y1: {
              display: wasWithTax,
              position: 'right',
              title: { display: true, text: 'Steuer kumuliert' },
              grid: { drawOnChartArea: false }
            },
            x: {
              stacked: true,
              title: { display: true, text: useCalendarYearAxis ? 'Kalenderjahr' : 'Laufjahre' },
              grid: { display: false },
              ticks: {
                maxRotation: 45,
                autoSkip: true,
                maxTicksLimit: 20
              }
            }
          }
        }
      });
    }

    // --- Rebuild COMPARE chart ---
    rebuildCompareChart(currency);
  };

  // --- 4. FIXED COMPARE CHART (with Bitcoin/Ethereum support) ---
  function rebuildCompareChart(currency) {
    if (window.chartCompare) {
      window.chartCompare.destroy();
      window.chartCompare = null;
    }

    var selected = [];
    document.querySelectorAll('.asset-toggle:checked').forEach(function(cb) {
      selected.push(cb.value);
    });

    // Read values from the headline to reconstruct totals
    // (The original calc already computed these, we just need the data)
    var oldCompare = null;

    // Get values from the original calc's scope through the DOM
    var startCapital = parseFloat(document.getElementById('start').value) || 0;
    var baseRate = parseFloat(document.getElementById('rate').value) || 0;
    var monthlyRateIncrease = (parseFloat(document.getElementById('monthlyRateIncrease').value) || 0) / 100;
    var totalYears = parseInt(document.getElementById('years').value) || 0;
    var stopEnabled = document.getElementById('stopMonthlyRateEnable').checked;
    var stopYear = parseInt(document.getElementById('stopMonthlyRateYear').value) || 0;

    // Get lump sums
    var lumpsums = [];
    var lAmounts = document.querySelectorAll('.lumpsum-amount');
    var lYears = document.querySelectorAll('.lumpsum-year');
    for (var i = 0; i < lAmounts.length; i++) {
      var a = parseFloat(lAmounts[i].value) || 0;
      var y = parseInt(lYears[i].value) || 0;
      if (a > 0 && y > 0) lumpsums.push({ amount: a, year: y });
    }

    function compTotal(annRate) {
      var t = startCapital;
      lumpsums.forEach(function(l) { if (l.amount > 0) t += l.amount; });
      var dr = baseRate;
      for (var yr = 1; yr <= totalYears; yr++) {
        if (yr > 1) dr *= (1 + monthlyRateIncrease);
        t += (stopEnabled && yr >= stopYear) ? 0 : dr * 12;
        t *= (1 + annRate);
      }
      return t;
    }

    // Get ETF total from headline (final balance + payouts)
    var grossDeposits = startCapital;
    lumpsums.forEach(function(l) { grossDeposits += l.amount; });
    var dr2 = baseRate;
    for (var yr2 = 1; yr2 <= totalYears; yr2++) {
      if (yr2 > 1) dr2 *= (1 + monthlyRateIncrease);
      grossDeposits += (stopEnabled && yr2 >= stopYear) ? 0 : dr2 * 12;
    }

    // Get interest rate for ETF
    var presetEl = document.getElementById('interestRatePreset');
    var intVal = (presetEl.value === 'custom')
      ? (parseFloat(document.getElementById('interestCustom').value) || 0)
      : (parseFloat(presetEl.value) || 0);
    var etfRate = intVal / 100;

    var etfTotal = compTotal(etfRate);
    var tdTotal = compTotal(0.02);
    var bankTotal = grossDeposits; // 0% interest
    var btcTotal = compTotal(0.45);
    var ethTotal = compTotal(0.30);

    var labels = [], data = [], bgColors = [], borderColors = [];

    if (selected.indexOf('etf') !== -1)       { labels.push('ETF'); data.push(etfTotal); bgColors.push(COLORS.compare.etf); borderColors.push('rgba(46, 204, 113, 1)'); }
    if (selected.indexOf('tagesgeld') !== -1) { labels.push('Tagesgeld 2%'); data.push(tdTotal); bgColors.push(COLORS.compare.tagesgeld); borderColors.push('rgba(74, 159, 214, 1)'); }
    if (selected.indexOf('bank') !== -1)      { labels.push('Bank 0%'); data.push(bankTotal); bgColors.push(COLORS.compare.bank); borderColors.push('rgba(176, 176, 176, 1)'); }
    if (selected.indexOf('bitcoin') !== -1)   { labels.push('Bitcoin ~45%'); data.push(btcTotal); bgColors.push(COLORS.compare.bitcoin); borderColors.push('rgba(247, 147, 26, 1)'); }
    if (selected.indexOf('ethereum') !== -1)  { labels.push('Ethereum ~30%'); data.push(ethTotal); bgColors.push(COLORS.compare.ethereum); borderColors.push('rgba(98, 126, 234, 1)'); }

    if (labels.length === 0) return;

    window.chartCompare = new Chart(document.getElementById('compare').getContext('2d'), {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: bgColors,
          borderColor: borderColors,
          borderWidth: 1.5,
          borderRadius: 8,
          borderSkipped: false,
          barPercentage: 0.6,
          hoverBackgroundColor: borderColors
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 600, easing: 'easeOutQuart' },
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function(ctx) {
                return ctx.label + ': ' + fmt(ctx.parsed.y, currency);
              }
            }
          }
        },
        layout: { padding: { top: 15, bottom: 5, left: 8, right: 8 } },
        scales: {
          y: {
            title: { display: true, text: 'Gesamtwert (' + currency.toUpperCase() + ')' },
            grid: { color: 'rgba(0,0,0,0.05)' },
            ticks: {
              callback: function(value) {
                if (value >= 1000000) return (value / 1000000).toFixed(1) + ' Mio';
                if (value >= 1000) return (value / 1000).toFixed(0) + 'k';
                return value;
              }
            }
          },
          x: {
            grid: { display: false }
          }
        }
      }
    });
  }

  // --- 5. ALSO OVERRIDE updateCompareChart (fixes bug where it referenced undefined chartOptionsBase) ---
  window.updateCompareChart = function(etfTotal, tdTotal, bankTotal, btcTotal, ethTotal, currency) {
    rebuildCompareChart(currency);
  };

})();
