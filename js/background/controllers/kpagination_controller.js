var KPaginationController = {};

KPaginationController.can_update = [ "dom_array" ];

KPaginationController.create = function(data_obj, tab_obj) {
  var kpage       = new KPage(tab_obj.url, tab_obj.id, null, null, tab_obj.title);
  var kpagination = new KPagination(kpage.id);
  response        = {}
  response.data   = kpagination.toJson();
  response.status = "success";
  return response;
}

KPaginationController.update = function(new_attributes, tab_obj) {
  console.log("kpagination updated was called");
  var kpagination = new KPagination.find({ id: new_attributes.id })[0];
  KPaginationController.can_update.forEach(function(attr) {
    kpagination[attr] = new_attributes[attr];
  });
  response        = {};
  response.data   = kpagination.toJson();
  response.status = "success";
  return response;  
}

/** Export for node testing **/
try { 
  module && (module.exports = KPaginationController); 
} catch(e){}