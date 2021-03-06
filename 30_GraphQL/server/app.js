const path = require("path");
const Crypto = require("crypto");

require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const { graphqlHTTP } = require("express-graphql");
const cors = require("cors");

const graphqlSchema = require("./graphql/schema");
const graphqlResolvers = require("./graphql/resolvers");

const auth = require("./middleware/auth");

const { clearImage } = require("./util/file");

const app = express();

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images/");
  },
  filename: (req, file, cb) => {
    Crypto.randomBytes(8, (err, buff) => {
      if (err) {
        err.statusCode = 500;
        throw err;
      }

      const filename = "file-" + buff.toString("hex") + "-" + file.originalname;
      cb(null, filename);
    });
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

app.use(express.json());
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single("image")
);

app.use("/images", express.static(path.join(__dirname, "images")));

const corsOptions = {
  origin: "*",
  methods: "GET,POST,PUT,PATCH,DELETE",
  allowedHeaders: "Content-Type,Authorization",
};

// Using the cors module to set headers.
app.use(cors(corsOptions));

app.use((req, res, next) => {
  // res.setHeader('Access-Control-Allow-Origin', '*');

  // res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE');

  // res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  // SO THE OPTIONS REQUEST WILL NEVER MAKE IT TO THE GRAPHQL HANDLER.

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

// We use this to check that the user is authenticated.

app.use(auth);

app.put("/post-image", (req, res, next) => {
  if (!req.isAuth) {
    throw new Error("Not authenticated!");
  }
  if (!req.file) {
    return res.status(200).json({ message: "No file provided!" });
  }
  if (req.body.oldPath) {
    clearImage(req.body.oldPath);
  }
  return res
    .status(201)
    .json({ message: "File stored.", filePath: req.file.filename });
});

// For better testing set graphiql to true and this give us a special tools which allows us to see all the mutations and queries in a graphql setup.

// And since it requires to make a get request to /graphql we doesnt write app.post and instead use the keyword 'use'.

// But to actually see the queries we must add atleast one query even if its a dummy query.

// Graphql has another error called formatError which receives the error detected by graphql and allows us to return our own format.

// While using graphql we will get an error 405 because of the options request which is sent with every request. Since graphql declines any request which is not post.

// To fix it we use different handlers for OPTION request which always returns a 200 response.

app.use(
  "/graphql",
  graphqlHTTP({
    schema: graphqlSchema,
    rootValue: graphqlResolvers,
    graphiql: true,
    customFormatErrorFn(err) {
      // return err; // default

      // original errors will be set by express graphql when it detects an error thrown in our code either by us or some third party library.

      // if we have a technical error for example a missing character in our query or anything like that then it will not have that original error then we can just return the error which was generated by graphql.

      // But if we do have orginal error then we can extract useful information from it that we can add in other places.

      if (!err.originalError) {
        return err;
      }

      const data = err.originalError.data;

      const message = err.message || "An error occured";

      const code = err.originalError.code || 500;

      return { message: message, status: code, data: data };
    },
  })
);

app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data;
  res.status(status).json({
    message: message,
    data: data,
  });
});

// we can directly add the name of the database to the connection uri.
mongoose
  .connect(process.env.MONGO_DB_CONNECTION_URI)
  .then((result) => {
    app.listen(8080);
  })
  .catch((err) => {
    console.log(err);
  });
