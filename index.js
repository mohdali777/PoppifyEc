const express = require("express")
const path = require('path')
const mongoose = require("./db/connect.js")
const env = require("dotenv").config()
const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

app.get("/",(req,res)=>{
res.send("haiiii")
})
mongoose().catch(err => {
    console.error("Error connecting to MongoDB:", err);
  });
  
app.listen(process.env.PORT,()=>{
    console.log("running");
    
})