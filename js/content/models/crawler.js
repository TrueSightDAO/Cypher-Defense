var Crawler = Backbone.Model.extend({
  url: "crawler",  

  displayDownloadPanel: function(page_id) {
    var self = this;
    return self.fetch({
      method: 'displayDownloadPanel',
      data: {
        page_id: page_id
      },
      success: function(collection, response, options) {},
      error: function(collection, response, options) {}
    });
  }

})  