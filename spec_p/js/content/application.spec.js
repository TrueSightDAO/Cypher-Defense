describe("Application", function() {

  beforeEach(function () {
    spyOn(Application.tab_view, "activate");
    spyOn(Application.tab_view, "deactivate");
  });

  it("should instantiate", function() {
    expect(Application).not.toBe(null);
  })

  it("should activate", function() {
    Application.activate();
    expect(Application.tab_view.activate).toHaveBeenCalled();
  });

  describe("msgEvent", function(){ 

    it("should activate when received msgEvent", function() {
      Application.msgEvent({
        method: "activate"
      });
      expect(Application.tab_view.activate).toHaveBeenCalled();

    });

    it("should deactivate when received msgEvent", function() {
      Application.msgEvent({
        method: "deactivate"
      });
      expect(Application.tab_view.deactivate).toHaveBeenCalled();
      
    });

  })

})