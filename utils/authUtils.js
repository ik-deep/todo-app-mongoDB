const userDataValidation = ({name, email, username, password})=>{
    return new Promise((resolve,reject)=>{
        // console.log(name, email, username, password);
       if(!username || !email || !password){
        reject("user data missing");
       }

       if(typeof username !== 'string') reject("username is not a text");
       if(typeof email !== 'string') reject("email is not a text");
       if(typeof password !== 'string') reject("password is not a text");

        resolve();
    })
}

const isEmail = (text) => {
  let emailCheck =  (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(text));
    return emailCheck;
  };

module.exports = {userDataValidation,isEmail};