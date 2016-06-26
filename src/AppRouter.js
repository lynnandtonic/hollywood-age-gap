var Backbone = require('backbone');
var ContributeView = require('./views/ContributeView');

var Router = Backbone.Router.extend({

  views: [],

  initialize: function(options) {
    this.movies = options.movies;
    this._lastOffset = 0;
  },

  routes: {
    "contribute":      "contribute",
    "*path":           "default"
  },

  _hideContribute: function() {
    if (this._contributeView) {
      this._contributeView.hide();
    }
  },

  _resetOffset: function() {
    Backbone.$(window).scrollTop(this._lastOffset);
  },

  _trackView: function(page, title) {
    if (window.ga) {
      ga('send', 'pageview', {
        'page': page,
        'title': title
      });
    }
  },

  default: function() {
    this._hideContribute();
    this._resetOffset();

    Backbone.$('body').removeClass('detail-open');
  },

  contribute: function() {
    if (!this._contributeView) {
      this._contributeView = new ContributeView();
      Backbone.$('body').append(this._contributeView.render().el);
    }

    this._contributeView.show();
    this._hideMovies();
    this._lastOffset = (window.scrollY === undefined) ? window.pageYOffset : window.scrollY;

    Backbone.$('body').addClass('detail-open');
    this._trackView('#contribute', 'Contribute');
  },

});

module.exports = Router;
