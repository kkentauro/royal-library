/**
library.js

tools for translating
**/

let global = {};

ascii_to_utf8 = function(str) {
	return decodeURIComponent(escape(str));
};

utf8_to_ascii = function(str) {
	return unescape(encodeURIComponent(str));
};

function parse_file() {
	let file = $("#upload")[0].files[0];
	let fr = new FileReader();
	fr.onload = e => load_file(atob(e.target.result));
	fr.readAsText(file);
}

function load_file(text) {
	let matches = text.matchAll(/(?<jp>[^\0]+)\0(?<en>[^\0]*)\0\0\n/g);
	let pairs = [];
	let match = matches.next();
	
	while(!match.done) {
		let jp = ascii_to_utf8(match.value.groups["jp"]);
		let en = ascii_to_utf8(match.value.groups["en"]);
		vue.pairs.push({jp: jp, en: en});
		
		match = matches.next();
	}
	
}

function save_file(text) {
	
}




// ==========================================

Vue.component("tl-pairs", {
	props: ["pairs"],
	methods: {
		add_pair: function() {
			this.pairs.push({jp: "", en: ""});
		},
	},
	computed: {
		encoded: function() {
			let strings = [];
			let str = "";
			
			for(let pair of this.pairs) {
				let jp = utf8_to_ascii(pair.jp);
				let en = utf8_to_ascii(pair.en);
				strings.push(jp + "\0" + en + "\0\0\n");
			}
			
			return btoa(strings.join(""));
		},
	},
	template: "<div><div v-for='pair in pairs'><tl-pair-row v-bind:pair='pair'></tl-pair-row></div><add-pair v-on:add_pair='add_pair();'></add-pair></div>",
});

Vue.component("tl-pair-row", {
	props: ["pair"],
	methods: {
		change_jp: function(value) {
			this.pair.jp = value;
		},
		change_en: function(value) {
			this.pair.en = value;
		},
	},
	template: "<div><tl-textarea @changed='change_jp' v-bind:text='pair.jp'></tl-textarea><tl-textarea @changed='change_en' v-bind:text='pair.en'></tl-textarea></div>",
});

Vue.component("tl-textarea", {
	props: ["text"],
 	computed: {
		_text: {
			get() {
				return this.text;
			},
			set(value) {
				console.log(this);
				this.$emit("changed", value);
			},
		},
	},
	template: "<textarea v-model='_text'>{{ _text }}</textarea>",
});

Vue.component("add-pair", {
	methods: {
		add_pair: function() {
			console.log(this);
			this.$emit("add_pair");
		}
	},
	template: "<input type='button' id='button' value='Add pair' v-on:click='add_pair();'></input>",
});

const vue = new Vue({
	data: {pairs: []},
	el: "#vue-root",
	template: "<div><tl-pairs id='root' ref='root' v-bind:pairs='pairs'></tl-pairs></div>",
})

