(function () {
  var pagefindPromise = null;

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] || char;
    });
  }

  function loadPagefind() {
    if (!pagefindPromise) {
      var url = '/pagefind/pagefind.js?ts=' + (Date.now());
      pagefindPromise = import(/* @vite-ignore */ url).then(function (pf) {
        if (pf && typeof pf.init === 'function') {
          return pf.init().then(function () { return pf; });
        }
        return pf;
      }).catch(function (err) {
        pagefindPromise = null;
        throw err;
      });
    }
    return pagefindPromise;
  }

  function cleanExcerpt(excerpt, title) {
    var text = String(excerpt || '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (title && text.lastIndexOf(title, 0) === 0) {
      text = text.slice(title.length).replace(/^[.,:;!?\s-]+/, '').trim();
    }
    if (text.length > 110) {
      text = text.slice(0, 107).replace(/\s+\S*$/, '') + '…';
    }
    return text;
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
                var category = escapeHtml((item.meta && item.meta.category) || 'ARTICLE');
                var excerpt = item.excerpt ? '<p class="result-excerpt">' + escapeHtml(cleanExcerpt(item.excerpt, (item.meta && item.meta.title) || '')) + '</p>' : '';
                return (
                  '<a class="result-card" href="' + item.url + '">' +
                    '<div class="result-content">' +
                      '<h3 class="result-title">' + title + '</h3>' +
                      excerpt +
                    '</div>' +
                    '<span class="result-badge">' + category + '</span>' +
                  '</a>'
                );
              })
              .join('')
          : '<p class="search-empty">No matching articles yet. Try a broader term.</p>';
      })
      .catch(function (err) {
        console.error('Pagefind search error:', err);
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
