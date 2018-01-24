// ---------------------------------------
// Game 5 Code
// See Readme for Experiment Description
// ---------------------------------------

// --------------------------
// Slide Creation & Rendering
// --------------------------

function render_prev_sets(prev_sets) {
  console.log(prev_sets);

  for (var i = 0; i < prev_sets.length; i++) {
    $("#prev_sets").append(`<H4>Example: ${i+1} </H4>`);
    render_prev_set(prev_sets[i]);
  }
}

function render_prev_set(set) {
  var rows = 1;
  var cols = set.length;

  var table = "<table>";
  for(var i=0; i <rows; i++) {
    table += "<tr>";
    for(var j=0; j<cols; j++) {
      table += "<td>";
      var ind = i * cols + j;
      table += "<table class ='cell' id='cell" + ind + "'\">";

      table += "<td>";
      table += "<svg id='critter" + ind +
        "' style='max-width:100px;max-height:100px\'></svg></td>";

      table += "<tr>";
      table += "<div class='critname' id='cell" + ind + "critname'></div></tr>";
      table += "</table>";
      table += "</td>";
      
    }
    table += "</tr>"
  }
  table += "</table>";
  $("#prev_sets").append(table);

  for (var i = 0 ; i < cols; i++) {
    var scale = 0.5;
    var stim = set[i];
    Ecosystem.draw(
      stim.critter, stim.props,
      "critter" + i, scale);
  }
}


function render_curr_set(set) {

}

function make_slides(exp) {
  var slides = {};

  slides.i0 = slide({
     name : "i0",
     start: function() {
      exp.startT = Date.now();
     }
  });

  slides.instructions = slide({
    name : "instructions",
    button : function() {
      exp.go(); // use exp.go() if and only if there is no "present" data.
    },
  });

  slides.concept_1 = slide({
    name: "concept_1",
    present: exp.allCreatures[1],
    trial_num: 0,
    start: function() {
      this.prev_sets = []
    },

    present_handle : function(stim) {
      // hide + disable stuff
      $(".err").hide();
      $("#prev_sets").empty();
      // $("#continueButton").disable(true);

      // Render slide
      $(".set_number").text("Item " + String(this.trial_num + 1) + " of 25");
      render_prev_sets(this.prev_sets);
      render_curr_set(this.stim);

      // Time Markers
      this.start_time = Date.now()
      this.trial_num++;
      this.prev_sets.push(stim);
    },    

    button : function() {
      var end_time = Date.now();
      this.time_spent = end_time - this.start_time;
      this.log_responses();
      _stream.apply(this); //make sure this is at the *end*, after you log your data
    },

    log_responses : function(){
      exp.concept_1_trials.push({
          "concept_number" : 1,
          "trial_num" : this.trial_num,
          "time_in_seconds" : this.time_spent/1000,
        });
    }
  });

  slides.concept_switch_1 = slide({
    name: "concept_switch",
      button : function() {
        exp.go(); // use exp.go() if and only if there is no "present" data.
    },
  });

  slides.subj_info =  slide({
    name : "subj_info",
    submit : function(e){
      //if (e.preventDefault) e.preventDefault(); // I don't know what this means.
      exp.subj_data = {
        language : $("#language").val(),
        enjoyment : $("#enjoyment").val(),
        asses : $('input[name="assess"]:checked').val(),
        age : $("#age").val(),
        gender : $("#gender").val(),
        education : $("#education").val(),
        comments : $("#comments").val(),
        problems: $("#problems").val(),
        fairprice: $("#fairprice").val()
      };
      exp.go(); //use exp.go() if and only if there is no "present" data.
    }
  });

  slides.thanks = slide({
    name : "thanks",
    start : function() {
      exp.data= {
          "trials" : exp.data_trials,
          "catch_trials" : exp.catch_trials,
          "system" : exp.system,
          "question": exp.question,
          "distribution": JSON.stringify(exp.distribution),          
          "subject_information" : exp.subj_data,
          "time_in_minutes" : (Date.now() - exp.startT)/60000
      };
      setTimeout(function() {turk.submit(exp.data);}, 1000);
    }
  });

  return slides;
}

// -------------------
// Set Rendering
// -------------------
var prev = null;

function mark(el, otherEls) {
  if(prev != null){
    gray(prev);
  }
  prev = el;

    el.style.border=='' ? 
    $('#'+el.id).css({"border":'2px solid red',
                    'background-color': 'white','opacity': '1'}) &
    $('#'+el.id+'critname').css({'opacity': '1', 'font-weight': 'bold'})
                     : 
    $('#'+el.id).css({"border":'',
                    'background-color': 'white'})
    otherEls.map(function(cell){$('#'+cell).css({"border":'',
      'background-color': 'white'})})

  $('#'+el.id+'critname').css({'opacity': '1'});
  check(allCreatures.length);

}


function gray(el) {
   $('#'+el.id).css({'opacity': '0.5'})
   $('#'+el.id+'critname').css({'opacity': '0.5', 'font-weight': 'normal'});

}

// -----------------
// Initialize Game
// -----------------
function init() {
  // Ensure that a Turker cannot play the game more than once
  var checkDuplicateTurker = function(){
       var ut_id = "sc-gengame5-20180120";
       if (UTWorkerLimitReached(ut_id)) {
         $('.slide').empty();
         repeatWorker = true;
         alert("You have already completed the maximum number of HITs allowed by this requester. Please click 'Return HIT' to avoid any impact on your approval rating.");
       }
  };
  checkDuplicateTurker();

  // General system information for the player
  exp.system = {
      Browser : BrowserDetect.browser,
      OS : BrowserDetect.OS,
      screenH: screen.height,
      screenUH: exp.height,
      screenW: screen.width,
      screenUW: exp.width
    };

  // Define trials
  exp.concept_1_trials = [];
  exp.concept_2_trials = [];

  // Expriment slide structure
  exp.structure=[
    "i0",
    "instructions",
    "concept_1",
    // "concept_switch_1",
    // "concept_2",
    'subj_info',
    'thanks'
  ];

  // Load critters for the game
  exp.allCreatures = {
    1: easy_rule_data, // Easy Concept Critter Sets
    2: medium_rule_data, // Medium Concept Critter Sets
  }

  // Generate the slides for the game
  exp.slides = make_slides(exp);
  $('.slide').hide(); //hide everything


  // Make sure turkers have accepted HIT or that user is not on MTurk Page
  $("#start_button").click(function() {
    if (turk.previewMode) {
      $("#mustaccept").show();
    } else {
      $("#start_button").click(function() {$("#mustaccept").show();});
      exp.go();
    }
  });
  exp.go(); //show first slide
}
