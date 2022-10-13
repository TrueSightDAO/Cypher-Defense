var KRecommendedColumnSelected = function(
  recommendation_id,
  tab_id,  
  page_id,  
  col_name
) {
  var self = this;
  var result = KRecommendedColumnSelected.find({
    recommendation_id: recommendation_id,
    page_id: page_id, 
    tab_id: tab_id
  })[0];

  if(result) {
    self = result;

  } else {
    self.id                 = KRecommendedColumnSelected.getId();
    self.recommendation_id  = recommendation_id;
    self.page_id            = page_id;
    self.tab_id             = tab_id;      
    KRecommendedColumnSelected.instances.push(self);
  }

  self.col_name           = col_name;
  return self;  
}

KRecommendedColumnSelected.instances = [];

KRecommendedColumnSelected.getId = function() {
  if(KRecommendedColumnSelected.instances.length == 0) {
    return 1
  } else {
    current_ids = KRecommendedColumnSelected.instances.map(function(kc) {
      return kc.id;
    });
    return Math.max.apply(null, current_ids) + 1;
  }
};

KRecommendedColumnSelected.reset = function() {
  KRecommendedColumnSelected.instances = [];
};


/**
  Returns an array of KRecommendedColumnSelected instances with match parameters

  param:
    id:Integer
    recommendation_id:Integer
    page_id:Integer
**/
KRecommendedColumnSelected.find = function(param) {
  param = param || {};
  return KRecommendedColumnSelected.instances.filter(function(obj) {
    to_return = true;
    Object.keys(param).forEach(function(attr) {
      to_return &= param[attr] == obj[attr];
    });
    return to_return;
  });
};


KRecommendedColumnSelected.delete = function(krcs_id) {
  KRecommendedColumnSelected.instances = KRecommendedColumnSelected.instances.filter(function(obj) {
    return obj.id != krcs_id;
  });
  return "success"
}


/**
  Export module for use in NodeJs
**/
try { 
  module && (module.exports = KRecommendedColumnSelected); 
} catch(e){}