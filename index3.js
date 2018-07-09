const IOTA = require("iota.lib.js");
const Mam = require("./mam.client.js/lib/mam.client.js");
var mqtt = require("mqtt");
const { promisify } = require("util");
const { exec } = require("child_process");
const execAsync = promisify(exec); // (A)

const iota = new IOTA({ provider: "https://nodes.testnet.iota.org:443" });

let execString = "";
let seed;
let mamState;
let root;
let devices;

if (process.platform === "darwin")
  execString =
    "cat /dev/urandom |LC_ALL=C tr -dc 'A-Z9' | fold -w 81 | head -n 1 ";
else if (process.platform === "linux")
  execString = "cat /dev/urandom |tr -dc A-Z9|head -c${1:-81} ";


client = mqtt.connect(
  "mqtt://127.0.0.1",
  {
    username: "",
    password: ""
  }
);

client.on("connect", function() {
  //send configuration on successfull connection.
  //client.publish('devices/' + config.deviceId + '/measurements', JSON.stringify(onceDataToSend));
});

client.on("error", function(error) {
  console.log(error);
});

client.on("message", function(topic, message) {
  // message is Buffer
  console.log(message.toString());
  console.log(topic.toString());
  
  //client.end()
});

client.subscribe('devices');

const publish = async packet => {
  const trytes = iota.utils.toTrytes(JSON.stringify(packet));
  const message = Mam.create(mamState, trytes);
  console.log(message.root);
  mamState = message.state;
  await Mam.attach(message.payload, message.address);
  return message.root;
};

// Callback used to pass data out of the fetch
const logData = data => console.log(JSON.parse(iota.utils.fromTrytes(data)));

const main = async () => {
  try {
    let pippo = await execAsync(execString);
    //console.log(pippo.stdout);
    //seed = pippo.stdout;
    seed = "OUF9BLMPXCVUYYPEZVJAHFDDPM9AOJPCUTBTVK9LGADCKZQIUB9HP9KXNPIAYETXEILBBJSOILARTPQPI";
    mamState = Mam.init(iota, seed);
    root = Mam.getRoot(mamState);
    //root = await publish('BOMBAGINO__1__');

    //await publish('BOMBAGINO__1__');
    //await publish('BOMBAGINO__2__');
    //root = await publish('BOMBAGINO__3__');
    //root = await publish('BOMBAGINO__4__');

    client.publish('devices', JSON.stringify({
        name: "IoTa Board", 
        root:root
    }));
    /*
    setInterval(async ()=>{
        let resp = await Mam.fetch(root, "public", null, logData);
        console.log(resp);
        if(resp.nextRoot)
            root = resp.nextRoot;
    },5000)
    let i = 1;
    setInterval(async ()=>{
        await publish('BOMBAGINO____'+i);
        i++;
    },25000)*/
    
  } catch (err) {
    console.log("ERROR:", err);
  }
};

main();
