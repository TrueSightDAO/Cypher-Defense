/** 
  The class that handles the logic within the detailed view
**/
var RecommendedPanelColumnView = Backbone.View.extend({
  className: "recommended_panel_column",

  events: {
    "click .recommend-checkbox" : "clickedRecommendation",
    "mouseover"                 : "dressUpDomsForPreview",
    "mouseout"                  : "undressDomsPreview"

  },

  initialize: function(opts) {
    var self                    = this;
    self.model                  = opts.model;
    self.parent_view            = opts.parent_view;
    self.render();

    _.bindAll(self, 
      "clickedRecommendation",
      "dressUpDomsForPreview",
      "undressDomsPreview"
    );
  },  

  render: function() {
    var self = this;
    var template = self.template();
    self.$el.html(template({
      col_name: self.model.get("col_name"),
      selected: self.model.get("selected"),
      counter: $(self.model.domCountQuery()).length
    }));
  },

  refreshCounter: function() {
    var self = this;
    self.$el.find(".recommendation-counter").html($(self.model.domCountQuery()).length);
  },

  clickedRecommendation: function(e) {
    e.stopPropagation();    
    var self = this;
    
    if(self.$el.find(".recommend-checkbox").is(':checked')) {
      self.parent_view.recommendationSelected(e);
    } else {
      self.parent_view.recommendationDeselected(e, self);
    }
    
  },

  recommendationSelected: function() {
    var self = this;
    self.$el.find(".recommend-checkbox").prop('checked', true);
  },

  recommendationDeselected: function() {
    var self = this;
    self.$el.find(".recommend-checkbox").prop('checked', false);
  },

  dressUpDomsForPreview: function() {
    var self = this;
    self.parent_view.dressUpDomsForPreview();
  },

  undressDomsPreview: function() {
    var self = this;
    self.parent_view.undressDomsPreview();

  },  

  setColName: function(new_col_name) {
    var self = this;
    self.$el.find(".recommendation-col_name").html(new_col_name);
  },

  destroy: function() {
    var self = this;
    self.remove();  
  },

  template: function() {
    return Application.templates['recommended_panel_column'];
  }    

});