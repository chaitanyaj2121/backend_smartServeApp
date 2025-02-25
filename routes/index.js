const express = require("express")
const router = express.Router()
const { body } = require("express-validator")
const admin = require("firebase-admin")
const multer = require("multer")
const { storage } = require("../cloudConfig") // Ensure cloudConfig.js is correctly set up
const upload = multer({ storage })

// Decode Firebase credentials from environment variables
const firebaseCredentialsBase64 = process.env.FIREBASE_CREDENTIALS_BASE64

if (!firebaseCredentialsBase64) {
  throw new Error(
    "FIREBASE_CREDENTIALS_BASE64 is not set in environment variables"
  )
}

const firebaseCredentials = JSON.parse(
  Buffer.from(firebaseCredentialsBase64, "base64").toString("utf-8")
)

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(firebaseCredentials),
  })
}

const db = admin.firestore()

// Import controllers
const AuthController = require("../controllers/AuthController")
const CustomerController = require("../controllers/CustomerController")
const DashboardController = require("../controllers/DashboardController")

// Auth routes
router.post("/signup/business", AuthController.registerBusiness)
router.post("/signup/user", AuthController.registerCustomer)
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Enter a valid email"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
  ],
  AuthController.login
)

// Customer routes
router.get("/customers", CustomerController.getCustomers)
router.post("/customers/update/:id", CustomerController.updateCustomer)

router.post(
  "/addCustomer",
  upload.single("file"), // ✅ Ensure frontend sends 'file' field
  CustomerController.addCustomer
)

// Dashboard routes
router.get("/dashboard", DashboardController.getDashboard)

// Logout
router.get("/logout", AuthController.logout)

module.exports = router
