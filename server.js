const express = require("express");
const app = express();
const cors = require("cors");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
dotenv.config();
const userService = require("./user-service.js");
const passport = require("passport");
const passportJwt = require("passport-jwt");

const HTTP_PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(cors());

// set up
let ExtractJwt = passportJwt.ExtractJwt;
let JwtStrategy = passportJwt.Strategy;

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme("jwt"),
  secretOrKey: process.env.JWT_SECRET, // Use secret from environment variable
};

let strategy = new JwtStrategy(jwtOptions, function (jwt_payload, next) {
  console.log("payload received", jwt_payload);

  if (jwt_payload) {
    // The following will ensure that all routes using
    // passport.authenticate have a req.user._id, req.user.userName, req.user.fullName & req.user.role values
    // that matches the request payload data
    next(null, {
      _id: jwt_payload._id,
      userName: jwt_payload.userName,
    });
  } else {
    next(null, false);
  }
});

// tell passport to use our "strategy"
passport.use(strategy);

// add passport as application-level middleware
app.use(passport.initialize());

app.post("/api/user/register", (req, res) => {
  userService
    .registerUser(req.body)
    .then((msg) => {
      res.json({ message: msg });
    })
    .catch((msg) => {
      res.status(422).json({ message: msg });
    });
});

app.post("/api/user/login", (req, res) => {
  userService
    .checkUser(req.body)
    .then((user) => {
      let payload = {
        _id: user._id,
        userName: user.userName,
      };

      let token = jwt.sign(payload, process.env.JWT_SECRET); // Sign with secret from environment

      res.json({ message: "login successful", token: token });
    })
    .catch((msg) => {
      res.status(422).json({ message: msg });
    });
});

const authenticate = passport.authenticate("jwt", { session: false });

app.get("/api/user/favourites", authenticate, (req, res) => {
  userService
    .getFavourites(req.user._id)
    .then((data) => {
      res.json(data);
    })
    .catch((msg) => {
      res.status(422).json({ error: msg });
    });
});

app.put("/api/user/favourites/:id", authenticate, (req, res) => {
  userService
    .addFavourite(req.user._id, req.params.id)
    .then((data) => {
      res.json(data);
    })
    .catch((msg) => {
      res.status(422).json({ error: msg });
    });
});

app.delete("/api/user/favourites/:id", authenticate, (req, res) => {
  userService
    .removeFavourite(req.user._id, req.params.id)
    .then((data) => {
      res.json(data);
    })
    .catch((msg) => {
      res.status(422).json({ error: msg });
    });
});

app.get("/api/user/history", authenticate, (req, res) => {
  userService
    .getHistory(req.user._id)
    .then((data) => {
      res.json(data);
    })
    .catch((msg) => {
      res.status(422).json({ error: msg });
    });
});

app.put("/api/user/history/:id", authenticate, (req, res) => {
  userService
    .addHistory(req.user._id, req.params.id)
    .then((data) => {
      res.json(data);
    })
    .catch((msg) => {
      res.status(422).json({ error: msg });
    });
});

app.delete("/api/user/history/:id", authenticate, (req, res) => {
  userService
    .removeHistory(req.user._id, req.params.id)
    .then((data) => {
      res.json(data);
    })
    .catch((msg) => {
      res.status(422).json({ error: msg });
    });
});

userService
  .connect()
  .then(() => {
    app.listen(HTTP_PORT, () => {
      console.log("API listening on: " + HTTP_PORT);
    });
  })
  .catch((err) => {
    console.log("unable to start the server: " + err);
    process.exit();
  });
