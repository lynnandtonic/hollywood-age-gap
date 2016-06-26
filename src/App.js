var Backbone = require('backbone');
var jquery = require('jquery');

var Router = require('./AppRouter');

var data = require('../data');

Backbone.$ = jquery;

var Movies = require('./collections/Movies');
var AppView = require('./views/AppView');

var Application = function() {

  this.movies = new Movies(data.movies);

  this.appView = new AppView({
    movies: this.movies
  });

  this.appView.render();
  new Router({movies: this.movies});
  Backbone.history.start();
};

jquery(function() {
  var application = new Application();
});
