// calibrator windowing widget


var five = require("johnny-five");
var blessed = require("blessed");
var colours = require("../lib/styles").colours;
var styles = require("../lib/styles").styles;

var screen = blessed.screen();

var board = null;
var servo = null;
var servo_stop_val = 90; // stop value to hang onto
var servo_current_val = servo_stop_val; // value we use by default.

// set up bits here for the sp etc.
var opts = {
    debug: false,
    repl: false,
};

// determine the various state types we can be in.
var CalibrateStates = {
    SETUP: "setup",
    MAIN_SCREEN: "main_screen",
    HELP: "help",
    QUIT: "quit",
    BOARD_SELECT: "board_select",
    SERVO_SELECT: "servo_select",
    CONNECT: "connect",
    ERROR: "error",
};


var current_state = CalibrateStates.SETUP;
var status_bar = null; // pointer for the status bar later.
var status_text = "{bold}>{/} Status: "; // used for the default text.


var calibrator = {

    setup: function() {

        // set up the exit option
        screen.key(['C-c'], function(ch, key) {
            calibrator.quit();
        });

        this.main_screen();

    },


    main_screen: function() {
        
        current_state = CalibrateStates.MAIN_SCREEN;

        var main_screen = blessed.box({
            parent: screen,
            name: 'main_screen',
            content: "\n{center}{bold}Welcome to the Servo Calibrator{/bold}\n\n" +
                        "Q, <CTRL>+C to quit, " +
                        "H to get to help\n\n" +
                        "This app is designed to help you calibrate your servos so you can " +
                        "determine where your centre point is. \n\n" +
                        "Attach your servo to your board and then plug the board in.\n\n" +
                        "Use the menu keys at the bottom to select a function. {bold}'B'{/bold} will " +
                        "start to configure your board.\n",
            keys: true,
            mouse: true,
            tags: true,
            border: styles.default_borders,
            style: styles.default_styles,
        });

        var bar = blessed.box({
            parent: main_screen,
            name: 'menu_bar',
            left: 1,
            right: 1,
            bottom: 2,
            height: 1,
            align: 'center',
            style: {
                bg: colours.base00,
                fg: colours.base2,
            },
            
        });

        var status = blessed.box({
            parent: main_screen,
            name: 'status_bar',
            left: 2,
            right: 2,
            bottom: 1,
            height: 1,
            align: 'left',
            tags: true,
            style: {
                bg: colours.cyan,
                fg: colours.base1,
            },
            content: status_text + "{bold}DISCONNECTED{/bold}",
        });

        // allocate this for easy access later
        status_bar = status;

        // now we define all the various buttons
        var drawn = 0;
        var commands = {
            'Quit': {
                prefix: 'Q',
                highlight: 'red-fg',
                keys: ["q", "Q"],
                callback: function() {
                    calibrator.quit();
                },
            },

            'Help': {
                prefix: 'H',
                highlight: 'yellow-fg',
                keys: ["h", "H"],
                callback: function() {
                    calibrator.help();
                },
            },

            'Board Select': {
                prefix: 'B',
                highlight: 'magenta-fg',
                keys: ['b', 'B'],
                callback: function() {
                    calibrator.board_select();
                },
            },

            'Servo Select': {
                prefix: 'V',
                highlight: 'magenta-fg',
                keys: ['v', 'V'],
                callback: function() {
                    calibrator.servo_select();
                },
            },

            'Servo more C-CW': {
                prefix: '<',
                highlight: 'cyan-fg',
                keys: ['<', ','],
                callback: function() {
                    calibrator.servo_move(-1);
                },
            },

            'Servo more CW': {
                prefix: '>',
                highlight: 'cyan-fg',
                keys: [">", "."],
                callback: function() {
                    calibrator.servo_move(1);
                },
            },
            'Save stop value': {
                prefix: 'S',
                highlight: 'cyan-fg',
                keys: ['s', 'S'],
                callback: function() {
                    calibrator.servo_save_stop();
                },
            },
            'Test stop value': {
                prefix: '<space>',
                highlight: 'cyan-fg',
                keys: ['space'],
                callback: function() {
                    calibrator.servo_test_stop();
                },
            },
        };

        // now draw up the menu

        Object.keys(commands).forEach(function(name){
            var cmd = commands[name];
            var title;
            var len;
            var button;

            if (cmd.highlight) {
                title = "{" + cmd.highlight + "}" +
                        cmd.prefix +
                        "{/" + cmd.highlight + "}" +
                        ":" + name;
            } else {
                title = cmd.prefix + ":" + name;
            }

            len = (cmd.prefix + ":" + name).length;

            button = blessed.button({
                parent: bar,
                name: name,
                top: 0,
                left: drawn + 1,
                height: 1,
                content: title,
                width: len + 2,
                align: 'center',
                tags: true,
                mouse: true,
                style: {
                },

            });

            bar._[name] = button;
            cmd.element = button;

            if (cmd.callback) {
                button.on('press', cmd.callback);
                // TODO: Fix this to have multiple keys
                if (cmd.keys) {
                    screen.key(cmd.keys, cmd.callback);
                }
            }

            drawn += len + 3;
        });

        screen.render();
    },

    board_select: function() {
       
        current_state = CalibrateStates.BOARD_SELECT;

        var board_form = blessed.form({
            parent: screen,
            name: 'board_select',
            content: "\nSelect your board by entering the serial port path below.\n\n" +
                        "Eg: /dev/ttyUSB<n> /dev/tty.usbserial<nnn> or COM3\n" +
                        "depending on your operating system\n\n",
            keys: true,
            tags: true,
            border: styles.popup_borders,
            style: styles.popup_styles,
            width: '50%',
            height: '50%',
            left: 'center',
            top: 'center',
            align: 'center',
        });

        var sp = blessed.textbox({
            parent: board_form,
            name: 'serialport',
            keys: true,
            inputOnFocus: true,
            style: styles.form_styles,
            height: 1,
            width: 38,
            left: 'center',
            top:  8, 
        });

        sp.on("submit", function(){
            board_form.submit();
        });

        sp.on("cancel", function() {
            board_form.cancel();
        });

        board_form.on('submit', function(data) {
            // attempt to connect to the board.
            board_form.focus();
            opts.port = data.serialport || "";
            calibrator.attempt_connection();
        });

        board_form.on('cancel', function() {
            screen.remove(board_form);
            screen.render();
        });

        sp.focus();
        screen.render();
    },

    servo_select: function() {
        if (board === null) {
            calibrator.error("Before you can select a servo you need to connect your board.");
            return;
        }

        current_state = CalibrateStates.SERVO_SELECT;

        var servo_form = blessed.form({
            parent: screen,
            name: 'servo_select',
            content: "\nSelect the pin of your servo below.\n\n",
            keys: true,
            tags: true,
            border: styles.popup_borders,
            style: styles.popup_styles,
            width: '50%',
            height: '50%',
            left: 'center',
            top: 'center',
            align: 'center',
        });

        var servopin = blessed.textbox({
            parent: servo_form,
            name: 'servopin',
            keys: true,
            inputOnFocus: true,
            style: styles.form_styles,
            height: 1,
            width: 4,
            left: 'center',
            top:  8, 
        });

        servopin.on("submit", function(){
            servo_form.submit();
        });

        servopin.on("cancel", function() {
            servo_form.cancel();
        });

        servo_form.on('submit', function(data) {
            // fire up a new servo.
            servo_form.focus();
            calibrator.connect_servo(data.servopin);
        });

        servo_form.on('cancel', function() {
            screen.remove(servo_form);
            screen.render();
        });

        servopin.focus();
        screen.render();
    },

    connect_servo: function(pin) {
        // creates a servo object on the pin provided.
        screen.remove(screen.focused);
        screen.render();

        servo = new five.Servo({
            type: 'continuous',
            pin: pin,
        }).stop();



    },

    attempt_connection: function() {
        // attempts to connect to the board and get it set up.
        current_state = CalibrateStates.ATTEMPT_CONNECTION;

        if (board !== null) {
            // we have a connection already so just kill it and try again

            calibrator.status("{bold}CLOSING PREVIOUS CONNECTION{/}");
            screen.render();

            board.io.sp.close(function() {
                board = null;
                calibrator.attempt_connection();
            });
        } else {

            calibrator.status("{bold}ATTEMPTING CONNECTION{/}");

            // kill the old window now which will be the parent of the button (ie the form)
            screen.remove(screen.focused);
            screen.render();

            board = new five.Board(opts);
        }        

        board.on("ready", function(err) {
            if (err) console.log(err);
            current_state = CalibrateStates.MAIN_SCREEN;
            
            calibrator.status(board.port + " {bold}CONNECTED{/}");
            screen.render();
        });

        board.on("error", function(err) {
            console.log("There was an error");
            calibrator.error(err);
            current_state = CalibrateStates.MAIN_SCREEN;
            calibrator.status("{bold}DISCONNECTED{/}");
            screen.render();
        });
    },

    servo_move: function(turn_val) {
        // this method moves the value either one value CW (positive) or CCW
        // (negative).

        servo_current_val += turn_val;
        servo.to(servo_current_val);

        calibrator.status(board.port + " {bold}CONNECTED{/} Servo on pin: " + 
                servo.pin + " Current: " + servo_current_val + " Saved: " +
                servo_stop_val);

    },

    servo_save_stop: function() {
        // saves the current value;
        servo_stop_val = servo_current_val;
        
        calibrator.status(board.port + " {bold}CONNECTED{/} Servo on pin: " + 
                servo.pin + " Current: " + servo_current_val + " Saved: " +
                servo_stop_val);
    },

    servo_test_stop: function() {
        // tests the saved value by moving the servo CCW for a few seconds 
        // then stopping.

        

        servo.cw();

        setTimeout(function() {
            servo.to(servo_stop_val);
            calibrator.status(board.port + " {bold}connected{/} servo on pin: " + 
                    servo.pin + " current: " + servo_current_val + " saved: " +
                    servo_stop_val + " {bold}Should be stopped{/}");
        }, 3000);

        calibrator.status(board.port + " {bold}connected{/} servo on pin: " + 
                servo.pin + " current: " + servo_current_val + " saved: " +
                servo_stop_val + " {bold}testing{/}");
    },

    status: function(status) {
        // updates the status bar content
        status_bar.content = status_text + status;
        screen.render();
    },

    update_status: function() {
        // looks at the current status level and then choses appropriate status
        // messages.
        
        var status = "";

        // TODO make some kind of status checker here.

        status_bat.content = status_text + status;
        screen.render();
    },

    error: function(err) {
        // shows an error box to the screen

        var err_box = blessed.box({
            parent: screen,
            content: err + '\n\nHit <ESC> to exit this window',
            border: styles.error_borders,
            style: styles.error_styles,
            width: '25%',
            height: '25%',
            align: 'center',
            top: 'center',
            left: 'center',
        });

        err_box.key(['escape', 'return'], function(ch, key) {
            // exit out of this screen.
            screen.remove(screen.focused);
            screen.render();
        });
        err_box.focus();
        screen.render()

    },

    message: function(msg) {

        var msg_box = blessed.box({
            parent: screen,
            content: msg,
            border: styles.popup_borders,
            style: styles.popup_styles,
            width: '25%',
            height: '25%',
            align: 'center',
            top: 'center',
            left: 'center',
        });

        msg_box.key(['escape', 'return'], function(ch, key) {
            // exit out of this screen.
            screen.remove(screen.focused);
            screen.render();
        });
        msg_box.focus();
        screen.render()
        screen.render();
    },


    help: function() {
        // display the help screen;
        calibrator.message("Help not currently implemented");
    },


    quit: function() {
        // does all the quitting.
        return process.exit(0);
    },

}

module.exports = calibrator;
