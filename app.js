// Peter Harlan
//Bring in express and my sql
const express = require('express');
const mysql = require('mysql');
//To redirect pages
const path = require('path');
//Bring in handle bars to generate html content
const exphbs = require('express-handlebars');
//Bring in expressValidator and sessions
const session = require('express-session');
const bodyParser = require('body-parser'); // parser for Post responses
var MySQLStore = require('express-mysql-session')(session);

// Database connection credentials
var options = {
    host: "your host",
    user: "user name",
    password: "password",
    database: "database"
};

// Make database connection
var db = mysql.createConnection(options);

//Connect to SQL database
db.connect(function(err){
    if(err){console.log("No database connection");}
    else{console.log("Connected!");}
});

//Create express server
const app = express();

var sessionStore = new MySQLStore(options);
app.use(session({
    key: 'key',
    secret: 'Some long hash like aklsjdfadldafssfjalsfj',
    store: tableName,
    resave: false,
    saveUninitialized: false
}));

//Body parser for jason
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

//Layout handle bars with the defaultLayout as main
app.engine('handlebars', exphbs({defaultLayout:'main'}));
app.set('view engine', 'handlebars');

//Allows express to grab static contents such as images, CSS, and local js files
app.use(express.static('public'));

//Get index page
app.get('/', function (req, res) {
    //title: tab title, fixedTop: fixed navbar, loggedIn: displays log out button
    res.render('index', {
        title: "UrVoice Home", 
        fixedTop: "fixed-top", 
        loggedIn: req.session.loggedIn
    });
});

//Sign Up
app.get('/signUp', function (req, res) {
    //title: tab title, loggedIn: displays log out button
    res.render('signUp', {
        title: "UrVoice Sign Up", 
        fixedTop: "fixed-top", 
        loggedIn: req.session.loggedIn
    });
});

//Create polls
app.get('/createPolls', function (req, res) {
    if (!req.session.email){
        res.redirect("/pleaseLogIn");
    }
    else{
        //title: tab title
        res.render('createPolls', {
            // Tab title
            title: "UrVoice Create Polls",
            // Checks if the user is logged in 
            loggedIn: req.session.loggedIn
        });
    }
});

// Tells the user please log in 
app.get("/pleaseLogIn", function(req, res){
    res.render('message', {
        title: "UrVoice Sorry", 
        message: "Please log in or sign up to continue...", 
        fixedTop: "fixed-top", 
        loggedIn: req.session.loggedIn
    });
});

// Displays page not found
app.get('/404',function(req, res){
    //Title for tab title, message: message to users, fixedTop: fixed navbar
    res.render('message', {
        title: "UrVoice 404", 
        message: "404: Page not found", 
        fixedTop: "fixed-top", 
        loggedIn: req.session.loggedIn
    });
});

//Add to registeration table
app.post("/register", function (req, res) {
    //Grabs the data
    let post = req.body;
    //Create sql statement
    let sql = "INSERT INTO users SET ?";
    //perform the query
    let query = db.query(sql, post, (err, result) => {
        if(err){res.redirect("/404");}
        else{
            console.log(result);
            res.render('message', {
                title: "UrVoice Confirm", 
                message: "Account creation successful!", 
                fixedTop: "fixed-top", 
                loggedIn: req.session.loggedIn
            });
        }
    });
});

// log into account
app.post("/login", function (req, res) {
    var email = req.body.email;
    var password = req.body.password;
    
    let sql = 'SELECT * FROM users WHERE email ="' + email + '" AND password="' + password + '"';
    let query = db.query(sql, (err, results) => {
        if (err) {
            console.log(err);
            res.send('Log in failure');
        } else if (Object.keys(results).length === 0)
             res.render('message', {title: "UrVoice Confirm", message: "User not found!", fixedTop: "fixed-top", loggedIn: req.session.loggedIn});
        else {
            req.session.email = results[0]["email"];
            req.session.userID = results[0]["userID"];
            req.session.loggedIn = true;
            res.render('index', {
                title: "UrVoice Home", 
                fixedTop: "fixed-top", 
                loggedIn: req.session.loggedIn
            });
        }
    });
});

//Log out, destroy session and return to homepage
app.get("/logOut", function (req, res) {
    // Destroy session data
    req.session.destroy(); 
    // Return to homepage
    res.redirect("/");
});

// Submit a poll
app.post("/submitPoll", function (req, res) {
    // If user is not logged in
    if (!req.session.email){
        res.redirect("/pleaseLogIn");
    }else{
        // Grabs variable from post
        var pollQuestion = req.body.question;
        var userID = req.session.userID;

        // Insert poll into database the poll question
        let sql1 = 'INSERT INTO poll (pollQuestion, userID) VALUES (?,?)';
        let query1 = db.query(sql1,[pollQuestion, userID], (err, results) => {
            if(err){res.redirect("/404");}
            else {
                //Grabs the id of the recently submitted question
                let sql2= 'SELECT max(questionID) AS questionID FROM poll WHERE pollQuestion  = ? AND userID = ?'
                let query2 = db.query(sql2, [pollQuestion, userID], (err2, results2)=>{
                    if(err2){res.redirect("/404");}
                    else{
                        //Get the poll ID, used to add the option ID
                        var pollID = results2[0].questionID;
                        console.log("Inserting Question Option Values: ");

                        // Insert poll options into databse
                        for (var i = 0; i < req.body.option.length; i++) {
                            // Checks to see if there is a value in the option
                            if(req.body.option[i] !== "")
                            {
                                console.log(req.body.option[i]); 
                                let sql3 = 'INSERT INTO question_options (questionID, optionValue, voteCount) VALUES (?,?,?)';
                                let query3 = db.query(sql3,[pollID, req.body.option[i], 0], (err3, results3) => {
                                    if(err3){res.redirect("/404");}
                                });
                            }
                        }
                    }
                });
                // Send user poll crated message
                res.render('message', {
                    title: "UrVoice Poll Created", 
                    message: "Poll created", 
                    fixedTop: "fixed-top", 
                    loggedIn: req.session.loggedIn
                });
            }
        });
    }
});

//Get all polls
app.get("/allPolls", function (req, res) {
    
    //checks if user is logged in
    if (!req.session.email){
        res.redirect("/pleaseLogIn");
    }
    else{
        let sql = 'SELECT * FROM poll';
        let query = db.query(sql, (err, results) => {
            if(err){res.redirect("/404");}
            else {
                // Return results of all polls
                res.render('polls', {
                    // Title to the tab
                    title: "UrVoice All Polls", 
                    // Checks if user is logged in 
                    loggedIn: req.session.loggedIn, 
                    // h1 title for page
                    pollType: "All Polls",
                    polls: results
                });
            }
        });
    }
});

//Get a specific poll with a questionID of id
app.get('/vote/:id', (req, res) => {
    questionID = req.params.id;
    let sql = "SELECT sub.*FROM (SELECT poll.questionID, poll.pollQuestion, question_options.optionID, question_options.optionValue FROM poll JOIN question_options ON question_options.questionID = poll.questionID) AS sub WHERE questionID = ?";

    let query = db.query(sql, questionID, (err, result) => {
        if(err){res.redirect("/404");}
        else{
            if (!req.session.email){
                res.redirect("/pleaseLogIn");
            }
            else{
                res.render('vote', {
                    title: "UrVoice Vote", 
                    loggedIn: req.session.loggedIn,
                    polls: result
                });
            } 
        }
    });
});

// Get all your polls
app.get("/yourPolls", function (req, res) {
    //checks if user is logged in
    if (!req.session.email){
        res.redirect("/pleaseLogIn");
    }
    else{
        // Select all the polls associated with the user ID
        let sql = 'SELECT * FROM poll where userID = ?';
        let query = db.query(sql, req.session.userID, (err, results) => {
            if(err){res.redirect("/404");}
            else {
                // Return results of all polls
                res.render('polls', {
                    // Title to the tab
                    title: "UrVoice Your Polls", 
                    // Checks if user is logged in 
                    loggedIn: req.session.loggedIn, 
                    // h1 title for page
                    pollType: "Your Polls",
                    polls: results
                });
            }
        });
    }
});

// Allows the user to submit a vote on a poll
app.post("/submitVote", function (req, res) {
    //If user is not logged in
    if (!req.session.email){
        res.redirect("/pleaseLogIn");
    }
    else{
        // Grab the variables
        var optionID = req.body.optionID;
        var questionID = req.body.questionID;
        // Add one to the vote count
        let sql = "UPDATE question_options SET voteCount = voteCount + 1 WHERE optionID = ?"
        let query = db.query(sql, optionID, (err, results) => {
            if(err){res.redirect("/404");}
            else{
                // Return results of one particular poll
                res.redirect('/results/'+questionID);
            }
        });
    }
});

// Grabs the results of a poll
app.get("/results/:id", function (req, res) {
    // If user is not logged in 
    if (!req.session.email){
        res.redirect("/pleaseLogIn");
    }
    else{
        // Grab question ID
        var questionID = req.params.id;
        // Return the user to the poll with the corrisponding question ID
        let sql = "SELECT sub.* FROM(SELECT optionID, optionValue, voteCount, pollQuestion, poll.questionID FROM question_options JOIN poll ON question_options.questionID = poll.questionID ) AS sub WHERE questionID = ?"
        let query = db.query(sql, questionID, (err, results) => {
            if(err){res.redirect("/404");}
            else{
                console.log(results);
                res.render('results', {
                    title: "UrVoice Results", 
                    loggedIn: req.session.loggedIn,
                    pollResults: results,
                });
            }
        });
    }
});
//Start express server on port 3000
app.listen(process.env.PORT || '3000', () => {
    console.log('Server started on port 3000');
});
