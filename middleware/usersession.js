const islogin = (req,res,next)=>{
    if(req.session.user){
        res.redirect('/home')
    }else{
        next()
    }
}

const sessionCheck = (req,res,next)=>{
if(req.session.user){
    next()
    
}else{
    res.redirect('/login')
}
}

module.exports = {islogin,sessionCheck}