var Page = Backbone.Model.extend({
  url: "kpage",
  destination: "background",

  load : function(page_id) {
    var self = this;
    return self.fetch({
      method: 'find',
      data: {
        page_id: page_id
      },
      success: function(collection, response, options) {
        Object.keys(response).forEach(function(attribute) {
          self.set(attribute, response[attribute]);
        });
      },
      error: function(collection, response, options) {}
    })
  }
});