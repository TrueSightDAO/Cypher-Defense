var Tutorial = Backbone.Model.extend({
  url: "tutorial",

  start: function() {
    var self = this;
    return self.fetch({
      method: 'start',
      data: {},
      success: function(collection, response, options) {
        console.log("successfully triggered tutorial");
      },
      error: function(collection, response, options) {
        console.log("failed to trigger tutorial");
      }
    })
  }

});