
const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');

//set the view engine to ejs
app.set('view engine', 'ejs');


//middleware

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'user_id',
  keys: ['key1', 'key2'],
  maxAge: 24 * 60 * 60 * 1000
}));

//allows external .css file
app.use(express.static(__dirname + '/views'));
/////Databases/////////////////////////////

let users = {
  "user1": {
    id: "userRandomID",
    email: "user@example.com",
    password: encrypt('abc')
  },
 "user2": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: encrypt('zxc')
  },
  "a": {
    id: 'a',
    email: 'a@a.com',
    password: encrypt('a')
  }
};

var urlDatabase = {
   user1: {"b2xVn2" : "http://www.lighthouselabs.ca"},
   user2: {"9sm5xK": "http://www.google.com"}
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

//checks if http protocol is present in urlstring
function httpCheck(longURL){
  if(longURL.includes('https') || longURL.includes('http')){
    return longURL;
  }else{
    const newLongUrl = "http://" + longURL;
    return newLongUrl;
  }
}

//checks if shorturl is in urldatabase
function shortURLcheck(link){
  for(let user in urlDatabase){
    for(let shortURL in urlDatabase[user]){
      if(link === shortURL){
        return urlDatabase[user][shortURL];
      }
    }
  }
}
//password hashing
function encrypt(password, userId) {
  return bcrypt.hashSync(password, 10);
}

//get requests/////////////////////////////////////
app.get("/", (req, res) => {
  if(req.session.user_id !== null){
    res.redirect("/urls");
  }else{
    res.redirect("/login");
  }
});

// registration page
app.get("/register", (req, res) => {
  if(req.session.user_id == null){
    let templateVars = {
      urls: urlDatabase,
      user: users[req.session.user_id]
    };
    res.render("urls_registration", templateVars);
  }else{
    res.redirect("/urls");
  }
});

//login page
app.get("/login", (req, res) => {
  if(req.session.user_id == null){
    let templateVars = {
      urls: urlDatabase,
      user: users[req.session.user_id]
    };
    res.render("urls_login", templateVars);
  }else{
    res.redirect("/urls");
  }
});

// url page
app.get("/urls", (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    user: users[req.session.user_id]
  };
  res.render("urls_index", templateVars);
});

// new link
app.get("/urls/new", (req, res) => {
  if(users[req.session.user_id]){
    let templateVars = {
      user: users[req.session.user_id]
    };
    res.render("urls_new", templateVars);
  }else{
    res.redirect("/login");
  }
});

//longurl page
app.get("/u/:shortURL", (req, res) => {
  let longURL = "";
  if(shortURLcheck(req.params.shortURL)){
    longURL = shortURLcheck(req.params.shortURL);
  }else{
    res.send("This shortURL does not exist!");
  }

  longURL = httpCheck(longURL);
  // console.log(longURL);
  if(longURL){
    res.redirect(longURL);
  }else{
    res.end("This URL cannot be found");
  }
});

//url id page
app.get("/urls/:id", (req, res) => {
  if(req.session.user_id !== null){
    if(urlDatabase[req.session.user_id][req.params.id] === undefined){
      res.send("This shortURL doesn't exist!");
    }else{
      const shortURL = req.params.id;
      let templateVars = {
        user: users[req.session.user_id],
        shortURL: shortURL,
        longURL: urlDatabase[req.session.user_id][shortURL]
      };
      res.render("urls_show", templateVars);
    }
  }else{
    res.send("Please log in first!");
  }
});

//post requests////////////////////////////////////////

//new user registration
app.post('/register', (req, res) => {
  let userId = generateRandomString();
  //es6 destructuring
  const {password, email, name} = req.body;
  const check = checkEmail(email) // true is email already exists
  if (!email) {
    res.send('Please enter a valid username and password.')
  } else if (check) {
    res.send('The username you have entered already exists. <a href="http://localhost:8080/register">Register</a>')
  } else {
      users[userId] = {
        id: userId,
        name,
        email,
        password: encrypt(password)
      };
      req.session.user_id = userId;
      res.redirect('/urls');
  }
});

app.post("/urls", (req, res) => {
  if(req.body.longURL){
    const random_id = generateRandomString();
    const userId = req.session.user_id;
    if(urlDatabase[userId] === undefined){
      urlDatabase[userId] = {};
      urlDatabase[userId][random_id] = req.body.longURL;
    }else{
      urlDatabase[userId][random_id] = req.body.longURL;
    }
    // console.log(urlDatabase);
    res.redirect(`/urls/${random_id}`);
  }
});

app.get("/urls/:id", (req, res) => {
  if(req.session.user_id !== null){
    if(urlDatabase[req.session.user_id][req.params.id] === undefined){
      res.send("This shortURL belongs to someone else or doesn't exist!");
    }else{
      const shortURL = req.params.id;
      let templateVars = {
        user: users[req.session.user_id],
        shortURL: shortURL,
        longURL: urlDatabase[req.session.user_id][shortURL]
      };
      res.render("urls_show", templateVars);
    }
  }else{
    res.send("Please log in!");
  }
});

//deletes a url from the users urls
app.post('/urls/:id/delete', (req, res) => {
  let url = urlDatabase[req.session.user_id][req.params.id];
  if (url) {
    delete urlDatabase[req.session.user_id][req.params.id];
    res.redirect('/urls');
  } else {
    res.send('The URL you are trying to access does not exist. Please type in an existing URL.');
  }
});

app.post("/urls/:id/edit", (req, res) => {
  if(req.body.longURL){
    if(urlDatabase[req.session.user_id][req.params.id]){
      urlDatabase[req.session.user_id][req.params.id] = req.body.longURL;
      // console.log(urlDatabase);
      res.redirect("/urls");
    }else{
      res.send("This link does not belong to you.");
    }
  }
});

app.post("/login", (req, res) =>{
  // console.log(req.body.email);
  if(users[checkEmail(req.body.email)] === undefined){
    res.send("Not a vaild email or password. Please try again! <a href='http://localhost:8080/login'>Login</a>");
  }else{
    const userCheck = users[checkEmail(req.body.email)];
    if(req.body.email === userCheck.email && bcrypt.compareSync(req.body.password, userCheck.password)){
      req.session.user_id = checkEmail(req.body.email);
      res.redirect("/urls");
    }else{
      res.status("403").send("Sorry either email or password is incorrect. <a href='http://localhost:8080/login'>Login</a>");
    }
    // console.log(users);
  }
});

//logout
app.post("/logout", (req, res) =>{
  req.session.user_id = null;
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});
