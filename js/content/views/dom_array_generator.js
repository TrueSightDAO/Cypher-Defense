var DomArrayGenerator = Backbone.View.extend({
  el: "body",  

  /** List of all the DOM elements within a HTML Dom that are to be ignored when constructing the dom query chain **/
  ignored_doms: [
    // "tbody", "thead"
  ],

  reserved_class_characters: [
    "$", "(", ")", ":", ",", "[", "]", "#"
  ],

  /** 
    Class Names that prevents elements from being selected by our mouse click events
    The list of css queries describes either these doms, their direct parents or ancestore further up the DOM tree
  **/
  reserved_classnames: [ "getdata-intro-modal", "cypher-sidebar", "getdata-selected_dom", 
    "hopscotch-bubble", "hopscotch-bubble-container", "hopscotch-bubble-number", "hopscotch-bubble-content", 
    "hopscotch-title", "hopscotch-content", "getdata-cloud-save-link"
  ],    

  ignored_class_names: [
    "getdata-selected-dom",
    "getdata-selected-outer-dom-shadow",
    "getdata-selectable-page"
  ],    

  ignored_siblings: [
    "#text", "#comment", "SCRIPT"
  ],

  /**
    Generates the dom array that uniquely describes this dom element given 

    Returns Array
  **/
  calculateNewDomArray: function(dom, outer_dom, ignore_id, ignore_magic, ignore_position) {
    var self = this;

    var new_dom_array = [];
    var curr_dom      = dom;
    var max_depth     = 5;
    var curr_depth    = 0;

    do {
      // debugger;
      if ( self.toBeDiscarded(curr_dom) ) { continue; }
      if ( outer_dom && outer_dom == curr_dom ) { break; }
      if ( curr_dom.nodeName.toLowerCase() == "body") {break;}

      var curr_hash       = {};
      curr_hash.el        = curr_dom.nodeName.toLowerCase();
      curr_hash.class     = self.calculateClassName(curr_dom);
      if(!ignore_id) {
        curr_hash.id        = self.calculateId(curr_dom);  
      }
      

      // Only use nth-child as a position if 
      //   the element does not already have a className or ID associated with it
      //   the position is more than 1
      // if ( self.needNthChildPosition(curr_dom) ) {
      //   curr_hash.position = self.calculatePositionInLevel(curr_dom);
      // }
      if(!ignore_position) {
        curr_hash.position = self.calculatePositionInLevel(curr_dom);  
      }
      

      curr_depth          += 1;
      new_dom_array.unshift(curr_hash);

    } while(
      (curr_dom = curr_dom.parentElement) && 
      curr_dom &&
      curr_depth <= max_depth &&
      curr_dom.nodeName.toLowerCase() != "body" &&      
      curr_dom.nodeName.toLowerCase() != "html"
    );

    // !ignore_magic && ( new_dom_array = self.magicProcessTH(new_dom_array, outer_dom) );  
    
    return new_dom_array;

  },  

  magicProcessTH: function(new_dom_array, outer_dom) {
    
    if (outer_dom && new_dom_array.length == 1 && new_dom_array[0].el == "th") {
      new_dom_array[0].el    = "td"
      new_dom_array[0].class = ""
      new_dom_array[0].id    = ""      

    } else if (new_dom_array.length >= 2 && new_dom_array[new_dom_array.length - 1].el == "th") {
      new_dom_array[new_dom_array.length - 1].el    = "td"
      new_dom_array[new_dom_array.length - 1].class = ""
      new_dom_array[new_dom_array.length - 1].id    = ""

      if (new_dom_array[new_dom_array.length - 2].el == "tr") {
        new_dom_array[new_dom_array.length - 2].position = null;
      }

    }

    return new_dom_array;
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
    Computes the well formated class name given a DOM object

    Returns String
  **/
  calculateClassName: function(dom) {
    var self = this;

    if(!dom.className || dom.className.length == 0 ) return "";
    
    return dom.className
      .split(" ")
      .filter(function(class_name) {
        return !self.ignored_class_names.includes(class_name);
      })
      .filter(function(class_name) {
        var is_allowed = true;
        self.reserved_class_characters.forEach(function(reserved_char){
          if(class_name.includes(reserved_char)) {
            is_allowed = false;
          }
        })
        return is_allowed;
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
    var self = this;

    if(!dom.id || dom.id.length == 0) return "";

    var has_reserved_characters = false;
    self.reserved_class_characters.forEach(function(reserved_char){
      if(dom.id.includes(reserved_char)) {
        has_reserved_characters = true;
      }
    })

    if(has_reserved_characters) return "";
    return "#" + dom.id;
  },  

  /**
    Calculating the current position of the element in relation to its siblings.
    Discounting the text nodes from this calculation

    Returns Integer
  **/
  calculatePositionInLevel: function(dom) {
    if(dom.nodeName.toLowerCase() == "body") {debugger}
    var self = this;
    var curr_dom = dom;
    var curr_pos = 1;
    while(curr_dom = curr_dom.previousSibling) {

      if ( self.ignored_siblings.indexOf(curr_dom.nodeName.toLowerCase()) == -1 ) {
        curr_pos += 1;
      }
      
    };
    return curr_pos;
  },


  /**
    Determines if a selected element cannot be selected

    Returns: Boolean
      true if dom cannot be selected
  **/
  isReserved: function(dom) {
    var self = this;
    var $dom = $(dom);
    var unselectable = false;

    self.reserved_classnames.forEach(function(u_dom) {
      if($dom.hasClass(u_dom)) {
        unselectable = true; 
      }
      if($dom.parents("." + u_dom).length > 0) {
        unselectable = true; 
      }
    });

    return unselectable;
  },

  calculateDomQuery: function(dom_query_array) {
    var self = this;
    return dom_query_array.map(function(dom){
      query = "";
      dom.el        && (query += dom.el);
      dom.position  && (query += ":nth-child(" + dom.position + ")");
      dom.class     && (query += dom.class);
      dom.id        && (query += dom.id);
      dom.contains  && (query += ":contains('" + dom.contains + "')");
      return query;

    }).join(" > ");
  }

})