try { var KColumn = require('../models/kcolumn'); } catch(e) {}
try { var KPage = require('../models/kpage'); } catch(e) {}
try { var KTab = require('../models/ktab'); } catch(e) {}

var KColumnsController = {};

KColumnsController.create = function( new_attributes, tab_obj) {
  Application.msg_controllers.mixpanel.trackColumnCreation();

  var kc          = new KColumn(new_attributes.page_id, tab_obj.id);
  KColumnsController.can_update.forEach(function(attr) {
    kc[attr] = new_attributes[attr] || kc[attr];
  });  

  response        = {}
  response.data   = kc.toJson();
  response.status = "success";
  return response;
}

KColumnsController.can_update = [ 
  "col_name", "dom_array", "outer_dom_array", "required_attribute", "count", "is_active", "counter" 
];

KColumnsController.update = function(new_attributes, tab_obj) {
  var kc          = new KColumn.find({ id: new_attributes.id })[0];
  KColumnsController.can_update.forEach(function(attr) {
    kc[attr] = new_attributes[attr] || kc[attr];
  });
  Application.msg_controllers.mixpanel.trackColumnUpdate({ column_id: new_attributes.id, context: "update"});
  response        = {};
  response.data   = kc.toJson();
  response.status = "success";
  return response;
}

KColumnsController.read = function(data_obj, tab_obj) {
  data_obj = data_obj || {};
  response        = {}
  response.data   = KColumn.find(data_obj).map(function(kcol) {
    return kcol.toJson();
  });
  response.status = "success";
  return response;

}

KColumnsController.delete = function(data_obj, tab_obj) {
  data_obj        = data_obj || {};
  response        = {}
  response.status = KColumn.delete(data_obj.id);
  return response;
}

KColumnsController.reset_dom = function(data_obj, tab_obj) {
  response = {};
  data_obj = data_obj || {}  
  
  var kc = new KColumn.find({ id: data_obj.id })[0];
  result = kc.clearDomArray();
  
  response.status = "success"
  response.data   = kc.toJson();
  return response;
}

KColumnsController.merge = function(data_obj, tab_obj) {

  response = {};
  data_obj = data_obj || {}
  if(!data_obj.id) {
    response.status = "error";
    response.err_msg = "Merge cannot be called with kcolumn id";

  } else if (!data_obj.new_array_dom) {
    response.status = "error";
    response.err_msg = "Merge cannot be called with new_array_dom";

  } else{
    var kc = new KColumn.find({ id: data_obj.id })[0];
    Application.msg_controllers.mixpanel.trackColumnUpdate({ column_id: data_obj.id, context: "merge"});    
    result = kc.merge(data_obj.new_array_dom, data_obj.outer_dom_array);

    if(result) {
      response.status = "success"
      response.data   = kc.toJson();

    } else {
      response.status = "error";
      response.err_msg = "Merge cannot be performed with new_array_dom provided";

    }
  }

  return response;
}


/** Export for node testing **/
try { 
  module && (module.exports = KColumnsController); 
} catch(e){}