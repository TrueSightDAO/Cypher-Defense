var RecommendedColumn = Backbone.Model.extend({
  url: "krecommended_columns",

  /** List of characters that are not allowed for use in col_names **/
  disabled_keycodes : {
    break_line: 13,
    single_quote: 39,
    double_quote: 34,
    back_slash: 92
  },  

  fullDomQuery: function() {
    var self = this;
    if (self.get("dom_query") && self.get("outer_dom_query")) {
      return self.get("outer_dom_query") + " " + self.get("dom_query");
    } else if (self.get("dom_query")) {
      return self.get("dom_query");
    } else {
      return "";
    }

  },

  domCountQuery: function() {
    var self = this;
    if (self.get("dom_query") && self.get("outer_dom_query")) {
      return self.get("outer_dom_query") + " " + self.get("dom_query");
    } else if (self.get("dom_query")) {
      return self.get("dom_query");
    } else {
      return "";
    }

  },  

  hasContentInPage: function($el) {
    var self = this;
    try {
      if ($el.find(self.fullDomQuery()).length == 0) {
        return false;  
      } 

      var has_no_attributes = true;
      $el.find(self.fullDomQuery()).each(function(index, item) {
        var sample_data = self.fetchDataInContext(item);

        if( self.get("regex_pattern") ) {
          var regex = new RegExp(self.get("regex_pattern"));
          var regex_result = sample_data.match(regex);
          if (regex_result) {
            has_no_attributes = false;
            return;
          }

        } else {
          if(sample_data) {
            has_no_attributes = false;
            return;
          }
        }
      });
      if(has_no_attributes) {
        return false;  
      } else {
        return true;
      }
      
    } catch(err) { 
      console.groupEnd("Error encountered " + err);
      return false;

    }
    
  },

  fetchDataInContext: function(item) {
    var self = this;
    var required_attribute = self.get("required_attribute");

    if (!required_attribute) {
      return item.innerText;

    } else if(required_attribute == "inner_text") {
      return item.innerText;

    } else {
      return $(item).attr(required_attribute);
    }
  },

  defaultColName: function() {
    var self = this;     
    return self.get('default_col_name');
  },    

  forTemplate: function() {
    var self = this;
    var json_obj  = {};
    json_obj.id               = self.get('id');    
    json_obj.default_col_name = self.get('default_col_name');
    json_obj.col_name         = self.get('col_name');
    return json_obj;
  }  
})

var RecommendedColumns = Backbone.Collection.extend({
  model: RecommendedColumn,
  url: "krecommended_columns",
  
  newRecommendedColumn: function( new_attributes, success_cb, failure_cb ) {
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


  forPage: function($el) {
    var self = this;

    filtered = self.filter(function (rec_column) {
      return rec_column.hasContentInPage($el);
    });
    return new RecommendedColumns(filtered);
  },

  findByColName: function(col_name) {
    var self = this;
    return self.filter(function(item){
      return item.get('col_name').includes(col_name);
    });
  },

  fetchAttributes: function() {
    var self = this;
    return self.map(function(item) {
      return item.attributes;
    })
  }




});
