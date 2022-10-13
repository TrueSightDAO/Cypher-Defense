var Page = Backbone.Model.extend({
  url: "kpage",

  load : function(options) {
    options = options || {};
    var self = this;
    return self.fetch({
      method: 'create',
      data: {
        domain: Env.getDomain(),
        origin_url: Env.getLocation(),
        description: Env.getPageDescription(),
        keywords: Env.getPageKeywords(),
        element_count: options.initial_element_count
      },
      success: function(collection, response, options) {
        Object.keys(response).forEach(function(attribute) {
          self.set(attribute, response[attribute]);
        });
      },
      error: function(collection, response, options) {}
    })
  },

  refresh : function(options) {
    options = options || {};
    var self = this;
    return self.fetch({
      method: 'refresh',
      data: {
        origin_url: Env.getLocation()
      },
      success: function(collection, response, options) {
        Object.keys(response).forEach(function(attribute) {
          self.set(attribute, response[attribute]);
        });
      },
      error: function(collection, response, options) {}
    })
  },  

  setScrollHeight: function(new_scroll_height) {
    var self = this;
    if(self.get('infinite_scroll')) { 
      return;
    } else {
      if(self.get('scroll_height') && self.get('scroll_height') * 1.5 < new_scroll_height ) {
        self.set('infinite_scroll', true);
      } 
      self.set('scroll_height', new_scroll_height);
      self.save();
    }
  },

  setElementCount: function(new_element_count) {
    var self = this;
    if(self.get('has_ajax')) {
      return;
    } else {
      if(self.get('element_count') && self.get('element_count') + 100 < new_element_count) {
        self.set('has_ajax', true);
      }
      self.set('element_count', new_element_count);
      self.save();
    }
  }

});