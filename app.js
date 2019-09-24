var db = require('./db');
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

app.set('view engine', 'pug');
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
app.get('/profile', (req,res) =>{
    
})
app.get('/login',(req, res) =>{
    res.render('login')
});
app.get('/register',(req, res) =>{
    res.send(`
    <h1>Register</h1>
    <form method='post' action='/register'>
        <input type='text' name='name' placeholder='Name' required/>
        <input type='email' name='email' placeholder='Email' required/>
        <input type='password' name='password' placeholder='Password' required/>
        <input type='submit'/>
    </form>
    <a href='/login'>Login</a>
    `)

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
                res.send('Incorrect Username and/or Password!');
            }
            res.end();
        });
    }else {
		res.send('Please enter Username and Password!');
		res.end();
	}
});

app.post('/register', (req, res) =>{
    const { name,email,password } = req.body

    if (name && email && password){
        const exists = users.some(
            user => user.email === email
        )
        if(!exists){
            const user ={
                id: users.length + 1,
                name,
                email,
                password
            }
            users.push(user)
            req.session.userId = user.id

            return res.redirect('/home')
        }
    }
    return res.redirect('/register') //TODO flash an error that user exists or email to short

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