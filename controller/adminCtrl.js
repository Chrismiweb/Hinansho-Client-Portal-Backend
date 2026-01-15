const User = require('../model/user');
const Transaction = require('../model/transaction');
const Notification = require('../model/notification');
const fs = require('fs');
const Property = require('../model/property');

// Suspend a user account
const suspendUser = async (req, res) => {
    try {
        const { userId } = req.params;

        // Ensure the userId is a valid MongoDB ObjectId
        if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }

        // Update user suspension status
        const user = await User.findByIdAndUpdate(
            userId,
            { isSuspended: true },
            { new: true, runValidators: true }
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'User suspended successfully', user });
    } catch (error) {
        console.error("Error suspending user:", error);
        res.status(500).json({ message: 'Server error', error: error.message || error });
    }
};

// Unsuspend a user account
const unsuspendUser = async (req, res) => {
    try {
        const { userId } = req.params;

        // Validate userId as a valid MongoDB ObjectId
        if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }

        // Update user's suspension status
        const user = await User.findByIdAndUpdate(
            userId,
            { isSuspended: false },
            { new: true, runValidators: true }
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'User unsuspended successfully', user });
    } catch (error) {
        console.error("Error unsuspending user:", error);
        res.status(500).json({ message: 'Server error', error: error.message || error });
    }
};

// Delete a user account
const deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;

        // Validate if ID is a valid MongoDB ObjectId
        if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }

        // Find and delete user
        const user = await User.findByIdAndDelete(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ message: 'Server error', error: error.message || error });
    }
};



const sendNotification = async (req, res) => {
    try {
        const { title, message, recipients } = req.body;

        let users = [];

        if (recipients === 'all') {
            users = await User.find({});
        } else if (Array.isArray(recipients)) {
            users = await User.find({ _id: { $in: recipients } });
        } else {
            return res.status(400).json({ message: 'Invalid recipients format' });
        }

        const notifications = users.map(user => ({
            userId: user._id,
            title,
            message
        }));

        await Notification.insertMany(notifications);

        res.json({ message: 'Notifications sent and stored successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const getAdminProfile = async (req, res) => {
  try {
      const userId = req.user.userId || req.user._id;
      const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.user_type !== 'Admin' && user.user_type !== 'Master') {
      return res.status(403).json({
        message: 'Access denied',
        reason: `user_type is ${user.user_type}`,
      });
    }

    return res.status(200).json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        user_type: user.user_type,
        permissions: user.user_type === 'Admin' ? user.permissions : 'all',
      },
    });

  } catch (error) {
    console.error("Error in getAdminProfile:", error);
    res.status(500).json({ message: error.message });
  }
};

// create property with image
const createProperty = async (req, res) => {
  const userId = req.user._id;

  const {
    name,
    property_type,
    location,
    description,
    status,
    totalUnits,
    expected_roi
  } = req.body;

  try {
    // Validate image upload
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Property image is required'
      });
    }

    // Build URL dynamically (works everywhere)
    const protocol = req.protocol;
    const host = req.get('host');

    const imageUrl = `${protocol}://${host}/uploads/property_image/${req.file.filename}`;

    const newProperty = await Property.create({
      name,
      property_type,
      location,
      description,
      status,
      totalUnits,
      expected_roi,
      images: [imageUrl],
      createdBy: userId
    });

    res.status(201).json({
      success: true,
      message: 'Property created successfully',
      property: newProperty
    });

  } catch (error) {
    console.error('Error creating property:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

const fetchProperties = async (req, res) => {
    try {
        const properties = await Property.find().populate('createdBy', 'name email');
        res.status(200).json({ success: true, properties });
    }
    catch (error) {
        console.error('Error fetching properties:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

//get all investors
const getAllInvestors = async (req, res) => {
    try {
        const investors = await User.find({ role: 'Investor' });
        res.status(200).json({ success: true, investors });
    }
    catch (error) {
        console.error('Error fetching investors:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

const getAllTenants = async (req, res) => {
    try {
        const tenants = await User.find({ role: 'Tenant' });
        res.status(200).json({ success: true, tenants });
    }
    catch (error) {
        console.error('Error fetching tenants:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

//update property
const updateProperty = async (req, res) => {
    const { propertyId } = req.params;
    
    try {
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    const {
      name,
      property_type,
      location,
      description,
      status,
      expected_roi
    } = req.body;

    if (name) property.name = name;
    if (property_type) property.property_type = property_type;
    if (location) property.location = location;
    if (description) property.description = description;
    if (status) property.status = status;
    if (expected_roi) property.expected_roi = expected_roi;

    // Optional image replacement
    if (req.file) {
      const protocol = req.protocol;
      const host = req.get('host');
      property.image = `${protocol}://${host}/uploads/property_image/${req.file.filename}`;
    }

    await property.save();

    res.status(200).json({
      success: true,
      message: 'Property updated successfully',
      property
    });

  } catch (error) {
    console.error('Update property error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


module.exports = {
    suspendUser,
    unsuspendUser,
    deleteUser,
    sendNotification,
    getAdminProfile,
    createProperty,
    fetchProperties,
    getAllInvestors,
    getAllTenants,
    updateProperty
};
