const { withTransaction } = require('../utilis/withTransaction');
const User = require('../model/user');
const Unit = require('../model/unit');
const Property = require('../model/property');
const Ownership = require('../model/owner');
const Tenancy = require('../model/tenancy');
const PropertyDocument = require('../model/propertyDocument');
const RentPaymentRequest = require('../model/rentPayment');
const Rent = require('../model/rent');

// Create unit
const createUnit = async (req, res) => {
  const adminId = req.user._id;

  const {
    propertyId,
    unitNo,
    type,
    rentAmount,
    maxTenants,
    bedrooms,
    bathrooms,
    sizeSqFt,
    status,
  } = req.body;

  try {
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    // Ensure unitNo uniqueness per property
    const exists = await Unit.findOne({ property: propertyId, unitNo });
    if (exists) {
      return res.status(400).json({
        success: false,
        message: 'Unit already exists for this property'
      });
    }

    const unit = await Unit.create({
      property: propertyId,
      unitNo,
      type,
      rentAmount,
      maxTenants: maxTenants || 2,
      sizeSqFt,
      bedrooms: bedrooms || 1,
      bathrooms: bathrooms || 1,
      status: status || 'vacant',
      createdBy: adminId
    });

    res.status(201).json({
      success: true,
      message: 'Unit created successfully',
      unit
    });

  } catch (error) {
    console.error('Create unit error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


const getUnitsByProperty = async (req, res) => {
  const { propertyId } = req.params;

  try {
    const units = await Unit.find({ property: propertyId })
      .populate('investor', 'name email')

    res.status(200).json({
      success: true,
      units
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


const getAvailableUnits = async (req, res) => {
  try {
    const units = await Unit.find({
      investor: null,
      status: 'vacant'
    });

    res.status(200).json({
      success: true,
      units
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


const assignUnitToInvestor = async (req, res) => {
  const adminId = req.user._id;
  

  const {
    unitId,
    investorId,
    amountPaid
  } = req.body;

  if (!unitId || !investorId || !amountPaid) {
    return res.status(400).json({
      success: false,
      message: 'unitId, investorId and amountPaid are required'
    });
  }

  try {
    const ownership = await withTransaction(async (session) => {

      // 1️⃣ Validate investor
      const investor = await User.findById(investorId).session(session);
      if (!investor || investor.role !== 'Investor') {
        throw new Error('Invalid investor account');
      }

      // 2️⃣ Fetch unit
      const unit = await Unit.findById(unitId).session(session);
      if (!unit) {
        throw new Error('Unit not found');
      }

      // 3️⃣ Prevent double assignment
      if (unit.investor) {
        throw new Error('This unit already has an investor');
      }

      // 4️⃣ Create ownership record
      const [newOwnership] = await Ownership.create(
        [{
          investor: investor._id,
          unit: unit._id,
          property: unit.property,
          amountPaid,
          assignedBy: adminId
        }],
        { session }
      );

      // 5️⃣ Update unit
      unit.investor = investor._id;
      unit.status = 'occupied';
      await unit.save({ session });

      return newOwnership;
    });

    res.status(201).json({
      success: true,
      message: 'Unit successfully assigned to investor',
      ownership
    });

  } catch (error) {
    console.error('Assign unit error:', error.message);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const assignPropertyToInvestor = async (req, res) => {
  const adminId = req.user._id;
  const { propertyId, investorId, amountPaid } = req.body;

  try {
    const ownership = await withTransaction(async (session) => {

      const property = await Property.findById(propertyId).session(session);
      if (!property) throw new Error('Property not found');

      if (property.property_type !== 'land') {
        throw new Error('Only land can use this endpoint');
      }

      const investor = await User.findById(investorId).session(session);
      if (!investor || investor.role !== 'Investor') {
        throw new Error('Invalid investor');
      }

      const alreadyAssigned = await Ownership.findOne({
        property: propertyId,
        investor: investorId,
        unit: null
      }).session(session);

      if (alreadyAssigned) {
        throw new Error('Investor already owns this land');
      }

      const [newOwnership] = await Ownership.create([{
        investor: investorId,
        property: propertyId,
        unit: null,
        amountPaid,
        assignedBy: adminId
      }], { session });

      return newOwnership;
    });

    res.status(201).json({
      success: true,
      message: 'Land assigned successfully',
      ownership
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const assignTenantsToUnit = async (req, res) => {
  try {
    const adminId = req.user._id;
    const {
      unitId,
      tenantId,
      rentAmount,
      securityDeposit,
      startDate,
      endDate
    } = req.body;

    // 1️⃣ Fetch unit
    const unit = await Unit.findById(unitId);
    if (!unit) {
      return res.status(404).json({ success: false, message: 'Unit not found' });
    }

    if (!unit.investor) {
      return res.status(400).json({
        success: false,
        message: 'Unit must have an investor before tenancy'
      });
    }

    // 2️⃣ Validate tenant
    const tenant = await User.findById(tenantId);
    if (!tenant || tenant.role !== 'Tenant') {
      return res.status(400).json({ success: false, message: 'Invalid tenant' });
    }

    // 3️⃣ Find ACTIVE tenancy for unit
    let tenancy = await Tenancy.findOne({
      unit: unit._id,
      status: 'active'
    });

    // 4️⃣ If tenancy exists → ADD TENANT
    if (tenancy) {
      if (tenancy.tenants.length >= 2) {
        return res.status(400).json({
          success: false,
          message: 'Unit already has maximum tenants'
        });
      }

      if (tenancy.tenants.includes(tenant._id)) {
        return res.status(400).json({
          success: false,
          message: 'Tenant already assigned to this unit'
        });
      }

      tenancy.tenants.push(tenant._id);
      await tenancy.save();
    } 
    // 5️⃣ Else → CREATE tenancy
    else {
      tenancy = await Tenancy.create({
        unit: unit._id,
        tenants: [tenant._id],
        investor: unit.investor,
        property: unit.property,
        rentAmount,
        securityDeposit,
        startDate,
        endDate,
        assignedBy: adminId
      });

      unit.status = 'occupied';
      await unit.save();
    }

    return res.status(201).json({
      success: true,
      message: 'Tenant assigned successfully',
      tenancy
    });

  } catch (error) {
    console.error('Assign tenant error:', error.message);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};


const updateUnit = async (req, res) => {
  const { unitId } = req.params;

  try {
    const unit = await Unit.findById(unitId);
    if (!unit) {
      return res.status(404).json({
        success: false,
        message: 'Unit not found'
      });
    }

    // ❌ Prevent unsafe edits
    if (unit.status === 'occupied') {
      return res.status(400).json({
        success: false,
        message: 'Cannot edit an occupied unit'
      });
    }

    const {
      unitNo,
      type,
      sizeSqFt,
      bedrooms,
      bathrooms,
      rentAmount,
      status
    } = req.body;

    if (unitNo) unit.unitNo = unitNo;
    if (type) unit.type = type;
    if (sizeSqFt !== undefined) unit.sizeSqFt = sizeSqFt;
    if (bedrooms !== undefined) unit.bedrooms = bedrooms;
    if (bathrooms !== undefined) unit.bathrooms = bathrooms;

    if (rentAmount !== undefined) {
      unit.rentAmount = rentAmount;
    }

    // if (maxTenants !== undefined) {
    //   if (maxTenants > 2) {
    //     return res.status(400).json({
    //       success: false,
    //       message: 'Max tenants cannot exceed 2'
    //     });
    //   }
    //   unit.maxTenants = maxTenants;
    // }

    // Only allow status change if unit is not owned
    if (status) {
      if (unit.investor && status === 'vacant') {
        return res.status(400).json({
          success: false,
          message: 'Cannot mark owned unit as vacant'
        });
      }
      unit.status = status;
    }

    await unit.save();

    res.status(200).json({
      success: true,
      message: 'Unit updated successfully',
      unit
    });

  } catch (error) {
    console.error('Update unit error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


const deleteUnit = async (req, res) => {
  const { unitId } = req.params;

  if (!unitId) {
    return res.status(400).json({
      success: false,
      message: 'Unit ID is required'
    });
  }

  try {
    await withTransaction(async (session) => {

      // 1️⃣ Check unit existence
      const unit = await Unit.findById(unitId).session(session);
      if (!unit) {
        throw new Error('Unit not found');
      }

      // 2️⃣ Block deletion if investor exists
      if (unit.investor) {
        throw new Error('Cannot delete unit assigned to an investor');
      }

      // 3️⃣ Block deletion if tenancy exists
      const tenancyExists = await Tenancy.findOne({ unit: unitId }).session(session);
      if (tenancyExists) {
        throw new Error('Cannot delete unit with active tenancy');
      }

      // 4️⃣ Block deletion if ownership history exists
      const ownershipExists = await Ownership.findOne({ unit: unitId }).session(session);
      if (ownershipExists) {
        throw new Error('Cannot delete unit with ownership record');
      }

      // 5️⃣ Safe delete
      await Unit.deleteOne({ _id: unitId }).session(session);
    });

    res.status(200).json({
      success: true,
      message: 'Unit deleted successfully'
    });

  } catch (error) {
    console.error('Delete unit error:', error.message);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Admin uploads property documents for investor with units owned
const uploadPropertyDocuments = async (req, res) => {
  const { investorId } = req.params;
  const { propertyId,unitId, documentType } = req.body;

  try {
    // 1️⃣ Validate investor
    const investor = await User.findById(investorId);
    if (!investor || investor.role !== 'Investor') {
      return res.status(404).json({
        success: false,
        message: 'Investor not found'
      });
    }

    // 2️⃣ Validate files
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    //validate property
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    // Validate unit IF provided
    let unit = null;
    if (unitId) {
      unit = await Unit.findOne({ _id: unitId, property: propertyId });
      if (!unit) {
        return res.status(404).json({
          success: false,
          message: 'Unit not found for this property'
        });
      }
    }


    const protocol = req.protocol;
    const host = req.get('host');

    // record investor name instead of Id in document for easier retrieval and display
    const investorName = investor.name;
    const propertyName = property.name;

    // 3️⃣ Save documents
    const savedFiles = await Promise.all(
      req.files.map(file => {
        return PropertyDocument.create({
          investor: investorId,
          investorName: investorName,
          property: propertyId || null,
          unit: unit ? unit._id : null,
          documentType: documentType || 'legal',
          fileUrl: `${protocol}://${host}/uploads/documents/${file.filename}`,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          uploadedBy: req.user._id
        });
      })
    );

    return res.status(200).json({
      success: true,
      message: 'Documents uploaded successfully',
      documents: savedFiles
    });

  } catch (error) {
    console.error('Upload property documents error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to upload documents'
    });
  }
};

//fetch docs for investor using propertyId
const fetchPropertyDocuments = async (req, res) => {
  const { investorId } = req.params;
  const { propertyId } = req.query;
  const { documentId } = req.query;

  try {
    // 1️⃣ Validate investor
    const investor = await User.findById(investorId);
    if (!investor || investor.role !== 'Investor') {
      return res.status(404).json({
        success: false,
        message: 'Investor not found'
      });
    }

    // 2️⃣ Fetch documents
    const document = await PropertyDocument.findById({ investor: investorId, property: propertyId, _id: documentId });
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'No documents found for this property'
      });
    }

    return res.status(200).json({
      success: true,
      document
    });

  } catch (error) {
    console.error('Fetch property documents error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch documents'
    });
  }
};

//delete document
const deletePropertyDocument = async (req, res) => {
  const { documentId } = req.params;

  try {
    // 1️⃣ Validate document
    const document = await PropertyDocument.findById(documentId);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // 2️⃣ Check if user is authorized to delete
    if (document.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this document'
      });
    }

    // 3️⃣ Delete document
    await PropertyDocument.deleteOne({ _id: documentId });

    return res.status(200).json({
      success: true,
      message: 'Document deleted successfully'
    });

  } catch (error) {
    console.error('Delete property document error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete document'
    });
  }
};

const getPendingPayments = async (req, res) => {
  const payments = await RentPaymentRequest.find({ status: 'pending' })
    .populate('tenant unit property');

  res.json({ success: true, payments });
};

const approvePayment = async (req, res) => {
  const adminId = req.user._id;
  const { paymentId } = req.params;
  const { adminNote } = req.body;

  const payment = await RentPaymentRequest.findById(paymentId);
  if (!payment || payment.status !== 'pending') {
    return res.status(400).json({ message: 'Invalid payment request' });
  }

  await Rent.create({
    tenant: payment.tenant,
    investor: payment.investor,
    property: payment.property,
    unit: payment.unit,
    tenancy: payment.tenancy,
    amount: payment.amountClaimed,
    rentDate: payment.rentDate,
    approvedBy: adminId
  });

  payment.status = 'approved';
  payment.adminNote = adminNote;
  payment.reviewedBy = adminId;
  payment.reviewedAt = new Date();
  await payment.save();

  res.json({ success: true, message: 'Payment approved' });
};

const rejectPayment = async (req, res) => {
  const { paymentId } = req.params;
  const { adminNote } = req.body;

  const payment = await RentPaymentRequest.findById(paymentId);
  if (!payment || payment.status !== 'pending') {
    return res.status(400).json({ message: 'Invalid payment request' });
  }

  payment.status = 'rejected';
  payment.adminNote = adminNote;
  payment.reviewedAt = new Date();
  await payment.save();

  res.json({ success: true, message: 'Payment rejected' });
};

module.exports = {
  createUnit,
  getUnitsByProperty,
  getAvailableUnits,
  uploadPropertyDocuments,
  assignUnitToInvestor,
  assignPropertyToInvestor,
  assignTenantsToUnit,
  updateUnit,
  deleteUnit,
  fetchPropertyDocuments,
  deletePropertyDocument,
  getPendingPayments,
  approvePayment,
  rejectPayment
};
