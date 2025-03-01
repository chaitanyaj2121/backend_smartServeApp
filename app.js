const express = require("express")
const app = express()
const PORT = 8080

require("dotenv").config()
const session = require("express-session")
const FirestoreStore = require("firestore-store")(session) // Firestore session store
const admin = require("firebase-admin")

// Import routes (ensure routes use or import the isLoggedIn middleware when needed)
const mainRoutes = require("./routes")

// Firebase setup
const db = admin.firestore()

// Middleware for parsing JSON and urlencoded data
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Session configuration
const sessionOptions = {
  store: new FirestoreStore({
    database: db,
    collection: "sessions", // Firestore collection name for sessions
  }),
  secret: process.env.SESSIONSECRET || "yoursecretkey",
  resave: false,
  saveUninitialized: false,
  cookie: {
    // Note: In a production API you might adjust how cookie expiration is handled
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days from now
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  },
}

// Enable sessions and flash messaging
app.use(express.json())
app.use(session(sessionOptions))

app.use((req, res, next) => {
  // Also attach user session info if needed
  res.locals.currUser = req.session.user
  next()
})

// Use routes
app.use("/", mainRoutes)

// Error handling middleware
app.use((err, req, res, next) => {
  res
    .status(err.statusCode || 500)
    .json({ error: err.message || "Something went wrong" })
})

// Start server
app.listen(PORT, () => console.log(`App is running on Port: ${PORT}`))
