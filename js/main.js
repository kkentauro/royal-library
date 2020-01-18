/**
library.js

tools for translating
**/

const files = {};

const ascii_to_utf8 = function(str) {
	return decodeURIComponent(escape(str));
};

const utf8_to_ascii = function(str) {
	return unescape(encodeURIComponent(str));
};

const [load_files, load_zip] = (function() {
	function confirm_overwrite() {
		if(Object.keys(files).length > 0) {
			if(!confirm("This will overwrite duplicate files. Continue?")) {
				return false;
			}
		}
		
		return true;
	}
	
	function add_tl_file(filename, jsonstr) {
		const old_data = (filename in files) ? files[filename] : {};
		const new_data = JSON.parse(jsonstr);
		const old_pairs = old_data.pairs || {};
		const new_pairs = new_data.pairs;
		const tl_map = old_pairs;
		
		for(let key in new_pairs) {
			if(new_pairs[key] || !old_pairs[key]) {
				tl_map[key] = new_pairs[key];
			}
		}
		
		files[filename] = {pairs: tl_map};
	}
	
	function build_text_boxes() {
		const root = $("#root");
		let file_divs = [];
		root.empty();
		
		for(let fname in files) {
			const filename = fname;
			const file = files[filename];
			const tl_pairs = file.pairs;
			const pairs_div = $("<div>");
			const outer = $("<div>")
				.append($("<h3>").text(filename))
				.append(pairs_div);
			
			for(let jp in tl_pairs) {
				const jp_box = $("<textarea>")
					.text(jp)
					.prop("cols", 40)
					.prop("rows", 4)
					.prop("disabled", true);
				const en_box = $("<textarea>")
					.prop("cols", 40)
					.prop("rows", 4)
					.text(tl_pairs[jp]);
				
				en_box.on("keydown", function() {
					files[filename].pairs[jp] = en_box.val()
				});
				
				pairs_div.append($("<p>").append(jp_box).append(en_box));
			}
			
			outer.attr("filename", filename);
			file_divs.push(outer);
		}
		
		file_divs.sort(function(a, b) {
			const af = $(a).attr("filename").toLowerCase();
			const bf = $(b).attr("filename").toLowerCase();
			return (af < bf) ? -1 : ((af > bf) ? 1 : 0);
		});
		root.append(file_divs);
		root.children().accordion({collapsible: true, active: false});
	}
	
	function done_loading() {
		build_text_boxes();
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
			}
			
			fr.readAsText(file);
//			filename = upload_form.files[0].name.split("\\").pop();
		}
		
		done_loading();
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


/* const save_file = async function(text) {
	let [file, filename] = await Promise.all(vue.dl_file);
	console.log(file, filename);
	saveAs(file, filename);
} */

const save_file = async function() {
	if(files.length == 0) {
		return;
	} else if(files.length == 1) {
		let encoded = JSON.stringify(files[0]);
		let blob = new Blob([encoded],{type: "text/plain"});
		return [blob, filename];
	}
	
	let zip = new JSZip();
	for(let filename in files) {
		zip.file(filename, JSON.stringify(files[filename]));
	}
	
	const file = await zip.generateAsync({type:"blob"});
	console.log(file, "strings.zip");
	saveAs(file, "strings.zip");
}


