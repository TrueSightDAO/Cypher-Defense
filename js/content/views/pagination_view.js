var PaginationView = Backbone.View.extend({

  events : {
    "click": "clickedPaginationButton"
  },

  states: {
    DORMANT:    "dormant", 
    SELECTING:  "selecting", 
    SELECTED:   "selected"
  },


  /** 
    Class Names that prevents elements from being selected by our mouse click events
    The list of css queries describes either these doms, their direct parents or ancestore further up the DOM tree
  **/
  unselectable_classnames: [ "getdata-sidebar", "getdata-selected_dom" ],

  /** List of all the DOM elements within a HTML Dom that are selectable **/
  selectable_doms: [ 
    "a",
    "button"
  ],  

  /** List of all the DOM elements within a HTML Dom that are to be ignored when constructing the dom query chain **/
  ignored_doms: [
    "tbody", "thead", "svg"
  ],

  initialize: function(opts) {
    var self = this;

    _.bindAll(self, 
      "render", 
      "mouseOverSelectableDom", 
      "mouseOutSelectableDom", 
      "clickedOnSelectableDom",
      "dressUpSelectedDoms",
      "preventDefaultClickBehavior"
      );

    self.is_listening       = false;
    self.parent_view        = opts.parent_view;
    self.$el                = self.parent_view.$el.find("#add_pagination");
    self.model              = new Pagination();
    self.dc_view            = new DomArrayGenerator();    
    self.selected_dom_view  = false;
    var promise = self.model.load();
    $.when(promise).then( self.render , self.errorHandler );    

  },

  render: function() {
    var self = this;
    console.log("Rendering pagination button");
    if(self.model.isSet()) {
      self.displayPaginationSelected();
      self.setState(self.states.SELECTED);
      self.dressUpSelectedDoms();

    } else {
      self.displayPaginationDormant();
      self.setState(self.states.DORMANT);

    }
  },

  clickedPaginationButton: function(e) {
    var self = this;
    self.parent_view.deactivateSubViews([], true, []);

    switch(self.getState()) {
      case self.states.DORMANT:
        if(!self.is_listening) {
          self.setState(self.states.SELECTING)
          self.parent_view.deactivateColNameField();
          self.displayPaginationSelecting();
          self.startPaginationListener();
        }
        break;

      case self.states.SELECTING: 
        break;

      case self.states.SELECTED: 
        if(self.is_listening) {
          self.unsetPagination();
          self.undressSelectedDoms();
          self.setState(self.states.SELECTING);
          self.displayPaginationSelecting();

        } else {
          self.startPaginationListener();
        }
        break;
    }
  },  

  destroy: function() {
    var self = this;
    self.stopPaginationListener();
    self.undressSelectedDoms();
    self.remove();
  },

  deactivate: function() {
    var self = this;
    self.stopPaginationListener();

    if(self.model.isSet()) {
      self.setState(self.states.SELECTED);
      self.displayPaginationSelected();

    } else {
      self.setState(self.states.DORMANT);
      self.displayPaginationDormant();
    }

  },

  /**
    Updates the state of this current view
    Params:
      state:String

    Returns Boolean
  **/
  setState: function(state) {
    var self = this;
    var states = _.map(Object.keys(self.states), function(state_key) {
      return self.states[state_key];
    });
    if(_.contains(self.states, state)) {
      self.state = state;
      return true;
    }
    return false;
  },

  getState: function() {
    var self = this;
    return self.state;
  },

  getSelectableColor: function() {
    var self = this;
    return "rgb(25, 25, 25, 0.5)";
  },

  getSelectedColor: function() {
    var self = this;
    return "rgb(25, 25, 25, 0.5)";
  },  

  errorHandler: function() {
    console.log("loading pagination button view failed")
  },

  hidePaginationButton: function() {
    var self = this;
    self.$el.find("#add_pagination").hide();
  },

  displayPaginationDormant: function() {
    var self = this;
    self.$el.show();

    self.$el.removeClass("selected");
    // self.$el.removeClass("fa-link");

    self.$el.removeClass("selecting");
    // self.$el.removeClass("fa-unlink");

    self.$el.addClass("dormant");
    // self.$el.addClass("fa-unlink");
    self.$el.attr("tooltip-content", "Add the 'next page' hyperlink to this data source");
  },

  displayPaginationSelecting: function() {
    var self = this;
    self.$el.show();
    self.$el.removeClass("selected");
    // self.$el.removeClass("fa-link");

    self.$el.removeClass("dormant");
    // self.$el.removeClass("fa-unlink");

    self.$el.addClass("selecting");
    // self.$el.addClass("fa-unlink");
    self.$el.attr("tooltip-content", "Click on the 'next page' hyperlink to add it to this data source");
    
  },

  displayPaginationSelected: function() {
    var self = this;
    self.$el.show();

    self.$el.addClass("selected");
    // self.$el.addClass("fa-link");

    self.$el.removeClass("dormant");
    // self.$el.removeClass("fa-unlink");

    self.$el.removeClass("selecting");
    // self.$el.removeClass("fa-unlink");
    self.$el.attr("tooltip-content", "'next page' hyperlink has been added. Click to remove");

  },

  /**
    Returns true if there are Doms elements on the page that can be selected
  **/
  hasSelectableDoms: function() {
    var self = this;
    return self.selectableDoms().length > 0
  },

  /**
    Returns a list of DOMs that can be included for harvesting 
    on this page

    Returns:
      [dom1, dom2, dom3,...]
  **/
  selectableDoms: function() {
    var self = this;
    // var sds  = self.selectable_doms.join(" , ");
    var sds = "*";

    $sds = $(sds).filter(function(index, dom) {
      if(self.isUnselectable(dom)) return false;
      $(dom).attr("org-bkg-color", $(dom).css( "background-color"));
      $(dom).attr("org-outline", $(dom).css( "outline"));
      return true;
    });

    return $sds;
  },

  /**
    Determines if a selected element cannot be selected

    Returns: Boolean
      true if dom cannot be selected
  **/
  isUnselectable: function(dom) {
    var self = this;
    var unselectable = false;
    var $dom = $(dom);

    self.unselectable_classnames.forEach(function(u_dom) {
      if($dom.hasClass(u_dom)) unselectable = true;
      if($dom.parents("." + u_dom).length > 0) unselectable = true;
    });

    return unselectable;
  },  

  /** 
    Changes the background color of the DOM element when mouses of a yet-selected selectable DOM element
  **/
  mouseOverSelectableDom: function(e) {
    console.log(e);
    e.stopPropagation();
    e.preventDefault();

    var self = this;
    var dom = e.target;

    dom = self.fetchQualifiedDom(dom);
    if(!dom) { return; }    

    $(dom).addClass("getdata-selectable-page");
  },

  /** 
    Reverts a temporarily modified DOM element after the mouse has left
  **/
  mouseOutSelectableDom: function(e) {
    e.stopPropagation();
    e.preventDefault();

    var self = this;
    var dom = e.target;

    dom = self.fetchQualifiedDom(dom);
    if(!dom) { return; }    
    self.clearMouseOverDom(dom);
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

  fetchQualifiedDom: function(dom) {
    var self = this;
    if(!self.isSelectable(dom)) {
      return null;
    }
    if( self.selectable_doms.includes(dom.nodeName.toLowerCase()) ) {
      return dom;
    }    
    var sds  = self.selectable_doms.join(" , ");
    return $(dom).closest(sds)[0]

  },

  /**
    Removes the styling modifications to the DOM element when it is mouseover in selecting mode
  **/
  clearMouseOverDom: function(dom) {
    $(dom).removeClass("getdata-selectable-page");
  },

  /**
    Converts the yet-selected selectable DOM element into a post selected state
    if Dom is already selected or recommended ignore
  **/
  clickedOnSelectableDom: function(e) {
    
    // Does not affect the recipe if is controllered by popup crawler
    if(Application.crawler_triggered) return;

    e.preventDefault();
    e.stopPropagation();

    var self = this;
    var dom  = e.target;
    dom = self.fetchQualifiedDom(dom);
    if(!dom) { return; }

    self.clearMouseOverDom(dom);
    self.setState(self.states.SELECTED);
    self.displayPaginationSelected();
    // self.stopPaginationListener();
    self.setPagination(dom);
  },


  /**
    Determines if a given dom can be selected

    Returns: Boolean
      true if dom can be selected
  **/
  isSelectable: function(dom) {
    var self = this;
    return !self.dc_view.isReserved(dom);
  },

  startPaginationListener: function() {
    var self  = this;
    self.is_listening = true;

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
  },

  stopPaginationListener: function() {
    var self  = this;     
    self.is_listening = false;

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
  },

  unsetPagination: function() {
    var self = this;
    self.model.set("dom_array", []);
    self.model.save();
  },

  /**
    Saves the DOM array
  **/
  setPagination: function(dom) {
    var self = this;
    var dom_array = self.calculateNewDomArray(dom);
    self.model.set("dom_array", dom_array);
    var promise = self.model.save();
    $.when(promise).then( self.dressUpSelectedDoms, self.errorHandler );
  },

  /**
    styles selected dom when activate happens
  **/
  dressUpSelectedDoms: function() {
    var self = this;
    var doms = $(self.model.attributes.dom_query);

    _.each(doms, function(dom) {
      if(self.isUnselectable(dom) || self.selectedDomAlreadyDressedUp(dom)) return;
      $(dom).addClass("getdata-selected-page");
      self.selected_dom_view = dom;
    });
  },

  /**
    Checks if dom is already selected and has a corresponding selected_dom_view
  **/
  selectedDomAlreadyDressedUp: function(dom) {
    var self = this;
    return $(dom).hasClass("getdata-selected-page");
  },  

  /**
    Removes the styling of selected dom when activate happens
  **/
  undressSelectedDoms: function() {
    var self = this;
    $(".getdata-selected-page").removeClass("getdata-selected-page");
    self.selected_dom_view = false;
  },  

  /**
    Generates the dom array that uniquely describes this dom element given 

    Returns Array
  **/
  calculateNewDomArray: function(dom) {
    var self = this;

    var new_dom_array = [];
    var curr_dom      = dom;
    var max_depth     = 99;
    var curr_depth    = 0;

    do {
      if ( self.toBeDiscarded(curr_dom) ) { 
        continue; 
      }

      var curr_hash       = {};
      curr_hash.el        = curr_dom.nodeName.toLowerCase();
      new_dom_array.unshift(curr_hash);


      // if(self.isUniqueQuery(new_dom_array) ) {
      //   continue;
      // }

      curr_hash.class     = self.calculateClassName(curr_dom);
      // curr_hash.id        = self.calculateId(curr_dom);

      // if(!self.isUniqueQuery(new_dom_array) ) {
      //   curr_hash.position  = self.dc_view.calculatePositionInLevel(curr_dom);          
      // }

      if (curr_depth == 0 ) {
        var contains        = self.calculateContains(curr_dom);
        if(contains) curr_hash.contains = contains;

        // var has_clause        = self.calculateHasClause(curr_dom);
        // if(has_clause) curr_hash.has = has_clause;        
      } 

      curr_depth          += 1;
      

    } while(
      !self.isUniqueQuery(new_dom_array) &&
      (curr_dom = curr_dom.parentElement) && 
      curr_depth < max_depth &&
      curr_dom &&
      curr_dom.nodeName.toLowerCase() != "html"
    );

    return new_dom_array;

  },

  isUniqueQuery: function(dom_array) {
    var self = this;
    var dom_query = self.dc_view.calculateDomQuery(dom_array);
    return $("body").find(dom_query).length == 1;
  },  

  /**
    Determines if this dom element should be included in the dom query chain

    Returns Boolean
  **/
  toBeDiscarded: function(dom) {
    var self = this;
    if ( self.ignored_doms.indexOf(dom.nodeName.toLowerCase()) != -1 ) {
      return true;
    }
    return false;
  },

  /**
    Computes :has(.some_child_class)

    Returns String
  **/
  calculateHasClause: function(dom) {
    var self = this;
    var curr_dom = dom;
    var has_clause = false;

    while ($(curr_dom).children().length > 0 ) {
      curr_dom = $(curr_dom).children()[0]
      curr_nodename = curr_dom.nodeName.toLowerCase();

      if(self.ignored_doms.includes(curr_nodename)) {
        break;
      }
      curr_classname = self.calculateClassName(curr_dom);

      var inner_has_content = curr_nodename;
      if (curr_classname.length > 0 ) {
        inner_has_content = inner_has_content + curr_classname
      }

      if(has_clause) {
        has_clause += ":has(" + inner_has_content + ")";
      } else {
        has_clause = ":has(" + inner_has_content + ")";
      }
    }

    return has_clause;
  },

  /**
    Computes the well formated class name given a DOM object

    Returns String
  **/
  calculateClassName: function(dom) {
    var self = this;
    if(!dom.className || dom.className.length == 0 ) return "";
    if(self.ignored_doms.includes(dom.nodeName.toLowerCase())) return "";
    
    return dom.className
      .split(" ")
      .filter(function(class_name) {
        return class_name != 'getdata-selected-page';
      })      
      .map( function(class_name) {
        var class_name = class_name.trim();
        if(class_name.length > 0) return "." + class_name;
        return "";
      })
      .join("");

  },

  /**
    Computes the well formated class name given a DOM object

    Returns String
  **/
  calculateId: function(dom) {
    if(dom.id && dom.id.length > 0) {
      return "#" + dom.id;
    }
    return "";
  },

  /**
    Calculating the current position of the element in relation to its siblings.
    Discounting the text nodes from this calculation

    Returns Integer
  **/
  calculateContains: function(dom) {

    var recognized_text = ["next", "Next", ">>", ">", "›"];
    var final_text = false;

    if(dom.nodeName.toLowerCase() == 'a' || dom.nodeName.toLowerCase() == 'button' ) {
      var has_text = $(dom).text();

      if(has_text) {
        has_text = has_text.trim();
        recognized_text.forEach(function(recog_text) {
          if( !final_text && has_text.includes(recog_text) ) {
            final_text = recog_text;
          }
        })
      }
      
    }
    return final_text;
  }  


});