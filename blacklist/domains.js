importScripts('/js/config/config.js');

var DOMAINS = [
  {
    "type": "domain",
    "value": "metaversegold.space",
    "status": "blacklisted",
    "flagger": {
      "name": "Jacki Roach",
      "avatar_url": "https://media-exp1.licdn.com/dms/image/C5603AQGFWhiDoLWumQ/profile-displayphoto-shrink_400_400/0/1650401486151?e=1673481600&v=beta&t=Cd4mSFxDi3t4ItWaOKj8RLJy5WHMU-iYSKChflI1r_I"
    },
    "validator": {
      "name": "Gary Teh",
      "avatar_url": "https://lh3.googleusercontent.com/a-/AOh14Gjj52jZEEl-lqsWWI3CkCi1B0wbnScqm2TzZ17E264=s96-c"
    }
  },
  {
    "type": "domain",
    "value": "atoplatform.com",
    "status": "blacklisted"
  }
]



fetch(CONFIG["blacklisted_domains"]).then(function(server_response) {
  return server_response.json();

}).then(function (server_response) {
  DOMAINS = server_response;
  
});