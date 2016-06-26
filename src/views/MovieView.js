var Backbone = require('backbone');
var template = require('./templates/MovieView.jade');
var SocialView = require('./SocialView');

var MovieView = Backbone.View.extend({

  tagName: 'li',
  className: 'card',

  initialize: function() {
    this.model.on('change:visible', this._setClassName, this);
  },

  viewModel: function() {
    return {
      id: this.model.get('id'),
      name: this.model.get('name'),
      year: this.model.get('year'),
      actor1: this.model.get('actor1'),
      age1: this.model.get('age1'),
      gender1: this.model.get('gender1'),
      actor2: this.model.get('actor2'),
      age2: this.model.get('age2'),
      gender2: this.model.get('gender2'),
      difference: this.model.get('difference')
    };
  },

  isVisible: function() {
    return this.model.get('visible');
  },

  _setClassName: function() {
    this.$el.addClass(this.model.get('id'));
    this.$el.toggleClass('loaded', this.loaded);
    this.$el.toggleClass('hidden', !this.model.get('visible'));
  },

  lazyLoad: function() {
    var img = new Image();
    img.src = this.imageUrl;

    var self = this;

    var handleLoad = function() {
      clearTimeout(loadTimeout);
      img.onload = null;

      self.loading = false;
      self.loaded = true;
      self._setClassName();

      img = null;
    };

    img.onload = handleLoad;
    var loadTimeout = setTimeout(handleLoad, 10000);

    this.loading = true;
  },

  render: function() {
    this.$el.html(template(this.viewModel()));
    this._renderSocialViews();
    return this;
  },

  _renderSocialViews: function() {
    if (!this._twitter) {
      this._twitter = new SocialView({
        url: 'https://twitter.com/intent/tweet?url=$SHARE_URL&text=$TEXT',
        type: 'twitter',
        text: 'In “' + this.model.get('name') + '”, the age difference b/w ' + this.model.get('actor1') + ' and ' + this.model.get('actor2') + ' is ' + this.model.get('difference') + ' years.',
        share_url: 'http://hollywoodagegap.com'
      });
      this._twitter.render();
    }

    if (!this._facebook) {
      this._facebook = new SocialView({
        url: 'https://www.facebook.com/sharer/sharer.php?u=$SHARE_URL',
        type: 'facebook',
        share_url: 'http://hollywoodagegap.com'
      });
      this._facebook.render();
    }

    this.$('.social-container').append([this._twitter.el, this._facebook.el]);
  }

});

module.exports = MovieView;
