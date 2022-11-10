(function() {
  var template = Handlebars.template, templates = Handlebars.templates = Handlebars.templates || {};
templates['notification_panel.hbs'] = template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div id='getdata-notification-popup-container'>\n  <div id='getdata-notification-popup-message'>\n    "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"notification_message") || (depth0 != null ? lookupProperty(depth0,"notification_message") : depth0)) != null ? helper : alias2),(typeof helper === "function" ? helper.call(alias1,{"name":"notification_message","hash":{},"data":data,"loc":{"start":{"line":3,"column":4},"end":{"line":3,"column":28}}}) : helper)))
    + "\n  </div>\n  "
    + ((stack1 = (lookupProperty(helpers,"img")||(depth0 && lookupProperty(depth0,"img"))||alias2).call(alias1,"images/notification-close-icon.svg","close-notification-icon","close-notification-icon",{"name":"img","hash":{},"data":data,"loc":{"start":{"line":5,"column":2},"end":{"line":5,"column":101}}})) != null ? stack1 : "")
    + "\n</div>";
},"useData":true});
})();