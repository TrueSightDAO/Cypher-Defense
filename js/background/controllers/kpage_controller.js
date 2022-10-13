var KPageController = {};

KPageController.find = function(data_obj, tab_obj) {
  var kpage       = KPage.find({ id: data_obj.page_id })[0];
  response        = {}
  if(kpage) {
    response.data   = kpage.toJson();
    response.status = "success";    
  } else {
    response.err_msg = "Page not found";
    response.status = "error";    
  }
  return response;
}

KPageController.refresh = function(data_obj, tab_obj) {
  var kpage       = KPage.find({ origin_url: data_obj.origin_url })[0];
  response        = {}
  if(kpage) {
    response.data   = kpage.toJson();
    response.status = "success";    
  } else {
    response.err_msg = "Page not found";
    response.status = "error";    
  }
  return response;
}

KPageController.create = function(data_obj, tab_obj) {
  var kpage       = new KPage(tab_obj.url, tab_obj.id, null, null, tab_obj.title, 
                              data_obj.domain, data_obj.description, data_obj.keywords,
                              data_obj.scroll_height , data_obj.infinite_scroll,
                              data_obj.element_count, data_obj.has_ajax);
  response        = {}
  response.data   = kpage.toJson();
  response.status = "success";
  return response;
}

KPageController.update = function(data_obj, tab_obj) {
  var kpage       = new KPage(tab_obj.url, tab_obj.id, null, null, tab_obj.title, 
                              data_obj.domain, data_obj.description, data_obj.keywords, 
                              data_obj.scroll_height , data_obj.infinite_scroll,
                              data_obj.element_count, data_obj.has_ajax);
  response        = {}
  response.data   = kpage.toJson();
  response.status = "success";
  return response;
}

/** Export for node testing **/
try { 
  module && (module.exports = KPageController); 
} catch(e){}