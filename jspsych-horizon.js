jsPsych.plugins["horizon"] = (function () {

    var plugin = {};

    const defaultErrorCallback = function(error)
    {
        // output the error to the console:
        console.error('[horizon]', error);

        // return the error as text
        let error_text = '[Horizon Error]'
        while (true) {
            if (typeof error === 'object' && 'context' in error) {
                error_text += ' [' + error.context + ']';
                error = error.error;
            } else {
                error_text += '[' + error + ']';
                break;
            }
        }
        return error_text;
    };

    plugin.info = {
        name: "horizon",
        parameters: {
            forced: {
                type: jsPsych.plugins.parameterType.INT, // BOOL, STRING, INT, FLOAT, FUNCTION, KEYCODE, SELECT, HTML_STRING, IMAGE, AUDIO, VIDEO, OBJECT, COMPLEX
                array: true,
                default: undefined,
                description: 'Array which describes which bandit may be selected (0=either, 1=left, 2=right)'
            },
            rewards: {
                type: jsPsych.plugins.parameterType.INT,
                array: true,
                default: undefined,
                description: 'Rewards for each bandit.  [[bandit 1 rewards], [bandit 2 rewards]]'
            },
            choices: {
                type: jsPsych.plugins.parameterType.KEYCODE,
                array: true,
                default: [
                    jsPsych.pluginAPI.convertKeyCharacterToKeyCode(','),
                    jsPsych.pluginAPI.convertKeyCharacterToKeyCode('.')
                ],
                description: 'Response keys for selecting bandit.'
            },
            demo: {
                type: jsPsych.plugins.parameterType.BOOL,
                array: false,
                default: false,
                description: 'In demo mode, the bandits are displayed in the specified state until a key is pressed.'
            },
            display: {
                type: jsPsych.plugins.parameterType.STRING,
                array: true,
                default: [[], []],
                description: 'In demo mode, the display variable is used to set the values displayed.'
            },
            post_response_delay: {
                type: jsPsych.plugins.parameterType.INT,
                array: false,
                default: 1000,
                description: 'Delay after the final response of the trial'
            },
            msg_top: {
                type: jsPsych.plugins.parameterType.HTML_STRING,
                array: false,
                default: '',
                description: 'Message to display at the top of the screen.'
            },
            msg_bottom: {
                type: jsPsych.plugins.parameterType.HTML_STRING,
                array: false,
                default: '',
                description: 'Message to display at the bottom of the screen.'
            },
            inst_mode: {
                type: jsPsych.plugins.parameterType.STRING,
                array: false,
                default: '',
                description: 'Special commands for generating instructions slides.'
            },
            errorCallback: {
                type: jsPsych.plugins.parameterType.FUNCTION,
                pretty_name: 'ErrorCallback',
                default: defaultErrorCallback,
                description: 'The callback function called whenever an error has occurred'
            }
        }
    }

    plugin.trial = function (display_element, trial) {

        let processing = false;
        let forced = trial.forced;
        let rewards = trial.rewards;
        let display;
        if(trial.demo){
            display = trial.display;
        } else {
            display = [[], []];
        }

        let responses = [];
        let rt = [];
        let starttime;

        let size = 50;
        let max_size = 10;  // assumed maximum size of a bandit
        let stacksize = forced.length;
        let yPos = [...Array(stacksize).keys()];  // create array [0, 1, ..., stacksize - 1]

        let after_response = function (info) {
            try {
                if (trial.demo) {
                    end_trial();
                    return;
                }

                // discard key responses after the end of the game
                if (active_row >= forced.length) {
                    return;
                }

                let endtime = new Date();
                // process key response
                if (jsPsych.pluginAPI.compareKeys(info.key, trial.choices[0])) {
                    if (forced[active_row] !== 2 && !processing) {
                        processing = true;
                        responses.push('left');
                        display[0].push(rewards[0][active_row]);
                        display[1].push('XX')
                        rt.push(endtime - starttime);  // reaction time in ms
                        next_trial();
                    }
                } else if (jsPsych.pluginAPI.compareKeys(info.key, trial.choices[1])) {
                    if (forced[active_row] !== 1 && !processing) {
                        processing = true;
                        responses.push('right');
                        display[1].push(rewards[1][active_row]);
                        display[0].push('XX')
                        rt.push(endtime - starttime);  // reaction time in ms
                        next_trial();
                    }
                }
            }
            catch (error) {
                jsPsych.finishTrial({error: trial.errorCallback(error)})
            }
        }

        // function to end trial when it is time
        var end_trial = function () {
            try {
                // kill any remaining setTimeout handlers
                jsPsych.pluginAPI.clearAllTimeouts();

                // kill keyboard listeners
                if (typeof keyboardListener !== 'undefined') {
                    jsPsych.pluginAPI.cancelKeyboardResponse(keyboardListener);
                }

                // Prepare output variables
                if (trial.demo) {
                    trial_data = {};
                } else {
                    let scores = [];
                    let a = [];
                    for (let i = 0; i < forced.length; i++) {
                        if (responses[i] === 'left') {
                            scores.push(rewards[0][i]);
                            a.push(1);
                        } else {
                            scores.push(rewards[1][i]);
                            a.push(2);
                        }
                    }

                    // Use with Array.reduce() to sum elements of an array.
                    let sum = function (total, num) {
                        return total + num;
                    }

                    // gather the data to store for the trial
                    var trial_data = {
                        "responses": responses,
                        "rewards": trial.rewards,
                        "scores": scores,
                        "sum_scores": scores.reduce(sum),
                        "a": a,
                        "rt": rt
                    };
                }

                // After a delay, clear display and move on.
                jsPsych.pluginAPI.setTimeout(function () {
                    // clear the display
                    display_element.innerHTML = '';

                    // move on to the next trial
                    jsPsych.finishTrial(trial_data);
                }, trial.post_response_delay);
            }
            catch (error) {
                jsPsych.finishTrial({error: trial.errorCallback(error)})
            }
        };

        var keyboardListener = jsPsych.pluginAPI.getKeyboardResponse({
            callback_function: after_response,
            valid_responses: trial.choices,
            rt_method: 'performance',
            persist: true,
            allow_held_key: false
        });

        display_element.innerHTML =
            '<div id="horizon-top"></div>' +
            '<div id="horizon-container"></div>' +
            '<div id="horizon-bottom"></div>';

        $('#horizon-top').html(trial.msg_top);
        $('#horizon-bottom').html(trial.msg_bottom);

        let active_row = 0; // which row is active
        let yOffset = 20;
        let xOffset = [100 - size / 2, 300 - size / 2];

        // make svg container
        let svg = d3.select('#horizon-container').append('svg')
            .attr('width', 400)
            .attr('height', size * max_size + yOffset * 2);


        let create_bandits = function () {
            svg.selectAll('rect')
                .data(d3.cross(xOffset, yPos))
                .enter().append('rect')
                .attr('x', d => d[0])
                .attr('y', d => d[1] * size + yOffset)
                .attr('height', size)
                .attr('width', size)
                .attr('class', function (d, i) {
                    if (Math.floor(i / yPos.length) === 0) {
                        return 'bandit-block bandit-left';
                    } else {
                        return 'bandit-block bandit-right';
                    }
                })
                // set id to be block-[col]-[row]
                .attr('id', function (d, i) {
                    return 'block-' + Math.floor(i / yPos.length) + '-' + d[1];
                });
        }

        let create_bandit_arms = function () {
            let sides = ['left', 'right'];
            let x1 = [xOffset[0], xOffset[1] + size];
            let x2 = [xOffset[0] - size, xOffset[1] + 2 * size];

            for (let i = 0; i <= 1; i++) {
                let line = svg.append('line')
                    .attr('x1', x1[i])
                    .attr('x2', x2[i])
                    .attr('y1', (yOffset + 2.5 * size))
                    .attr('y2', (yOffset + 1.5 * size))
                    .attr('class', 'bandit-arm bandit-' + sides[i])
                    .attr('id', 'bandit-arm-' + sides[i]);
                svg.append('circle')
                    .attr('cy', function () {
                        return line.attr('y2');
                    })
                    .attr('cx', function () {
                        return line.attr('x2');
                    })
                    .attr('r', 4)
                    .attr('class', 'bandit-ball bandit-' + sides[i])
                    .attr('id', 'bandit-ball-' + sides[i]);
            }
        }

        // Suppress drawing the bandits for blank instructions slides
        if(trial.inst_mode !== 'blank'){
            create_bandits();
            create_bandit_arms();
        }

        let animate_arm = function (side) {
            // side should be 'right' or 'left'

            let arm = d3.select('#bandit-arm-' + side);
            let oldy2 = parseFloat(arm.attr('y2'));
            arm.transition()
                .attr('y2', (oldy2 + 2 * size))
                .attr('cy', (oldy2 + 2 * size))
                .delay(0)
                .duration(250)
                .on('end', function () {
                    d3.select(this)
                        .transition()
                        .attr('y2', oldy2)
                        .attr('cy', oldy2)
                        .delay(0)
                        .duration(250)
                });
            let ball = d3.select('#bandit-ball-' + side);
            ball.transition()
                .attr('cy', (oldy2 + 2 * size))
                .delay(0)
                .duration(250)
                .on('end', function () {
                    d3.select(this)
                        .transition()
                        .attr('cy', oldy2)
                        .delay(0)
                        .duration(250)
                });
        }

        let next_trial = function () {
            try {
                clear_choices();
                let side = responses[responses.length - 1];
                animate_arm(side);
                jsPsych.pluginAPI.setTimeout(function () {
                    active_row += 1;
                    update_text();
                }, 250);
                jsPsych.pluginAPI.setTimeout(function () {
                    display_choices();
                    processing = false;
                }, 500);

                jsPsych.pluginAPI.setTimeout(function () {
                    if (active_row >= forced.length) {
                        end_trial()
                    }
                }, trial.post_response_delay);
            }
            catch (error) {
                jsPsych.finishTrial({error: trial.errorCallback(error)})
            }
        }

        let update_text = function () {
            svg.selectAll('g.rewardtext-group').remove();

            svg.selectAll('g.rewardtext-group')
                .data(display)
                .enter()
                .append('g')
                .attr('class', 'rewardtext-group')
                .attr('transform', function (d, i) {
                    return 'translate(' + (xOffset[i] + size / 2) + ')'
                })
                .selectAll('text')
                .data(function (d) {
                    return d;
                })
                .enter().append('text')
                .attr('x', 0)
                .attr('y', function (d, i) {
                    return yPos[i] * size + size / 2 + yOffset;
                })
                .text(function (d, i) {
                    return d;
                })
                .attr('class', 'rewardtext');
        }

        // Highlight the available choices
        let display_choices = function () {
            try {
                let side;
                if (forced[active_row] === 0) {
                    side = [0, 1];
                } else {
                    side = [forced[active_row] - 1];
                }

                for (let i = 0; i < side.length; i++) {
                    d3.select('#block-' + side[i] + '-' + active_row)
                        .classed('block-choices', true);
                }
                starttime = new Date();
            }
            catch (error) {
                jsPsych.finishTrial({error: trial.errorCallback(error)})
            }
        }

        // Demonstrate the lever animation
        if(trial.inst_mode === 'lever') {
            jsPsych.pluginAPI.setTimeout(function(){
                animate_arm('right');
            }, 300);
        }

        if(trial.demo){
            if(trial.inst_mode === 'bandits') {
                update_text();
            } else if(trial.inst_mode === 'prompt') {
                active_row = display[0].length;
                update_text();
                display_choices();
            }
        } else {
            // Highlight the choices for the first trial
            display_choices();
        }

        // Remove the highlight from all blocks
        let clear_choices = function () {
            d3.selectAll('.bandit-block')
                .classed('block-choices', false);
        }
    };

    return plugin;
})();
