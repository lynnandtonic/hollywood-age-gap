function toSortedMovieList (json) {
  var movies = [];
  var actors = json.actors;
  for (var i = 0; i < json.movies.length; i++) {
    var movie = json.movies[i];
    for (var j = 0; j < movie.relationships.length; j++) {
      var relationship = movie.relationships[j];
      var actor1 = actors[relationship[0]];
      var age1 = movie.year - new Date(actor1.born).getFullYear();
      var actor2 = actors[relationship[1]];
      var age2 = movie.year - new Date(actor2.born).getFullYear();
      var newMovie = {
        name: movie.name,
        difference: Math.abs(age1 - age2),
        relationship: [
          {
            age: age1,
            birthDate: actor1.born,
            gender: actor1.gender,
            name: actor1.name
          },
          {
            age: age2,
            birthDate: actor2.born,
            gender: actor2.gender,
            name: actor2.name
          }
        ],
        year: movie.year
      };
      movies.push(newMovie);
    }
  }
  movies.sort(function (a, b) {
    if (a.difference > b.difference) {
      return -1;
    } else if (a.difference < b.difference) {
      return 1;
    } else {
      if (a.name < b.name) {
        return -1;
      }
      if (a.name > b.name) {
        return 1;
      }
      return 0;
    }
  });
  return movies;
}

function csv(line) {
  return line
    .map(function (item) {
      return '"' + item + '"';
    })
    .join(',');
}

function movieListToCsv(movieList) {
  var output = [];
  output.push(csv(['Movie Name', 'Release Year', 'Age Difference', 'Actor 1 Name', 'Actor 1 Gender', 'Actor 1 Birthdate', 'Actor 1 Age', 'Actor 2 Name', 'Actor 2 Gender', 'Actor 2 Birthdate', 'Actor 2 Age']));
  for (var i = 0; i < movieList.length; i++) {
    var movie = movieList[i];
    var entry = [];
    entry.push(movie.name);
    entry.push(movie.year);
    entry.push(movie.difference);
    for (var j = 0; j < movie.relationship.length; j++) {
      var person = movie.relationship[j];
      entry.push(person.name);
      entry.push(person.gender);
      entry.push(person.birthDate);
      entry.push(person.age);
    }
    output.push(csv(entry));
  }
  return output.join('\n');
}

module.exports = {
  toSortedMovieList: toSortedMovieList,
  movieListToCsv: movieListToCsv
};
