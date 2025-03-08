// Firebase setup
const admin = require("firebase-admin")
const db = admin.firestore()
const jwt = require("jsonwebtoken")

require("dotenv").config()

const {
  signInWithEmailAndPassword,
  sendEmailVerification,
  createUserWithEmailAndPassword,
} = require("firebase/auth")

const { auth } = require("../firebase-config")

const AuthController = {
  // Register Business
  registerBusiness: async (req, res) => {
    try {
      const {
        businessName,
        ownerName,
        address,
        phone,
        rent,
        email,
        description,
        password,
      } = req.body

      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      )
      const uid = userCredential.user.uid

      // Send email verification
      await sendEmailVerification(userCredential.user)

      // Save business details in Firestore
      await db
        .collection("businesses")
        .doc(uid)
        .set({
          businessName,
          ownerName,
          address,
          phone,
          rent: Number(rent),
          description,
          uid,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        })

      return res.status(201).json({
        success: true,
        message: "Business registered successfully. Verification email sent.",
      })
    } catch (error) {
      console.error("Error registering business:", error)
      return res.status(400).json({ success: false, message: error.message })
    }
  },

  // User Login
  login: async (req, res) => {
    const { email, password } = req.body
    console.log(email)

    try {
      // Validate email and password
      console.log("got the request")
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: "Email and password are required.",
        })
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: "Invalid email format.",
        })
      }

      // Authenticate user
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      )
      const user = userCredential.user

      if (!user.emailVerified) {
        return res.status(403).json({
          success: false,
          message: "Please verify your email before logging in.",
        })
      }

      const uid = user.uid

      // Fetch user data from Firestore
      const [businessSnap, customerSnap] = await Promise.all([
        db.collection("businesses").where("uid", "==", uid).get(),
        db.collection("customers").where("uid", "==", uid).get(),
      ])

      // Prepare user data
      let userData = {
        uid,
        email: user.email,
        isBusiness: !businessSnap.empty,
        isCustomer: !customerSnap.empty,
      }

      if (!businessSnap.empty) {
        userData.fees = businessSnap.docs[0].data().rent
      }

      // Ensure JWT_SECRET is set
      if (!process.env.JWT_SECRET) {
        throw new Error("Missing JWT secret in environment variables")
      }

      // Generate JWT token
      const token = jwt.sign({ uid }, process.env.JWT_SECRET, {
        expiresIn: "6h",
      })

      return res.status(200).json({ success: true, token, user: userData })
    } catch (error) {
      console.error("Error logging in:", error.message)

      return res.status(401).json({
        success: false,
        message: "Invalid credentials. Please try again.",
      })
    }
  },

  // Register Customer
  registerCustomer: async (req, res) => {
    try {
      const { fullName, mobile, email, password } = req.body

      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      )
      const uid = userCredential.user.uid

      // Save customer details in Firestore
      await db.collection("customers").doc(uid).set({
        fullName,
        mobile,
        uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      })

      // Send email verification
      await sendEmailVerification(userCredential.user)

      return res.status(201).json({
        success: true,
        message: "Customer registered successfully. Verification email sent.",
      })
    } catch (error) {
      console.error("Error registering customer:", error)
      return res.status(400).json({ success: false, message: error.message })
    }
  },

  // Logout
  logout: async (req, res) => {
    try {
      // Logout should be handled on the client side by removing the token.
      return res.status(200).json({
        success: true,
        message: "Logout successful. Remove JWT on client side.",
      })
    } catch (error) {
      console.error("Error logging out:", error.message)
      return res.status(500).json({ success: false, message: error.message })
    }
  },
}

module.exports = AuthController
