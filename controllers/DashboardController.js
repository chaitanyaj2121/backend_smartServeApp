// Firebase setup
const admin = require("firebase-admin")
const db = admin.firestore()

const DashboardController = {
  getDashboard: async (req, res) => {
    try {
      // console.log("Incoming request to /dashboard") // Log request start

      const messId = req.query.messId
      // console.log("messid: ", messId)
      const feesAmount = req.query.fees
      // console.log("fees came :", feesAmount)

      let customers = []

      // Get customers from subcollection instead
      const customersRef = db
        .collection("messes")
        .doc(messId)
        .collection("customers")
      const customersSnapshot = await customersRef.get()

      if (!customersSnapshot.empty) {
        customers = customersSnapshot.docs
          .map((doc) => {
            const data = doc.data()
            const feesPaid = parseFloat(data.feesPaid) || 0.0 // ✅ Convert to double
            const feesRemaining = feesAmount - feesPaid

            // Extract createdAt date if it exists in the data
            const createdAt = data.createdAt ? new Date(data.createdAt) : null

            return {
              id: doc.id,
              ...data,
              feesPaid, // Keep as a double
              feesRemaining,
              createdAt,
            }
          })
          .filter((customer) => {
            // Keep original fees filter
            return customer.feesPaid < feesAmount
          })
          .sort((a, b) => b.feesRemaining - a.feesRemaining) // Sort in descending order
      }

      // console.log("Response Data:", customers) // Log data before response

      res.status(200).json({ success: true, customers })
    } catch (error) {
      console.error("Error in getDashboard:", error.message)
      res.status(500).json({ success: false, message: "Internal Server Error" })
    }
  },

  // New function for filtered dashboard data
  getFilteredDashboard: async (req, res) => {
    try {
      // console.log("Incoming request to /dashboard/filtered")

      const messId = req.query.messId
      const feesAmount = parseFloat(req.query.fees || 0)
      const fromDate = req.query.fromDate
      const toDate = req.query.toDate
      const status = req.query.status

      // Get customers from subcollection
      const customersRef = db
        .collection("messes")
        .doc(messId)
        .collection("customers")

      // Apply status filter at database level if provided
      let query = customersRef
      if (status && status !== "all") {
        query = query.where("status", "==", status)
      }

      let customers = []
      const customersSnapshot = await query.get()

      if (!customersSnapshot.empty) {
        customers = customersSnapshot.docs
          .map((doc) => {
            const data = doc.data()
            const feesPaid = parseFloat(data.feesPaid) || 0.0
            const feesRemaining = feesAmount - feesPaid
            const createdAt = data.createdAt ? new Date(data.createdAt) : null

            return {
              id: doc.id,
              ...data,
              feesPaid,
              feesRemaining,
              createdAt,
            }
          })
          .filter((customer) => {
            // Fees filter
            const feesFilter =
              feesAmount > 0 ? customer.feesPaid < feesAmount : true

            // Date range filter
            let dateFilter = true
            if (fromDate && customer.createdAt) {
              const fromDateObj = new Date(fromDate)
              dateFilter = dateFilter && customer.createdAt >= fromDateObj
            }
            if (toDate && customer.createdAt) {
              const toDateObj = new Date(toDate)
              toDateObj.setDate(toDateObj.getDate() + 1) // Include end date fully
              dateFilter = dateFilter && customer.createdAt < toDateObj
            }

            return feesFilter && dateFilter
          })
          .sort((a, b) => b.feesRemaining - a.feesRemaining)
      }

      res.status(200).json({
        success: true,
        customers,
        filters: {
          messId,
          feesAmount,
          fromDate,
          toDate,
          status,
        },
      })
    } catch (error) {
      console.error("Error in getFilteredDashboard:", error.message)
      res.status(500).json({ success: false, message: "Internal Server Error" })
    }
  },
}

module.exports = DashboardController
