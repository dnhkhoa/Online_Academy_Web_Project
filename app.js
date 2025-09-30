import express from "express";

const __dirname = import.meta.dirname;
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use("/static", express.static("static"));

app.get("/", function (req, res) {
  res.send("Hello World");
});

app.listen(3000, function () {
  console.log("Server is running on http://localhost:3000");
});
