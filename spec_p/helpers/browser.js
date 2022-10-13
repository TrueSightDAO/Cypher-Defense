/**
  Chrome environment specific functions and event attachments
**/
var Env = {};

Env.sendMessage = function(payload, callback) {

}

Env.imagePath = function(img_path) {
  return
}

Env.filePath = function(file_path) {
  return "../" + file_path;
}

Env.registerListener = function(listener) {
 
}

Env.loadTemplate = function(template_name, callback) {
  callback && callback( $("#fixture_" + template_name).html() );
}

Env.redirect = function() {}

Env.getVersion = function() {
  return "test version";  
}

Env.registerListener = function(event_type, listener) {

}

Env.getDomain = function() {
  return "testing.com";
}

Env.getLocation = function() {
  return "http://testing.com";
}

Env.getPageDescription = function() {
  return "Description for testing page";
}

Env.getPageKeywords = function() {
  return "Keywords for testing page";
}

Env.fetchHostName = function(url) {
  var hostname;

  if (url.indexOf("//") > -1) {
      hostname = url.split('/')[2];
  }
  else {
      hostname = url.split('/')[0];
  }

  //find & remove port number
  hostname = hostname.split(':')[0];
  //find & remove "?"
  hostname = hostname.split('?')[0];

  return hostname;
}