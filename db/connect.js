const mongoose = require('mongoose');
const env = require("dotenv").config()
let main = async function() {
  try{
    await mongoose.connect(process.env.MONGO_CONNECT);
  }catch(err){
console.log(err);

  }
}
module.exports = main;