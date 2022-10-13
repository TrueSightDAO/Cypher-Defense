/** 
  The class that handles the logic within the detailed view
**/
var ListingPanelRecommendedColumnView = Backbone.View.extend({
  className: "listing_panel_column",

  events: {
    "keypress .listing_panel_col_name_holder .col_name"  : "validateColName",    
    "keyup .listing_panel_col_name_holder .col_name"     : "updateColNameEvent",
    "focus .listing_panel_col_name_holder .col_name"     : "focusColName",
    "focusout .listing_panel_col_name_holder .col_name"  : "unfocusColName",
    "click"                                              : "clickedColumn",
    "click .delete-icon"                                 : "clickedDeleteColumn",
    "mouseover"                                          : "dressUpDomsForPreview",
    "mouseout"                                           : "undressDomsPreview"    
  },

  initialize: function(opts) {
    var self                    = this;
    self.model                  = opts.model;
    self.parent_view            = opts.parent_view;
    self.render();

    _.bindAll(self, 
      "dressUpDomsForPreview",
      "undressDomsPreview"
    );    
  },

  render: function() {
    var self = this;
    var template = self.template();
    self.$el.html(template({
      col_header: self.colHeaderTitle(),
      col_name: self.getInitialColName(),
      sample_data: self.parent_view.getSampleData(),
      required_attribute: self.getRequiredAttribute(),
      required_attribute_display: self.getRequiredAttributeDisplayText()
    }));
    self.updateColNameStyle();
  },



  refreshSampleData: function() {
    var self = this;
    self.$el.find(".listing-panel-sample-data-content").html("");
    self.$el.find(".listing-panel-sample-data-content").append(self.parent_view.getSampleData());
  },


  activate: function() {
    var self = this;
    self.$el.addClass('active');
  },

  deactivate: function() {
    var self = this;
    self.$el.removeClass('active');
  },  

  setSampleData: function(sample_data) {
    var self = this;
    self.$el.find(".listing-panel-sample-data-content").html("")
    self.$el.find(".listing-panel-sample-data-content").append(sample_data);    
  },

  updateColNameEvent: function(e) {
    var self = this;
    self.updateColNameStyle();
    if(self.$el.find('.listing_panel_col_name_holder .col_name')[0].innerText.length == 0) return;
    var new_col_name = self.$el.find('.listing_panel_col_name_holder .col_name')[0].innerText;

    self.parent_view.updateColName(new_col_name, self);
  },

  getInitialColName: function() {
    var self = this;
    return self.parent_view.getColName();
  },

  colHeaderTitle: function() {
    var self = this;
    return self.parent_view.defaultColName();
  }, 

  defaultColName: function() {
    var self = this;
    return self.parent_view.defaultColName();
  },

  updateColNameStyle: function() {
    var self = this;
    // if(self.$el.find('.listing_panel_col_name_holder .col_name')[0].innerText == self.defaultColName()) {
    //   self.$el.find('.listing_panel_col_name_holder .col_name').addClass("empty");
    // } else {
    //   self.$el.find('.listing_panel_col_name_holder .col_name').removeClass("empty");      
    // }
  },

  focusColName: function(e) {
    var self = this; 
  },

  unfocusColName: function(e) {
    var self = this;
    if( self.getColName().trim().length == 0 ) {
      self.parent_view.updateColName(self.defaultColName());
    }
    self.updateColNameStyle();        
  }, 

  getColName: function() {
    var self = this;
    return self.$el.find(".col_name").text().trim();
  },  

  setColName: function(new_col_name) {
    var self = this;
    self.$el.find(".listing_panel_col_name_holder .col_name").html(new_col_name)
  },  

  validateColName: function(e) {
    var self = this;
    var disallowed_keycodes = Object.keys(self.model.disabled_keycodes).map(function(key){
      return self.model.disabled_keycodes[key];
    });

    if(disallowed_keycodes.indexOf(e.keyCode) != -1 ) e.preventDefault();
    if(self.model.disabled_keycodes["break_line"] == e.keyCode) $(e.currentTarget).blur()

  },  

  clickedColumn: function(e) {
    var self = this;
    self.parent_view.clickedColumn(e);
  },

  clickedDeleteColumn: function(e) {
    e.stopPropagation();
    var self = this;
    self.parent_view.recommendationDeselected(e, self);
  },  

  getRequiredAttribute: function() {
    var self = this;
    var the_attribute = self.model.get("required_attribute");
    if(!the_attribute) {
      the_attribute = "inner_text";
    }
    return the_attribute;
  },

  getRequiredAttributeDisplayText: function() {
    var self = this;
    var the_attribute = self.getRequiredAttribute();
    switch(the_attribute) {
      case "inner_text":
        return "inner text"
        break;
      case "href":
        return "hyperlink"
        break;
      case "src":
        return "source"
        break;
      case "inner_html":
        return "inner html"
        break;
            
      default:
        return the_attribute;
    }    
  },

  dressUpDomsForPreview: function() {
    var self = this;
    self.parent_view.dressUpDomsForPreview();
  },

  undressDomsPreview: function() {
    var self = this;
    self.parent_view.undressDomsPreview();

  },  

  destroy: function() {
    var self = this;
    self.remove();  
  },


  template: function() {
    return Application.templates['listing_panel_recommended_column'];
  }  
})