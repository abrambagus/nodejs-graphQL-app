const path = require("path");

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const multer = require("multer");

const grapqlHttp = require("graphql-http/lib/use/express");
const graphiql = require("express-graphiql-explorer");

const graphqlSchema = require("./graphql/schema");
const graphqlResolver = require("./graphql/resolvers");

const app = express();

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
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

// app.use(bodyParser.urlencoded()); // x-www-form-urlencoded
app.use(bodyParser.json());
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single("image")
);
app.use("/images", express.static(path.join(__dirname, "images")));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

app.use(
  "/graphiql",
  graphiql({
    graphQlEndpoint: "/graphql",
    defaultQuery: `query MyQuery {}`,
  })
);

app.all("/graphql", (req, res) =>
  grapqlHttp.createHandler({
    schema: graphqlSchema,
    rootValue: graphqlResolver,
    context: { req, res },
  })(req, res)
);

app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data;
  res.status(status).json({ message: message, data: data });
});

mongoose
  .connect(
    "mongodb+srv://abrambagus_db_user:Le8JaOB7qFK7b175@cluster0.d1jikx7.mongodb.net/messages?retryWrites=true&w=majority&appName=Cluster0&tlsAllowInvalidCertificates=true&tlsAllowInvalidHostnames=true"
  )
  .then(() => {
    app.listen(8080);
  })
  .catch((err) => console.log(err));
