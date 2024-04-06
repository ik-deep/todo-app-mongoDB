const isAuth = (req,res,next) =>{
   if(req.session.isAuth){
       next();
   }else{
       return res.send({
        status:401,
        message:"Session expire, Login again",

       })
   }
}


module.exports = {isAuth};