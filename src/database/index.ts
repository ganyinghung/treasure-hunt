import { firebaseApp } from './firebase.config';
import { getFirestore, collection, query, startAt, endAt, orderBy, getDocs } from "firebase/firestore";

import { Treasure } from './interfaces';


const Database = {

  /** Retrieve a list of items */
  retrieveTreasures: async function(start: string, end: string): Promise<Treasure[]> {    
    const k = []; 
    const firestore = getFirestore(firebaseApp);
    const collectionRef = collection(firestore, 'treasures');
    const q = query(collectionRef, orderBy('geohash'), startAt(start), endAt(end));
    const snapshot = await getDocs(q);
  
    for (const doc of snapshot.docs) {
      let data = doc.data();
      k.push(data);
    }
  
    return k;
  }

}

export default Database;
