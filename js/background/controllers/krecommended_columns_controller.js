try { var KRecommendedColumn = require('../models/krecommended_column'); } catch(e) {}
try { var KRecommendedColumnSelected = require('../models/krecommended_column_selected'); } catch(e) {}
try { 
  var kpage_imports = require('../models/kpage'); 
  var KPage = kpage_imports.KPage;

} catch(e) {}
try { var KTab = require('../models/ktab'); } catch(e) {}

var KRecommendedColumnsController = {};

// Populating with local auto detected columns
KRecommendedColumnsController.create = function( new_attributes, tab_obj) {

  var query_obj = { 
    page_id: new_attributes.page_id, 
    dom_query: new_attributes.dom_query,
    outer_dom_query: new_attributes.outer_dom_query,
    required_attribute: new_attributes.required_attribute 
  };  

  var kr_col = KRecommendedColumn.find(query_obj)[0];
  if(!kr_col) {
    kr_col = new KRecommendedColumn(
      null,
      new_attributes.col_name,
      new_attributes.dom_query,
      new_attributes.outer_dom_query,
      null,
      new_attributes.required_attribute,
      null,
      null,
      null,
      null,
      new_attributes.page_id
    ) 
  }

  response        = {};
  response.data   = kr_col.toJson();
  response.status = "success";
  return response;
}


/**
  Updates the recommended column selected object
  Params:
    new_attributes: Object
      id:       Integer
      selected: Boolean
      page_id:  Integer
      col_name: String

    tab_obj: Object
      id: Integer
**/
KRecommendedColumnsController.update = function(new_attributes, tab_obj) {

  var query_obj = { id: new_attributes.id };  
  var recommendation = KRecommendedColumn.find(query_obj)[0];

  var matching_select = KRecommendedColumnSelected.find({
    page_id: new_attributes.page_id,
    recommendation_id: new_attributes.id
  })[0];

  // Simply updates the column name if already selected
  if(new_attributes.selected && matching_select) {
    matching_select.col_name      = new_attributes.col_name;
    recommendation.col_name      = new_attributes.col_name;

  // Creates a new selected object if not exist
  } else if(new_attributes.selected && !matching_select) {
    matching_select = new KRecommendedColumnSelected(
      new_attributes.id,
      tab_obj.id,  
      new_attributes.page_id,  
      new_attributes.col_name
    );

  // Deletes the selected object if no longer selected
  } else if(!new_attributes.selected && matching_select) {
    KRecommendedColumnSelected.delete(matching_select.id);

  } 

  var new_matching_select = KRecommendedColumnSelected.find({
    page_id: new_attributes.page_id,
    recommendation_id: new_attributes.id
  })[0];

  response        = {};
  response.data   = recommendation.toJson();

  if(new_matching_select) {
    response.data.selected = true;
    response.data.col_name = new_matching_select.col_name;
  } else {
    response.data.selected = false;      
  }

  response.status = "success";
  return response;
}

/**
  Fetches the recommended columns give page_id
  Params:
    data_obj:
      page_id
**/
KRecommendedColumnsController.read = function(data_obj, tab_obj) {
  var the_page = KPage.find({id: data_obj.page_id})[0]
  response        = {}

  var query_obj = {
    domain_name: the_page.domain
  };  
  response.data   = KRecommendedColumn.find(query_obj).map( function(kr_col) {
    return KRecommendedColumnsController.transform(kr_col, data_obj)
  } );

  var query_obj = {
    page_id: the_page.id
  };  
  response.data   = response.data.concat( 
    KRecommendedColumn.find(query_obj).map( function(kr_col) {
      return KRecommendedColumnsController.transform(kr_col, data_obj)
    } ) 
  );

  response.status = "success";
  return response;

}

KRecommendedColumnsController.transform = function(kr_col, data_obj) {
  var payload = kr_col.toJson();
  
  var matching_select = KRecommendedColumnSelected.find({
    page_id: data_obj.page_id,
    recommendation_id: kr_col.id
  })[0];

  if(matching_select) {
    payload.selected = true;
    payload.col_name = matching_select.col_name;
  } else {
    payload.selected = false;      
  }

  payload.page_id = data_obj.page_id;
  return payload;
}


/**
  Export module for use in NodeJs
**/
try { 
  module && (module.exports = {
    KRecommendedColumnsController: KRecommendedColumnsController,
    KRecommendedColumn: KRecommendedColumn,
    KRecommendedColumnSelected: KRecommendedColumnSelected,
    KPage: KPage,
    KTab: KTab
  }); 
} catch(e){}