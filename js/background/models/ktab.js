/**
  Encapsulates the Browser Tab and its programmatic interactions
**/
var KTab = function(tab_id, top, right){
  var kwins = KTab.find({ id: tab_id });
  if(kwins.length > 0) {
    kwins[0].top    = top || kwins[0].top ;
    kwins[0].right  = right || kwins[0].right;
    return kwins[0];
  }

  var self = this;
  self.active = false;
  self.top    = top;
  self.right  = right;
  self.id = tab_id;
  KTab.instances.push(self);
  return self;
}

KTab.instances = [];

KTab.reset = function() {
  KTab.instances = [];
}

KTab.find = function(param) {
  param = param || {};
  return KTab.instances.filter(function(obj) {
    to_return = true;
    Object.keys(param).forEach(function(attr) {
      to_return &= param[attr] == obj[attr];
    });
    return to_return;
  });  
}

KTab.prototype.setDataSourceCount = function(data_count) {
  var self = this;
  self.datasource_count = data_count;
}

KTab.prototype.getDataSourceCount = function() {
  var self = this;
  return self.datasource_count; 
}

KTab.prototype.setDataSourceCommunityUrl = function(community_url) {
  var self = this;
  self.community_url = community_url;
}

KTab.prototype.getDataSourceCommunityUrl = function() {
  var self = this;
  return self.community_url;
}

KTab.prototype.hasRecommendations = function() {
  var self = this;
  return self.datasource_count > 0; 
}


KTab.prototype.setDomain = function(url) {
  var self = this;
  self.domain = Env.fetchHostName(url);
}

KTab.prototype.getDomain = function() {
  var self = this;
  return self.domain;
}


KTab.prototype.isActive = function() {
  var self = this;
  return self.active;
}

KTab.prototype.activate = function() {
  var self    = this;
  self.active = true;
  Env.sendMessage(self.id, { method: "activate" }, function() {});
}

KTab.prototype.triggerGetData = function() {
  var self    = this;
  self.active = true;
  Env.sendMessage(self.id, { method: "triggerGetData" }, function() {});
}

KTab.prototype.refreshRecommendations = function() {
  console.log("refreshing recommendations");
  var self    = this;
  Env.sendMessage(self.id, { method: "refreshRecommendations" }, function() {});
}

KTab.prototype.deactivate = function() {
  var self    = this;
  self.active = false;
  Env.sendMessage(self.id, { method: "deactivate" }, function() {});  
}

KTab.prototype.toJson = function() {
  var self                    = this;
  var partial                 = {};
  partial.active              = self.active;
  partial.id                  = self.id;
  partial.datasource_count    = self.getDataSourceCount();
  partial.community_url       = self.getDataSourceCommunityUrl();
  partial.domain              = self.getDomain();
  partial.has_recommendations = self.hasRecommendations();
  partial.top                 = self.top;
  partial.right               = self.right;
  return partial;  
}

/**
  Export module for use in NodeJs
**/
try { 
  module && (module.exports = KTab); 
} catch(e){}