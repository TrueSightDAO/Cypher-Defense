(function() {
  var template = Handlebars.template, templates = Handlebars.templates = Handlebars.templates || {};
templates['recommended_panel_column.hbs'] = template({"1":function(container,depth0,helpers,partials,data) {
    return "    <input class=\"recommend-checkbox\" type=\"checkbox\" checked=\"checked\" ></input>\n";
},"3":function(container,depth0,helpers,partials,data) {
    return "    <input class=\"recommend-checkbox\" type=\"checkbox\"></input>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<label class=\"recommended-label\">\n  <div class=\"recommendation-col_name\">\n    "
    + alias4(((helper = (helper = lookupProperty(helpers,"col_name") || (depth0 != null ? lookupProperty(depth0,"col_name") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"col_name","hash":{},"data":data,"loc":{"start":{"line":3,"column":4},"end":{"line":3,"column":16}}}) : helper)))
    + "\n  </div>\n  <div class=\"recommendation-counter\">\n    "
    + alias4(((helper = (helper = lookupProperty(helpers,"counter") || (depth0 != null ? lookupProperty(depth0,"counter") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"counter","hash":{},"data":data,"loc":{"start":{"line":6,"column":4},"end":{"line":6,"column":15}}}) : helper)))
    + "\n  </div>  \n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"selected") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.program(3, data, 0),"data":data,"loc":{"start":{"line":8,"column":2},"end":{"line":12,"column":9}}})) != null ? stack1 : "")
    + "\n  <span class=\"checkmark\"></span>\n</label>\n\n";
},"useData":true});
})();