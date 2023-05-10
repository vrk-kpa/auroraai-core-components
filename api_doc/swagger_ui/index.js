const express = require("express")
const path = require("path")

const env = process.env.ENVIRONMENT

const app = express()

app.disable('x-powered-by');

app.use("/api-doc/core-components/", express.static(path.join("dist", "core_components")))
app.get("/api-doc/", function(req, res) {res.redirect('/api-doc/core-components/');})

app.listen(8080)