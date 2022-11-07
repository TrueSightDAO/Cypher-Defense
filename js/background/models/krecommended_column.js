var KRecommendedColumn = function(
  recommendation_id,
  col_name,
  dom_query,
  outer_dom_query,
  domain_name,
  required_attribute,
  regex_pattern,
  regex_group,
  listagg,
  listagg_delimiter,
  page_id,
  ass_count
) {

  var self = this;  

  // Global directory
  if(recommendation_id) {
    var krecommended_columns = KRecommendedColumn.find({ recommendation_id: recommendation_id });

  // Local auto detected
  } else if(page_id) {
    var recommendation_id = "LOCAL_" + page_id + " " + col_name;
    var krecommended_columns = KRecommendedColumn.find({ page_id: page_id, 
      dom_query: dom_query,
      outer_dom_query: outer_dom_query,
      required_attribute: required_attribute
    })
  }
  
  if(krecommended_columns.length == 0) {
    KRecommendedColumn.instances.push(self);
  } else {
    self = krecommended_columns[0];
  }

  self.id                 = recommendation_id;
  self.recommendation_id  = recommendation_id;
  self.col_name           = self.col_name || col_name;
  self.default_col_name   = col_name;
  self.dom_query          = dom_query;
  self.outer_dom_query    = outer_dom_query;
  self.domain_name        = domain_name;
  self.required_attribute = required_attribute;
  self.regex_pattern      = regex_pattern;
  self.regex_group        = regex_group;
  self.listagg            = listagg;
  self.listagg_delimiter  = listagg_delimiter;
  self.page_id            = page_id;  
  self.ass_count          = ass_count;

  return self;
  
}

KRecommendedColumn.instances = [];

KRecommendedColumn.reset = function() {
  KRecommendedColumn.instances = [];
}

/**
  Returns an array of KPagination instances with match parameters

  param:
    id
    domain_name
**/ 
KRecommendedColumn.find = function(param) {
  param = param || {};
  return KRecommendedColumn.instances.filter(function(obj) {
    to_return = true;
    Object.keys(param).forEach(function(attr) {
      to_return &= param[attr] == obj[attr];
    });
    return to_return;
  });
};



KRecommendedColumn.syncRecommendedColumns = function(domain_name, hard_refresh) {

  var deferred  = $.Deferred();

  if(!hard_refresh) {
    var refresh_key = new Date().getTime();      
  } else {
    var refresh_key = new Date().getDate();
  }
  
  return
  if(!Application.public_count) {
    console.log("public count not loaded yet");
    Application.loadPublicCountCache().then(function() {
      KRecommendedColumn.syncRecommendedColumnsExec(domain_name, deferred);    
    })

  } else if (Application.public_count[domain_name]) {
    var last_sync = Application.public_count[domain_name]["last_sync"];
    var last_update = Application.public_count[domain_name]["last_update"];
    if(!last_sync) {
      console.log("not synced before, syncing now");
      KRecommendedColumn.syncRecommendedColumnsExec(domain_name, deferred);        

    } else if(last_sync < last_update) {
      console.log("synced is outdated, syncing now");
      KRecommendedColumn.syncRecommendedColumnsExec(domain_name, deferred);        

    } else {
      console.log("synced is update to date skipping for now");
      deferred.resolve();
    }
  } else if (!Application.public_count[domain_name]) {
    console.log("no recommendations for domain");
    deferred.resolve();
  }
  
  
  return deferred.promise();

}

KRecommendedColumn.syncRecommendedColumnsExec = function(domain_name, deferred) {
  console.log("fetching recommended columns");
  console.log("https://cache.getdata.io/PUBLIC_KRAKE/RECOMMENDATIONS/" + domain_name + "?refresh_key=" + new Date().getTime());  
  $.ajax({
    url : "https://cache.getdata.io/PUBLIC_KRAKE/RECOMMENDATIONS/" + domain_name + "?refresh_key=" + new Date().getTime(),
    type : "get",
    success : function(data) {
      console.log("finished fetching recommended columns");
      if(Array.isArray(data)) {
        var recommendations_raw = data;
      } else {
        var recommendations_raw = JSON.parse(data);  
      }
      recommendations_raw.forEach(function(item) {
        new KRecommendedColumn(
          item["recommendation_id"],
          item["col_name"],
          item["dom_query"],
          item["outer_dom_query"],
          domain_name,
          item["required_attribute"],
          item["regex_pattern"],
          item["regex_group"],
          item["listagg"],
          item["listagg_delimiter"],
          null,
          item["ass_count"]
        );
      });
      Application.public_count[domain_name]["last_sync"] = new Date().getTime();
      deferred.resolve();
    },
    error: function() {
      console.log("could not fetch recommended columns");
      deferred.resolve();
    }
  });  
}


/**
  Returns the JSON for content.js display
**/
KRecommendedColumn.prototype.toJson = function() {
  var self    = this;
  var partial = {};
  partial.id                 = self.id;
  partial.recommendation_id  = self.recommendation_id;
  partial.col_name           = self.col_name;
  partial.default_col_name   = self.default_col_name;
  partial.dom_query          = self.dom_query;
  partial.outer_dom_query    = self.outer_dom_query;
  partial.domain_name        = self.domain_name;    
  partial.required_attribute = self.required_attribute;
  partial.regex_pattern      = self.regex_pattern;
  partial.regex_group        = self.regex_group;
  partial.listagg            = self.listagg;
  partial.listagg_delimiter  = self.listagg_delimiter;  
  partial.ass_count          = self.ass_count;
  
  return partial;
}

/**
  Export module for use in NodeJs
**/
try { 
  module && (module.exports = KRecommendedColumn); 
} catch(e){}