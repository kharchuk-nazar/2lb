
function initMap() {
    const map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 49.2, lng: 28.3},
    zoom: 8,
    getMapBbox() {
        const ne = map.getBounds().getNorthEast();
        const sw = map.getBounds().getSouthWest();
    
        return [ne.lng(), sw.lat(), sw.lng(), ne.lat()];
        }
    })

    let downloadedCities = [];

    google.maps.event.addListener(
        map,
        "bounds_changed",() => {
            fetch(`http://api.openweathermap.org/data/2.5/box/city?appid=f3af041cded238a3bf55baee85f2b170&bbox=${map.getMapBbox()}`)
            .then(function(response) {
                response.json().then(function(data) {
                  if (data.list) {
                      if (!downloadedCities.includes(data.list[0].name)) {
                        fetch(`http://api.openweathermap.org/data/2.5/weather?q=${data.list[0].name}&appid=f3af041cded238a3bf55baee85f2b170`)
                        .then(function(res) {
                            res.json().then(function(info) {
                                getMarker(data.list[0].coord.Lat, data.list[0].coord.Lon, map, info);
                            })
                        })
                      }
                  }

                  downloadedCities.push(data.list[0].name);
                });
              });
        })
    
}

function getMarker(lat, lng, map, info) {
    let point = new google.maps.LatLng(lat, lng);
    const coordInfoWindow = new google.maps.InfoWindow();
    coordInfoWindow.setContent(createInfoWindowContent(point, map.getZoom(), info));
    coordInfoWindow.setPosition(point);
    coordInfoWindow.open(map);
    // map.addListener("zoom_changed", () => {
    //     coordInfoWindow.setContent(createInfoWindowContent(point, map.getZoom(), info));
    //     coordInfoWindow.open(map);
    // });
}

const TILE_SIZE = 256;

function createInfoWindowContent(latLng, zoom, info) {
  const scale = 1 << zoom;
  const worldCoordinate = project(latLng);
  const pixelCoordinate = new google.maps.Point(
    Math.floor(worldCoordinate.x * scale),
    Math.floor(worldCoordinate.y * scale)
  );
  const tileCoordinate = new google.maps.Point(
    Math.floor((worldCoordinate.x * scale) / TILE_SIZE),
    Math.floor((worldCoordinate.y * scale) / TILE_SIZE)
  );
  return [
    `<span class="weather_city">${info.name}</span>`,
    `<span class="weather_description">${info.weather[0].description}</span>`,
    `<span class="weather_main">${info.weather[0].main}</span>`,
    `<img class="weather_img" src="http://openweathermap.org/img/wn/${info.weather[0].icon}@2x.png">`
  ].join("<br>");
}

// The mapping between latitude, longitude and pixels is defined by the web
// mercator projection.
function project(latLng) {
  let siny = Math.sin((latLng.lat() * Math.PI) / 180);
  // Truncating to 0.9999 effectively limits latitude to 89.189. This is
  // about a third of a tile past the edge of the world tile.
  siny = Math.min(Math.max(siny, -0.9999), 0.9999);
  return new google.maps.Point(
    TILE_SIZE * (0.5 + latLng.lng() / 360),
    TILE_SIZE * (0.5 - Math.log((1 + siny) / (1 - siny)) / (4 * Math.PI))
  );
}



