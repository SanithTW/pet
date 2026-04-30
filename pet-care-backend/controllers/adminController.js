const User = require('../models/User');

const getAdminStats = async (req, res) => {
  try {
    const totalMembers = await User.countDocuments({ role: { $in: ['owner', 'vet', 'admin'] } });
    const totalOwners = await User.countDocuments({ role: 'owner' });
    const totalVets = await User.countDocuments({ role: 'vet' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });

    res.status(200).json({
      totalMembers,
      totalOwners,
      totalVets,
      totalAdmins,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { getAdminStats };
