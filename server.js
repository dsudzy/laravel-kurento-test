/*
 * (C) Copyright 2014-2015 Kurento (http://kurento.org/)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
require('dotenv').config();
if (process.env.APP_ENV == 'local') {
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;
}
// const ws = require('ws');
const path = require('path');
const url = require('url');
const minimist = require('minimist');
const kurento = require('kurento-client');
const fs = require('fs');
const https = require('https');
const express = require('express');
const argv = minimist(process.argv.slice(2), {
    default: {
        // as_uri: 'https://localhost.com:8443/',
        ws_uri: process.env.KURENTO_WEB_SOCKET_URL //'wss://webrtc.com:8433/kurento'
    }
});

const options =
{
  key:  fs.readFileSync(process.env.SSL_CERT_KEY),
  cert: fs.readFileSync(process.env.SSL_CERT_CRT)
};

// var app = express();

/*
 * Definition of global variables.
 */
var idCounter = 0;
var candidatesQueue = {};
var kurentoClient = null;
var presenter = null;
var viewers = [];
var noPresenterMessage = 'No active presenter. Try again later...';

/*
 * Server startup
 */
var port = process.env.NODE_PORT;
var server = https.createServer(options);
const wss = require('socket.io')(server);
// const wss = new ws.Server({ server });

console.log('server.js');

wss.on('error', function(err){
    console.log('error',err);
})

function nextUniqueId() {
    idCounter++;
    return idCounter.toString();
}

/*
 * Management of WebSocket messages
 */
wss.on('connection', function(ws) {

    var sessionId = nextUniqueId();
    console.log('Connection received with sessionId ' + sessionId);

    ws.on('error', function(error) {
        console.log('Connection ' + sessionId + ' error');
        stop(sessionId);
    });

    ws.on('close', function() {
        console.log('Connection ' + sessionId + ' closed');
        stop(sessionId);
    });

    ws.on('message', function(_message) {
        var message = JSON.parse(_message);
        console.log('Connection ' + sessionId + ' received message ', message);

        switch (message.id) {
        case 'presenter':
            startPresenter(sessionId, ws, message.sdpOffer, function(error, sdpAnswer) {
                if (error) {
                    return ws.send(JSON.stringify({
                        id : 'presenterResponse',
                        response : 'rejected',
                        message : error
                    }));
                }
                ws.send(JSON.stringify({
                    id : 'presenterResponse',
                    response : 'accepted',
                    sdpAnswer : sdpAnswer
                }));
            });
            break;

        case 'viewer':
            startViewer(sessionId, ws, message.sdpOffer, function(error, sdpAnswer) {
                if (error) {
                    return ws.send(JSON.stringify({
                        id : 'viewerResponse',
                        response : 'rejected',
                        message : error
                    }));
                }

                ws.send(JSON.stringify({
                    id : 'viewerResponse',
                    response : 'accepted',
                    sdpAnswer : sdpAnswer
                }));
            });
            break;

        case 'stop':
            stop(sessionId);
            break;

        case 'onIceCandidate':
            onIceCandidate(sessionId, message.candidate);
            break;

        default:
            ws.send(JSON.stringify({
                id : 'error',
                message : 'Invalid message ' + message
            }));
            break;
        }
    });
});

server.listen(port);

/*
 * Definition of functions
 */

// Recover kurentoClient for the first time.
function getKurentoClient(callback) {
    if (kurentoClient !== null) {
        return callback(null, kurentoClient);
    }
    kurento(argv.ws_uri, function(error, _kurentoClient) {
        if (error) {
            console.log("Could not find media server at address " + argv.ws_uri);
            return callback("Could not find media server at address" + argv.ws_uri
                    + ". Exiting with error " + error);
        }

        kurentoClient = _kurentoClient;
        callback(null, kurentoClient);
    });
}

function startPresenter(sessionId, ws, sdpOffer, callback) {
    clearCandidatesQueue(sessionId);
    if (presenter !== null) {
        stop(sessionId);
        return callback("Another user is currently acting as presenter. Try again later ...");
    }

    presenter = {
        id : sessionId,
        pipeline : null,
        webRtcEndpoint : null
    }
    getKurentoClient(function(error, kurentoClient) {
        if (error) {
            console.log('error kurento client');
            stop(sessionId);
            return callback(error);
        }

        if (presenter === null) {
            console.log('presenter == null');
            stop(sessionId);
            return callback(noPresenterMessage);
        }
        kurentoClient.create('MediaPipeline', function(error, pipeline) {
            if (error) {
                console.log('error create kurento pipeline');
                stop(sessionId);
                return callback(error);
            }

            if (presenter === null) {
                console.log('presenter == null2');
                stop(sessionId);
                return callback(noPresenterMessage);
            }
            console.log('successfully created kurento client');
            presenter.pipeline = pipeline;
            pipeline.create('WebRtcEndpoint', function(error, webRtcEndpoint) {
                if (error) {
                    stop(sessionId);
                    return callback(error);
                }

                if (presenter === null) {
                    stop(sessionId);
                    return callback(noPresenterMessage);
                }

                presenter.webRtcEndpoint = webRtcEndpoint;

                if (candidatesQueue[sessionId]) {
                    while(candidatesQueue[sessionId].length) {
                        var candidate = candidatesQueue[sessionId].shift();
                        webRtcEndpoint.addIceCandidate(candidate);
                    }
                }

                webRtcEndpoint.on('OnIceCandidate', function(event) {
                    var candidate = kurento.getComplexType('IceCandidate')(event.candidate);
                    ws.send(JSON.stringify({
                        id : 'iceCandidate',
                        candidate : candidate
                    }));
                });

                webRtcEndpoint.processOffer(sdpOffer, function(error, sdpAnswer) {
                    if (error) {
                        stop(sessionId);
                        return callback(error);
                    }

                    if (presenter === null) {
                        stop(sessionId);
                        return callback(noPresenterMessage);
                    }

                    callback(null, sdpAnswer);
                });

                webRtcEndpoint.gatherCandidates(function(error) {
                    if (error) {
                        stop(sessionId);
                        return callback(error);
                    }
                });
            });
        });
    });
}

function startViewer(sessionId, ws, sdpOffer, callback) {
    clearCandidatesQueue(sessionId);

    if (presenter === null) {
        stop(sessionId);
        return callback(noPresenterMessage);
    }

    presenter.pipeline.create('WebRtcEndpoint', function(error, webRtcEndpoint) {
        if (error) {
            stop(sessionId);
            return callback(error);
        }
        viewers[sessionId] = {
            "webRtcEndpoint" : webRtcEndpoint,
            "ws" : ws
        }

        if (presenter === null) {
            stop(sessionId);
            return callback(noPresenterMessage);
        }

        if (candidatesQueue[sessionId]) {
            while(candidatesQueue[sessionId].length) {
                var candidate = candidatesQueue[sessionId].shift();
                webRtcEndpoint.addIceCandidate(candidate);
            }
        }

        webRtcEndpoint.on('OnIceCandidate', function(event) {
            var candidate = kurento.getComplexType('IceCandidate')(event.candidate);
            ws.send(JSON.stringify({
                id : 'iceCandidate',
                candidate : candidate
            }));
        });

        webRtcEndpoint.processOffer(sdpOffer, function(error, sdpAnswer) {
            if (error) {
                stop(sessionId);
                return callback(error);
            }
            if (presenter === null) {
                stop(sessionId);
                return callback(noPresenterMessage);
            }

            presenter.webRtcEndpoint.connect(webRtcEndpoint, function(error) {
                if (error) {
                    stop(sessionId);
                    return callback(error);
                }
                if (presenter === null) {
                    stop(sessionId);
                    return callback(noPresenterMessage);
                }

                callback(null, sdpAnswer);
                webRtcEndpoint.gatherCandidates(function(error) {
                    if (error) {
                        stop(sessionId);
                        return callback(error);
                    }
                });
            });
        });
    });
}

function clearCandidatesQueue(sessionId) {
    if (candidatesQueue[sessionId]) {
        delete candidatesQueue[sessionId];
    }
}

function stop(sessionId) {
    if (presenter !== null && presenter.id == sessionId) {
        for (var i in viewers) {
            var viewer = viewers[i];
            if (viewer.ws) {
                viewer.ws.send(JSON.stringify({
                    id : 'stopCommunication'
                }));
            }
        }
        presenter.pipeline.release();
        presenter = null;
        viewers = [];

    } else if (viewers[sessionId]) {
        viewers[sessionId].webRtcEndpoint.release();
        delete viewers[sessionId];
    }

    clearCandidatesQueue(sessionId);

    if (viewers.length < 1 && !presenter && kurentoClient !== null) {
        console.log('Closing kurento client');
        kurentoClient.close();
        kurentoClient = null;
    }
}

function onIceCandidate(sessionId, _candidate) {
    var candidate = kurento.getComplexType('IceCandidate')(_candidate);

    if (presenter && presenter.id === sessionId && presenter.webRtcEndpoint) {
        console.info('Sending presenter candidate');
        presenter.webRtcEndpoint.addIceCandidate(candidate);
    }
    else if (viewers[sessionId] && viewers[sessionId].webRtcEndpoint) {
        console.info('Sending viewer candidate');
        viewers[sessionId].webRtcEndpoint.addIceCandidate(candidate);
    }
    else {
        console.info('Queueing candidate');
        if (!candidatesQueue[sessionId]) {
            candidatesQueue[sessionId] = [];
        }
        candidatesQueue[sessionId].push(candidate);
    }
}