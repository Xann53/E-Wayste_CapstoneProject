import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getStorage } from "firebase/storage";
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyAJXsuxbh3s7w_OlXNiR_mgDozhUI1KY5s",
    authDomain: "e-wayste.firebaseapp.com",
    projectId: "e-wayste",
    storageBucket: "e-wayste.appspot.com",
    messagingSenderId: "464525300272",
    appId: "1:464525300272:web:14d2cfb426fef7171f13f5",
    measurementId: "G-RW2FVF8VVL"
};

if(!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const app = initializeApp(firebaseConfig);

const storage = getStorage(app);
const auth = initializeAuth(app, {persistence: getReactNativePersistence(AsyncStorage)});
const db = getFirestore(app);

export {db, auth, storage, firebase};