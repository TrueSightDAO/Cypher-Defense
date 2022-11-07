var BrowserIconView = function() {}

BrowserIconView.blacklisted = function() {
  Env.setIcon(CONFIG["active_icon"]);
}

BrowserIconView.verified = function() {
  Env.setIcon(CONFIG["validated_icon"]);
}

BrowserIconView.deactivate = function() {
  Env.setIcon(CONFIG["inactive_icon"]);
}

/** Export for node testing **/
try { 
  module && (module.exports = BrowserIconView); 
} catch(e){}