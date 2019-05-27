
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
	computed: {
		jp: function() {
			let paras = this.pair.jp.split(/\n(?=\n)/g);
			let div = $("<div>");
			
			for(para of paras) {
				let lines = para.split("\n");
				lines.reduce((p, line) =>
					p.append($("<span>").text(line))
						.append($("<br>")),
				$("<p>")).appendTo(div);
			}
			
			return div.html();
		},
	},
	template: `
		<div class="tl-pair">
			<div class="index">
				{{ index }}
			</div>
			<div class="jp" v-html="jp"></div>
			<div class="en"><tl-textarea class="en2" @changed="change_en" v-bind:text='pair.en'></tl-textarea></div>
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
	template: "<textarea v-model='_text'>{{ _text }}</textarea>",
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
			} else if(this.files.length == 1) {
				let encoded = this.encode_file(this.files[0]);
				let blob = new Blob([encoded],{type: "text/plain"});
				return [blob, global.filename];
			}
			
			let zip = new JSZip();
			for(let file of this.files) {
				zip.file(file.name, this.encode_file(file));
			}
			
			return [zip.generateAsync({type:"blob"}), filename];
		},
	},
	el: "#vue-root",
	template: "<div id='main'><div v-for='file in files'><tl-file v-bind:file='file'></tl-file></div></div>",
})
