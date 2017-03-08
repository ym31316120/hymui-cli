/**
 * Created by ym on 2017/3/8.
 */
'use strict';

var Logging = require('../appLibs/logging');
var log = Logging.logger;
var chalk = require('chalk');
var EOL = require('os').EOL;

/**
 * @method printHyMui
 * @return {Array} Returns array of lines to print for ionic name
 */
function printHyMui(hyMuiVersion) {
    return [
        '  _    _  _       _  ___        ___  _     _   _',
        ' | |  | |\\ \\     / /|   \\      /   || |   | | |_|       ',
        ' | |__| | \\ \\   / / | |\\ \\    / /| || |   | |  _       ',
        ' |  __  |  \\ \\ / /  | | \\ \\  / / | || |   | | | |',
        ' | |  | |   |   |   | |  \\ \\/ /  | || |___| | | |   ',
        ' |_|  |_|   |___|   |_|   \\__/   |_||_______| |_|   CLI v' + hyMuiVersion
    ];
}


/**
 * @method printTemplate
 * @param {Array} lineArray list of lines to print
 * @return {Null} no return value
 */
function printTemplate(lineArray) {
    log.info(lineArray.reduce(function(all, line) {
        all += (line !== null) ? line + '\n' : '';
        return all;
    }, ''));
}


/**
 * @method printAvailableTasks
 * @param {String} taskName task name supplied to cli
 * @return {Null} no return value
 */
function printTaskListShortUsage(taskList, taskName, hyMuiVersion) {
    var taskLines = taskList
        .filter(function(task) {
            return task.summary;
        })
        .map(function(task) {
            var name = '   ' + task.name + '  ';
            var dots = '';
            while ((name + dots).length < 20) {
                dots += '.';
            }
            return chalk.green.bold(name) + chalk.grey(dots) + '  ' + chalk.bold(task.summary);
        });

    var lines = [].concat(
        printHyMui(hyMuiVersion),
        [
            '',
            'Usage: HyMui task args',
            '',
            '',
            '=======================',
            (taskName ?
                chalk.bold.red(taskName + ' is not a valid task\n\n')
                : null),
            chalk.bold('Available tasks: '),
            '(use --help or -h for more info)',
            '',
            ''
        ],
        taskLines
    );

    printTemplate(lines);
}


/**
 * @method printTaskUsage
 * @return {Null} no return value
 */
function printTaskUsage(task, hyMuiVersion) {
    var lines = [].concat(
        printHyMui(hyMuiVersion),
        [
            '',
            '=======================',
            ''
        ]
    );
    printTemplate(lines);

    printTaskDetails(task);

    printTemplate([
        ''
    ]);
}


/**
 * @method printAllTaskUsage
 * @return {Null} no return value
 */
function printTaskListUsage(taskList, hyMuiVersion) {
    var lines = [].concat(
        printHyMui(hyMuiVersion),
        [
            '',
            '=====================================================',
            ''
        ]
    );
    printTemplate(lines);

    taskList
        .filter(function(task) {
            return task.summary;
        }).forEach(function(task) {
        return printTaskDetails(task);
    });

    printTemplate([
        ''
    ]);
}


/**
 * @method printTaskDetails
 * @return {Null} no return value
 */
function printTaskDetails(d) {
    function w(s) {
        process.stdout.write(s);
    }

    w('\n');

    var rightColumn = 45;
    var dots = '';
    var indent = '';
    var x;
    var arg;

    var taskArgs = d.title;

    for (arg in d.args) {
        if ({}.hasOwnProperty.call(d.args, arg)) {
            taskArgs += ' ' + arg;
        }
    }

    w(chalk.green.bold(taskArgs));

    while ((taskArgs + dots).length < rightColumn + 1) {
        dots += '.';
    }

    w(' ' + chalk.grey(dots) + '  ');

    if (d.summary) {
        w(chalk.bold(d.summary));
    }

    for (arg in d.args) {
        if (!d.args[arg]) continue;

        indent = '';
        w('\n');
        while (indent.length < rightColumn) {
            indent += ' ';
        }
        w(chalk.bold(indent + '    ' + arg + ' '));

        var argDescs = d.args[arg].split(EOL);
        var argIndent = indent + '    ';

        for (x = 0; x < arg.length + 1; x += 1) {
            argIndent += ' ';
        }

        for (x = 0; x < argDescs.length; x += 1) {
            if (x === 0) {
                w(chalk.bold(argDescs[x]));
            } else {
                w('\n' + argIndent + chalk.bold(argDescs[x]));
            }
        }
    }

    indent = '';
    while (indent.length < d.name.length + 1) {
        indent += ' ';
    }

    var optIndent = indent;
    while (optIndent.length < rightColumn + 4) {
        optIndent += ' ';
    }

    for (var opt in d.options) {
        if ({}.hasOwnProperty.call(d.options, opt)) {
            w('\n');
            dots = '';

            var optLine = indent + '[' + opt + ']  ';

            w(chalk.yellow.bold(optLine));

            if (d.options[opt]) {
                while ((dots.length + optLine.length - 2) < rightColumn) {
                    dots += '.';
                }
                w(chalk.grey(dots) + '  ');

                var taskOpt = d.options[opt];
                var optDescs;

                if (typeof taskOpt == 'string') {
                    optDescs = taskOpt.split(EOL);
                } else {
                    optDescs = taskOpt.title.split(EOL);
                }
                for (x = 0; x < optDescs.length; x += 1) {
                    if (x === 0) {
                        w(chalk.bold(optDescs[x]));
                    } else {
                        w('\n' + optIndent + chalk.bold(optDescs[x]));
                    }
                }
            }
        }

        w('\n');
    }
}

module.exports = {
    printTaskListShortUsage: printTaskListShortUsage,
    printTaskListUsage: printTaskListUsage,
    printTaskUsage: printTaskUsage
};
