// Firebase setup
const admin = require("firebase-admin")
const db = admin.firestore()

const ProfileController = {
  getProfile: async (req, res) => {
    const uid = req.query.uid

    try {
      // Directly get the document using uid as the document ID
      const businessDoc = await db.collection("businesses").doc(uid).get()

      if (businessDoc.exists) {
        const businessData = businessDoc.data()
        console.log("Business data:", businessData)
        return res.status(200).json({ data: businessData })
      } else {
        return res
          .status(404)
          .json({ error: "No business found with the given uid" })
      }
    } catch (error) {
      console.error("Error while loading profile:", error.message)
      return res.status(500).json({ error: error.message })
    }
  },

  updateProfile: async (req, res) => {
    const uid = req.query.uid
    const updateData = req.body

    // Validate required fields
    const requiredFields = ["businessName", "ownerName", "phone", "description"]
    const missingFields = requiredFields.filter((field) => !updateData[field])

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: `Missing required fields: ${missingFields.join(", ")}`,
      })
    }

    try {
      // Check if the business document exists
      const businessRef = db.collection("businesses").doc(uid)
      const businessDoc = await businessRef.get()

      if (!businessDoc.exists) {
        return res.status(404).json({
          error: "No business found with the given uid",
        })
      }

      // Prepare data to update
      // Remove any sensitive or readonly fields that shouldn't be updated by clients
      const sanitizedData = {
        businessName: updateData.businessName,
        ownerName: updateData.ownerName,
        phone: updateData.phone,
        address: updateData.address || "",
        description: updateData.description,
        rent: updateData.rent || 0,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }

      // Update the document
      await businessRef.update(sanitizedData)

      return res.status(200).json({
        success: true,
        message: "Business profile updated successfully",
      })
    } catch (error) {
      console.error("Error updating business profile:", error.message)
      return res.status(500).json({ error: error.message })
    }
  },
}

module.exports = ProfileController
