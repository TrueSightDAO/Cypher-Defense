(function() {
  var template = Handlebars.template, templates = Handlebars.templates = Handlebars.templates || {};
templates['listing_panel_recommended_column.hbs'] = template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"listing_panel_top_section\">\n  <div class='listing_panel_col_header'>\n    recommended:\n    "
    + alias4(((helper = (helper = lookupProperty(helpers,"col_header") || (depth0 != null ? lookupProperty(depth0,"col_header") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"col_header","hash":{},"data":data,"loc":{"start":{"line":4,"column":4},"end":{"line":4,"column":18}}}) : helper)))
    + "\n  </div>\n  <div class='list-panel-action-holder'>\n    <div id='delete-icon' class='delete-icon'></div>\n    <div id='activate-icon' class='activate-icon'></div>\n  </div>  \n</div>\n\n<div class='listing_panel_col_name_holder'>\n  <div class=\"col_name\" contenteditable=\"true\">"
    + alias4(((helper = (helper = lookupProperty(helpers,"col_name") || (depth0 != null ? lookupProperty(depth0,"col_name") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"col_name","hash":{},"data":data,"loc":{"start":{"line":13,"column":47},"end":{"line":13,"column":59}}}) : helper)))
    + "</div>\n</div>\n\n<div class='listing_panel_required_attribute_holder'>\n  <select class=\"listing_panel_required_attribute\" disabled>\n    <option class=\"selected_attribute\" value=\""
    + alias4(((helper = (helper = lookupProperty(helpers,"required_attribute") || (depth0 != null ? lookupProperty(depth0,"required_attribute") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"required_attribute","hash":{},"data":data,"loc":{"start":{"line":18,"column":46},"end":{"line":18,"column":68}}}) : helper)))
    + "\">\n      "
    + alias4(((helper = (helper = lookupProperty(helpers,"required_attribute_display") || (depth0 != null ? lookupProperty(depth0,"required_attribute_display") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"required_attribute_display","hash":{},"data":data,"loc":{"start":{"line":19,"column":6},"end":{"line":19,"column":36}}}) : helper)))
    + "\n    </option>\n  </select>\n</div>    \n\n<div class='listing-panel-sample-data'>\n  <div class='listing-panel-sample-data-content' >\n    "
    + alias4(((helper = (helper = lookupProperty(helpers,"sample_data") || (depth0 != null ? lookupProperty(depth0,"sample_data") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"sample_data","hash":{},"data":data,"loc":{"start":{"line":26,"column":4},"end":{"line":26,"column":19}}}) : helper)))
    + "\n  </div>\n</div>";
},"useData":true});
})();