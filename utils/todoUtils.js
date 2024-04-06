const todoValidation = (todo)=>{
    return new Promise((resolve,reject)=>{
        if(!todo) return reject("Missing todo text");
        if(typeof todo !== "string") return reject("Todo is not a text");
        if(todo.length < 3 || todo.length > 100) return reject("Todo length should bw 3-100");
        // console.log("data validate")
       resolve();
    })

 
}
module.exports = {todoValidation};