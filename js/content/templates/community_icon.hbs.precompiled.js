(function() {
  var template = Handlebars.template, templates = Handlebars.templates = Handlebars.templates || {};
templates['community_icon.hbs'] = template({"1":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "  <div \n    id='datasource_recommendations_holder' \n    data-toggle=\"tooltip\" \n    tooltip-content=\""
    + alias4(((helper = (helper = lookupProperty(helpers,"datasource_num") || (depth0 != null ? lookupProperty(depth0,"datasource_num") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"datasource_num","hash":{},"data":data,"loc":{"start":{"line":5,"column":21},"end":{"line":5,"column":41}}}) : helper)))
    + " community recipes found.\" \n  >\n    <span id=\"recommendations_icon\" ></span>  \n    <span id=\"recommendations_num\" > \n      "
    + alias4(((helper = (helper = lookupProperty(helpers,"datasource_num") || (depth0 != null ? lookupProperty(depth0,"datasource_num") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"datasource_num","hash":{},"data":data,"loc":{"start":{"line":9,"column":6},"end":{"line":9,"column":26}}}) : helper)))
    + "\n    </span>\n\n  </div>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"show_datasource_recommendations") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":1,"column":0},"end":{"line":13,"column":7}}})) != null ? stack1 : "");
},"useData":true});
})();