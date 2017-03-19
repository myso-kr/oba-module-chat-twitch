import Module from '../src/.';

const module = new Module(null, null, 'https://www.twitch.tv/ogn_hots');
module.on('message', (data)=>console.info(JSON.stringify(data)))
module.connect();
setTimeout(()=>module.disconnect(), 5000);