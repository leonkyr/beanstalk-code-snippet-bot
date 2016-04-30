'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; /* eslint consistent-return: 0 */


var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _morgan = require('morgan');

var _morgan2 = _interopRequireDefault(_morgan);

var _bodyParser = require('body-parser');

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _nodePersist = require('node-persist');

var _nodePersist2 = _interopRequireDefault(_nodePersist);

var _utils = require('./utils');

var _constants = require('./constants');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _process$env = process.env;
var SLACK_VERIFY_TOKEN = _process$env.SLACK_VERIFY_TOKEN;
var PORT = _process$env.PORT;

if (!SLACK_VERIFY_TOKEN) {
    console.error('SLACK_VERIFY_TOKEN is required');
    process.exit(1);
}
if (!PORT) {
    console.error('PORT is required');
    process.exit(1);
}

var app = (0, _express2.default)();
app.use((0, _morgan2.default)('dev'));

app.route('/code').get(function (req, res) {
    res.sendStatus(200);
}).post(_bodyParser2.default.urlencoded({ extended: true }), function (req, res) {
    if (req.body.token !== SLACK_VERIFY_TOKEN) {
        return res.sendStatus(401);
    }

    var _req$body = req.body;
    var text = _req$body.text;
    var response_url = _req$body.response_url;
    var team_id = _req$body.team_id;

    // Handle empty request

    if (!text) {
        return res.json({
            response_type: 'ephemeral',
            text: _constants.EMPTY_REQUEST
        });
    }

    // Handle any help requests
    if (text === 'help') {
        return res.json({
            response_type: 'ephemeral',
            text: _constants.HELP_MESSAGE
        });
    }

    if (text.indexOf(_constants.BS_URL_MATCH) > -1) {
        // Iterate through storage data
        _nodePersist2.default.forEach(function (key, value) {

            // Match team ID in storage from request
            if (value.slackTeamID === team_id) {

                // Get file contents from Beanstalk
                (0, _utils.getFileContents)(text, {
                    username: value.bsUsername,
                    token: value.bsAuthToken
                }, function (err, content) {
                    if (err) {
                        return res.json({
                            response_type: 'ephemeral',
                            text: _constants.ERROR_MESSAGE
                        });
                    }

                    // TODO: If this request takes more than 3000ms slack will not post our response. Instead we should probably return an initial message to the user("Looking up your file"). Then after send the file as an incoming webhook using response_url.
                    return res.json(_extends({
                        response_type: 'in_channel'
                    }, content));
                });
            }
        });
    } else {
        return res.json({
            response_type: 'ephemeral',
            text: _constants.UNRECOGNIZED_REQUEST
        });
    }
});

app.listen(PORT, function (err) {
    if (err) {
        return console.error('Error starting server: ', err);
    }

    return console.log('Server successfully started on port %s', PORT);
});