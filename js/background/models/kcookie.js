// @Description : this class retrieves cookies from specific domain
var KCookie = function(domain) {

  kcookies = KCookie.find({ domain: domain });
  
  if(kcookies.length > 0) {
    kcookies[0].set();
    return kcookies[0]; 
  }

  var self    = this;
  self.domain = domain;
  self.set()
  KCookie.instances.push(self);
}

KCookie.instances = [];

KCookie.find = function(param) {
  param = param || {};
  return KCookie.instances.filter(function(obj) {
    to_return = true;
    Object.keys(param).forEach(function(attr) {
      to_return &= param[attr] == obj[attr];
    });
    return to_return;
  });  
}

KCookie.reset = function() {
  KCookie.instances = []
}

KCookie.isSet = function(domain) {
  return KCookie.find()
}

KCookie.prototype.set = function() {
  var self = this;
  Env.getCookies(self.domain, function(cookies) {
    self.cookies = cookies;
  });
}

KCookie.prototype.toParams = function() {
  var self = this;
  return self.cookies;
}

/** Node environmental dependencies **/
try { module && (module.exports = KCookie); } catch(e){}