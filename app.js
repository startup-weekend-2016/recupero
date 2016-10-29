//***Dependencies***
var express = require('express');
var app = express();
var pgp = require('pg-promise')();
var bodyParser = require('body-parser');
var bcrypt = require('bcryptjs');
var fs = require('fs');
//***Dependencies***

//***Database Connection***
var dbConnectionUsername="postgres";
var dbConnectionPassword="AeoKaNo93jaX!";
var dbConnectionDatabase="Hackathon";
var conString = "postgres://"+dbConnectionUsername+":"+dbConnectionPassword+"@localhost/"+dbConnectionDatabase;
//***Database Connection***
var client = pgp(conString);
// Debugging stuff
// console.log(process.env);
// console.log (pg);

//***App Configuration***
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); //for parsing application/x-www-form-urlencoded
//***App Configuration***

//***Server Start***
var server = app.listen(8000, function() {
  console.log("App is listening on http://localhost:%d", server.address().port);
});
var io = require('socket.io')(server);
//***Server Start***


//***Routing***
app.get('/', function (req, res) {
  console.log(req.connection.remoteAddress+" connected.");
  res.sendFile(__dirname + "/index.html");
});

app.get('/list', function (req, res) {
  console.log(req.connection.remoteAddress+" connected.");
  res.sendFile(__dirname + "/companyfilter.html");
});

app.get('*/img/:imagename', function (req, res) {
  res.sendFile(__dirname + "/img/"+req.params.imagename);
});

app.get('*/packages/:packagename', function (req, res) {
  res.sendFile(__dirname + "/packages/"+req.params.packagename);
});

app.get('*/scripts/:scriptname', function (req, res) {
  res.sendFile(__dirname + "/scripts/"+req.params.scriptname);
});

app.get('*/styles/:stylename', function (req, res) {
  res.sendFile(__dirname + "/styles/"+req.params.stylename);
});

app.get('*/fonts/:fontname', function (req, res) {
  res.sendFile(__dirname + "/fonts/"+req.params.fontname);
});

app.get('*/partials/:partialname', function (req, res) {
  res.sendFile(__dirname + "/partials/"+req.params.partialname);
});
//***Routing***

//***Regular Expressions***
function usernameRegex(username) {
  if(username.length < 3) {
    return("Username is too short!");
  } else if(username.length > 50) {
    return("Username is too long!");
  } else if(username.search(/[^a-zA-Z0-9\_\.]/) != -1) {
    return("In your username you can only use letters, numbers and the next set of symbols:\"., _\". ");
  }
  return("ok");
}

function passwordRegex(password) {
  if(password.length < 6) {
    return("Password is too short!");
  } else if(password.length > 50) {
    return("Password is too long!");
  } else if(password.search(/[^a-zA-Z0-9\!\@\#\$\*\_\+\.]/) != -1) {
    return("In your password you can only use letters, numbers and the next set of symbols:\"!, @, #, $, *, ., +, _\". ");
  }
  return("ok");
}
//***Regular Expressions***

//***Basic Functions***
var escapeRegExp;
(function () {
  // Referring to the table here:
  // https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/regexp
  // these characters should be escaped
  // \ ^ $ * + ? . ( ) | { } [ ]
  // These characters only have special meaning inside of brackets
  // they do not need to be escaped, but they MAY be escaped
  // without any adverse effects (to the best of my knowledge and casual testing)
  // : ! , = 
  // my test "~!@#$%^&*(){}[]`/=?+\|-_;:'\",<.>".match(/[\#]/g)

  var specials = [
        // order matters for these
          "-"
        , "["
        , "]"
        // order doesn't matter for any of these
        , "/"
        , "{"
        , "}"
        , "("
        , ")"
        , "*"
        , "+"
        , "?"
        , "."
        , "\\"
        , "^"
        , "$"
        , "|"
        , "="
      ]

      // I choose to escape every character with '\'
      // even though only some strictly require it when inside of []
    , regex = RegExp('[' + specials.join('\\') + ']', 'g')
    ;

  escapeRegExp = function (str) {
    return str.replace(regex, "\\$&");
  };

}());
//***Basic Functions***

//***Account Creation***
app.post('/creating', function (req, res) {

  var userdata=req.body;

  if(userdata.password==userdata.passwordVerif){

    passwordVerifyString=passwordRegex(userdata.password);
    usernameVerifyString=usernameRegex(userdata.username);

    if(usernameVerifyString!="ok"){
      res.send(usernameVerifyString);
    } else if(passwordVerifyString!="ok"){
      res.send(passwordVerifyString);
    }
    else{

      userdata.password = userdata.password.trim().replace(/\\(.)/mg); //Impossible to have "\" but better safe than sorry.
      var salt = bcrypt.genSaltSync(10);
      var hashedPassword = bcrypt.hashSync(userdata.password, salt);

      var db;

      client.connect()
        .then(function(obj){

          db=obj;

          /*
          /***OLD***
          function escapeCharactersOnPlus(string){
            for(var i=0;i<string.length;i++){
              if((string[i]=='_')||(string[i]=='.')){
                string = string.substr(0, i)+"\\"+string.substr(i);
                i++;
              }
            }
            return string;
          }
          */

          var escapedUsername = escapeRegExp(userdata.username);

          return db.query("SELECT * FROM users WHERE username ~* $1", ['^'+escapedUsername+'$']); //Check if user exists (case insensitive)

        }) 
        .then(function(rows){ 

          if(!rows.length){
             return db.query("INSERT INTO users (username,password) VALUES ($1,$2);",[userdata.username,hashedPassword]); //Registering is case sensitive
           }
           else{
            res.send("Username already exists!");
          }

        })
        .then(function(rows){

          if(rows!=undefined){
            res.send("Account created!");//To be replaced with actual logging in after register
          }

        }, function(reason){

          console.log(reason);

        })

      }
    }
    else{
      res.send("Passwords don't match.");
    }

})
//***Account Creation***


//***Account Creation***
app.post('/addSurvey', function (req, res) {

  var data=req.body;
  console.log(data.questions);
      var db;

      client.connect()
        .then(function(obj){

          db=obj;

          /*
          /***OLD***
          function escapeCharactersOnPlus(string){
            for(var i=0;i<string.length;i++){
              if((string[i]=='_')||(string[i]=='.')){
                string = string.substr(0, i)+"\\"+string.substr(i);
                i++;
              }
            }
            return string;
          }
          */


             return db.query("INSERT INTO surveys (title,description,questions,creator) VALUES ($1,$2,$3,$4);",[data.title,data.description,data.questions,data.creator]);

        })

      

})
//***Account Creation***



app.post('/loggingIn', function (req, res) {

  var userdata=req.body;
  
  if(userdata.password&&userdata.username){

    client.connect()
      .then(function(obj){

      db=obj;

      /*
      //***OLD***
      function escapeCharactersOnPlus(string){
        for(var i=0;i<string.length;i++){
          if((string[i]=='_')||(string[i]=='.')){
            string = string.substr(0, i)+"\\"+string.substr(i);
            i++;
          }
        }
        return string;
      }
      */

      var escapedUsername = escapeRegExp(userdata.username);

      return db.query("SELECT * FROM users WHERE username ~* $1", ['^'+escapedUsername+'$']); //Login is case insensitive

      }) 
      .then(function(rows){ 

        if(rows.length){
          bcrypt.compare(userdata.password,rows[0].password, function(err, pwdcheck) {

            if(err){
              console.log(err);
            }

            if(pwdcheck){
              res.send("Logged in.");//To be replaced with actual logging in
            }
            else{
              res.send("Username and password do not match.");
            }

          });
        }
        else{
          res.send("User doesn't exist.");
        }

      }, function(reason){

        console.log(reason);

      })
  
  }
  else{
    res.send("Don't leave the fields empty!")
  }


})


/*app.get('/graph/rooms/:room', function (req, res) {

  client.connect()
    .then(function(obj){
      db=obj;

      var roomtagWithoutPlus = req.params.room.replace(/\+/g, " ");
      var roomtagWithEscapedCharacters = escapeRegExp(roomtagWithoutPlus);

      return db.query("SELECT * FROM rooms WHERE roomname ~* $1",['^'+roomtagWithEscapedCharacters+'$']); //Check if user exists (case insensitive)

    })
    .then(function(rows){

      if(rows.length){
        res.send(rows);
      }
      else{
        res.send(0);
      }

    }, function(reason){

      console.log(reason);

    })

});*/ //FOR LATER USE WITH QUIZ


app.get('/user/:usertag', function (req, res) {

  client.connect()
    .then(function(obj){
      
      db=obj;

      /*
      //***OLD***
      function escapeCharactersOnPlus(string){
        for(var i=0;i<string.length;i++){
          if((string[i]=='_')||(string[i]=='.')){
            string = string.substr(0, i)+"\\"+string.substr(i);
            i++;
          }
        }
        return string;
      }
      */

      var escapedUsertag = escapeRegExp(req.params.usertag);

      return db.query("SELECT * FROM users WHERE username ~* $1", ['^'+escapedUsertag+'$']); //Check if user exists (case insensitive)

    }) 
    .then(function(rows){ 

      if(rows.length){
        res.send(rows[0]);
      }
      else{
        res.send("User doesn't exist");
      }

    }, function(reason){

      console.log(reason);

    })

});
//***Connecting to objects***

//***App Status Configuration***
app.use(function(req, res, next){
    if(res.status(404)){
      res.send("404");
      console.log("User "+req.connection.remoteAddress+" logged a 404 error");
  }
});
//***App Status Configuration***