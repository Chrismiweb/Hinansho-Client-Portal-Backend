const User = require('../model/user')
const { uploadProfilePic: upload } = require('../config/cloudinary');

const uploadProfilePicture = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: "No file uploaded" });
        }

        // Base URL (dynamic based on environment)
        // Cloudinary returns the full URL directly
        const imageUrl = req.file.path;

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