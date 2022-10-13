var RecommendationDetector = Backbone.View.extend({
  el: "body",

  /** 
    Class Names that prevents elements from being selected by our mouse click events
    The list of css queries describes either these doms, their direct parents or ancestore further up the DOM tree
  **/
  allowed_containers: [
    "tbody", "table", "ul", "ol", "div"
  ],

  preferred_containers: [
    "tbody", "table", "ul", "ol"
  ],

  less_preferred_containers: [
    "div"
  ],  

  disallowed_children_elements: [
    "script", "img", "meta", "style", "noscript", "svg"
  ],  

  disallowed_inner_dom_elements: [
    "script", "meta", "style", "noscript", "svg"
  ],    

  containers: [],

  initialize: function(opts) {
    var self = this;      
    self.parent_view = opts.parent_view;
    self.dc_view = new DomArrayGenerator();

  },

  load: function() {
    var self = this;
    self.setContainers();
  },

  fetchRecommendedColumns: function() {
    var self = this;
    var main_container = self.containers[0];

    var children_rcs = [];
    main_container && main_container.children.each(function(index, curr_container_child) {
      if(self.disallowed_children_elements.includes(curr_container_child.nodeName.toLowerCase()) ) { return; };
      var recommended_columns = [];

      // TODO: Needs to be recompute when changed
      var outer_dom_array = self.calculateNewDomArrayInOuterDom(main_container.table, self.$el);    
      var children_dom_obj = self.fetchChildrenDomArrayObjFromOuterDom(curr_container_child, main_container);
      outer_dom_array.push(children_dom_obj);

      $(curr_container_child).children().each(function(index, curr_dom) {
        self.convertToRecommendation(curr_dom, curr_container_child, outer_dom_array, recommended_columns);
      });

      recommended_columns.forEach(function(curr_rc) {
        if(!self.existInArray(children_rcs, curr_rc)) {
          children_rcs.push(curr_rc);
        }
      })
    });

    return children_rcs;
  },    


  convertToRecommendation: function(dom, outer_dom, outer_dom_array, recommended_columns) {
    var self = this;
    if(self.disallowed_inner_dom_elements.includes(dom.nodeName.toLowerCase())) { return };    

    var curr_rc = {};

    // TODO: Needs to be generic across same level &&
    //    Needs to be recompute when changed
    curr_rc.dom_array           = self.calculateNewDomArrayInOuterDom(dom, outer_dom);
    curr_rc.dom_query           = self.dc_view.calculateDomQuery(curr_rc.dom_array);

    curr_rc.outer_dom_array     = outer_dom_array;
    curr_rc.outer_dom_query     = self.dc_view.calculateDomQuery(curr_rc.outer_dom_array);    


    var should_add = false;
    if(self.childlessText(dom) && self.childlessText(dom).length > 0 ) {
      curr_rc.col_name = self.generateColName(dom, "", recommended_columns);

      if( !self.existInArray(recommended_columns, curr_rc) ) {
        recommended_columns.push(curr_rc);  
      }
    }

    if($(dom).prop("href") && $(dom).prop("href").length ) {
      curr_rc = JSON.parse(JSON.stringify(curr_rc));
      curr_rc.col_name = self.generateColName(dom, "href", recommended_columns);
      curr_rc.required_attribute = "href";
      if( !self.existInArray(recommended_columns, curr_rc) ) {
        recommended_columns.push(curr_rc);  
      }
    }

    if($(dom).prop("src") && $(dom).prop("src").length ) {
      curr_rc = JSON.parse(JSON.stringify(curr_rc));
      curr_rc.col_name = self.generateColName(dom, "src", recommended_columns);
      curr_rc.required_attribute = "src";
      if( !self.existInArray(recommended_columns, curr_rc) ) {
        recommended_columns.push(curr_rc);  
      }
    }    

    $(dom).children().each(function(index, curr_child) {
      self.convertToRecommendation(curr_child, outer_dom, outer_dom_array, recommended_columns);
    });
  },

  /**
    Generates the dom array that uniquely describes this dom element in the context of the outer dom

    Returns Array
  **/
  calculateNewDomArrayInOuterDom: function(dom, outer_dom) {
    var self = this;

    var new_dom_array = [];
    var curr_dom      = dom;
    var max_depth     = 5;
    var curr_depth    = 0;

    

    do {
      // debugger;
      if ( self.dc_view.toBeDiscarded(curr_dom) ) { continue; }
      if ( outer_dom && outer_dom == curr_dom ) { break; }
      if ( curr_dom.nodeName.toLowerCase() == "body") {break;}

      var curr_hash       = {};
      curr_hash.el        = curr_dom.nodeName.toLowerCase();
      curr_hash.class     = self.dc_view.calculateClassName(curr_dom);
      curr_hash.position  = self.dc_view.calculatePositionInLevel(curr_dom);

      curr_depth          += 1;
      new_dom_array.unshift(curr_hash);

    } while(!self.isUniqueInOuterDom(outer_dom, new_dom_array) 
      && 
      (curr_dom = curr_dom.parentElement) && 
      curr_dom &&
      curr_depth <= max_depth &&
      curr_dom.nodeName.toLowerCase() != "body" &&      
      curr_dom.nodeName.toLowerCase() != "html"
    );
    
    return new_dom_array;

  },    

  isUniqueInOuterDom: function(outer_dom, dom_array) {
    var self = this;
    var dom_query = self.dc_view.calculateDomQuery(dom_array);
    return $(outer_dom).find(dom_query).length == 1;
  },


  setContainers: function() {
    var self = this;
    self.containers = self.fetchPotentialContainers();
    console.log("Containers have been set");
    console.log(self.containers);
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

    self.dc_view.reserved_classnames.forEach(function(u_dom) {
      if($dom.hasClass(u_dom)) {
        unselectable = true; 
      }
      if($dom.parents("." + u_dom).length > 0) {
        unselectable = true; 
      }
    });

    return unselectable;
  },  

  /**
    Generates the dom array that uniquely describes this dom element given 

    Returns Array
  **/
  fetchChildrenDomArrayObjFromOuterDom: function(outer_dom, container) {
    var self = this;

    var dom_array_obj = {};

    var same_el = true;
    var el = null;

    var same_name = true;
    var el_class = null;    

    var same_id = true;
    var el_id = null;        

    container && container.children.filter(function(index, curr_child) {
      return outer_dom.nodeName.toLowerCase() == curr_child.nodeName.toLowerCase();

    }).each(function(index, outer_dom) {
      var curr_el = outer_dom.nodeName.toLowerCase();
      var curr_class = self.calculateClassName(outer_dom);
      var curr_id = self.dc_view.calculateId(outer_dom);

      if(!el) {
        el = curr_el;
      } else if(el != curr_el) {
        same_el = false;
      }
      if(!el_class) {  
        el_class = curr_class;
      } else if(el_class != curr_class) {
        same_name = false;
      }

      if(!el_id) {
        el_id = curr_id;
      } else if(curr_id != el_id) {
        same_id = false;
      }      

    })
    if(same_el) dom_array_obj.el = el;    
    if(same_name) dom_array_obj.class = el_class;
    if(same_id) dom_array_obj.id = el_id;
    if(same_el || same_name || same_id) return dom_array_obj;
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
        return !self.dc_view.ignored_class_names.includes(class_name);
      })
      .filter(function(class_name) {
        var is_allowed = true;
        self.dc_view.reserved_class_characters.forEach(function(reserved_char){
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

  fetchPotentialContainers: function() {
    var self = this;
    var container_query = self.allowed_containers.join(",");

    var qualified_containers = [];

    self.$el.find(container_query).each(function(index, item) {
      if(self.isReserved(item)) return;

      var surface_area = self.surfaceArea(item); // Surface area
      var t = self.mostFrequenctOccurringChildren(item) // qualified children
      var n = t.length;     

      if(n < 3) return;
      var score = surface_area * n * n; // Scores based on surface area as well as number of direct children elements
      if((
          !isNaN(score) && score > 10
        ) || (
          self.preferred_containers.includes(item.nodeName.toLowerCase())
        )) {
          qualified_containers.push({
            table: item,
            area: surface_area,
            children: t,
            score: score
          })            
      }
    });

    var shortlisted_containers = qualified_containers.sort(function(e, t) {
      return e.score > t.score ? -1 : e.score < t.score ? 1 : 0
    });
    // return shortlisted_containers.slice(0, 5);
    return shortlisted_containers;
  },

  childlessText: function(e) {
    return $(e).clone().children().remove().end().text().trim()
  },

  generateColName: function(dom, attribute, recommended_columns) {
    var self = this;
    var col_name = "";

    if($(dom).attr("class")) {
      col_name = $(dom).attr("class");

    } else {
      col_name = dom.nodeName.toLowerCase();
    }
    if(attribute && attribute.length) {
      col_name += "-" + attribute;
    }      
    var curr_col_name = col_name;

    var i = 0;    
    while (self.nameInUse(recommended_columns, curr_col_name) ) {
      curr_col_name = col_name + " " + ++i
    }
    
    return curr_col_name;
    
  },

  nameInUse: function(recommended_columns, new_col_name) {
    return recommended_columns.map(function(rc){ return rc.col_name}).includes(new_col_name);
  },

  existInArray: function(recommended_columns, new_rc_col) {

    var already_exist = false;
    // console.log(recommended_columns);
    recommended_columns.forEach(function(recommended_column, index) {
      already_exist ||= recommended_column.dom_query == new_rc_col.dom_query && 
        recommended_column.outer_dom_query == new_rc_col.outer_dom_query && 
        recommended_column.required_attribute == new_rc_col.required_attribute;
    });

    return already_exist;
  },


  /**
    Generates the dom array that uniquely describes this dom element 

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
      if ( self.dc_view.toBeDiscarded(curr_dom) ) { continue; }
      if ( outer_dom && outer_dom == curr_dom ) { break; }
      if ( curr_dom.nodeName.toLowerCase() == "body") {break;}

      var curr_hash       = {};
      curr_hash.el        = curr_dom.nodeName.toLowerCase();
      curr_hash.class     = self.dc_view.calculateClassName(curr_dom);
      if(!ignore_id) {
        curr_hash.id        = self.dc_view.calculateId(curr_dom);  
      }
      

      // Only use nth-child as a position if 
      //   the element does not already have a className or ID associated with it
      //   the position is more than 1
      // if ( self.needNthChildPosition(curr_dom) ) {
      //   curr_hash.position = self.calculatePositionInLevel(curr_dom);
      // }
      if(!ignore_position) {
        curr_hash.position = self.dc_view.calculatePositionInLevel(curr_dom);  
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

    // !ignore_magic && ( new_dom_array = self.dc_view.magicProcessTH(new_dom_array, outer_dom) );  
    
    return new_dom_array;

  },  

  mostFrequenctOccurringChildren(container_element) {
    var self = this;
    var curr_children = $(container_element).children() // full list of children
    var classname_reference_keys = {} // CSS keyword references
    var object_reference_keys = {} // Full Object key reference

    curr_children.each(function(index, curr_child) {
        // Ignores none visible element tags 
        if (!self.disallowed_children_elements.includes(curr_child.nodeName.toLowerCase()) && $(curr_child).text().trim().length) {
            var class_names = self.classNameKeyReference($(curr_child)).sort()
            var full_object_key_reference = class_names.join(" ");

            full_object_key_reference in object_reference_keys || (object_reference_keys[full_object_key_reference] = 0)
            object_reference_keys[full_object_key_reference]++

            class_names.forEach(function(class_name) {
                class_name in classname_reference_keys || (classname_reference_keys[class_name] = 0)
                classname_reference_keys[class_name]++
            })
        }
    });

    // shortlisted reference keys based on Full Object key reference occurrence more than half of all children
    var shortlisted_keys = Object.keys(object_reference_keys).filter(function(e) {
      // console.log("using full reference key ");
      return object_reference_keys[e] >= curr_children.length / 2 - 2
    });

    // shortlisted reference keys based on Class name reference more than half of all children
    shortlisted_keys.length || (shortlisted_keys = Object.keys(classname_reference_keys).filter(function(e) {
      // console.log("using classname");
        return classname_reference_keys[e] >= curr_children.length / 2 - 2
    }));

    var surface_area = self.surfaceArea(container_element);
    if (surface_area > 5000 && curr_children.length > 10 && !shortlisted_keys.length || 1 === shortlisted_keys.length && "" === shortlisted_keys[0]) {
      // console.log("using nodename");
      return curr_children.filter(function(index, curr_child) {
          // Returns list of selected elements based on HTML tag if elements have no classnames
          if(curr_child.nodeName) {
            return !self.disallowed_children_elements.includes(curr_child.nodeName.toLowerCase()) && 
              !!$(curr_child).text().trim().length;
          } 
          return false;
      });
    }
    // Returns list of selected elements based classnames
    return curr_children.filter(function(index, curr_child) {
      // console.log("Using key references");
      var e = false
      var curr_ele = $(curr_child);
      return shortlisted_keys.forEach(function(reference_key) {
          e |= self.isReferenced(curr_ele, reference_key)
      }), e
    })
  },

  surfaceArea(element) {
    try {
      return $(element).width() * $(element).height();  
    } catch (err) {
      debugger;
    }
    
  },

  classNameKeyReference(ele) {
    return (ele.attr("class") || "").trim().split(/\s+/).filter(function(reference_term) {
        return reference_term;
    })
  },

  isReferenced: function(ele, reference_key) {
    var classnames = reference_key.split(" ")
    for (r = 0; r < classnames.length; r++) 
        if (ele.hasClass(classnames[r])) return true;
    return false
  }

});