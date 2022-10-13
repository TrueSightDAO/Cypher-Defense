var KPagination = function(page_id) {

  var kpaginations = KPagination.find({ page_id: page_id });  
  if(kpaginations.length > 0) return kpaginations[0];

  var self        = this;
  self.page_id    = page_id;
  self.id         = KPagination.getId();
  self.dom_array  = [];
  KPagination.instances.push(self);
}

KPagination.instances = [];

/** Generates a unique id for a new KPagination **/
KPagination.getId = function() {
  return KPagination.instances.length + 1;
};

KPagination.reset = function() {
  KPagination.instances = [];
}

/**
  Returns an array of KPagination instances with match parameters

  param:
    id
    page_id
**/ 
KPagination.find = function(param) {
  param = param || {};
  return KPagination.instances.filter(function(obj) {
    to_return = true;
    Object.keys(param).forEach(function(attr) {
      to_return &= param[attr] == obj[attr];
    });
    return to_return;
  });
};

KPagination.isArray = function(dom_array) {
  if( Object.prototype.toString.call( dom_array ) === '[object Array]' ) {
    return true;
  };
  return false;
}

/** 
  Sets the dom array for this column
  returns false if the input is invalid
**/
KPagination.prototype.set = function(dom_array) {
  var self = this;  

  if( !KPagination.isArray(dom_array) ) { return false; };

  anchor_index = dom_array.map(function(dom) {
    return dom.el;
  }).indexOf("a");

  if(anchor_index < 0 ) return false;  

  dom_array = dom_array.slice(0, anchor_index + 1)

  self.dom_array = dom_array.map(function(item) {
    item.el = item.el.toLowerCase();
    return item;
  });

  return true;
}

KPagination.prototype.isSet = function() {
  var self = this;
  return self.dom_array && self.dom_array.length > 0;
}

KPagination.prototype.domQuery = function() {
  var self = this;
  return self.dom_array.map(function(dom){
    query = "";
    dom.el        && (query += dom.el);
    dom.position  && (query += ":nth-child(" + dom.position + ")");
    dom.class     && (query += dom.class);
    dom.id        && (query += dom.id);
    dom.contains  && (query += ":contains('" + dom.contains + "')");
    dom.has       && (query += dom.has);
    return query;

  }).join(" ");
};

/**
  Returns the JSON partial for the data definition schema

  Returns:
    columns_object: https://getdata.io/docs/define-data#next_page_object
    
**/
KPagination.prototype.toParams = function() {
  var self = this;
  partial = {};
  partial.dom_query = self.domQuery();
  partial.click     = true;
  return partial;
}

/**
  Returns the JSON partial for content.js
    
**/
KPagination.prototype.toJson = function() {
  var self = this;
  partial = {};
  partial.id             = self.id;
  partial.has_pagination = self.isSet();  
  partial.dom_query = self.domQuery();
  partial.dom_array = self.dom_array;
  return partial;
}

/**
  Export module for use in NodeJs
**/
try { 
  module && (module.exports = KPagination); 
} catch(e){}