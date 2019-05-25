/**
library.js

tools for translating
**/

const global = {};

const ascii_to_utf8 = function(str) {
	return decodeURIComponent(escape(str));
};

const utf8_to_ascii = function(str) {
	return unescape(encodeURIComponent(str));
};

const parse_file = (function() {
	
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
	
	function parse_file() {
		if(vue.pairs.length > 0) {
			if(!confirm("This will remove all current entries. Load file?")) {
				return;
			} else {
				vue.pairs = [];
			}
		}
		
		let upload_form = $("#upload")[0];
		let file = upload_form.files[0];
		let fr = new FileReader();
		
		if(!file) {
			return;
		}
		
		global.filename = upload_form.value.split("\\").pop();
		fr.onload = e => load_file(atob(e.target.result));
		fr.readAsText(file);
	}
	
	return parse_file;
})();


function save_file(text) {
	if(vue.pairs.length == 0) {
		return;
	}
	
	let str = vue.pairs.reduce(function(accum, val) {
		return accum + utf8_to_ascii(val.jp)
			+ "\0" + utf8_to_ascii(val.en) + "\0\0\n";
	}, "");
	
	let b64str = btoa(str);
	saveAs(new Blob([b64str]), global.filename);
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
	template: "<div><div v-for='(pair, index) in pairs'><tl-pair-row v-bind:index='index' v-bind:pair='pair'></tl-pair-row></div><add-pair v-on:add_pair='add_pair();'></add-pair></div>",
});

Vue.component("tl-pair-row", {
	props: ["pair", "index"],
	methods: {
		change_jp: function(value) {
			this.pair.jp = value;
		},
		change_en: function(value) {
			this.pair.en = value;
		},
	},
	template: "<div style='clear:both;'><div style='float:left; text-align:center; width:4em;'>{{ index }}</div><div style='float:left;'><tl-textarea @changed='change_jp' v-bind:text='pair.jp'></tl-textarea><tl-textarea @changed='change_en' v-bind:text='pair.en'></tl-textarea></div></div>",
});

Vue.component("tl-textarea", {
	props: ["text"],
 	computed: {
		_text: {
			get() {
				return this.text;
			},
			set(value) {
				this.$emit("changed", value);
			},
		},
	},
	template: "<textarea rows='5' cols='32' v-model='_text'>{{ _text }}</textarea>",
});

Vue.component("add-pair", {
	template: "",
//	template: "<input type='button' id='button' value='Add pair' v-on:click='$emit(`add_pair`)'></input>",
});

const vue = new Vue({
	data: {pairs: []},
	el: "#vue-root",
	template: "<div><tl-pairs id='root' ref='root' v-bind:pairs='pairs'></tl-pairs></div>",
})

