const admin = require("firebase-admin")
const db = admin.firestore()

const NotificationController = {
  getNotifications: async (req, res) => {
    const messId = 1250
    const today = new Date() // Get today's date
    today.setHours(0, 0, 0, 0) // Normalize to midnight for comparison

    try {
      const customersSnapshot = await db
        .collection("customers")
        .where("messId", "==", messId)
        .get()

      let todaysCustomers = []

      if (!customersSnapshot.empty) {
        todaysCustomers = customersSnapshot.docs
          .map((doc) => {
            const data = doc.data()
            const startDate = data.start_date.toDate()
            if (startDate.toDateString() === today.toDateString()) {
              return {
                id: doc.id,
                ...data,
              }
            }
          })
          .filter(Boolean) // Remove undefined entries
      }

      // Return JSON response for Flutter
      return res.status(200).json({
        success: true,
        notifications: todaysCustomers,
      })
    } catch (error) {
      console.error("Error fetching notifications:", error)
      return res.status(500).json({
        success: false,
        message: "Error fetching notifications.",
      })
    }
  },
}

module.exports = NotificationController
