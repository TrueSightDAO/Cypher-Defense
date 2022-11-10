
/**
  Chrome environment specific functions and event attachments
**/
var Env = {};

Env.getSelectedTab = function(query, callback) {
  chrome.tabs.getSelected(query, callback);  
}

Env.getVersion = function() {
  return chrome.runtime.getManifest().version;
}

Env.setIcon = function(img_path) {
  chrome.action.setIcon({path:img_path});
}

Env.registerListener = function(event_type, listener) {
  switch(event_type) {
    case "runtime_on_message":
      chrome.runtime.onMessage.addListener(listener);
      break;
    case "tabs_on_update":
      chrome.tabs.onUpdated.addListener(listener);
      break;
    case "browser_action_onclick":
      chrome.action.onClicked.addListener(listener);
      break;
    case "tabs_on_activate":
      chrome.tabs.onActivated.addListener(listener);
      break;
    case "tabs_on_close":
      chrome.tabs.onRemoved.addListener(listener);
      break;      
    case "first_install": 
      chrome.runtime.onInstalled.addListener(listener);
      break;
    case "uninstall": 
      var uninstall_url =  CONFIG["server_host"] + CONFIG["paths"]["uninstall_path"] + "?client_id=" + CONFIG["oauth_client_id"] + "&oauth_token="+ KTabController.oauth_token;
      console.log("Uninstalling at " + uninstall_url);
      chrome.runtime.setUninstallURL(uninstall_url, listener);
  }
}

Env.sendMessage = function(tab_id, payload, callback) {
  chrome.tabs.sendMessage(tab_id, payload, callback);
}

Env.redirectTo = function(tab_id, url) {
  chrome.tabs.update(tab_id, {url: url});
}

Env.getCookies = function(domain, callback) {
  // Gets the cookie and sets it
  chrome.cookies.getAll({
     domain : domain
  }, callback);
}

Env.setIconText = function(text) {
  chrome.action.setBadgeText({
    text: text
  });
}

Env.fetchTabById = function(tab_id, callback) {
  chrome.tabs.get(tab_id, function(tab) {
      callback(tab);
  });    
}

Env.fetchCurrentTab = function(callback) {
  chrome.tabs.query({
      active: true,
      lastFocusedWindow: true
  }, function(tabs) {
      var tab = tabs[0];
      callback(tab);
  });  
}

Env.closeTab = function(tab_id) {
  chrome.tabs.remove(tab_id);
}

// background
Env.filePath = function(file_path) {
  return chrome.extension.getURL(file_path);
}

Env.fetchHostName = function(url) {
  var temp_a  = document.createElement('a');
  temp_a.href = url;
  return temp_a.hostname.replace(/www./i, '').toLowerCase();
}

Env.setInstalledCookie = function() {
  chrome.cookies.set({
    "name":"extension_installed",
    "url": CONFIG["server_host"],
    "value": Env.getVersion()
  },function (cookie){
  });  
}

/**
  Export module for use in NodeJs
**/
try { 
  module && (module.exports = Env); 
} catch(e){}



// Backwards compatibility hack for Chrome 20 - 25, ensures the plugin works for Chromium as well
if(chrome.runtime && !chrome.runtime.onMessage) {
  chrome.runtime.onMessage = chrome.extension.onMessage
} 

