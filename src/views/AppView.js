var Backbone = require('backbone');
var SearchView = require('./SearchView');
var MovieListView = require('./MovieListView');

var AppView = Backbone.View.extend({

  el: 'body',

  events: {
    'keyup': '_handleKeyup'
  },

  initialize: function(options) {
    this._movies = options.movies;
  },

  _handleKeyup: function(event) {
    // Escape Key
    if (event.keyCode === 27) {
      document.location.href = '#';
    }
  },

  render: function() {
    this._searchView = new SearchView({
      movies: this._movies
    });
    this.$el.append(this._searchView.render().el);

    this._movieListView = new MovieListView({
      movies: this._movies
    });
    this.$el.append(this._movieListView.render().el);

    return this;
  }

});

module.exports = AppView;