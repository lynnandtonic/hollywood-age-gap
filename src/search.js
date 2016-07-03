var search = document.getElementById('search');
var cards = document.getElementsByClassName('card');
var searchableCardData = [];

for (var i = 0; i < cards.length; i++) {
  var card = cards[i];
  var titleEl = card.querySelector('h2');
  if (!titleEl) {
    continue;
  }
  var searchContext = {
    actorNames: [],
    card: card,
    title: titleEl.innerHTML,
    year: card.querySelector('.year').innerHTML
  };
  var actors = card.querySelectorAll('.actor .name');
  for (var j = 0; j < actors.length; j++) {
    searchContext.actorNames.push(actors.item(j).innerHTML);
  }
  searchableCardData.push(searchContext);
}

var raf = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.oRequestAnimationFrame || window.setTimeout;
function doSearch (el) {
  var searchTerm = new RegExp(el.target.value, 'i');
  var show = [];
  var hide = [];

  for (var i = 0; i < searchableCardData.length; i++) {
    var data = searchableCardData[i];
    var hasMatch = false;
    if (searchTerm.test(data.title)) {
      hasMatch = true;
    } else if (searchTerm.test(data.year)) {
      hasMatch = true;
    } else {
      for (var j = 0; j < data.actorNames.length; j++) {
        if (searchTerm.test(data.actorNames[j])) {
          hasMatch = true;
          j = data.actorNames.length;
        }
      }
    }

    if (hasMatch) {
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
