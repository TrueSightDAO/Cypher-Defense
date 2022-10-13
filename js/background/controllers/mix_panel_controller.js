var MixPanelController = function(mixpanel_key, version, muuid_path) {
  var self      = this;
  self.version  = version;
  self.muuid_path = muuid_path;  
  mixpanel.init(mixpanel_key);
  self.setId();
  self.trackVersion();
}

MixPanelController.prototype.setId = function() {
  var self = this;
  self.xhr = new XMLHttpRequest();
  muuid_url = self.muuid_path;
  self.xhr.open("GET", muuid_url, true);
  self.xhr.onreadystatechange = function() {
    if (self.xhr.readyState == 4) {  
      self.id = JSON.parse(self.xhr.responseText)["muuid"];
      console.log("Identity : %s", self.id);
      mixpanel.identify(self.id);
      console.log("extension tracking as " + self.id);
    }
  }
  self.xhr.send();
}

/** Returns the current User id on MixPanel **/
MixPanelController.prototype.getId = function() {
  var self = this;
  var response    = {}
  response.data   = self.id;
  response.status = 'success';
  return response;
}

MixPanelController.prototype.trackVersion = function() {
  var self = this;

  if(!localStorage.getItem('version')){
    mixpanel.track("developer - extension installed - browser", { 'extension_version' : self.version });
    localStorage.setItem('version', self.version );

  // When updating the browser extension
  } else if(localStorage.getItem('version') != self.version) {
    mixpanel.track( "developer - extension updated - browser",{
      'extension_version' : chrome.runtime.getManifest().version,
      'old_extension_version' : localStorage.getItem('version')
    });
    localStorage.setItem('version', self.version );

  };

}

MixPanelController.prototype.trackExtensionActivation = function() {
  var self = this;
  Env.getSelectedTab(null, function(tab) {
    var kwin = new KTab(tab.id);
    
    mixpanel.track("developer - extension activated", {
      'extension_version' : self.version,
      'url_location' : tab.url,
      'has_recommendations': kwin.hasRecommendations()
    });
  });  
}

MixPanelController.prototype.trackExtensionDeactivation = function() {
  var self = this;
  Env.getSelectedTab(null, function(tab) {
    mixpanel.track("developer - extension deactivated", {
      'extension_version' : self.version,
      'url_location' : tab.url
    });//eo mixpanel.track
  }); 
}

MixPanelController.prototype.trackColumnCreation = function() {
  var self = this;
  Env.getSelectedTab(null, function(tab) {
    mixpanel.track("developer - extension column created", {
      'extension_version' : self.version,
      'url_location' : tab.url
    });
  }); 
}

MixPanelController.prototype.trackColumnUpdate = function(context_obj) {
  var self = this;
  context_obj = context_obj || {}
  context_obj['extension_version'] = self.version;

  Env.getSelectedTab(null, function(tab) {
    context_obj['url_location'] = tab.url;    
    mixpanel.track("developer - extension column updated", context_obj);
  }); 
}

MixPanelController.prototype.trackColumnSaved = function() {
  var self = this;
  Env.getSelectedTab(null, function(tab) {   
    mixpanel.track("developer - extension column saved", {
      'extension_version' : self.version,
      'url_location' : tab.url
    });//eo mixpanel.track
  });  
}

MixPanelController.prototype.trackColumnDeleted = function() {
  var self = this;
  Env.getSelectedTab(null, function(tab) {   
    mixpanel.track("developer - extension column deleted", {
      'extension_version' : self.version,
      'url_location' : tab.url
    });//eo mixpanel.track
  }); 
}

MixPanelController.prototype.trackDone = function() {
  var self = this;
  Env.getSelectedTab(null, function(tab) {   
    mixpanel.track("developer - extension done", {
      'extension_version' : self.version,
      'url_location' : tab.url
    });//eo mixpanel.track
  }); 
}

/** Export for node testing **/
try { 
  module && (module.exports = MixPanelController); 
} catch(e){}