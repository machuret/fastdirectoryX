
    var map = L.map('map', {
        center: [48.863893, 2.342348],//Center map
        minZoom: 2,
        zoom: 13
    });

    L.tileLayer( 'https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
     attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a>',
     tileSize: 512,
     maxZoom: 18,
     zoomOffset: -1,
     id: 'mapbox/streets-v11', 
     accessToken: '',// Your Mapbox Access Token
     subdomains: ['a','b','c']
    }).addTo( map );

    //Single point data
    var markers = [

      {
        "id":3,
        "type_point":"Hotel",
        "location_latitude":48.865633,
        "location_longitude":2.321236,
        "map_image_url":"img/thumb_map_single_hotel.jpg",
        "rate":"Superb | 7.5",
        "name_point":"Mariott Hotel",
        "get_directions_start_address":"",
        "phone":"+3934245255"
      }
    ];

    var myIcon = L.icon({
        iconUrl: 'img/pins/Marker.png',
        iconRetinaUrl: 'img/pins/Marker.png',
        iconSize: [30, 42],
        iconAnchor: [9, 21],
        popupAnchor: [6, -15]
    });

    var markerClusters = L.markerClusterGroup({
        polygonOptions: {
            opacity: 0,
            fillOpacity: 0
        }
    });

    for (var i = 0; i < markers.length; ++i) {
        var popup =
            '<img src="' + markers[i].map_image_url + '" alt=""/>' +
            '<span>' +
            '<span class="infobox_rate">' + markers[i].rate + '</span>' +
            '<em>' + markers[i].type_point + '</em>' +
            '<h3>' + markers[i].name_point + '</h3>' +
            '<form action="https://maps.google.com/maps" method="get" target="_blank"><input name="saddr" value="' + markers[i].get_directions_start_address + '" type="hidden"><input type="hidden" name="daddr" value="' + markers[i].location_latitude + ',' + markers[i].location_longitude + '"><button type="submit" value="Get directions" class="btn_infobox_get_directions">Get directions</button></form>' +
            '<a href="tel://' + markers[i].phone + '" class="btn_infobox_phone">' + markers[i].phone + '</a>' +
            '</span>';

        var m = L.marker([markers[i].location_latitude, markers[i].location_longitude], { id: markers[i].id, icon: myIcon }).bindPopup(popup);

        markerClusters.addLayer(m);
    }

    map.addLayer(markerClusters);

    //Link on the same page
    var classname = document.getElementsByClassName("address");

    var openMarkerPopup = function() {
        var id = this.getAttribute("data-id");
        markerClusters.eachLayer(function(layer) {
            if (layer.options.id && layer.options.id == id) {
                if (!layer._icon) layer.__parent.spiderfy();
                layer.openPopup();
            }
        });
    };

    for (var i = 0; i < classname.length; i++) {
        classname[i].addEventListener('click', openMarkerPopup, false);
    }


