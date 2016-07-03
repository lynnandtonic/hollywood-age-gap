var overlay = document.querySelector('.contribute.overlay');
var i = 0;

function showSearch (e) {
  e.preventDefault();
  overlay.classList.remove('hidden');
}

function hideSearch (e) {
  e.preventDefault();
  overlay.classList.add('hidden');
}

function potentiallyHideSearch (e) {
  // Esc key is 27.
  if (e.key === 'Escape' || e.keyCode === 27) {
    hideSearch(e);
  }
}

var entryPoints = document.querySelectorAll('.contribute-button');
for (i = 0; i < entryPoints.length; i++) {
  var entry = entryPoints[i];
  entry.addEventListener('click', showSearch, false);
}

var exitPoints = document.querySelectorAll('.contribute .back');
for (i = 0; i < exitPoints.length; i++) {
  var exit = exitPoints[i];
  exit.addEventListener('click', hideSearch, false);
}

document.addEventListener('keyup', potentiallyHideSearch, false);
