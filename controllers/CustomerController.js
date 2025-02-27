// Firebase setup
const admin = require("firebase-admin")
const db = admin.firestore()
const multer = require("multer")
const { storage, cloudinary } = require("../cloudConfig")
const upload = multer({ storage })

const CustomerController = {
  getCustomers: async (req, res) => {
    try {
      // Directly filter customers with messId = 1250
      const query = db.collection("customers").where("messId", "==", 1250)

      const snapshot = await query.get()
      const customers = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      res.status(200).json({ success: true, customers })
    } catch (error) {
      console.error("Error fetching customers:", error)
      res.status(500).json({ success: false, message: "Internal Server Error" })
    }
  },
  addCustomer: async (req, res) => {
    try {
      // // Extract data from the request body
      const { name, mobile, start_date, feesPaid, messId } = req.body

      // Ensure file was uploaded
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" })
      }

      // Get file URL and filename from Cloudinary
      const url = req.file.path
      const fileName = req.file.filename

      console.log("Received data:", {
        name,
        mobile,
        start_date,
        feesPaid,
        messId,
        customerImage: { url, fileName },
      })

      // Store data in Firestore
      await db.collection("customers").add({
        name,
        mobile: mobile || null,
        start_date: start_date ? new Date(start_date) : new Date(), // ✅ Convert string to Date
        messId: Number(messId), // ✅ Store messId as an integer
        feesPaid: parseFloat(feesPaid) || 0.0, // ✅ Store feesPaid as a double
        customerImage: { url, fileName },
        uid,
        createdAt: new Date(),
      })

      res.status(200).json({ message: "Customer added successfully!" })
    } catch (error) {
      console.error("Error adding customer:", error)
      res.status(500).json({ error: error.message })
    }
  },
  updateCustomer: async (req, res) => {
    try {
      const custId = req.params.id
      const { feesPaid, suttya } = req.body

      console.log("data recieved :", feesPaid)
      console.log("suttya:", suttya)

      const customerRef = db.collection("customers").doc(custId)

      // Fetch the existing customer document
      const customerSnapshot = await customerRef.get()

      if (!customerSnapshot.exists) {
        return res
          .status(404)
          .json({ success: false, message: "Customer not found" })
      }

      // Get the existing customer data
      const customerData = customerSnapshot.data()

      let updatedStartDate = customerData.start_date.toDate()

      // Extend the date if `suttya` is provided
      if (suttya) {
        const daysToExtend = parseInt(suttya, 10) || 0
        updatedStartDate.setDate(updatedStartDate.getDate() + daysToExtend) // Extend the date
      }

      // Prepare the updated fields
      const updatedData = {
        start_date: updatedStartDate, // Store the updated Date object
        feesPaid: feesPaid || customerData.feesPaid,
      }

      // Update the document in Firestore
      await customerRef.update(updatedData)

      return res.status(200).json({
        success: true,
        message: "Customer updated successfully",
        data: updatedData,
      })
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message })
    }
  },
  deleteCustomer: async (req, res) => {
    const { customerId } = req.body

    try {
      // Retrieve the customer's document
      const customerDoc = await db.collection("customers").doc(customerId).get()

      if (!customerDoc.exists) {
        return res
          .status(404)
          .json({ success: false, message: "Customer not found!" })
      }

      const customerData = customerDoc.data()

      // Check if the customer has a customerImage and fileName
      if (customerData.customerImage && customerData.customerImage.fileName) {
        const fileName = customerData.customerImage.fileName
        // Delete the image from Cloudinary
        await cloudinary.uploader.destroy(fileName)
      }

      // Delete the customer document from Firestore
      await db.collection("customers").doc(customerId).delete()

      return res
        .status(200)
        .json({ success: true, message: "Customer deleted successfully!" })
    } catch (error) {
      console.error("Error deleting customer:", error)
      return res.status(500).json({
        success: false,
        message: "Error deleting customer.",
        error: error.message,
      })
    }
  },

  renewCustomer: async (req, res) => {
    const { customerId } = req.body

    try {
      // Get the current date
      const newStartDate = new Date()

      // Update the customer's start_date in Firestore and reset feesPaid to 0
      await db.collection("customers").doc(customerId).update({
        start_date: newStartDate,
        feesPaid: 0,
      })

      // Send a JSON response
      return res.status(200).json({
        success: true,
        message: "Renew Success!",
        newStartDate: newStartDate,
      })
    } catch (error) {
      console.error("Error renewing customer:", error)

      return res.status(500).json({
        success: false,
        message: "Error renewing customer.",
        error: error.message,
      })
    }
  },
}

module.exports = CustomerController
