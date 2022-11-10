(function() {
  var template = Handlebars.template, templates = Handlebars.templates = Handlebars.templates || {};
templates['column.hbs'] = template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    return "<div  class='counter'\n      data-toggle=\"tooltip\"\n      tooltip-content=\"Rows in this column. Click on any highlighted item to add more rows.\"\n></div>\n\n<div  class='delete fa fa-times'></div>\n";
},"useData":true});
})();