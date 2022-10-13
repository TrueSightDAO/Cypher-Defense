var ListingDetector = Backbone.View.extend({
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

  disallowed_elements: [
    "script", "img", "meta", "style", "noscript", "svg"
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

  fetchContainer: function(element) {
    var self = this;
    var qualified_containers = [];

    // Fetch containers from preferred containers
    self.containers.filter(function(container) {
        return self.preferred_containers.includes(container.table.nodeName.toLowerCase());

    }).forEach(function(curr_container) {
      curr_container.children.each(function(index, outer_dom) {
        if(outer_dom.contains(element) && outer_dom != element ) {
          var payload = {
            outer_dom: outer_dom,
            container: curr_container,
            depth: self.fetchContainerDepth(outer_dom, element)
          }
          qualified_containers.push(payload); 
        }
      })
    });

    // Fetch containers from less preferred containers
    qualified_containers.length == 0 && self.containers.filter(function(container) {
        return self.less_preferred_containers.includes(container.table.nodeName.toLowerCase());

    }).slice(0, 10).forEach(function(curr_container) {
      curr_container.children.each(function(index, outer_dom) {
        if(outer_dom.contains(element) && outer_dom != element ) {
          var payload = {
            outer_dom: outer_dom,
            container: curr_container,
            depth: self.fetchContainerDepth(outer_dom, element)
          }
          qualified_containers.push(payload); 
        }
      })
    });

    var container = false;
    var curr_depth = null;
    qualified_containers.forEach(function(payload) {
      if((
          !curr_depth && payload.depth
        ) || (
          payload.depth && payload.depth < curr_depth
        ) ) {
          console.log(payload)
          container = payload.container;
          curr_depth = payload.depth;

      }
    })

    return container;
  },

  fetchContainerDepth: function(outer_dom, element) {
    var curr_parent = element.parentElement;
    var depth = 1;
    while(curr_parent != outer_dom) {
      depth += 1;
      curr_parent = curr_parent.parentElement;
    }
    return depth;
  },

  fetchOuterDomElement: function(element) {
    var self = this;
    var selected_outer_dom = false;
    var curr_container = self.fetchContainer(element);    
    curr_container && curr_container.children.each(function(index, outer_dom) {
      if(!selected_outer_dom && outer_dom.contains(element) && outer_dom != element) {
        selected_outer_dom = outer_dom;
      }
    });
    return selected_outer_dom;
  },

  inOuterDomElement: function(element) {
    var self = this;
    var curr_container = self.fetchContainer(element);   

    if(curr_container) {
      return true;
    } else {
      return false;
    }
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

  refreshAllContainerChildren: function() {
    var self = this;
    self.containers.forEach(function(container) {
      container.children = self.mostFrequenctOccurringChildren(container.table);
    })
  },


  mostFrequenctOccurringChildren(container_element) {
    var self = this;
    var curr_children = $(container_element).children() // full list of children
    var classname_reference_keys = {} // CSS keyword references
    var object_reference_keys = {} // Full Object key reference

    curr_children.each(function(index, curr_child) {
        // Ignores none visible element tags 
        if (!self.disallowed_elements.includes(curr_child.nodeName.toLowerCase()) && $(curr_child).text().trim().length) {
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
            return !self.disallowed_elements.includes(curr_child.nodeName.toLowerCase()) && 
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