/// horizon_main.js

// define the site that hosts stimuli images
// usually https://<your-github-username>.github.io/<your-experiment-name>/
var repo_site = "https://LillianXu2019.github.io/Horizon_new/";

let runat_pavlovia = false; /* change it to true if run on pavlovia

/* preload images */
var imageExt = repo_site + "img/"

var images = [
"inst_key1.jpg",
"inst_key2.jpg",
"inst_q1.png",
"right_answer.gif",
"inst_q2.png",
"right_answer.gif",
"inst_q3.png",
"inst_q4.png",
"inst_q5.png",
"inst_q6.png",
"good_job.gif",
"you_are_a_star.gif",
"trophy2.jpeg"
]

var preload_images=[];

for (var k = 0; k < images.length; k++) {
    preload_images.push(imageExt+images[k]);
};

/* Enter subject id */
//var subject_id = prompt("Subject ID", "test")
var subject_id = jsPsych.data.getURLVariable('participantID')
jsPsych.data.addProperties({subject: subject_id});

/* Enter order id */
//var subject_id = prompt("Subject ID", "test")
var order_id = jsPsych.data.getURLVariable('orderID')
jsPsych.data.addProperties({order: order_id});

// debug
//console.log('debug: order_is:' + order_id);

    // enter full screen
    var welcome = {
    type: "fullscreen",
    message: "Now you are entering the full screen mode.<br>",
    button_label: "Click here to proceed.",
    delay_after: 500
    }

    // generate trials for Horizon task

    let randomNormal = d3.randomNormal();

    // task parameters
    let factors = {
        mu: [40, 60],
        delta_mu: [-30, -20, -12, -8, -4, 4, 8, 12, 20, 30],
        game_length: [5, 10],
        amb_cond: [1, 2, 2, 3]
    }
    // includes all combinations of factors, returned in random order
    let full_design = jsPsych.randomization.factorial(factors, 1);
    let main_bandit = jsPsych.randomization.repeat([0, 1], full_design.length / 2);

    for(let i=0; i<main_bandit.length; i++){
        full_design[i].main_bandit = main_bandit[i];

        // generate 'forced'
        let forced = new Array(full_design[i].game_length).fill(0);
        switch (full_design[i].amb_cond) {
            case 1:
                forced_head = jsPsych.randomization.shuffle([1, 2, 2, 2])
                break;
            case 2:
                forced_head = jsPsych.randomization.shuffle([1, 1, 2, 2])
                break;
            case 3:
                forced_head = jsPsych.randomization.shuffle([1, 1, 1, 2])
        }
        for(let j=0; j<4; j++) forced[j] = forced_head[j];
        full_design[i].forced = forced;

        // generate 'rewards'
        let sig_risk = 8;
        let mu = [0, 0];
        mu[main_bandit[i]] = full_design[i].mu;
        mu[1 - main_bandit[i]] = full_design[i].mu + full_design[i].delta_mu;

        // initialize rewards array
        let rewards = [
            new Array(full_design[i].game_length),
            new Array(full_design[i].game_length)
        ];

        // fill rewards array
        for(let j=0; j<full_design[i].game_length; j++){
            for(let k=0; k<2; k++){
                rewards[k][j] = Math.max(1, Math.min(99, Math.round(randomNormal() * sig_risk + mu[k])));
            }
        }
        full_design[i].rewards = rewards;
    }

        let timeline = [];

            /*** Variables for instructions slides ***
    The stack size is determined by the length of 'forced'.
    inst_mode controls the "mode" of the slide.
      blank: no bandits are displayed
      bandits: display bandits and the text in the display variable
      lever: display bandits with a lever animation
      prompt: display bandits and the text in the display variable as well as the green prompt boxes.
    display contains the values to be displayed in the left and right bandits.
    msg is the text displayed at the top of the screen.  HTML tags can be included (e.g., <br> for a line break).
    */
    let instructions = [
        { forced: [1, 2, 1, 1, 0, 0, 0, 0, 0, 0],  display: [[], []], inst_mode: 'blank',  msg: '<p style="font-size: 30px;">Welcome! You will get to play the stacked boxes game.</p>' },
        { forced: [1, 2, 1, 1, 0, 0, 0, 0, 0, 0],  display: [[], []], inst_mode: 'blank',  msg: '<p style="font-size: 30px;">Please make sure you understand each slide before going on to the next one!</p>' },
        { forced: [1, 2, 1, 1, 0, 0, 0, 0, 0, 0],  display: [[], []], inst_mode: 'bandits',  msg: '<p style="font-size: 30px;">In this game, you will get to choose between two stacks of boxes.</p>' },
        { forced: [1, 2, 1, 1, 0, 0, 0, 0, 0, 0],  display: [[], []], inst_mode: 'bandits',  msg: '<p style="font-size: 30px;">The stacks of boxes look like this:</p>' },
        { forced: [1, 2, 1, 1, 0, 0, 0, 0, 0, 0],  display: [[], []], inst_mode: 'lever',  msg: '<p style="font-size: 30px;">Every time you choose one stack, the lever will be pulled like this ...</p>' },
        { forced: [1, 2, 1, 1, 0, 0, 0, 0, 0, 0],  display: [[77], ['XX']], inst_mode: 'bandits',  msg: '<p style="font-size: 30px;">When the lever is pulled you will see how many points you got!</p>' },
        { forced: [1, 2, 1, 1, 0, 0, 0, 0, 0, 0],  display: [[77], ['XX']], inst_mode: 'bandits',  msg: '<p style="font-size: 30px;">So if you chose the left orange stack you get <strong>77</strong> points.</p>' },
        { forced: [1, 2, 1, 1, 0, 0, 0, 0, 0, 0],  display: [[77], ['XX']], inst_mode: 'bandits',  msg: '<p style="font-size: 30px;">You can only look at one side at a time. So if you choose to see the left side, you cannot see the right side. <br><br>That is why you see "XX" on the right.</p>' },
        { forced: [1, 2, 1, 1, 0, 0, 0, 0, 0, 0],  display: [[], []], inst_mode: 'bandits',  msg: '<p style="font-size: 30px;">Most of the time, all the boxes in a stack have about the same points. Some may give you more or less points than others.</p>' },
        //{ forced: [1, 2, 1, 1, 0, 0, 0, 0, 0, 0],  display: [['XX'], [52]], inst_mode: 'bandits',  msg: 'For example, in the blue stack on the right, the first box gave 52 points and the second box gave 56 points. So the number of points is about the same in the boxes.' },
        { forced: [1, 2, 1, 1, 0, 0, 0, 0, 0, 0],  display: [['XX', 'XX'], [52, 56]], inst_mode: 'bandits',  msg: '<p style="font-size: 30px;">For example, in the blue stack on the right, the first box gave <strong>52</strong> points and the second box gave <strong>56</strong> points.</p>' },
        { forced: [1, 2, 1, 1, 0, 0, 0, 0, 0, 0],  display: [['XX', 'XX'], [52, 56]], inst_mode: 'bandits',  msg: '<p style="font-size: 30px;">So the number of points is about the same in the boxes.</p>' },
        { forced: [1, 2, 1, 1, 0, 0, 0, 0, 0, 0],  display: [['XX', 'XX', 'XX'], [52, 56, 45]], inst_mode: 'bandits',  msg: '<p style="font-size: 30px;">A third box has <strong>45</strong> points, so a little less, but close to the other boxes in the stack.</p>' },
        { forced: [1, 2, 1, 1, 0, 0, 0, 0, 0, 0],  display: [[], []], inst_mode: 'bandits',  msg: '<p style="font-size: 30px;">On each game, either the left stack or the right stack will worth more points.<br><br> You get to choose which stack to pick.</p>' },
        { forced: [1, 2, 1, 1, 0, 0, 0, 0, 0, 0],  display: [[], []], inst_mode: 'bandits',  msg: '<p style="font-size: 30px;">To make your choice:<br><br> Press the <strong>left arrow key</strong> to play the <strong>left</strong> stack <br><br> Press the <strong>right arrow key</strong> to play the <strong>right</strong> stack.</p>' },
        { forced: [1, 2, 1, 1, 0, 0, 0, 0, 0, 0],  display: [[], []], inst_mode: 'bandits',  msg: '<p style="font-size: 30px;">You can tell how many choices you will have by the number of boxes.<br><br> If the stack is <strong>10</strong> boxes high, that means you get <strong>10</strong> guesses.</p>' },
        { forced: [1, 2, 1, 1, 0], display: [[], []], inst_mode: 'bandits',  msg: '<p style="font-size: 30px;">If there are <strong>5</strong> boxes then you only get <strong>5</strong> guesses.</p>' },
        { forced: [1, 2, 1, 1, 0, 0, 0, 0, 0, 0],  display: [[], []], inst_mode: 'bandits',  msg: '<p style="font-size: 30px;">To help you earn points, we will tell you which stack to choose for your first <strong>4</strong> choices.</p>' },
        { forced: [1, 2, 1, 1, 0, 0, 0, 0, 0, 0],  display: [[], []], inst_mode: 'prompt',  msg: '<p style="font-size: 30px;">There will be a green square inside the box we want you to open, and you must press the button to choose this stack to get your points. <br><br>Here you would choose the orange stack on the left.</p>' },
        { forced: [1, 2, 1, 1, 0, 0, 0, 0, 0, 0],  display: [[77], ['XX']], inst_mode: 'prompt',  msg: '<p style="font-size: 30px;">Here you would choose the blue stack on the right.</p>' },
        { forced: [1, 2, 1, 1, 0, 0, 0, 0, 0, 0],  display: [[77, 'XX', 65, 67], ['XX', 52, 'XX', 'XX']], inst_mode: 'prompt',  msg: '<p style="font-size: 30px;">When you will see <strong>TWO</strong> green squares, you get to pick the one that you want.</p>' },
        { forced: [1, 2, 1, 1, 0, 0, 0, 0, 0, 0],  display: [[], []], inst_mode: 'prompt',  msg: '<p style="font-size: 30px;">Each time you see 2 new empty stacks of boxes on the screen, a new game is starting.</p>' },
        { forced: [1, 2, 1, 1, 0, 0, 0, 0, 0, 0],  display: [[], []], inst_mode: 'blank',  msg: '<p style="font-size: 30px;">To make sure everything makes sense, let us go through some questions!</p>'}
        //{ forced: [1, 2, 1, 1, 0, 0, 0, 0, 0, 0],  display: [[], []], inst_mode: 'blank',  msg: '<p style="font-size: 30px;">Press any key when you are ready for the questions!</p>' }
    ]

    let horizon_inst = {
        type: 'horizon',
        forced: jsPsych.timelineVariable('forced'),
        rewards: [[9, 13, 74, 56, 87, 54, 77, 86, 76, 35], [43, 55, 37, 36, 77, 65, 33, 34, 62, 93]],
        choices: jsPsych.ALL_KEYS,
        demo: true,
        display: jsPsych.timelineVariable('display'),
        post_response_delay: 0,
        msg_top: jsPsych.timelineVariable('msg'),
        msg_bottom: '<p style="font-size: 30px;">Press any key to continue</p>',
        inst_mode: jsPsych.timelineVariable('inst_mode')
    }

    let instruction_trials = {
        timeline: [horizon_inst],
        timeline_variables: instructions
    }

// EDIT - Repeat question upto two times if answered incorrectly
    // comprehension questions
    var inst_left_key = {
    type: 'image-keyboard-response',
    stimulus: repo_site +'img/inst_key1.jpg',
    choices: jsPsych.ALL_KEYS,
    response_ends_trial: true
    };

    var inst_right_key = {
    type: 'image-keyboard-response',
    stimulus: repo_site +'img/inst_key2.jpg',
    choices: jsPsych.ALL_KEYS,
    response_ends_trial: true
    };

    // var question1 = {
    // type: 'image-keyboard-response',
    // stimulus: 'img/inst_q1.png',
    // choices: [37, 39],
    // response_ends_trial: true,
    // on_finish: function (data) {
    //             let correct_keypress = data.key_press == [39];
    //             data.correct = correct_keypress; 
    //             },
    // data: {test_part: 'practice-question'},
    // }
    // var question1_feedback = {
    //     type: "image-keyboard-response",
    //     stimulus: function(){
    //                 let d = jsPsych.data.get().last(1).values()[0];
    //                 let correct = d.correct;
    //                 if(!correct){
    //                     '<p style="color: red; font-size: 30px;">Error! The green square is on the right, so you should press the right arrow key.</p>';
    //                     } else {
    //                     "<p>'img/right_answer.gif'</p>"+"<p style='color: green; font-size: 30px;'>Correct!</p>" + feedback + "</p><p style = 'font-size: 30px'>Press any key for the next step.</p>"
    //                     }
    //                 },
    //             response_ends_trial: true,                            
    //             data: {test_part: 'practice-feedback'}
    //         }


var question1 = {
    type: 'image-keyboard-response',
    stimulus: repo_site + 'img/inst_q1.png',
    choices: [37, 39],
    on_finish: function (data) {
        let correct_keypress = data.key_press == [39];
        data.correct = correct_keypress;
    },
    data: {test_part: 'practice-question'},
    show_clickable_nav: true
}
var question1_feedback = {
    type: "image-keyboard-response",
    stimulus: function () {
        let d = jsPsych.data.get().last(1).values()[0];
        let correct = d.correct;
        let stimulus = '';
        if (!correct) {
            stimulus = '';
        } else {
            stimulus = repo_site + 'img/right_answer.gif';
        }
        return stimulus
    },
    prompt: function () {
        let d = jsPsych.data.get().last(1).values()[0];
        let correct = d.correct;
        let feedback = '';
        if (!correct) {
            feedback = '<p style="color: red; font-size: 30px;">Error! The orange box gave you <strong>40</strong> in the first box, so the rest of the numbers will be around <strong>40</strong>.</p>';
        } else {
            feedback = "<p style='color: green; font-size: 30px;'>Correct!</p>";
        }
        return "<p>" + feedback + "</p><p style = 'font-size: 30px'>Press any key for the next step.</p>"
    },
    //response_ends_trial: true,
    data: {test_part: 'practice-feedback'}
};

var if_node_1 = {
    timeline: [question1, question1_feedback],
    conditional_function: function () {
        // get the data from the previous trial,
        // and check which key was pressed
        var data = jsPsych.data.get().last(2).first().values()[0];
        if (data.key_press == [39]) {
            return false;
        } else {
            return true;
        }
    }
}

var question2 = {
    type: 'image-keyboard-response',
    stimulus: repo_site + 'img/inst_q2.png',
    choices: ['a', 'b', 'c'],
    on_finish: function (data) {
        let correct_keypress = data.key_press == [67];
        data.correct = correct_keypress;
    },
    data: {test_part: 'practice-question'}
};

var question2_feedback = {
    type: "image-keyboard-response",
    stimulus: function () {
        let d = jsPsych.data.get().last(1).values()[0];
        let correct = d.correct;
        let stimulus = '';
        if (!correct) {
            stimulus = '';
        } else {
            stimulus = repo_site + 'img/right_answer.gif';
        }
        return stimulus
    },
    prompt: function () {
        let d = jsPsych.data.get().last(1).values()[0];
        let correct = d.correct;
        let feedback = '';
        if (!correct) {
            feedback = '<p style="color: red; font-size: 30px;">Error! The green square is on both sides, so you can press either arrow key.</p>';
        } else {
            feedback = "<p style='color: green; font-size: 30px;'>Correct!</p>";
        }
        return "<p>" + feedback + "</p><p style = 'font-size: 30px'>Press any key for the next step.</p>"
    },
    data: {test_part: 'practice-feedback'}
};

var if_node_2 = {
    timeline: [question2, question2_feedback],
    conditional_function: function () {
        // get the data from the previous trial,
        // and check which key was pressed
        var data = jsPsych.data.get().last(2).first().values()[0];
        if (data.key_press == [67]) {
            return false;
        } else {
            return true;
        }
    }
}

var question3 = {
    type: 'image-keyboard-response',
    stimulus: repo_site + 'img/inst_q3.png',
    choices: ['a', 'b'],
    on_finish: function (data) {
        let correct_keypress = data.key_press == [65];
        data.correct = correct_keypress;
    },
    data: {test_part: 'practice-question'}
};

var question3_feedback = {
    type: "image-keyboard-response",
    stimulus: function () {
        let d = jsPsych.data.get().last(1).values()[0];
        let correct = d.correct;
        let stimulus = '';
        if (!correct) {
            stimulus = '';
        } else {
            stimulus = repo_site + 'img/right_answer.gif';
        }
        return stimulus
    },
    prompt: function () {
        let d = jsPsych.data.get().last(1).values()[0];
        let correct = d.correct;
        let feedback = '';
        if (!correct) {
            feedback = '<p style="color: red; font-size: 30px;">Error! The orange box gave you <strong>40</strong> in the first box, so the rest of the numbers will be around <strong>40</strong>.</p>';
        } else {
            feedback = "<p style='color: green; font-size: 30px;'>Correct!</p>";
        }
        return "<p>" + feedback + "</p><p style = 'font-size: 30px'>Press any key for the next step.</p>"
    },
    data: {test_part: 'practice-feedback'}
};

var if_node_3 = {
    timeline: [question3, question3_feedback],
    conditional_function: function () {
        // get the data from the previous trial,
        // and check which key was pressed
        var data = jsPsych.data.get().last(2).first().values()[0];
        if (data.key_press == [65]) {
            return false;
        } else {
            return true;
        }
    }
}

var question4 = {
    type: 'image-keyboard-response',
    stimulus: repo_site + 'img/inst_q4.png',
    choices: [37, 39],
    on_finish: function (data) {
        let correct_keypress = data.key_press == [39];
        data.correct = correct_keypress;
    },
    data: {test_part: 'practice-question'}
};

var question4_feedback = {
    type: "image-keyboard-response",
    stimulus: function () {
        let d = jsPsych.data.get().last(1).values()[0];
        let correct = d.correct;
        let stimulus = '';
        if (!correct) {
            stimulus = '';
        } else {
            stimulus = repo_site + 'img/right_answer.gif';
        }
        return stimulus
    },
    prompt: function () {
        let d = jsPsych.data.get().last(1).values()[0];
        let correct = d.correct;
        let feedback = '';
        if (!correct) {
            feedback = '<p style="color: red; font-size: 30px;">Error! The right boxes gave you more points on average, so you should press the right arrow key to select them.</p>';
        } else {
            feedback = "<p style='color: green; font-size: 30px;'>Correct!</p>";
        }
        return "<p>" + feedback + "</p><p style = 'font-size: 30px'>Press any key for the next step.</p>"
    },
    data: {test_part: 'practice-feedback'}
};

var if_node_4 = {
    timeline: [question4, question4_feedback],
    conditional_function: function () {
        // get the data from the previous trial,
        // and check which key was pressed
        var data = jsPsych.data.get().last(2).first().values()[0];
        if (data.key_press == [39]) {
            return false;
        } else {
            return true;
        }
    }
}

var question5 = {
    type: 'image-keyboard-response',
    stimulus: repo_site + 'img/inst_q5.png',
    choices: [37, 39],
    on_finish: function (data) {
        let correct_keypress = data.key_press == [39];
        data.correct = correct_keypress;
    },
    data: {test_part: 'practice-question'}
};

var question5_feedback = {
    type: "image-keyboard-response",
    stimulus: function () {
        let d = jsPsych.data.get().last(1).values()[0];
        let correct = d.correct;
        let stimulus = '';
        if (!correct) {
            stimulus = '';
        } else {
            stimulus = repo_site + 'img/right_answer.gif';
        }
        return stimulus
    },
    prompt: function () {
        let d = jsPsych.data.get().last(1).values()[0];
        let correct = d.correct;
        let feedback = '';
        if (!correct) {
            feedback = '<p style="color: red; font-size: 30px;">Error! The right boxes gave you more points on average, so you should press the right arrow key to select them.</p>';
        } else {
            feedback = "<p style='color: green; font-size: 30px;'>Correct!</p>";
        }
        return "<p>" + feedback + "</p><p style = 'font-size: 30px'>Press any key for the next step.</p>"
    },
    data: {test_part: 'practice-feedback'}
};

var if_node_5 = {
    timeline: [question5, question5_feedback],
    conditional_function: function () {
        // get the data from the previous trial,
        // and check which key was pressed
        var data = jsPsych.data.get().last(2).first().values()[0];
        if (data.key_press == [39]) {
            return false;
        } else {
            return true;
        }
    }
}

var question6 = {
    type: 'image-keyboard-response',
    stimulus: repo_site + 'img/inst_q6.png',
    choices: [37, 39],
    on_finish: function (data) {
        let correct_keypress = data.key_press == [37];
        data.correct = correct_keypress;
    },
    data: {test_part: 'practice-question'}
};

var question6_feedback = {
    type: "image-keyboard-response",
    stimulus: function () {
        let d = jsPsych.data.get().last(1).values()[0];
        let correct = d.correct;
        let stimulus = '';
        if (!correct) {
            stimulus = '';
        } else {
            stimulus = repo_site + 'img/right_answer.gif';
        }
        return stimulus
    },
    prompt: function () {
        let d = jsPsych.data.get().last(1).values()[0];
        let correct = d.correct;
        let feedback = '';
        if (!correct) {
            feedback = '<p style="color: red; font-size: 30px;">Error! The left boxes gave you more points on average, so you should press the left arrow key to select them.</p>';
        } else {
            feedback = "<p style='color: green; font-size: 30px;'>Correct!</p>";
        }
        return "<p>" + feedback + "</p><p style = 'font-size: 30px'>Press any key for the next step.</p>"
    },
    data: {test_part: 'practice-feedback'}
};

var if_node_6 = {
    timeline: [question6, question6_feedback],
    conditional_function: function () {
        // get the data from the previous trial,
        // and check which key was pressed
        var data = jsPsych.data.get().last(2).first().values()[0];
        if (data.key_press == [37]) {
            return false;
        } else {
            return true;
        }
    }
}

    // conditional timeline to replay the instructions and re-do the practice questions
    var choose_to_replay_instructions = {
    type: 'html-keyboard-response',
    stimulus: "<p style = 'font-size: 30px'>If any of this is not clear, press <strong>any key</strong> to watch the  slides again.</p>" +
    "<p style = 'font-size: 30px'>Or, you can press <strong>'Enter/Return'</strong> to move on.</p>"
    };

    var if_node = {
    timeline: [instruction_trials, inst_left_key, inst_right_key, question1, question1_feedback, question2, question2_feedback, question3, question3_feedback, question4, question4_feedback, question5, question5_feedback, question6, question6_feedback],
    conditional_function: function(){
        // get the data from the previous trial,
        // and check which key was pressed
        var data = jsPsych.data.get().last(1).values()[0];
        if(jsPsych.pluginAPI.compareKeys(data.key_press, 'Enter')){
            return false;
        } else {
            return true;
        }
    }
    }

    let end_of_practice = {
    type: 'image-keyboard-response',
    stimulus: repo_site + 'img/good_job.gif',
    choices: jsPsych.ALL_KEYS,
    prompt: "<p style = 'font-size: 30px'>This is the end of the instructions.</p>" +
            "<p style = 'font-size: 30px'>Press any key to start the game!</p>",
    response_ends_trial: true
    };

    var trophy = {
    type: 'image-keyboard-response',
    stimulus: repo_site + 'img/trophy2.jpeg',
    prompt: "<p style = 'font-size: 25px'>Great job! You've got a trophy!</p>" +
    "<p style = 'font-size: 25px'>Press any key to continue to the next part.</p>"
    }

        timeline.push(welcome);
        timeline.push(instruction_trials);
        timeline.push(
            inst_left_key, inst_right_key,
            question1, question1_feedback, if_node_1,
            question2, question2_feedback, if_node_2,
            question3, question3_feedback, if_node_3,
            question4, question4_feedback, if_node_4,
            question5,question5_feedback, if_node_5,
            question6,question6_feedback, if_node_6);
        timeline.push(choose_to_replay_instructions, if_node);
        timeline.push(end_of_practice);

    //the real game
    var score_feedback = {
        type: "image-keyboard-response",
        stimulus: repo_site + 'img/you_are_a_star.gif',
        choices: jsPsych.ALL_KEYS,
        prompt: function() {

            var trials = jsPsych.data.get().last(20);  // last 20 trials == last block
            var avg_score = Math.round(trials.select('sum_scores').mean());

            return "<p>Great Job!  You averaged "+avg_score+" points!</p>"+
                "<p>Press any key to continue.</p>";
        }
    };

    let trial = {
        type: 'horizon',
        choices: [37, 39],  // left, right arrows
        forced: jsPsych.timelineVariable('forced'),
        rewards: jsPsych.timelineVariable('rewards')
    };

    // Create blocks of 20 trials
    //// full_design = full_design.slice(0,20); //keep only the first block for test

    for(let j=0; j<full_design.length; j+=20){
        timeline.push({
            type: "html-keyboard-response",
            stimulus: function() {
                return "<p>Beginning part " + (j/20+1) + " of " + full_design.length / 20 + ".</p>" +
                    "<p>Press any key to begin.</p>"
            }
        });

        timeline.push({
            timeline: [trial],
            timeline_variables: full_design.slice(j, j+20)
        });

        timeline.push(score_feedback);    // feedback slide
    };

    timeline.push(trophy);            // trophy slide

