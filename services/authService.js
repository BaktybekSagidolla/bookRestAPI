const userModel = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const {env} = require("ejs/ejs");
const {model} = require("mongoose");

const login = async(user) => {
    const username = user.name;
    const password = user.password;
    const existsUser = await userModel.findOne({username: username});
    if(!existsUser)
        throw new Error('Invalid username');
    const match = await bcrypt.compare(password, existsUser.password);
    if(!match)
        throw new Error('Invalid password');
    return existsUser.isAdmin;
}

const register = async(user) => {
    const username = user.name;
    const password = user.password;
    const existsUser = await userModel.findOne({username: username});
    if (existsUser)
        throw new Error('Username already exists');
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new userModel({username: username, password: hashedPassword});
    await newUser.save();
    return newUser;
}

module.exports = {
    login,
    register
}