var Domain = function() {
}

Domain.status = function(url) {
  var tmp   = document.createElement ('a');
  tmp.href  = url;
  var the_domain = tmp.hostname;

  var blacklisting = DOMAINS.filter(function(domain_obj) {
    return domain_obj.value == the_domain;
  });

  if(blacklisting.length > 0) {
    return blacklisting[0]["status"];

  } else {
    return "";
  }
}