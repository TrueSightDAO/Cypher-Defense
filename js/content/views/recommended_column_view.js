/**
  That class that handles dom selection events
**/
var RecommendedColumnView = Backbone.View.extend({

  className: "column rec-col",

  events: {
    "click"               : "clickedColumn",
    "mouseover"           : "mouseOverEvent",
    "mouseout"            : "mouseOutEvent",
    "selected"            : "recommendationSelected",
    "deselected"          : "recommendationDeselected",
    "click .delete"       : "recommendationDeselected"
  },  


  initialize: function(opts) {
    var self                    = this;
    self.model                  = opts.model;
    self.parent_view            = opts.parent_view;
    self.dc_view                = new DomArrayGenerator();
    self.render();

    _.bindAll(self, 
      "clickedColumn",
      "recommendationSelected",
      "recommendationDeselected"
    );    
  },

  render: function() {
    var self      = this;
    var data      = self.model.forTemplate();
    var template  = self.template();
    self.$el.html(template(data));
    self.renderCounter();
    self.renderListingPanelView();
    self.renderRecommendationsPanelView();
    return self;
  },  

  renderListingPanelView: function() {
    var self = this;

    self.listing_panel_view = new ListingPanelRecommendedColumnView({
      model: self.model,
      parent_view: self
    });    
  },

  refreshCounter: function() {
    var self = this;
    self.renderCounter();
    self.recommended_panel_view && self.recommended_panel_view.refreshCounter();    
    if(self.model.get("is_active")) {
      self.dressUpSelectedDoms();
    }
  },

  hasOuterDomQuery: function() {
    var self = this;    
    return self.model.get("outer_dom_query") ? true : false;
  },

  hasAssCount: function() {
    var self = this;    
    return self.model.get("ass_count") ? true : false;    
  },

  assCount: function() {
    var self = this;    
    return self.model.get("ass_count");    
  },

  elementsCount: function() {
    var self = this;
    var countables = self.getCountables();
    return countables.length;
  },

  renderCounter: function() {
    var self = this;
    var countables = self.getCountables();

    self.$el.find(".counter").html(countables.length);
    self.$el.find(".counter").attr("tooltip-content", "Recommended Column: " + self.model.get("col_name"));
    self.parent_view.renderDisplayMode();

  },  

  renderRecommendationsPanelView: function() {
    var self = this;

    self.recommended_panel_view = new RecommendedPanelColumnView({
      model: self.model,
      parent_view: self
    });    
  },  

  recommendationSelected: function(e) {
    e.stopPropagation();
    var self = this;
    self.model.set("selected", true);
    self.model.save();    
    
    self.parent_view.selectedRecommendationEvent(self);
    self.recommended_panel_view.recommendationSelected();
    self.activate();    
  },
  
  recommendationDeselected: function(e, source) {
    e.stopPropagation();    

    var self = this;
    self.model.set("selected", false);
    self.model.save();    

    source = source || self;
    self.parent_view.deselectedRecommendationEvent(self, source);
    self.recommended_panel_view.recommendationDeselected();    
    self.undressDomsPreview();    
    self.deactivate();
  },

  clickedColumn: function(e) {
    var self = this;
    if(self.$el.hasClass('active')) return;
    self.activate();
  },

  /**
    Called when this column starts being the active column. Note: There can only be one active column per Tab
  **/
  activate: function() {
    var self = this;
    self.parent_view.activeRecommendedColumnViewChanged(self);    
    self.parent_view.activateRecommendationsMode();
    self.parent_view.deactivateSubViews([], false, [self.model.id]);
    self.parent_view.renderDisplayMode();
    self.listing_panel_view.activate();

    self.model.set("is_active", true);
    self.model.save();
    self.$el.addClass('active');
    self.recommended_panel_view.$el.addClass('active');
    self.dressUpSelectedDoms();
    
  },  

  /**
    Called when this column stops being the active column for this page. Note: There can only be one active column per Tab
  **/
  deactivate: function() {
    var self = this;
    self.model.set("is_active", false);
    self.$el.removeClass('active');
    self.recommended_panel_view.$el.removeClass('active');
    self.listing_panel_view.deactivate();    
    self.model.save();
    self.undressSelectedDoms();
  },


  getCountables: function() {
    var self = this;
    var countables = $(self.model.domCountQuery()).filter(function(index, dom) {
      return !self.dc_view.isReserved(dom);
    });    
    return countables;
  },

  mouseOverEvent: function(e) {
    var self = this; 
    if(self.$el.hasClass('active')) return;
    self.dressUpDomsForPreview();
  },

  mouseOutEvent: function(e) {
    var self = this; 
    self.undressDomsPreview();
  },

  /**
    styles selected dom when activate happens
  **/
  dressUpDomsForPreview: function() {
    var self = this;
    var doms = $(self.model.fullDomQuery());
    _.each(doms, function(dom) {
      if(self.dc_view.isReserved(dom) || self.selectedDomAlreadyDressedUp(dom)) return;
      $(dom).addClass('getdata-selectable-dom');
    });

    if(self.model.get("outer_dom_query")) {
      var outer_doms = $(self.model.get("outer_dom_query"));      
      outer_doms.each(function(index, dom) {
        $(dom).addClass('getdata-selectable-outer-dom-shadow');
      });
    }        
  },

  /**
    Removes the styling of selected dom when activate happens
  **/
  undressDomsPreview: function() {
    var self = this;
    var doms = $(self.model.fullDomQuery());
    _.each(doms, function(dom) {
      $(dom).removeClass('getdata-selectable-dom')
    });

    if(self.model.get("outer_dom_query")) {
      var outer_doms = $(self.model.get("outer_dom_query"));      
      outer_doms.each(function(index, dom) {
        $(dom).removeClass('getdata-selectable-outer-dom-shadow');
      });
    }    
  },


  /**
    styles selected dom when activate happens
  **/
  dressUpSelectedDoms: function() {
    var self = this;
    if(!self.model || !self.model.fullDomQuery() || self.model.fullDomQuery().length == 0 ) { return; }
    console.log("dressing up recommended column view " + self.model.fullDomQuery());    
    var doms = $(self.model.fullDomQuery());
    doms.each(function(index, dom) {
      if(self.dc_view.isReserved(dom) || self.selectedDomAlreadyDressedUp(dom)) return;
      $(dom).addClass('getdata-selected-dom');
    });

    if(self.model.get("outer_dom_query")) {
      var outer_doms = $(self.model.get("outer_dom_query"));      
      outer_doms.each(function(index, dom) {
        $(dom).addClass('getdata-selected-outer-dom-shadow');
      });
    }
  },

  /**
    Removes the styling of selected dom when activate happens
  **/
  undressSelectedDoms: function() {
    var self = this;
    var doms = $(self.model.fullDomQuery());
    doms.each(function(index, dom) {
      $(dom).removeClass('getdata-selected-dom');
    });

    if(self.model.get("outer_dom_query")) {
      var outer_doms = $(self.model.get("outer_dom_query"));      
      outer_doms.each(function(index, dom) {
        $(dom).removeClass('getdata-selected-outer-dom-shadow');
      });
    }    
  },


  /**
    Checks if dom is already selected and has a corresponding selected_dom_view
  **/
  selectedDomAlreadyDressedUp: function(dom) {
    var self = this;
    $(dom).hasClass('getdata-selected-dom');
  },

  getColName: function() {
    var self = this;
    return self.model.get("col_name");
  },  

  defaultColName: function() {
    var self = this;     
    return self.model.defaultColName();
  },

  resetColName: function() {
    var self = this;
    self.recommended_panel_view.setColName(self.model.get("col_name"));
  },

  updateColName: function(new_col_name, event_source) {  
    var self = this;
    self.model.set("col_name", new_col_name);
    self.model.save();

    switch(event_source) {
      case self.listing_panel_view:    
        self.recommended_panel_view.setColName(new_col_name);
        break;
      default:
        self.recommended_panel_view.setColName(new_col_name);
        self.listing_panel_view.setColName(new_col_name);
    }
    
  },

  refreshSampleData: function() {
    var self = this;
    self.listing_panel_view.refreshSampleData();
  },

  getSampleData: function() {
    var self = this;
    var doms = $(self.model.fullDomQuery());

    if(doms.length > 0 ) {
      var sample_dom = doms[0];
      if (self.model.attributes.regex_pattern) {
        return self.getRegexSampleData(sample_dom);  

      } else {
        return self.getNormalSampleData(sample_dom);  
      }
      

    } else {
      return "no sample data available yet"
    } 
  },


  getNormalSampleData: function(sample_dom) {
    var self = this;
    if(self.model.attributes.required_attribute && 
      self.model.attributes.required_attribute == "src" && 
      $(sample_dom).is("img")
    ) {
      var new_sample_image = $("<img>", {src: sample_dom.src});
      return new_sample_image;

    } else if(self.model.attributes.required_attribute && 
      self.model.attributes.required_attribute == "src" && 
      $(sample_dom).is("iframe")
    ) {
      var new_sample_link = $("<a>", {href: sample_dom.src, text: "Source: "+sample_dom.src});
      return new_sample_link;

    } else if(self.model.attributes.required_attribute  == "href") {
      var new_sample_link = $("<a>", {href: sample_dom.href, text: "Link: "+sample_dom.href});
      return new_sample_link;

    } else if(self.model.attributes.required_attribute  == "src") {
      var new_sample_link = $("<a>", {href: sample_dom.src, text: "Source: "+sample_dom.src});
      return new_sample_link;        

    } else if(self.model.attributes.required_attribute  == "inner_text") {
      return sample_dom.innerText;

    } else {
      return sample_dom.innerText;
    }

  },

  getRegexSampleData: function(sample_dom) {
    var self = this;
    if(self.model.attributes.required_attribute  == "inner_text") {
      return self.applyRegexFilter(sample_dom.innerText);

    } else if (self.model.attributes.required_attribute) {
      var sample_value = $(sample_dom).attr(self.model.attributes.required_attribute);
      return self.applyRegexFilter(sample_value);

    } else {
      return self.applyRegexFilter(sample_dom.innerText);
    }
  },

  applyRegexFilter: function(result) {
    var self = this;
    if(self.model.attributes.regex_pattern) {
      var regex = new RegExp(self.model.attributes.regex_pattern);
      var regex_result = result.match(regex);
      
      if(!regex_result) {
        return "No matching value";
        
      } else if(self.model.attributes.regex_group) {
        return regex_result[self.model.attributes.regex_group];

      } else {
        return regex_result[0];
      }
    }
    return result;
  },

  /**
    Removes this view and all its sub elements
    Called when the extension get deactivated    
  **/
  destroy: function() {
    var self = this;
    self.undressSelectedDoms();
    self.listing_panel_view.destroy();
    self.recommended_panel_view.destroy();
    self.remove();  
  },  

  template: function() {
    return Application.templates['column'];
  },

  getRankingScore: function() {
    var self = this;
    var ranking = 0;
    if(self.hasAssCount()) {
      ranking += self.model.get("ass_count") * 10000;
    }
    if(self.hasOuterDomQuery()) {
      ranking += 1000; 
    }
    ranking += self.elementsCount(); 
  }

});