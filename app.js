const express = require("express")
const app = express()
const PORT = 8080

require("dotenv").config()
const session = require("express-session")
const FirestoreStore = require("firestore-store")(session) // Firestore session store
const admin = require("firebase-admin")

// Import routes
const mainRoutes = require("./routes")

// Firebase setup
const db = admin.firestore()

// Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Use routes
app.use("/", mainRoutes)

// Server setup
app.listen(PORT, () => console.log(`App is running on Port: ${PORT}`))

// Error handling middleware
app.use((err, req, res, next) => {
  res
    .status(err.statusCode || 500)
    .json({ error: err.message || "Something went wrong" })
})
