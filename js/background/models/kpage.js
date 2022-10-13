/** Node environmental dependencies **/
try { var KColumn                     = require('./kcolumn'); } catch(e) {}
try { var KRecommendedColumn          = require('./krecommended_column'); } catch(e) {}
try { var KRecommendedColumnSelected  = require('./krecommended_column_selected'); } catch(e) {}
try { var KPagination                 = require('./kpagination'); } catch(e) {}
try { var KCookie                     = require('./kcookie'); } catch(e) {}
try { var CONFIG                      = require('../../config/config'); } catch(e) {}

/**
  Constructor: Instantiates a new page Instance if it not already exist. Returns the existing one otherwise

  Params: 
    origin_url:String
    tab_id:Integer
    parent_url:String
    parent_column_id:String
    page_title:String

  Return:
    page:KPage

**/ 
var KPage = function(origin_url, tab_id, parent_url, parent_column_id, page_title, domain, page_description, page_keywords,
    scroll_height, infinite_scroll, element_count, has_ajax
  ) { 
  var self = this;
  // pages = KPage.find({ origin_url: origin_url, tab_id: tab_id });
  pages = KPage.find({ origin_url: origin_url });

  if(pages.length > 0) {
    var the_page = pages[0];
    
  } else {
    self.id                   = KPage.getId();
    self.origin_url           = origin_url;
    self.tab_id               = tab_id;
    self.parent_url           = parent_url;
    self.parent_column_id     = parent_column_id;
    self.page_title           = page_title;
    self.domain               = Env.fetchHostName(origin_url);
    self.page_description     = page_description;
    self.page_keywords        = page_keywords;
    self.kcookie              = new KCookie(self.domain);    
    KPage.instances.push(self);
    var the_page = self;
  }
  
  the_page.scroll_height   = scroll_height    || the_page.scroll_height;
  the_page.infinite_scroll = infinite_scroll  || the_page.infinite_scroll;
  the_page.element_count   = element_count    || the_page.element_count;  
  the_page.has_ajax        = has_ajax         || the_page.has_ajax;    

  return the_page;

};

/** Class level methods **/

/** page instances **/
KPage.instances = [];

/** Generates a unique id for a new KPage **/
KPage.getId = function() {
  return KPage.instances.length + 1;
};

/**
  Static: Finds and returns a page object

  Params: 
    param:Hash
      origin_url:String
      tab_id:Integer

  Return:
    page:KPage
**/
KPage.find = function(param) {
  param = param || {};
  return KPage.instances.filter(function(obj) {
    to_return = true;
    Object.keys(param).forEach(function(attr) {
      // Ignore tab id
      if(attr != "tab_id") {
        to_return &= param[attr] == obj[attr];
      } 
      
    });
    return to_return;
  });
};

/**
  clears all the page instances from memory
**/
KPage.reset = function() {
  KPage.instances = [];
};

/**
  Returns true if page has parent, false otherwise
**/
KPage.prototype.hasParent = function() {
  var self = this;
  return !!self.parent_url;
};

/**
  Returns the parent page object or false
**/
KPage.prototype.parent = function() {
  var self = this;
  if(!self.parent_url) {
    return false;

  } else {
    return KPage.find({ origin_url: self.parent_url, tab_id: self.tab_id })[0];

  }
  
};

/**
  Returns child pages of current page object
**/ 
KPage.prototype.children = function() {
  var self = this;
  return KPage.find({ parent_url: self.origin_url, tab_id: self.tab_id });  
};

/** Returns the most ancient of pages that is ancestor of this page that has not parent **/
KPage.prototype.root = function() {
  var self = this;
  var current_page = this;
  while(current_page.hasParent()) {
    current_page = current_page.parent();
  }
  return current_page;
};


/** 
  Returns a column object
**/
KPage.prototype.newKColumn = function() {
  var self = this;
  return new KColumn(self.id);
};

/** Returns number of columns belonging to this KPage **/
KPage.prototype.kcolumnsCount = function() {
  var self = this;
  return KColumn.find({page_id: self.id}).length;
}

/** Returns all the columns belonging to this KPage **/
KPage.prototype.kcolumns = function() {
  var self = this;
  return KColumn.find({page_id: self.id});
}

KPage.prototype.kpaginationIsSet = function() {
  var self = this;
  return KPagination.find({page_id: self.id}).length > 0 && KPagination.find({page_id: self.id})[0].isSet();
}

/** Returns true if Kcolumns have been set for this KPage **/
KPage.prototype.kcolumnsIsSet = function() {
  var self = this;
  return KColumn.find({page_id: self.id}).length > 0;
}


KPage.prototype.hasKRecommendationsSelected = function() {
  var self = this;
  return KRecommendedColumnSelected.find({
    page_id: self.id
  }).length > 0
}

/**
  Returns the JSON partial for the data definition schema

  Params:
    include_url: Boolean

  Returns:
    options_object: https://getdata.io/docs/define-data#options_object

**/
KPage.prototype.toParams = function(include_url) {
  var self = this;
  var partial = { 
    "engine": CONFIG["default_engine"],
    "client_version": Env.getVersion()
  };
  if(include_url)               partial.origin_url = self.origin_url;  
  partial.actions = self.actionsToParams();

  partial.columns = [];
  if(self.hasKRecommendationsSelected()) {
    partial.columns = self.kRecommendationsSelectedToParams();
    
  }

  if(self.kcolumnsIsSet()) {
    partial.columns = partial.columns.concat(self.kcolumnsToParams());

  } else if(!self.kcolumnsIsSet() && partial.columns.length == 0) {
    partial.columns = [{
      "col_name": "URL changed while we were collecting data",
      "dom_query": ""
    }];

  }

  if(self.kpaginationIsSet())   partial.next_page = self.kpaginationToParams();
  if(self.kcookiesToParams())   partial.cookies = self.kcookiesToParams();
  return partial;
}

/**
  Returns the JSON for content.js display
**/
KPage.prototype.toJson = function() {
  var self = this;
  var partial = {};
  partial.id                = self.id;
  partial.origin_url        = self.origin_url;
  partial.tab_id            = self.tab_id;
  partial.krake_handle      = self.krake_handle;      
  partial.parent_url        = self.parent_url;
  partial.parent_column_id  = self.parent_column_id;
  partial.page_title        = self.page_title;
  partial.has_pagination    = self.kpaginationIsSet();
  partial.has_pagination    = self.kpaginationIsSet();
  partial.scroll_height     = self.scroll_height;
  partial.infinite_scroll   = self.infinite_scroll;
  partial.element_count     = self.element_count;
  partial.has_ajax          = self.has_ajax;    
  partial.right             = self.right;   
  partial.top               = self.top;    
  return partial;
}

KPage.prototype.actionsToParams = function() {
  var self = this;
  var actions = [];  
  if(self.has_ajax) {
    actions.push({
      "action_name": "wait",
      "milliseconds": 5000
    });
  }

  if(self.infinite_scroll) {
    actions.push({
      "action_name": "scroll_bottom",
      "times": 3,
      "milliseconds": 5000
    });
  }
  return actions;
}

KPage.prototype.kpaginationToParams = function() {
  var self = this;
  var paginations = KPagination.find({ page_id: self.id });
  if(paginations.length > 0) return paginations[0].toParams();
}

KPage.prototype.kcookiesToParams = function() {
  var self = this;
  var kcookie = KCookie.find({domain: self.domain})[0];
  if(kcookie) return kcookie.toParams();
}

/**
  Returns the JSON partial for the data definition schema

  Returns:
    columns_object: https://getdata.io/docs/define-data#columns

**/
KPage.prototype.kcolumnsToParams = function() {
  var self = this;
  return self.kcolumns().map(function(kcolumn) {
    var col_partial = kcolumn.toParams();
    var child_pages = KPage.find({ parent_column_id: kcolumn.id });

    if(child_pages.length > 0) {
      var child_page = child_pages[0];
      if(col_partial.required_attribute == 'href' || col_partial.required_attribute == 'src' ) {
        col_partial.options = child_page.toParams();
      } else {
        col_partial.options = child_page.toParams(true);  
      }
    }
    return col_partial;

  });
}

KPage.prototype.kRecommendationsSelectedToParams = function() {
  var self = this;

  var recommended_columns = [];

  KRecommendedColumnSelected.find({
    page_id: self.id

  }).forEach(function(krcs) {
    var krc = KRecommendedColumn.find({
      recommendation_id: krcs.recommendation_id
    })[0];
    if(krc) {
      var compiled_column = {};
      compiled_column["recommendation_id"]  = krc.recommendation_id;
      compiled_column["col_name"]           = krc.col_name;
      compiled_column["dom_query"]          = krc.dom_query;

      krc.outer_dom_query && (compiled_column["outer_dom_query"] = krc.outer_dom_query);
      krc.required_attribute && (compiled_column["required_attribute"]= krc.required_attribute);
      krc.regex_pattern && (compiled_column["regex_pattern"] = krc.regex_pattern);
      krc.regex_group && (compiled_column["regex_group"] = krc.regex_group);
      krc.listagg && (compiled_column["listagg"] = krc.listagg);
      krc.listagg_delimiter && (compiled_column["listagg_delimiter"] = krc.listagg_delimiter);
    }

    recommended_columns.push(compiled_column);
  });
  return recommended_columns;
}

/** Export for node testing **/
try { 
  module && (module.exports = { 
    KPage:                      KPage, 
    KColumn:                    KColumn,
    KPagination:                KPagination,
    KCookie:                    KCookie,
    KRecommendedColumn:         KRecommendedColumn,
    KRecommendedColumnSelected: KRecommendedColumnSelected
  }); 
} catch(e){}