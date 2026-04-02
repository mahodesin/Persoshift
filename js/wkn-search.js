// PersoShift – WKN/ISIN Search (integrated in historical section)
(function(){
  'use strict';
  var recent=[];try{recent=JSON.parse(localStorage.getItem('wkn_recent')||'[]');}catch(e){}
  function updateRecentUI(){var c=document.getElementById('wknRecentSearches'),l=document.getElementById('wknRecentList');if(!c||!l)return;if(recent.length===0){c.style.display='none';return;}c.style.display='block';l.innerHTML='';recent.slice(0,8).forEach(function(t){var tag=document.createElement('span');tag.className='wkn-recent-tag';tag.textContent=t;tag.addEventListener('click',function(){document.getElementById('wknSearchInput').value=t;window.searchWKN();});l.appendChild(tag);});}
  function addToRecent(t){recent=recent.filter(function(x){return x!==t;});recent.unshift(t);if(recent.length>8)recent=recent.slice(0,8);try{localStorage.setItem('wkn_recent',JSON.stringify(recent));}catch(e){}updateRecentUI();}
  function esc(s){var d=document.createElement('div');d.textContent=s||'';return d.innerHTML;}
  function di(l,v,h){return'<div class="wkn-detail-item"><div class="wkn-detail-label">'+esc(l)+'</div><div class="wkn-detail-value'+(h?' highlight':'')+'">'+esc(v)+'</div></div>';}

  function renderResults(items,container){
    container.innerHTML='';var seen={};
    items.filter(function(i){var k=(i.name||'')+(i.exchCode||'');if(seen[k])return false;seen[k]=true;return true;}).slice(0,10).forEach(function(item){
      var card=document.createElement('div');card.className='wkn-result-card';
      var sub=[];if(item.ticker)sub.push('Ticker: '+item.ticker);if(item.exchCode)sub.push('Börse: '+item.exchCode);if(item.securityType)sub.push(item.securityType);
      var html='<h3>'+esc(item.name||'Unbekannt')+'</h3><div class="wkn-subtitle">'+esc(sub.join(' · '))+'</div><div class="wkn-details-grid">';
      if(item.figi)html+=di('FIGI',item.figi);if(item.securityType)html+=di('Typ',item.securityType);
      if(item.marketSector)html+=di('Sektor',item.marketSector);if(item.exchCode)html+=di('Börse',item.exchCode);
      if(item.ticker)html+=di('Ticker',item.ticker,true);html+='</div>';
      if(item.ticker){html+='<button class="btn wkn-adopt-btn" style="margin-top:0.75rem;width:auto;padding:0.45rem 1.2rem;font-size:0.82rem;">✓ Übernehmen</button>';}
      card.innerHTML=html;
      var ab=card.querySelector('.wkn-adopt-btn');
      if(ab){ab.addEventListener('click',function(){adoptAsset(item.ticker,item.name||item.ticker);});}
      container.appendChild(card);
    });
  }

  function adoptAsset(ticker,name){
    var sel=document.getElementById('assetSelect');if(!sel)return;
    var exists=false;
    for(var i=0;i<sel.options.length;i++){if(sel.options[i].value==='custom_'+ticker){exists=true;sel.selectedIndex=i;break;}}
    if(!exists){var opt=document.createElement('option');opt.value='custom_'+ticker;opt.textContent=name+' ('+ticker+')';opt.setAttribute('data-ticker',ticker);sel.appendChild(opt);sel.value='custom_'+ticker;}
    // Update badge
    var badge=document.getElementById('historicalBadge');
    if(badge)badge.innerHTML='Aktuell: <strong>'+esc(name)+' ('+esc(ticker)+')</strong> – Lade Daten...';
    // Clear search status
    var st=document.getElementById('wknSearchStatus');
    if(st){st.textContent='✓ '+name+' übernommen. Lade historische Daten...';st.className='';}
    // Trigger historical fetch (updateMode handles loading/error states)
    if(typeof window.updateMode==='function')window.updateMode('historical');
  }

  function renderExamples(container){
    var ex=[{t:'URTH',l:'MSCI World'},{t:'SPY',l:'S&P 500'},{t:'EEM',l:'Emerging Markets'},{t:'VT',l:'FTSE All-World'},{t:'GLD',l:'Gold'}];
    var html='<div class="wkn-result-card" style="text-align:center"><h3 style="font-size:1rem">Beliebte Assets</h3><div class="wkn-recent-list" style="justify-content:center;margin-top:0.5rem">';
    ex.forEach(function(e){html+='<span class="wkn-recent-tag wkn-example-tag" data-ticker="'+e.t+'" data-name="'+e.l+'" style="cursor:pointer">'+e.l+' ('+e.t+')</span>';});
    html+='</div><p style="font-size:0.72rem;color:var(--muted);margin-top:0.5rem">Gib US-Ticker ein (z.B. SPY, AAPL, MSFT, URTH) – europäische Ticker (IWDA, CSPX) werden leider nicht unterstützt.</p></div>';
    container.innerHTML=html;
    container.querySelectorAll('.wkn-example-tag').forEach(function(tag){
      tag.addEventListener('click',function(){
        adoptAsset(this.getAttribute('data-ticker'),this.getAttribute('data-name'));
      });
    });
  }

  function fallback(q,st,res,btn){
    fetch('https://api.openfigi.com/v3/mapping',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify([{idType:'TICKER',idValue:q.toUpperCase(),exchCode:'GY'}])})
    .then(function(r){return r.json();}).then(function(d){if(btn)btn.disabled=false;if(!d||!d[0]||!d[0].data||d[0].data.length===0){showDirectTickerOption(q,st,res);return;}if(st){st.textContent=d[0].data.length+' Ergebnis(se)';st.className='';}renderResults(d[0].data,res);})
    .catch(function(){if(btn)btn.disabled=false;showDirectTickerOption(q,st,res);});
  }

  function showDirectTickerOption(q,st,res){
    if(st){st.textContent='Keine API-Ergebnisse für "'+q+'".';st.className='error';}
    // Offer direct ticker use + examples
    var html='<div class="wkn-result-card"><h3 style="font-size:0.95rem">'+esc(q.toUpperCase())+' direkt als Ticker verwenden?</h3>';
    html+='<p style="font-size:0.82rem;color:var(--muted)">Falls "'+esc(q)+'" ein gültiger Börsenticker ist, kannst du ihn direkt übernehmen:</p>';
    html+='<button class="btn" style="width:auto;padding:0.45rem 1.2rem;font-size:0.82rem;margin-top:0.5rem" id="directTickerBtn">✓ '+esc(q.toUpperCase())+' übernehmen</button></div>';
    res.innerHTML=html;
    var db=document.getElementById('directTickerBtn');
    if(db)db.addEventListener('click',function(){adoptAsset(q.toUpperCase(),q.toUpperCase());});
    // Also show examples below
    var exDiv=document.createElement('div');res.appendChild(exDiv);renderExamples(exDiv);
  }

  window.searchWKN=function(){
    var inp=document.getElementById('wknSearchInput'),st=document.getElementById('wknSearchStatus'),res=document.getElementById('wknSearchResults'),btn=document.getElementById('wknSearchBtn');
    var q=(inp?inp.value:'').trim();
    if(!q){if(st){st.textContent='Bitte Suchbegriff eingeben.';st.className='error';}return;}
    if(st){st.textContent='Suche läuft...';st.className='';}if(res)res.innerHTML='';if(btn)btn.disabled=true;addToRecent(q);
    var Q=q.toUpperCase(),isISIN=/^[A-Z]{2}[A-Z0-9]{10}$/.test(Q),isWKN=/^[A-Z0-9]{6}$/.test(Q)&&!isISIN;
    var body=[];if(isISIN)body.push({idType:'ID_ISIN',idValue:Q});else if(isWKN)body.push({idType:'ID_WERTPAPIER',idValue:Q});else body.push({idType:'ID_ISIN',idValue:Q});
    fetch('https://api.openfigi.com/v3/mapping',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
    .then(function(r){return r.json();}).then(function(d){if(btn)btn.disabled=false;if(!d||!d[0]||!d[0].data||d[0].data.length===0){fallback(q,st,res,btn);return;}if(st){st.textContent=d[0].data.length+' Ergebnis(se)';st.className='';}renderResults(d[0].data,res);})
    .catch(function(){if(btn)btn.disabled=false;showDirectTickerOption(q,st,res,btn);});
  };

  var si=document.getElementById('wknSearchInput');
  if(si)si.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();window.searchWKN();}});
  updateRecentUI();
})();
