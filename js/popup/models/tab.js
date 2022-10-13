var Tab = Backbone.Model.extend({
  url: "ktab",
  destination: "background",

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
    });
  },

  dispatch : function(page_id) {
    var self = this;
    return self.fetch({
      method: 'dispatch',
      data: {
        page_id: page_id
      },
      success: function(collection, response, options) {},
      error: function(collection, response, options) {}
    });
  },

  sessionStatus: function() {
    var self = this;
    return self.fetch({
      method: 'sessionStatus',
      success: function(collection, response, options) {},
      error: function(collection, response, options) {}
    });    
  },

  fetchRecipe: function(page_id) {
    var self = this;
    return self.fetch({
      method: 'compile',
      data: {
        page_id: page_id
      },
      success: function(collection, response, options) {},
      error: function(collection, response, options) {}
    });
  },

  compile : function(page_id) {
    var self = this;

    return self.fetch({
      method: 'compile',
      data: {
        page_id: page_id
      },
      success: function(collection, response, options) {},
      error: function(collection, response, options) {}
    });    

  },

  createDataSource: function(page_id) {
    var self = this;

    return self.fetch({
      method: 'createDataSource',
      data: {
        page_id: page_id
      },
      success: function(collection, response, options) {},
      error: function(collection, response, options) {}
    });        

  },

  saveGatheredData: function(page_id, gathered_data, download_status) {
    var self = this;
    return self.fetch({
      method: 'saveGatheredData',
      data: {
        page_id: page_id,
        gathered_data: gathered_data,
        download_status: download_status
      },
      success: function(collection, response, options) {},
      error: function(collection, response, options) {}
    });            
  },

  recordDownload: function(page_id, download_format) {
    var self = this;
    return self.fetch({
      method: 'recordDownload',
      data: {
        page_id: page_id,
        download_format: download_format,
        download_status: 0
      },
      success: function(collection, response, options) {},
      error: function(collection, response, options) {}
    });            
  },

  deactivate : function() {
    var self = this;
    return self.fetch({
      method: 'deactivate',
      data: {
        tab_id: self.id
      }
    })
  }

});