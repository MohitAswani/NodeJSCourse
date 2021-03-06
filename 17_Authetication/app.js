const path = require('path');

const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csurf = require('csurf');
const flash = require('connect-flash');

const User = require('./models/user');

const errorController = require('./controllers/error');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

const MONGODB_URI = 'mongodb+srv://aswanim96:Mohit1234@cluster0.o2of3.mongodb.net/myFirstDatabase?retryWrites=true&w=majority';

const app = express();

const store = new MongoDBStore({
    uri: MONGODB_URI,
    collection: 'sessions',
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000)
});

// To the below constructor we can pass in some options which will configure somethings.

// For example we can tell it to store the secret that is used for assigning the token should be stored in a cookie rather than a session but we won't do that here.

const csrfprotection = csurf({});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(session({
    secret: 'secret key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        httponly: true,
        store: store
    },
    store: store
}));

// Add csrf middle only after the session has been initialized coz it will make use of the session.

// So now csrf protection is generally enable but we will also need to add somethings to our views.

// So now any non-get requests this package will look for the existense of csrf toke in our views.

app.use(csrfprotection);

// We need to initialize flash and we must initialize only after we initialize our session.

app.use(flash());

app.set('view engine', 'ejs');

app.set('views', 'views');

app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
    if (req.session.user) {

        User.findById(req.session.user._id)
            .then(user => {
                req.user = user;
                next();
            })
            .catch(err => {
                console.log(err);
            });
    }
    else {
        next();
    }
});

// To tell express to pass something to every view that is rendered we do the following.

// To do that we can use the special field provided by express which is the locals field which allows us to set local variables that are passed into the views, local simply because they will only exist in the views in which they are rendered.

// So now for every request that is executed these fields will be set for the views that are rendered.

// But we will still need to pass the _csrf field for every post request.

app.use((req, res, next) => {
    res.locals.isAuth = req.session.isAuth;
    res.locals.csrfToken = req.csrfToken();
    next();
});

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.use(errorController.getError);

mongoose.connect(MONGODB_URI)
    .then(result => {
        console.log('Connection successful');
        app.listen(3000);
    })
    .catch(err => {
        console.log(err);
    });