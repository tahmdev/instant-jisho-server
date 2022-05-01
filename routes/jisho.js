var express = require('express');
var router = express.Router();
var cors = require('cors')

router.use(cors("http://localhost:3000/", "http://192.168.178.22:3000/"));

let jisho = require("../public/JMDict_e.json")
let examples = require("../public/tatoeba-jp.json")

router.get('/word/:query', function(req, res, next) {
  let query = req.params.query
  let results = queryJisho(query, "includes")
  res.send(results) 
});

router.get("/example/:type/:query", function(req, res, next) {
  let type = req.params.type
  let query = req.params.query
  console.log("a")
  if (type === "tatoeba") {
    res.send(examples.filter(entry=> entry.text.includes(query)))
  }
})

const queryJisho = (query) => {
  let exact = []
  let includes = []
  let prefix = []
  let suffix = []
  jisho.map(entry => {
    if (entry.k_ele){
      entry.k_ele.map(kanjiListing => {
        kanjiListing.keb.map(word => {
          if (word === query && !exact.includes(entry)) exact = [...exact, entry]
          if (word.includes(query) && !includes.includes(entry)) includes = [...includes, entry]
          if (word.startsWith(query) && !prefix.includes(entry)) prefix = [...prefix, entry]
          if (word.endsWith(query) && !suffix.includes(entry)) suffix = [...suffix, entry]
        })
      })
    } 
    if (entry.r_ele && query.length > 1){
      entry.r_ele.map(hiraganaListing => {
        hiraganaListing.reb.map(word => {
          if (word === query && !exact.includes(entry)) exact = [...exact, entry]
          if (word.includes(query) && !includes.includes(entry)) includes = [...includes, entry]
          if (word.startsWith(query) && !prefix.includes(entry)) prefix = [...prefix, entry]
          if (word.endsWith(query) && !suffix.includes(entry)) suffix = [...suffix, entry]
        })
      })
    }

  })
  return {
    Exact: exact,
    Includes: includes,
    Prefix: prefix,
    Suffix: suffix,
  }
}
module.exports = router;