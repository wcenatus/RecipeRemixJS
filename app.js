var db = require('./db');
var path = require('path');
var flash = require('express-flash-messages')
const express = require('express');
const session = require('express-session');
const bodyParser= require('body-parser')
const TWO_HOURS = 1000 * 60 * 60 * 2
const{
    PORT = 3000,
    NODE_ENV = 'development',

    SESS_SECRET = 'shh!quiet,it\'asecret!',
    SESS_NAME = 'sid',
    SESS_LIFEIME = TWO_HOURS
} = process.env
const IN_PROD = NODE_ENV === 'production'
//TODO DB
const users = [
    {id:1,name:'Alex',email:'alex@gmail.com',password:'abc'},
    {id:2,name:'Max',email:'max@gmail.com',password:'abc'},
    {id:3,name:'Hagard',email:'hagard@gmail.com',password:'abc'},
    {id:4,name:'John',email:'JohnSmith@gmail.com',password:'abc'}
]

const app = express()
app.use(flash())
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(__dirname + '/public'));

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(session({
    name: SESS_NAME,
    resave: false,
    saveUninitialized: false,
    secret:SESS_SECRET,
    cookie:{
        maxAge: SESS_LIFEIME,
        sameSite: true, // "can be strict"
        secure: IN_PROD
    }
}));

const redirectLogin = (req,res,next) =>{
    if (!req.session.userId){
        res.redirect('/login')
    }else{
        next()
    }
}
const redirectHome = (req,res,next) =>{
    if (!req.session.userId){
        res.redirect('/home')
    }else{
        next()
    }
}
app.use((req,res,next) => {
    const {userId} = req.session
    if(userId){
        res.locals.user = users.find(user => user.id === userId)
    }
    next()
})

//ROUTES

app.get('/', (req, res) =>{
    const { userId } = req.session
    console.log(userId);
    res.send(`
        <h1>Welcome!</h1>
        ${userId ? `
        <a href='/home'>Home</a>
        <form method='post' action='logout'>
            <button>Logout</button>
        </form>
        `:`
        <a href='/login'>Login</a>
        <a href='/register'>Register</a>
        `}
    `)

});
app.get('/home', redirectLogin, (req, res) =>{
    const { user } =res.locals
    console.log(req.session)
    res.send(`
    <h1>Home</h1>
    <a href='/'>Main</a>
    <ul>
        <li>Name:${req.session.fname}</li>
        <li>Email:${req.session.email}</li>
    </ul>
    `)
});
app.get('/profile/:user_id', (req,res) =>{
    var user_id = req.params.user_id;

    db.query('SELECT * FROM users WHERE uid = ?', [user_id], function(error, results, fields) {

        console.log(results);

        res.render('user/profile',{
            email: results[0].email,
            fname: results[0].fname
        })
    });
});
app.get('/login',(req, res) =>{
    res.render('user/login')
});
app.get('/register',(req, res) =>{
    res.render('user/register')

});
app.post('/login', (req, res) =>{

    const { email, password } = req.body //pulls name="email" from html

    if(email && password){
        db.query('SELECT * FROM users WHERE email = ? AND password = ?', [email, password], function(error, results, fields) {
			if (results.length > 0) {
                console.log(results)
                req.session.userId = results[0].uid
                req.session.email = results[0].email
                req.session.type = results[0].type
                req.session.fname = results[0].fname
                req.session.lname = results[0].lname
                res.redirect('/home');
            }else{
                req.flash('message','Incorrect Username and/or Password!');
                res.render('user/login')
            }
            res.end();
        });
    }else {
		res.send('Please enter Username and Password!');
		res.end();
	}
});

app.post('/register', async (req, res) =>{
  const { fname,lname,email,password } = req.body

    try{
        if(fname && lname && email && password){
            db.query('INSERT INTO users(fname,lname,email,password) VALUES(?, ?, ?, ?)', [fname, lname, email, password], function(error, results, fields) {
                if (error) throw error;
                console.log("successfully inserted")
            });
            res.redirect('/home');
        }else{
            res.send('Incorrect or empty fields')
        }
        res.end();
    }catch{
        console.log('query error')
    }
});
app.post('/logout', redirectLogin, (req, res) =>{

    req.session.destroy(err => {
        if(err){
            return res.redirect('/home')
        }
        res.clearCookie(SESS_NAME)
        res.redirect('/login')
    })

});

app.listen(PORT, () => console.log(
    `http://localhost:${PORT}`
));