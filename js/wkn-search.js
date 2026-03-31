// ============================================
// PersoShift – WKN / ISIN Search
// Standalone module, no dependencies on calc
// ============================================
(function() {
  'use strict';

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
    var d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
  }

  function detailItem(label, value, highlight) {
    return '<div class="wkn-detail-item"><div class="wkn-detail-label">' + escapeHtml(label) +
      '</div><div class="wkn-detail-value' + (highlight ? ' highlight' : '') + '">' +
      escapeHtml(value) + '</div></div>';
  }

  function renderResults(items, container) {
    container.innerHTML = '';
    var seen = {};
    items.filter(function(item) {
      var k = (item.name || '') + (item.exchCode || '');
      if (seen[k]) return false;
      seen[k] = true; return true;
    }).slice(0, 10).forEach(function(item) {
      var card = document.createElement('div');
      card.className = 'wkn-result-card';
      var sub = [];
      if (item.ticker) sub.push('Ticker: ' + item.ticker);
      if (item.exchCode) sub.push('Börse: ' + item.exchCode);
      if (item.securityType) sub.push(item.securityType);
      var html = '<h3>' + escapeHtml(item.name || 'Unbekannt') + '</h3>';
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
      if (item.ticker) {
        html += '<button class="btn wkn-adopt-btn" style="margin-top:0.75rem;width:auto;padding:0.45rem 1.2rem;font-size:0.82rem;">✓ Übernehmen für historische Analyse</button>';
      }
      card.innerHTML = html;
      // Attach adopt button handler
      var adoptBtn = card.querySelector('.wkn-adopt-btn');
      if (adoptBtn) {
        adoptBtn.addEventListener('click', function() {
          adoptAsset(item.ticker, item.name || item.ticker);
        });
      }
      container.appendChild(card);
    });
  }

  // Adopt a WKN result into historical analysis
  function adoptAsset(ticker, name) {
    var sel = document.getElementById('assetSelect');
    if (!sel) return;
    // Check if option already exists
    var exists = false;
    for (var i = 0; i < sel.options.length; i++) {
      if (sel.options[i].value === 'custom_' + ticker) { exists = true; sel.selectedIndex = i; break; }
    }
    if (!exists) {
      var opt = document.createElement('option');
      opt.value = 'custom_' + ticker;
      opt.textContent = name;
      opt.setAttribute('data-ticker', ticker);
      sel.appendChild(opt);
      sel.value = 'custom_' + ticker;
    }
    // Switch to ETF tab and historical mode
    var rechnerTab = document.getElementById('tab-rechner');
    var wknTab = document.getElementById('tab-wkn');
    if (rechnerTab) rechnerTab.classList.add('active-content');
    if (wknTab) wknTab.classList.remove('active-content');
    // Update header nav buttons
    document.querySelectorAll('.header-nav-btn').forEach(function(b, i) {
      b.classList.toggle('active-header-btn', i === 0);
    });
    // Switch to historical mode
    if (typeof window.updateMode === 'function') window.updateMode('historical');
  }

  function renderExamples(container) {
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
    container.querySelectorAll('.wkn-recent-tag').forEach(function(tag, i) {
      tag.addEventListener('click', function() {
        document.getElementById('wknSearchInput').value = examples[i].value;
        window.searchWKN();
      });
    });
  }

  function fallbackSearch(query, statusEl, resultsEl, btn) {
    fetch('https://api.openfigi.com/v3/mapping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([{ idType: 'TICKER', idValue: query.toUpperCase(), exchCode: 'GY' }])
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (btn) btn.disabled = false;
      if (!data || !data[0] || !data[0].data || data[0].data.length === 0) {
        if (statusEl) { statusEl.textContent = 'Keine Ergebnisse für "' + query + '". Versuche eine ISIN oder WKN.'; statusEl.className = 'error'; }
        renderExamples(resultsEl);
        return;
      }
      if (statusEl) { statusEl.textContent = data[0].data.length + ' Ergebnis(se) gefunden'; statusEl.className = ''; }
      renderResults(data[0].data, resultsEl);
    })
    .catch(function() {
      if (btn) btn.disabled = false;
      if (statusEl) { statusEl.textContent = 'Fehler. Bitte ISIN oder WKN direkt eingeben.'; statusEl.className = 'error'; }
      renderExamples(resultsEl);
    });
  }

  // Main search function
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

    var q = query.toUpperCase();
    var isISIN = /^[A-Z]{2}[A-Z0-9]{10}$/.test(q);
    var isWKN = /^[A-Z0-9]{6}$/.test(q) && !isISIN;
    var body = [];
    if (isISIN) body.push({ idType: 'ID_ISIN', idValue: q });
    else if (isWKN) body.push({ idType: 'ID_WERTPAPIER', idValue: q });
    else body.push({ idType: 'ID_ISIN', idValue: q });

    fetch('https://api.openfigi.com/v3/mapping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (btn) btn.disabled = false;
      if (!data || !data[0] || !data[0].data || data[0].data.length === 0) {
        fallbackSearch(query, statusEl, resultsEl, btn);
        return;
      }
      if (statusEl) { statusEl.textContent = data[0].data.length + ' Ergebnis(se) gefunden'; statusEl.className = ''; }
      renderResults(data[0].data, resultsEl);
    })
    .catch(function() {
      if (btn) btn.disabled = false;
      fallbackSearch(query, statusEl, resultsEl, btn);
    });
  };

  // Enter key
  var si = document.getElementById('wknSearchInput');
  if (si) si.addEventListener('keydown', function(e) { if (e.key === 'Enter') { e.preventDefault(); window.searchWKN(); } });

  updateRecentUI();
})();
