var search = document.getElementById('search');
var cards = document.getElementsByClassName('card');
var searchableCardData = [];

function normalize (str) {
  return str
    .toLowerCase()
    .replace(/[‘’‚‛ʼ]/g, "'")  // U+2018 U+2019 U+201A U+201B U+02BC
    .replace(/[“”„‟]/g, '"')   // U+201C U+201D U+201E U+201F
    .replace(/\band\b/g, '&');
}

for (var i = 0; i < cards.length; i++) {
  var card = cards[i];
  var titleEl = card.querySelector('h2');
  if (!titleEl) {
    continue;
  }
  var fields = [
    titleEl.textContent,
    card.querySelector('.year').textContent,
    card.querySelector('.director').textContent,
    card.querySelector('.franchise').textContent
  ];
  var actors = card.querySelectorAll('.actor .name');
  for (var j = 0; j < actors.length; j++) {
    fields.push(actors.item(j).textContent);
  }
  searchableCardData.push({
    card: card,
    searchText: normalize(fields.join('\n'))
  });
}

var raf = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.oRequestAnimationFrame || window.setTimeout;
function doSearch (el) {
  var searchTerm = normalize(el.target.value);
  var show = [];
  var hide = [];

  for (var i = 0; i < searchableCardData.length; i++) {
    var data = searchableCardData[i];
    if (data.searchText.indexOf(searchTerm) !== -1) {
      show.push(data.card);
    } else {
      hide.push(data.card);
    }
  }

  raf(function () {
    var i;
    for (i = 0; i < show.length; i++) {
      show[i].classList.remove('hidden');
    }
    for (i = 0; i < hide.length; i++) {
      hide[i].classList.add('hidden');
    }
  });
}

search.addEventListener('keyup', doSearch, false);

function doClear () {
  search.value = '';
  for (var i = 0; i < searchableCardData.length; i++) {
    searchableCardData[i].card.classList.remove('hidden');
  }
}

var button = document.getElementsByClassName('clear')[0];
button.addEventListener('click', doClear, false);
