const multer = require("multer");
const path = require("path");

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null,'public/uploads'); // Set the folder where files will be stored
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName); // Save the file with a unique name
  },
});

// File filter (optional - restrict to certain file types)
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true); // Accept the file
  } else {
    cb(new Error("Only images are allowed (JPEG, PNG, GIF)"), false); // Reject the file
  }
};

// Create Multer instance
const upload = multer({
  storage,         // Use the storage configuration
  fileFilter,      // Use the file filter
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
});

module.exports = upload;