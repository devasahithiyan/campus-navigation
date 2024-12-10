// script.js

// ===============================
// SKCET Campus Navigator
// ===============================

/*
 * Initializes the Leaflet map, adds markers, handles search and routing,
 * and manages a responsive routing interface for mobile devices.
 */

// ===============================
// 1. Map Initialization
// ===============================

const campusCoordinates = [10.93919538852309, 76.95196394531337];
const map = L.map('map').setView(campusCoordinates, 18);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// ===============================
// 2. Campus Boundary
// ===============================

const campusBoundaryCoordinates = [
    [10.939331725891414, 76.95205903546925],
    [10.939055866893337, 76.95308789800902],
    [10.939630544946676, 76.95306079532992],
    [10.939598048892918, 76.95378119830995],
    [10.940424920946983, 76.9592264986683],
    [10.940357415537871, 76.96153827892148],
    [10.939542121672872, 76.96223146685901],
    [10.938165598173267, 76.9611846762704],
    [10.937028960023444, 76.96123168565343],
    [10.93668258014344, 76.9593048667002],
    [10.936229950897822, 76.95789886778405],
    [10.935378332103664, 76.95628827843488],
    [10.935105075764154, 76.95560946477508],
    [10.936377172501746, 76.95523648278866],
    [10.936548582643336, 76.9540699865162],
    [10.937896501932816, 76.95409941418289],
    [10.93821812423961, 76.95290865701922],
    [10.938410133790912, 76.9517571780754],
    [10.939331725891414, 76.95205903546925] // Closing the polygon by repeating the first coordinate
];

L.polygon(campusBoundaryCoordinates, {
    color: "#ff7800",
    weight: 2,
    fillOpacity: 0.1
}).addTo(map)
  .bindPopup("SKCET Coimbatore Campus Boundary");

// ===============================
// 3. Entrance Marker
// ===============================

const entranceCoordinate = [10.93907701406342, 76.95194231481806];

L.marker(entranceCoordinate, {
    icon: L.icon({
        iconUrl: '../assets/entrance.png', // Ensure this path is correct
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30]
    })
}).addTo(map)
  .bindPopup("<b>Entrance</b><br>This is the main entrance.");

// ===============================
// 4. Custom Icons
// ===============================

const icons = {
    Library: L.icon({
        iconUrl: '../assets/library.png',
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30]
    }),
    Academic: L.icon({
        iconUrl: '../assets/academic.png',
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30]
    }),
    Food: L.icon({
        iconUrl: '../assets/food.png',
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30]
    }),
    Accommodation: L.icon({
        iconUrl: '../assets/accommodation.png',
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30]
    }),
    Recreation: L.icon({
        iconUrl: '../assets/recreation.png',
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30]
    }),
    Default: L.icon({
        iconUrl: '../assets/default.png',
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30]
    })
};

// ===============================
// 5. Variables to Store User Location and Routing Control
// ===============================

let userMarker = null;
let routingControl = null;

// ===============================
// 6. Function to Load Locations from JSON
// ===============================

/**
 * Fetches location data from the 'locations.json' file.
 * @returns {Promise<Array>} An array of location objects.
 */
async function loadLocations() {
    try {
        const response = await fetch('data/locations.json');
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const locations = await response.json();
        console.log('Locations loaded:', locations);
        return locations;
    } catch (error) {
        console.error('Error loading locations:', error);
        return [];
    }
}

// ===============================
// 7. Function to Add Markers to the Map
// ===============================

/**
 * Adds markers to the map based on the provided locations.
 * @param {Object} map - The Leaflet map instance.
 * @param {Array} locations - An array of location objects.
 */
function addMarkers(map, locations) {
    locations.forEach(location => {
        const icon = icons[location.type] || icons['Default']; // Use default icon if type not found
        const marker = L.marker([location.latitude, location.longitude], { icon: icon }).addTo(map);
        marker.bindPopup(`<b>${location.name}</b><br>Type: ${location.type}`);
    });
}

// ===============================
// 8. User Location Tracking
// ===============================

/**
 * Tracks the user's real-time location and updates the map accordingly.
 */
function trackUserLocation() {
    if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser.');
        return;
    }

    const options = {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 27000
    };

    function success(position) {
        const latitude  = position.coords.latitude;
        const longitude = position.coords.longitude;
        const accuracy = position.coords.accuracy;

        console.log(`User's current position: [${latitude}, ${longitude}] with accuracy ${accuracy} meters.`);

        if (!userMarker) {
            userMarker = L.marker([latitude, longitude], { 
                icon: L.icon({
                    iconUrl: '../assets/user-location.png', // Ensure this path is correct
                    iconSize: [30, 30],
                    iconAnchor: [15, 30],
                    popupAnchor: [0, -30]
                }),
                title: 'Your Location'
            }).addTo(map)
              .bindPopup('You are here.')
              .openPopup();

            map.setView([latitude, longitude], 17);
        } else {
            userMarker.setLatLng([latitude, longitude]);
        }
    }

    function error(err) {
        console.warn(`ERROR(${err.code}): ${err.message}`);
        switch(err.code) {
            case err.PERMISSION_DENIED:
                alert("Permission denied. Unable to access your location.");
                break;
            case err.POSITION_UNAVAILABLE:
                alert("Position unavailable. Please check your network or GPS.");
                break;
            case err.TIMEOUT:
                alert("Geolocation request timed out. Please try again.");
                break;
            default:
                alert("An unknown error occurred.");
                break;
        }
    }

    navigator.geolocation.watchPosition(success, error, options);
}

// ===============================
// 9. Locate Me Button
// ===============================

/**
 * Centers the map on the user's current location when the "Locate Me" button is clicked.
 */
function handleLocateButton() {
    const locateButton = document.getElementById('locate-button');

    locateButton.addEventListener('click', () => {
        if (userMarker) {
            map.setView(userMarker.getLatLng(), 17);
            userMarker.openPopup();
        } else {
            alert('Fetching your location...');
        }
    });
}

// ===============================
// 10. Geocoding Function
// ===============================

/**
 * Geocodes a location name to latitude and longitude using Nominatim.
 * @param {string} location - The name/address of the location to geocode.
 * @returns {Promise<Object|null>} A promise that resolves to an object with 'lat' and 'lng', or null if not found.
 */
async function geocodeLocation(location) {
    const encodedLocation = encodeURIComponent(location);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedLocation}`;

    try {
        const response = await fetch(url, {
            headers: {
                'Accept-Language': 'en',
                'User-Agent': 'SKCET-Campus-Navigator/1.0' // Nominatim requires a valid User-Agent
            }
        });
        const data = await response.json();

        if (data && data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon)
            };
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error geocoding location:', error);
        return null;
    }
}

// ===============================
// 11. Handle Search Functionality
// ===============================

/**
 * Handles the search functionality, allowing users to search for locations.
 * Routes will always pass through the entrance.
 * @param {Object} map - The Leaflet map instance.
 * @param {Array} locations - An array of location objects.
 */
function handleSearch(map, locations) {
    const searchButton = document.getElementById('search-button');
    const searchInput = document.getElementById('search-input');

    // Initialize Awesomplete for autocomplete (Optional Enhancement)
    // Ensure Awesomplete CSS and JS are included in index.html
    if (typeof Awesomplete !== 'undefined') {
        const list = locations.map(loc => loc.name);
        new Awesomplete(searchInput, {
            list: list,
            minChars: 1,
            maxItems: 10,
            autoFirst: true
        });
    }

    searchButton.addEventListener('click', () => {
        const query = searchInput.value.trim().toLowerCase();
        if (query === '') {
            alert('Please enter a location to search.');
            return;
        }

        // Find the location that matches the query
        const found = locations.find(loc => loc.name.toLowerCase() === query);

        if (found) {
            if (userMarker) {
                const userCoords = userMarker.getLatLng();

                // If user's location is the entrance, plot route directly to destination
                if (userCoords.lat === entranceCoordinate[0] && userCoords.lng === entranceCoordinate[1]) {
                    plotRoute(entranceCoordinate, [found.latitude, found.longitude]);
                } else {
                    plotRoute(userCoords, [found.latitude, found.longitude]);
                }
            } else {
                // Center the map on the found location
                map.setView([found.latitude, found.longitude], 18);

                // Open a popup at the found location
                L.popup()
                    .setLatLng([found.latitude, found.longitude])
                    .setContent(`<b>${found.name}</b><br>Type: ${found.type}`)
                    .openOn(map);
            }
        } else {
            alert('Location not found! Please check the spelling or try a different search term.');
        }
    });

    // Allow pressing Enter to trigger the search
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchButton.click();
        }
    });
}

// ===============================
// 12. Routing Panel for Mobile
// ===============================

/**
 * Toggles the visibility of the routing panel on mobile devices.
 */
function setupRoutingPanel() {
    const routingButton = document.getElementById('routing-button');
    const routingPanel = document.getElementById('routing-panel');
    const routeButton = document.getElementById('route-button');
    const startInput = document.getElementById('start-input');
    const endInput = document.getElementById('end-input');

    // Show the routing button on mobile
    routingButton.classList.remove('hidden');

    // Toggle the routing panel when the button is clicked
    routingButton.addEventListener('click', () => {
        routingPanel.classList.toggle('active');
    });

    // Handle the route button click
    routeButton.addEventListener('click', () => {
        const startQuery = startInput.value.trim();
        const endQuery = endInput.value.trim();

        if (endQuery === '') {
            alert('Please enter an end location.');
            return;
        }

        if (startQuery === '' && userMarker) {
            const userCoords = userMarker.getLatLng();
            geocodeLocation(endQuery)
                .then(endCoords => {
                    if (endCoords) {
                        plotRoute(userCoords, endCoords);
                        routingPanel.classList.remove('active'); // Hide the panel after routing
                    } else {
                        alert('End location could not be found.');
                    }
                })
                .catch(error => {
                    console.error('Geocoding error:', error);
                    alert('An error occurred while geocoding the end location.');
                });
        } else if (startQuery !== '' && endQuery !== '') {
            // Geocode both start and end locations
            Promise.all([geocodeLocation(startQuery), geocodeLocation(endQuery)])
                .then(([startCoords, endCoords]) => {
                    if (startCoords && endCoords) {
                        plotRoute(startCoords, endCoords);
                        routingPanel.classList.remove('active'); // Hide the panel after routing
                    } else {
                        alert('One or both locations could not be found.');
                    }
                })
                .catch(error => {
                    console.error('Geocoding error:', error);
                    alert('An error occurred while geocoding the locations.');
                });
        } else {
            alert('Please enter both start and end locations.');
        }
    });
}

/**
 * Initializes the custom routing panel for mobile devices.
 */
function initializeRoutingPanel() {
    // Detect if the device is mobile based on screen width
    const isMobile = window.matchMedia("(max-width: 768px)").matches;

    if (isMobile) {
        setupRoutingPanel();
    }
}

// ===============================
// 13. Function to Plot a Route Through Entrance
// ===============================

/**
 * Plots a route from the start point to the end point via the entrance.
 * @param {Object} start - The starting point with 'lat' and 'lng' properties.
 * @param {Array|Object} end - The ending point as [latitude, longitude] or {lat, lng}.
 */
function plotRoute(start, end) {
    console.log("Initiating route calculation.");

    if (routingControl) {
        map.removeControl(routingControl);
    }

    // Define the entrance as an intermediate waypoint
    const entrance = L.latLng(entranceCoordinate[0], entranceCoordinate[1]);

    // Initialize waypoints
    let waypoints = [];

    // If start is not the entrance, add it
    if (!(start.lat === entrance.lat && start.lng === entrance.lng)) {
        waypoints.push(L.latLng(start.lat, start.lng));
    }

    // Add entrance
    waypoints.push(entrance);

    // Determine end coordinates
    let endCoords;
    if (Array.isArray(end)) {
        endCoords = L.latLng(end[0], end[1]);
    } else {
        endCoords = L.latLng(end.lat, end.lng);
    }

    // Add end waypoint
    waypoints.push(endCoords);

    routingControl = L.Routing.control({
        waypoints: waypoints,
        lineOptions: {
            styles: [{ color: '#6FA1EC', weight: 4 }]
        },
        addWaypoints: false,
        draggableWaypoints: false,
        fitSelectedRoutes: true,
        show: true,
        routeWhileDragging: false
    }).addTo(map);

    // Listen for routing events to handle success or error
    routingControl.on('routesfound', function(e) {
        console.log("Route found.");
    });

    routingControl.on('routingerror', function(e) {
        console.log("Routing error.");
        alert("An error occurred while calculating the route.");
    });
}

// ===============================
// 14. Load Custom Road GeoJSON
// ===============================

/**
 * Loads the custom road GeoJSON and adds it to the map.
 */
async function loadCustomRoads() {
    try {
        const response = await fetch('data/custom_road.geojson');
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const geojsonData = await response.json();
        L.geoJSON(geojsonData, {
            style: {
                color: "red",      // Color of the custom road
                weight: 4          // Thickness of the road line
            },
            onEachFeature: function (feature, layer) {
                if (feature.properties && feature.properties.name) {
                    layer.bindPopup(`<b>${feature.properties.name}</b>`);
                }
            }
        }).addTo(map);
    } catch (error) {
        console.error('Error loading custom roads:', error);
    }
}

// ===============================
// 15. Initialization Function
// ===============================

/**
 * Initializes the SKCET Campus Navigator application.
 */
async function init() {
    const locations = await loadLocations();
    addMarkers(map, locations);
    handleSearch(map, locations);
    trackUserLocation();
    handleLocateButton();
    await loadCustomRoads(); // Load custom roads after other initializations
    initializeRoutingPanel(); // Initialize the custom routing panel
}

window.onload = init;
