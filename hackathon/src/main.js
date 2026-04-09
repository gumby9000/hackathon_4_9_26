import './style.css'
import javascriptLogo from './assets/javascript.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import { setupCounter } from './counter.js'
import mapboxgl from 'mapbox-gl';
import "mapbox-gl/dist/mapbox-gl.css";

  // sets the access token, associating the map with your Mapbox account and its permissions
  mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

  // creates the map, setting the container to the id of the div you added in step 2, and setting the initial center and zoom level of the map
  const map = new mapboxgl.Map({
      container: 'map', // container ID
      projection: 'mercator',
      minZoom: '2.5',
      center: [-71.06776, 42.35816], // starting position [lng, lat]. Note that lat must be set between -90 and 90
      zoom: 9 // starting zoom
  });

