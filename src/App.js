
import { useEffect, useState, useRef } from 'react'; 
import { Loader } from "@googlemaps/js-api-loader"

import logo from './logo.svg';
import './App.css';
import Database from './database';
import distanceBetween from './distance';

const geofire = require('geofire-common');

function App() {

  const [ origin, setOrigin ] = useState();  // the start position
  const currentPosition = useRef();  // current position
  const [ treasures, setTreasures ] = useState([]);  // a list of treasures
  const [ instruction, setInstruction ] = useState('Please wait...');
  const [ distance, setDistance ] = useState('');
  const [ totalDistance, setTotalDistance ] = useState('');
  const [ duration, setDuration ] = useState('');

  const target = useRef();  // the treasure that is currently seeking
  const google = useRef();  // google lib handle
  const map = useRef();  // google map
  const marker = useRef();  // google map marker (for current position)

  const checkingPosition = () => {
    console.log('checking position', currentPosition.current);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        if (google.current && map.current) {
          if (!marker.current) {
            marker.current = new google.current.maps.Marker({
              position: { lat: pos.coords.latitude, lng: pos.coords.longitude },
              map: map.current,
              icon: {
                path: google.current.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillOpacity: 1,
                strokeWeight: 2,
                fillColor: '#5384ED',
                strokeColor: '#ffffff',
              }
            });
          } else {
            marker.current.setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          }
          map.current.setCenter({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });    
        }        
        // how far away we've moved since last checked?
        const d = distanceBetween(
          [pos.coords.latitude, pos.coords.longitude],
          [currentPosition.current[0], currentPosition.current[1]]
        );        
        if (d > 5) {
          // retrieve direction again if we've moved more than 5 meters
          updateInstruction();
        }
        currentPosition.current = [pos.coords.latitude, pos.coords.longitude];                
      });
    }
  };

  const updateInstruction = () => {
    console.log('trying to update instruction', google.current, currentPosition.current, target.current);
    if (google.current && currentPosition.current && target.current) {
      //console.log('updating instruction');
      let dir = new google.current.maps.DirectionsService();    
      dir.route({
        travelMode: 'WALKING',
        origin: new google.current.maps.LatLng(currentPosition.current[0], currentPosition.current[1]),
        destination: new google.current.maps.LatLng(target.current.location.latitude, target.current.location.longitude)
      }, function(data, status) {
        if (status === 'OK') {
          setInstruction(data.routes[0].legs[0].steps[0].instructions);
          setDistance(data.routes[0].legs[0].steps[0].distance.text);
          setDuration(data.routes[0].legs[0].steps[0].duration.text);
        }
      });  

      const d2 = distanceBetween(
        [currentPosition.current[0], currentPosition.current[1]],
        [target.current.location.latitude, target.current.location.longitude]
      );
      setTotalDistance(d2);
    }
  };

  useEffect(() => {
    const loader = new Loader({
      apiKey: process.env.REACT_APP_DIRECTION_APIKEY,
      version: "weekly"
    });
    loader.load().then((g) => {
      console.log('google maps script loaded');
      google.current = g;
      map.current = new g.maps.Map(document.getElementById("map"), {
        center: { lat: 0, lng: 0 },
        zoom: 18,
        streetViewControl: false,
        fullScreenControl: false,
        mapTypeControl: false
      });

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
          console.log('origin set');
          setOrigin([pos.coords.latitude, pos.coords.longitude]);
          currentPosition.current = [pos.coords.latitude, pos.coords.longitude];
        });        
      }
    });
    const interval = setInterval(checkingPosition, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    (
      async () => {
        if (origin) {
          try {
            const radius = 50000; // in meter
            const bounds = geofire.geohashQueryBounds([origin[0], origin[1]], radius);
            if (bounds.length > 0) {
              const t = await Database.retrieveTreasures(bounds[0][0], bounds[0][1]);
              console.log(t);
              setTreasures(t);
              if (t.length > 0) {
                target.current = t[0];   
                updateInstruction();
              }        
            }
          } catch (err) {
            console.error(err);
          }
        }
      }
    )();
  }, [origin]);


  return (
    <div className="App">
      <header className="App-header">
        <div dangerouslySetInnerHTML={{__html:instruction}}></div>
        {distance && <div>for {distance} / {duration}</div>}
        {totalDistance && <div><br/>Overall: {totalDistance.toFixed(0)} m</div>}
      </header>
      <div className="App-map">
        <div id="map"></div>
      </div>
    </div>
  );
}

export default App;
