var Column = Backbone.Model.extend({
  url: "kcolumns",  

  /** List of characters that are not allowed for use in col_names **/
  disabled_keycodes : {
    break_line: 13,
    single_quote: 39,
    double_quote: 34,
    back_slash: 92
  },  

  forTemplate: function() {
    var self = this;
    var json_obj  = {};
    json_obj.id         = self.get('id');    
    json_obj.col_name   = self.get('col_name');
    json_obj.col_dom_id = self.get('col_dom_id');
    return json_obj;
  },

  defaultColName: function() {
    var self = this;     
    return self.attributes.default_col_name;
  },  

  belongsToPage: function(page_id) {
    var self = this;
    return page_id == self.get('page_id');
  },

  /**
    Checks if the dom_array has elements already selected for this Column

    Returns Boolean
  **/
  domArrayNotEmpty: function() {
    var self = this;
    return self.get("dom_array") && 
        self.get("dom_array").length > 0;

  },

  /**
    Checks if there are recommended dom additions for this Column

    Returns Boolean
  **/
  hasRecommendations: function() {
    var self = this;
    return self.get("recommended_array") && 
        self.get("recommended_array").length > 0;
  },

  mergeInNewSelections: function(new_dom_array, outer_dom_array) {
    var self = this;

    return self.fetch({
      method: 'merge',
      data: {
        id: self.id,
        new_array_dom: new_dom_array,
        outer_dom_array: outer_dom_array
      },
      success: function(model, response, option) {},
      error: function(model, response, option) {}
    });
  },

  clearDomArray: function() {
    var self = this;

    return self.fetch({
      method: 'reset_dom',
      data: {
        id: self.id
      },
      success: function(model, response, option) {},
      error: function(model, response, option) {}
    });
  },

  setRecommendationsToSelected: function() {
    
  },

  getColor: function(type) {
    var self = this;
    return self.get("colors")[type];
  },

  fullDomQuery: function() {
    var self = this;
    var query = self.get("dom_query");
    if(self.get("outer_dom_query") && self.get("outer_dom_query").length > 0)  {
      query = self.get("outer_dom_query") + " " + query;
    }    
    return query;
  },

  domCountQuery: function() {
    var self = this;
    var query = self.get("dom_query");
    if(self.get("outer_dom_query") && self.get("outer_dom_query").length > 0)  {
      query = self.get("outer_dom_query");
    }    
    return query;
  }  


});

var Columns = Backbone.Collection.extend({
  model: Column,
  url: "kcolumns",

  newColumn: function( new_attributes, success_cb, failure_cb ) {
    var self = this;
    return self.create(new_attributes, {
      success: function(model, response, options) {
        success_cb && success_cb(model);
      },
      error: function(collection, response, options) {
        failure_cb && failure_cb(arguments)
      }
    });


  },

  forPage: function(page_id) {
    var self = this;
    return self.where({ page_id: page_id });
  }

});