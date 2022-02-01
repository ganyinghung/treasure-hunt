
import { firebaseApp } from './firebase.config';
import { getFirestore, collection, query, where, startAt, endAt, orderBy, getDocs } from "firebase/firestore";
import { getStorage, ref, getDownloadURL } from "firebase/storage";

import { Treasure } from './interfaces';


const Database = {

  /** Retrieve a list of items */
  retrieveTreasures: async function(start: string, end: string): Promise<Treasure[]> {    
    const k = []; 
    const firestore = getFirestore(firebaseApp);
    const storage = getStorage(firebaseApp);
    const collectionRef = collection(firestore, 'treasures');
    const q = query(collectionRef, where('minted', '==', false), orderBy('geohash'), startAt(start), endAt(end));
    const snapshot = await getDocs(q);
  
    for (const doc of snapshot.docs) {
      let data = doc.data();
      const storedImage = ref(storage, data.image);
      data.imageUrl = await getDownloadURL(storedImage);
      k.push(data);
    }
  
    return k;
  }

}

export default Database;
