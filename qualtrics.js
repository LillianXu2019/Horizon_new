Qualtrics.SurveyEngine.addOnload(function () {

    /*Place your JavaScript here to run when the page loads*/

    /* Change 2: Hiding the Next button */
    // Retrieve Qualtrics object and save in qthis
    var qthis = this;

    // Hide buttons
    qthis.hideNextButton();

    /* Change 3: Defining and load required resources */
    var jslib_url = "https://lillianxu2019.github.io/Horizon_new/";

    // jquery and d3js required for horizon plugin
    var requiredResources = [
        jslib_url + "lib/vendors/jquery-2.2.0.min.js",
        "https://d3js.org/d3.v6.min.js",
        jslib_url + "lib/vendors/jspsych-6.1.0/jspsych.js",
        jslib_url + "lib/vendors/jspsych-6.1.0/plugins/jspsych-fullscreen.js",
        jslib_url + "lib/vendors/jspsych-6.1.0/plugins/jspsych-html-keyboard-response.js",
        jslib_url + "lib/vendors/jspsych-6.1.0/plugins/jspsych-image-keyboard-response.js",
        jslib_url + "jspsych-horizon.js",
        jslib_url + "horizon_main.js",
    ];

    function loadScript(idx) {
        console.log("Loading ", requiredResources[idx]);
        jQuery.getScript(requiredResources[idx], function () {
            if ((idx + 1) < requiredResources.length) {
                loadScript(idx + 1);
            } else {
                initExp();
            }
        });
    }

    if (window.Qualtrics && (!window.frameElement || window.frameElement.id !== "mobile-preview-view")) {
        loadScript(0);
    }

    /* Change 4: Appending the display_stage Div using jQuery */
    // jQuery is loaded in Qualtrics by default
    jQuery("<div id = 'display_stage_background'></div>").appendTo('body');
    jQuery("<div id = 'display_stage'></div>").appendTo('body');

    var task_name = "horizon";
    var save_url = "https://experiment.childemotion.waisman.wisc.edu/save_data.php";
    var subject_id = "${e://Field/participantID}";
    var data_dir = task_name;
    var file_name = task_name + '_' + subject_id;

    function save_data_json() {
        jQuery.ajax({
            type: 'post',
            cache: false,
            url: save_url,
            data: {
                data_dir: data_dir,
                file_name: file_name + '.json', // the file type should be added
                exp_data: jsPsych.data.get().json()
            }
        });
    }

    function save_data_csv() {
        jQuery.ajax({
            type: 'post',
            cache: false,
            url: save_url,
            data: {
                data_dir: data_dir,
                file_name: file_name + '.csv', // the file type should be added
                exp_data: jsPsych.data.get().csv()
            }
        });
    }


    /* Change 5: Wrapping jsPsych.init() in a function */
    function initExp() {
        jsPsych.init({
            timeline: timeline,
            display_element: 'display_stage',

            on_finish: function (data) {

                jsPsych.data.get().addToLast({participant: subject_id});
                save_data_csv();

                // clear the stage
                jQuery('#display_stage').remove();
                jQuery('#display_stage_background').remove();

                // simulate click on Qualtrics "next" button, making use of the Qualtrics JS API
                qthis.clickNextButton();
            }
        });
    }
});

Qualtrics.SurveyEngine.addOnReady(function () {
    /*Place your JavaScript here to run when the page is fully displayed*/

});

Qualtrics.SurveyEngine.addOnUnload(function () {
    /*Place your JavaScript here to run when the page is unloaded*/

});