
import thirdsdk from './thirdsdk.js';

import { firebaseApp } from './firebase.config.js';
import { getFirestore, collection, query, where, limit, getDocs, setDoc} from "firebase/firestore";
import { getStorage, ref, getDownloadURL } from "firebase/storage";

import express from 'express'; ;
import fs from 'fs';
import https from 'https';

const app = express.Router(); 

app.get('/api/test', (req, res) => {
  res.send({ hello: 'WORLD!' });
});

app.get('/api/receive-treasure/:geohash/:addr', async (req, res) => {
  const firestore = getFirestore(firebaseApp);
  const storage = getStorage(firebaseApp);

  const collectionRef = collection(firestore, 'treasures');
  const q = query(
    collectionRef, 
    where('geohash', '==', req.params.geohash), 
    where('minted', '==', false), 
    limit(1)
  );

  try {
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      const data = doc.data();
      //res.send(JSON.stringify(data));
      
      const storedImage = ref(storage, data.image);
      const url = await getDownloadURL(storedImage);

      const nftModule = thirdsdk.getNFTModule(process.env.NFT_MODULE);
      const nft = await nftModule.mintTo(req.params.addr, {
        name: 'Treasure: ' + data.name,
        description: data.description,
        image: url,
        properties: { 
          latitude: data.location.latitude,
          longitude: data.location.longitude
        }
      });
      // link to opensea: https://testnets.opensea.io/assets/mumbai/{process.env.NFT_MODULE}/{nft.id}
      if (nft) {
        data.minted = true;
        data.owner = req.params.addr;
        await setDoc(doc.ref, data);
        res.send(JSON.stringify(nft));
      }    
    } else {
      res.sendStatus(404);
    }
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }

});

app.get('/api/view-treasure/:geohash', async (req, res) => {
  const firestore = getFirestore(firebaseApp);
  const collectionRef = collection(firestore, 'treasures');
  const q = query(
    collectionRef, 
    where('geohash', '==', req.params.geohash), 
    where('minted', '==', false), 
    limit(1)
  );

  try {
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const data = snapshot.docs[0].data();
      //res.send(JSON.stringify(data));

      const storage = getStorage(firebaseApp);
      const r = ref(storage, data.image);
      const url = await getDownloadURL(r);

      res.send(JSON.stringify(url));




    }
  } catch (err) {
    console.error(err);
  }
});

const http = express();

http.use('/', app);
const port = process.env.PORT || 5000; 

if (process.env.NODE_ENV === 'production') {
  const httpsServer = https.createServer({
    cert: fs.readFileSync(process.env.SSL_CERT),
    ca: fs.readFileSync(process.env.SSL_CA),
    key: fs.readFileSync(process.env.SSL_KEY)
  }, http); 

  httpsServer.listen(port, (err) => {
    if (err)
      throw err;
    console.log('Listening on '+port);
  });
} else {
  http.listen(port, (err) => {
    if (err)
      throw err;
    console.log('Listening on '+port);
  });
}
