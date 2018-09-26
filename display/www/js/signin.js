var config = {
    apiKey: "AIzaSyDe5XDx3gXJNTmixrY8tqrJV_iMzdomNbc",
    authDomain: "meroir-77fc6.firebaseapp.com",
    databaseURL: "https://meroir-77fc6.firebaseio.com",
    projectId: "meroir-77fc6",
    storageBucket: "meroir-77fc6.appspot.com",
    messagingSenderId: "701589652709"
};
firebase.initializeApp(config);

db = firebase.database();

// Initialize the FirebaseUI Widget using Firebase.
var ui = new firebaseui.auth.AuthUI(firebase.auth());

ui.start('#firebaseui-auth-container', {
    signInOptions: [
        firebase.auth.GoogleAuthProvider.PROVIDER_ID
    ]
});

