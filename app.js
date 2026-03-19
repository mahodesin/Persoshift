// ============================================
// PersoShift – Chart Beautifier + WKN Search
// Two-tone: Teal + Amber
// ============================================
(function() {
  'use strict';

  // ===== 1. CHART DEFAULTS – cleaner look =====
  try {
    Chart.defaults.elements.bar.borderRadius = 4;
    Chart.defaults.elements.bar.borderSkipped = false;
    Chart.defaults.elements.line.tension = 0.3;
    Chart.defaults.elements.line.borderWidth = 2;
    Chart.defaults.elements.point.radius = 0;
    Chart.defaults.elements.point.hoverRadius = 4;
    Chart.defaults.plugins.legend.labels.usePointStyle = true;
    Chart.defaults.plugins.legend.labels.padding = 16;
    Chart.defaults.plugins.tooltip.backgroundColor = '#fff';
    Chart.defaults.plugins.tooltip.titleColor = '#333';
    Chart.defaults.plugins.tooltip.bodyColor = '#666';
    Chart.defaults.plugins.tooltip.borderColor = '#ddd';
    Chart.defaults.plugins.tooltip.borderWidth = 1;
    Chart.defaults.plugins.tooltip.cornerRadius = 8;
    Chart.defaults.plugins.tooltip.padding = 10;
    Chart.defaults.plugins.tooltip.usePointStyle = true;
    Chart.defaults.scale.grid.color = 'rgba(0,0,0,0.05)';
    Chart.defaults.scale.grid.drawBorder = false;
    Chart.defaults.scale.ticks.color = '#999';
  } catch(e) {}

  // ===== 2. BEAUTIFY after calc runs =====
  var _origCalc = window.calc;
  window.calc = function(withTax) {
    _origCalc(withTax);

    // Main chart – apply rounded bars + cleaner tax line
    if (window.chartMain) {
      window.chartMain.data.datasets.forEach(function(ds, i) {
        ds.borderRadius = 4;
        ds.borderSkipped = false;
        if (i === 3) { // tax line
          ds.pointRadius = 0;
          ds.borderWidth = 2;
          ds.tension = 0.3;
          ds.fill = true;
          ds.backgroundColor = 'rgba(231,76,60,0.06)';
          ds.borderColor = 'rgba(231,76,60,0.5)';
        }
      });
      window.chartMain.options.animation = { duration: 500, easing: 'easeOutQuart' };
      if (window.chartMain.options.scales.x) {
        window.chartMain.options.scales.x.grid = { display: false };
        window.chartMain.options.scales.x.ticks = { maxRotation: 45, autoSkip: true, maxTicksLimit: 20 };
      }
      window.chartMain.update();
    }

    // Compare chart – rounded bars + readable Y axis
    if (window.chartCompare) {
      window.chartCompare.data.datasets.forEach(function(ds) {
        ds.borderRadius = 6;
        ds.borderSkipped = false;
        ds.barPercentage = 0.6;
      });
      window.chartCompare.options.animation = { duration: 500, easing: 'easeOutQuart' };
      if (window.chartCompare.options.scales && window.chartCompare.options.scales.y) {
        window.chartCompare.options.scales.y.ticks = {
          callback: function(v) {
            if (v >= 1000000) return (v / 1000000).toFixed(1) + ' Mio';
            if (v >= 1000) return (v / 1000).toFixed(0) + 'k';
            return v;
          }
        };
      }
      window.chartCompare.update();
    }
  };

  // ===== 3. WKN / ISIN SEARCH =====
  var recentSearches = [];
  try { recentSearches = JSON.parse(localStorage.getItem('wkn_recent') || '[]'); } catch(e) {}

  function updateRecentUI() {
    var container = document.getElementById('wknRecentSearches');
    var list = document.getElementById('wknRecentList');
    if (!container || !list) return;
    if (recentSearches.length === 0) { container.style.display = 'none'; return; }
    container.style.display = 'block';
    list.innerHTML = '';
    recentSearches.slice(0, 8).forEach(function(term) {
      var tag = document.createElement('span');
      tag.className = 'wkn-recent-tag';
      tag.textContent = term;
      tag.addEventListener('click', function() {
        document.getElementById('wknSearchInput').value = term;
        searchWKN();
      });
      list.appendChild(tag);
    });
  }

  function addToRecent(term) {
    recentSearches = recentSearches.filter(function(t) { return t !== term; });
    recentSearches.unshift(term);
    if (recentSearches.length > 8) recentSearches = recentSearches.slice(0, 8);
    try { localStorage.setItem('wkn_recent', JSON.stringify(recentSearches)); } catch(e) {}
    updateRecentUI();
  }

  window.searchWKN = function() {
    var input = document.getElementById('wknSearchInput');
    var statusEl = document.getElementById('wknSearchStatus');
    var resultsEl = document.getElementById('wknSearchResults');
    var query = (input.value || '').trim();
    var btn = document.getElementById('wknSearchBtn');
    if (!query) { statusEl.textContent = 'Bitte einen Suchbegriff eingeben.'; statusEl.className = 'error'; return; }
    statusEl.textContent = 'Suche läuft...'; statusEl.className = ''; resultsEl.innerHTML = ''; btn.disabled = true;
    addToRecent(query);

    var isISIN = /^[A-Z]{2}[A-Z0-9]{10}$/.test(query.toUpperCase());
    var isWKN = /^[A-Z0-9]{6}$/.test(query.toUpperCase()) && !isISIN;
    var body = [];
    if (isISIN) body.push({ idType: 'ID_ISIN', idValue: query.toUpperCase() });
    else if (isWKN) body.push({ idType: 'ID_WERTPAPIER', idValue: query.toUpperCase() });
    else body.push({ idType: 'ID_ISIN', idValue: query.toUpperCase() });

    fetch('https://api.openfigi.com/v3/mapping', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    }).then(function(r) { return r.json(); }).then(function(data) {
      btn.disabled = false;
      if (!data || !data[0] || !data[0].data || data[0].data.length === 0) return fallbackSearch(query, statusEl, resultsEl, btn);
      statusEl.textContent = data[0].data.length + ' Ergebnis(se) gefunden';
      renderResults(data[0].data, resultsEl);
    }).catch(function() { btn.disabled = false; fallbackSearch(query, statusEl, resultsEl, btn); });
  };

  function fallbackSearch(query, statusEl, resultsEl, btn) {
    fetch('https://api.openfigi.com/v3/mapping', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([{ idType: 'TICKER', idValue: query.toUpperCase(), exchCode: 'GY' }])
    }).then(function(r) { return r.json(); }).then(function(data) {
      btn.disabled = false;
      if (!data || !data[0] || !data[0].data || data[0].data.length === 0) {
        statusEl.textContent = 'Keine Ergebnisse. Versuche eine ISIN (z.B. IE00B4L5Y983) oder WKN (z.B. A0RPWH).';
        statusEl.className = 'error'; renderExamples(resultsEl); return;
      }
      statusEl.textContent = data[0].data.length + ' Ergebnis(se) gefunden';
      renderResults(data[0].data, resultsEl);
    }).catch(function() { btn.disabled = false; statusEl.textContent = 'Fehler. Bitte ISIN oder WKN direkt eingeben.'; statusEl.className = 'error'; renderExamples(resultsEl); });
  }

  function renderResults(items, container) {
    container.innerHTML = '';
    var seen = {};
    items.filter(function(item) { var k = (item.name||'')+(item.exchCode||''); if (seen[k]) return false; seen[k] = true; return true; }).slice(0, 10).forEach(function(item) {
      var card = document.createElement('div'); card.className = 'wkn-result-card';
      var sub = [];
      if (item.ticker) sub.push('Ticker: ' + item.ticker);
      if (item.exchCode) sub.push('Börse: ' + item.exchCode);
      if (item.securityType) sub.push(item.securityType);
      var h = '<h3>' + esc(item.name || 'Unbekannt') + '</h3><div class="wkn-subtitle">' + esc(sub.join(' · ')) + '</div><div class="wkn-details-grid">';
      if (item.figi) h += detail('FIGI', item.figi);
      if (item.securityType) h += detail('Typ', item.securityType);
      if (item.marketSector) h += detail('Sektor', item.marketSector);
      if (item.exchCode) h += detail('Börse', item.exchCode);
      if (item.ticker) h += detail('Ticker', item.ticker, true);
      if (item.compositeFIGI) h += detail('Composite FIGI', item.compositeFIGI);
      h += '</div>'; card.innerHTML = h; container.appendChild(card);
    });
  }

  function renderExamples(container) {
    container.innerHTML = '<div class="wkn-result-card" style="text-align:center"><h3 style="font-size:1.1rem">Beliebte Wertpapiere</h3><div class="wkn-recent-list" style="justify-content:center;margin-top:0.75rem">' +
      tag('IE00B4L5Y983', 'MSCI World') + tag('IE00B5BMR087', 'S&P 500') + tag('IE00BKM4GZ66', 'EM IMI') + tag('A0RPWH', 'MSCI World WKN') + tag('IE00B3RBWM25', 'FTSE All-World') + '</div></div>';
  }

  function tag(v, l) { return '<span class="wkn-recent-tag" onclick="document.getElementById(\'wknSearchInput\').value=\'' + v + '\';searchWKN()">' + l + '</span>'; }
  function detail(l, v, hi) { return '<div class="wkn-detail-item"><div class="wkn-detail-label">' + esc(l) + '</div><div class="wkn-detail-value' + (hi ? ' highlight' : '') + '">' + esc(v) + '</div></div>'; }
  function esc(s) { var d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }

  var si = document.getElementById('wknSearchInput');
  if (si) si.addEventListener('keydown', function(e) { if (e.key === 'Enter') { e.preventDefault(); searchWKN(); } });
  updateRecentUI();
})();
