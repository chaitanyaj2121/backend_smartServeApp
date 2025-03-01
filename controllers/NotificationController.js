const admin = require("firebase-admin")
const db = admin.firestore()

const NotificationController = {
  getNotifications: async (req, res) => {
    const messId = req.query.messId
    // console.log("this is messs id at notfi", messId)

    const today = new Date() // Get today's date
    today.setHours(0, 0, 0, 0) // Normalize to midnight for comparison

    // Calculate the date exactly one month before today
    const oneMonthBefore = new Date(today)
    oneMonthBefore.setMonth(oneMonthBefore.getMonth() - 1)

    // Handle edge cases for months with fewer days (e.g., February, April)
    const lastDayOfPreviousMonth = new Date(
      oneMonthBefore.getFullYear(),
      oneMonthBefore.getMonth() + 1,
      0 // Get the last day of the previous mo  nth
    ).getDate()

    try {
      const customersSnapshot = await db
        .collection("customers")
        .where("messId", "==", messId)
        .get()

      let filteredCustomers = []

      if (!customersSnapshot.empty) {
        filteredCustomers = customersSnapshot.docs
          .map((doc) => {
            const data = doc.data()
            const startDate = data.start_date.toDate()
            const startDay = startDate.getDate()

            // If the start date is beyond the last possible day of the previous month, adjust it
            const adjustedDate = new Date(oneMonthBefore)
            adjustedDate.setDate(Math.min(startDay, lastDayOfPreviousMonth))

            if (adjustedDate.toDateString() === today.toDateString()) {
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
