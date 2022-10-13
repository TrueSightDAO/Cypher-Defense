/**
  That class that handles dom selection events
**/
var ColumnView = Backbone.View.extend({

  className: "column",

  events: {
    "keypress .col-name"  : "validateColName",
    "mouseover"           : "mouseOverEvent",
    "mouseout"            : "mouseOutEvent",
    "click .delete"       : "clickedDeleteColumn",
    "click"               : "clickedColumn"
  },

  /** List of all the DOM elements within a HTML Dom that are selectable **/
  selectable_doms: [ 
    "h1", "h2", "h3", "h4", "h5", "h6", 
    "p", "img", "a", "li", "b", "i",
    "span", "cite",
    "div",
    "td:not(:has(td, img))",
    "th", "dd", "dt", "code"
  ],

  /** List of all the DOM elements within a HTML Dom that selectable DOM elements must not contain **/
  disallowed_children: [
    "p", "td", "li"
  ],

  /** List of characters that are not allowed for use in col_names **/
  disabled_keycodes : {
    break_line: 13,
    single_quote: 39,
    double_quote: 34,
    back_slash: 92
  },

  states: {
    not_page:   "other_page",           // When the column does not belong to this page
    fresh:      "fresh",                // When no DOM elements have been selected for this column
    recommends: "showing_recommends",   // When the initial DOM elements have already been selected and we have more to recommended
    fixed:      "fixed"                 // When all recommended permutations have been exhausted for column    
  },

  /**
    Constructor

    Params:
      opts:Hash
        model:Column
        parent_view:SideBarView

    Returns:
      ColumnView

  **/
  initialize: function(opts) {
    var self                    = this;
    self.model                  = opts.model;
    self.parent_view            = opts.parent_view;
    self.dc_view                = new DomArrayGenerator();
    self.recommended_dom_views  = [];
    self.selected_dom_views     = [];

    self.render();
    _.bindAll(self, 
      "mouseOverSelectableDom", 
      "mouseOutSelectableDom", 
      "clickedOnSelectableDom", 
      "clickedRecommendedDomAdd",
      "preventDefaultClickBehavior",
      "activeModelColNameUpdated",
      "clickedColumn"
    );

    if(self.isActive()) {
      self.activate(); 
    }
    if(self.belongsToCurrentPage()) {
      self.$el.addClass('curr_page');
    }
  },

  isActive: function() {
    var self = this;
    return self.model.get("is_active");
  },

  render: function() {
    var self      = this;
    var data      = self.model.forTemplate();
    var template  = self.template();
    self.$el.html(template(data));
    self.renderCounter();
    self.renderListingPanelView();
    return self;
  },

  renderListingPanelView: function() {
    var self = this;

    self.listing_panel_view = new ListingPanelColumnView({
      model: self.model,
      parent_view: self
    });    
  },

  refreshCounter: function() {
    var self = this;
    self.renderCounter();
    if(self.model.get("is_active")) {
      self.dressUpSelectedDoms();
    }
  },

  renderCounter: function() {
    var self = this;
    var countables = self.getCountables();

    self.$el.find(".counter").html(countables.length);
    self.$el.find(".counter").attr("tooltip-content", "Column: " + self.model.get("col_name"));
    self.parent_view.updateCounter(countables.length, self);
    self.parent_view.renderDisplayMode();
  },

  validateColName: function(e) {
    console.log("validate col name");
    e.preventDefault();
    e.stopPropagation();
    var self = this;
    var disallowed_keycodes = Object.keys(self.model.disabled_keycodes).map(function(key){
      return self.model.disabled_keycodes[key];
    });

    if(disallowed_keycodes.indexOf(e.keyCode) != -1 ) e.preventDefault();
    if(self.model.disabled_keycodes["break_line"] == e.keyCode) $(e.currentTarget).blur()

  },

  updateColName: function(new_col_name, event_source) {  
    var self = this;
    self.model.set("col_name", new_col_name);
    self.model.save();

    switch(event_source) {
      case self.parent_view:
        self.listing_panel_view.setColName(new_col_name);
        break;
      case self.listing_panel_view:
        self.parent_view.setColName(new_col_name);
        break;
      default:
        self.parent_view.setColName(new_col_name); 
        self.listing_panel_view.setColName(new_col_name);
    }
  },

  updateRequiredAttribute: function(new_required_attribute, event_source) {  
    var self = this;

    self.model.set("required_attribute", new_required_attribute);
    self.model.save();
    self.updateRequiredAttributeDisplay(new_required_attribute, event_source);
    self.displaySampleData();
  },  

  updateRequiredAttributeDisplay: function(new_required_attribute, event_source) {
    var self = this;

    if(new_required_attribute == null) {
      new_required_attribute = "inner_text";
    }    
    switch(event_source) {
      case self.parent_view:
        self.listing_panel_view.setRequiredAttribute(new_required_attribute);
        break;
      case self.listing_panel_view:
        self.parent_view.setRequiredAttribute(new_required_attribute);
        break;
      default:
        self.parent_view.setRequiredAttribute(new_required_attribute); 
        self.listing_panel_view.setRequiredAttribute(new_required_attribute);
    }
  },

  getColName: function() {
    var self = this;
    return self.model.get("col_name");
  },

  activeModelColNameUpdated: function() {
    var self = this;
    self.$el.find(".col-name").html(self.model.get('col_name'));
  },  

  defaultColName: function() {
    var self = this;     
    return self.model.defaultColName();
  },

  clickedDeleteColumn: function(e) {
    e.stopPropagation();
    var self = this;
    self.undressSelectedPreviews();
    self.$el.trigger("delete_column", [self]);
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
    self.parent_view.deactivateRecommendationsMode();
    self.parent_view.deactivateSubViews([self.model.id], false, []);
    self.parent_view.activeColumnViewChanged(self);

    var countables = self.getCountables();
    self.parent_view.updateCounter(countables.length, self);
    self.parent_view.renderDisplayMode();
    self.listing_panel_view.activate();
    self.updateRequiredAttributeDisplay(self.model.attributes.required_attribute, self);

    self.model.set("is_active", true);
    self.model.save();
    self.$el.addClass('active');

    switch(self.getState()) {
      case self.states.not_page:
        self.redirectToParentPage();
        break;

      case self.states.fresh:
        self.spyOnMouseStart();
        break;

      case self.states.recommends:
        self.spyOnMouseStart();
        self.dressUpSelectedDoms();
        self.displaySampleData();
        self.dressUpRecommendedDoms();
        break;

      case self.states.fixed:
        self.spyOnMouseStart();      
        self.dressUpSelectedDoms();
        self.displaySampleData();
        break;
    }
    
  },

  /**
    Called when this column stops being the active column for this page. Note: There can only be one active column per Tab
  **/
  deactivate: function() {
    var self = this;
    self.model.set("is_active", false);
    self.$el.removeClass('active');
    // self.$el.css("background-color", self.getDefaultColor());
    self.model.save();
    self.spyOnMouseStop();
    self.undressSelectedDoms();
    self.undressRecommendedDoms();
    self.listing_panel_view.deactivate();
  },

  /**
    Removes this view and all its sub elements
    Called when the extension get deactivated    
  **/
  destroy: function() {
    var self = this;
    self.undressRecommendedDoms();
    self.undressSelectedDoms();
    self.spyOnMouseStop();
    self.listing_panel_view.destroy();
    self.remove();  
  },

  /**
    Checks the current state this view is in

    returns
  **/
  getState: function() {
    var self = this;
    if(!self.belongsToCurrentPage()) {
      return self.states.not_page;

    } else if(!self.hasDomsSelected()) {
      return self.states.fresh;

    } else if(self.hasDomRecommendations()) {
      return self.states.recommends;

    } else if(!self.hasDomRecommendations()) {
      return self.states.fixed;

    }
  },

  belongsToCurrentPage: function() {
    var self = this;
    return self.model.belongsToPage(self.parent_view.pageId())
  },

  hasDomsSelected: function() {
    var self = this;
    return self.model.domArrayNotEmpty();
  },

  hasDomRecommendations: function() {
    var self = this;
    return self.model.hasRecommendations();
  },

  /** 
    Redirects this window to the page this view's column model belongs to
  **/
  redirectToParentPage: function() {
    var self = this;    
    console.log("Redirecting to column_id: %s, page_id: %s", 
      self.model.id, self.model.get('page_id') );
    Env.redirect(self.model.get("page_url"));
  },

  /**
    Returns a list of DOMs that can be included for harvesting 
    on this page

    Returns:
      [dom1, dom2, dom3,...]
  **/
  selectableDoms: function() {
    var self = this;
    var sds  = self.selectable_doms.join(" , ");

    $sds = $(sds).filter(function(index, dom) {
      if(self.dc_view.isReserved(dom)) return false;
      return true;
    });

    return $sds;
  },


  /**
    Determines if a given dom can be selected

    Returns: Boolean
      true if dom can be selected
  **/
  isSelectable: function(dom) {
    var self = this;
    if(
      $(dom).find(
        self.disallowed_children.join(" , ")
      ).length > 0 ) {
      return false
    }
    return !self.dc_view.isReserved(dom);
  },

  /** 
    Method is called to get 
  **/
  spyOnMouseStart: function() {
    var self  = this;
    $("body").bind("mousemove", self.mouseOverSelectableDom);
    $("body").bind("mouseout",  self.mouseOutSelectableDom);
    $("body").bind("click",     self.clickedOnSelectableDom);

    $("*").bind("click", self.preventDefaultClickBehavior);
    $("*").bind("mousedown", self.parent_view.preventDefaultMouseDownBehavior);
    $("*").bind("mouseover", self.parent_view.preventDefaultMouseOverBehavior);
    $("*").bind("mouseenter", self.parent_view.preventDefaultMouseOverBehavior);

    $("*").bind("keydown", self.parent_view.preventDefaultKeyBehavior);
    $("*").bind("keypress", self.parent_view.preventDefaultKeyBehavior);
    $("*").bind("keyup", self.parent_view.preventDefaultKeyBehavior);

    self.spyOnBodyChangeStart();    
  },

  spyOnMouseStop: function() {
    var self  = this;    
    $("body").unbind("mousemove", self.mouseOverSelectableDom);
    $("body").unbind("mouseout",  self.mouseOutSelectableDom);
    $("body").unbind("click",     self.clickedOnSelectableDom); 

    $("*").unbind("click", self.preventDefaultClickBehavior);
    $("*").unbind("mousedown", self.parent_view.preventDefaultMouseDownBehavior);
    $("*").unbind("mouseover", self.parent_view.preventDefaultMouseOverBehavior);
    $("*").unbind("mouseenter", self.parent_view.preventDefaultMouseOverBehavior);

    $("*").unbind("keydown", self.parent_view.preventDefaultKeyBehavior);
    $("*").unbind("keypress", self.parent_view.preventDefaultKeyBehavior);
    $("*").unbind("keyup", self.parent_view.preventDefaultKeyBehavior);
    
    self.spyOnBodyChangeStop();
  },

  /** Rebinds prevent navigate away **/
  spyOnBodyChangeStart: function() {
    var self  = this;

    self.total_dom_counts = $("*").length;

    if(!self.myMutationObserver) {
      self.myMutationObserver = new MutationObserver(function(mutations) {
        if(self.total_dom_counts == $("*").length) {
          return;
        } else {
          console.log("page has changed. rebinding again ");
          self.total_dom_counts = $("*").length
        }
        
        $("*").unbind("click", self.preventDefaultClickBehavior);
        $("*").bind("click", self.preventDefaultClickBehavior);

        $("*").unbind("mousedown", self.parent_view.preventDefaultMouseDownBehavior);
        $("*").bind("mousedown", self.parent_view.preventDefaultMouseDownBehavior);

        $("*").unbind("mouseover", self.parent_view.preventDefaultMouseOverBehavior);
        $("*").bind("mouseover", self.parent_view.preventDefaultMouseOverBehavior);

        $("*").unbind("mouseenter", self.parent_view.preventDefaultMouseOverBehavior);
        $("*").bind("mouseenter", self.parent_view.preventDefaultMouseOverBehavior);

        self.dressUpSelectedDoms();
      });      
    } 

    self.myMutationObserver.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  },

  spyOnBodyChangeStop: function() {
    var self  = this;
    self.myMutationObserver && self.myMutationObserver.disconnect();
  },

  defaultColName: function() {
    var self = this;     
    return self.model.defaultColName();
  },  

  /** 
    Changes the background color of the DOM element when mouses of a yet-selected selectable DOM element
  **/
  mouseOverSelectableDom: function(e) {
    e.stopPropagation();
    e.preventDefault();

    var self = this;
    var dom = e.target;
    if(!self.isSelectable(dom)) {
      return;
    }

    $(dom).addClass('getdata-selectable-dom');
    $(dom).attr("getdata_color",   self.getSelectableColor());
  },

  /** 
    Reverts a temporarily modified DOM element after the mouse has left
  **/
  mouseOutSelectableDom: function(e) {
    e.stopPropagation();
    e.preventDefault();

    var self = this;
    var dom = e.target;
    self.clearMouseOverDom(dom);
  },

  /**
    Removes the styling modifications to the DOM element when it is mouseover in selecting mode
  **/
  clearMouseOverDom: function(dom) {
    $(dom).removeAttr("getdata_color");
    $(dom).removeClass('getdata-selectable-dom');
  },

  /**
    Prevents the default click behavior from being triggered when the extension is active
  **/
  preventDefaultClickBehavior: function(e) {
    var self = this;    
    if(Application.crawler_triggered) return;
    if(!self.dc_view.isReserved(e.target)) {
      e.preventDefault();    
      e.stopPropagation();
      self.clickedOnSelectableDom(e);      
    }
  },

  /**
    Converts the yet-selected selectable DOM element into a post selected state
    if Dom is already selected or recommended ignore
  **/
  clickedOnSelectableDom: function(e) {
    if(Application.crawler_triggered) return;
    
    // Does not affect the recipe if is controllered by popup crawler
    e.preventDefault();    
    e.stopPropagation();

    var self = this;
    var dom  = e.target;
    if(!self.isSelectable(dom)) {
      return;
    }    
    self.clearMouseOverDom(dom);
    self.getAndMergeNewDomArray(dom);
  },

  clearDomArray: function() {
    var self          = this;
    var promise       = self.model.clearDomArray();
    self.undressSelectedDoms();
    $.when(promise).then(
      function() {
        self.dressUpSelectedDoms();  
        self.displaySampleData();
        self.dressUpRecommendedDoms();
        self.updateDomCountRecord();
        self.renderCounter();
        self.updateRequiredAttributeDisplay(self.model.attributes.required_attribute, self);
      }
    );    
  },

  getAndMergeNewDomArray: function(dom) {
    var self          = this;

    var outer_dom = null;
    if(self.alreadySetColumn()) {
      var outer_dom     = self.parent_view.listing_detector.fetchOuterDomElement(dom);          
    }

    var new_dom_array = self.dc_view.calculateNewDomArray(dom, outer_dom);

    var outer_dom_array = null;
    
    if(self.alreadySetColumn() && self.parent_view.listing_detector.inOuterDomElement(dom)) {
      var container = self.parent_view.listing_detector.fetchContainer(dom);      
      var children_dom_obj = self.parent_view.listing_detector.fetchChildrenDomArrayObjFromOuterDom(outer_dom, container);
      if(children_dom_obj && container && container.table) {
        outer_dom_array = self.dc_view.calculateNewDomArray(container.table);    
        outer_dom_array.push(children_dom_obj);
      }       
    } 

    var promise       = self.model.mergeInNewSelections(new_dom_array, outer_dom_array);
    $.when(promise).then(
      function() {
        self.dressUpSelectedDoms();  
        self.displaySampleData();
        self.dressUpRecommendedDoms();
        self.updateDomCountRecord();
        self.renderCounter();
        self.updateRequiredAttributeDisplay(self.model.attributes.required_attribute, self);
        self.autoSetColName(dom);
      },
      function() {
        self.deactivate();
        new_dom_array = self.dc_view.calculateNewDomArray(dom);
        self.setDomArrayToNewColumn(new_dom_array, self.getAutoSetColName(dom), null);
      }
    );
  },

  alreadySetColumn: function() {
    var self = this;
    return self.model.get("dom_array").length > 0;
  },

  updateDomCountRecord: function() {
    var self = this;
    var countables = self.getCountables();

    self.model.set("counter", countables.length);
    self.model.save();
  },

  getCountables: function() {
    var self = this;
    var countables = $(self.model.domCountQuery());
    return countables;
  },

  /**
    Called when newly selected dom_array cannot be merged to current 
    column's dom_array

    Creates a new Column and sets the new dom_array to it and focuses on it

  **/
  setDomArrayToNewColumn: function(dom_array, col_name, outer_dom_array) {
    var self = this;
    return self.parent_view.addColumn({
      dom_array: dom_array,
      col_name: col_name, 
      outer_dom_array: outer_dom_array
    });
  },  

  autoSetColName: function(dom) {
    var self = this;

    // doest not override user specified name
    if(self.model.get("col_name") != self.model.defaultColName()) { return };

    if(dom.nodeName.toLowerCase() == "th") {
      self.updateColName(dom.innerText, "table_header");

    } else if(dom.nodeName.toLowerCase() == "td") {

    }
  },

  getAutoSetColName: function(dom) {

    if(dom.nodeName.toLowerCase() == "th") {
      return dom.innerText;

    } else if(dom.nodeName.toLowerCase() == "td") {

    }
  },



  /**
    Given a dom determines if the nth-child clause is 
    still required to accurately describe the dom

    Returns Boolean
  **/
  needNthChildPosition: function(dom) {
    var self = this;
    var domEl               = dom.nodeName.toLowerCase();
    var domClassName        = self.dc_view.calculateClassName(dom);
    var domId               = self.dc_view.calculateId(dom);    
    var calculated_position = self.dc_view.calculatePositionInLevel(dom)
    if(
        domEl != "body" && 
        (
          ( !domClassName || domClassName.length == 0 ) &&
          ( !domId || domId.length == 0 ) 
        ) && 
        calculated_position > 1
      ) {
      return true;

    } else if (
      domEl == "th" || domEl == "td"
    ) {
      return true;
      
    }
    return false;
  },


  /**
    styles selected dom when activate happens
  **/
  dressUpSelectedDoms: function() {
    var self = this;
    if(!self.model || !self.model.fullDomQuery() || self.model.fullDomQuery().length == 0 ) { return; }
    console.log("dressing up column view :" + self.model.fullDomQuery());    
    var doms = $(self.model.fullDomQuery());

    _.each(doms, function(dom) {
      if(self.dc_view.isReserved(dom) || self.selectedDomAlreadyDressedUp(dom)) return;
      self.selected_dom_views.push(dom);
      $(dom).addClass('getdata-selected-dom');
    });

    if(self.model.get("outer_dom_query")) {
      var outer_doms = $(self.model.get("outer_dom_query"));      
      outer_doms.each(function(index, dom) {
        $(dom).addClass('getdata-selected-outer-dom-shadow');
      });
    }    
  },

  mouseOverEvent: function() {
    var self = this;
    if(self.$el.hasClass('active')) return; 
    self.dressUpSelectedPreviews();
  },

  /**
    Quick preview when mouse over
  **/
  dressUpSelectedPreviews: function() {
    console.log("showing previews");
    var self = this;
    

    if(!self.model || !self.model.fullDomQuery() || self.model.fullDomQuery().length == 0 ) { return; }
    console.log("dressing up column preview :" + self.model.fullDomQuery());    
    var doms = $(self.model.fullDomQuery());

    _.each(doms, function(dom) {
      if(self.dc_view.isReserved(dom) || self.selectedDomAlreadyDressedUp(dom)) return;
      self.selected_dom_views.push(dom);
      $(dom).addClass('getdata-selectable-dom');
    });

    if(self.model.get("outer_dom_query")) {
      var outer_doms = $(self.model.get("outer_dom_query"));      
      outer_doms.each(function(index, dom) {
        $(dom).addClass('getdata-selectable-outer-dom-shadow');
      });
    }    
  },  

  mouseOutEvent: function() {
    var self = this;
    // if(self.$el.hasClass('active')) return; 
    self.undressSelectedPreviews();
  },  

  undressSelectedPreviews: function() {
    var self = this; 

    if(!self.model || !self.model.fullDomQuery() || self.model.fullDomQuery().length == 0 ) { return; }
    console.log("undressing column preview :" + self.model.fullDomQuery());    
    var doms = $(self.model.fullDomQuery());

    _.each(doms, function(dom) {
      if(self.dc_view.isReserved(dom) || self.selectedDomAlreadyDressedUp(dom)) return;
      self.selected_dom_views.push(dom);
      $(dom).removeClass('getdata-selectable-dom');
    });

    if(self.model.get("outer_dom_query")) {
      var outer_doms = $(self.model.get("outer_dom_query"));      
      outer_doms.each(function(index, dom) {
        $(dom).removeClass('getdata-selectable-outer-dom-shadow');
      });
    }    
  },

  /**
    sets data from first dom in the sample data panel
  **/
  displaySampleData: function() {
    var self = this;
    var doms = $(self.model.fullDomQuery());
    self.parent_view.renderSampleData(self.getSampleData());
    self.listing_panel_view.setSampleData(self.getSampleData());
  },  

  getSampleData: function() {
    var self = this;
    var doms = $(self.model.fullDomQuery());
    if(doms.length > 0 ) {
      var sample_dom = doms[0];
      if(self.model.attributes.required_attribute && 
        self.model.attributes.required_attribute == "src" && 
        self.model.attributes.dom_array[self.model.attributes.dom_array.length -1].el == "img"
      ) {
        var new_sample_image = $("<img>", {src: sample_dom.src});
        return new_sample_image

      } else if(self.model.attributes.required_attribute && 
        self.model.attributes.required_attribute == "src" && 
        self.model.attributes.dom_array[self.model.attributes.dom_array.length -1].el == "iframe"
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
    } else {
      return "no sample data available yet"
    } 
  },



  /**
    Checks if dom is already selected and has a corresponding selected_dom_view
  **/
  selectedDomAlreadyDressedUp: function(dom) {
    var self = this;
    $(dom).hasClass('getdata-selected-dom');
  },

  /**
    Removes the styling of selected dom when activate happens
  **/
  undressSelectedDoms: function() {
    var self = this;
    _.each(self.selected_dom_views, function(dom) {
      $(dom).removeClass('getdata-selected-dom')
    });

    if(self.model.get("outer_dom_query")) {
      var outer_doms = $(self.model.get("outer_dom_query"));      
      outer_doms.each(function(index, dom) {
        $(dom).removeClass('getdata-selected-outer-dom-shadow');
      });
    }    

    self.selected_dom_views = [];
  },

  /**
    styles recommendd dom  when activate happens
  **/
  dressUpRecommendedDoms: function() {
    var self = this;
  },

  /**
    Removes the styling of recommended dom when deactivate happens
  **/
  undressRecommendedDoms: function() {
  },

  /**
    Adds the recommended DOM element to the Column it was recommended for
  **/
  clickedRecommendedDomAdd: function(e) {

  },

  /**
    Discards the recommended DOM element from the Column prevents it from being displayed again.
  **/
  clickedRecommendedDomDiscard: function(e) {

  },

  /**
    Gets the color encoding for the selectable DOMs

    Returns String
  **/
  getSelectableColor: function() {
    var self = this;
    return "#ff9933";
  },

  /***
    Gets the color encoding for the recommended DOMs

    Returns String
  ***/
  getRecommendedColor: function() {
    var self = this;
    return "#ffe6cc";
  },

  /***
    Gets the color encoding for the selected DOMs
    
    Returns String
  ***/
  getSelectedColor: function() {
    var self = this;
    return "#ff8000";
  },

  getDefaultColor: function() {
    return "#2b2825";
  },

  template: function() {
    return Application.templates['column'];
  }
});