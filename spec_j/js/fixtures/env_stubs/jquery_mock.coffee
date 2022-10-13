class Deferred
  constructor: ()->
    return

  then: (@callback)->
    console.log("callback for then was set")

    # When resolve happened before then
    if @payload && @callback
      @callback @payload
    @callback

  resolve: (@payload)->
    console.log("was resolved")
    console.log(@callback)
    @callback && @callback(payload)    

  promise: ()->
    @

global.$ = 
  Deferred: ()->
    new Deferred()
  post: (url, payload, callback)->
    console.log("post was called")
    callback && callback()