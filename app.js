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

// Session configuration
app.use(
  session({
    store: new FirestoreStore({
      database: db,
      collection: "sessions",
    }),
    secret: process.env.SESSIONSECRET || "yoursecretkey",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    },
  })
)

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
