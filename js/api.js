'use strict';

var category = null;
var search = null;

var API = 'https://newsapi.org/v2/';
var ENDPOINT_HEADLINES = 'top-headlines?';
var ENDPOINT_EVERYTHING = 'everything?';
var API_KEY = 'apiKey=a6b95b76dfa34a668b6697153482ea7b';
var COUNTRY = 'us';
var MAPS_API = 'https://maps.googleapis.com/maps/api/geocode/json?latlng='

var lowSpeed = false;

$(document).ready(function () {
    $('.sidenav').sidenav();
})

function getNews() {
    var url = API + ENDPOINT_HEADLINES + 'country=' + COUNTRY + '&' + API_KEY + getCategory();
    $.get(url, success);
}

function getNewsWithSearch() {
    var url = API + ENDPOINT_EVERYTHING + API_KEY + getSearch();
    $.get(url, success);
}

function success(data) {
    var divNews = $('#news');
    divNews.empty();
    for (var i = 0; i < data.articles.length; i += 2) {
        divNews.append(
            $('<div>').addClass('row')
                .append(
                    getNewsHtml(data.articles[i]),
                    getNewsHtml(data.articles[i + 1])
                )
        )
    }
    lazyload();
}

$(".headline").click(function () {
    category = null;
    activeMenu($(this));
});
$(".health").click(function () {
    category = 'health';
    activeMenu($(this));
});
$(".sports").click(function () {
    category = 'sports';
    activeMenu($(this));
});
$(".entertainment").click(function () {
    category = 'entertainment';
    activeMenu($(this));
});
$(".technology").click(function () {
    category = 'technology';
    activeMenu($(this));
});
$("#search").keypress(function (ev) {
    console.log('search')
    if (ev.which == 13) {
        search = $(this).val();
        if (search) {
            getNewsWithSearch();
        } else {
            getNews();
        }
    }
});

$("#nav-search-bt").click(function () {
    $("#search-bar").show();
    $("#top-bar").hide();
    $("#search-label").click();
});

$("#close-search-bt").click(function () {
    $("#search-bar").hide();
    $("#top-bar").show();
});

function activeMenu(menu) {
    search = null;
    $("#search").val('');
    getNews();
    $('html, body').animate({ scrollTop: 0 });
}

function getCategory() {
    if (category) {
        return '&category=' + category
    }
    return '';
}

function getSearch() {
    if (search) {
        return '&q=' + search
    }
    return '';
}

function getNewsHtml(article) {
    return $('<div>').addClass('col s12 m6 l12 xl6')
        .append(
            $('<div>').addClass('card')
                .append(
                    $('<div>').addClass('card-image')
                        .append(
                            $('<img>')
                                .addClass('lazyload')
                                .attr('src', 'images/placeholder-image.png')
                                .attr('data-src', !lowSpeed ? article.urlToImage : 'images/placeholder-image.png')
                                .attr('alt', article.title)
                        ),
                    $('<div>').addClass('card-stacked')
                        .append(
                            $('<div>').addClass('card-content')
                                .append(
                                    $('<span>').append(moment(article.publishedAt).fromNow()),
                                    $('<span>').addClass('card-title').append(article.title),
                                    $('<p>').append(article.description)
                                ),
                            $('<div>').addClass('card-action')
                                .append(
                                    $('<a>').attr('href', article.url).append('Read article').attr('target', '_blank').attr('rel', 'noopener')
                                )
                        )

                )
        )
}

// ------- INSTALL PROMPT -------

var deferredPrompt;
var btInstall = $('.bt-install');

window.addEventListener('beforeinstallprompt', function (e) {
    console.log('beforeinstallprompt Event fired');
    e.preventDefault();

    btInstall.show();

    M.toast({ html: 'Clique no botão de download para instalar a aplicação', classes: 'rounded' })

    deferredPrompt = e;

    return false;
});

btInstall.click(function () {
    if (deferredPrompt !== undefined) {
        deferredPrompt.prompt();

        deferredPrompt.userChoice.then(function (choiceResult) {

            console.log(choiceResult.outcome);

            if (choiceResult.outcome == 'accepted') {
                console.log('User added to home screen');
            } else {
                console.log('User cancelled home screen install');
            }

            deferredPrompt = null;
            btInstall.hide();
        });
    }
});

// ------- NOTIFICATIONS -------

var permissionNotification;
var btAlert = $('#bt-alert');

if ('Notification' in window) {
    permissionNotification = Notification.permission;

    if (permissionNotification === 'default') {
        btAlert.show();
    }

    btAlert.click(function () {
        Notification.requestPermission().then(function (result) {
            if (result === 'denied') {
                console.log('Permission wasn\'t granted. Allow a retry.');
                btAlert.hide();
                return;
            }
            if (result === 'default') {
                console.log('The permission request was dismissed.');
                return;
            }
            navigator.serviceWorker.ready.then(function (registration) {
                registration.showNotification('PWA News', {
                    body: 'Push notification',
                    icon: 'images/icons/android-chrome-192x192.png',
                    badge: 'images/icons/favicon-32x32.png',
                    vibrate: [500]
                });
            });
            btAlert.hide();
        });
    })
}

// ------- GEOLOCATION -------
var btPosition = $('#bt-position');

function getCountry(lat, lng) {
    var url = MAPS_API + lat + ',' + lng + '&key=AIzaSyAWqgQLs97DDCekTKGztK3IVwvRRlY8M0s';
    $.get(url, function (data) {
        data.results.forEach(element => {
            if (element.types[0] === 'country') {
                var result = element.address_components[0].short_name;
                console.log(result);
                COUNTRY = result;
            }
        });
        getNews();
    });
}

if ('geolocation' in navigator) {
    navigator.permissions.query({ name: 'geolocation' }).then(function (result) {
        if (result.state === 'granted') {
            getPosition();
        } else {
            getNews();
            btPosition.show();
        }
    });
} else {
    console.log('Geolocation API not supported');
}

function getPosition() {
    navigator.geolocation.getCurrentPosition(function (location) {
        console.log('location: ', location.coords);
        getCountry(location.coords.latitude, location.coords.longitude);
        btPosition.hide();
    });
}

btPosition.click(function () {
    getPosition();
})

// ------- NETWORK TYPE -------

function getConnection() {
    return navigator.connection || navigator.mozConnection ||
        navigator.webkitConnection || navigator.msConnection;
}

function updateNetworkInfo(info) {
    lowSpeed = info.effectiveType === 'slow-2g' || info.effectiveType === '2g';
}

var info = getConnection();
if (info) {
    info.addEventListener('change', updateNetworkInfo);
    updateNetworkInfo(info);
}