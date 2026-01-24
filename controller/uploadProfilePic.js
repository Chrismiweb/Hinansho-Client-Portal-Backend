const multer = require('multer');
const path = require('path');
const User = require('../model/user')
const fs = require('fs')

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = 'uploads/profile_picture/';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});

const fileFilter = (req, file, cb) => {
    const allowedType = /jpeg|jpg|png|gif/;
    const extname = allowedType.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedType.test(file.mimetype)

    if (extname && mimetype) {
        cb(null, true)
    } else {
        cb(new Error("Only .jpeg, .jpg, .png, .gif, .pdf files are allowed"))
    }
}

// Multer Upload Middleware
const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 500 * 1024 * 1024 } // 500MB max file size
});

const uploadProfilePicture = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: "No file uploaded" });
        }

        // Base URL (dynamic based on environment)
        const baseUrl = process.env.localhostUrl;

        // Save full image URL instead of relative path
        const imageUrl = `${baseUrl}/uploads/profile_picture/${req.file.filename}`;

        const userId = req.user?.userId;
        const existingProfile = await User.findById(userId);
        if (!existingProfile) {
            return res.status(404).json({ success: false, error: "User not found" });
        }

        existingProfile.profile_picture = imageUrl;
        await existingProfile.save();

        res.status(200).json({
            success: true,
            message: "Profile picture uploaded successfully",
            profile: {
                id: existingProfile._id,
                profile_picture: existingProfile.profile_picture
            },
        });
    } catch (error) {
        console.error("Error uploading profile picture:", error);
        res.status(500).json({ success: false, error: "Server error" });
    }
};

const updateProfile = async (req, res) => {
    try {
        const userId = req.user;
        const { firstname, lastname, phone_number, bio } = req.body;

        // Find user profile
        const existingProfile = await User.findById(userId);
        if (!existingProfile) {
            return res.status(404).json({ success: false, error: "User not found" });
        }

        // Update profile info (do NOT touch profile_picture here)
        if (firstname) existingProfile.firstname = firstname;
        if (lastname) existingProfile.lastname = lastname;
        if (phone_number) existingProfile.phone_number = phone_number;
        if (bio) existingProfile.bio = bio;

        // Save updated profile
        await existingProfile.save();

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            profile: {
                id: existingProfile._id,
                firstname: existingProfile.firstname,
                lastname: existingProfile.lastname,
                phone_number: existingProfile.phone_number,
                bio: existingProfile.bio,
                profile_picture: existingProfile.profile_picture
            },
        });

    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ success: false, error: "Server error" });
    }
};

const getProfileMedia = async (req, res) => {
    try {
        const userId = req.user;

        // Find user profile
        const existingProfile = await User.findById(userId);
        if (!existingProfile) {
            return res.status(404).json({ success: false, error: "User not found" });
        }

        // Base URL for images (fallback to localhost in dev)
        const baseUrl = process.env.BASE_URL;

        // Construct URLs (only if the file exists)
        const profilePictureUrl = existingProfile.profile_picture
            ? existingProfile.profile_picture.startsWith('http')
                ? existingProfile.profile_picture // already full URL
                : `${baseUrl}${existingProfile.profile_picture}`
            : null;

        return res.status(200).json({
            success: true,
            data: {
                profile_picture: profilePictureUrl || "Profile picture not found",
            },
        });
    } catch (error) {
        console.error("Error fetching profile media:", error);
        return res.status(500).json({ success: false, error: "Server Error" });
    }
};

module.exports = {
    upload,
    updateProfile,
    uploadProfilePicture,
    getProfileMedia
};