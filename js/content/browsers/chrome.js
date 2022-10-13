/**
  Chrome environment specific functions and event attachments
**/
var Env = {};

Env.sendMessage = function(payload, callback) {
  chrome.runtime.sendMessage(payload, callback);
}

Env.getVersion = function() {
  return chrome.runtime.getManifest().version;
}

Env.imagePath = function(img_path) {
  return "'" + chrome.extension.getURL(img_path) + "'";
}

Env.filePath = function(file_path) {
  return chrome.extension.getURL(file_path);
}

Env.registerListener = function(listener) {
 chrome.extension.onMessage.addListener(listener); 
}

Env.loadTemplate = function(template_name, callback) {
  var file_path = "js/content/templates/" + template_name + ".hbs";
  var loading_bay = $('<div>');
  loading_bay.load(Env.filePath(file_path), function() {  
    callback && callback( $(loading_bay).html() );
  });
}

Env.redirect = function(page_url) {
  window.redirect = page_url;
}

Env.getMutationObserver = function(dom, callback) {
  var observer = new MutationObserver(callback);
  var observation_config = {
    attributes: true
  };
  observer.observe(dom, observation_config);
  return observer;
}

Env.getDomain = function() {
  return document.domain;
}

Env.getLocation = function() {
  return window.location.toString();
}

Env.getPageDescription = function() {
  return $("meta[name='description']").attr("content");
}

Env.getPageKeywords = function() {
  return $("meta[name='keywords']").attr("content");
}