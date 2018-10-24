var kurentoUtils = require('kurento-utils');
require('adapterjs');


var ws = new WebSocket('wss://' + location.host + ':3030');
var video;
var webRtcPeer;

window.onload = function() {
    video = document.getElementById('video');

    document.getElementById('present').addEventListener('click', function() { presenter(); } );
    document.getElementById('viewer').addEventListener('click', function() { viewer(); } );
    document.getElementById('stop').addEventListener('click', function() { stop(); } );
}

window.onbeforeunload = function() {
    ws.close();
}

ws.onmessage = function(message) {
    var parsedMessage = JSON.parse(message.data);
    // console.log('Received message: ' + message.data);

    switch (parsedMessage.id) {
        case 'presenterResponse':
            presenterResponse(parsedMessage);
            break;
        case 'viewerResponse':
            viewerResponse(parsedMessage);
            break;
        case 'stopCommunication':
            dispose();
            break;
        case 'iceCandidate':
            webRtcPeer.addIceCandidate(parsedMessage.candidate)
            break;
        default:
            // console.log('Unrecognized message', parsedMessage);
    }
}

function presenter() {
    if (!webRtcPeer) {
        // showSpinner(video);

        var options = {
            localVideo: video,
            onicecandidate : _onIceCandidate
        }

        webRtcPeer = kurentoUtils.WebRtcPeer.WebRtcPeerSendonly(options, function(error) {
            if(error) {
                // return console.log('error', error);
            }

            this.generateOffer(_onOfferPresenter);
        });
    }
}

function _onOfferPresenter(error, offerSdp) {
    if (error) {
        // return console.log('error', error);
    } 

    var message = {
        id : 'presenter',
        sdpOffer : offerSdp
    };
    sendMessage(message, '_onOfferPresenter');
}

function viewer() {
    // console.log('herer');
    if (!webRtcPeer) {
        // console.log('here web peer not false');
        // showSpinner(video);

        var options = {
            remoteVideo: video,
            onicecandidate : _onIceCandidate
        }

        webRtcPeer = kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly(options, function(error) {
            if (error) {
                // return console.log('error', error);
            } 

            this.generateOffer(_onOfferViewer);
        });
    }
}

function _onOfferViewer(error, offerSdp) {
    if (error) {
        // return console.log('error', error);
    } 

    var message = {
        id : 'viewer',
        sdpOffer : offerSdp
    }
    sendMessage(message, '_onOfferViewer');
}

function stop() {
    if (webRtcPeer) {
        var message = {
                id : 'stop'
        }
        sendMessage(message, 'stop');
        dispose();
    }
}

function dispose() {
    // console.log('dispose');
    if (webRtcPeer) {
        webRtcPeer.dispose();
        webRtcPeer = null;
    }
    // hideSpinner(video);
}

function _onIceCandidate(candidate) {
       // console.log('Local candidate' + JSON.stringify(candidate));

       var message = {
          id : 'onIceCandidate',
          candidate : candidate
       }
       sendMessage(message, '_onIceCandidate');
}

function sendMessage(message, origin) {
    var jsonMessage = JSON.stringify(message);
    // console.log('origin: ' + origin);
    // console.log('Senging message: ' + jsonMessage);
    ws.send(jsonMessage);
}