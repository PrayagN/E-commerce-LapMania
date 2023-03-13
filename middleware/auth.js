const User = require('../models/userModel');

const isLogin = async(req,res,next)=>{
    try {
        if(req.session.user_id){
            const userData = await User.findById({_id:req.session.user_id});
            if(userData.is_verified === 1){
                next()
            }else{
                res.render('login',{message:"Sorry,you are blocked by admin..."});
            }  
               
        }else{
            res.redirect('/')
        }
       
    } catch (error) {
        console.log(error.message);
    }
}

const isLogout = async(req,res,next)=>{
    try {
        if(req.session.user_id){
            res.redirect('/home')
        }else{
            next()
        } 
            
        
    } catch (error) {
        console.log(error.message);
    }
}

module.exports ={
    isLogin,
    isLogout
}