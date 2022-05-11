var express = require('express');
var router = express.Router();
var cors = require('cors')

router.use(cors("http://localhost:3000/", "http://192.168.178.22:3000/"));

let jisho = require("../public/JMDict_e.json")
let examples = require("../public/tatoeba-jp.json")
let strokeCounts = require("../public/kTotalStrokes.json")
let radk = require("../public/radk.json")

router.get('/word/:query', function(req, res, next) {
  let query = req.params.query
  let results = queryJisho(query)
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

router.post("/radical", function(req, res, next) {
  
  //takes an array of arrays and returns one array containing all mutual children
  //by checking whether an item appears as many times as there are arrays
  const getMutualChildren = (initArray) => {
    if (initArray.length > 1){
      const getAmount = (array, entry) => {
        return array.filter(item => item === entry).length
      }
      
      const removeDuplicates = (array) => {
        return [...new Set(array)]
      }
  
      return (
        [...removeDuplicates(initArray
          .map(item => removeDuplicates(item))
          .flat()
          .filter((item, idx, arr) => getAmount(arr, item) === initArray.length
          ))
        ]
      )
    }
    else return initArray.flat()
  }

  const sortByStrokeCount = (array) => {
    array.sort((a, b) => {
      return strokeCounts[a][0] === strokeCounts[b][0]
      ? 0
      : strokeCounts[a][0] > strokeCounts[b][0]
      ? 1
      : -1
    })
    array = array.map(i => {
      return {
        kanji: i,
        strokes: strokeCounts[i][0]
      }
    })
    return array
  }
  
  const findEnabled = (arrayOfMutualChildren) => {
    return Object.keys(radk).filter(key => radk[key].kanji.some(kanji => arrayOfMutualChildren.includes(kanji))
    )
  }
  
  
  let mutualChildren = getMutualChildren(req.body.map(key => radk[key].kanji))
  res.send(
    {
      mutualChildren: sortByStrokeCount(mutualChildren),
      enabled: req.body.length > 0 ? findEnabled(mutualChildren) : Object.keys(radk)
    }
  )
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
    if(entry.sense && query.length > 2){
      entry.sense.map(definitionListing => {
        definitionListing.gloss.map(word => {
          if(typeof word === "string"){
            if (word === query && !exact.includes(entry)) exact = [...exact, entry]
            if (word.includes(query) && !includes.includes(entry)) includes = [...includes, entry]
            if (word.startsWith(query) && !prefix.includes(entry)) prefix = [...prefix, entry]
            if (word.endsWith(query) && !suffix.includes(entry)) suffix = [...suffix, entry]
          }
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