
const RingAPI = require('doorbot');
const async = require('async');
const mkdirp = require('mkdirp');
const fs = require('fs');
const path = require('path');
const url = require('url');
const request = require('request');

Array.min = function (array) {
  return Math.min.apply(Math, array);
};



const ring = RingAPI({
  email: 'jonathan.youngblood@gmail.com',
  password: 'MYSECRETPASSWORD'
});

const historyLimit = 7000;

const base = path.join(__dirname, 'downloads');


//download 100 events at a time until there aren't any more
function sync_process_100() {
  console.log('----- INITIALIZING DOWNLOAD OF THE NEXT 100 EVENTS --------');

  fs.readFile('ids.txt', 'utf8', function (err, data) {
    if (err) throw err;

    let array = data.split("\n");
    let _array = array.filter(Boolean);


    let minimum = _array.sort();
    console.log('ID OF OLDEST EVENT: ' + minimum[0]);

    let earliest_video = minimum[0];

    fs.mkdir(base, () => {

      ring.history(historyLimit, earliest_video, (e, history) => {
        console.log('TOTAL RESULTS === ' + history.length);


        const fetch = (info, callback) => {

          ring.recording(info.id, (e, recording) => {

            if (recording) {
              console.log('========================== = = = =  ==== = === = = ====  ===');
              console.log(recording);

              const filename_title = url.parse(recording).pathname;

              let t = new Date(info.created_at);
              let hr = ("0" + t.getHours()).slice(-2);
              let min = ("0" + t.getMinutes()).slice(-2);

              const timestamp = t.getFullYear() + "-" + (t.getMonth() + 1) + "-" + t.getDate() + "--" + hr + "." + min;

              const file = path.join(base, '.', filename_title.replace('.mp4', '---' + timestamp + '.mp4'));
              const dirname = path.dirname(file);

              mkdirp(dirname, () => {
                console.log('Fetching: ', file);
                const writer = fs.createWriteStream(file);
                writer.on('close', () => {
                  console.log('Done writing: ', file);
                  let logStream = fs.createWriteStream('ids.txt', { 'flags': 'a' });
                  logStream.end('\n' + info.id);
                  callback();
                });
                request(recording).pipe(writer);
              });

            } else {
              console.log('no recording data for: ' + info.id);
              console.log(info);
            }

          });
        };

        async.eachLimit(history, 10, fetch, () => {
          console.log('----- DONE WITH EVERYTHING FOR THIS BATCH ----');
          sync_process_100();
        });
      });
    });




  });

};


sync_process_100();