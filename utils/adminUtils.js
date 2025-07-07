const { db } = require("../services/firebaseService");

async function getAdminEmails() {
  const snapshot = await db.collection("users")
    .where("role", "==", "admin")
    .get();

  return snapshot.docs
    .map(doc => doc.data().email)
    .filter(email => !!email); // ensure valid
}

module.exports = { getAdminEmails };
