const {User} = require("../model/user/usermodel")

const islogin = async (req,res,next)=>{
    if(req.session.user ){
        res.redirect('/home')
    }else{
        next()
    }
}

const sessionCheck = async (req, res, next) => {
    try {
        const userId = req.session.userId;
        if (!userId || userId == null) {
          return  res.render("users/login",{message:null})
        }
        const user = await User.findById(userId);
        if (user && user.status === "blocked") {
            req.session.user = false;
            return res.render("users/login",{message:null})
        }
        if (req.session.user) {
            return next();
        } else {
            return res.redirect('/login');
        }
    } catch (error) {
        console.error("Error in sessionCheck middleware:", error);
        return res.redirect('/login');
    }
};

module.exports = {islogin,sessionCheck}