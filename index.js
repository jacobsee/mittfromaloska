var Twit = require('twit')
var _ = require('lodash')
var keys = require('./keys.json')

var T = new Twit({
  consumer_key:         keys.consumer_key,
  consumer_secret:      keys.consumer_secret,
  access_token:         keys.access_token,
  access_token_secret:  keys.access_token_secret,
  timeout_ms:           60*1000,
})

String.prototype.replaceAt=function(index, replacement) {
    return this.substr(0, index) + replacement+ this.substr(index + replacement.length);
}

var replacements = [
  {
    find: ['a', 'e', 'i', 'o', 'u'],
    replace: ['a', 'e', 'i', 'o', 'u'],
    probability: 0.2
  },
  {
    find: ['A', 'E', 'I', 'O', 'U'],
    replace: ['A', 'E', 'I', 'O', 'U'],
    probability: 0.2
  }
]

var stream = T.stream('statuses/filter', { follow: [keys.target_account_id] })
stream.on('tweet', function (tweet, err) {
  var outputWords = []
  var words = tweet.text.split(' ')
  words.forEach(word => {
    if(!word.includes('@') && !word.includes('http')){ // let's not mention people or URLs...
      for (var i = 0, len = word.length; i < len; i++) {
        replacements.forEach(replacement => {
          if(replacement.find.includes(word[i]) && Math.random() < replacement.probability){
            word = word.replaceAt(i, _.sample(replacement.replace))
          }
        })
      }
      outputWords.push(word)
    }
  })
  var output = outputWords.join(" ")
  console.log('Output: ' + output);
  if(output.length > 3){
    T.post('statuses/update', { status: output }, function(err, data, response) {
      console.log(data)
    })
  }
})
