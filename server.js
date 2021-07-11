const config = require("./config.json");
const path = require("path");
const sh = require("shortid");
const fs = require("fs");
const express = require("express");
const fileUpload = require("express-fileupload");
const app = express();
const MongoClient = require("mongodb").MongoClient;
const logger = require("./logger.js");
const middleware = require("./middleware.js");
const response = require("./response.js");
const axios = require("axios");
const random = (min, max) => Math.floor(Math.random() * (max - min)) + min;
// dependacies help how to spell dependacnicy

app.use(fileUpload());
app.set("view engine", "pug");
app.set("views", "./views");
// loading up view engine

app.post("/upload", middleware.keyRequired, function (req, res) {
  if (!req.files) {
    logger.error("No file uploaded");
    return response.noFileUploaded(res);
  }
  let uploadFile = req.files.uploadFile;
  let fileExtension = getExtension(uploadFile.name);
  let filename = sh.generate() + "." + fileExtension;
  logger.success("File uploaded: " + filename);
  // using mv to place file into /uploads
  uploadFile.mv(__dirname + "/uploads/" + filename, function (err) {
    if (err) {
      response.noFileUploaded(res);
      return logger.error("FATAL!: COULD NOT WRITE FILE!");
    }

    axios
      .post(
        "https://discord.com/api/webhooks/863795122738823199/ARVKPc1UjHe9GMwSvFyzOD_7h_aGEY2jxNxncONydQL8Aivumy_TfZk57u3_SHo-r7yp",
        {
          content: config.serverip + "/e/" + filename,
          username: "balls",
        }
      )
      .then((res) => {})
      .catch((error) => {
        console.error(error);
      });

    res.send(config.serverip + "/e/" + filename);
  });
});

app.get("/", function (req, res) {
  res.sendFile(__dirname + "/index.html");
});

app.get("/uploader", function (req, res) {
  res.sendFile(__dirname + "/uploader.html");
});
// add static files like css, js and images
app.use(express.static(__dirname + "/public"));

app.get("/:filename", function (req, res) {
  let path = __dirname + "/uploads/" + req.params.filename;
  fs.exists(path, function (exists) {
    if (exists) {
      res.sendFile(__dirname + "/uploads/" + req.params.filename);
    } else {
      return res.send(
        "Wassup, are u lost? Just saying there is nothing at " +
          config.serverip +
          req.originalUrl
      );
    }
  });
});

app.get("/e/:imagename", function (req, res) {
  let imagenameurl = req.params.imagename;
  let imagefullurl = config.serverip + "/" + req.params.imagename;
  let numberoffiles = fs.readdirSync(__dirname + "/uploads/").length;
  let selectedfile = fs.statSync(
    __dirname + "/uploads/" + req.params.imagename
  );
  let randhexcolour = Math.floor(Math.random() * 16777215).toString(16);
  let fakeip =
    random(1, 256) +
    "." +
    random(1, 256) +
    "." +
    random(1, 256) +
    "." +
    random(1, 256);
  var filesizebytes = selectedfile.size;
  var filesizemegabytes = filesizebytes / (1024 * 1024);
  res.render("images", {
    name: imagenameurl,
    url: imagefullurl,
    fileamount: numberoffiles,
    filesize: filesizemegabytes,
    randhexcolour: randhexcolour,
    fakeip: fakeip,
  });
});

app.get("/embed/:title/:subtitle/:author/:desc", function (req, res) {
  let title = req.params.title;
  let subtitle = req.params.subtitle;
  let author = config.serverip + "/api/embedgen/" + req.params.author;
  let desc = req.params.desc;
  let randhexcolour = Math.floor(Math.random() * 16777215).toString(16);
  res.render("embedurl", {
    title: title,
    subtitle: subtitle,
    author: author,
    desc: desc,
    randhexcolour: randhexcolour,
  });
});

app.use("/api/visits", (req, res) => {
  MongoClient.connect("mongodb://localhost:27017/test", function (err, db) {
    db.collection("Example", function (err, collection) {
      collection.insert({ pageHits: "pageHits" });
      db.collection("Example").count(function (err, count) {
        if (err) throw err;
        res.status(200).send("Page Hits: " + Math.floor(count / 2));
      });
    });
  });
});

app.get("/api/files", function (req, res) {
  let numberoffiles = fs.readdirSync(__dirname + "/uploads/").length;
  res.status(200).send({ files: numberoffiles });
});

app.get("/api/embedgen/:author", function (req, res) {
  res
    .status(200)
    .send({ type: "link", version: 1.0, author_name: req.params.author });
});

app.get("/oembed/:stuff", function (req, res) {
  res.status(200).json({
    type: "link",
    version: "1.0",
    author_name: req.params.stuff,
  });
});

const PORT = process.env.PORT || 80;
app.listen(PORT);
logger.success("Server is running on port: " + PORT);
logger.success("Server IP is set to: " + config.serverip);
logger.info(
  "Files uploaded: " + fs.readdirSync(__dirname + "/uploads/").length
);

function getExtension(filename) {
  var ext = path.extname(filename || "").split(".");
  return ext[ext.length - 1];
}
