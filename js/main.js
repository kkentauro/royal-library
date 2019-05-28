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

const [load_files, load_zip] = (function() {
	function confirm_overwrite() {
		if(vue.files.length > 0) {
			if(!confirm("This will overwrite duplicate files. Continue?")) {
				return false;
			}
		}
		
		return true;
	}
	
	function add_tl_file(filename, b64str) {
		let text = atob(b64str);
		let matches = text.matchAll(/(?<jp>[^\0]+)\0(?<en>[^\0]*)\0\0\n/g);
		let pairs_dict = {};
		let pairs = [];
		let match = matches.next();
		
		while(!match.done) {
			let jp = ascii_to_utf8(match.value.groups["jp"]);
			let en = ascii_to_utf8(match.value.groups["en"]);
			pairs_dict[jp] = pairs_dict[jp] || en;
			
			match = matches.next();
		}
		
		pairs = $.map(Object.entries(pairs_dict), ([k, v]) => ({jp: k, en: v}));
		let index = vue.files.findIndex(file => file.name === filename);

		if(index >= 0) {
			vue.files.splice(index, 1);
		}
		
		vue.files.push({name: filename, pairs: pairs});
	}
	
	function done_loading() {
		vue.files = vue.files.sort(function(a, b){
			if(a.name.toLowerCase() < b.name.toLowerCase()) { return -1; }
			if(a.name.toLowerCase() > b.name.toLowerCase()) { return  1; }
			return 0;
		});
		
		$("#loading_indicator").addClass("hidden");
	};
	
	function parse_zip(zip) {
		let promises = [];
		
		for(let file of Object.values(zip.files)) {
			if(file.dir == true) {
				continue;
			}
			
			let promise = file.async("text")
				.then(text => add_tl_file(file.name, text))
				.finally();
				
			promises.push(promise);
		}
		
		return Promise.all(promises)
			.then(done_loading);
	}
	
	function load_files() {
		let upload_form = $("#upload")[0];
		
		if(!upload_form.files) { return; }
		if(!confirm_overwrite()) { return; }
		
		for(let file of upload_form.files) {
			let fr = new FileReader();
			
			fr.onload = function(e) {
				add_tl_file(file.name, e.target.result);
				done_loading();
			}
			
			fr.readAsText(file);
			global.filename = upload_form.files[0].name.split("\\").pop();
		}
	}
	
	function load_zip() {
		let upload_form = $("#upload")[0];
		let file = upload_form.files[0];
		
		if(!file) { return; }
		if(!confirm_overwrite()) { return; }
		
		$("#loading_indicator").removeClass("hidden");
		
		JSZip.loadAsync(file)
			.then(parse_zip)
	}
	
	return [load_files, load_zip];
})();


const save_file = async function(text) {
	let [file, filename] = await Promise.all(vue.dl_file);
	console.log(file, filename);
	saveAs(file, filename);
}


