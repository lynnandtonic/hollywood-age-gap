var Backbone = require('backbone');
var markdown = require('markdown').markdown;

var Movie = Backbone.Model.extend({

  defaults: {
    id: 'movie-title-year',
    name: 'Movie Title',
    year: '1995',
    actor1: 'Colin Firth',
    age1: '53',
    actor2: 'Emma Stone',
    age2: '25',
    difference: '28',
    visible: true,
    showDetail: false
  }

});

module.exports = Movie;