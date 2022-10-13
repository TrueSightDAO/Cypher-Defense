var TutorialView = Backbone.View.extend({
  className: "body",

  initialize: function(opts) {
    var self = this;    

    _.bindAll(self, 
      "trackTour", 
      "showIntroduction", 
      "startTour",
      "bindEvents",
      "catchEnter"
    );    

    self.trackTour();    
    self.render();
    
  },

  render: function() {
    var self = this;
    self.bindEvents();
    self.showIntroduction();
  },

  bindEvents: function() {
    var self = this;
    document.getElementById("curr_col_name").addEventListener("keydown", self.catchEnter);
  },

  trackTour: function() {
    window.__insp = window.__insp || [];
    __insp.push(['wid', 1964047413]);
    var ldinsp = function(){ if(typeof window.__inspld != "undefined") return; window.__inspld = 1; var insp = document.createElement('script'); insp.type = 'text/javascript'; insp.async = true; insp.id = "inspsync"; insp.src = ('https:' == document.location.protocol ? 'https' : 'http') + '://cdn.inspectlet.com/inspectlet.js?wid=1964047413&r=' + Math.floor(new Date().getTime()/3600000); var x = document.getElementsByTagName('script')[0]; x.parentNode.insertBefore(insp, x); };
    setTimeout(ldinsp, 0);
  },

  showIntroduction: function() {
    console.log((Date.now() - Application.sessionStartTime) + " : Introducing tutorial");
    var self = this;
    var template = Application.templates['introduction_modal'];
    $("body").append(template());

    self.intro_modal = $("#getdata-intro-modal").modal();
    
   $("#getdata-intro-modal").bind('hide', function () {
      self.startTour();
      document.getElementById("curr_col_name").focus();
   });

    $("body #start_tour").click(function() {
      self.startTour();
      document.getElementById("curr_col_name").focus();
    });

  },

  startTour: function() {
    var self = this;
    var tour = {
      id: "hello-hopscotch",
      steps: [
          {
            title: "Select first product name",
            content: "<p>Any selectable item will get highlighted when you mouse over it</p><p>Clicking on it will add it to your current column.</p><p>Try clicking on 'Doc Hudson' to add it to your column.</p>",
            target: document.querySelector("#first_name"),
            placement: "right",
            nextOnTargetClick: true,
            showNextButton: false
          },
          {
            title: "Select second product name",
            content: "<p>You can add more than one item to your column</p><p>When you add a second item to your column, we will detect and add all matching items to your column as well</p><p>Try clicking on 'Lightning McQueen' to see what happens</p>",
            target: document.querySelector("#second_name"),
            placement: "right",
            nextOnTargetClick: true,
            showNextButton: false
          },
          {
            title: "Give your column a name",
            content: "<p>You can name your column to something easier for you to remember.</p><p>Let's type in the word '<b>name</b>'.</p>",
            target: "div#curr_col_name",
            placement: "top"
          },          
          {
            title: "Preview your data",
            content: "<p>This is a preview of the data you are going to get.</p><p>In this case, we did select to include 'Doc Hudson'.</p>",
            target: ".detailed-panel-sample-data-content",
            placement: "top"            
          },
          {
            title: "Save your column",
            content: "<p>Once you are happy with the items you have added in this column, you can save it.</p>",
            target: "div#add_columns",
            placement: "left",
            nextOnTargetClick: true,
            showNextButton: false            
          },
          {
            title: "Select your first price",
            content: "<p>Now let's try adding a new item for your new column.</p><p>Let's try clicking on '9,878' first.</p>",
            target: document.querySelector("#first_price"),
            placement: "right",
            nextOnTargetClick: true,
            showNextButton: false
          },
          {
            title: "Select your second price",
            content: "<p>Try clicking on '10,122' to see what happens too.</p>",
            target: document.querySelector("#second_price"),
            placement: "right",
            nextOnTargetClick: true,
            showNextButton: false,
            onNext: function() {
              document.getElementById("curr_col_name").innerHTML = '';
              document.getElementById("curr_col_name").focus();
              document.getElementById("curr_col_name").addEventListener("keydown", self.catchEnter);
            }
          },
          {
            title: "Give your second column a name",
            content: "<p>Let's name this column to something you can remember as well</p><p>Type in the word '<b>price</b>'.</p>",
            target: "div#curr_col_name",
            placement: "top"
          },
          // {
          //   title: "Add pagination",
          //   content: "<p>On some e-commerce websites, products are listed across many pages.</p><p>This feature allows you to indicate where the next page button is.</p><p>It comes in handy and saves alot of time</p><p>Click to activate this feature</p>",
          //   target: document.querySelector("#add_pagination"),
          //   placement: "top",
          //   nextOnTargetClick: true,
          //   showNextButton: true
          // },
          // {
          //   title: "Click on next page",
          //   content: "<p>Once the feature is activated, simply click on the 'next page' button and we will try to gather data across all the pages for you.</p><p>Click on 'Next Page' to see what happens. </p>",
          //   target: document.querySelector("a.next"),
          //   placement: "right",
          //   nextOnTargetClick: true,
          //   showNextButton: false
          // },        
          {
            title: "You are now ready",
            content: "<p>Click on 'Get Data' to start tracking</p>",
            target: document.querySelector("#save_holder"),
            placement: "top",
            showCTAButton: false
          }
        ]
    };  
    hopscotch.startTour(tour, 0);    
  },

  catchEnter: function(event) {
    var self = this;
    console.log("enter was detected");
    if (event.keyCode === 13) {
      hopscotch.nextStep();
    }  
  },

  /**
    Removes this view and all its sub elements
    Called when the extension get deactivated    
  **/
  destroy: function() {
    var self = this;
    if(self.intro_modal) {
      self.intro_modal.modal('hide');
      self.intro_modal.remove();
      hopscotch.endTour(false)
    }
    self.remove();
  },  
});



