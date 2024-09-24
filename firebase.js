import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAP1BQpWWrn8-M6jAOC-LOeQ86SOvtIRFg",
  authDomain: "itd112-lab1-cai.firebaseapp.com",
  projectId: "itd112-lab1-cai",
  storageBucket: "itd112-lab1-cai.appspot.com",
  messagingSenderId: "644988856095",
  appId: "1:644988856095:web:3a929e6bbcd75f1580f22a"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
