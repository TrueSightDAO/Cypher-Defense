(function() {
  var template = Handlebars.template, templates = Handlebars.templates = Handlebars.templates || {};
templates['listing_panel_column.hbs'] = template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"listing_panel_top_section\">\n  <div class='listing_panel_col_header'>\n    "
    + alias4(((helper = (helper = lookupProperty(helpers,"col_header") || (depth0 != null ? lookupProperty(depth0,"col_header") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"col_header","hash":{},"data":data,"loc":{"start":{"line":3,"column":4},"end":{"line":3,"column":18}}}) : helper)))
    + "\n  </div>\n  <div class='list-panel-action-holder'>\n    <div id='delete-icon' class='delete-icon'></div>\n    <div id='activate-icon' class='activate-icon'></div>\n  </div>  \n</div>\n\n<div class='listing_panel_col_name_holder'>\n  <div class=\"col_name\" contenteditable=\"true\">"
    + alias4(((helper = (helper = lookupProperty(helpers,"col_name") || (depth0 != null ? lookupProperty(depth0,"col_name") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"col_name","hash":{},"data":data,"loc":{"start":{"line":12,"column":47},"end":{"line":12,"column":59}}}) : helper)))
    + "</div>\n</div>\n\n<div class='listing_panel_required_attribute_holder'>\n  <select class=\"listing_panel_required_attribute\">\n    <option value=\"inner_text\">inner text</option>\n    <option value=\"href\">hyperlink</option>\n    <option value=\"src\">source</option>\n    <option value=\"inner_html\">inner html</option>\n  </select>\n</div>    \n\n<div class='listing-panel-sample-data'>\n  <div class='listing-panel-sample-data-content' >\n    "
    + alias4(((helper = (helper = lookupProperty(helpers,"sample_data") || (depth0 != null ? lookupProperty(depth0,"sample_data") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"sample_data","hash":{},"data":data,"loc":{"start":{"line":26,"column":4},"end":{"line":26,"column":19}}}) : helper)))
    + "\n  </div>\n</div>";
},"useData":true});
})();