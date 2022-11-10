var Domain = function() {
}

Domain.status = function(url) {
  var url_obj = new URL(url)
  var the_domain = url_obj.hostname;

  var blacklisting = DOMAINS.filter(function(domain_obj) {
    return domain_obj.value == the_domain;
  });

  if(blacklisting.length > 0) {
    return blacklisting[0]["status"];

  } else {
    return "";
  }
}

Domain.details = function(url) {
  var url_obj = new URL(url)
  var the_domain = url_obj.hostname;

  var blacklisting = DOMAINS.filter(function(domain_obj) {
    return domain_obj.value == the_domain;
  });

  if(blacklisting.length > 0) {
    return blacklisting[0];

  } else {
    return {};
  }
}