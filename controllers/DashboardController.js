// Firebase setup
const admin = require("firebase-admin")
const db = admin.firestore()

const DashboardController = {
  getDashboard: async (req, res) => {
    try {
      console.log("Incoming request to /dashboard") // Log request start

      const messId = 1250 // Now an integer
      const feesAmount = 2300.0 // Now a double

      let customers = []

      const customersSnapshot = await db
        .collection("customers")
        .where("messId", "==", messId) // ✅ Compare as integer
        .get()

      if (!customersSnapshot.empty) {
        customers = customersSnapshot.docs
          .map((doc) => {
            const data = doc.data()
            const feesPaid = parseFloat(data.feesPaid) || 0.0 // ✅ Convert to double
            const feesRemaining = feesAmount - feesPaid
            return {
              id: doc.id,
              ...data,
              feesPaid, // Keep as a double
              feesRemaining,
            }
          })
          .filter((customer) => customer.feesPaid < feesAmount) // ✅ Ensure filtering works with double
          .sort((a, b) => b.feesRemaining - a.feesRemaining) // Sort in descending order
      }

      console.log("Response Data:", customers) // Log data before response

      res.status(200).json({ success: true, customers })
    } catch (error) {
      console.error("Error in getDashboard:", error)
      res.status(500).json({ success: false, message: "Internal Server Error" })
    }
  },
}

module.exports = DashboardController
