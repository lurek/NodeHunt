(function () {
  var pagefindPromise = null;

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] || char;
    });
  }

  function loadPagefind() {
    if (!pagefindPromise) {
      pagefindPromise = import('/pagefind/pagefind.js');
    }
    return pagefindPromise;
  }

  function runSearch(root) {
    var input = root.querySelector('input[type="search"]');
    var results = root.querySelector('.search-results');
    var status = root.querySelector('.search-status');
    if (!input || !results) return;
    var query = input.value.trim();
    if (!query) {
      results.innerHTML = '';
      if (status) status.textContent = '';
      return;
    }
    var seq = (root._nodehuntSeq = (root._nodehuntSeq || 0) + 1);
    loadPagefind()
      .then(function (pagefind) {
        return pagefind.search(query).then(function (response) {
          return Promise.all(response.results.slice(0, 8).map(function (result) { return result.data(); }));
        });
      })
      .then(function (items) {
        if (root._nodehuntSeq !== seq) return;
        if (status) status.textContent = items.length ? items.length + ' result' + (items.length === 1 ? '' : 's') + ' for "' + query + '"' : '';
        results.innerHTML = items.length
          ? items
              .map(function (item) {
                var title = escapeHtml((item.meta && item.meta.title) || '');
                var excerpt = item.excerpt ? '<span>' + escapeHtml(item.excerpt) + '</span>' : '';
                return '<a class="result" href="' + item.url + '"><strong>' + title + '</strong>' + excerpt + '</a>';
              })
              .join('')
          : '<p class="search-empty">No matching articles yet. Try a broader term.</p>';
      })
      .catch(function () {
        if (root._nodehuntSeq === seq && status) status.textContent = 'Search is unavailable right now.';
      });
  }

  function initSearchBox(root) {
    if (root.dataset.searchReady) return;
    root.dataset.searchReady = 'true';
    var input = root.querySelector('input[type="search"]');
    if (!input) return;
    var timer;
    function schedule() {
      window.clearTimeout(timer);
      timer = window.setTimeout(function () { runSearch(root); }, 160);
    }
    input.addEventListener('input', schedule);
    input.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        window.clearTimeout(timer);
        runSearch(root);
      }
    });
    var query = new URLSearchParams(window.location.search).get('q');
    if (query) {
      input.value = query;
      runSearch(root);
    }
  }

  function initAll() {
    document.querySelectorAll('[data-search-box]').forEach(initSearchBox);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
