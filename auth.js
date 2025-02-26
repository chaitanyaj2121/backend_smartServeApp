const jwt = require("jsonwebtoken")
const admin = require("firebase-admin")
const db = admin.firestore()

const verifyToken = async (req, res, next) => {
  // Get token from header
  console.log("headers recieved:", req.headers)

  const token = req.headers.authorization?.split(" ")[1] // Bearer <token>

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Authorization token required",
    })
  }

  try {
    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    req.user = { uid: decoded.uid }
    console.log("success: uid", req.user)
    next()
  } catch (error) {
    console.error("Invalid token:", error.message)
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    })
  }
}

module.exports = verifyToken
