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
  chrome.browserAction.setIcon({path:img_path});
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
      chrome.browserAction.onClicked.addListener(listener);
      break;
    case "tabs_on_activate":
      chrome.tabs.onActivated.addListener(listener);
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

Env.sendMessageToBackground = function(payload, callback) {
  chrome.runtime.sendMessage( payload, callback);
}

Env.sendMessageToTab = function(tab_id, payload, callback) {
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
  chrome.browserAction.setBadgeText({
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
      currentWindow: true
  }, function(tabs) {
      var tab = tabs[0];
      callback(tab);
  });  
}

Env.filePath = function(file_path) {
  return chrome.extension.getURL(file_path);
}

Env.fetchHostName = function(url) {
  var temp_a  = document.createElement('a');
  temp_a.href = url;
  return temp_a.hostname.replace(/www./i, '').toLowerCase();
}

Env.request_config = {
  urls: ["<all_urls>"],
  tabId: self.tab_id,
  types: ["main_frame", "sub_frame", "stylesheet", "script", "font", "object", "xmlhttprequest", "other"]
}

Env.addBeforeWebRequestListener = function(callback) {
  chrome.webRequest.onBeforeRequest.addListener(callback, Env.request_config);
}

Env.removeBeforeWebRequestListener = function(callback) {
  chrome.webRequest.onBeforeRequest.removeListener(callback);    
   
}

Env.addCompletedWebRequestListener = function(callback) {
  chrome.webRequest.onCompleted.addListener(callback, Env.request_config);    
}

Env.removeCompletedWebRequestListener = function(callback) {
chrome.webRequest.onCompleted.removeListener(callback);    
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