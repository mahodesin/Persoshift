// ============================================
// PersoShift – Chart Beautifier (Dark Theme)
// Depends on: calc.js (overrides calc function)
// ============================================
(function() {
  'use strict';

  // Dark theme chart defaults
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
  } catch(e) {}

  // Override calc to apply beautification after chart creation
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
              ds.pointRadius = 0; ds.pointHoverRadius = 5;
              ds.borderWidth = 2.5; ds.tension = 0.35; ds.fill = true;
              ds.backgroundColor = 'rgba(248,113,113,0.08)';
              ds.borderColor = 'rgba(248,113,113,0.6)';
            }
          });
          window.chartMain.options.animation = { duration: 600, easing: 'easeOutQuart' };
          var isMobile = window.innerWidth < 600;
          var sx = window.chartMain.options.scales;
          if (sx && sx.x) {
            sx.x.grid = { display: false };
            sx.x.ticks = {
              maxRotation: isMobile ? 60 : 45,
              autoSkip: true,
              maxTicksLimit: isMobile ? 8 : 20,
              color: '#6b7280',
              font: { size: isMobile ? 9 : 11 }
            };
            if (sx.x.title) { sx.x.title.color = '#6b7280'; sx.x.title.font = { size: isMobile ? 10 : 12 }; }
          }
          if (sx && sx.y) {
            sx.y.grid = { color: 'rgba(42,54,72,0.5)' };
            sx.y.ticks = {
              color: '#6b7280',
              font: { size: isMobile ? 9 : 11 },
              maxTicksLimit: isMobile ? 6 : 10,
              callback: function(v) {
                if (v >= 1000000) return (v/1000000).toFixed(1) + 'M';
                if (v >= 1000) return (v/1000).toFixed(0) + 'k';
                return v;
              }
            };
            if (sx.y.title) { sx.y.title.display = !isMobile; }
          }
          if (sx && sx.y1) {
            sx.y1.ticks = {
              color: '#6b7280',
              font: { size: isMobile ? 9 : 11 },
              maxTicksLimit: isMobile ? 5 : 8,
              callback: function(v) {
                if (v >= 1000) return (v/1000).toFixed(0) + 'k';
                return v;
              }
            };
            if (sx.y1.title) { sx.y1.title.display = !isMobile; }
          }
          window.chartMain.update();
        }
        // Beautify compare chart
        if (window.chartCompare) {
          var isMob = window.innerWidth < 600;
          window.chartCompare.data.datasets.forEach(function(ds) { ds.borderRadius = 8; ds.borderSkipped = false; ds.barPercentage = 0.6; });
          window.chartCompare.options.animation = { duration: 600, easing: 'easeOutQuart' };
          var sc = window.chartCompare.options.scales;
          if (sc && sc.x) {
            sc.x.grid = { display: false };
            sc.x.ticks = { color: '#6b7280', font: { size: isMob ? 9 : 11 } };
          }
          if (sc && sc.y) {
            sc.y.grid = { color: 'rgba(42,54,72,0.5)' };
            sc.y.ticks = {
              color: '#6b7280',
              font: { size: isMob ? 9 : 11 },
              maxTicksLimit: isMob ? 6 : 10,
              callback: function(v) { if (v >= 1e6) return (v/1e6).toFixed(1)+'M'; if (v >= 1e3) return (v/1e3).toFixed(0)+'k'; return v; }
            };
            if (sc.y.title) { sc.y.title.display = !isMob; }
          }
          window.chartCompare.update();
        }
      } catch(e) { console.warn('Chart beautify:', e); }
    };
  }
})();
