const islogin = (req,res,next)=>{
    if(req.session.admin){
        res.redirect('/admin/home')
    }else{
        next()
    }
}

const sessionCheck = (req,res,next)=>{
if(req.session.admin){
    next()
    
}else{
    res.redirect('/admin/login')
}
}

module.exports = {islogin,sessionCheck}