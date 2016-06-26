var Backbone = require('backbone');
var template = require('./templates/SearchView.jade');

var _ = require('underscore');

var SEARCH_FIELD = [
  'name', 'actor1', 'actor2', 'year'
];

var SearchView = Backbone.View.extend({

  tagName: 'header',

  events: {
    'keyup input': '_handleKey',
    'click button.clear': '_handleReset'
  },

  initialize: function(options) {
    this.movies = options.movies;
  },

  _handleKey: function(event) {
    var $el = this.$(event.target);
    this._search($el.val());
  },

  _handleReset: function(event) {
    event.preventDefault();
    this.$('input').val('').keyup();
  },

  _search: function(value) {
    var searchTerm = new RegExp('^'+value, 'gi');
    var results = [];
    var movies = this.movies;

    movies.each(function(movie) {
      var hasMatch = false;

      // Search each field
      for(var i=0;i<SEARCH_FIELD.length;i++) {
        var key = SEARCH_FIELD[i];

        // Validate we match
        if(searchTerm.test(movie.get(key))) {
          hasMatch = true;
          break;
        }
      }

      results.push({
        model: movie,
        visible: hasMatch
      });

    });

    _.each(results, function(result) {
      result.model.set('visible', result.visible);
    });

  },

  render: function() {
    this.$el.html(template());
    return this;
  }

});

module.exports = SearchView;