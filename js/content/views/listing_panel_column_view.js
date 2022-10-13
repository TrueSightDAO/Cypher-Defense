/** 
  The class that handles the logic within the detailed view
**/
var ListingPanelColumnView = Backbone.View.extend({
  className: "listing_panel_column",

  events: {
    "keypress .listing_panel_col_name_holder .col_name"  : "validateColName",    
    "keyup .listing_panel_col_name_holder .col_name"     : "updateColNameEvent",
    "change .listing_panel_required_attribute"           : "updateRequiredAttributeEvent",
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
      sample_data: self.parent_view.getSampleData()
    }));
    self.updateColNameStyle();
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
    if(self.parent_view.getColName() == self.parent_view.defaultColName()) {
      return self.defaultColName();
    } else {
      return self.parent_view.getColName();
    }
  },

  colHeaderTitle: function() {
    var self = this;
    return self.parent_view.defaultColName();
  }, 

  defaultColName: function() {
    var self = this;
    return self.parent_view.parent_view.getEmptyColNamePrompt();
  },

  updateColNameStyle: function() {
    var self = this;
    if(self.$el.find('.listing_panel_col_name_holder .col_name')[0].innerText == self.defaultColName()) {
      self.$el.find('.listing_panel_col_name_holder .col_name').addClass("empty");
    } else {
      self.$el.find('.listing_panel_col_name_holder .col_name').removeClass("empty");
    }
  },

  focusColName: function(e) {
    var self = this; 
    if( self.getColName() == self.defaultColName() ) {
      self.setColName("");
    }
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
    self.parent_view.clickedDeleteColumn(e);
  },  

  updateRequiredAttributeEvent: function(e) {
    var self = this;
    self.parent_view.updateRequiredAttribute(self.getRequiredAttribute(), self);
  },

  getRequiredAttribute: function() {
    var self = this;
    return self.$el.find(".listing_panel_required_attribute").val();
  },

  setRequiredAttribute: function(required_attribute) {
    var self = this;
    self.$el.find(".listing_panel_required_attribute option[value='" + required_attribute + "']").prop('selected', true);
  },  

  destroy: function() {
    var self = this;
    self.remove();  
  },

  dressUpDomsForPreview: function() {
    var self = this;
    self.parent_view.dressUpDomsForPreview();
  },

  undressDomsPreview: function() {
    var self = this;
    self.parent_view.undressDomsPreview();

  },  

  template: function() {
    return Application.templates['listing_panel_column'];
  }  
})