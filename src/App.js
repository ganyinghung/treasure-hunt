
import { useEffect, useState, useRef } from 'react'; 
import { Loader } from "@googlemaps/js-api-loader";

import { useWeb3 } from "@3rdweb/hooks";

import './App.css';
import Database from './database';
import distanceBetween from './distance';

const geofire = require('geofire-common');

function App() {
  const { address, connectWallet } = useWeb3();

  const [ origin, setOrigin ] = useState();  // the start position
  const [ treasures, setTreasures ] = useState([]);  // a list of treasures
  const [ instruction, setInstruction ] = useState('Loading...');
  const [ distance, setDistance ] = useState('');
  const [ totalDistance, setTotalDistance ] = useState('');
  const [ duration, setDuration ] = useState('');
  const [ arrived, setArrived ] = useState(false);

  const currentPosition = useRef();  // current position
  const target = useRef();  // the treasure that is currently seeking
  const google = useRef();  // google lib handle
  const map = useRef();  // google map
  const marker = useRef();  // google map marker (for current position)

  const claimNFT = async () => {
    if (!address) {
      await connectWallet('injected');
    }
  };

  const checkingPosition = () => {
    //console.log('checking position', currentPosition.current);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        if (google.current && map.current) {
          if (!marker.current) {
            marker.current = new google.current.maps.Marker({
              position: { lat: pos.coords.latitude, lng: pos.coords.longitude },
              map: map.current,
              icon: {
                path: google.current.maps.SymbolPath.CIRCLE,
                scale: 8,
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
          console.log('received instruction', data.routes[0].legs[0].steps[0]);
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
      if (d2 < 5) {
        setArrived(true);
      }
    }
  };

  const pickAnotherTreasure = () => {
    let k;
    for (var i = 0; i < treasures.length; i++) {
      if (target.current.geohash === treasures[i].geohash) {
        k = (i + 1) % treasures.length;
        break;
      }
    }
    target.current = treasures[k];
    updateInstruction();
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
              } else {
                setInstruction('No treasure found within 50 km');
              }
            }
          } catch (err) {
            console.error(err);
            setInstruction('Error! Please try again later');
          }
        }
      }
    )();
  }, [origin]);

  useEffect(() => {
    if (arrived && address && target.current) {
      fetch('/api/receive-treasure/'+target.current.geohash+'/'+address)
      .then(resp => resp.json())
      .then(data => {
        setInstruction('')
        
      })
      .catch(err => {
        console.error(err);
      });
    }
  }, [arrived, address, target.current]);


  return (
    <div className="App">
      {
        arrived ?        
        (
          <header className="App-header">
            <img className="App-image" src={target.current.imageUrl} />
            <div>You've found this NFT!</div>
            {
              address ?
              (
                <button className="nes-btn is-primary" onClick={claimNFT}>Claim it!</button>
              )
              :
              (
                <button className="nes-btn is-primary" onClick={claimNFT}>Connect your wallet and claim it!</button>
              )
            }            
          </header>
        )
        :
        (
          <header className="App-header">
            {target.current && <img className="App-image" src={target.current.imageUrl} />}
            {target.current && <div className="nes-text is-primary"><i>{target.current.name}</i></div>}
            <div dangerouslySetInnerHTML={{__html:instruction}}></div>
            {distance && <div>for {distance} / {duration}</div>}
            {totalDistance && <div><br/>Total: {totalDistance.toFixed(0)} m</div>}
          </header>
        )
      }      
      {
        (treasures.length > 1) ?
        (
          <div className="App-bar">
            <button className="nes-btn is-success" onClick={pickAnotherTreasure}>Pick another</button>
            <span className="nes-text is-success"><i>Treasure Hunt!</i></span>
          </div>
        )
        :
        (
          <div className="App-bar">
            <span className="nes-text is-success"><i>Treasure Hunt!</i></span>
          </div>
        )
      }        
      <div className="App-map">
        <div id="map"></div>
      </div>
    </div>
  );
}

export default App;
