document.addEventListener('DOMContentLoaded', function () {
  const filterBar = document.querySelector('.keyword-filter-bar');
  if (!filterBar) return; // Only run on pages with the filter bar

  const buttons = filterBar.querySelectorAll('.keyword-filter-btn');

  let activeKeyword = null;

  // Read URL hash on load
  const hash = window.location.hash;
  if (hash.startsWith('#keyword=')) {
    activeKeyword = decodeURIComponent(hash.substring(9));
  }

  // Apply filter state
  function applyFilter(keyword) {
    activeKeyword = keyword;

    // Update button states
    buttons.forEach(function (btn) {
      const kw = btn.getAttribute('data-keyword');
      if (kw === keyword || (kw === 'all' && keyword === null)) {
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
      } else {
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
      }
    });

    // Update URL hash
    if (keyword) {
      window.location.hash = 'keyword=' + encodeURIComponent(keyword);
    } else {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }

    // Filter papers across ALL year groups
    var allOls = document.querySelectorAll('ol.bibliography');
    if (keyword === null || keyword === 'all') {
      // Show all
      allOls.forEach(function (ol) {
        ol.querySelectorAll(':scope > li').forEach(function (li) {
          li.classList.remove('hidden-by-keyword');
        });
      });
    } else {
      allOls.forEach(function (ol) {
        ol.querySelectorAll(':scope > li').forEach(function (li) {
          const entryDiv = li.querySelector('[data-keywords]');
          if (entryDiv) {
            const keywords = entryDiv.getAttribute('data-keywords');
            const kwList = keywords ? keywords.split(', ') : [];
            if (kwList.indexOf(keyword) !== -1) {
              li.classList.remove('hidden-by-keyword');
            } else {
              li.classList.add('hidden-by-keyword');
            }
          }
        });
      });
    }

    // Hide empty year headings
    updateYearHeadings();
  }

  // Hide year headings (h2.bibliography) when all papers under them are hidden
  function updateYearHeadings() {
    document.querySelectorAll('h2.bibliography').forEach(function (heading) {
      let sibling = heading.nextElementSibling;
      let allHidden = true;
      while (sibling && sibling.tagName !== 'H2') {
        if (sibling.tagName === 'OL') {
          const lis = sibling.querySelectorAll(':scope > li');
          lis.forEach(function (li) {
            if (!li.classList.contains('hidden-by-keyword') && !li.classList.contains('unloaded')) {
              allHidden = false;
            }
          });
        }
        sibling = sibling.nextElementSibling;
      }
      if (allHidden) {
        heading.classList.add('hidden-by-keyword');
      } else {
        heading.classList.remove('hidden-by-keyword');
      }
    });
  }

  // Button click handler (single-choice)
  buttons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      const keyword = this.getAttribute('data-keyword');

      if (keyword === 'all') {
        applyFilter(null);
      } else if (keyword === activeKeyword) {
        // Clicking the same keyword deselects it
        applyFilter(null);
      } else {
        applyFilter(keyword);
      }
    });
  });

  // Delegate click on keyword badges (on each paper)
  document.addEventListener('click', function (e) {
    const badge = e.target.closest('.keyword-badge');
    if (!badge) return;
    const keyword = badge.getAttribute('data-keyword');
    if (keyword) {
      applyFilter(keyword === activeKeyword ? null : keyword);
    }
  });

  // Apply initial filter from URL hash
  if (activeKeyword) {
    applyFilter(activeKeyword);
  }

  // Expose updateYearHeadings so bibsearch.js can call it after text filtering
  window.updateKeywordYearHeadings = updateYearHeadings;
});
