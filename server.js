const express = require("express");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
require("dotenv").config();
const bcrypt = require("bcryptjs");
const session = require("express-session");
const mongodbSession = require("connect-mongodb-session")(session);

//file import
const { userDataValidation, isEmail } = require("./utils/authUtils");
const userModel = require("./models/userModel");
const { isAuth } = require("./middlewares/authMiddleware");
const todoModel = require("./models/todoModel");
const { todoValidation } = require("./utils/todoUtils");

const app = express();
const PORT = process.env.PORT;
const store = new mongodbSession({
  uri: process.env.MONGO_URI,
  collection: "sessions",
});

//middleware
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: false,
    store,
  })
);
app.use(express.static("public"));


//db connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MONGODB connected successfully");
  })
  .catch((error) => {
    console.log(error);
  });

//API
app.get("/", (req, res) => {
  return res.send("Todo server is running....");
});

app.get("/login", (req, res) => {
  return res.render("loginPage");
});
app.post("/login", async (req, res) => {
  const { loginId, password } = req.body;

  if (!loginId || !password) return res.status(400).json("Credential missing!");

  try {
    //find the user with loginId
    let userDb;
    if (isEmail(loginId)) {
      userDb = await userModel.findOne({ email: loginId });
    } else {
      userDb = await userModel.findOne({ username: loginId });
    }
    if (!userDb) {
      return res.status(400).json("User not found");
    }
    //password comparision
    const isMatch = await bcrypt.compare(password, userDb.password);
    if (!isMatch) {
      return res.status(400).json("Incorrect Password!");
    }
    req.session.isAuth = true;
    req.session.user = {
      userId: userDb._id,
      username: userDb.username,
      email: userDb.email,
    };
    return res.redirect("/dashboard");
  } catch (error) {
    return res.send({
      status: 500,
      message: "Internal server error",
      error: error,
    });
  }
});

app.get("/register", (req, res) => {
  return res.render("registerPage");
});

app.post("/register", async (req, res) => {
  const { name, email, username, password } = req.body;

  //data validation
  try {
    await userDataValidation({ name, email, username, password });
  } catch (error) {
    return res.status(400).json(error);
  }

  //email and username exist or not

  const userEmailExist = await userModel.findOne({ email });
  //   console.log(userEmailExist);
  if (userEmailExist) {
    return res.send({
      status: 400,
      message: "Email already exist",
    });
  }
  const userNameExist = await userModel.findOne({ username });
  //   console.log(userEmailExist);
  if (userNameExist) {
    return res.send({
      status: 400,
      message: "Username already exist",
    });
  }

  //hashed the password
  const hashedPassword = await bcrypt.hash(
    password,
    parseInt(process.env.SALT)
  );

  const userObj = new userModel({
    name,
    email,
    username,
    password: hashedPassword,
  });

  try {
    const userDb = await userObj.save();
    // return res.status(201).json("Registration successfull.");
    return res.redirect("/login");
  } catch (error) {
    return res.send({
      status: 500,
      message: "Internal server error",
      error: error,
    });
  }
});

app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json("Logout unsuccessfull");
    return res.redirect("/login");
  });
});

app.post("/logout_from_all_devices", isAuth, async (req, res) => {
  const username = req.session.user.username;

  const sessionSchema = new Schema({ _id: String }, { strict: false });
  const sessionModel = mongoose.model("session", sessionSchema);
  try {
    const deleteDb = await sessionModel.deleteMany({
      "session.user.username": username,
    });
    console.log(deleteDb);
    return res.redirect("/login");
  } catch (error) {
    return res.send({
      status: 500,
      message: "Internal server error",
      error: error,
    });
  }
});

app.get("/dashboard", isAuth, (req, res) => {
  return res.render("dashboardPage");
});

app.post("/create-item", isAuth, async (req, res) => {
  const todoText = req.body.todo;
  const username = req.session.user.username;
  console.log(username);
  //data validation
  try {
    await todoValidation(todoText);
  } catch (error) {
    res.send({
      status: 400,
      error: error,
    });
  }

  const todoObj = new todoModel({
    todo: todoText,
    username: username,
  });

  try {
    const todoDb = await todoObj.save();
    return res.redirect("/dashboard")
    //  res.send({
    //   status: 201,
    //   message: "Todo created successfully",
    //   data: todoDb,
    // });
  } catch (error) {
    return res.send({
      status: 500,
      message: "Internal server error",
      error: error,
    });
  }
});

//read todo
app.get("/read-item", isAuth, async (req, res) => {
  const username = req.session.user.username;
  try {
    const todoDb = await todoModel.find({ username });
    if(todoDb.length === 0){
      return res.send({
        status: 400,
        message: "no todo found",
      });
    }
  return  res.send({
      status: 201,
      message: "read success",
      data: todoDb,
    });
  } catch (error) {
    return res.send({
      status: 500,
      message: "Internal server error",
      error: error,
    });
  }
});

//edit todo
app.post("/edit-item", isAuth, async (req, res) => {
  const { todoId, newItem } = req.body;
  const username = req.session.user.username;

  //data validation
//   try {
//  await todoValidation(newItem);
//   } catch (error) {
//     res.send({
//       status: 400,
//       message: error,
//     });
  // }

  try {
    // const todoDb = await todoModel.findOne({_id:todoId});

    const itemEdited = await todoModel.updateOne(
      { _id: todoId },
      { todo: newItem }
    );
    res.send({
      status: 200,
      message: "item edited success",
      data: itemEdited,
    });
  } catch (error) {
    return res.send({
      status: 500,
      message: "Internal server error",
      error: error,
    });
  }
});

app.post("/delete-item",isAuth,async (req,res)=>{
  const { todoId } = req.body;

  try{
    const deletedItem = await todoModel.deleteOne({_id:todoId});
 res.send({
  status:201,
  message:"Todo item deleted",
  
 })
  }catch(error){
    res.send({
      status:201,
      message:"Some error has been occured",
      error:error
    })
  }
})

app.listen(PORT, () => {
  console.log(`server is running on PORT:${PORT}`);
});
