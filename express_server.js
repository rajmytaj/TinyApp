var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080
var cookieParser = require('cookie-parser');
app.use(cookieParser());

//set the view engine to ejs
app.set('view engine', 'ejs');

/////Databases/////////////////////////////

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  },
  "a": {
    id: 'a',
    email: 'a@a.com',
    password: 'a'
  }
}

const urlDatabase = {
   "b2xVn2": "http://www.lighthouselabs.ca",
   "9sm5xK": "http://www.google.com"
 }

///////functions//////////////////////////

//generates random alphanumeric string for individual user ids and shortend URLs
function generateRandomString() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 6; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
};

//Checks if email already exists in database
function checkEmail(email){
  for(let id in users){
    if(users[id].email === email){
      return id;
    };
  }
  return false;
};

//check email and password combo
// function getUser(){
//   for(let id in users){
//     if(users[id].email === req.body.email && users[id].password == req.body.password){
//       res.cookie(user_id, user.id)
//       res.redirect('/');
//     }else{
//       res.send(404);
//     }
//   }
//   return undefined;
// };

//checks if user_id and password matches
// function isAuthenticated = (req,res,next)=>{
//   if (not authenticated) {
//     return res.redirect('/login');
//   }
//   else {
//     return next();
//   }
// };

///////////////////////////////////////////

app.get("/", (req, res) => {
  // res.end("Hello!");
  res.redirect("/urls/index");
});

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));


app.get('/test', (req, res) => {
  res.send('test');
})

app.post("/urls", (req, res) => {

  let shortURL = generateRandomString();
  let longURL = req.body.longURL

  // Add long url to database
  urlDatabase[shortURL] = longURL;

  res.redirect(`urls/${ shortURL }`);

});
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id]
  res.redirect("/urls");
});

app.post("/urls/:id", (req, res) => { //add isAuthenticated as argument
  urlDatabase[req.params.id] = req.body.URL;
  res.redirect("/urls");
});


app.post("/login", (req, res) => {
  const {email, password} = req.body;
    if(users[checkEmail(email)].email === req.body.email && users[checkEmail(email)].password == req.body.password){
      res.cookie("user_id"  , checkEmail(email))
      res.redirect('/');
    }else{
      res.send(404);
    };
  });
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
})
////////////////////////////////////////////
//////////registration related stuff
app.get("/register", (req, res) => {
  res.render("urls_registration")
});

app.post("/register", (req, res) => {
  let id = generateRandomString();
  //es6 destructuring equiv to req.body.email and req.body.password
  const {email, password} = req.body;

  if(!email || !password){
    res.send(404);
  }else if (checkEmail(email)) {
    res.send(404);
  }else{
    // set a cookie with key of 'user_id' and value to rand string from above
    res.cookie('user_id', id );

    // change the user db by adding the new user info which came from
    // signup form
    users[id] = {
      id : id,
      email : email,
      password : password
    };

    // respond back to client with urls template
    // and include the new cookie info
    res.redirect("/urls");
  }

});

/////////////////////////////////////////////
app.get("/login", (req,res) => {
  let templateVars = {
    username: req.cookies.user_id
  }
  res.render("urls_login", templateVars);
});


app.get("/urls", (req, res) => {
  let templateVars = {
    url: urlDatabase,
    user: users[req.cookies.user_id],
    username: req.cookies.user_id
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    username: req.cookies.user_id,
    users:users};
  res.render("urls_new", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL]
  if (longURL) {
    res.redirect(longURL);
  } else {
    res.send(404)
  }
});

app.get("/urls/:id", (req, res) => {
  let templateVars = {
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id],
    username: req.cookies.user_id
    // users:users
  };
  res.render("urls_show", templateVars);

});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
