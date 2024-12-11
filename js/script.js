// script.js

// ===============================
// SKCET Campus Navigator
// ===============================

/*
 * Initializes the Leaflet map, adds markers, handles sidebar navigation and location selection,
 * tracks user location in real-time, checks if the user is within the campus boundary,
 * displays a customized popup message if they're outside the premises,
 * and manages routing and distance indicators.
 */

// ===============================
// 1. Map Initialization
// ===============================

const campusCoordinates = [10.93919538852309, 76.95196394531337];
const map = L.map('map').setView(campusCoordinates, 18);

// Add OpenStreetMap tile layer
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

const campusBoundary = L.polygon(campusBoundaryCoordinates, {
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
        iconUrl: 'assets/entrance.png', // Ensure this path is correct
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
        iconUrl: 'assets/library.png',
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30]
    }),
    Academic: L.icon({
        iconUrl: 'assets/academic.png',
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30]
    }),
    Food: L.icon({
        iconUrl: 'assets/food.png',
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30]
    }),
    Accommodation: L.icon({
        iconUrl: 'assets/accommodation.png',
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30]
    }),
    Recreation: L.icon({
        iconUrl: 'assets/recreation.png',
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30]
    }),
    Default: L.icon({
        iconUrl: 'assets/default.png',
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
let destination = null; // To store the current destination
let distanceIndicatorControl = null;

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
        Swal.fire({
            icon: 'error',
            title: 'Geolocation Not Supported',
            text: 'Your browser does not support geolocation. Please use a compatible browser.',
            confirmButtonText: 'OK'
        });
        return;
    }

    const options = {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 27000
    };

    let isUserInside = true; // Flag to track user's campus status

    function success(position) {
        const latitude  = position.coords.latitude;
        const longitude = position.coords.longitude;
        const accuracy = position.coords.accuracy;

        console.log(`User's current position: [${latitude}, ${longitude}] with accuracy ${accuracy} meters.`);

        if (!userMarker) {
            userMarker = L.marker([latitude, longitude], { 
                icon: L.icon({
                    iconUrl: 'assets/user-location.png', // Ensure this path is correct
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

        // Check if user is inside campus boundary
        const userPoint = turf.point([longitude, latitude]);
        const campusPolygon = turf.polygon([campusBoundaryCoordinates.map(coord => [coord[1], coord[0]])]); // [lng, lat]
        const isInside = turf.booleanPointInPolygon(userPoint, campusPolygon);

        if (!isInside && isUserInside) {
            // User has moved from inside to outside
            isUserInside = false;
            showOutsideCampusPopup();
        } else if (isInside && !isUserInside) {
            // User has moved from outside to inside
            isUserInside = true;
            Swal.fire({
                icon: 'success',
                title: 'Welcome Back!',
                text: 'You have entered the campus premises.',
                confirmButtonText: 'OK'
            });
        }

        // If a destination is set, update the route and distance
        if (destination) {
            plotRoute({ lat: latitude, lng: longitude }, destination);
            updateDistanceIndicator({ lat: latitude, lng: longitude }, destination);
        }
    }

    function error(err) {
        console.warn(`ERROR(${err.code}): ${err.message}`);
        let errorMessage = '';
        switch(err.code) {
            case err.PERMISSION_DENIED:
                errorMessage = "Permission denied. Unable to access your location.";
                break;
            case err.POSITION_UNAVAILABLE:
                errorMessage = "Position unavailable. Please check your network or GPS.";
                break;
            case err.TIMEOUT:
                errorMessage = "Geolocation request timed out. Please try again.";
                break;
            default:
                errorMessage = "An unknown error occurred.";
                break;
        }
        Swal.fire({
            icon: 'error',
            title: 'Geolocation Error',
            text: errorMessage,
            confirmButtonText: 'OK'
        });
    }

    navigator.geolocation.watchPosition(success, error, options);
}

// ===============================
// 9. Handle Sidebar Toggle
// ===============================

/**
 * Handles the opening and closing of the places sidebar with toggle functionality.
 */
function handleSidebar() {
    const viewPlacesButton = document.getElementById('view-places-button');
    const closeSidebarButton = document.getElementById('close-sidebar-button');
    const placesSidebar = document.getElementById('places-sidebar');

    viewPlacesButton.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent click from bubbling to document
        const isOpen = placesSidebar.classList.contains('open');
        if (isOpen) {
            placesSidebar.classList.remove('open');
            placesSidebar.setAttribute('aria-hidden', 'true');
        } else {
            placesSidebar.classList.add('open');
            placesSidebar.setAttribute('aria-hidden', 'false');
        }
    });

    closeSidebarButton.addEventListener('click', () => {
        placesSidebar.classList.remove('open');
        placesSidebar.setAttribute('aria-hidden', 'true');
    });

    // Close sidebar when clicking outside of it
    document.addEventListener('click', (e) => {
        if (!placesSidebar.contains(e.target) && !viewPlacesButton.contains(e.target)) {
            placesSidebar.classList.remove('open');
            placesSidebar.setAttribute('aria-hidden', 'true');
        }
    });

    // Prevent clicks inside the sidebar from closing it
    placesSidebar.addEventListener('click', (e) => {
        e.stopPropagation();
    });
}

// ===============================
// 10. Handle Labs Expand/Collapse
// ===============================

/**
 * Handles the expand and collapse functionality for multiple Labs sections.
 */
function handleLabsToggle() {
    const labsHeaders = document.querySelectorAll('.labs-header');

    labsHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const isExpanded = header.getAttribute('aria-expanded') === 'true';
            header.setAttribute('aria-expanded', !isExpanded);
            const labsList = header.nextElementSibling;
            labsList.classList.toggle('hidden');
            const icon = header.querySelector('i');
            icon.classList.toggle('fa-chevron-down');
            icon.classList.toggle('fa-chevron-up');
        });

        // Allow keyboard interaction
        header.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                header.click();
            }
        });
    });
}

// ===============================
// 11. Handle Location Selection
// ===============================

/**
 * Adds click event listeners to location list items.
 */
function handleLocationSelection() {
    const placeItems = document.querySelectorAll('.place-item');

    placeItems.forEach(item => {
        item.addEventListener('click', () => {
            const lat = parseFloat(item.getAttribute('data-lat'));
            const lng = parseFloat(item.getAttribute('data-lng'));
            const locationName = item.textContent;

            destination = { lat: lat, lng: lng };

            if (userMarker) {
                const userCoords = userMarker.getLatLng();
                plotRoute({ lat: userCoords.lat, lng: userCoords.lng }, destination);
                updateDistanceIndicator({ lat: userCoords.lat, lng: userCoords.lng }, destination);
            } else {
                // Center the map on the selected location
                map.setView([lat, lng], 18);
                L.popup()
                    .setLatLng([lat, lng])
                    .setContent(`<b>${locationName}</b>`)
                    .openOn(map);
            }

            // Close the sidebar after selection
            closeSidebar();
        });

        // Allow keyboard interaction
        item.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                item.click();
            }
        });
    });
}

/**
 * Closes the places sidebar.
 */
function closeSidebar() {
    const placesSidebar = document.getElementById('places-sidebar');
    const viewPlacesButton = document.getElementById('view-places-button');

    if (placesSidebar.classList.contains('open')) {
        placesSidebar.classList.remove('open');
        placesSidebar.setAttribute('aria-hidden', 'true');
    }
}

// ===============================
// 12. Handle Search Functionality
// ===============================

/**
 * Filters the places list based on the search query.
 */
function handleSearch() {
    const searchInput = document.getElementById('places-search');
    const placeItems = document.querySelectorAll('.place-item');

    searchInput.addEventListener('input', () => {
        const query = searchInput.value.trim().toLowerCase();

        placeItems.forEach(item => {
            if (item.textContent.toLowerCase().includes(query)) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    });
}

// ===============================
// 13. Function to Plot a Route with Navigation Instructions
// ===============================

/**
 * Plots a route from the start point to the end point via the entrance with navigation instructions.
 * Initializes the routing control once and updates waypoints dynamically to prevent blinking.
 * @param {Object} start - The starting point with 'lat' and 'lng' properties.
 * @param {Object} end - The ending point with 'lat' and 'lng' properties.
 */
function plotRoute(start, end) {
    console.log("Initiating route calculation.");

    if (!routingControl) {
        // Initialize routing control once
        routingControl = L.Routing.control({
            waypoints: [
                L.latLng(start.lat, start.lng),
                L.latLng(entranceCoordinate[0], entranceCoordinate[1]),
                L.latLng(end.lat, end.lng)
            ],
            lineOptions: {
                styles: [{ color: '#6FA1EC', weight: 4 }]
            },
            addWaypoints: false,
            draggableWaypoints: false,
            fitSelectedRoutes: true,
            show: true, // Show the instruction panel
            showAlternatives: false,
            routeWhileDragging: false,
            router: L.Routing.osrmv1({
                language: 'en',
                profile: 'walking'
            }),
            createMarker: function(i, waypoint, n) {
                return L.marker(waypoint.latLng, {
                    icon: icons.Default
                });
            },
            routeDragInterval: 1000
        }).addTo(map);

        // Add a close button to the routing instructions on mobile
        addRoutingCloseButton();
    } else {
        // Update waypoints to prevent flickering
        routingControl.setWaypoints([
            L.latLng(start.lat, start.lng),
            L.latLng(entranceCoordinate[0], entranceCoordinate[1]),
            L.latLng(end.lat, end.lng)
        ]);
    }
}

/**
 * Adds a custom close button to the Leaflet Routing Machine instruction panel.
 * This allows users to close the navigation instructions manually.
 */
function addRoutingCloseButton() {
    // Delay to ensure the routing container is available
    setTimeout(() => {
        const routingContainer = document.querySelector('.leaflet-routing-container');
        if (routingContainer && !routingContainer.querySelector('.routing-close-button')) {
            const closeButton = document.createElement('button');
            closeButton.className = 'routing-close-button';
            closeButton.innerHTML = '<i class="fas fa-times"></i>';
            routingContainer.appendChild(closeButton);

            closeButton.addEventListener('click', () => {
                routingControl.setWaypoints([]);
                routingContainer.style.display = 'none';
                hideDistanceIndicator();
            });
        }
    }, 1000); // Adjust timeout as needed based on map loading speed
}

// ===============================
// 14. Distance Indicator Control
// ===============================

/**
 * Creates a custom Leaflet control to display the distance and ETA between two points.
 */
function createDistanceIndicator() {
    distanceIndicatorControl = L.control({ position: 'bottomright' });

    distanceIndicatorControl.onAdd = function (map) {
        const div = L.DomUtil.create('div', 'distance-indicator hidden');
        div.innerHTML = 'Distance: 0 m<br>ETA: 0 min';
        return div;
    };

    distanceIndicatorControl.addTo(map);
}

/**
 * Updates the distance indicator with the current distance between user and destination.
 * Also calculates estimated walking time assuming average speed of 5 km/h.
 * @param {Object} userCoords - The user's current coordinates with 'lat' and 'lng'.
 * @param {Object} destCoords - The destination coordinates with 'lat' and 'lng'.
 */
function updateDistanceIndicator(userCoords, destCoords) {
    if (!distanceIndicatorControl) {
        createDistanceIndicator();
    }

    const div = distanceIndicatorControl.getContainer();
    div.classList.remove('hidden');

    const userPoint = turf.point([userCoords.lng, userCoords.lat]);
    const destPoint = turf.point([destCoords.lng, destCoords.lat]);
    const distance = turf.distance(userPoint, destPoint, { units: 'meters' }); // in meters

    const distanceInMeters = Math.round(distance);
    const distanceInKilometers = (distance / 1000).toFixed(2);

    // Calculate estimated walking time (assuming 5 km/h)
    const walkingSpeed = 5; // km/h
    const estimatedTimeHours = distance / 1000 / walkingSpeed;
    const estimatedTimeMinutes = Math.round(estimatedTimeHours * 60);

    let displayDistance = distance < 1000 ? `${distanceInMeters} m` : `${distanceInKilometers} km`;
    let displayTime = estimatedTimeMinutes > 0 ? `${estimatedTimeMinutes} min` : `${Math.round(distance / (5 * 1000 / 60))} sec`;

    div.innerHTML = `
        <strong>Distance:</strong> ${displayDistance}<br>
        <strong>ETA:</strong> ${displayTime}
    `;
}

/**
 * Hides the distance indicator.
 */
function hideDistanceIndicator() {
    if (distanceIndicatorControl) {
        distanceIndicatorControl.getContainer().classList.add('hidden');
    }
}

// ===============================
// 15. Function to Show Outside Campus Popup
// ===============================

/**
 * Displays a popup message when the user is outside the campus premises.
 */
function showOutsideCampusPopup() {
    Swal.fire({
        icon: 'warning',
        title: 'Outside Campus',
        text: 'You are currently outside the campus premises. For the best experience, please enter the college grounds.',
        confirmButtonText: 'OK',
        backdrop: true,
        allowOutsideClick: true
    });
}

// ===============================
// 16. Load Custom Road GeoJSON
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
// 17. Initialization Function
// ===============================

/**
 * Initializes the SKCET Campus Navigator application.
 */
async function init() {
    const locations = await loadLocations();
    addMarkers(map, locations);
    handleSidebar();
    handleLabsToggle();
    handleLocationSelection();
    handleSearch();
    trackUserLocation();
    await loadCustomRoads(); // Load custom roads after other initializations
    createDistanceIndicator(); // Initialize the distance indicator
}

window.onload = init;
