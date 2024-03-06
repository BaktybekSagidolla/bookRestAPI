const userModel = require('../models/user');
const bcrypt = require('bcrypt');

const createUser = async (username, password, isAdmin) => {
   try {
       const hashedPassword = bcrypt.hashSync(password, 10);
       await userModel.create({ username, password: hashedPassword, isAdmin });
   }
   catch (error) {
       throw error;
   }
}

const getUsers = async () => {
   try {
       return await userModel.find();
   }
   catch (error) {
       throw error;
   }
}
const deleteUser = async (id) => {
    try {
         return await userModel.findByIdAndDelete(id);
    }
    catch (error) {
         throw error;
    }
}

const updateUser = async (id, username, password, isAdmin) => {
    try{
        const user = await userModel.findById(id);
        user.username = username;
        user.password = bcrypt.hashSync(password, 10);
        user.isAdmin = isAdmin;
        await user.save();
    }
    catch(error){
        throw error;
    }
}


module.exports = {
    createUser,
    getUsers,
    deleteUser,
    updateUser
}