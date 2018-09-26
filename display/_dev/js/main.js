var data = {
    town: 'Talence',
    carArea: {lat: 44.8005254, lng: -0.6040306, zoom: 12},
    user: 1
};

var db;
var loadFirebase = function() {
    var config = {
        apiKey: "AIzaSyDe5XDx3gXJNTmixrY8tqrJV_iMzdomNbc",
        authDomain: "meroir-77fc6.firebaseapp.com",
        databaseURL: "https://meroir-77fc6.firebaseio.com",
        projectId: "meroir-77fc6",
        storageBucket: "meroir-77fc6.appspot.com",
        messagingSenderId: "701589652709"
    };
    firebase.initializeApp(config);

    db = firebase.database();
};

loadFirebase();

var initMap = function() {
    db.ref('/profils/'+data.user+'/transports/voiture').once('value').then(function(snapshot) {
        var data = snapshot.val();

        if(data.active == 'true') {
            //Mini map
            var map = new google.maps.Map(document.getElementById('map'), {
                zoom: data.zoom,
                center: {lat: data.lat, lng: data.lng},
                disableDefaultUI: true
            });
            var trafficLayer = new google.maps.TrafficLayer();
            trafficLayer.setMap(map);

            //Large map
            var largeMap = new google.maps.Map(document.getElementById('large-map'), {
                zoom: data.zoom + 2.25,
                center: {lat: data.lat, lng: data.lng},
                disableDefaultUI: true
            });
            var trafficLayerLarge = new google.maps.TrafficLayer();
            trafficLayerLarge.setMap(largeMap);
        }
    });
};

// --- Calendar --- //

// Client ID and API key from the Developer Console
var CLIENT_ID = '701589652709-am9gkbk9f16d01kks0vjp5fi09ka2s9c.apps.googleusercontent.com';
var API_KEY = 'AIzaSyDe5XDx3gXJNTmixrY8tqrJV_iMzdomNbc';

// Array of API discovery doc URLs for APIs used by the quickstart
var DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];

// Calendar API address
var CALENDAR_API = 'https://www.googleapis.com/calendar/v3';

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
var SCOPES = "https://www.googleapis.com/auth/calendar.readonly";

var authorizeButton = document.getElementById('authorize-button');

/**
 *  On load, called to load the auth2 library and API client library.
 */
function handleClientLoad() {
    gapi.load('client:auth2', initClient);
}

/**
 *  Initializes the API client library and sets up sign-in state
 *  listeners.
 */
function initClient() {
    gapi.client.init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        discoveryDocs: DISCOVERY_DOCS,
        scope: SCOPES
    }).then(function () {
        // Listen for sign-in state changes.
        gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

        // Handle the initial sign-in state.
        updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
        authorizeButton.onclick = handleAuthClick;
    });
}

/**
 *  Sign in the user upon button click.
 */
function handleAuthClick(event) {
    gapi.auth2.getAuthInstance().signIn();
}

var displayEvents;
var agendaEvents = [];

Date.prototype.addDays = function(days) {
    var dat = new Date(this.valueOf());
    dat.setDate(dat.getDate() + days);
    return dat;
};

Date.prototype.addHours = function(h) {
    this.setTime(this.getTime() + (h*60*60*1000));
    return this;
}

/**
 *  Called when the signed in status changes, to update the UI
 *  appropriately. After a sign-in, the API is called.
 */
function updateSigninStatus(isSignedIn) {
    if (isSignedIn) {
        authorizeButton.style.display = 'none';

        //Test request
        gapi.client.request({
            path: CALENDAR_API + '/users/me/calendarList'
        }).execute(function(jsonResp, rawResp) {
            calendars = jsonResp.items;

            var $eventsContainer = $('.calendar .content .events');
            var currentDate = new Date();

            db.ref('/profils/'+data.user+'/comptesGoogle/1/agendas').once('value').then(function(snapshot) {
                var counter = 0;
                snapshot.val().forEach(function(calendarId) {

                    gapi.client.calendar.events.list({
                        'calendarId': calendarId,
                        'timeMin': (new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate())).toISOString(),
                        'showDeleted': false,
                        'singleEvents': true,
                        'maxResults': 10,
                        'orderBy': 'startTime'
                    }).then(function(response) {
                        var events = response.result.items;
                        if (events.length > 0) {
                            for (i = 0; i < events.length; i++) {
                                var event = events[i];
                                var startISOtime = event.start.dateTime;

                                if (!startISOtime)
                                    continue;

                                var endISOtime = event.end.dateTime;

                                var beginDate = new Date(startISOtime);
                                var endDate = new Date(endISOtime);

                                var day = beginDate.getFullYear() + '-' + (beginDate.getMonth()+1) + '-' + beginDate.getDate();

                                var $event = $('<p></p>');
                                $event.attr('data-begin-hour', beginDate.getHours() + ':' + beginDate.getMinutes());
                                $event.attr('data-end-hour', endDate.getHours() + ':' + endDate.getMinutes());
                                $event.text(event.summary);

                                //Get color
                                var color = '#2D9CDB'; //Default blue
                                for(var j = 0; j < calendars.length; j++) {
                                    if(calendars[j].id == calendarId) {
                                        color = calendars[j].backgroundColor;
                                    }
                                }

                                $event.attr('data-color', color);

                                //Create day if not exists
                                if($eventsContainer.find('.day[data-date="'+day+'"]').length === 0) {
                                    $day = $('<div></div>');
                                    $day.attr('class', 'day');
                                    $day.attr('data-date', day);
                                    $eventsContainer.append($day);
                                    agendaEvents.push(day);
                                }

                                //Add event to DOM
                                $eventsContainer.find('.day[data-date="'+day+'"]').append($event);
                            }
                        }

                        if(++counter == snapshot.val().filter(Boolean).length) {
                            agendaEvents.sort();

                            for(var i = 0; i <= 2 ; i++) {
                                var datei = currentDate.addDays(i);
                                var dayi = datei.getFullYear() + '-' + (datei.getMonth()+1) + '-' + datei.getDate();

                                if(!agendaEvents.includes(dayi)) {
                                    agendaEvents.push(dayi);
                                    agendaEvents.sort();
                                }
                            }
                            agendaEvents = agendaEvents.slice(0, 3);

                            displayEvents();
                        }
                    });
                });
            });
        });
    } else {
        authorizeButton.style.display = 'block';
    }
}

(function($) {
    'use strict';

    var clockTick = function() {
        var currentDate = new Date();
        var hours = ("0" + currentDate.getHours()).slice(-2);
        var minutes = ("0" + currentDate.getMinutes()).slice(-2);
        $('.time').html(hours + ":" + minutes);

        var weekDays = ["Dim.", "Lun.", "Mar.", "Mer.", "Jeu.", "Ven.", "Sam."];
        var months = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet",
            "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

        $('.clock .weekday').html(weekDays[currentDate.getDay()]);
        $('.clock .day').html(("0" + currentDate.getDate()).slice(-2));
        $('.clock .month').html(months[currentDate.getMonth()]);
    };

    var weatherWidget = function() {
        db.ref('/profils/'+data.user+'/localisation').once('value').then(function(snapshot) {
            var data = snapshot.val();

            $('.weatherwidget-io-js, .weatherwidget-io-frame').remove();
            $('.weatherwidget-io').attr('data-label_1', data.ville.toUpperCase());

            var $script = $('<script></script>')
                .attr('id', 'weatherwidget-io-js')
                .attr('src', 'https://weatherwidget.io/js/widget.min.js');
            $('body').append($script);
        });
    };

    var openMap = function() { //Change with event from web socket
        $('#map').on('click', function() {
            $('.large-map-container').fadeIn(300);
        });
        $('.map-cancel').on('click', function() {
            $('.large-map-container').fadeOut(300);
        });
    };

    var nextTransports;
    var intervalID;
    var loadTransports = function() {
        var transports = db.ref('/profils/'+data.user+'/transports/commun/arrets/').once('value').then(function(snapshot) {
            $('.schedules-container').empty();
            nextTransports = [];

            var counter = 0;

            snapshot.val().forEach(function(item) {
                var stop_area = encodeURIComponent(item.arret);
                var ligne = item.direction.includes('_R') ? item.ligne + '_R' : item.ligne;
                var route = encodeURIComponent(ligne);

                var url = 'http://api.navitia.io/v1/coverage/fr-sw/routes/route%3A'+route+'/stop_areas/stop_area%3A'+stop_area+'/stop_schedules?';
                $.ajax({
                    url: url,
                    headers: {
                        Authorization: 'Basic ' + btoa('05d8f1d4-8189-4505-acdc-7cee1293d988')
                    },
                    success: function (data) {
                        //Get stop point info
                        var name = data.stop_schedules[0].stop_point.name;
                        var direction = 'Dir. ' + data.stop_schedules[0].route.direction.stop_area.name;
                        var code = data.stop_schedules[0].route.line.code;
                        var color = '#' + data.stop_schedules[0].route.line.color;

                        var $article = '<article class="schedule" data-name="'+name+'">' +
                            '<div class="number" data-color="'+color+'"><span>'+code+'</span></div>' +
                            '<h1>'+direction+'</h1>' +
                            '<p class="next-schedules"></p>' +
                            '</article>';

                        $('.schedules-container').append($article);

                        //Get schedule times
                        var times = data.stop_schedules[0].date_times;
                        // console.log(times);
                        var max = times.length > 2 ? 2 : times.length;
                        for (var i = 0; i < max; i++) {
                            var datetime = times[i].date_time;
                            var time = datetime.split('T')[1];
                            var hours = time.substr(0, 2);
                            var minutes = time.substr(2, 2);

                            if(!(counter in nextTransports))
                                nextTransports[counter] = {
                                    name: name,
                                    nextSchedules: []
                                };
                            nextTransports[counter].nextSchedules.push({
                                hours: hours,
                                minutes: minutes
                            });

                            colorTransports();
                        }

                        if(++counter == snapshot.val().filter(Boolean).length) {
                            displayTransportSchedules();

                            intervalID = setInterval(function() {
                                var refresh = displayTransportSchedules(true);
                                if(refresh) {
                                    clearInterval(intervalID);
                                    loadTransports();
                                }
                            }, 15*1000);
                        }
                    }
                });
            });
        });
    };

    var displayTransportSchedules = function(offset) {
        offset = offset | false;

        var refresh = false;
        for(var j = 0; j < nextTransports.length; j++) {

            for(var i = 0; i < nextTransports[j].nextSchedules.length; i++) {
                var date = new Date();
                var hours = nextTransports[j].nextSchedules[i].hours;
                var minutes = nextTransports[j].nextSchedules[i].minutes;
                var nextDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes);
                var diff = nextDate - date;

                var min = Math.trunc(diff / (60 * 1000));

                if(min <= 0)
                    min = '< 1';

                var nextTime = (i > 0) ? ' | ' + min + ' min' : min + ' min';

                var $nextSchedules = $('[data-name="'+nextTransports[j].name+'"]').find('.next-schedules');
                if(i == 0)
                    $nextSchedules.empty();


                if(diff < 30 * 1000) {
                    refresh = true;
                }

                $nextSchedules.append(nextTime);
            }
        }
        return refresh;
    };

    var colorTransports = function() {
        $('.schedules-container .schedule').each(function() {
            $(this).find('.number').css('background', $(this).find('.number').attr('data-color'));
        });
    };

    var initCalendar = function() {
        var $times = $('.calendar .content .times');
        $times.empty();
        for(var i = 7; i <= 23; i++) {
            var hour = ("0" + i).slice(-2) + ':00';
            var $p = $('<p></p>').text(hour);
            $times.append($p);
        }

        currentTimeAgenda();
    };

    var displayCalendar = function() {
        var $eventsTag = $('.calendar .content .events');
        var focusedDate = $eventsTag.attr('data-focused-date');

        $eventsTag.find('p').hide();
        var $events = $eventsTag.find('.day[data-date="' + focusedDate + '"] p');
        $events.each(function() {
            var $this = $(this);
            var color = $this.attr('data-color');
            var begin = $this.attr('data-begin-hour');
            var beginHour = begin.split(':')[0];
            var beginMin = begin.split(':')[1];
            var end = $this.attr('data-end-hour');
            var endHour = end.split(':')[0];
            var endMin = end.split(':')[1];

            var top = topFromTime(beginHour, beginMin) + 1; //+1 for space between events
            var bottom = topFromTime(endHour, endMin);
            var height = bottom - top - 1;

            var nbSuperposed = 0;
            var itemNumber = 0;

            $events.each(function() {
                var $event = $(this);
                if($event.is($this)) {
                    itemNumber = nbSuperposed;
                }

                var begin = $event.attr('data-begin-hour');
                var beginHour = begin.split(':')[0];
                var beginMin = begin.split(':')[1];
                var end = $event.attr('data-end-hour');
                var endHour = end.split(':')[0];
                var endMin = end.split(':')[1];

                var eventTop = topFromTime(beginHour, beginMin);
                var eventBottom = topFromTime(endHour, endMin);

                if(top >= eventTop && bottom <= eventBottom
                    || eventTop >= top && eventBottom <= bottom) {
                    nbSuperposed++;
                }
            });

            var width = 100 / nbSuperposed;
            var marginLeft = itemNumber * width;

            $this.css('background', color);
            $this.css('top', top);
            $this.css('height', height);
            $this.css('marginLeft', marginLeft + '%');
            $this.css('width', 'calc(' + width + '% - 1px)');//-1px for space between events
            $this.show();
        });
    };

    var currentTimeAgenda = function () {
        var $bar = $('.calendar .content .current-time');

        var date = new Date();
        var hours = date.getHours();
        var min = date.getMinutes();
        var top = topFromTime(hours, min);

        $bar.css('top', top);
    };

    var topFromTime = function(hours, min) {
        var top = 20 + (hours - 7) * 29; //10px at top + 29px per hour (it begins at 7am)
        top += min * 29 / 60; //Add minutes
        return top;
    };

    displayEvents = function() {
        var focusedId = 0;

        agendaFormatDay(agendaEvents[focusedId]);
        displayCalendar();

        var $leftBtn = $('.calendar .leftBtn');
        var $rightBtn = $('.calendar .rightBtn');

        $leftBtn.hide();
        if(agendaEvents.length <= 1)
            $rightBtn.hide();

        $('.clock .weekday').click(function() {
            if(--focusedId <= 0) {
                $leftBtn.hide();
                $rightBtn.show();
            }
            else {
                $leftBtn.show();
                $rightBtn.show();
            }

            agendaFormatDay(agendaEvents[focusedId]);
            displayCalendar();
        });
        $('.clock .month').click(function() {
            if(++focusedId >= agendaEvents.length - 1) {
                $leftBtn.show();
                $rightBtn.hide();
            }
            else {
                $leftBtn.show();
                $rightBtn.show();
            }

            agendaFormatDay(agendaEvents[focusedId]);
            displayCalendar();
        });
    };

    var agendaFormatDay = function(yymmdd) {
        var $eventsTag = $('.calendar .content .events');
        var weekDays = ["Dim.", "Lun.", "Mar.", "Mer.", "Jeu.", "Ven.", "Sam."];
        var months = ["Jan.", "Fév.", "Mars", "Avr.", "Mai", "Juin", "Juil.", "Août", "Sept.", "Oct.", "Nov.", "Déc."];

        var date = new Date(yymmdd);
        var weekDay = weekDays[date.getDay()];
        var number = ("0" + date.getDate()).slice(-2);
        var month = months[date.getMonth()];

        $('.calendar .titles h1').text(weekDay + ' ' + number + ' ' + month);
        $eventsTag.attr('data-focused-date', yymmdd);

        var currentDate = new Date();
        var currentNumber = ("0" + currentDate.getDate()).slice(-2);
        var currentMonth = months[currentDate.getMonth()];

        var $bar = $('.calendar .current-time');
        if(currentNumber == number && currentMonth == month)
            $bar.show();
        else
            $bar.hide();
    };

    var facialRecognition = function() {
        var $h1 = $('.loading h1');
        $h1.text('Reconnaissance faciale en cours...');
        $('.loading').show();

        // ws = new WebSocket("ws://192.168.1.80:7000/");
        var ws = new WebSocket("ws://169.254.132.122:8000/");

        // Set event handlers.
        ws.onopen = function() {
            console.log("Opened connection facial server");

            //Ask for facial recognition
            ws.send('launch_recognition');
        };

        ws.onmessage = function(e) {
            // e.data contains received string.
            console.log("Received: " + e.data);
            if(e.data == 'no-face') {
                $h1.text('Aucun visage détecté');

                //Try again after 5s
                setTimeout(function() {
                    $h1.text('Reconnaissance faciale en cours...');
                    ws.send('launch_recognition');
                }, 5 * 1000);
            }
            else if(e.data == 'not-recognized') {
                $h1.text('Visage non reconnu');

                //Try again after 5s
                setTimeout(function () {
                    $h1.text('Reconnaissance faciale en cours...');
                    ws.send('launch_recognition');
                }, 5 * 1000);
            }
            else {
                console.log('Continue script');
                $('.loading').fadeOut(300);
                ws.close();
                data.user = parseInt(e.data);
            }
            $('.loading').fadeOut(300);
            var $largeMapContainer = $('.large-map-container');
            $largeMapContainer.fadeOut(300);
            ws.close();
            // data.user = parseInt(e.data);
        };

        ws.onclose = function() {
            console.log("Closed connection");
            if(!WSServer_Voice)
                voiceRecognition();
        };

        ws.onerror = function(e) {
            console.log('Error: ' + e);
        };
    };

    var WSServer_Voice;

    var voiceRecognition = function() {
        WSServer_Voice = new WebSocket("ws://127.0.0.1:7000/");

        // Set event handlers.
        WSServer_Voice.onopen = function() {
            console.log("Opened connection voice server");

            //Ask for facial recognition
            WSServer_Voice.send('launch_recognition');
        };

        WSServer_Voice.onmessage = function(e) {
            var $leftBtn = $('.calendar .leftBtn');
            var $rightBtn = $('.calendar .rightBtn');
            var $largeMapContainer = $('.large-map-container');

            // e.data contains received string.
            console.log("Received: " + e.data);
            if(e.data == 'aujourd_hui') {
                agendaFormatDay(agendaEvents[0]);
            }
            else if(e.data == 'trafic') {
                $largeMapContainer.fadeIn(300);
            }
            else if(e.data == 'fermer') {
                $largeMapContainer.fadeOut(300);
            }
            else if(e.data == 'jour_precedent') {
                if(focusedId - 1 >= 0) {
                    if (--focusedId == 0) {
                        $leftBtn.hide();
                        $rightBtn.show();
                    }
                    else {
                        $leftBtn.show();
                        $rightBtn.show();
                    }
                    agendaFormatDay(agendaEvents[focusedId]);
                    displayCalendar();
                }
            }
            else if(e.data == 'jour_suivant') {
                if(focusedId + 1 <= agendaEvents.length - 1) {
                    if (++focusedId >= agendaEvents.length - 1) {
                        $leftBtn.show();
                        $rightBtn.hide();
                    }
                    else {
                        $leftBtn.show();
                        $rightBtn.show();
                    }

                    agendaFormatDay(agendaEvents[focusedId]);
                    displayCalendar();
                }
            }

        };

        WSServer_Voice.onclose = function() {
            console.log("Closed connection");
        };

        WSServer_Voice.onerror = function(e) {
            console.log('Error: ' + e);
        };
    };

    var launch = function() {
        $('.blackout .content').fadeOut(300);
        var ws = new WebSocket("ws://127.0.0.1:7070/");

        // Set event handlers.
        ws.onopen = function() {
            console.log("Opened connection sonic server");
        };

        ws.onmessage = function(e) {
            // e.data contains received string.
            console.log("Received: " + e.data);
            if(e.data == 'start') {
                awake();
            }
            else if(e.data == 'shutdown') {
                shutdown();
            }
        };

        ws.onclose = function() {
            console.log("Closed connection");
        };

        ws.onerror = function(e) {
            console.log('Error: ' + e);
        };
    };

    var clockInterval;
    var weatherInterval;
    var agendaInterval;

    var awake = function() {
        facialRecognition();

        clockTick();
        clockInterval = setInterval(clockTick, 30 * 1000); //Every 30s

        weatherWidget();
        weatherInterval = setInterval(weatherWidget, 30 * 60 * 1000); //Every 30min

        openMap();

        loadTransports();

        initCalendar();
        agendaInterval = setInterval(currentTimeAgenda, 2 * 60 * 1000); //Every 2min

        $('.blackout').fadeOut(300);
    };

    var shutdown = function() {
        $('.blackout').fadeIn(300);

        clearInterval(clockInterval);
        clearInterval(weatherInterval);
        clearInterval(agendaInterval);
    };

    var testLaunch = function() {
        $('.blackout').hide();
        $('.loading').hide();

        initCalendar();
        agendaInterval = setInterval(currentTimeAgenda, 2 * 60 * 1000); //Every 2min

    };

    $(document).ready(function() {
        setTimeout(launch, 30 * 1000);
        // testLaunch();
    });

})(jQuery);

var resetData = function() {
    firebase.database().ref('profils/' + 1).set({
        'comptesGoogle': {
            '1': {
                'adresse': 'fmonniot@ensc.fr',
                'agendas': {
                    '1': 'fmonniot@ensc.fr',
                    '2': '9e3ntiluk6e3ljj950i3a2663fd8nr7s@import.calendar.google.com'
                }
            },
            '2': {
                'adresse': 'fab.monniot@gmail.com',
                'agendas': {
                    '1': 'fab.monniot@gmail.com',
                    '2': 'iplaa9979qbjukd62cs273c03s@group.calendar.google.com'
                }
            }
        },
        'localisation': {
            'geolocalisation': 'false',
            'cp': '33600',
            'ville': 'Pessac'
        },
        'transports': {
            'voiture': {
                'lat': 44.8005254,
                'lng': -0.6040306,
                'zoom': 12,
                'active': 'true'
            },
            'commun': {
                'active': 'true',
                'arrets': {
                    '1': {
                        'type': 'bus',
                        'arret': 'OBO:SA:BARDAN',
                        'ligne': 'OBO:10',
                        'direction': 'OBO:10'
                    },
                    '2': {
                        'type': 'bus',
                        'arret': 'OBX:SA:DOYEN',
                        'ligne': 'OBX:60',
                        'direction': 'OBX:60'
                    }
                }
            }
        },
        'agendas': 'true'
    });
};
// resetData();