(function() {
  var template = Handlebars.template, templates = Handlebars.templates = Handlebars.templates || {};
templates['notification_save_panel.hbs'] = template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div id='getdata-notification-save-popup-container'>\n  <div id='getdata-notification-popup-message'>\n    A copy was been saved to your account too\n  </div>\n  "
    + ((stack1 = (lookupProperty(helpers,"img")||(depth0 && lookupProperty(depth0,"img"))||container.hooks.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),"images/notification-close-icon.svg","close-notification-icon","close-notification-icon",{"name":"img","hash":{},"data":data,"loc":{"start":{"line":5,"column":2},"end":{"line":5,"column":101}}})) != null ? stack1 : "")
    + "\n</div>";
},"useData":true});
})();