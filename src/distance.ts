// from: https://www.geeksforgeeks.org/program-distance-two-points-earth/

const distanceBetween = (coord1: number[], coord2: number[]): number => {

  let [lat1, lon1] = coord1;
  let [lat2, lon2] = coord2;

  lon1 = lon1 * Math.PI / 180;
  lon2 = lon2 * Math.PI / 180;
  lat1 = lat1 * Math.PI / 180;
  lat2 = lat2 * Math.PI / 180;

  // Haversine formula
  let dlon = lon2 - lon1;
  let dlat = lat2 - lat1;
  let a = Math.pow(Math.sin(dlat / 2), 2)
      + Math.cos(lat1) * Math.cos(lat2)
      * Math.pow(Math.sin(dlon / 2),2);
    
  let c = 2 * Math.asin(Math.sqrt(a));

  // Radius of earth in meters
  let r = 6371000;

  // calculate the result (meters)
  return Math.abs(c * r);

}


export default distanceBetween;