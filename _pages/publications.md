---
layout: page
permalink: /publications/
title: publications
description: >
  Publications are grouped by year. Use the topic buttons to filter, or the search bar to find specific papers.
nav: true
nav_order: 2
---

<!-- _pages/publications.md -->

<!-- Keyword filter bar -->

{% include keyword_filter.liquid %}

<!-- Text search -->

{% include bib_search.liquid %}

---

<div class="publications">

{% bibliography --group_by year --group_order descending %}

</div>
