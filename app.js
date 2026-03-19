// ============================================
// PersoShift – Chart Beautifier + WKN Search + Tabs
// ============================================
(function() {
  'use strict';

  // ===== 1. TAB NAVIGATION =====
  document.querySelectorAll('.main-tab').forEach(function(tab) {
    tab.addEventListener('click', function() {
      document.querySelectorAll('.main-tab').forEach(function(t) { t.classList.remove('active-tab'); });
      document.querySelectorAll('.tab-content').forEach(function(c) { c.classList.remove('active-content'); });
      this.classList.add('active-tab');
      var target = document.getElementById(this.getAttribute('data-tab'));
      if (target) target.classList.add('active-content');
    });
  });

  // ===== 2. CHART BEAUTIFIER =====
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
  } catch(e) {}

  // Override calc to beautify charts after they're built
  var _origCalc = window.calc;
  window.calc = function(withTax) {
    _origCalc(withTax);
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
      window.chartMain.options.scales.x.grid = { display: false };
      window.chartMain.options.scales.x.ticks = { maxRotation: 45, autoSkip: true, maxTicksLimit: 20 };
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
            if (v >= 1000000) return (v/1000000).toFixed(1) + ' Mio';
            if (v >= 1000) return (v/1000).toFixed(0) + 'k';
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

  // Search using OpenFIGI API
  window.searchWKN = function() {
    var input = document.getElementById('wknSearchInput');
    var statusEl = document.getElementById('wknSearchStatus');
    var resultsEl = document.getElementById('wknSearchResults');
    var query = (input.value || '').trim();
    var btn = document.getElementById('wknSearchBtn');

    if (!query) { statusEl.textContent = 'Bitte einen Suchbegriff eingeben.'; statusEl.className = 'error'; return; }

    statusEl.textContent = 'Suche läuft...';
    statusEl.className = '';
    resultsEl.innerHTML = '';
    btn.disabled = true;
    addToRecent(query);

    // Detect input type
    var isISIN = /^[A-Z]{2}[A-Z0-9]{10}$/.test(query.toUpperCase());
    var isWKN = /^[A-Z0-9]{6}$/.test(query.toUpperCase()) && !isISIN;

    // Build OpenFIGI request
    var figiBody = [];
    if (isISIN) {
      figiBody.push({ idType: 'ID_ISIN', idValue: query.toUpperCase() });
    } else if (isWKN) {
      figiBody.push({ idType: 'ID_WERTPAPIER', idValue: query.toUpperCase() });
    } else {
      // Text search - try multiple approaches
      figiBody.push({ idType: 'ID_ISIN', idValue: query.toUpperCase() });
    }

    fetch('https://api.openfigi.com/v3/mapping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(figiBody)
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
      btn.disabled = false;
      if (!data || !data[0] || !data[0].data || data[0].data.length === 0) {
        // Fallback: try text search via ticker
        return fallbackSearch(query, statusEl, resultsEl, btn);
      }
      statusEl.textContent = data[0].data.length + ' Ergebnis(se) gefunden';
      renderFigiResults(data[0].data, resultsEl);
    })
    .catch(function() {
      btn.disabled = false;
      return fallbackSearch(query, statusEl, resultsEl, btn);
    });
  };

  function fallbackSearch(query, statusEl, resultsEl, btn) {
    // Try as ticker symbol
    var body = [{ idType: 'TICKER', idValue: query.toUpperCase(), exchCode: 'GY' }]; // German exchange
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
      renderFigiResults(data[0].data, resultsEl);
    })
    .catch(function() {
      btn.disabled = false;
      statusEl.textContent = 'Fehler bei der Suche. Bitte versuche eine ISIN oder WKN direkt.';
      statusEl.className = 'error';
      renderExampleSearches(resultsEl);
    });
  }

  function renderFigiResults(items, container) {
    container.innerHTML = '';
    // Deduplicate by name
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
    container.innerHTML = '<div class="wkn-result-card" style="text-align:center">' +
      '<h3 style="font-size:1.1rem">Beliebte Wertpapiere zum Ausprobieren</h3>' +
      '<div class="wkn-recent-list" style="justify-content:center;margin-top:0.75rem">' +
      exampleTag('IE00B4L5Y983', 'MSCI World') +
      exampleTag('IE00B5BMR087', 'S&P 500') +
      exampleTag('IE00BKM4GZ66', 'EM IMI') +
      exampleTag('A0RPWH', 'MSCI World (WKN)') +
      exampleTag('IE00B3RBWM25', 'FTSE All-World') +
      '</div></div>';
  }

  function exampleTag(value, label) {
    return '<span class="wkn-recent-tag" onclick="document.getElementById(\'wknSearchInput\').value=\'' + value + '\';searchWKN()">' + label + ' (' + value + ')</span>';
  }

  function detailItem(label, value, highlight) {
    return '<div class="wkn-detail-item"><div class="wkn-detail-label">' + escapeHtml(label) + '</div><div class="wkn-detail-value' + (highlight ? ' highlight' : '') + '">' + escapeHtml(value) + '</div></div>';
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  // Enter key support
  var searchInput = document.getElementById('wknSearchInput');
  if (searchInput) {
    searchInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') { e.preventDefault(); searchWKN(); }
    });
  }

  // Show recent searches on load
  updateRecentUI();

})();

<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <title>PersoShift ETF‑Rechner</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="preconnect" href="https://fonts.gstatic.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    :root{--bg:#f9f9fa;--card-bg:#fff;--primary:#4A90E2;--primary-hover:#357ABD;--text:#333;--muted:#666;--border:#e0e0e0;--danger:#e74c3c;--success:#2ecc71;--payout-color-annual:rgba(39,174,96,0.8);--info-bg:#eef6ff;--secondary-btn-bg:#7f8c8d;--secondary-btn-hover-bg:#6c7a7d;--capital-color:#3498DB;--gain-color:#F39C12;--tax-color-diagram:rgba(231,76,60,0.8)}*,*::before,*::after{box-sizing:border-box}body{margin:0;background-color:var(--bg);color:var(--text);font-family:'Inter',sans-serif;line-height:1.6;font-size:16px}.container{max-width:800px;margin:1rem auto;padding:0 1rem}.main-headline{text-align:center;font-size:2.5rem;margin-bottom:1rem;color:var(--primary);font-weight:700}
    .main-tabs{display:flex;justify-content:center;gap:0;margin-bottom:1.5rem;border-bottom:2px solid var(--border)}.main-tab{padding:0.75rem 1.5rem;font-weight:600;font-size:0.95rem;border:none;background:none;color:var(--muted);cursor:pointer;border-bottom:3px solid transparent;margin-bottom:-2px;transition:all 0.2s;font-family:inherit}.main-tab:hover{color:var(--primary)}.main-tab.active-tab{color:var(--primary);border-bottom-color:var(--primary)}.tab-content{display:none}.tab-content.active-content{display:block}
    .wkn-search-box{display:flex;gap:0.75rem;margin-bottom:1.5rem;flex-wrap:wrap}.wkn-search-box input{flex:1;min-width:200px;padding:0.75rem 1rem;font-size:1rem;border:1.5px solid var(--border);border-radius:10px;font-family:inherit;transition:border-color 0.2s,box-shadow 0.2s}.wkn-search-box input:focus{border-color:var(--primary);outline:none;box-shadow:0 0 0 3px rgba(74,144,226,0.15)}.wkn-search-box button{padding:0.75rem 1.5rem;font-size:0.95rem;font-weight:600;color:#fff;background:var(--primary);border:none;border-radius:10px;cursor:pointer;font-family:inherit;transition:background 0.2s}.wkn-search-box button:hover{background:var(--primary-hover)}.wkn-search-box button:disabled{opacity:0.6;cursor:not-allowed}#wknSearchStatus{text-align:center;color:var(--muted);font-size:0.9rem;margin:1rem 0}#wknSearchStatus.error{color:var(--danger)}
    .wkn-result-card{background:var(--card-bg);border-radius:12px;box-shadow:0 4px 16px rgba(0,0,0,0.08);padding:1.5rem;margin-bottom:1rem;border:1px solid var(--border)}.wkn-result-card h3{text-align:left;margin:0 0 0.25rem;font-size:1.3rem;color:var(--text)}.wkn-result-card .wkn-subtitle{color:var(--muted);font-size:0.88rem;margin-bottom:1rem}.wkn-details-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:0.75rem}.wkn-detail-item{background:var(--bg);border-radius:8px;padding:0.75rem}.wkn-detail-label{font-size:0.75rem;color:var(--muted);text-transform:uppercase;letter-spacing:0.03em;font-weight:600;margin-bottom:0.2rem}.wkn-detail-value{font-size:1rem;font-weight:600;color:var(--text)}.wkn-detail-value.highlight{color:var(--primary)}
    .wkn-recent-searches{margin-top:1.5rem}.wkn-recent-searches h4{font-size:0.9rem;color:var(--muted);margin-bottom:0.5rem;font-weight:500}.wkn-recent-list{display:flex;gap:0.5rem;flex-wrap:wrap}.wkn-recent-tag{background:var(--info-bg);border:1px solid var(--border);border-radius:20px;padding:0.3rem 0.8rem;font-size:0.82rem;cursor:pointer;color:var(--primary);font-weight:500;transition:all 0.2s}.wkn-recent-tag:hover{background:var(--primary);color:#fff;border-color:var(--primary)}
    .top-info-section{background-color:var(--card-bg);padding:1.5rem;border-radius:12px;box-shadow:0 4px 16px rgba(0,0,0,0.08);margin-bottom:2rem}.top-info-section h2{font-size:1.5rem;color:var(--primary);margin-top:0;margin-bottom:1rem;display:flex;align-items:center}.top-info-section .toggle-button{background-color:var(--primary);color:white;border:none;padding:0.5rem 1rem;border-radius:8px;cursor:pointer;font-size:0.9rem;font-weight:600;transition:background-color 0.3s;margin-top:1rem}.top-info-section .toggle-button:hover{background-color:var(--primary-hover)}.top-info-content{display:none;margin-top:1rem;font-size:0.95rem;line-height:1.7}.top-info-content h3,.top-info-content h4{font-size:1.2rem;color:var(--text);margin-top:1.5rem;margin-bottom:0.5rem}.top-info-content p,.top-info-content ul{margin-bottom:1rem}.top-info-content ul{padding-left:20px;list-style-position:inside}.top-info-content li{margin-bottom:0.5rem}.top-info-content strong{font-weight:600}.top-info-content .highlight{color:var(--success);font-weight:600}.top-info-content .warning{color:var(--danger);font-weight:600}.top-info-content .sub-list{padding-left:20px;margin-top:0.5rem}.top-info-content .sub-list li{font-size:0.9em}.point-toggle{background:none;border:none;text-align:left;padding:0;font-size:1.2rem;font-weight:600;color:var(--text);cursor:pointer;width:100%}.point-toggle::after{content:' ▼';font-size:0.8em}.point-toggle.open::after{content:' ▲'}.point-details{display:none;padding-left:1rem;border-left:2px solid var(--border);margin-top:1rem}
    h1{text-align:center;font-size:2.2rem;margin-bottom:0.5rem;margin-top:2rem;color:var(--primary)}.card{background:var(--card-bg);padding:2rem;border-radius:12px;box-shadow:0 4px 16px rgba(0,0,0,0.1);margin-bottom:2rem}label{display:block;margin:0.75rem 0 0.25rem;font-size:1rem;color:var(--text);font-weight:500}.label-group{display:flex;align-items:center;gap:0.5rem}input[type="number"],select,input[type="checkbox"]{width:100%;padding:0.7rem;font-size:1rem;border:1px solid var(--border);border-radius:8px;transition:border-color 0.3s;background-color:#fdfdff}input[type="checkbox"]{width:auto;height:auto;margin-right:0.5rem;vertical-align:middle}input:focus,select:focus{border-color:var(--primary);outline:none;box-shadow:0 0 0 3px rgba(74,144,226,0.25)}.row{display:flex;flex-wrap:wrap;gap:1rem;margin-top:0.5rem;align-items:flex-end}.row>*{flex:1;min-width:130px}.btn-group{display:flex;gap:1rem;margin-top:0.5rem}.btn{display:block;width:100%;padding:0.8rem;margin:0;font-size:1.05rem;font-weight:600;color:#fff;background:var(--primary);border:none;border-radius:8px;cursor:pointer;transition:background 0.3s}.btn:hover{background:var(--primary-hover)}.btn.active-calc-btn{background-color:var(--primary-hover);box-shadow:inset 0 2px 4px rgba(0,0,0,0.2)}.btn-secondary{background-color:var(--secondary-btn-bg)}.btn-secondary:hover{background-color:var(--secondary-btn-hover-bg)}.tax-note-container{display:flex;align-items:center;justify-content:center;gap:0.5rem;margin-top:0.5rem;margin-bottom:1rem}.tax-note{font-size:0.85rem;color:var(--muted);text-align:center;margin:0}#advToggle{display:block;margin:1.5rem 0 1rem;font-size:1rem;font-weight:600;color:var(--primary);cursor:pointer;text-align:left}#advanced{display:none;background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:1.5rem;margin-bottom:1rem;margin-top:0.5rem}#warn{color:var(--danger);font-size:0.95rem;min-height:1.2em;margin-top:0.5rem;text-align:center;font-weight:500}.headline-container{background-color:var(--info-bg);padding:1rem;border-radius:8px;margin-bottom:1rem}.headline-item{margin-bottom:0.4rem;font-size:1.05rem;display:flex;justify-content:space-between;align-items:center}.headline-label{color:var(--muted)}.headline-value{font-weight:600;color:var(--primary)}.headline-sub-value{color:var(--text);font-weight:500}.headline-item .info-btn{margin-left:8px}h3{text-align:center;margin-top:2.5rem;font-size:1.6rem;color:var(--text)}canvas{display:block;width:100%!important;max-width:800px;height:auto!important;aspect-ratio:16/10;max-height:500px;margin:0 auto 1.5rem;background:var(--card-bg);border-radius:12px;box-shadow:0 4px 16px rgba(0,0,0,0.05)}.interest-rate-group{display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap}.interest-rate-group select{flex:2 1 150px}.interest-rate-group input[type="number"]{flex:1 1 100px}.info-button-group{display:flex;align-items:center;gap:0.5rem;margin-top:0.25rem;flex-wrap:wrap}.info-btn{background-color:var(--muted);color:white;border:none;border-radius:50%;width:22px;height:22px;font-size:0.8rem;line-height:22px;text-align:center;cursor:pointer;transition:background-color 0.2s;font-weight:bold;padding:0;display:inline-flex;justify-content:center;align-items:center}.info-btn:hover{background-color:var(--primary)}.info-btn-label{font-size:0.9rem;color:var(--muted)}.add-btn{background-color:var(--success);color:white;border:none;border-radius:50%;width:32px;height:32px;font-size:1.3rem;line-height:32px;text-align:center;cursor:pointer;margin-top:0.5rem;padding:0;transition:background-color 0.2s}.add-btn:hover{background-color:#27ae60}.remove-btn{background-color:var(--danger);color:white;border:none;border-radius:4px;padding:0.4rem 0.7rem;font-size:0.85rem;cursor:pointer;height:fit-content;align-self:center;margin-left:0.5rem}.remove-btn:hover{background-color:#c0392b}.dynamic-entry-row{margin-top:0.75rem;padding-top:0.75rem;border-top:1px dashed var(--border);display:flex;gap:0.5rem;align-items:flex-end}.dynamic-entry-row>div{flex:1}.inline-label{display:inline;margin-left:0.25rem;font-weight:normal}.form-group{margin-bottom:1.5rem;padding-bottom:1.5rem;border-bottom:1px solid var(--border)}.form-group:last-child{border-bottom:none;margin-bottom:0;padding-bottom:0}.chart-controls{display:flex;justify-content:flex-end;align-items:center;margin-bottom:0.5rem;font-size:0.9rem}.chart-controls label{margin:0 0.5rem 0 0;font-weight:normal}.mode-buttons{display:flex;justify-content:center;gap:1rem;margin:1rem 0}.mode-btn{padding:0.5rem 1rem;font-weight:600;border:none;border-radius:8px;cursor:pointer;background:var(--secondary-btn-bg);color:#fff}.mode-btn:hover{background:var(--secondary-btn-hover-bg)}.active-mode-btn{background:var(--primary)}#historicalOptions{margin-bottom:1rem}footer{text-align:center;font-size:0.8rem;color:var(--muted);margin-top:2rem}footer a{color:var(--primary)}.compare-options{display:flex;justify-content:center;gap:1rem;flex-wrap:wrap;margin-bottom:0.5rem;font-size:0.9rem}.compare-options label{display:flex;align-items:center;gap:0.25rem}.compare-options .legend-color{width:12px;height:12px;display:inline-block;border-radius:2px}.modal{display:none;position:fixed;z-index:1000;left:0;top:0;width:100%;height:100%;overflow:auto;background-color:rgba(0,0,0,0.5);align-items:center;justify-content:center}.modal-content{background-color:var(--card-bg);margin:auto;padding:25px;border-radius:12px;width:90%;max-width:650px;box-shadow:0 5px 20px rgba(0,0,0,0.2);position:relative;animation:fadeInModal 0.3s ease-out}@keyframes fadeInModal{from{opacity:0;transform:translateY(-20px)}to{opacity:1;transform:translateY(0)}}.modal-close{color:var(--muted);float:right;font-size:2rem;font-weight:bold;line-height:1;cursor:pointer;transition:color 0.2s}.modal-close:hover,.modal-close:focus{color:var(--danger);text-decoration:none}.modal h2{font-size:1.5rem;color:var(--primary);margin-top:0;margin-bottom:1rem}.modal p,.modal ul{font-size:0.95rem;line-height:1.7;color:var(--text);margin-bottom:1rem}.modal ul{padding-left:20px}.modal li{margin-bottom:0.5rem}.modal strong{font-weight:600}.modal pre{white-space:pre-wrap;background-color:var(--bg);padding:1rem;border-radius:8px;font-size:0.9rem}
  </style>
  <link rel="stylesheet" href="style.css">
</head>
<body>
<div class="container">
  <h1 class="main-headline">PersoShift dein Helfer für Persönliche Entwicklung</h1>
  <nav class="main-tabs">
    <button class="main-tab active-tab" data-tab="tab-rechner">📊 ETF-Rechner</button>
    <button class="main-tab" data-tab="tab-wkn">🔍 WKN / ISIN Suche</button>
  </nav>
  <div id="tab-rechner" class="tab-content active-content">
    <div class="top-info-section"><h2>💼 Warum investieren?</h2><div id="whyInvestContent" class="top-info-content"></div><button id="toggleWhyInvestBtn" class="toggle-button">Mehr erfahren</button></div>
    <div id="modeButtons" class="mode-buttons"><button id="btnHistorical" class="mode-btn">Historische Entwicklung</button><button id="btnCalculator" class="mode-btn active-mode-btn">ETF Sparplan-Rechner</button></div>
    <div id="historicalOptions" style="display:none;margin-bottom:1rem"><div class="row"><div><label for="assetSelect">Startpreis</label><select id="assetSelect"><option value="gold">Gold</option><option value="msci">MSCI World</option><option value="bitcoin">Bitcoin</option></select></div><div><label for="assetStartYear">Ab Jahr</label><input type="number" id="assetStartYear" value="2015" min="2000"></div></div></div>
    <div class="card">
      <label for="start">Startkapital (€)</label><input id="start" type="number" value="0" min="0">
      <div class="row"><div style="flex:2"><div class="label-group"><label for="rate">Monatsrate (€)</label><button type="button" class="info-btn" data-modal-target="modalMonthlyRate" title="Wieviel soll ich investieren?">?</button></div><input id="rate" type="number" value="100" min="0"></div><div style="flex:1"><label for="currency">Währung</label><select id="currency"><option value="EUR" selected>Euro (EUR)</option><option value="USD">US-Dollar (USD)</option><option value="JPY">Japanischer Yen (JPY)</option><option value="GBP">Britisches Pfund (GBP)</option><option value="AUD">Australischer Dollar (AUD)</option></select></div></div>
      <div class="row"><div style="flex:2"><label for="years">Laufzeit (Jahre)</label><input id="years" type="number" value="40" min="1"></div><div style="flex:1"><label for="startCalendarYear">Start-Kalenderjahr</label><input type="number" id="startCalendarYear" value="" placeholder="z.B. 2025"></div></div>
      <div><label for="interestRatePreset">Jahresrendite (%)</label><div class="interest-rate-group"><select id="interestRatePreset"><option value="10">Optimistisch 10%</option><option value="7.6">Realistisch 7,6%</option><option value="5">Pessimistisch 5%</option><option value="custom">Benutzerdefiniert</option></select><input type="number" id="interestCustom" step="0.1" min="0" style="display:none" placeholder="z.B. 6.5"></div><div class="info-button-group"><span class="info-btn-label">S&P500</span><button type="button" class="info-btn" data-modal-target="modalSP500" title="Was ist der S&P 500?">?</button><span class="info-btn-label" style="margin-left:10px">MSCI World</span><button type="button" class="info-btn" data-modal-target="modalMSCIWorld" title="Was ist der MSCI World?">?</button></div></div>
      <div class="form-group" style="margin-top:1rem;padding-top:1rem;border-top:1px solid var(--border)"><div class="row"><div><div class="label-group"><label for="etfType">ETF-Typ:</label><button type="button" class="info-btn" data-modal-target="modalEtfTypeInfo" title="ETF-Typen Erklärung">?</button></div><select id="etfType"><option value="thesaurierend" selected>Thesaurierend</option><option value="ausschuettend">Ausschüttend</option></select></div><div><div class="label-group"><label for="basiszins">Basiszins p.a. (%):</label><button type="button" class="info-btn" data-modal-target="modalBasiszinsInfo" title="Was ist der Basiszins?">?</button></div><input type="number" id="basiszins" value="2.29" step="0.01" min="0"></div></div><div class="row"><div><div class="label-group"><label for="freibetrag">Jährlicher Freibetrag (€):</label><button type="button" class="info-btn" data-modal-target="modalFreibetragInfo" title="Info zum Freibetrag">?</button></div><input type="number" id="freibetrag" value="1000" min="0"></div><div><div class="label-group"><label for="steuerSatz">Steuersatz (inkl. Soli %):</label><button type="button" class="info-btn" data-modal-target="modalSteuersatzInfo" title="Info zum Steuersatz">?</button></div><input type="number" id="steuerSatz" value="26.375" step="0.001" min="0"></div></div></div>
      <div id="advToggle">Erweiterte Optionen ▼</div>
      <div id="advanced">
        <div class="form-group"><h4 style="margin-bottom:0.5rem;margin-top:0;font-weight:600;color:var(--primary)">Anpassung Monatsrate</h4><div class="row"><div><label for="monthlyRateIncrease">Monatsrate um x % p.a. erhöhen</label><input id="monthlyRateIncrease" type="number" value="0" step="0.1" min="0"></div><div><input type="checkbox" id="stopMonthlyRateEnable"><label for="stopMonthlyRateEnable" class="inline-label">Monatsrate beenden?</label><div id="stopMonthlyRateYearContainer" style="display:none;margin-top:0.5rem"><label for="stopMonthlyRateYear" style="font-size:0.9rem">Monatsrate stoppen ab Jahr (Laufjahr):</label><input type="number" id="stopMonthlyRateYear" min="1" value="10"></div></div></div></div>
        <div class="form-group"><h4 style="margin-bottom:0.5rem;margin-top:0;font-weight:600;color:var(--primary)">Einmalzahlungen</h4><div id="lumpsumEntriesContainer"><div class="row main-entry-row"><div><label for="lumpsum">Einmalige Einzahlung (€)</label><input id="lumpsum" type="number" value="0" min="0" class="lumpsum-amount"></div><div><label for="lumpyear">Einmalige Einzahlung im Jahr (Laufjahr):</label><input id="lumpyear" type="number" value="1" min="1" class="lumpsum-year"></div></div></div><button type="button" id="addLumpsumBtn" class="add-btn">+</button> <small>Weitere Einmalzahlung hinzufügen</small></div>
        <div class="form-group"><h4 style="margin-bottom:0.5rem;margin-top:0;font-weight:600;color:var(--primary)">Datums-Eingabeart für Auszahlungen</h4><div class="row"><div><div class="label-group"><label for="payoutYearType">Jahr-Typ für Auszahlungen:</label><button type="button" class="info-btn" data-modal-target="modalDateTypeInfo" title="Laufjahr vs. Kalenderjahr">?</button></div><select id="payoutYearType"><option value="laufjahr" selected>Laufjahr</option><option value="kalenderjahr">Kalenderjahr</option></select></div></div></div>
        <div class="form-group"><h4 style="margin-bottom:0.5rem;margin-top:0;font-weight:600;color:var(--primary)">Auszahlungen</h4><div id="oneTimePayoutEntriesContainer"><div class="row main-entry-row"><div><label>Einmalige Auszahlung (€)</label><input id="payout" type="number" value="0" min="0" class="payout-amount"></div><div><label>Auszahlung im Jahr:</label><input id="payoutYear" type="number" value="1" min="1" class="payout-year" placeholder="Jahr"></div></div></div><button type="button" id="addOneTimePayoutBtn" class="add-btn">+</button> <small>Weitere einmalige Auszahlung hinzufügen</small><div class="row" style="margin-top:1.5rem"><div><label for="payoutPlanAmount">Auszahlplan Betrag (€)</label><input id="payoutPlanAmount" type="number" value="0" min="0"></div></div><div class="row"><div><label for="payoutStartYear">Auszahlplan: Ab Jahr (Laufjahr)</label><input id="payoutStartYear" type="number" value="1" min="1"></div><div><label for="payoutInterval">Auszahlplan: Intervall</label><select id="payoutInterval"><option value="monthly">Monatlich</option><option value="yearly">Jährlich</option><option value="custom">Eigenes Intervall</option></select></div><div><label for="payoutIntervalDays">Auszahlintervall (Tage)</label><input id="payoutIntervalDays" type="number" placeholder="Tage" disabled></div></div></div>
      </div>
      <button id="resetBtn" class="btn btn-secondary" style="margin-bottom:0.75rem">Alle Werte zurücksetzen</button>
      <div class="btn-group"><button class="btn active-calc-btn" onclick="calc(false)">Berechnen (Brutto)</button><button class="btn" onclick="calc(true)">Berechnen (Netto)</button></div>
      <div class="tax-note-container"><p class="tax-note">Nettoberechnung abzgl. <span id="taxRateDisplay">26.375</span>% Kapitalertragsteuer + Soli (DE).</p><button type="button" class="info-btn" data-modal-target="modalTaxInfo" title="Steuerdetails">?</button></div>
      <div id="warn"></div>
    </div>
    <div id="headline" class="headline-container"></div>
    <div class="chart-controls"><label for="chartAxisToggle">Diagramm-Achse: Kalenderjahre</label><input type="checkbox" id="chartAxisToggle"></div>
    <canvas id="chart"></canvas>
    <h3 id="compareChartTitle">Vergleich (Gesamtwertentwicklung)</h3>
    <div class="compare-options"><label><input type="checkbox" class="asset-toggle" value="etf" checked><span class="legend-color" style="background-color:rgba(46,204,113,0.8)"></span> ETF</label><label><input type="checkbox" class="asset-toggle" value="tagesgeld" checked><span class="legend-color" style="background-color:rgba(52,152,219,0.8)"></span> Tagesgeld 2%</label><label><input type="checkbox" class="asset-toggle" value="bank" checked><span class="legend-color" style="background-color:rgba(149,165,166,0.8)"></span> Bank 0%</label><label><input type="checkbox" class="asset-toggle" value="bitcoin"><span class="legend-color" style="background-color:rgba(247,147,26,0.8)"></span> Bitcoin</label><label><input type="checkbox" class="asset-toggle" value="ethereum"><span class="legend-color" style="background-color:rgba(98,126,234,0.8)"></span> Ethereum</label></div>
    <canvas id="compare"></canvas>
  </div>
  <div id="tab-wkn" class="tab-content">
    <div class="card">
      <h2 style="margin-top:0;color:var(--primary)">🔍 Wertpapier-Suche</h2>
      <p style="color:var(--muted);margin-bottom:1rem">Suche nach WKN, ISIN oder Wertpapiername um Details und Kursinformationen zu finden.</p>
      <div class="wkn-search-box"><input type="text" id="wknSearchInput" placeholder="z.B. A0RPWH, IE00B4L5Y983 oder MSCI World..." autocomplete="off"><button id="wknSearchBtn" onclick="searchWKN()">Suchen</button></div>
      <div id="wknSearchStatus"></div>
      <div id="wknSearchResults"></div>
      <div id="wknRecentSearches" class="wkn-recent-searches" style="display:none"><h4>Letzte Suchen</h4><div id="wknRecentList" class="wkn-recent-list"></div></div>
    </div>
  </div>
</div>
<div id="infoModal" class="modal"><div class="modal-content"><span class="modal-close" data-close-modal>&times;</span><h2 id="modalTitle">Info Titel</h2><div id="modalBody"><p>Info Inhalt hier...</p></div></div></div>
<script>
let chartMain,chartCompare;const DEFAULT_MONTHLY_RATE=100,DEFAULT_YEARS=40,DEFAULT_INTEREST_PRESET="7.6",DEFAULT_FREIBETRAG=1000,DEFAULT_STEUERSATZ=26.375,DEFAULT_ETF_TYPE="thesaurierend",DEFAULT_BASISZINS=2.29,DEFAULT_RATE_INCREASE=0,DEFAULT_CURRENCY='EUR';let currentMode='compare',loadedHistoricalRates=[];const CAPITAL_COLOR='rgba(52,152,219,0.8)',GAIN_COLOR='rgba(243,156,18,0.8)',ANNUAL_PAYOUT_COLOR='rgba(39,174,96,0.8)',TAX_COLOR_DIAGRAM='rgba(231,76,60,0.7)',COMPARE_COLORS={etf:'rgba(46,204,113,0.8)',tagesgeld:'rgba(52,152,219,0.8)',bank:'rgba(149,165,166,0.8)',bitcoin:'rgba(247,147,26,0.8)',ethereum:'rgba(98,126,234,0.8)'};Chart.defaults.font.family='Inter, sans-serif';Chart.defaults.font.size=13;Chart.defaults.plugins.legend.position='bottom';Chart.defaults.maintainAspectRatio=false;Chart.defaults.responsive=true;const advToggle=document.getElementById('advToggle'),advBox=document.getElementById('advanced'),currencyEl=document.getElementById('currency');const fmt=(n,currency='EUR')=>{let locale='de-DE';if(currency==='USD')locale='en-US';if(currency==='GBP')locale='en-GB';if(currency==='JPY')locale='ja-JP';if(currency==='AUD')locale='en-AU';return n.toLocaleString(locale,{style:'currency',currency:currency,maximumFractionDigits:0})};const rateEl=document.getElementById('rate'),monthlyRateIncreaseEl=document.getElementById('monthlyRateIncrease'),yearsEl=document.getElementById('years'),startCalendarYearEl=document.getElementById('startCalendarYear'),interestRatePresetEl=document.getElementById('interestRatePreset'),interestCustomEl=document.getElementById('interestCustom'),startEl=document.getElementById('start'),warnEl=document.getElementById('warn'),headlineEl=document.getElementById('headline'),compareChartTitleEl=document.getElementById('compareChartTitle'),etfTypeEl=document.getElementById('etfType'),freibetragEl=document.getElementById('freibetrag'),steuerSatzEl=document.getElementById('steuerSatz'),basiszinsEl=document.getElementById('basiszins'),taxRateDisplayEl=document.getElementById('taxRateDisplay'),payoutYearTypeEl=document.getElementById('payoutYearType'),stopMonthlyRateEnableEl=document.getElementById('stopMonthlyRateEnable'),stopMonthlyRateYearContainerEl=document.getElementById('stopMonthlyRateYearContainer'),stopMonthlyRateYearEl=document.getElementById('stopMonthlyRateYear'),payoutPlanAmountEl=document.getElementById('payoutPlanAmount'),payoutStartYearEl=document.getElementById('payoutStartYear'),payoutIntervalEl=document.getElementById('payoutInterval'),payoutIntervalDaysEl=document.getElementById('payoutIntervalDays'),lumpsumEntriesContainer=document.getElementById('lumpsumEntriesContainer'),oneTimePayoutEntriesContainer=document.getElementById('oneTimePayoutEntriesContainer'),infoModal=document.getElementById('infoModal'),modalTitleEl=document.getElementById('modalTitle'),modalBodyEl=document.getElementById('modalBody'),modalCloseBtns=document.querySelectorAll('[data-close-modal]'),resetBtn=document.getElementById('resetBtn'),chartAxisToggleEl=document.getElementById('chartAxisToggle'),btnCalcMode=document.getElementById('btnCalculator'),btnHistoricalMode=document.getElementById('btnHistorical'),historicalOptionsEl=document.getElementById('historicalOptions'),assetSelectEl=document.getElementById('assetSelect'),assetStartYearEl=document.getElementById('assetStartYear'),toggleWhyInvestBtn=document.getElementById('toggleWhyInvestBtn'),whyInvestContent=document.getElementById('whyInvestContent'),assetToggleEls=document.querySelectorAll('.asset-toggle');
const modalData={modalSP500:{title:"Was ist der S&P 500?",content:'<p>Der S&P 500 bildet die 500 größten US-Unternehmen ab.</p><p>Historisch ca. <strong>10%/Jahr</strong> vor Inflation.</p><p>ETF: iShares Core S&P 500 (<strong>IE00B5BMR087</strong>)</p>'},modalMSCIWorld:{title:"Was ist der MSCI World?",content:'<p>Ca. 1.500 Unternehmen aus 23 Industrieländern.</p><p>Ca. <strong>7-9%/Jahr</strong> vor Inflation.</p><p>ETF: iShares Core MSCI World (<strong>IE00B4L5Y983</strong>)</p>'},modalMonthlyRate:{title:"Wieviel investieren?",content:'<p><strong>Regelmäßigkeit schlägt Höhe.</strong></p><p>Faustregel: <strong>10-15% des Nettoeinkommens</strong>.</p>'},modalTaxInfo:{title:"Kapitalertragsteuer",content:'<p><strong>26,375%</strong> = 25% Abgeltungsteuer + 1,375% Soli.</p><p>Sparer-Pauschbetrag: 1.000 € pro Person.</p>'},modalEtfTypeInfo:{title:"Thesaurierend vs. Ausschüttend",content:'<h4>Thesaurierend:</h4><p>Erträge werden wiederangelegt. Vorabpauschale.</p><h4>Ausschüttend:</h4><p>Erträge werden ausgezahlt und versteuert.</p>'},modalBasiszinsInfo:{title:"Basiszins",content:'<p>Formel: Fondswert × Basiszins × 0,7</p><p>2024: <strong>2,29%</strong></p>'},modalVerkaufsteuerInfo:{title:"Verkaufsteuer",content:'<p>Schätzung bei Depot-Verkauf am Laufzeitende.</p>'},modalFreibetragInfo:{title:"Freibetrag",content:'<ul><li>Einzelpersonen: <strong>1.000 €/Jahr</strong></li><li>Zusammenveranlagte: <strong>2.000 €/Jahr</strong></li></ul>'},modalSteuersatzInfo:{title:"Steuersatz",content:'<p><strong>26,375%</strong> (25% + Soli). Bei Kirchensteuer höher.</p>'},modalDateTypeInfo:{title:"Laufjahr vs. Kalenderjahr",content:'<p><strong>Laufjahr:</strong> Jahr 5 = 5. Jahr nach Start.</p><p><strong>Kalenderjahr:</strong> z.B. 2035.</p>'}};
function openModal(t){const d=modalData[t];if(d&&infoModal){modalTitleEl.textContent=d.title;modalBodyEl.innerHTML=d.content;infoModal.style.display='flex'}}function closeModal(){if(infoModal)infoModal.style.display='none'}document.querySelectorAll('[data-modal-target]').forEach(b=>b.addEventListener('click',()=>openModal(b.getAttribute('data-modal-target'))));modalCloseBtns.forEach(b=>b.addEventListener('click',closeModal));window.addEventListener('click',e=>{if(e.target===infoModal)closeModal()});
function updateWhyInvestContent(){const c='EUR';let b=0,r=0.07;for(let i=0;i<480;i++){b+=100;b*=(1+r/12)}const td=48000,fv=b,mn=((fv*r)/12)*(1-0.26375),ra=r/12,na=240,ma=fv*(ra*Math.pow(1+ra,na))/(Math.pow(1+ra,na)-1),ff=(Math.pow(1+ra,na)-1)/ra,rs=fv/ff;let b5=50000;for(let i=0;i<240;i++){b5+=100;b5*=(1+r/12)}whyInvestContent.innerHTML='<div class="info-point"><p>Gesetzliche Rente reicht oft nicht.</p><button class="point-toggle" data-target="details-1">1. Die Rentenlücke</button><div id="details-1" class="point-details"><ul><li>Bruttorente: ca. 1.415 €</li><li>Netto: ca. 1.050-1.150 €</li><li>Kaufkraft: <strong class="warning">nur 650-750 €</strong></li></ul></div></div><div class="info-point"><p>Zinseszins wirkt über Zeit.</p><button class="point-toggle" data-target="details-2">2. 100 €/Monat über 40 Jahre</button><div id="details-2" class="point-details"><ul><li>Einzahlung: '+fmt(td,c)+'</li><li>Depot (7%): <strong class="highlight">'+fmt(fv,c)+'</strong></li></ul></div></div><div class="info-point"><button class="point-toggle" data-target="details-3">3. Was bringt das?</button><div id="details-3" class="point-details"><ul><li>Monatl. Nettozins: <strong class="highlight">'+fmt(mn,c)+'</strong></li><li>Oder Entnahme (20J): <strong class="highlight">'+fmt(ma,c)+'</strong></li></ul></div></div><div class="info-point"><button class="point-toggle" data-target="details-4">4. Späterer Einstieg</button><div id="details-4" class="point-details"><ul><li>Sparrate für Ziel in 20J: <strong class="highlight">'+fmt(rs,c)+'</strong></li><li>50k+100€ nach 20J: <strong class="highlight">'+fmt(b5,c)+'</strong></li></ul></div></div>'}
if(toggleWhyInvestBtn&&whyInvestContent){toggleWhyInvestBtn.addEventListener('click',()=>{const h=whyInvestContent.style.display==='none'||whyInvestContent.style.display==='';if(h){updateWhyInvestContent();whyInvestContent.style.display='block'}else{whyInvestContent.style.display='none'}toggleWhyInvestBtn.textContent=h?'Weniger anzeigen':'Mehr erfahren'});whyInvestContent.addEventListener('click',function(e){if(e.target.classList.contains('point-toggle')){const d=document.getElementById(e.target.dataset.target);if(d){e.target.classList.toggle('open');d.style.display=d.style.display==='block'?'none':'block'}}})}
const labelTexts={start:'Startkapital',rate:'Monatsrate',freibetrag:'Jährlicher Freibetrag',lumpsum:'Einmalige Einzahlung',payout:'Einmalige Auszahlung',payoutPlanAmount:'Auszahlplan Betrag'};function updateCurrencyLabels(cc){const sm={EUR:'€',USD:'$',JPY:'¥',GBP:'£',AUD:'A$'},s=sm[cc]||cc;for(const f in labelTexts){const l=document.querySelector('label[for="'+f+'"]');if(l)l.textContent=labelTexts[f]+' ('+s+')'}}
advToggle.onclick=()=>{const o=advBox.style.display==='block';advBox.style.display=o?'none':'block';advToggle.textContent=o?'Erweiterte Optionen ▼':'Erweiterte Optionen ▲'};interestRatePresetEl.addEventListener('change',function(){interestCustomEl.style.display=this.value==='custom'?'block':'none';if(this.value==='custom'){interestCustomEl.focus();if(!interestCustomEl.value)interestCustomEl.value="7.6"}});currencyEl.addEventListener('change',()=>{updateCurrencyLabels(currencyEl.value);const a=document.querySelector('.btn-group .btn.active-calc-btn');calc(a&&a.textContent.includes('Netto'))});stopMonthlyRateEnableEl.addEventListener('change',function(){stopMonthlyRateYearContainerEl.style.display=this.checked?'block':'none'});payoutIntervalEl.addEventListener('change',function(){payoutIntervalDaysEl.disabled=this.value!=='custom';if(this.value==='custom'&&!payoutIntervalDaysEl.value)payoutIntervalDaysEl.value='30';else if(this.value!=='custom')payoutIntervalDaysEl.value=''});steuerSatzEl.addEventListener('input',function(){taxRateDisplayEl.textContent=this.value||DEFAULT_STEUERSATZ.toString()});
function addDynamicEntry(c,ta,ty){const r=document.createElement('div');r.className='row dynamic-entry-row';const ad=document.createElement('div'),ai=document.createElement('input');ai.type='number';ai.min='0';ai.value='0';ai.className=ta;ad.appendChild(ai);const yd=document.createElement('div'),yi=document.createElement('input');yi.type='number';yi.min='1';yi.value='1';yi.className=ty;yi.placeholder='Jahr';yd.appendChild(yi);r.appendChild(ad);r.appendChild(yd);const rb=document.createElement('button');rb.type='button';rb.textContent='X';rb.className='remove-btn';rb.onclick=()=>r.remove();r.appendChild(rb);c.appendChild(r)}document.getElementById('addLumpsumBtn').addEventListener('click',()=>addDynamicEntry(lumpsumEntriesContainer,'lumpsum-amount','lumpsum-year'));document.getElementById('addOneTimePayoutBtn').addEventListener('click',()=>addDynamicEntry(oneTimePayoutEntriesContainer,'payout-amount','payout-year'));
function getDynamicEntries(ac,yc){const a=document.querySelectorAll('.'+ac),y=document.querySelectorAll('.'+yc),e=[];for(let i=0;i<a.length;i++){const am=parseFloat(a[i].value)||0,yr=parseInt(y[i].value)||0;if(am>0&&yr>0)e.push({amount:am,year:yr})}return e}
function computeRatesFromPrices(p){const r=[];for(let i=1;i<p.length;i++)r.push(p[i]/p[i-1]-1);return r}
async function fetchHistoricalRates(){const asset=assetSelectEl.value,sy=parseInt(assetStartYearEl.value)||new Date().getFullYear();let prices=[];if(asset==='bitcoin'){const from=Math.floor(new Date(sy+'-01-01').getTime()/1000),to=Math.floor(Date.now()/1000);const res=await fetch('https://api.coingecko.com/api/v3/coins/bitcoin/market_chart/range?vs_currency=usd&from='+from+'&to='+to);const data=await res.json();const ym={};(data.prices||[]).forEach(p=>{const y=new Date(p[0]).getFullYear();if(!ym[y])ym[y]=[];ym[y].push(p[1])});Object.keys(ym).sort().forEach(y=>{if(y>=sy)prices.push(ym[y].reduce((a,b)=>a+b,0)/ym[y].length)})}else{const sym=asset==='gold'?'GLD':'URTH';const res=await fetch('https://www.alphavantage.co/query?function=TIME_SERIES_MONTHLY_ADJUSTED&symbol='+sym+'&apikey=demo');const json=await res.json();const s=json['Monthly Adjusted Time Series']||{},ym={};Object.keys(s).forEach(d=>{const y=parseInt(d.slice(0,4));if(y>=sy){if(!ym[y])ym[y]=[];ym[y].push(parseFloat(s[d]['5. adjusted close']))}});Object.keys(ym).sort().forEach(y=>prices.push(ym[y].reduce((a,b)=>a+b,0)/ym[y].length))}loadedHistoricalRates=computeRatesFromPrices(prices)}
function computeComparisonTotal(st,ls,br,ri,ar,yr,se,sy){let t=st;ls.forEach(l=>{if(l.amount>0)t+=l.amount});let dr=br;for(let y=1;y<=yr;y++){if(y>1)dr*=(1+ri);t+=(se&&y>=sy)?0:dr*12;t*=(1+ar)}return t}
function updateCompareChart(et,td,bk,bt,eth,cur){if(chartCompare)chartCompare.destroy();const sel=Array.from(document.querySelectorAll('.asset-toggle:checked')).map(c=>c.value),lb=[],dt=[],cl=[];if(sel.includes('etf')){lb.push('ETF');dt.push(et);cl.push(COMPARE_COLORS.etf)}if(sel.includes('tagesgeld')){lb.push('Tagesgeld 2%');dt.push(td);cl.push(COMPARE_COLORS.tagesgeld)}if(sel.includes('bank')){lb.push('Bank 0%');dt.push(bk);cl.push(COMPARE_COLORS.bank)}if(sel.includes('bitcoin')){lb.push('Bitcoin');dt.push(bt);cl.push(COMPARE_COLORS.bitcoin)}if(sel.includes('ethereum')){lb.push('Ethereum');dt.push(eth);cl.push(COMPARE_COLORS.ethereum)}compareChartTitleEl.textContent='Vergleich (Gesamtwertentwicklung)';chartCompare=new Chart(document.getElementById('compare').getContext('2d'),{type:'bar',data:{labels:lb,datasets:[{data:dt,backgroundColor:cl,barPercentage:0.7}]},options:{...chartOptionsBase,scales:{y:{title:{display:true,text:'Gesamtwert ('+cur.toUpperCase()+')'}}},plugins:{...chartOptionsBase.plugins,legend:{display:false}}}})}
function resetValuesAndCalc(){currencyEl.value=DEFAULT_CURRENCY;rateEl.value=DEFAULT_MONTHLY_RATE;monthlyRateIncreaseEl.value=DEFAULT_RATE_INCREASE;yearsEl.value=DEFAULT_YEARS;startCalendarYearEl.value=new Date().getFullYear();interestRatePresetEl.value=DEFAULT_INTEREST_PRESET;interestCustomEl.value='';interestRatePresetEl.dispatchEvent(new Event('change'));etfTypeEl.value=DEFAULT_ETF_TYPE;freibetragEl.value=DEFAULT_FREIBETRAG;steuerSatzEl.value=DEFAULT_STEUERSATZ;basiszinsEl.value=DEFAULT_BASISZINS;taxRateDisplayEl.textContent=DEFAULT_STEUERSATZ.toString();startEl.value=0;stopMonthlyRateEnableEl.checked=false;stopMonthlyRateYearEl.value=10;stopMonthlyRateEnableEl.dispatchEvent(new Event('change'));payoutYearTypeEl.value='laufjahr';lumpsumEntriesContainer.innerHTML='<div class="row main-entry-row"><div><label for="lumpsum">Einmalige Einzahlung (€)</label><input id="lumpsum" type="number" value="0" min="0" class="lumpsum-amount"></div><div><label for="lumpyear">Im Jahr (Laufjahr):</label><input id="lumpyear" type="number" value="1" min="1" class="lumpsum-year"></div></div>';oneTimePayoutEntriesContainer.innerHTML='<div class="row main-entry-row"><div><label>Einmalige Auszahlung (€)</label><input id="payout" type="number" value="0" min="0" class="payout-amount"></div><div><label>Im Jahr:</label><input id="payoutYear" type="number" value="1" min="1" class="payout-year" placeholder="Jahr"></div></div>';payoutPlanAmountEl.value=0;payoutStartYearEl.value=1;payoutIntervalEl.value='monthly';payoutIntervalDaysEl.value='';payoutIntervalEl.dispatchEvent(new Event('change'));assetSelectEl.value='gold';assetStartYearEl.value=2015;loadedHistoricalRates=[];updateMode('compare');chartAxisToggleEl.checked=false;warnEl.textContent='';headlineEl.innerHTML='';if(chartMain){chartMain.destroy();chartMain=null}if(chartCompare){chartCompare.destroy();chartCompare=null}document.querySelectorAll('.btn-group .btn').forEach(b=>b.classList.remove('active-calc-btn'));document.querySelector('.btn[onclick="calc(false)"]').classList.add('active-calc-btn');updateCurrencyLabels(DEFAULT_CURRENCY);calc(false)}
resetBtn.addEventListener('click',resetValuesAndCalc);chartAxisToggleEl.addEventListener('change',()=>{const a=document.querySelector('.btn-group .btn.active-calc-btn');calc(a&&a.textContent.includes('Netto'))});
function updateMode(m){currentMode=m;btnCalcMode.classList.toggle('active-mode-btn',m==='compare');btnHistoricalMode.classList.toggle('active-mode-btn',m==='historical');historicalOptionsEl.style.display=m==='historical'?'block':'none';if(m==='historical')fetchHistoricalRates().then(()=>{const a=document.querySelector('.btn-group .btn.active-calc-btn');calc(a&&a.textContent.includes('Netto'))});else{const a=document.querySelector('.btn-group .btn.active-calc-btn');calc(a&&a.textContent.includes('Netto'))}}
btnCalcMode.addEventListener('click',()=>updateMode('compare'));btnHistoricalMode.addEventListener('click',()=>updateMode('historical'));assetSelectEl.addEventListener('change',()=>updateMode('historical'));assetStartYearEl.addEventListener('change',()=>updateMode('historical'));assetToggleEls.forEach(cb=>cb.addEventListener('change',()=>{const a=document.querySelector('.btn-group .btn.active-calc-btn');calc(a&&a.textContent.includes('Netto'))}));document.querySelectorAll('.btn-group .btn').forEach(button=>{button.addEventListener('click',function(){document.querySelectorAll('.btn-group .btn').forEach(b=>b.classList.remove('active-calc-btn'));this.classList.add('active-calc-btn')})});
function calc(withTax){warnEl.textContent='';const currency=currencyEl.value;let baseMonthlyRate=parseFloat(rateEl.value)||0;const monthlyRateIncrease=(parseFloat(monthlyRateIncreaseEl.value)||0)/100,totalYears=parseInt(yearsEl.value)||0,investmentStartCalendarYear=parseInt(startCalendarYearEl.value)||new Date().getFullYear();let annualInterestRateValue=(interestRatePresetEl.value==='custom')?(parseFloat(interestCustomEl.value)||0):(parseFloat(interestRatePresetEl.value)||0);const annualInterestRate=annualInterestRateValue/100,startCapital=parseFloat(startEl.value)||0,stopMonthlyRateEnabled=stopMonthlyRateEnableEl.checked,stopMonthlyRateAtYear=parseInt(stopMonthlyRateYearEl.value)||0,currentEtfType=etfTypeEl.value,currentFreibetrag=parseFloat(freibetragEl.value)||0,currentSteuerSatz=(parseFloat(steuerSatzEl.value)||0)/100,currentBasiszins=(parseFloat(basiszinsEl.value)||0)/100,globalPayoutYearType=payoutYearTypeEl.value,allLumpsums=getDynamicEntries('lumpsum-amount','lumpsum-year'),allOneTimePayouts=getDynamicEntries('payout-amount','payout-year'),useCalendarYearAxis=chartAxisToggleEl.checked,payoutPlanAmount=parseFloat(payoutPlanAmountEl.value)||0,payoutPlanStartYear=parseInt(payoutStartYearEl.value)||0,payoutPlanInterval=payoutIntervalEl.value,payoutPlanIntervalDays=parseInt(payoutIntervalDaysEl.value)||0,historicalRates=(currentMode==='historical')?loadedHistoricalRates:[];if(totalYears<1){warnEl.textContent='Bitte Laufzeit ≥ 1 Jahr.';return}for(const p of allOneTimePayouts){let ey=p.year;if(globalPayoutYearType==='kalenderjahr')ey=p.year-investmentStartCalendarYear+1;if(ey<1||ey>totalYears){warnEl.textContent='Auszahlung Jahr '+p.year+' außerhalb Laufzeit.';return}}let balance=startCapital,cumDep=startCapital,cumPay=0,cumTax=0,frRest=currentFreibetrag,allVPA=0;const labels=[],ndD=[],ngD=[],apD=[],ctD=[];for(let y=1;y<=totalYears;y++){const cy=investmentStartCalendarYear+y-1;let yPay=0,bStart=balance,yTax=0;if(y>1){frRest=currentFreibetrag;baseMonthlyRate*=(1+monthlyRateIncrease)}allLumpsums.forEach(l=>{if(l.year===y){balance+=l.amount;cumDep+=l.amount;bStart+=l.amount}});let ac=0;if(!(stopMonthlyRateEnabled&&y>=stopMonthlyRateAtYear))ac=baseMonthlyRate*12;balance+=ac;cumDep+=ac;const bbi=balance;let rfy=annualInterestRate;if(historicalRates.length>0)rfy=historicalRates[y-1]!==undefined?historicalRates[y-1]:historicalRates[historicalRates.length-1];balance*=(1+rfy);const wdj=balance-bbi;allOneTimePayouts.forEach(p=>{if((globalPayoutYearType==='laufjahr'&&p.year===y)||(globalPayoutYearType==='kalenderjahr'&&p.year===cy)){const a=Math.min(balance,p.amount);balance-=a;cumPay+=a;yPay+=a}});if(y>=payoutPlanStartYear&&payoutPlanAmount>0){let ye=0;if(payoutPlanInterval==='yearly')ye=payoutPlanAmount;else if(payoutPlanInterval==='custom'&&payoutPlanIntervalDays>0)ye=payoutPlanAmount*(365/payoutPlanIntervalDays);else ye=payoutPlanAmount*12;const ae=Math.min(balance,ye);balance-=ae;cumPay+=ae;yPay+=ae}if(withTax){if(currentEtfType==='thesaurierend'){const vr=bStart*currentBasiszins*0.7,ae=Math.min(vr,wdj);allVPA+=ae;const zv=Math.max(0,ae-frRest);yTax=zv*currentSteuerSatz;frRest-=Math.min(ae,frRest)}else{const zv=Math.max(0,wdj-frRest);yTax=zv*currentSteuerSatz;frRest-=Math.min(wdj,frRest)}yTax=Math.max(0,yTax);balance-=yTax;cumTax+=yTax}labels.push(useCalendarYearAxis?cy.toString():'Jahr '+y);const ni=cumDep-cumPay;ndD.push(Math.max(0,ni));ngD.push(Math.max(0,balance-ni));apD.push(-yPay);ctD.push(cumTax)}const fBal=balance,fNI=cumDep-cumPay,fGain=fBal-fNI;let vk=0,enk=fBal;let hHTML='<div class="headline-item"><span class="headline-label">Brutto-Einzahlungen:</span><span class="headline-sub-value">'+fmt(cumDep,currency)+'</span></div><div class="headline-item"><span class="headline-label">Gewinn '+(withTax?'(Netto vor Verkauf)':'(Brutto)')+':</span><span class="headline-value">'+fmt(fGain,currency)+'</span></div><div class="headline-item"><span class="headline-label">Auszahlungen (kumuliert):</span><span class="headline-sub-value">'+fmt(cumPay,currency)+'</span></div>';if(withTax){const tgs=fBal-(cumDep-allVPA-cumPay),txg=Math.max(0,tgs-currentFreibetrag);vk=Math.max(0,txg*currentSteuerSatz*0.7);enk=fBal-vk;hHTML+='<div class="headline-item"><span class="headline-label">Verkaufsteuer:</span><span class="headline-sub-value">'+fmt(vk,currency)+' <button type="button" class="info-btn" data-modal-target="modalVerkaufsteuerInfo" title="Info">?</button></span></div><div class="headline-item"><span class="headline-label">Endkapital (nach Verkauf):</span><span class="headline-value">'+fmt(enk,currency)+'</span></div>'}else{hHTML+='<div class="headline-item"><span class="headline-label">Endkapital:</span><span class="headline-value">'+fmt(fBal,currency)+'</span></div>'}headlineEl.innerHTML=hHTML;document.querySelectorAll('[data-modal-target="modalVerkaufsteuerInfo"]').forEach(b=>{if(b.getAttribute('listener')!=='true'){b.addEventListener('click',()=>openModal('modalVerkaufsteuerInfo'));b.setAttribute('listener','true')}});const chartOptionsBase={responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},plugins:{tooltip:{callbacks:{label:function(ctx){let l=ctx.dataset.label||'';if(l)l+=': ';const v=ctx.dataset.label==='Auszahlungen (jährlich)'?Math.abs(ctx.parsed.y):ctx.parsed.y;return l+fmt(v,currency)}}}},layout:{padding:{top:20,bottom:10,left:10,right:10}}};if(chartMain)chartMain.destroy();const dsM=[{label:'Netto Einzahlungen',data:ndD,backgroundColor:CAPITAL_COLOR,stack:'pos'},{label:'Gewinn '+(withTax?'(Netto)':'(Brutto)'),data:ngD,backgroundColor:GAIN_COLOR,stack:'pos'},{label:'Auszahlungen (jährlich)',data:apD,backgroundColor:ANNUAL_PAYOUT_COLOR,stack:'neg'}];if(withTax)dsM.push({label:'Steuer (kumuliert)',data:ctD,backgroundColor:TAX_COLOR_DIAGRAM,type:'line',order:-1,yAxisID:'y1'});chartMain=new Chart(document.getElementById('chart').getContext('2d'),{type:'bar',data:{labels:labels,datasets:dsM},options:{...chartOptionsBase,scales:{y:{stacked:true,title:{display:true,text:'Betrag ('+currency.toUpperCase()+')'},beginAtZero:true},y1:{display:withTax,position:'right',title:{display:true,text:'Steuer kumuliert'},grid:{drawOnChartArea:false}},x:{stacked:true,title:{display:true,text:useCalendarYearAxis?'Kalenderjahr':'Laufjahre'}}}}});const etfG=fBal+cumPay,bM=parseFloat(rateEl.value)||0,tdT=computeComparisonTotal(startCapital,allLumpsums,bM,monthlyRateIncrease,0.02,totalYears,stopMonthlyRateEnabled,stopMonthlyRateAtYear),btcT=computeComparisonTotal(startCapital,allLumpsums,bM,monthlyRateIncrease,0.45,totalYears,stopMonthlyRateEnabled,stopMonthlyRateAtYear),ethT=computeComparisonTotal(startCapital,allLumpsums,bM,monthlyRateIncrease,0.30,totalYears,stopMonthlyRateEnabled,stopMonthlyRateAtYear);updateCompareChart(etfG,tdT,cumDep,btcT,ethT,currency)}
document.addEventListener('DOMContentLoaded',()=>{resetValuesAndCalc()});
</script>
<script src="app.js"></script>
<footer>
  <p>Kursdaten basieren auf externen Quellen wie alphavantage.co, coingecko.com oder Yahoo Finance. Es wird keine Gewähr für die Richtigkeit übernommen.</p>
  <p><a href="impressum.html">Impressum</a></p>
</footer>
</body>
</html>
