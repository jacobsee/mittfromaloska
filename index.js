var Twit = require("twit");
var _ = require("lodash");
var keys = require("./keys.json");
var meme = require("meme-maker");
var fs = require("fs");

var T = new Twit({
  consumer_key: keys.consumer_key,
  consumer_secret: keys.consumer_secret,
  access_token: keys.access_token,
  access_token_secret: keys.access_token_secret,
  timeout_ms: 60 * 1000
});

var replacements = [
  {
    find: ["a", "e", "i", "o", "u"],
    replace: ["a", "e", "i", "o", "u"],
    probability: 0.2
  },
  {
    find: ["A", "E", "I", "O", "U"],
    replace: ["A", "E", "I", "O", "U"],
    probability: 0.2
  }
];

String.prototype.replaceAt = function(index, replacement) {
  return (
    this.substr(0, index) +
    replacement +
    this.substr(index + replacement.length)
  );
};

function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive
}

var stream = T.stream("statuses/filter", {
  follow: [keys.target_account_id]
});
stream.on("tweet", function(tweet, err) {
  var outputWords = [];
  var words = tweet.text.split(" ");
  words.forEach(word => {
    if (!word.includes("@") && !word.includes("http")) {
      // let's not mention people or URLs...
      for (var i = 0, len = word.length; i < len; i++) {
        replacements.forEach(replacement => {
          if (
            replacement.find.includes(word[i]) &&
            Math.random() < replacement.probability
          ) {
            word = word.replaceAt(i, _.sample(replacement.replace));
          }
        });
      }
      outputWords.push(word);
    }
  });
  var tweetText = outputWords.join(" ");
  var output = outputWords.join(" ");
  console.log("Output: " + output);
  if (output.length > 3) {
    fs.readdir("memes", function(err, items) {
      var memeImg = _.sample(items);
      var rnd = getRandomIntInclusive(1, 999999);

      var middle = Math.floor(tweetText.length / 2);
      var before = tweetText.lastIndexOf(" ", middle);
      var after = tweetText.indexOf(" ", middle + 1);

      if (middle - before < after - middle) {
        middle = before;
      } else {
        middle = after;
      }

      var s1 = tweetText.substr(0, middle);
      var s2 = tweetText.substr(middle + 1);

      var memeOptions = {
        image: "memes/" + memeImg,
        outfile: "outmemes/" + rnd + ".png",
        fontSize: 40,
        topText: s1,
        bottomText: s2
      };
      meme(memeOptions, function(err) {
        if (!err) {
          var b64content = fs.readFileSync("outmemes/" + rnd + ".png", {
            encoding: "base64"
          });

          T.post("media/upload", { media_data: b64content }, function(
            err,
            data,
            response
          ) {
            var mediaIdStr = data.media_id_string;
            var altText = "memefromaloska";
            var meta_params = {
              media_id: mediaIdStr,
              alt_text: { text: altText }
            };

            T.post("media/metadata/create", meta_params, function(
              err,
              data,
              response
            ) {
              if (!err) {
                var params = {
                  status: "",
                  media_ids: [mediaIdStr]
                };

                T.post("statuses/update", params, function(
                  err,
                  data,
                  response
                ) {
                  console.log(data);
                });
              }
            });
          });
        }
      });
    });
  }
});
