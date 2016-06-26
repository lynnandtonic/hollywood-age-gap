var Backbone = require('backbone');
var Movie = require('../models/Movie');

var Movies = Backbone.Collection.extend({

  model: Movie,

  comparator: function(model) {
    return -(model.get('difference'));
  }

});

module.exports = Movies;