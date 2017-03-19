import _ from 'lodash';
import Promise from 'bluebird';
import Logger from 'debug';
import EventEmitter from 'events'
import URL from 'url';
import TMI from 'tmi.js';

export default class Module extends EventEmitter {
	constructor(oba, options, url) {
		super();
		this.name = "oba:chat:twitch";
		this.oba = oba || new EventEmitter();
		this.stdout = Logger(`${this.name}`);
		this.stderr = Logger(`${this.name}:error`);

		const uri = URL.parse(url, true, true);
        const segments = _.split(uri.pathname, '/');
        this.defaults = {
        	name: this.name,
        	source: url, 
        	caster: {
        		username: _.get(segments, 1),
        		identify: _.get(segments, 1)
        	}
        };
        this.options = _.merge({}, this.defaults, options);
        this.socket = new Socket(this);
	}

	connect() { this.socket.connect(); }

	disconnect() { this.socket.disconnect(); }
}

class Socket extends EventEmitter {
	constructor(module) {
		super();
		this.module = module;
	}

	connect() {
		if(this.native) return;
		this.native = true;
		Promise.resolve().then(async () => {
            const socket = this.native = new TMI.client({
                connection: { reconnect: true, secure: true },
                channels: [this.module.defaults.caster.identify]
            })
            socket.on('error', (e) => this.emit('error', e));
            socket.on('connected', () => this.emit('connect'))
            socket.on('disconnected', () => this.emit('close'));
            socket.on('message', (channel, user, message, fromSelf) => {
                this.emit('message', {
                    username: _.get(user, 'username'),
                    nickname: _.get(user, 'display-name'),
                    message: message,
                    timestamp: _.get(user, 'tmi-sent-ts')*1
                })
            })
            socket.connect();

            this.on('connect', () => this.module.emit('connect'));
	        this.on('error', (e) => this.module.emit('error', e));
	        this.on('close', () => this.module.emit('close'));
	        this.on('message', (data) => {
	        	this.module.emit('message', {
                    module: this.module.defaults,
                    username: _.get(data, 'username'),
                    nickname: _.get(data, 'nickname'),
                    message: _.get(data, 'message'),
                    timestamp: _.get(data, 'timestamp')
                });
	        });
		});
	}
	disconnect() {
		if(!this.native) return;
		this.native.disconnect();
	}
}