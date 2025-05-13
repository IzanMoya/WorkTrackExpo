// src/services/firebase.ts
import firebase from "firebase/compat/app";
import "firebase/compat/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDdIg9bARxUNVuT8rALy9w9ylFKTPLxJLA",
  authDomain: "worktrack-c18a2.firebaseapp.com",
  databaseURL: "https://worktrack-c18a2-default-rtdb.firebaseio.com",
  projectId: "worktrack-c18a2",
  storageBucket: "worktrack-c18a2.appspot.com",
  messagingSenderId: "439763098158",
  appId: "1:439763098158:web:0fc81e744f4932ec6cddbf",
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();

export { auth };

