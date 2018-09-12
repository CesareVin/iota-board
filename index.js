const IOTA = require("iota.lib.js");
const Mam = require("./mam.client.js/lib/mam.client.js");
var mqtt = require("mqtt");

const iota = new IOTA({ provider: "https://nodes.testnet.iota.org:443" });

let mamState = Mam.init(iota, undefined,"1");
let root = Mam.getRoot(mamState);
let serverAddr = "127.0.0.1"
if(process.argv.length==3)
  serverAddr = process.argv[2];

console.log("[INFO] ROOT : " + root);
console.log("[INFO] Connecting to mqtt-server at : "+serverAddr);

client = mqtt.connect(
  "mqtt://"+serverAddr,
  {
    username: "",
    password: ""
  }
);

//handler for mqtt connections
client.on("connect", function() {
  console.log("[INFO] Connected to MQTT Broker");
});

//handler for mqtt errors
client.on("error", function(error) {
  console.log(error);
});

//handler for messages on topics.
client.on("message", function(topic, message) {
  console.log("[INFO] message "+ message.toString()+ " from topic "+topic.toString());
});

//subscribe to device topic
client.subscribe('devices');

//publish the device presence trought MQTT
client.publish('devices', JSON.stringify({
    name: "IoTa Board", 
    root:root
}));

// The publisher is used to serializing
// the messages trouhght iota.
const publisher = async ()=>{
  const temp = Math.round(Math.random() * 100)+' C°';
  root = await publish({dateTime:(new Date()).toString(),data: temp});
  console.log("[INFO] temp :"+temp);
  await timeout(2000);
  publisher();
}

// It publish a packet tought iota.
const publish = async packet => {
  const trytes = iota.utils.toTrytes(JSON.stringify(packet));
  const message = Mam.create(mamState, trytes);
  console.log(message.root);
  mamState = message.state;
  await Mam.attach(message.payload, message.address);
  return message.root;
};

const timeout = ms => new Promise(res => setTimeout(res, ms))

// Callback used to pass data out of the fetch.
const logData = data => console.log(JSON.parse(iota.utils.fromTrytes(data)));

// start the publishing chain trought iota ledger.
publisher();