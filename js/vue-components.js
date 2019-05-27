
Vue.component("tl-file", {
	props: ["file"],
	mounted: function() {
		$(this.$el).accordion({ collapsible: true, active: false });
	},
	template: "<div><h3>{{ file.name }}</h3><div><div v-for='(pair, index) in file.pairs'><tl-pair v-bind:index='index' v-bind:pair='pair'></tl-pair></div></div></div>",
});

Vue.component("tl-pair", {
	props: ["pair", "index"],
	methods: {
		change_jp: function(value) {
			this.pair.jp = value;
		},
		change_en: function(value) {
			this.pair.en = value;
		},
	},
	template: `
		<div style='clear:both;'>
			<div style="float:left; text-align:center; width:4em;">
				{{ index }}
			</div>
			<div style="float:left;">
				<textarea rows="5" cols="32" disabled>{{ pair.jp }}</textarea>
				<tl-textarea @changed="change_en" v-bind:text='pair.en'></tl-textarea>
			</div>
		</div>`,
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

const vue = new Vue({
	data: {files: []},
	methods: {
		encode_file(file) {
			let strings = [];
			
			for(let pair of file.pairs) {
				let jp = utf8_to_ascii(pair.jp);
				let en = utf8_to_ascii(pair.en);
				strings.push(jp + "\0" + en + "\0\0\n");
			}
			
			return btoa(strings.join(""));
		},
	},
	computed: {
		dl_file: function() {
			if(this.files.length == 0) {
				return;
			}
			
			let zip = new JSZip();
			let filename = (this.files.length == 1)
				? global.filename
				: "strings.zip";
			
			for(let file of this.files) {
				zip.file(file.name, this.encode_file(file));
			}
			
			return [zip.generateAsync({type:"blob"}), filename];
		},
	},
	el: "#vue-root",
	template: "<div id='main'><div v-for='file in files'><tl-file v-bind:file='file'></tl-file></div></div>",
})
