// @Description : Extending JSON object to include pretty formating method
JSON.format = function(oData, sIndent) {

  var realTypeOf = function(v) {
    if (typeof(v) == "object") {
      if (v === null) return "null";
      if (v.constructor == (new Array).constructor)  return "array";
      if (v.constructor == (new Date).constructor)   return "date";
      if (v.constructor == (new RegExp).constructor) return "regex";
      return "object";
    }
    return typeof(v);
  }

  var self = this;
  if (arguments.length < 2) {
      var sIndent = "";
  }
  var sIndentStyle = "    ";
  var sDataType = realTypeOf(oData);

  // open object
  if (sDataType == "array") {
      if (oData.length == 0) {
          return "[]";
      }
      var sHTML = "[";
  } else {
      var iCount = 0;
      $.each(oData, function() {
          iCount++;
          return;
      });
      if (iCount == 0) { // object is empty
          return "{}";
      }
      var sHTML = "{";
  }

  // loop through items
  var iCount = 0;
  $.each(oData, function(sKey, vValue) {
      if (iCount > 0) {
          sHTML += ",";
      }
      if (sDataType == "array") {
          sHTML += ("\n" + sIndent + sIndentStyle);
      } else {
          sHTML += ("\n" + sIndent + sIndentStyle + "\"" + sKey + "\"" + ": ");
      }

      // display relevant data type
      switch (realTypeOf(vValue)) {
          case "array":
          case "object":
              sHTML += self.format(vValue, (sIndent + sIndentStyle));
              break;
          case "regex": 
              sHTML  += vValue.toString();
              break;
          case "boolean":
          case "number":
              sHTML += vValue.toString();
              break;
          case "null":
              sHTML += "null";
              break;
          case "string":
              sHTML += ("\"" + vValue.replace(/"/g, "\\\"") + "\"");
              break;
          default:
              sHTML += ("TYPEOF: " + typeof(vValue));
      }

      // loop
      iCount++;
  });

  // close object
  if (sDataType == "array") {
      sHTML += ("\n" + sIndent + "]");
  } else {
      sHTML += ("\n" + sIndent + "}");
  }

  // return
  return sHTML;
}
