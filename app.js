// ============================================
// PersoShift – Chart Beautifier + WKN Search
// Loaded AFTER the inline script in index.html
// NOTE: Tab navigation is handled inline via switchTab() in the HTML
// ============================================
(function() {
  'use strict';

  // ===== 1. CHART BEAUTIFIER =====
  try {
    Chart.defaults.elements.bar.borderRadius = 5;
    Chart.defaults.elements.bar.borderSkipped = false;
    Chart.defaults.elements.line.tension = 0.35;
    Chart.defaults.elements.line.borderWidth = 2.5;
    Chart.defaults.elements.point.radius = 0;
    Chart.defaults.elements.point.hoverRadius = 5;
    Chart.defaults.plugins.legend.labels.usePointStyle = true;
    Chart.defaults.plugins.legend.labels.padding = 18;
    Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(255,255,255,0.96)';
    Chart.defaults.plugins.tooltip.titleColor = '#2d3436';
    Chart.defaults.plugins.tooltip.bodyColor = '#555';
    Chart.defaults.plugins.tooltip.borderColor = '#e0e0e0';
    Chart.defaults.plugins.tooltip.borderWidth = 1;
    Chart.defaults.plugins.tooltip.cornerRadius = 10;
    Chart.defaults.plugins.tooltip.padding = 12;
    Chart.defaults.plugins.tooltip.usePointStyle = true;
    Chart.defaults.scale.grid.color = 'rgba(0,0,0,0.06)';
    Chart.defaults.scale.grid.drawBorder = false;
    Chart.defaults.scale.ticks.color = '#888';
  } catch(e) { console.warn('Chart defaults error:', e); }

  // Override calc to beautify charts after they are built
  if (typeof window.calc === 'function') {
    var _origCalc = window.calc;
    window.calc = function(withTax) {
      _origCalc(withTax);
      try {
        // Beautify main chart
        if (window.chartMain) {
          window.chartMain.data.datasets.forEach(function(ds, i) {
            ds.borderRadius = 5;
            ds.borderSkipped = false;
            if (i === 3) { // tax line
              ds.pointRadius = 0;
              ds.pointHoverRadius = 5;
              ds.borderWidth = 2.5;
              ds.tension = 0.35;
              ds.fill = true;
              ds.backgroundColor = 'rgba(231,76,60,0.08)';
              ds.borderColor = 'rgba(231,76,60,0.65)';
            }
          });
          window.chartMain.options.animation = { duration: 600, easing: 'easeOutQuart' };
          if (window.chartMain.options.scales && window.chartMain.options.scales.x) {
            window.chartMain.options.scales.x.grid = { display: false };
            window.chartMain.options.scales.x.ticks = Object.assign(
              window.chartMain.options.scales.x.ticks || {},
              { maxRotation: 45, autoSkip: true, maxTicksLimit: 20 }
            );
          }
          window.chartMain.update();
        }
        // Beautify compare chart
        if (window.chartCompare) {
          window.chartCompare.data.datasets.forEach(function(ds) {
            ds.borderRadius = 8;
            ds.borderSkipped = false;
            ds.barPercentage = 0.6;
          });
          window.chartCompare.options.animation = { duration: 600, easing: 'easeOutQuart' };
          if (window.chartCompare.options.scales && window.chartCompare.options.scales.x) {
            window.chartCompare.options.scales.x.grid = { display: false };
          }
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
      } catch(e) { console.warn('Chart beautify error:', e); }
    };
  }

  // ===== 2. WKN / ISIN SEARCH =====
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
        window.searchWKN();
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

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  function detailItem(label, value, highlight) {
    return '<div class="wkn-detail-item"><div class="wkn-detail-label">' + escapeHtml(label) + '</div><div class="wkn-detail-value' + (highlight ? ' highlight' : '') + '">' + escapeHtml(value) + '</div></div>';
  }

  function renderFigiResults(items, container) {
    container.innerHTML = '';
    var seen = {};
    var unique = items.filter(function(item) {
      var key = (item.name || '') + (item.exchCode || '');
      if (seen[key]) return false;
      seen[key] = true;
      return true;
    });
    unique.slice(0, 10).forEach(function(item) {
      var card = document.createElement('div');
      card.className = 'wkn-result-card';
      var title = item.name || 'Unbekannt';
      var subtitle = [];
      if (item.ticker) subtitle.push('Ticker: ' + item.ticker);
      if (item.exchCode) subtitle.push('Börse: ' + item.exchCode);
      if (item.securityType) subtitle.push(item.securityType);
      var html = '<h3>' + escapeHtml(title) + '</h3>';
      html += '<div class="wkn-subtitle">' + escapeHtml(subtitle.join(' · ')) + '</div>';
      html += '<div class="wkn-details-grid">';
      if (item.figi) html += detailItem('FIGI', item.figi);
      if (item.securityType) html += detailItem('Typ', item.securityType);
      if (item.securityType2) html += detailItem('Untertyp', item.securityType2);
      if (item.marketSector) html += detailItem('Sektor', item.marketSector);
      if (item.exchCode) html += detailItem('Börse', item.exchCode);
      if (item.ticker) html += detailItem('Ticker', item.ticker, true);
      if (item.compositeFIGI) html += detailItem('Composite FIGI', item.compositeFIGI);
      if (item.shareClassFIGI) html += detailItem('Share Class FIGI', item.shareClassFIGI);
      html += '</div>';
      card.innerHTML = html;
      container.appendChild(card);
    });
  }

  function renderExampleSearches(container) {
    var examples = [
      { value: 'IE00B4L5Y983', label: 'MSCI World' },
      { value: 'IE00B5BMR087', label: 'S&P 500' },
      { value: 'IE00BKM4GZ66', label: 'EM IMI' },
      { value: 'IE00B3RBWM25', label: 'FTSE All-World' }
    ];
    var html = '<div class="wkn-result-card" style="text-align:center">';
    html += '<h3 style="font-size:1.1rem">Beliebte Wertpapiere zum Ausprobieren</h3>';
    html += '<div class="wkn-recent-list" style="justify-content:center;margin-top:0.75rem">';
    examples.forEach(function(ex) {
      html += '<span class="wkn-recent-tag" style="cursor:pointer">' + ex.label + ' (' + ex.value + ')</span>';
    });
    html += '</div></div>';
    container.innerHTML = html;
    // Add click handlers
    container.querySelectorAll('.wkn-recent-tag').forEach(function(tag, i) {
      tag.addEventListener('click', function() {
        document.getElementById('wknSearchInput').value = examples[i].value;
        window.searchWKN();
      });
    });
  }

  function fallbackSearch(query, statusEl, resultsEl, btn) {
    var body = [{ idType: 'TICKER', idValue: query.toUpperCase(), exchCode: 'GY' }];
    fetch('https://api.openfigi.com/v3/mapping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
      btn.disabled = false;
      if (!data || !data[0] || !data[0].data || data[0].data.length === 0) {
        statusEl.textContent = 'Keine Ergebnisse für "' + query + '". Versuche eine ISIN (z.B. IE00B4L5Y983) oder WKN (z.B. A0RPWH).';
        statusEl.className = 'error';
        renderExampleSearches(resultsEl);
        return;
      }
      statusEl.textContent = data[0].data.length + ' Ergebnis(se) gefunden';
      statusEl.className = '';
      renderFigiResults(data[0].data, resultsEl);
    })
    .catch(function(err) {
      btn.disabled = false;
      statusEl.textContent = 'Fehler bei der Suche. Bitte versuche eine ISIN oder WKN direkt.';
      statusEl.className = 'error';
      renderExampleSearches(resultsEl);
    });
  }

  // Main search function - globally accessible
  window.searchWKN = function() {
    var input = document.getElementById('wknSearchInput');
    var statusEl = document.getElementById('wknSearchStatus');
    var resultsEl = document.getElementById('wknSearchResults');
    var btn = document.getElementById('wknSearchBtn');
    var query = (input ? input.value : '').trim();

    if (!query) {
      if (statusEl) { statusEl.textContent = 'Bitte einen Suchbegriff eingeben.'; statusEl.className = 'error'; }
      return;
    }

    if (statusEl) { statusEl.textContent = 'Suche läuft...'; statusEl.className = ''; }
    if (resultsEl) resultsEl.innerHTML = '';
    if (btn) btn.disabled = true;
    addToRecent(query);

    var isISIN = /^[A-Z]{2}[A-Z0-9]{10}$/.test(query.toUpperCase());
    var isWKN = /^[A-Z0-9]{6}$/.test(query.toUpperCase()) && !isISIN;

    var figiBody = [];
    if (isISIN) {
      figiBody.push({ idType: 'ID_ISIN', idValue: query.toUpperCase() });
    } else if (isWKN) {
      figiBody.push({ idType: 'ID_WERTPAPIER', idValue: query.toUpperCase() });
    } else {
      figiBody.push({ idType: 'ID_ISIN', idValue: query.toUpperCase() });
    }

    fetch('https://api.openfigi.com/v3/mapping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(figiBody)
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
      if (btn) btn.disabled = false;
      if (!data || !data[0] || !data[0].data || data[0].data.length === 0) {
        fallbackSearch(query, statusEl, resultsEl, btn);
        return;
      }
      if (statusEl) { statusEl.textContent = data[0].data.length + ' Ergebnis(se) gefunden'; statusEl.className = ''; }
      renderFigiResults(data[0].data, resultsEl);
    })
    .catch(function(err) {
      if (btn) btn.disabled = false;
      fallbackSearch(query, statusEl, resultsEl, btn);
    });
  };

  // Enter key support for search
  var searchInput = document.getElementById('wknSearchInput');
  if (searchInput) {
    searchInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') { e.preventDefault(); window.searchWKN(); }
    });
  }

  // Show recent searches on load
  updateRecentUI();

})();
