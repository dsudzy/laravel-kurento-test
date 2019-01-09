require('dotenv').config();
if (process.env.APP_ENV == 'local') {
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;
}
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

console.log(process.env.SSL_CERT_KEY, process.env.SSL_CERT_CRT);
/*const options =
{
  key:  fs.readFileSync(process.env.SSL_CERT_KEY),
  cert: fs.readFileSync(process.env.SSL_CERT_CRT)
};*/

const options =
{
  key:  fs.readFileSync('resources/keys/privkey.pem', 'utf8'),
  cert: fs.readFileSync('resources/keys/cert.pem', 'utf8')
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
var port = process.env.NODE_PORT || 3000;
var server = https.createServer(options);
var io = require('socket.io')(server);

console.log('server.js');

io.on('error', function(err){
    console.log('error',err);
})

io.on('close', function(err){
    console.log('close',err);
})

function nextUniqueId() {
    idCounter++;
    return idCounter.toString();
}

/*
 * Management of WebSocket messages
 */
io.on('connection', (socket) => {

    // var sessionId = nextUniqueId();
    var sessionId = 1;
    console.log('Connection received with sessionId ' + sessionId);

    socket.on('error', function(error) {
        console.log('Connection ' + sessionId + ' error');
        stop(sessionId);
    });

    socket.on('close', function() {
        console.log('Connection ' + sessionId + ' closed');
        stop(sessionId);
    });

    socket.on('message', function(_message) {
        var message = JSON.parse(_message);
        // console.log('Connection ' + sessionId + ' received message ', message);
        switch (message.id) {
        case 'presenter':
            startPresenter(sessionId, socket, message.sdpOffer, function(error, sdpAnswer) {
                if (error) {
                    return socket.send(JSON.stringify({
                        id : 'presenterResponse',
                        response : 'rejected',
                        message : error
                    }));
                }
                socket.send(JSON.stringify({
                    id : 'presenterResponse',
                    response : 'accepted',
                    sdpAnswer : sdpAnswer
                }));
            });
            break;

        case 'viewer':
            startViewer(sessionId, socket, message.sdpOffer, function(error, sdpAnswer) {
                if (error) {
                    return socket.send(JSON.stringify({
                        id : 'viewerResponse',
                        response : 'rejected',
                        message : error
                    }));
                }

                socket.send(JSON.stringify({
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
            socket.send(JSON.stringify({
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

function startPresenter(sessionId, socket, sdpOffer, callback) {
    clearCandidatesQueue(sessionId);
    console.log('candidates queue cleared');
    if (presenter !== null) {
        console.log('presenter = ' + presenter);
        stop(sessionId);
        return callback("Another user is currently acting as presenter. Try again later ...");
    }

    presenter = {
        id : sessionId,
        pipeline : null,
        webRtcEndpoint : null
    }
    console.log('getting kurento client');
    getKurentoClient(function(error, kurentoClient) {
        console.log('get kurento client');
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
                console.log('presenter == null');
                stop(sessionId);
                return callback(noPresenterMessage);
            }
            console.log('successfully created kurento client');
            presenter.pipeline = pipeline;
            console.log('presenter pipeline', presenter.pipeline);
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
                    socket.send(JSON.stringify({
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

function startViewer(sessionId, socket, sdpOffer, callback) {
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
            "ws" : socket
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
            socket.send(JSON.stringify({
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
                viewer.socket.send(JSON.stringify({
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
