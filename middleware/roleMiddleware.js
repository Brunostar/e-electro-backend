const { db } = require("../services/firebaseService");

function checkRole(role) {
  return async (req, res, next) => {
    const uid = req.user.uid;

    const userRef = db.collection("users").doc(uid);
    const userSnap = await userRef.get();
    const user = userSnap.data();

    if (!user || user.role !== role) {
      return res.status(403).json({ error: `Only ${role}s can access this resource.` });
    }

    req.user.role = user.role;
    next();
  };
}

function checkRoles(roles) {
  return async (req, res, next) => {
    const uid = req.user.uid;

    const userRef = db.collection("users").doc(uid);
    const userSnap = await userRef.get();
    const user = userSnap.data();

    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ error: `Access denied.` });
    }

    req.user.role = user.role;
    next();
  };
}

module.exports = { checkRole, checkRoles };
