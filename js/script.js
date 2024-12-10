// script.js

// ===============================
// SKCET Campus Navigator
// ===============================

/*
 * This script initializes the Leaflet map centered on SKCET Coimbatore,
 * outlines the campus boundaries with a polygon, adds custom markers for various locations,
 * tracks the user's real-time location, and provides navigation routes from the user's
 * location to searched destinations through the campus entrance.
 */

// ===============================
// 1. Map Initialization
// ===============================

// Accurate SKCET Coimbatore coordinates
const campusCoordinates = [10.93919538852309, 76.95196394531337];

// Initialize the map centered on SKCET Coimbatore
const map = L.map('map').setView(campusCoordinates, 18); // Zoom level 18 for detailed campus view

// Add OpenStreetMap tiles as the base layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// ===============================
// 2. Define Campus Boundary as a Polygon
// ===============================

// Array of [latitude, longitude] pairs defining the campus boundary
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

// Create a polygon to outline the campus boundary
const campusBoundary = L.polygon(campusBoundaryCoordinates, {
    color: "#ff7800",        // Border color
    weight: 2,               // Border thickness
    fillOpacity: 0.1         // Fill transparency
}).addTo(map)
  .bindPopup("SKCET Coimbatore Campus Boundary");

// ===============================
// 3. Define Entrance Coordinate
// ===============================

// The single entrance coordinate
const entranceCoordinate = [10.93907701406342, 76.95194231481806];

// Optionally, add a marker for the entrance
const entranceMarker = L.marker(entranceCoordinate, {
    icon: L.icon({
        iconUrl: '../assets/entrance.png', // Ensure you have an 'entrance.png' icon in assets
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30]
    })
}).addTo(map)
  .bindPopup("<b>Entrance</b><br>This is the main entrance.");

// ===============================
// 4. Custom Icons for Different Location Types
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

let userMarker = null;       // To store the user's current location marker
let routingControl = null;   // To store the routing control

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
// 8. Function to Handle Search Functionality
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
            // If user location is available, set it as the start point
            if (userMarker) {
                const userCoords = userMarker.getLatLng();
                plotRoute(userCoords, [found.latitude, found.longitude]);
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
// 9. Function to Plot a Route Through Entrance
// ===============================

/**
 * Plots a route from the start point to the end point via the entrance.
 * @param {Object} start - The starting point with 'lat' and 'lng' properties.
 * @param {Array} end - The ending point as [latitude, longitude].
 */
function plotRoute(start, end) {
    if (routingControl) {
        map.removeControl(routingControl);
    }

    // Define the entrance as an intermediate waypoint
    const entrance = L.latLng(entranceCoordinate[0], entranceCoordinate[1]);

    routingControl = L.Routing.control({
        waypoints: [
            L.latLng(start.lat, start.lng), // Start
            entrance,                        // Entrance
            L.latLng(end[0], end[1])         // End
        ],
        lineOptions: {
            styles: [{ color: '#6FA1EC', weight: 4 }]
        },
        addWaypoints: false,
        draggableWaypoints: false,
        fitSelectedRoutes: true,
        show: true,
        routeWhileDragging: false
    }).addTo(map);
}

// ===============================
// 10. Function to Handle Real-Time User Location Tracking
// ===============================

/**
 * Tracks the user's real-time location and updates the map accordingly.
 */
function trackUserLocation() {
    if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser.');
        return;
    }

    // Options for geolocation
    const options = {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 27000
    };

    // Success callback
    function success(position) {
        const latitude  = position.coords.latitude;
        const longitude = position.coords.longitude;
        const accuracy = position.coords.accuracy;

        console.log(`User's current position: [${latitude}, ${longitude}] with accuracy ${accuracy} meters.`);

        // If user marker doesn't exist, create it
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

            // Optionally, set the map view to the user's location
            map.setView([latitude, longitude], 17);
        } else {
            // Update the user's marker position
            userMarker.setLatLng([latitude, longitude]);
        }
    }

    // Error callback
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

    // Start watching the user's position
    navigator.geolocation.watchPosition(success, error, options);
}

// ===============================
// 11. Function to Handle the "Locate Me" Button
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
            // The location will be updated via watchPosition
        }
    });
}

// ===============================
// 12. Initialization Function
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
}

// Run the initialization function when the page loads
window.onload = init;
