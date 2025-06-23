const admin = require("firebase-admin");
const serviceAccount = require("../firebase-admin-sdk.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://electrostore-connect.firebaseio.com"
});

const db = admin.firestore();
const auth = admin.auth();

module.exports = { admin, db, auth };
