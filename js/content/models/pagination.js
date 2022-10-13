var Pagination = Backbone.Model.extend({
  url: "kpagination",  

  load : function() {
    var self = this;
    return self.fetch({
      method: 'create',
      success: function(collection, response, options) {
        Object.keys(response).forEach(function(attribute) {
          self.set(attribute, response[attribute]);
        });
      },
      error: function(collection, response, options) {}
    })
  },

  isSet: function() {
    var self = this;
    return self.get("has_pagination");
  }

});