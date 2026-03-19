// ============================================
// PersoShift – Chart Beautifier (Dark) + WKN Search
// ============================================
(function() {
  'use strict';

  // ===== 1. CHART BEAUTIFIER (DARK THEME) =====
  try {
    Chart.defaults.elements.bar.borderRadius = 5;
    Chart.defaults.elements.bar.borderSkipped = false;
    Chart.defaults.elements.line.tension = 0.35;
    Chart.defaults.elements.line.borderWidth = 2.5;
    Chart.defaults.elements.point.radius = 0;
    Chart.defaults.elements.point.hoverRadius = 5;
    Chart.defaults.color = '#6b7280';
    Chart.defaults.plugins.legend.labels.usePointStyle = true;
    Chart.defaults.plugins.legend.labels.padding = 18;
    Chart.defaults.plugins.legend.labels.color = '#9ca3af';
    Chart.defaults.plugins.tooltip.backgroundColor = '#1e2736';
    Chart.defaults.plugins.tooltip.titleColor = '#e0e4eb';
    Chart.defaults.plugins.tooltip.bodyColor = '#9ca3af';
    Chart.defaults.plugins.tooltip.borderColor = '#2a3648';
    Chart.defaults.plugins.tooltip.borderWidth = 1;
    Chart.defaults.plugins.tooltip.cornerRadius = 10;
    Chart.defaults.plugins.tooltip.padding = 12;
    Chart.defaults.plugins.tooltip.usePointStyle = true;
    Chart.defaults.scale.grid.color = 'rgba(42, 54, 72, 0.5)';
    Chart.defaults.scale.grid.drawBorder = false;
    Chart.defaults.scale.ticks.color = '#6b7280';
  } catch(e) { console.warn('Chart defaults error:', e); }

  if (typeof window.calc === 'function') {
    var _origCalc = window.calc;
    window.calc = function(withTax) {
      _origCalc(withTax);
      try {
        if (window.chartMain) {
          window.chartMain.data.datasets.forEach(function(ds, i) {
            ds.borderRadius = 5;
            ds.borderSkipped = false;
            if (i === 3) {
              ds.pointRadius = 0;
              ds.pointHoverRadius = 5;
              ds.borderWidth = 2.5;
              ds.tension = 0.35;
              ds.fill = true;
              ds.backgroundColor = 'rgba(248,113,113,0.08)';
              ds.borderColor = 'rgba(248,113,113,0.6)';
            }
          });
          window.chartMain.options.animation = { duration: 600, easing: 'easeOutQuart' };
          if (window.chartMain.options.scales) {
            if (window.chartMain.options.scales.x) {
              window.chartMain.options.scales.x.grid = { display: false };
              window.chartMain.options.scales.x.ticks = Object.assign(
                window.chartMain.options.scales.x.ticks || {},
                { maxRotation: 45, autoSkip: true, maxTicksLimit: 20, color: '#6b7280' }
              );
              if (window.chartMain.options.scales.x.title) window.chartMain.options.scales.x.title.color = '#6b7280';
            }
            if (window.chartMain.options.scales.y) {
              window.chartMain.options.scales.y.grid = { color: 'rgba(42,54,72,0.5)' };
              window.chartMain.options.scales.y.ticks = Object.assign(window.chartMain.options.scales.y.ticks || {}, { color: '#6b7280' });
              if (window.chartMain.options.scales.y.title) window.chartMain.options.scales.y.title.color = '#6b7280';
            }
            if (window.chartMain.options.scales.y1) {
              window.chartMain.options.scales.y1.ticks = Object.assign(window.chartMain.options.scales.y1.ticks || {}, { color: '#6b7280' });
              if (window.chartMain.options.scales.y1.title) window.chartMain.options.scales.y1.title.color = '#6b7280';
            }
          }
          window.chartMain.update();
        }
        if (window.chartCompare) {
          window.chartCompare.data.datasets.forEach(function(ds) {
            ds.borderRadius = 8;
            ds.borderSkipped = false;
            ds.barPercentage = 0.6;
          });
          window.chartCompare.options.animation = { duration: 600, easing: 'easeOutQuart' };
          if (window.chartCompare.options.scales) {
            if (window.chartCompare.options.scales.x) {
              window.chartCompare.options.scales.x.grid = { display: false };
              window.chartCompare.options.scales.x.ticks = { color: '#6b7280' };
            }
            if (window.chartCompare.options.scales.y) {
              window.chartCompare.options.scales.y.grid = { color: 'rgba(42,54,72,0.5)' };
              window.chartCompare.options.scales.y.ticks = {
                color: '#6b7280',
                callback: function(v) {
                  if (v >= 1000000) return (v/1000000).toFixed(1)+' Mio';
                  if (v >= 1000) return (v/1000).toFixed(0)+'k';
                  return v;
                }
              };
              if (window.chartCompare.options.scales.y.title) window.chartCompare.options.scales.y.title.color = '#6b7280';
            }
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

  function escapeHtml(str) { var d = document.createElement('div'); d.textContent = str || ''; return d.innerHTML; }

  function detailItem(label, value, highlight) {
    return '<div class="wkn-detail-item"><div class="wkn-detail-label">' + escapeHtml(label) + '</div><div class="wkn-detail-value' + (highlight ? ' highlight' : '') + '">' + escapeHtml(value) + '</div></div>';
  }

  function renderFigiResults(items, container) {
    container.innerHTML = '';
    var seen = {};
    var unique = items.filter(function(item) { var k = (item.name||'')+(item.exchCode||''); if(seen[k])return false; seen[k]=true; return true; });
    unique.slice(0, 10).forEach(function(item) {
      var card = document.createElement('div');
      card.className = 'wkn-result-card';
      var title = item.name || 'Unbekannt';
      var sub = [];
      if (item.ticker) sub.push('Ticker: ' + item.ticker);
      if (item.exchCode) sub.push('Börse: ' + item.exchCode);
      if (item.securityType) sub.push(item.securityType);
      var html = '<h3>' + escapeHtml(title) + '</h3>';
      html += '<div class="wkn-subtitle">' + escapeHtml(sub.join(' · ')) + '</div>';
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
    examples.forEach(function(ex) { html += '<span class="wkn-recent-tag" style="cursor:pointer">' + ex.label + ' (' + ex.value + ')</span>'; });
    html += '</div></div>';
    container.innerHTML = html;
    container.querySelectorAll('.wkn-recent-tag').forEach(function(tag, i) {
      tag.addEventListener('click', function() {
        document.getElementById('wknSearchInput').value = examples[i].value;
        window.searchWKN();
      });
    });
  }

  function fallbackSearch(query, statusEl, resultsEl, btn) {
    fetch('https://api.openfigi.com/v3/mapping', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([{ idType: 'TICKER', idValue: query.toUpperCase(), exchCode: 'GY' }])
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (btn) btn.disabled = false;
      if (!data || !data[0] || !data[0].data || data[0].data.length === 0) {
        if (statusEl) { statusEl.textContent = 'Keine Ergebnisse für "' + query + '". Versuche eine ISIN oder WKN.'; statusEl.className = 'error'; }
        renderExampleSearches(resultsEl);
        return;
      }
      if (statusEl) { statusEl.textContent = data[0].data.length + ' Ergebnis(se)'; statusEl.className = ''; }
      renderFigiResults(data[0].data, resultsEl);
    })
    .catch(function() {
      if (btn) btn.disabled = false;
      if (statusEl) { statusEl.textContent = 'Fehler. Bitte ISIN oder WKN direkt eingeben.'; statusEl.className = 'error'; }
      renderExampleSearches(resultsEl);
    });
  }

  window.searchWKN = function() {
    var input = document.getElementById('wknSearchInput');
    var statusEl = document.getElementById('wknSearchStatus');
    var resultsEl = document.getElementById('wknSearchResults');
    var btn = document.getElementById('wknSearchBtn');
    var query = (input ? input.value : '').trim();
    if (!query) { if (statusEl) { statusEl.textContent = 'Bitte einen Suchbegriff eingeben.'; statusEl.className = 'error'; } return; }
    if (statusEl) { statusEl.textContent = 'Suche läuft...'; statusEl.className = ''; }
    if (resultsEl) resultsEl.innerHTML = '';
    if (btn) btn.disabled = true;
    addToRecent(query);

    var isISIN = /^[A-Z]{2}[A-Z0-9]{10}$/.test(query.toUpperCase());
    var isWKN = /^[A-Z0-9]{6}$/.test(query.toUpperCase()) && !isISIN;
    var body = [];
    if (isISIN) body.push({ idType: 'ID_ISIN', idValue: query.toUpperCase() });
    else if (isWKN) body.push({ idType: 'ID_WERTPAPIER', idValue: query.toUpperCase() });
    else body.push({ idType: 'ID_ISIN', idValue: query.toUpperCase() });

    fetch('https://api.openfigi.com/v3/mapping', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (btn) btn.disabled = false;
      if (!data || !data[0] || !data[0].data || data[0].data.length === 0) { fallbackSearch(query, statusEl, resultsEl, btn); return; }
      if (statusEl) { statusEl.textContent = data[0].data.length + ' Ergebnis(se)'; statusEl.className = ''; }
      renderFigiResults(data[0].data, resultsEl);
    })
    .catch(function() { if (btn) btn.disabled = false; fallbackSearch(query, statusEl, resultsEl, btn); });
  };

  var si = document.getElementById('wknSearchInput');
  if (si) si.addEventListener('keydown', function(e) { if (e.key === 'Enter') { e.preventDefault(); window.searchWKN(); } });

  updateRecentUI();
})();
