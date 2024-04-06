window.onload = genrateTodos;


function genrateTodos(){
       axios.get('/read-item')
       .then(res=>{
        if(res.status !== 200){
            alert(res.message);
            return;
        }
        const todos = res.data.data;
          todos.map((item)=>{
            document.getElementById("item_list").innerHTML+= `  
                <li
                    class="list-group-item px-3 py-1 d-flex align-items-center flex-grow-1 border-0 bg-transparent justify-content-between">
                    <p class="lead fw-normal mb-0">${item.todo}</p>
                 <div>
                 <button id="${item._id}" class="edit-me btn btn-secondary btn-sm mr-1" >Edit</button>
                 <button id="${item._id}" class="delete-me btn btn-danger btn-sm mr-1">Delete</button>
                 </div> 
                </li>`
            })
        
        return;
       }).catch((err)=>{
        console.log(err);
       })


}

window.addEventListener('click',function (event){
    if(event.target.classList.contains("edit-me")){
        const newData = prompt("Enter new todo text");
        const todoId= event.target.getAttribute("id");
        
        axios.post("/edit-item",{newData,todoId})
        .then((res)=>{
          if(res.data.status !== 200){
            alert(res.data.message)
            return;
          }
          event.target.parentElement.parentElement.querySelector(".lead").innerHTML = newData;
        }).catch(error=>{
            console.log(error);
        })
            
    }else if(event.target.classList.contains("delete-me")){
         const todoId = event.target.getAttribute("id");
         axios.post("/delete-item",{todoId})
         .then((res)=>{
            this.alert(res.data.message);
         }).catch(error=>{
            console.log(error);
         })
    }
})