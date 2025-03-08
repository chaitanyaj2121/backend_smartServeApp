const admin = require("firebase-admin")
const db = admin.firestore()

const NotificationController = {
  getNotifications: async (req, res) => {
    const messId = req.query.messId

    const today = new Date()
    today.setHours(0, 0, 0, 0) // Normalize to midnight for comparison

    try {
      // Get customers from subcollection instead
      const customersRef = db
        .collection("messes")
        .doc(messId)
        .collection("customers")
      const customersSnapshot = await customersRef.get()

      // Helper function to add months with end-of-month adjustment
      const addMonths = (date, months) => {
        const newDate = new Date(date)
        newDate.setMonth(newDate.getMonth() + months)

        // Check if date overflowed to next month
        if (newDate.getDate() !== date.getDate()) {
          newDate.setDate(0) // Set to last day of previous month
        }
        return newDate
      }

      let filteredCustomers = []

      if (!customersSnapshot.empty) {
        filteredCustomers = customersSnapshot.docs
          .map((doc) => {
            const data = doc.data()
            const startDate = data.start_date.toDate()

            // Calculate 1-month anniversary date
            const oneMonthAnniversary = addMonths(startDate, 1)
            oneMonthAnniversary.setHours(0, 0, 0, 0) // Normalize to midnight

            // Check if anniversary matches today
            if (oneMonthAnniversary.getTime() === today.getTime()) {
              return {
                id: doc.id,
                ...data,
              }
            }
          })
          .filter(Boolean) // Remove undefined entries
      }

      return res.status(200).json({
        success: true,
        notifications: filteredCustomers,
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
