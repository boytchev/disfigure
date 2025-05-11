// disfigure v0.0.5

'use strict';

var tsl = require('three/tsl');
var THREE = require('three');

function _interopNamespaceDefault(e) {
	var n = Object.create(null);
	if (e) {
		Object.keys(e).forEach(function (k) {
			if (k !== 'default') {
				var d = Object.getOwnPropertyDescriptor(e, k);
				Object.defineProperty(n, k, d.get ? d : {
					enumerable: true,
					get: function () { return e[k]; }
				});
			}
		});
	}
	n.default = e;
	return Object.freeze(n);
}

var THREE__namespace = /*#__PURE__*/_interopNamespaceDefault(THREE);

// generate X-rotation matrix
const matRotX = tsl.Fn( ([ angle ])=>{

	var	cos = angle.cos().toVar(),
		sin = angle.sin().toVar();

	return tsl.mat3(
		1, 0, 0,
		0, cos, sin,
		0, sin.negate(), cos,
	);

} ).setLayout( {
	name: 'matRotX',
	type: 'mat3',
	inputs: [
		{ name: 'angle', type: 'float' },
	]
} );



// generate Y-rotation matrix
const matRotY = tsl.Fn( ([ angle ])=>{

	var	cos = angle.cos().toVar(),
		sin = angle.sin().toVar();

	return tsl.mat3(
		cos, 0, sin.negate(),
		0, 1, 0,
		sin, 0, cos,
	);

} ).setLayout( {
	name: 'matRotY',
	type: 'mat3',
	inputs: [
		{ name: 'angle', type: 'float' },
	]
} );



// generate Z-rotation matrix
const matRotZ = tsl.Fn( ([ angle ])=>{

	var	cos = angle.cos().toVar(),
		sin = angle.sin().toVar();

	return tsl.mat3(
		cos, sin, 0,
		sin.negate(), cos, 0,
		0, 0, 1,
	);

} ).setLayout( {
	name: 'matRotZ',
	type: 'mat3',
	inputs: [
		{ name: 'angle', type: 'float' },
	]
} );



// generate YXZ rotation matrix
const matRotYXZ = tsl.Fn( ([ angles ])=>{

	var RX = matRotX( angles.x ),
		RY = matRotY( angles.y ),
		RZ = matRotZ( angles.z );

	return RY.mul( RX ).mul( RZ );

} ).setLayout( {
	name: 'matRotYXZ',
	type: 'mat3',
	inputs: [
		{ name: 'angles', type: 'vec3' },
	]
} );



// generate YZX rotation matrix
const matRotYZX = tsl.Fn( ([ angles ])=>{

	var RX = matRotX( angles.x ),
		RY = matRotY( angles.y ),
		RZ = matRotZ( angles.z );

	return RY.mul( RZ ).mul( RX );

} ).setLayout( {
	name: 'matRotYZX',
	type: 'mat3',
	inputs: [
		{ name: 'angles', type: 'vec3' },
	]
} );



// generate XYZ rotation matrix
const matRotXYZ = tsl.Fn( ([ angles ])=>{

	var RX = matRotX( angles.x ),
		RY = matRotY( angles.y ),
		RZ = matRotZ( angles.z );

	return RX.mul( RY ).mul( RZ );

} ).setLayout( {
	name: 'matRotXYZ',
	type: 'mat3',
	inputs: [
		{ name: 'angles', type: 'vec3' },
	]
} );



// generate XZY rotation matrix
const matRotXZY = tsl.Fn( ([ angles ])=>{

	var RX = matRotX( angles.x ),
		RY = matRotY( angles.y ),
		RZ = matRotZ( angles.z );

	return RX.mul( RZ ).mul( RY );

} ).setLayout( {
	name: 'matRotXZY',
	type: 'mat3',
	inputs: [
		{ name: 'angles', type: 'vec3' },
	]
} );



// generate ZXY rotation matrix
const matRotZXY = tsl.Fn( ([ angles ])=>{

	var RX = matRotX( angles.x ),
		RY = matRotY( angles.y ),
		RZ = matRotZ( angles.z );

	return RZ.mul( RX ).mul( RY );

} ).setLayout( {
	name: 'matRotZXY',
	type: 'mat3',
	inputs: [
		{ name: 'angles', type: 'vec3' },
	]
} );



// generate ZYX rotation matrix
const matRotZYX = tsl.Fn( ([ angles ])=>{

	var RX = matRotX( angles.x ),
		RY = matRotY( angles.y ),
		RZ = matRotZ( angles.z );

	return RZ.mul( RY ).mul( RX );

} ).setLayout( {
	name: 'matRotZYX',
	type: 'mat3',
	inputs: [
		{ name: 'angles', type: 'vec3' },
	]
} );




/*
// generate scaling matrix
const matScale = Fn( ([ scales ])=>{

	return mat3(
		scales.x, 0, 0,
		0, scales.y, 0,
		0, 0, scales.z,
	);

} ).setLayout( {
	name: 'matScale',
	type: 'mat3',
	inputs: [
		{ name: 'scales', type: 'vec3' },
	]
} );
*/



// center model
function centerModel( model ) {

	var center = new THREE.Vector3();

	new THREE.Box3().setFromObject( model, true ).getCenter( center );
	model.position.sub( center );

}



// merge a mesh into its parent, taking into consideration
// positions, orientations and scale. flattening occurs only
// for elements with a single child mesh
function flattenModel( model ) {

	var meshes = [];

	// extract meshes
	model.traverse( ( mesh )=>{

		if ( mesh.isMesh ) {

			var geo = mesh.geometry.clone().applyMatrix4( mesh.matrixWorld );
			var mat = mesh.material.clone();

			meshes.push( new THREE.Mesh( geo, mat ) );

		}

	} );

	// clear model
	model.clear( );
	model.position.set( 0, 0, 0 );
	model.rotation.set( 0, 0, 0, 'XYZ' );
	model.scale.set( 1, 1, 1 );

	// add meshes
	model.add( ...meshes );

}



// convert all model materials to Node materials
// attach TSL functions for vertices, colors and emission
function ennodeModel( model, skeleton, posture, nodes ) {

	model.traverse( ( child )=>{

		if ( child.isMesh ) {

			// convert the material into Node material
			//var material = new MeshStandardNodeMaterial();
			var material = new THREE.MeshPhysicalNodeMaterial();

			// copy all properties from the original material
			Object.assign( material, child.material );

			material.metalness = 0.1;
			material.roughness = 0.6;

			if ( nodes.colorNode )
				material.colorNode = nodes.colorNode( );

			if ( nodes.positionNode )
				material.positionNode = nodes.positionNode( { skeleton: skeleton, posture: posture } );

			if ( nodes.normalNode )
				material.normalNode = nodes.normalNode( { skeleton: skeleton, posture: posture } );

			if ( nodes.emissiveNode )
				material.emissiveNode = nodes.emissiveNode( { skeleton: skeleton, posture: posture } );

			child.material = material;

		}

	} );

}



// prepared a model for TSL rigging
function processModel( model, skeleton, posture, nodes ) {

	flattenModel( model );
	ennodeModel( model, skeleton, posture, nodes );
	centerModel( model );

	return model;

}



// extract credits and place them in DOM element
// replaces the resource url extension with "txt"
// e.g. my-model.glb -> my-model.txt
function credits( url, id ) {

	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function () {

		if ( this.readyState == 4 ) {

			if ( this.status == 200 ) {

				document.getElementById( id ).innerHTML = this.responseText.split( '||' )[ 0 ];

			}

		}

	};

	url = url.split( '.' );
	url.pop();
	url.push( 'txt' );
	url = url.join( '.' );

	xhttp.open( "GET", url, true );
	xhttp.send();

}

/**
 * lil-gui
 * https://lil-gui.georgealways.com
 * @version 0.17.0
 * @author George Michael Brower
 * @license MIT
 */
class t{constructor(i,e,s,n,l="div"){this.parent=i,this.object=e,this.property=s,this._disabled=false,this._hidden=false,this.initialValue=this.getValue(),this.domElement=document.createElement("div"),this.domElement.classList.add("controller"),this.domElement.classList.add(n),this.$name=document.createElement("div"),this.$name.classList.add("name"),t.nextNameID=t.nextNameID||0,this.$name.id="lil-gui-name-"+ ++t.nextNameID,this.$widget=document.createElement(l),this.$widget.classList.add("widget"),this.$disable=this.$widget,this.domElement.appendChild(this.$name),this.domElement.appendChild(this.$widget),this.parent.children.push(this),this.parent.controllers.push(this),this.parent.$children.appendChild(this.domElement),this._listenCallback=this._listenCallback.bind(this),this.name(s);}name(t){return this._name=t,this.$name.innerHTML=t,this}onChange(t){return this._onChange=t,this}_callOnChange(){this.parent._callOnChange(this),void 0!==this._onChange&&this._onChange.call(this,this.getValue()),this._changed=true;}onFinishChange(t){return this._onFinishChange=t,this}_callOnFinishChange(){this._changed&&(this.parent._callOnFinishChange(this),void 0!==this._onFinishChange&&this._onFinishChange.call(this,this.getValue())),this._changed=false;}reset(){return this.setValue(this.initialValue),this._callOnFinishChange(),this}enable(t=true){return this.disable(!t)}disable(t=true){return t===this._disabled||(this._disabled=t,this.domElement.classList.toggle("disabled",t),this.$disable.toggleAttribute("disabled",t)),this}show(t=true){return this._hidden=!t,this.domElement.style.display=this._hidden?"none":"",this}hide(){return this.show(false)}options(t){const i=this.parent.add(this.object,this.property,t);return i.name(this._name),this.destroy(),i}min(t){return this}max(t){return this}step(t){return this}decimals(t){return this}listen(t=true){return this._listening=t,void 0!==this._listenCallbackID&&(cancelAnimationFrame(this._listenCallbackID),this._listenCallbackID=void 0),this._listening&&this._listenCallback(),this}_listenCallback(){this._listenCallbackID=requestAnimationFrame(this._listenCallback);const t=this.save();t!==this._listenPrevValue&&this.updateDisplay(),this._listenPrevValue=t;}getValue(){return this.object[this.property]}setValue(t){return this.object[this.property]=t,this._callOnChange(),this.updateDisplay(),this}updateDisplay(){return this}load(t){return this.setValue(t),this._callOnFinishChange(),this}save(){return this.getValue()}destroy(){this.listen(false),this.parent.children.splice(this.parent.children.indexOf(this),1),this.parent.controllers.splice(this.parent.controllers.indexOf(this),1),this.parent.$children.removeChild(this.domElement);}}class i extends t{constructor(t,i,e){super(t,i,e,"boolean","label"),this.$input=document.createElement("input"),this.$input.setAttribute("type","checkbox"),this.$input.setAttribute("aria-labelledby",this.$name.id),this.$widget.appendChild(this.$input),this.$input.addEventListener("change",()=>{this.setValue(this.$input.checked),this._callOnFinishChange();}),this.$disable=this.$input,this.updateDisplay();}updateDisplay(){return this.$input.checked=this.getValue(),this}}function e(t){let i,e;return (i=t.match(/(#|0x)?([a-f0-9]{6})/i))?e=i[2]:(i=t.match(/rgb\(\s*(\d*)\s*,\s*(\d*)\s*,\s*(\d*)\s*\)/))?e=parseInt(i[1]).toString(16).padStart(2,0)+parseInt(i[2]).toString(16).padStart(2,0)+parseInt(i[3]).toString(16).padStart(2,0):(i=t.match(/^#?([a-f0-9])([a-f0-9])([a-f0-9])$/i))&&(e=i[1]+i[1]+i[2]+i[2]+i[3]+i[3]),!!e&&"#"+e}const s={isPrimitive:true,match:t=>"string"==typeof t,fromHexString:e,toHexString:e},n={isPrimitive:true,match:t=>"number"==typeof t,fromHexString:t=>parseInt(t.substring(1),16),toHexString:t=>"#"+t.toString(16).padStart(6,0)},l={isPrimitive:false,match:Array.isArray,fromHexString(t,i,e=1){const s=n.fromHexString(t);i[0]=(s>>16&255)/255*e,i[1]=(s>>8&255)/255*e,i[2]=(255&s)/255*e;},toHexString:([t,i,e],s=1)=>n.toHexString(t*(s=255/s)<<16^i*s<<8^e*s<<0)},r={isPrimitive:false,match:t=>Object(t)===t,fromHexString(t,i,e=1){const s=n.fromHexString(t);i.r=(s>>16&255)/255*e,i.g=(s>>8&255)/255*e,i.b=(255&s)/255*e;},toHexString:({r:t,g:i,b:e},s=1)=>n.toHexString(t*(s=255/s)<<16^i*s<<8^e*s<<0)},o=[s,n,l,r];class a extends t{constructor(t,i,s,n){var l;super(t,i,s,"color"),this.$input=document.createElement("input"),this.$input.setAttribute("type","color"),this.$input.setAttribute("tabindex",-1),this.$input.setAttribute("aria-labelledby",this.$name.id),this.$text=document.createElement("input"),this.$text.setAttribute("type","text"),this.$text.setAttribute("spellcheck","false"),this.$text.setAttribute("aria-labelledby",this.$name.id),this.$display=document.createElement("div"),this.$display.classList.add("display"),this.$display.appendChild(this.$input),this.$widget.appendChild(this.$display),this.$widget.appendChild(this.$text),this._format=(l=this.initialValue,o.find(t=>t.match(l))),this._rgbScale=n,this._initialValueHexString=this.save(),this._textFocused=false,this.$input.addEventListener("input",()=>{this._setValueFromHexString(this.$input.value);}),this.$input.addEventListener("blur",()=>{this._callOnFinishChange();}),this.$text.addEventListener("input",()=>{const t=e(this.$text.value);t&&this._setValueFromHexString(t);}),this.$text.addEventListener("focus",()=>{this._textFocused=true,this.$text.select();}),this.$text.addEventListener("blur",()=>{this._textFocused=false,this.updateDisplay(),this._callOnFinishChange();}),this.$disable=this.$text,this.updateDisplay();}reset(){return this._setValueFromHexString(this._initialValueHexString),this}_setValueFromHexString(t){if(this._format.isPrimitive){const i=this._format.fromHexString(t);this.setValue(i);}else this._format.fromHexString(t,this.getValue(),this._rgbScale),this._callOnChange(),this.updateDisplay();}save(){return this._format.toHexString(this.getValue(),this._rgbScale)}load(t){return this._setValueFromHexString(t),this._callOnFinishChange(),this}updateDisplay(){return this.$input.value=this._format.toHexString(this.getValue(),this._rgbScale),this._textFocused||(this.$text.value=this.$input.value.substring(1)),this.$display.style.backgroundColor=this.$input.value,this}}class h extends t{constructor(t,i,e){super(t,i,e,"function"),this.$button=document.createElement("button"),this.$button.appendChild(this.$name),this.$widget.appendChild(this.$button),this.$button.addEventListener("click",t=>{t.preventDefault(),this.getValue().call(this.object);}),this.$button.addEventListener("touchstart",()=>{},{passive:true}),this.$disable=this.$button;}}class d extends t{constructor(t,i,e,s,n,l){super(t,i,e,"number"),this._initInput(),this.min(s),this.max(n);const r=void 0!==l;this.step(r?l:this._getImplicitStep(),r),this.updateDisplay();}decimals(t){return this._decimals=t,this.updateDisplay(),this}min(t){return this._min=t,this._onUpdateMinMax(),this}max(t){return this._max=t,this._onUpdateMinMax(),this}step(t,i=true){return this._step=t,this._stepExplicit=i,this}updateDisplay(){const t=this.getValue();if(this._hasSlider){let i=(t-this._min)/(this._max-this._min);i=Math.max(0,Math.min(i,1)),this.$fill.style.width=100*i+"%";}return this._inputFocused||(this.$input.value=void 0===this._decimals?t:t.toFixed(this._decimals)),this}_initInput(){this.$input=document.createElement("input"),this.$input.setAttribute("type","number"),this.$input.setAttribute("step","any"),this.$input.setAttribute("aria-labelledby",this.$name.id),this.$widget.appendChild(this.$input),this.$disable=this.$input;const t=t=>{const i=parseFloat(this.$input.value);isNaN(i)||(this._snapClampSetValue(i+t),this.$input.value=this.getValue());};let i,e,s,n,l,r=false;const o=t=>{if(r){const s=t.clientX-i,n=t.clientY-e;Math.abs(n)>5?(t.preventDefault(),this.$input.blur(),r=false,this._setDraggingStyle(true,"vertical")):Math.abs(s)>5&&a();}if(!r){const i=t.clientY-s;l-=i*this._step*this._arrowKeyMultiplier(t),n+l>this._max?l=this._max-n:n+l<this._min&&(l=this._min-n),this._snapClampSetValue(n+l);}s=t.clientY;},a=()=>{this._setDraggingStyle(false,"vertical"),this._callOnFinishChange(),window.removeEventListener("mousemove",o),window.removeEventListener("mouseup",a);};this.$input.addEventListener("input",()=>{let t=parseFloat(this.$input.value);isNaN(t)||(this._stepExplicit&&(t=this._snap(t)),this.setValue(this._clamp(t)));}),this.$input.addEventListener("keydown",i=>{"Enter"===i.code&&this.$input.blur(),"ArrowUp"===i.code&&(i.preventDefault(),t(this._step*this._arrowKeyMultiplier(i))),"ArrowDown"===i.code&&(i.preventDefault(),t(this._step*this._arrowKeyMultiplier(i)*-1));}),this.$input.addEventListener("wheel",i=>{this._inputFocused&&(i.preventDefault(),t(this._step*this._normalizeMouseWheel(i)));},{passive:false}),this.$input.addEventListener("mousedown",t=>{i=t.clientX,e=s=t.clientY,r=true,n=this.getValue(),l=0,window.addEventListener("mousemove",o),window.addEventListener("mouseup",a);}),this.$input.addEventListener("focus",()=>{this._inputFocused=true;}),this.$input.addEventListener("blur",()=>{this._inputFocused=false,this.updateDisplay(),this._callOnFinishChange();});}_initSlider(){this._hasSlider=true,this.$slider=document.createElement("div"),this.$slider.classList.add("slider"),this.$fill=document.createElement("div"),this.$fill.classList.add("fill"),this.$slider.appendChild(this.$fill),this.$widget.insertBefore(this.$slider,this.$input),this.domElement.classList.add("hasSlider");const t=t=>{const i=this.$slider.getBoundingClientRect();let e=(s=t,n=i.left,l=i.right,r=this._min,o=this._max,(s-n)/(l-n)*(o-r)+r);var s,n,l,r,o;this._snapClampSetValue(e);},i=i=>{t(i.clientX);},e=()=>{this._callOnFinishChange(),this._setDraggingStyle(false),window.removeEventListener("mousemove",i),window.removeEventListener("mouseup",e);};let s,n,l=false;const r=i=>{i.preventDefault(),this._setDraggingStyle(true),t(i.touches[0].clientX),l=false;},o=i=>{if(l){const t=i.touches[0].clientX-s,e=i.touches[0].clientY-n;Math.abs(t)>Math.abs(e)?r(i):(window.removeEventListener("touchmove",o),window.removeEventListener("touchend",a));}else i.preventDefault(),t(i.touches[0].clientX);},a=()=>{this._callOnFinishChange(),this._setDraggingStyle(false),window.removeEventListener("touchmove",o),window.removeEventListener("touchend",a);},h=this._callOnFinishChange.bind(this);let d;this.$slider.addEventListener("mousedown",s=>{this._setDraggingStyle(true),t(s.clientX),window.addEventListener("mousemove",i),window.addEventListener("mouseup",e);}),this.$slider.addEventListener("touchstart",t=>{t.touches.length>1||(this._hasScrollBar?(s=t.touches[0].clientX,n=t.touches[0].clientY,l=true):r(t),window.addEventListener("touchmove",o,{passive:false}),window.addEventListener("touchend",a));},{passive:false}),this.$slider.addEventListener("wheel",t=>{if(Math.abs(t.deltaX)<Math.abs(t.deltaY)&&this._hasScrollBar)return;t.preventDefault();const i=this._normalizeMouseWheel(t)*this._step;this._snapClampSetValue(this.getValue()+i),this.$input.value=this.getValue(),clearTimeout(d),d=setTimeout(h,400);},{passive:false});}_setDraggingStyle(t,i="horizontal"){this.$slider&&this.$slider.classList.toggle("active",t),document.body.classList.toggle("lil-gui-dragging",t),document.body.classList.toggle("lil-gui-"+i,t);}_getImplicitStep(){return this._hasMin&&this._hasMax?(this._max-this._min)/1e3:.1}_onUpdateMinMax(){!this._hasSlider&&this._hasMin&&this._hasMax&&(this._stepExplicit||this.step(this._getImplicitStep(),false),this._initSlider(),this.updateDisplay());}_normalizeMouseWheel(t){let{deltaX:i,deltaY:e}=t;Math.floor(t.deltaY)!==t.deltaY&&t.wheelDelta&&(i=0,e=-t.wheelDelta/120,e*=this._stepExplicit?1:10);return i+-e}_arrowKeyMultiplier(t){let i=this._stepExplicit?1:10;return t.shiftKey?i*=10:t.altKey&&(i/=10),i}_snap(t){const i=Math.round(t/this._step)*this._step;return parseFloat(i.toPrecision(15))}_clamp(t){return t<this._min&&(t=this._min),t>this._max&&(t=this._max),t}_snapClampSetValue(t){this.setValue(this._clamp(this._snap(t)));}get _hasScrollBar(){const t=this.parent.root.$children;return t.scrollHeight>t.clientHeight}get _hasMin(){return void 0!==this._min}get _hasMax(){return void 0!==this._max}}class c extends t{constructor(t,i,e,s){super(t,i,e,"option"),this.$select=document.createElement("select"),this.$select.setAttribute("aria-labelledby",this.$name.id),this.$display=document.createElement("div"),this.$display.classList.add("display"),this._values=Array.isArray(s)?s:Object.values(s),this._names=Array.isArray(s)?s:Object.keys(s),this._names.forEach(t=>{const i=document.createElement("option");i.innerHTML=t,this.$select.appendChild(i);}),this.$select.addEventListener("change",()=>{this.setValue(this._values[this.$select.selectedIndex]),this._callOnFinishChange();}),this.$select.addEventListener("focus",()=>{this.$display.classList.add("focus");}),this.$select.addEventListener("blur",()=>{this.$display.classList.remove("focus");}),this.$widget.appendChild(this.$select),this.$widget.appendChild(this.$display),this.$disable=this.$select,this.updateDisplay();}updateDisplay(){const t=this.getValue(),i=this._values.indexOf(t);return this.$select.selectedIndex=i,this.$display.innerHTML=-1===i?t:this._names[i],this}}class u extends t{constructor(t,i,e){super(t,i,e,"string"),this.$input=document.createElement("input"),this.$input.setAttribute("type","text"),this.$input.setAttribute("aria-labelledby",this.$name.id),this.$input.addEventListener("input",()=>{this.setValue(this.$input.value);}),this.$input.addEventListener("keydown",t=>{"Enter"===t.code&&this.$input.blur();}),this.$input.addEventListener("blur",()=>{this._callOnFinishChange();}),this.$widget.appendChild(this.$input),this.$disable=this.$input,this.updateDisplay();}updateDisplay(){return this.$input.value=this.getValue(),this}}let p=false;class g{constructor({parent:t,autoPlace:i=void 0===t,container:e,width:s,title:n="Controls",injectStyles:l=true,touchStyles:r=true}={}){if(this.parent=t,this.root=t?t.root:this,this.children=[],this.controllers=[],this.folders=[],this._closed=false,this._hidden=false,this.domElement=document.createElement("div"),this.domElement.classList.add("lil-gui"),this.$title=document.createElement("div"),this.$title.classList.add("title"),this.$title.setAttribute("role","button"),this.$title.setAttribute("aria-expanded",true),this.$title.setAttribute("tabindex",0),this.$title.addEventListener("click",()=>this.openAnimated(this._closed)),this.$title.addEventListener("keydown",t=>{"Enter"!==t.code&&"Space"!==t.code||(t.preventDefault(),this.$title.click());}),this.$title.addEventListener("touchstart",()=>{},{passive:true}),this.$children=document.createElement("div"),this.$children.classList.add("children"),this.domElement.appendChild(this.$title),this.domElement.appendChild(this.$children),this.title(n),r&&this.domElement.classList.add("allow-touch-styles"),this.parent)return this.parent.children.push(this),this.parent.folders.push(this),void this.parent.$children.appendChild(this.domElement);this.domElement.classList.add("root"),!p&&l&&(!function(t){const i=document.createElement("style");i.innerHTML=t;const e=document.querySelector("head link[rel=stylesheet], head style");e?document.head.insertBefore(i,e):document.head.appendChild(i);}('.lil-gui{--background-color:#1f1f1f;--text-color:#ebebeb;--title-background-color:#111;--title-text-color:#ebebeb;--widget-color:#424242;--hover-color:#4f4f4f;--focus-color:#595959;--number-color:#2cc9ff;--string-color:#a2db3c;--font-size:11px;--input-font-size:11px;--font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;--font-family-mono:Menlo,Monaco,Consolas,"Droid Sans Mono",monospace;--padding:4px;--spacing:4px;--widget-height:20px;--name-width:45%;--slider-knob-width:2px;--slider-input-width:27%;--color-input-width:27%;--slider-input-min-width:45px;--color-input-min-width:45px;--folder-indent:7px;--widget-padding:0 0 0 3px;--widget-border-radius:2px;--checkbox-size:calc(var(--widget-height)*0.75);--scrollbar-width:5px;background-color:var(--background-color);color:var(--text-color);font-family:var(--font-family);font-size:var(--font-size);font-style:normal;font-weight:400;line-height:1;text-align:left;touch-action:manipulation;user-select:none;-webkit-user-select:none}.lil-gui,.lil-gui *{box-sizing:border-box;margin:0;padding:0}.lil-gui.root{display:flex;flex-direction:column;width:var(--width,245px)}.lil-gui.root>.title{background:var(--title-background-color);color:var(--title-text-color)}.lil-gui.root>.children{overflow-x:hidden;overflow-y:auto}.lil-gui.root>.children::-webkit-scrollbar{background:var(--background-color);height:var(--scrollbar-width);width:var(--scrollbar-width)}.lil-gui.root>.children::-webkit-scrollbar-thumb{background:var(--focus-color);border-radius:var(--scrollbar-width)}.lil-gui.force-touch-styles{--widget-height:28px;--padding:6px;--spacing:6px;--font-size:13px;--input-font-size:16px;--folder-indent:10px;--scrollbar-width:7px;--slider-input-min-width:50px;--color-input-min-width:65px}.lil-gui.autoPlace{max-height:100%;position:fixed;right:15px;top:0;z-index:1001}.lil-gui .controller{align-items:center;display:flex;margin:var(--spacing) 0;padding:0 var(--padding)}.lil-gui .controller.disabled{opacity:.5}.lil-gui .controller.disabled,.lil-gui .controller.disabled *{pointer-events:none!important}.lil-gui .controller>.name{flex-shrink:0;line-height:var(--widget-height);min-width:var(--name-width);padding-right:var(--spacing);white-space:pre}.lil-gui .controller .widget{align-items:center;display:flex;min-height:var(--widget-height);position:relative;width:100%}.lil-gui .controller.string input{color:var(--string-color)}.lil-gui .controller.boolean .widget{cursor:pointer}.lil-gui .controller.color .display{border-radius:var(--widget-border-radius);height:var(--widget-height);position:relative;width:100%}.lil-gui .controller.color input[type=color]{cursor:pointer;height:100%;opacity:0;width:100%}.lil-gui .controller.color input[type=text]{flex-shrink:0;font-family:var(--font-family-mono);margin-left:var(--spacing);min-width:var(--color-input-min-width);width:var(--color-input-width)}.lil-gui .controller.option select{max-width:100%;opacity:0;position:absolute;width:100%}.lil-gui .controller.option .display{background:var(--widget-color);border-radius:var(--widget-border-radius);height:var(--widget-height);line-height:var(--widget-height);max-width:100%;overflow:hidden;padding-left:.55em;padding-right:1.75em;pointer-events:none;position:relative;word-break:break-all}.lil-gui .controller.option .display.active{background:var(--focus-color)}.lil-gui .controller.option .display:after{bottom:0;content:"↕";font-family:lil-gui;padding-right:.375em;position:absolute;right:0;top:0}.lil-gui .controller.option .widget,.lil-gui .controller.option select{cursor:pointer}.lil-gui .controller.number input{color:var(--number-color)}.lil-gui .controller.number.hasSlider input{flex-shrink:0;margin-left:var(--spacing);min-width:var(--slider-input-min-width);width:var(--slider-input-width)}.lil-gui .controller.number .slider{background-color:var(--widget-color);border-radius:var(--widget-border-radius);cursor:ew-resize;height:var(--widget-height);overflow:hidden;padding-right:var(--slider-knob-width);touch-action:pan-y;width:100%}.lil-gui .controller.number .slider.active{background-color:var(--focus-color)}.lil-gui .controller.number .slider.active .fill{opacity:.95}.lil-gui .controller.number .fill{border-right:var(--slider-knob-width) solid var(--number-color);box-sizing:content-box;height:100%}.lil-gui-dragging .lil-gui{--hover-color:var(--widget-color)}.lil-gui-dragging *{cursor:ew-resize!important}.lil-gui-dragging.lil-gui-vertical *{cursor:ns-resize!important}.lil-gui .title{--title-height:calc(var(--widget-height) + var(--spacing)*1.25);-webkit-tap-highlight-color:transparent;text-decoration-skip:objects;cursor:pointer;font-weight:600;height:var(--title-height);line-height:calc(var(--title-height) - 4px);outline:none;padding:0 var(--padding)}.lil-gui .title:before{content:"▾";display:inline-block;font-family:lil-gui;padding-right:2px}.lil-gui .title:active{background:var(--title-background-color);opacity:.75}.lil-gui.root>.title:focus{text-decoration:none!important}.lil-gui.closed>.title:before{content:"▸"}.lil-gui.closed>.children{opacity:0;transform:translateY(-7px)}.lil-gui.closed:not(.transition)>.children{display:none}.lil-gui.transition>.children{overflow:hidden;pointer-events:none;transition-duration:.3s;transition-property:height,opacity,transform;transition-timing-function:cubic-bezier(.2,.6,.35,1)}.lil-gui .children:empty:before{content:"Empty";display:block;font-style:italic;height:var(--widget-height);line-height:var(--widget-height);margin:var(--spacing) 0;opacity:.5;padding:0 var(--padding)}.lil-gui.root>.children>.lil-gui>.title{border-width:0;border-bottom:1px solid var(--widget-color);border-left:0 solid var(--widget-color);border-right:0 solid var(--widget-color);border-top:1px solid var(--widget-color);transition:border-color .3s}.lil-gui.root>.children>.lil-gui.closed>.title{border-bottom-color:transparent}.lil-gui+.controller{border-top:1px solid var(--widget-color);margin-top:0;padding-top:var(--spacing)}.lil-gui .lil-gui .lil-gui>.title{border:none}.lil-gui .lil-gui .lil-gui>.children{border:none;border-left:2px solid var(--widget-color);margin-left:var(--folder-indent)}.lil-gui .lil-gui .controller{border:none}.lil-gui input{-webkit-tap-highlight-color:transparent;background:var(--widget-color);border:0;border-radius:var(--widget-border-radius);color:var(--text-color);font-family:var(--font-family);font-size:var(--input-font-size);height:var(--widget-height);outline:none;width:100%}.lil-gui input:disabled{opacity:1}.lil-gui input[type=number],.lil-gui input[type=text]{padding:var(--widget-padding)}.lil-gui input[type=number]:focus,.lil-gui input[type=text]:focus{background:var(--focus-color)}.lil-gui input::-webkit-inner-spin-button,.lil-gui input::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}.lil-gui input[type=number]{-moz-appearance:textfield}.lil-gui input[type=checkbox]{appearance:none;-webkit-appearance:none;border-radius:var(--widget-border-radius);cursor:pointer;height:var(--checkbox-size);text-align:center;width:var(--checkbox-size)}.lil-gui input[type=checkbox]:checked:before{content:"✓";font-family:lil-gui;font-size:var(--checkbox-size);line-height:var(--checkbox-size)}.lil-gui button{-webkit-tap-highlight-color:transparent;background:var(--widget-color);border:1px solid var(--widget-color);border-radius:var(--widget-border-radius);color:var(--text-color);cursor:pointer;font-family:var(--font-family);font-size:var(--font-size);height:var(--widget-height);line-height:calc(var(--widget-height) - 4px);outline:none;text-align:center;text-transform:none;width:100%}.lil-gui button:active{background:var(--focus-color)}@font-face{font-family:lil-gui;src:url("data:application/font-woff;charset=utf-8;base64,d09GRgABAAAAAAUsAAsAAAAACJwAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAABHU1VCAAABCAAAAH4AAADAImwmYE9TLzIAAAGIAAAAPwAAAGBKqH5SY21hcAAAAcgAAAD0AAACrukyyJBnbHlmAAACvAAAAF8AAACEIZpWH2hlYWQAAAMcAAAAJwAAADZfcj2zaGhlYQAAA0QAAAAYAAAAJAC5AHhobXR4AAADXAAAABAAAABMAZAAAGxvY2EAAANsAAAAFAAAACgCEgIybWF4cAAAA4AAAAAeAAAAIAEfABJuYW1lAAADoAAAASIAAAIK9SUU/XBvc3QAAATEAAAAZgAAAJCTcMc2eJxVjbEOgjAURU+hFRBK1dGRL+ALnAiToyMLEzFpnPz/eAshwSa97517c/MwwJmeB9kwPl+0cf5+uGPZXsqPu4nvZabcSZldZ6kfyWnomFY/eScKqZNWupKJO6kXN3K9uCVoL7iInPr1X5baXs3tjuMqCtzEuagm/AAlzQgPAAB4nGNgYRBlnMDAysDAYM/gBiT5oLQBAwuDJAMDEwMrMwNWEJDmmsJwgCFeXZghBcjlZMgFCzOiKOIFAB71Bb8AeJy1kjFuwkAQRZ+DwRAwBtNQRUGKQ8OdKCAWUhAgKLhIuAsVSpWz5Bbkj3dEgYiUIszqWdpZe+Z7/wB1oCYmIoboiwiLT2WjKl/jscrHfGg/pKdMkyklC5Zs2LEfHYpjcRoPzme9MWWmk3dWbK9ObkWkikOetJ554fWyoEsmdSlt+uR0pCJR34b6t/TVg1SY3sYvdf8vuiKrpyaDXDISiegp17p7579Gp3p++y7HPAiY9pmTibljrr85qSidtlg4+l25GLCaS8e6rRxNBmsnERunKbaOObRz7N72ju5vdAjYpBXHgJylOAVsMseDAPEP8LYoUHicY2BiAAEfhiAGJgZWBgZ7RnFRdnVJELCQlBSRlATJMoLV2DK4glSYs6ubq5vbKrJLSbGrgEmovDuDJVhe3VzcXFwNLCOILB/C4IuQ1xTn5FPilBTj5FPmBAB4WwoqAHicY2BkYGAA4sk1sR/j+W2+MnAzpDBgAyEMQUCSg4EJxAEAwUgFHgB4nGNgZGBgSGFggJMhDIwMqEAYAByHATJ4nGNgAIIUNEwmAABl3AGReJxjYAACIQYlBiMGJ3wQAEcQBEV4nGNgZGBgEGZgY2BiAAEQyQWEDAz/wXwGAAsPATIAAHicXdBNSsNAHAXwl35iA0UQXYnMShfS9GPZA7T7LgIu03SSpkwzYTIt1BN4Ak/gKTyAeCxfw39jZkjymzcvAwmAW/wgwHUEGDb36+jQQ3GXGot79L24jxCP4gHzF/EIr4jEIe7wxhOC3g2TMYy4Q7+Lu/SHuEd/ivt4wJd4wPxbPEKMX3GI5+DJFGaSn4qNzk8mcbKSR6xdXdhSzaOZJGtdapd4vVPbi6rP+cL7TGXOHtXKll4bY1Xl7EGnPtp7Xy2n00zyKLVHfkHBa4IcJ2oD3cgggWvt/V/FbDrUlEUJhTn/0azVWbNTNr0Ens8de1tceK9xZmfB1CPjOmPH4kitmvOubcNpmVTN3oFJyjzCvnmrwhJTzqzVj9jiSX911FjeAAB4nG3HMRKCMBBA0f0giiKi4DU8k0V2GWbIZDOh4PoWWvq6J5V8If9NVNQcaDhyouXMhY4rPTcG7jwYmXhKq8Wz+p762aNaeYXom2n3m2dLTVgsrCgFJ7OTmIkYbwIbC6vIB7WmFfAAAA==") format("woff")}@media (pointer:coarse){.lil-gui.allow-touch-styles{--widget-height:28px;--padding:6px;--spacing:6px;--font-size:13px;--input-font-size:16px;--folder-indent:10px;--scrollbar-width:7px;--slider-input-min-width:50px;--color-input-min-width:65px}}@media (hover:hover){.lil-gui .controller.color .display:hover:before{border:1px solid #fff9;border-radius:var(--widget-border-radius);bottom:0;content:" ";display:block;left:0;position:absolute;right:0;top:0}.lil-gui .controller.option .display.focus{background:var(--focus-color)}.lil-gui .controller.option .widget:hover .display{background:var(--hover-color)}.lil-gui .controller.number .slider:hover{background-color:var(--hover-color)}body:not(.lil-gui-dragging) .lil-gui .title:hover{background:var(--title-background-color);opacity:.85}.lil-gui .title:focus{text-decoration:underline var(--focus-color)}.lil-gui input:hover{background:var(--hover-color)}.lil-gui input:active{background:var(--focus-color)}.lil-gui input[type=checkbox]:focus{box-shadow:inset 0 0 0 1px var(--focus-color)}.lil-gui button:hover{background:var(--hover-color);border-color:var(--hover-color)}.lil-gui button:focus{border-color:var(--focus-color)}}'),p=true),e?e.appendChild(this.domElement):i&&(this.domElement.classList.add("autoPlace"),document.body.appendChild(this.domElement)),s&&this.domElement.style.setProperty("--width",s+"px"),this.domElement.addEventListener("keydown",t=>t.stopPropagation()),this.domElement.addEventListener("keyup",t=>t.stopPropagation());}add(t,e,s,n,l){if(Object(s)===s)return new c(this,t,e,s);const r=t[e];switch(typeof r){case "number":return new d(this,t,e,s,n,l);case "boolean":return new i(this,t,e);case "string":return new u(this,t,e);case "function":return new h(this,t,e)}console.error("gui.add failed\n\tproperty:",e,"\n\tobject:",t,"\n\tvalue:",r);}addColor(t,i,e=1){return new a(this,t,i,e)}addFolder(t){return new g({parent:this,title:t})}load(t,i=true){return t.controllers&&this.controllers.forEach(i=>{i instanceof h||i._name in t.controllers&&i.load(t.controllers[i._name]);}),i&&t.folders&&this.folders.forEach(i=>{i._title in t.folders&&i.load(t.folders[i._title]);}),this}save(t=true){const i={controllers:{},folders:{}};return this.controllers.forEach(t=>{if(!(t instanceof h)){if(t._name in i.controllers)throw new Error(`Cannot save GUI with duplicate property "${t._name}"`);i.controllers[t._name]=t.save();}}),t&&this.folders.forEach(t=>{if(t._title in i.folders)throw new Error(`Cannot save GUI with duplicate folder "${t._title}"`);i.folders[t._title]=t.save();}),i}open(t=true){return this._closed=!t,this.$title.setAttribute("aria-expanded",!this._closed),this.domElement.classList.toggle("closed",this._closed),this}close(){return this.open(false)}show(t=true){return this._hidden=!t,this.domElement.style.display=this._hidden?"none":"",this}hide(){return this.show(false)}openAnimated(t=true){return this._closed=!t,this.$title.setAttribute("aria-expanded",!this._closed),requestAnimationFrame(()=>{const i=this.$children.clientHeight;this.$children.style.height=i+"px",this.domElement.classList.add("transition");const e=t=>{t.target===this.$children&&(this.$children.style.height="",this.domElement.classList.remove("transition"),this.$children.removeEventListener("transitionend",e));};this.$children.addEventListener("transitionend",e);const s=t?this.$children.scrollHeight:0;this.domElement.classList.toggle("closed",!t),requestAnimationFrame(()=>{this.$children.style.height=s+"px";});}),this}title(t){return this._title=t,this.$title.innerHTML=t,this}reset(t=true){return (t?this.controllersRecursive():this.controllers).forEach(t=>t.reset()),this}onChange(t){return this._onChange=t,this}_callOnChange(t){this.parent&&this.parent._callOnChange(t),void 0!==this._onChange&&this._onChange.call(this,{object:t.object,property:t.property,value:t.getValue(),controller:t});}onFinishChange(t){return this._onFinishChange=t,this}_callOnFinishChange(t){this.parent&&this.parent._callOnFinishChange(t),void 0!==this._onFinishChange&&this._onFinishChange.call(this,{object:t.object,property:t.property,value:t.getValue(),controller:t});}destroy(){this.parent&&(this.parent.children.splice(this.parent.children.indexOf(this),1),this.parent.folders.splice(this.parent.folders.indexOf(this),1)),this.domElement.parentElement&&this.domElement.parentElement.removeChild(this.domElement),Array.from(this.children).forEach(t=>t.destroy());}controllersRecursive(){let t=Array.from(this.controllers);return this.folders.forEach(i=>{t=t.concat(i.controllersRecursive());}),t}foldersRecursive(){let t=Array.from(this.folders);return this.folders.forEach(i=>{t=t.concat(i.foldersRecursive());}),t}}

// OrbitControls performs orbiting, dollying (zooming), and panning.
// Unlike TrackballControls, it maintains the "up" direction object.up (+Y by default).
//
//    Orbit - left mouse / touch: one-finger move
//    Zoom - middle mouse, or mousewheel / touch: two-finger spread or squish
//    Pan - right mouse, or left mouse + ctrl/meta/shiftKey, or arrow keys / touch: two-finger move

const _changeEvent = { type: 'change' };
const _startEvent = { type: 'start' };
const _endEvent = { type: 'end' };
const _ray = new THREE.Ray();
const _plane = new THREE.Plane();
const _TILT_LIMIT = Math.cos( 70 * THREE.MathUtils.DEG2RAD );

const _v = new THREE.Vector3();
const _twoPI = 2 * Math.PI;

const _STATE = {
	NONE: -1,
	ROTATE: 0,
	DOLLY: 1,
	PAN: 2,
	TOUCH_ROTATE: 3,
	TOUCH_PAN: 4,
	TOUCH_DOLLY_PAN: 5,
	TOUCH_DOLLY_ROTATE: 6
};
const _EPS = 0.000001;

class OrbitControls extends THREE.Controls {

	constructor( object, domElement = null ) {

		super( object, domElement );

		this.state = _STATE.NONE;

		// Set to false to disable this control
		this.enabled = true;

		// "target" sets the location of focus, where the object orbits around
		this.target = new THREE.Vector3();

		// Sets the 3D cursor (similar to Blender), from which the maxTargetRadius takes effect
		this.cursor = new THREE.Vector3();

		// How far you can dolly in and out ( PerspectiveCamera only )
		this.minDistance = 0;
		this.maxDistance = Infinity;

		// How far you can zoom in and out ( OrthographicCamera only )
		this.minZoom = 0;
		this.maxZoom = Infinity;

		// Limit camera target within a spherical area around the cursor
		this.minTargetRadius = 0;
		this.maxTargetRadius = Infinity;

		// How far you can orbit vertically, upper and lower limits.
		// Range is 0 to Math.PI radians.
		this.minPolarAngle = 0; // radians
		this.maxPolarAngle = Math.PI; // radians

		// How far you can orbit horizontally, upper and lower limits.
		// If set, the interval [ min, max ] must be a sub-interval of [ - 2 PI, 2 PI ], with ( max - min < 2 PI )
		this.minAzimuthAngle = - Infinity; // radians
		this.maxAzimuthAngle = Infinity; // radians

		// Set to true to enable damping (inertia)
		// If damping is enabled, you must call controls.update() in your animation loop
		this.enableDamping = false;
		this.dampingFactor = 0.05;

		// This option actually enables dollying in and out; left as "zoom" for backwards compatibility.
		// Set to false to disable zooming
		this.enableZoom = true;
		this.zoomSpeed = 1.0;

		// Set to false to disable rotating
		this.enableRotate = true;
		this.rotateSpeed = 1.0;
		this.keyRotateSpeed = 1.0;

		// Set to false to disable panning
		this.enablePan = true;
		this.panSpeed = 1.0;
		this.screenSpacePanning = true; // if false, pan orthogonal to world-space direction camera.up
		this.keyPanSpeed = 7.0;	// pixels moved per arrow key push
		this.zoomToCursor = false;

		// Set to true to automatically rotate around the target
		// If auto-rotate is enabled, you must call controls.update() in your animation loop
		this.autoRotate = false;
		this.autoRotateSpeed = 2.0; // 30 seconds per orbit when fps is 60

		// The four arrow keys
		this.keys = { LEFT: 'ArrowLeft', UP: 'ArrowUp', RIGHT: 'ArrowRight', BOTTOM: 'ArrowDown' };

		// Mouse buttons
		this.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };

		// Touch fingers
		this.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };

		// for reset
		this.target0 = this.target.clone();
		this.position0 = this.object.position.clone();
		this.zoom0 = this.object.zoom;

		// the target DOM element for key events
		this._domElementKeyEvents = null;

		// internals

		this._lastPosition = new THREE.Vector3();
		this._lastQuaternion = new THREE.Quaternion();
		this._lastTargetPosition = new THREE.Vector3();

		// so camera.up is the orbit axis
		this._quat = new THREE.Quaternion().setFromUnitVectors( object.up, new THREE.Vector3( 0, 1, 0 ) );
		this._quatInverse = this._quat.clone().invert();

		// current position in spherical coordinates
		this._spherical = new THREE.Spherical();
		this._sphericalDelta = new THREE.Spherical();

		this._scale = 1;
		this._panOffset = new THREE.Vector3();

		this._rotateStart = new THREE.Vector2();
		this._rotateEnd = new THREE.Vector2();
		this._rotateDelta = new THREE.Vector2();

		this._panStart = new THREE.Vector2();
		this._panEnd = new THREE.Vector2();
		this._panDelta = new THREE.Vector2();

		this._dollyStart = new THREE.Vector2();
		this._dollyEnd = new THREE.Vector2();
		this._dollyDelta = new THREE.Vector2();

		this._dollyDirection = new THREE.Vector3();
		this._mouse = new THREE.Vector2();
		this._performCursorZoom = false;

		this._pointers = [];
		this._pointerPositions = {};

		this._controlActive = false;

		// event listeners

		this._onPointerMove = onPointerMove.bind( this );
		this._onPointerDown = onPointerDown.bind( this );
		this._onPointerUp = onPointerUp.bind( this );
		this._onContextMenu = onContextMenu.bind( this );
		this._onMouseWheel = onMouseWheel.bind( this );
		this._onKeyDown = onKeyDown.bind( this );

		this._onTouchStart = onTouchStart.bind( this );
		this._onTouchMove = onTouchMove.bind( this );

		this._onMouseDown = onMouseDown.bind( this );
		this._onMouseMove = onMouseMove.bind( this );

		this._interceptControlDown = interceptControlDown.bind( this );
		this._interceptControlUp = interceptControlUp.bind( this );

		//

		if ( this.domElement !== null ) {

			this.connect();

		}

		this.update();

	}

	connect() {

		this.domElement.addEventListener( 'pointerdown', this._onPointerDown );
		this.domElement.addEventListener( 'pointercancel', this._onPointerUp );

		this.domElement.addEventListener( 'contextmenu', this._onContextMenu );
		this.domElement.addEventListener( 'wheel', this._onMouseWheel, { passive: false } );

		const document = this.domElement.getRootNode(); // offscreen canvas compatibility
		document.addEventListener( 'keydown', this._interceptControlDown, { passive: true, capture: true } );

		this.domElement.style.touchAction = 'none'; // disable touch scroll

	}

	disconnect() {

		this.domElement.removeEventListener( 'pointerdown', this._onPointerDown );
		this.domElement.removeEventListener( 'pointermove', this._onPointerMove );
		this.domElement.removeEventListener( 'pointerup', this._onPointerUp );
		this.domElement.removeEventListener( 'pointercancel', this._onPointerUp );

		this.domElement.removeEventListener( 'wheel', this._onMouseWheel );
		this.domElement.removeEventListener( 'contextmenu', this._onContextMenu );

		this.stopListenToKeyEvents();

		const document = this.domElement.getRootNode(); // offscreen canvas compatibility
		document.removeEventListener( 'keydown', this._interceptControlDown, { capture: true } );

		this.domElement.style.touchAction = 'auto';

	}

	dispose() {

		this.disconnect();

	}

	getPolarAngle() {

		return this._spherical.phi;

	}

	getAzimuthalAngle() {

		return this._spherical.theta;

	}

	getDistance() {

		return this.object.position.distanceTo( this.target );

	}

	listenToKeyEvents( domElement ) {

		domElement.addEventListener( 'keydown', this._onKeyDown );
		this._domElementKeyEvents = domElement;

	}

	stopListenToKeyEvents() {

		if ( this._domElementKeyEvents !== null ) {

			this._domElementKeyEvents.removeEventListener( 'keydown', this._onKeyDown );
			this._domElementKeyEvents = null;

		}

	}

	saveState() {

		this.target0.copy( this.target );
		this.position0.copy( this.object.position );
		this.zoom0 = this.object.zoom;

	}

	reset() {

		this.target.copy( this.target0 );
		this.object.position.copy( this.position0 );
		this.object.zoom = this.zoom0;

		this.object.updateProjectionMatrix();
		this.dispatchEvent( _changeEvent );

		this.update();

		this.state = _STATE.NONE;

	}

	update( deltaTime = null ) {

		const position = this.object.position;

		_v.copy( position ).sub( this.target );

		// rotate offset to "y-axis-is-up" space
		_v.applyQuaternion( this._quat );

		// angle from z-axis around y-axis
		this._spherical.setFromVector3( _v );

		if ( this.autoRotate && this.state === _STATE.NONE ) {

			this._rotateLeft( this._getAutoRotationAngle( deltaTime ) );

		}

		if ( this.enableDamping ) {

			this._spherical.theta += this._sphericalDelta.theta * this.dampingFactor;
			this._spherical.phi += this._sphericalDelta.phi * this.dampingFactor;

		} else {

			this._spherical.theta += this._sphericalDelta.theta;
			this._spherical.phi += this._sphericalDelta.phi;

		}

		// restrict theta to be between desired limits

		let min = this.minAzimuthAngle;
		let max = this.maxAzimuthAngle;

		if ( isFinite( min ) && isFinite( max ) ) {

			if ( min < - Math.PI ) min += _twoPI; else if ( min > Math.PI ) min -= _twoPI;

			if ( max < - Math.PI ) max += _twoPI; else if ( max > Math.PI ) max -= _twoPI;

			if ( min <= max ) {

				this._spherical.theta = Math.max( min, Math.min( max, this._spherical.theta ) );

			} else {

				this._spherical.theta = ( this._spherical.theta > ( min + max ) / 2 ) ?
					Math.max( min, this._spherical.theta ) :
					Math.min( max, this._spherical.theta );

			}

		}

		// restrict phi to be between desired limits
		this._spherical.phi = Math.max( this.minPolarAngle, Math.min( this.maxPolarAngle, this._spherical.phi ) );

		this._spherical.makeSafe();


		// move target to panned location

		if ( this.enableDamping === true ) {

			this.target.addScaledVector( this._panOffset, this.dampingFactor );

		} else {

			this.target.add( this._panOffset );

		}

		// Limit the target distance from the cursor to create a sphere around the center of interest
		this.target.sub( this.cursor );
		this.target.clampLength( this.minTargetRadius, this.maxTargetRadius );
		this.target.add( this.cursor );

		let zoomChanged = false;
		// adjust the camera position based on zoom only if we're not zooming to the cursor or if it's an ortho camera
		// we adjust zoom later in these cases
		if ( this.zoomToCursor && this._performCursorZoom || this.object.isOrthographicCamera ) {

			this._spherical.radius = this._clampDistance( this._spherical.radius );

		} else {

			const prevRadius = this._spherical.radius;
			this._spherical.radius = this._clampDistance( this._spherical.radius * this._scale );
			zoomChanged = prevRadius != this._spherical.radius;

		}

		_v.setFromSpherical( this._spherical );

		// rotate offset back to "camera-up-vector-is-up" space
		_v.applyQuaternion( this._quatInverse );

		position.copy( this.target ).add( _v );

		this.object.lookAt( this.target );

		if ( this.enableDamping === true ) {

			this._sphericalDelta.theta *= ( 1 - this.dampingFactor );
			this._sphericalDelta.phi *= ( 1 - this.dampingFactor );

			this._panOffset.multiplyScalar( 1 - this.dampingFactor );

		} else {

			this._sphericalDelta.set( 0, 0, 0 );

			this._panOffset.set( 0, 0, 0 );

		}

		// adjust camera position
		if ( this.zoomToCursor && this._performCursorZoom ) {

			let newRadius = null;
			if ( this.object.isPerspectiveCamera ) {

				// move the camera down the pointer ray
				// this method avoids floating point error
				const prevRadius = _v.length();
				newRadius = this._clampDistance( prevRadius * this._scale );

				const radiusDelta = prevRadius - newRadius;
				this.object.position.addScaledVector( this._dollyDirection, radiusDelta );
				this.object.updateMatrixWorld();

				zoomChanged = !! radiusDelta;

			} else if ( this.object.isOrthographicCamera ) {

				// adjust the ortho camera position based on zoom changes
				const mouseBefore = new THREE.Vector3( this._mouse.x, this._mouse.y, 0 );
				mouseBefore.unproject( this.object );

				const prevZoom = this.object.zoom;
				this.object.zoom = Math.max( this.minZoom, Math.min( this.maxZoom, this.object.zoom / this._scale ) );
				this.object.updateProjectionMatrix();

				zoomChanged = prevZoom !== this.object.zoom;

				const mouseAfter = new THREE.Vector3( this._mouse.x, this._mouse.y, 0 );
				mouseAfter.unproject( this.object );

				this.object.position.sub( mouseAfter ).add( mouseBefore );
				this.object.updateMatrixWorld();

				newRadius = _v.length();

			} else {

				console.warn( 'WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled.' );
				this.zoomToCursor = false;

			}

			// handle the placement of the target
			if ( newRadius !== null ) {

				if ( this.screenSpacePanning ) {

					// position the orbit target in front of the new camera position
					this.target.set( 0, 0, -1 )
						.transformDirection( this.object.matrix )
						.multiplyScalar( newRadius )
						.add( this.object.position );

				} else {

					// get the ray and translation plane to compute target
					_ray.origin.copy( this.object.position );
					_ray.direction.set( 0, 0, -1 ).transformDirection( this.object.matrix );

					// if the camera is 20 degrees above the horizon then don't adjust the focus target to avoid
					// extremely large values
					if ( Math.abs( this.object.up.dot( _ray.direction ) ) < _TILT_LIMIT ) {

						this.object.lookAt( this.target );

					} else {

						_plane.setFromNormalAndCoplanarPoint( this.object.up, this.target );
						_ray.intersectPlane( _plane, this.target );

					}

				}

			}

		} else if ( this.object.isOrthographicCamera ) {

			const prevZoom = this.object.zoom;
			this.object.zoom = Math.max( this.minZoom, Math.min( this.maxZoom, this.object.zoom / this._scale ) );

			if ( prevZoom !== this.object.zoom ) {

				this.object.updateProjectionMatrix();
				zoomChanged = true;

			}

		}

		this._scale = 1;
		this._performCursorZoom = false;

		// update condition is:
		// min(camera displacement, camera rotation in radians)^2 > EPS
		// using small-angle approximation cos(x/2) = 1 - x^2 / 8

		if ( zoomChanged ||
			this._lastPosition.distanceToSquared( this.object.position ) > _EPS ||
			8 * ( 1 - this._lastQuaternion.dot( this.object.quaternion ) ) > _EPS ||
			this._lastTargetPosition.distanceToSquared( this.target ) > _EPS ) {

			this.dispatchEvent( _changeEvent );

			this._lastPosition.copy( this.object.position );
			this._lastQuaternion.copy( this.object.quaternion );
			this._lastTargetPosition.copy( this.target );

			return true;

		}

		return false;

	}

	_getAutoRotationAngle( deltaTime ) {

		if ( deltaTime !== null ) {

			return ( _twoPI / 60 * this.autoRotateSpeed ) * deltaTime;

		} else {

			return _twoPI / 60 / 60 * this.autoRotateSpeed;

		}

	}

	_getZoomScale( delta ) {

		const normalizedDelta = Math.abs( delta * 0.01 );
		return Math.pow( 0.95, this.zoomSpeed * normalizedDelta );

	}

	_rotateLeft( angle ) {

		this._sphericalDelta.theta -= angle;

	}

	_rotateUp( angle ) {

		this._sphericalDelta.phi -= angle;

	}

	_panLeft( distance, objectMatrix ) {

		_v.setFromMatrixColumn( objectMatrix, 0 ); // get X column of objectMatrix
		_v.multiplyScalar( - distance );

		this._panOffset.add( _v );

	}

	_panUp( distance, objectMatrix ) {

		if ( this.screenSpacePanning === true ) {

			_v.setFromMatrixColumn( objectMatrix, 1 );

		} else {

			_v.setFromMatrixColumn( objectMatrix, 0 );
			_v.crossVectors( this.object.up, _v );

		}

		_v.multiplyScalar( distance );

		this._panOffset.add( _v );

	}

	// deltaX and deltaY are in pixels; right and down are positive
	_pan( deltaX, deltaY ) {

		const element = this.domElement;

		if ( this.object.isPerspectiveCamera ) {

			// perspective
			const position = this.object.position;
			_v.copy( position ).sub( this.target );
			let targetDistance = _v.length();

			// half of the fov is center to top of screen
			targetDistance *= Math.tan( ( this.object.fov / 2 ) * Math.PI / 180.0 );

			// we use only clientHeight here so aspect ratio does not distort speed
			this._panLeft( 2 * deltaX * targetDistance / element.clientHeight, this.object.matrix );
			this._panUp( 2 * deltaY * targetDistance / element.clientHeight, this.object.matrix );

		} else if ( this.object.isOrthographicCamera ) {

			// orthographic
			this._panLeft( deltaX * ( this.object.right - this.object.left ) / this.object.zoom / element.clientWidth, this.object.matrix );
			this._panUp( deltaY * ( this.object.top - this.object.bottom ) / this.object.zoom / element.clientHeight, this.object.matrix );

		} else {

			// camera neither orthographic nor perspective
			console.warn( 'WARNING: OrbitControls.js encountered an unknown camera type - pan disabled.' );
			this.enablePan = false;

		}

	}

	_dollyOut( dollyScale ) {

		if ( this.object.isPerspectiveCamera || this.object.isOrthographicCamera ) {

			this._scale /= dollyScale;

		} else {

			console.warn( 'WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.' );
			this.enableZoom = false;

		}

	}

	_dollyIn( dollyScale ) {

		if ( this.object.isPerspectiveCamera || this.object.isOrthographicCamera ) {

			this._scale *= dollyScale;

		} else {

			console.warn( 'WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.' );
			this.enableZoom = false;

		}

	}

	_updateZoomParameters( x, y ) {

		if ( ! this.zoomToCursor ) {

			return;

		}

		this._performCursorZoom = true;

		const rect = this.domElement.getBoundingClientRect();
		const dx = x - rect.left;
		const dy = y - rect.top;
		const w = rect.width;
		const h = rect.height;

		this._mouse.x = ( dx / w ) * 2 - 1;
		this._mouse.y = - ( dy / h ) * 2 + 1;

		this._dollyDirection.set( this._mouse.x, this._mouse.y, 1 ).unproject( this.object ).sub( this.object.position ).normalize();

	}

	_clampDistance( dist ) {

		return Math.max( this.minDistance, Math.min( this.maxDistance, dist ) );

	}

	//
	// event callbacks - update the object state
	//

	_handleMouseDownRotate( event ) {

		this._rotateStart.set( event.clientX, event.clientY );

	}

	_handleMouseDownDolly( event ) {

		this._updateZoomParameters( event.clientX, event.clientX );
		this._dollyStart.set( event.clientX, event.clientY );

	}

	_handleMouseDownPan( event ) {

		this._panStart.set( event.clientX, event.clientY );

	}

	_handleMouseMoveRotate( event ) {

		this._rotateEnd.set( event.clientX, event.clientY );

		this._rotateDelta.subVectors( this._rotateEnd, this._rotateStart ).multiplyScalar( this.rotateSpeed );

		const element = this.domElement;

		this._rotateLeft( _twoPI * this._rotateDelta.x / element.clientHeight ); // yes, height

		this._rotateUp( _twoPI * this._rotateDelta.y / element.clientHeight );

		this._rotateStart.copy( this._rotateEnd );

		this.update();

	}

	_handleMouseMoveDolly( event ) {

		this._dollyEnd.set( event.clientX, event.clientY );

		this._dollyDelta.subVectors( this._dollyEnd, this._dollyStart );

		if ( this._dollyDelta.y > 0 ) {

			this._dollyOut( this._getZoomScale( this._dollyDelta.y ) );

		} else if ( this._dollyDelta.y < 0 ) {

			this._dollyIn( this._getZoomScale( this._dollyDelta.y ) );

		}

		this._dollyStart.copy( this._dollyEnd );

		this.update();

	}

	_handleMouseMovePan( event ) {

		this._panEnd.set( event.clientX, event.clientY );

		this._panDelta.subVectors( this._panEnd, this._panStart ).multiplyScalar( this.panSpeed );

		this._pan( this._panDelta.x, this._panDelta.y );

		this._panStart.copy( this._panEnd );

		this.update();

	}

	_handleMouseWheel( event ) {

		this._updateZoomParameters( event.clientX, event.clientY );

		if ( event.deltaY < 0 ) {

			this._dollyIn( this._getZoomScale( event.deltaY ) );

		} else if ( event.deltaY > 0 ) {

			this._dollyOut( this._getZoomScale( event.deltaY ) );

		}

		this.update();

	}

	_handleKeyDown( event ) {

		let needsUpdate = false;

		switch ( event.code ) {

			case this.keys.UP:

				if ( event.ctrlKey || event.metaKey || event.shiftKey ) {

					if ( this.enableRotate ) {

						this._rotateUp( _twoPI * this.keyRotateSpeed / this.domElement.clientHeight );

					}

				} else {

					if ( this.enablePan ) {

						this._pan( 0, this.keyPanSpeed );

					}

				}

				needsUpdate = true;
				break;

			case this.keys.BOTTOM:

				if ( event.ctrlKey || event.metaKey || event.shiftKey ) {

					if ( this.enableRotate ) {

						this._rotateUp( - _twoPI * this.keyRotateSpeed / this.domElement.clientHeight );

					}

				} else {

					if ( this.enablePan ) {

						this._pan( 0, - this.keyPanSpeed );

					}

				}

				needsUpdate = true;
				break;

			case this.keys.LEFT:

				if ( event.ctrlKey || event.metaKey || event.shiftKey ) {

					if ( this.enableRotate ) {

						this._rotateLeft( _twoPI * this.keyRotateSpeed / this.domElement.clientHeight );

					}

				} else {

					if ( this.enablePan ) {

						this._pan( this.keyPanSpeed, 0 );

					}

				}

				needsUpdate = true;
				break;

			case this.keys.RIGHT:

				if ( event.ctrlKey || event.metaKey || event.shiftKey ) {

					if ( this.enableRotate ) {

						this._rotateLeft( - _twoPI * this.keyRotateSpeed / this.domElement.clientHeight );

					}

				} else {

					if ( this.enablePan ) {

						this._pan( - this.keyPanSpeed, 0 );

					}

				}

				needsUpdate = true;
				break;

		}

		if ( needsUpdate ) {

			// prevent the browser from scrolling on cursor keys
			event.preventDefault();

			this.update();

		}


	}

	_handleTouchStartRotate( event ) {

		if ( this._pointers.length === 1 ) {

			this._rotateStart.set( event.pageX, event.pageY );

		} else {

			const position = this._getSecondPointerPosition( event );

			const x = 0.5 * ( event.pageX + position.x );
			const y = 0.5 * ( event.pageY + position.y );

			this._rotateStart.set( x, y );

		}

	}

	_handleTouchStartPan( event ) {

		if ( this._pointers.length === 1 ) {

			this._panStart.set( event.pageX, event.pageY );

		} else {

			const position = this._getSecondPointerPosition( event );

			const x = 0.5 * ( event.pageX + position.x );
			const y = 0.5 * ( event.pageY + position.y );

			this._panStart.set( x, y );

		}

	}

	_handleTouchStartDolly( event ) {

		const position = this._getSecondPointerPosition( event );

		const dx = event.pageX - position.x;
		const dy = event.pageY - position.y;

		const distance = Math.sqrt( dx * dx + dy * dy );

		this._dollyStart.set( 0, distance );

	}

	_handleTouchStartDollyPan( event ) {

		if ( this.enableZoom ) this._handleTouchStartDolly( event );

		if ( this.enablePan ) this._handleTouchStartPan( event );

	}

	_handleTouchStartDollyRotate( event ) {

		if ( this.enableZoom ) this._handleTouchStartDolly( event );

		if ( this.enableRotate ) this._handleTouchStartRotate( event );

	}

	_handleTouchMoveRotate( event ) {

		if ( this._pointers.length == 1 ) {

			this._rotateEnd.set( event.pageX, event.pageY );

		} else {

			const position = this._getSecondPointerPosition( event );

			const x = 0.5 * ( event.pageX + position.x );
			const y = 0.5 * ( event.pageY + position.y );

			this._rotateEnd.set( x, y );

		}

		this._rotateDelta.subVectors( this._rotateEnd, this._rotateStart ).multiplyScalar( this.rotateSpeed );

		const element = this.domElement;

		this._rotateLeft( _twoPI * this._rotateDelta.x / element.clientHeight ); // yes, height

		this._rotateUp( _twoPI * this._rotateDelta.y / element.clientHeight );

		this._rotateStart.copy( this._rotateEnd );

	}

	_handleTouchMovePan( event ) {

		if ( this._pointers.length === 1 ) {

			this._panEnd.set( event.pageX, event.pageY );

		} else {

			const position = this._getSecondPointerPosition( event );

			const x = 0.5 * ( event.pageX + position.x );
			const y = 0.5 * ( event.pageY + position.y );

			this._panEnd.set( x, y );

		}

		this._panDelta.subVectors( this._panEnd, this._panStart ).multiplyScalar( this.panSpeed );

		this._pan( this._panDelta.x, this._panDelta.y );

		this._panStart.copy( this._panEnd );

	}

	_handleTouchMoveDolly( event ) {

		const position = this._getSecondPointerPosition( event );

		const dx = event.pageX - position.x;
		const dy = event.pageY - position.y;

		const distance = Math.sqrt( dx * dx + dy * dy );

		this._dollyEnd.set( 0, distance );

		this._dollyDelta.set( 0, Math.pow( this._dollyEnd.y / this._dollyStart.y, this.zoomSpeed ) );

		this._dollyOut( this._dollyDelta.y );

		this._dollyStart.copy( this._dollyEnd );

		const centerX = ( event.pageX + position.x ) * 0.5;
		const centerY = ( event.pageY + position.y ) * 0.5;

		this._updateZoomParameters( centerX, centerY );

	}

	_handleTouchMoveDollyPan( event ) {

		if ( this.enableZoom ) this._handleTouchMoveDolly( event );

		if ( this.enablePan ) this._handleTouchMovePan( event );

	}

	_handleTouchMoveDollyRotate( event ) {

		if ( this.enableZoom ) this._handleTouchMoveDolly( event );

		if ( this.enableRotate ) this._handleTouchMoveRotate( event );

	}

	// pointers

	_addPointer( event ) {

		this._pointers.push( event.pointerId );

	}

	_removePointer( event ) {

		delete this._pointerPositions[ event.pointerId ];

		for ( let i = 0; i < this._pointers.length; i ++ ) {

			if ( this._pointers[ i ] == event.pointerId ) {

				this._pointers.splice( i, 1 );
				return;

			}

		}

	}

	_isTrackingPointer( event ) {

		for ( let i = 0; i < this._pointers.length; i ++ ) {

			if ( this._pointers[ i ] == event.pointerId ) return true;

		}

		return false;

	}

	_trackPointer( event ) {

		let position = this._pointerPositions[ event.pointerId ];

		if ( position === undefined ) {

			position = new THREE.Vector2();
			this._pointerPositions[ event.pointerId ] = position;

		}

		position.set( event.pageX, event.pageY );

	}

	_getSecondPointerPosition( event ) {

		const pointerId = ( event.pointerId === this._pointers[ 0 ] ) ? this._pointers[ 1 ] : this._pointers[ 0 ];

		return this._pointerPositions[ pointerId ];

	}

	//

	_customWheelEvent( event ) {

		const mode = event.deltaMode;

		// minimal wheel event altered to meet delta-zoom demand
		const newEvent = {
			clientX: event.clientX,
			clientY: event.clientY,
			deltaY: event.deltaY,
		};

		switch ( mode ) {

			case 1: // LINE_MODE
				newEvent.deltaY *= 16;
				break;

			case 2: // PAGE_MODE
				newEvent.deltaY *= 100;
				break;

		}

		// detect if event was triggered by pinching
		if ( event.ctrlKey && ! this._controlActive ) {

			newEvent.deltaY *= 10;

		}

		return newEvent;

	}

}

function onPointerDown( event ) {

	if ( this.enabled === false ) return;

	if ( this._pointers.length === 0 ) {

		this.domElement.setPointerCapture( event.pointerId );

		this.domElement.addEventListener( 'pointermove', this._onPointerMove );
		this.domElement.addEventListener( 'pointerup', this._onPointerUp );

	}

	//

	if ( this._isTrackingPointer( event ) ) return;

	//

	this._addPointer( event );

	if ( event.pointerType === 'touch' ) {

		this._onTouchStart( event );

	} else {

		this._onMouseDown( event );

	}

}

function onPointerMove( event ) {

	if ( this.enabled === false ) return;

	if ( event.pointerType === 'touch' ) {

		this._onTouchMove( event );

	} else {

		this._onMouseMove( event );

	}

}

function onPointerUp( event ) {

	this._removePointer( event );

	switch ( this._pointers.length ) {

		case 0:

			this.domElement.releasePointerCapture( event.pointerId );

			this.domElement.removeEventListener( 'pointermove', this._onPointerMove );
			this.domElement.removeEventListener( 'pointerup', this._onPointerUp );

			this.dispatchEvent( _endEvent );

			this.state = _STATE.NONE;

			break;

		case 1:

			const pointerId = this._pointers[ 0 ];
			const position = this._pointerPositions[ pointerId ];

			// minimal placeholder event - allows state correction on pointer-up
			this._onTouchStart( { pointerId: pointerId, pageX: position.x, pageY: position.y } );

			break;

	}

}

function onMouseDown( event ) {

	let mouseAction;

	switch ( event.button ) {

		case 0:

			mouseAction = this.mouseButtons.LEFT;
			break;

		case 1:

			mouseAction = this.mouseButtons.MIDDLE;
			break;

		case 2:

			mouseAction = this.mouseButtons.RIGHT;
			break;

		default:

			mouseAction = -1;

	}

	switch ( mouseAction ) {

		case THREE.MOUSE.DOLLY:

			if ( this.enableZoom === false ) return;

			this._handleMouseDownDolly( event );

			this.state = _STATE.DOLLY;

			break;

		case THREE.MOUSE.ROTATE:

			if ( event.ctrlKey || event.metaKey || event.shiftKey ) {

				if ( this.enablePan === false ) return;

				this._handleMouseDownPan( event );

				this.state = _STATE.PAN;

			} else {

				if ( this.enableRotate === false ) return;

				this._handleMouseDownRotate( event );

				this.state = _STATE.ROTATE;

			}

			break;

		case THREE.MOUSE.PAN:

			if ( event.ctrlKey || event.metaKey || event.shiftKey ) {

				if ( this.enableRotate === false ) return;

				this._handleMouseDownRotate( event );

				this.state = _STATE.ROTATE;

			} else {

				if ( this.enablePan === false ) return;

				this._handleMouseDownPan( event );

				this.state = _STATE.PAN;

			}

			break;

		default:

			this.state = _STATE.NONE;

	}

	if ( this.state !== _STATE.NONE ) {

		this.dispatchEvent( _startEvent );

	}

}

function onMouseMove( event ) {

	switch ( this.state ) {

		case _STATE.ROTATE:

			if ( this.enableRotate === false ) return;

			this._handleMouseMoveRotate( event );

			break;

		case _STATE.DOLLY:

			if ( this.enableZoom === false ) return;

			this._handleMouseMoveDolly( event );

			break;

		case _STATE.PAN:

			if ( this.enablePan === false ) return;

			this._handleMouseMovePan( event );

			break;

	}

}

function onMouseWheel( event ) {

	if ( this.enabled === false || this.enableZoom === false || this.state !== _STATE.NONE ) return;

	event.preventDefault();

	this.dispatchEvent( _startEvent );

	this._handleMouseWheel( this._customWheelEvent( event ) );

	this.dispatchEvent( _endEvent );

}

function onKeyDown( event ) {

	if ( this.enabled === false ) return;

	this._handleKeyDown( event );

}

function onTouchStart( event ) {

	this._trackPointer( event );

	switch ( this._pointers.length ) {

		case 1:

			switch ( this.touches.ONE ) {

				case THREE.TOUCH.ROTATE:

					if ( this.enableRotate === false ) return;

					this._handleTouchStartRotate( event );

					this.state = _STATE.TOUCH_ROTATE;

					break;

				case THREE.TOUCH.PAN:

					if ( this.enablePan === false ) return;

					this._handleTouchStartPan( event );

					this.state = _STATE.TOUCH_PAN;

					break;

				default:

					this.state = _STATE.NONE;

			}

			break;

		case 2:

			switch ( this.touches.TWO ) {

				case THREE.TOUCH.DOLLY_PAN:

					if ( this.enableZoom === false && this.enablePan === false ) return;

					this._handleTouchStartDollyPan( event );

					this.state = _STATE.TOUCH_DOLLY_PAN;

					break;

				case THREE.TOUCH.DOLLY_ROTATE:

					if ( this.enableZoom === false && this.enableRotate === false ) return;

					this._handleTouchStartDollyRotate( event );

					this.state = _STATE.TOUCH_DOLLY_ROTATE;

					break;

				default:

					this.state = _STATE.NONE;

			}

			break;

		default:

			this.state = _STATE.NONE;

	}

	if ( this.state !== _STATE.NONE ) {

		this.dispatchEvent( _startEvent );

	}

}

function onTouchMove( event ) {

	this._trackPointer( event );

	switch ( this.state ) {

		case _STATE.TOUCH_ROTATE:

			if ( this.enableRotate === false ) return;

			this._handleTouchMoveRotate( event );

			this.update();

			break;

		case _STATE.TOUCH_PAN:

			if ( this.enablePan === false ) return;

			this._handleTouchMovePan( event );

			this.update();

			break;

		case _STATE.TOUCH_DOLLY_PAN:

			if ( this.enableZoom === false && this.enablePan === false ) return;

			this._handleTouchMoveDollyPan( event );

			this.update();

			break;

		case _STATE.TOUCH_DOLLY_ROTATE:

			if ( this.enableZoom === false && this.enableRotate === false ) return;

			this._handleTouchMoveDollyRotate( event );

			this.update();

			break;

		default:

			this.state = _STATE.NONE;

	}

}

function onContextMenu( event ) {

	if ( this.enabled === false ) return;

	event.preventDefault();

}

function interceptControlDown( event ) {

	if ( event.key === 'Control' ) {

		this._controlActive = true;

		const document = this.domElement.getRootNode(); // offscreen canvas compatibility

		document.addEventListener( 'keyup', this._interceptControlUp, { passive: true, capture: true } );

	}

}

function interceptControlUp( event ) {

	if ( event.key === 'Control' ) {

		this._controlActive = false;

		const document = this.domElement.getRootNode(); // offscreen canvas compatibility

		document.removeEventListener( 'keyup', this._interceptControlUp, { passive: true, capture: true } );

	}

}

var scene = new THREE__namespace.Scene();
scene.background = new THREE__namespace.Color( 'whitesmoke' );



var camera = new THREE__namespace.PerspectiveCamera( 30, innerWidth/innerHeight );
camera.position.set( -2, 1, 3.5 );
camera.lookAt( scene.position );



var renderer = new THREE__namespace.WebGPURenderer( { antialias: true } );
renderer.outputColorSpace = THREE__namespace.LinearSRGBColorSpace;
renderer.setSize( innerWidth, innerHeight );
document.body.appendChild( renderer.domElement );

window.addEventListener( "resize", ( /*event*/ ) => {

	camera.aspect = innerWidth/innerHeight;
	camera.updateProjectionMatrix( );
	renderer.setSize( innerWidth, innerHeight );

} );



var controls = new OrbitControls( camera, renderer.domElement );
controls.enableDamping = true;
controls.dampingFactor = 0.05;
//controls.autoRotate = true;
//controls.autoRotateSpeed = 0.5;



var ambientLight = new THREE__namespace.AmbientLight( 'white', 1 );
scene.add( ambientLight );



var light = new THREE__namespace.DirectionalLight( 'white', 2 );
light.position.set( 0, 0, 1 );
scene.add( light );





var pivot = new THREE__namespace.AxesHelper();


var options = {
	animate: false,
};



var debug = {
	isolated: false,
	randomize: rigRandomModel,
};
var posture = {};
var skeleton = {};
var model = new THREE__namespace.Group();
var gui;

function createGui( skeletonData, postureData, modelObject ) {

	skeleton = skeletonData;

	posture = postureData;
	posture.select = tsl.uniform( 0, 'int' ); // 0..24
	posture.isolated = tsl.uniform( 0, 'int' ); // 0 or 1
	model = modelObject;


	gui = new g(); // global gui
	gui.domElement.style.marginRight = 0;

	var mfolder = gui.addFolder( 'DEBUG' );

	mfolder.close();

	mfolder.add( posture.select, 'value', {
		Nothing: 0,
		Head: 1, Chest: 2, Waist: 3,
		Hip: 11, Hip2: 15, Leg: 12, Knee: 13, Ankle: 14, Foot: 16,
		Arm: 21, Elbow: 22, Forearm: 23, Wrist: 24,
	} ).name( 'Show' ).onChange( showPivotPoint );

	mfolder.add( debug, 'isolated', false ).name( 'Isolated' ).onChange( ()=>{

		posture.isolated.value = debug.isolated?1:0;

	} );
	mfolder.add( options, 'animate', false ).name( 'Animate' );
	mfolder.add( debug, 'randomize' ).name( 'Randomize' );

	function html( name, icon, classes='' ) {

		return `<div class="padded ${classes}">${name} &nbsp; <span class="icon">${icon}</span></div>`;

	}


	mfolder = gui.addFolder( 'TORSO' );//.close();
	{

		mfolder.add( posture.head.value, 'x', -0.7, 0.5 ).name( html( 'Head', '&#x2195;' ) );
		mfolder.add( posture.head.value, 'z', -0.5, 0.5 ).name( html( '', '&#x21B6;' ) );
		mfolder.add( posture.head.value, 'y', -1, 1 ).name( html( '', '&#x2194;' ) );

		mfolder.add( posture.chest.value, 'x', -0.7, 0.4 ).name( html( 'Chest', '&#x2195;', 'border' ) );
		mfolder.add( posture.chest.value, 'z', -0.5, 0.5 ).name( html( '', '&#x21B6;' ) );

		mfolder.add( posture.waist.value, 'x', -1, 0.6 ).name( html( 'Waist', '&#x2195;', 'border' ) );
		mfolder.add( posture.waist.value, 'z', -0.5, 0.5 ).name( html( '', '&#x21B6;' ) );
		mfolder.add( posture.waist.value, 'y', -1, 1 ).name( html( '', '&#x2194;' ) );

	}

	mfolder = gui.addFolder( 'LEFT LEG' ).close();
	{

		mfolder.add( posture.hipLeft.value, 'x', -0.6, 2.7 ).name( html( 'Leg', '&#x2195;' ) );
		mfolder.add( posture.hipLeft.value, 'z', -2.4, 0.2 ).name( html( '', '&#x21BA;' ) );
		mfolder.add( posture.hip2Left.value, 'y', -1.4, 1.4 ).name( html( '', '&#x2194;' ) );

		mfolder.add( posture.kneeLeft.value, 'x', -2.6, 0 ).name( html( 'Knee', '&#x2195;', 'border' ) );

		mfolder.add( posture.ankleLeft.value, 'x', -1, 0.7 ).name( html( 'Ankle', '&#x2195;', 'border' ) );
		mfolder.add( posture.legLeft.value, 'y', -3, 3 ).name( html( '', '&#x2194;' ) );
		mfolder.add( posture.ankleLeft.value, 'z', -0.5, 0.5 ).name( html( '', '&#x21BA;' ) );

		mfolder.add( posture.footLeft.value, 'x', -0.3, 0.6 ).name( html( 'Foot', '&#x2195;', 'border' ) );

	}

	mfolder = gui.addFolder( 'RIGHT LEG' ).close();
	{

		mfolder.add( posture.hipRight.value, 'x', -0.6, 2.7 ).name( html( 'Leg', '&#x2195;' ) );
		mfolder.add( posture.hipRight.value, 'z', -0.2, 2.4 ).name( html( '', '&#x21BB;' ) ); // swapped
		mfolder.add( posture.hip2Right.value, 'y', -1.4, 1.4 ).name( html( '', '&#x2194;' ) );

		mfolder.add( posture.kneeRight.value, 'x', -2.6, 0 ).name( html( 'Knee', '&#x2195;', 'border' ) );

		mfolder.add( posture.ankleRight.value, 'x', -1, 0.7 ).name( html( 'Ankle', '&#x2195;', 'border' ) );
		mfolder.add( posture.legRight.value, 'y', -3, 3 ).name( html( '', '&#x2194;' ) );
		mfolder.add( posture.ankleRight.value, 'z', -0.5, 0.5 ).name( html( '', '&#x21BB;' ) );

		mfolder.add( posture.footRight.value, 'x', -0.3, 0.6 ).name( html( 'Foot', '&#x2195;', 'border' ) );

	}

	mfolder = gui.addFolder( 'LEFT ARM' ).close();
	{

		mfolder.add( posture.armLeft.value, 'z', -1.5, 1.7 ).name( html( 'Arm', '&#x2195;' ) );
		mfolder.add( posture.armLeft.value, 'y', -0.5, 2 ).name( html( '', '&#x2194;' ) );
		mfolder.add( posture.armLeft.value, 'x', -0.5, 0.5 ).name( html( '', '&#x21BB;' ) );

		mfolder.add( posture.elbowLeft.value, 'y', 0, 2.7 ).name( html( 'Elbow', '&#x2195;', 'border' ) );

		mfolder.add( posture.wristLeft.value, 'z', -1.4, 1.4 ).name( html( 'Wrist', '&#x2195;', 'border' ) );
		mfolder.add( posture.wristLeft.value, 'y', -0.6, 0.4 ).name( html( '', '&#x2194;' ) );
		mfolder.add( posture.forearmLeft.value, 'x', -1.5, 3 ).name( html( '', '&#x21BB;' ) );

	}

	mfolder = gui.addFolder( 'RIGHT ARM' ).close();
	{

		mfolder.add( posture.armRight.value, 'z', -1.5, 1.7 ).name( html( 'Arm', '&#x2195;' ) );
		mfolder.add( posture.armRight.value, 'y', -2, 0.5 ).name( html( '', '&#x2194;' ) );
		mfolder.add( posture.armRight.value, 'x', -0.5, 0.5 ).name( html( '', '&#x21BB;' ) );

		mfolder.add( posture.elbowRight.value, 'y', -2.7, 0 ).name( html( 'Elbow', '&#x2195;', 'border' ) );

		mfolder.add( posture.wristRight.value, 'z', -1.4, 1.4 ).name( html( 'Wrist', '&#x2195;', 'border' ) );
		mfolder.add( posture.wristRight.value, 'y', -0.4, 0.6 ).name( html( '', '&#x2194;' ) );
		mfolder.add( posture.forearmRight.value, 'x', -1.5, 3 ).name( html( '', '&#x21BB;' ) );

	}

	return gui;

}



function rigModel( time ) {

	posture.waist.value.set(
		Math.sin( time )/4-0.2,
		Math.cos( time*1.2 )/2,
		Math.sin( time*3 )/2.5
	);

	posture.chest.value.set(
		Math.cos( time*3 )/3,
		0, //08.05.25 Math.sin( time*1.2*2 )/2,
		Math.cos( time*3*1.5 )/3
	);

	posture.head.value.set(
		Math.cos( time*3 )/2,
		Math.sin( time*1.2*2 )/2,
		Math.cos( time*3*1.5 )/3
	);

	posture.kneeLeft.value.set(
		-( Math.cos( time*3 )+1 )/1.5,
		0,
		0,
	);

	posture.kneeRight.value.set(
		-( Math.sin( time*2.4 )+1 )/1.5,
		0,
		0,
	);

	posture.footLeft.value.set(
		( Math.cos( time*1.7 ) )*0.5+0.15,
		0,
		0,
	);

	posture.footRight.value.set(
		( Math.sin( time*1.9 ) )*0.5+0.15,
		0,
		0,
	);

	posture.ankleLeft.value.set(
		Math.cos( time*3 )/2,
		0*	Math.cos( time*2.8 )/2,
		Math.cos( time*2.2 )/4,
	);

	posture.ankleRight.value.set(
		Math.sin( time*3.2 )/2,
		0*	Math.cos( time*2.3 )/2,
		Math.sin( time*2.1 )/4,
	);

	posture.legLeft.value.set(
		0,
		Math.cos( time*2.8 )-0.25,
		0,
	);

	posture.legRight.value.set(
		0,
		Math.cos( time*2.3 )+0.25,
		0,
	);

	posture.hipLeft.value.set(
		( Math.cos( time*3 )/1+0.25 ),
		0, //08.05.25 Math.cos( time*2.8 ),///4,
		-( Math.cos( time*2.2 )+1 )/4,
	);

	posture.hip2Left.value.set(
		0,
		Math.cos( time*2.8 ),
		0,
	);

	posture.hipRight.value.set(
		( Math.sin( time*2.2 )/1+0.25 ),
		0, //08.05.25 Math.sin( time*3.2 )/4,
		( Math.sin( time*2.6 )+1 )/4,
	);

	posture.hip2Right.value.set(
		0,
		Math.sin( time*3.2 ),
		0,
	);

	posture.elbowLeft.value.set(
		0,
		( Math.cos( time*2-1 )+1 ),
		0,
	);

	posture.elbowRight.value.set(
		0,
		-( Math.sin( time*1.8 )+1 ),
		0,
	);

	posture.forearmLeft.value.set(
		0.5*( Math.cos( time*3.6-1 )*1.5+1 ),
		0,
		0,
	);

	posture.forearmRight.value.set(
		0.5*( Math.sin( time*1.8*3+1 )*1.5+1 ),
		0,
		0,
	);

	posture.wristLeft.value.set(
		0,
		( Math.cos( time*3.6-1 )*0.5+0.1 ),
		( Math.cos( time*2.6+1 )*0.7 ),
	);

	posture.wristRight.value.set(
		0,
		( Math.cos( time*3.6-1 )*0.5+0.1 ),
		-( Math.cos( time*2.6+1 )*0.7 ),
	);

	posture.armLeft.value.set(
		0.7*( Math.cos( time*3 )/1.5-0.15 ),
		0, //-0.7*( Math.cos( time*2.8 )*1-0.6 ),
		0.7*( Math.cos( time*2.2 ) ),
	);

	posture.armRight.value.set(
		0.7*( Math.sin( time*2.4 )/1.5-0.15 ),
		0, //-0.7*-( Math.cos( time*3.1 )*1-0.6 ),
		0.7*( Math.sin( time*2.7 ) ),
	);

}



function rigRandomModel( seed = THREE__namespace.MathUtils.randInt( Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER ) ) {

	THREE__namespace.MathUtils.seededRandom( seed );

	function rand( from=-1, to=1 ) {

		return THREE__namespace.MathUtils.seededRandom() * ( to-from ) + from;

	}

	model.rotation.y += rand( )-0.2;

	posture.waist.value.set(
		rand()/4-0.2,
		rand()/2,
		rand()/2.5
	);

	posture.chest.value.set(
		rand()/3,
		0,
		rand( )/3
	);

	posture.head.value.set(
		rand( )/2,
		rand( )/2,
		rand( )/3
	);

	posture.kneeLeft.value.set(
		-( rand( )+1 )/1.5,
		0,
		0,
	);

	posture.kneeRight.value.set(
		-( rand( )+1 )/1.5,
		0,
		0,
	);

	posture.footLeft.value.set(
		( rand( ) )*0.5+0.15,
		0,
		0,
	);

	posture.footRight.value.set(
		( rand( ) )*0.5+0.15,
		0,
		0,
	);

	posture.ankleLeft.value.set(
		rand( )/2,
		0,
		rand( )/4,
	);

	posture.ankleRight.value.set(
		rand( )/2,
		0,
		rand( )/4,
	);

	posture.legLeft.value.set(
		0,
		rand( )-0.25,
		0,
	);

	posture.legRight.value.set(
		0,
		rand( )+0.25,
		0,
	);

	posture.hipLeft.value.set(
		( rand( )/1+0.25 ),
		0,
		-( rand( )+1 )/4,
	);

	posture.hip2Left.value.set(
		0,
		rand( ),
		0,
	);

	posture.hipRight.value.set(
		( rand( )/1+0.25 ),
		0,
		( rand( )+1 )/4,
	);

	posture.hip2Right.value.set(
		0,
		rand( ),
		0,
	);

	posture.elbowLeft.value.set(
		0,
		( rand( )+1 ),
		0,
	);

	posture.elbowRight.value.set(
		0,
		-( rand( )+1 ),
		0,
	);

	posture.forearmLeft.value.set(
		0.5*( rand( )*1.5+1 ),
		0,
		0,
	);

	posture.forearmRight.value.set(
		0.5*( rand( )*1.5+1 ),
		0,
		0,
	);

	posture.wristLeft.value.set(
		0,
		( rand( )*0.5+0.1 ),
		( rand( )*0.7 ),
	);

	posture.wristRight.value.set(
		0,
		( rand( )*0.5+0.1 ),
		-( rand( )*0.7 ),
	);

	posture.armLeft.value.set(
		0.7*( rand( )/1.5-0.15 ),
		0,
		0.7*( rand( ) ),
	);

	posture.armRight.value.set(
		0.7*( rand( )/1.5-0.15 ),
		0,
		0.7*( rand( ) ),
	);

	updateGUI( );

}



function showPivotPoint( index ) {

	model.add( pivot );
	switch ( index ) {

		case 1: pivot.position.copy( skeleton.headPos ); break;
		case 2: pivot.position.copy( skeleton.chestPos ); break;
		case 3: pivot.position.copy( skeleton.waistPos ); break;

		case 11: pivot.position.copy( skeleton.hipLeftPos ); break;
		case 15: pivot.position.copy( skeleton.hip2LeftPos ); break;
		case 12: pivot.position.copy( skeleton.legLeftPos ); break;
		case 13: pivot.position.copy( skeleton.kneeLeftPos ); break;
		case 14: pivot.position.copy( skeleton.ankleLeftPos ); break;
		case 16: pivot.position.copy( skeleton.footLeftPos ); break;

		case 21: pivot.position.copy( skeleton.armLeftPos ); break;
		case 22: pivot.position.copy( skeleton.elbowLeftPos ); break;
		case 23: pivot.position.copy( skeleton.forearmLeftPos ); break;
		case 24: pivot.position.copy( skeleton.wristLeftPos ); break;

		default: model.remove( pivot );

	}

}



function updateGUI( ) {

	for ( var ctrl of gui.controllersRecursive() ) ctrl.updateDisplay( );

}



function animationLoop( t ) {

	if ( options.animate ) {

		rigModel( t/1000 );
		updateGUI( );

	}

	controls.update( );
	light.position.copy( camera.position );

	renderer.render( scene, camera );

}


renderer.setAnimationLoop( animationLoop );

function selectWaist( { waistSpan } ) {

	return tsl.positionGeometry.y.smoothstep( waistSpan.x, waistSpan.y );

} // inlined



function selectHead( { headSpan } ) {

	return tsl.positionGeometry.y.add( tsl.positionGeometry.z.div( 3 ) ).smoothstep( headSpan.x, headSpan.y );

} // inlined



function selectChest( { chestSpan } ) {

	return tsl.positionGeometry.y.smoothstep( chestSpan.x, chestSpan.y );

} // inlined



function selectKneeLeft( { kneeLeftSpan } ) {

	return tsl.positionGeometry.y.smoothstep( kneeLeftSpan.x, kneeLeftSpan.y );

} // inlined



function selectKneeRight( { kneeRightSpan } ) {

	return tsl.positionGeometry.y.smoothstep( kneeRightSpan.x, kneeRightSpan.y );

} // inlined



function selectAnkleLeft( { ankleLeftSpan } ) {

	return tsl.positionGeometry.y.smoothstep( ankleLeftSpan.x, ankleLeftSpan.y );

} // inlined



function selectAnkleRight( { ankleRightSpan } ) {

	return tsl.positionGeometry.y.smoothstep( ankleRightSpan.x, ankleRightSpan.y );

} // inlined



function selectFootLeft( { footLeftSpan, ankleLeftSpan } ) {

	return tsl.positionGeometry.z.smoothstep( footLeftSpan.x, footLeftSpan.y ).mul( tsl.positionGeometry.y.step( ankleLeftSpan.y ) );

} // inlined



function selectFootRight( { footRightSpan, ankleRightSpan } ) {

	return tsl.positionGeometry.z.smoothstep( footRightSpan.x, footRightSpan.y ).mul( tsl.positionGeometry.y.step( ankleRightSpan.y ) );

} // inlined



function selectLegLeft( { legLeftSpan } ) {

	return tsl.positionGeometry.y.smoothstep( legLeftSpan.x, legLeftSpan.y ).pow( 1 );

} // inlined



function selectLegRight( { legRightSpan } ) {

	return tsl.positionGeometry.y.smoothstep( legRightSpan.x, legRightSpan.y );

} // inlined



function selectHipLeft( { hipLeftSpan } ) {

	var x = tsl.positionGeometry.x;
	var y = tsl.positionGeometry.y;

	return y.sub( x.mul( 2 ) )
		.smoothstep( hipLeftSpan.z, tsl.float( hipLeftSpan.w ).sub( x.mul( 1.6 ) ) )
		.mul( y.smoothstep( hipLeftSpan.x, hipLeftSpan.y ) )
		.mul( x.smoothstep( -0.01, 0.01 ) );

} // inlined



function selectHip2Left( { hip2LeftSpan } ) {

	return tsl.positionGeometry.y.smoothstep( hip2LeftSpan.x, hip2LeftSpan.y );

} // inlined



function selectHipRight( { hipRightSpan } ) {

	var x = tsl.positionGeometry.x;
	var y = tsl.positionGeometry.y;

	return y.add( x.mul( 2 ) )
		.smoothstep( hipRightSpan.z, tsl.float( hipRightSpan.w ).add( x.mul( 1.6 ) ) )
		.mul( y.smoothstep( hipRightSpan.x, hipRightSpan.y ) )
		.mul( x.smoothstep( 0.01, -0.01 ) );

} // inlined



function selectHip2Right( { hip2RightSpan } ) {

	return tsl.positionGeometry.y.smoothstep( hip2RightSpan.x, hip2RightSpan.y );

} // inlined



function selectElbowLeft( { elbowLeftSpan } ) {

	return tsl.positionGeometry.x.smoothstep( elbowLeftSpan.x, elbowLeftSpan.y );

} // inlined



function selectElbowRight( { elbowRightSpan } ) {

	return tsl.positionGeometry.x.smoothstep( elbowRightSpan.x, elbowRightSpan.y );

} // inlined



function selectForearmLeft( { forearmLeftSpan } ) {

	return tsl.positionGeometry.x.smoothstep( forearmLeftSpan.x, forearmLeftSpan.y );

} // inlined



function selectForearmRight( { forearmRightSpan } ) {

	return tsl.positionGeometry.x.smoothstep( forearmRightSpan.x, forearmRightSpan.y );

} // inlined



function selectWristLeft( { wristLeftSpan } ) {

	return tsl.positionGeometry.x.smoothstep( wristLeftSpan.x, wristLeftSpan.y );

} // inlined



function selectWristRight( { wristRightSpan } ) {

	return tsl.positionGeometry.x.smoothstep( wristRightSpan.x, wristRightSpan.y );

} // inlined



function selectArmLeft( { armLeftSpan } ) {

	var x = tsl.positionGeometry.x;
	var y = tsl.positionGeometry.y;

	return x
		.smoothstep( armLeftSpan.x, armLeftSpan.y )
		.mul( y.smoothstep( armLeftSpan.z, armLeftSpan.w ) );

} // inlined



function selectArmRight( { armRightSpan } ) {

	var x = tsl.positionGeometry.x;
	var y = tsl.positionGeometry.y;

	return x
		.smoothstep( armRightSpan.x, armRightSpan.y )
		.mul( y.smoothstep( armRightSpan.z, armRightSpan.w ) );

} // inlined



var jointRotate= tsl.Fn( ([ pos, center, angle, amount ])=>{

	return pos.sub( center ).mul( matRotYXZ( angle.mul( amount ) ) ).add( center );

} ).setLayout( {
	name: 'jointRotate',
	type: 'vec3',
	inputs: [
		{ name: 'pos', type: 'vec3' },
		{ name: 'center', type: 'vec3' },
		{ name: 'angle', type: 'vec3' },
		{ name: 'amount', type: 'float' },
	]
} );

var jointRotateNormal= tsl.Fn( ([ nor, angle, amount ])=>{

	return nor.mul( matRotYXZ( angle.mul( amount ) ) );

} ).setLayout( {
	name: 'jointRotateNormal',
	type: 'vec3',
	inputs: [
		{ name: 'nor', type: 'vec3' },
		{ name: 'angle', type: 'vec3' },
		{ name: 'amount', type: 'float' },
	]
} );



var jointRotateLeg= tsl.Fn( ([ pos, center, angle, amount ])=>{

	return pos.sub( center ).mul( matRotYZX( angle.mul( amount ) ) ).add( center );

} ).setLayout( {
	name: 'jointRotateLeg',
	type: 'vec3',
	inputs: [
		{ name: 'pos', type: 'vec3' },
		{ name: 'center', type: 'vec3' },
		{ name: 'angle', type: 'vec3' },
		{ name: 'amount', type: 'float' },
	]
} );



var jointRotateNormalLeg= tsl.Fn( ([ nor, angle, amount ])=>{

	return nor.mul( matRotYZX( angle.mul( amount ) ) );

} ).setLayout( {
	name: 'jointRotateNormalLeg',
	type: 'vec3',
	inputs: [
		{ name: 'nor', type: 'vec3' },
		{ name: 'angle', type: 'vec3' },
		{ name: 'amount', type: 'float' },
	]
} );



var jointRotate2= tsl.Fn( ([ pos, center, angle, amount ])=>{

	return tsl.mix( pos, pos.sub( center ).mul( matRotXZY( angle.mul( amount ) ) ).mul( tsl.float( 1 ).sub( amount.mul( 2*Math.PI ).sub( Math.PI ).cos().add( 1 ).div( 2 ).div( 4 ).mul( angle.z.cos().oneMinus() ) ) ).add( center ), amount.pow( 0.25 ) );

} ).setLayout( {
	name: 'jointRotate2',
	type: 'vec3',
	inputs: [
		{ name: 'pos', type: 'vec3' },
		{ name: 'center', type: 'vec3' },
		{ name: 'angle', type: 'vec3' },
		{ name: 'amount', type: 'float' },
	]
} );



var jointRotateNormal2= tsl.Fn( ([ nor, angle, amount ])=>{

	return tsl.mix( nor, nor.mul( matRotXZY( angle.mul( amount ) ) ).mul( tsl.float( 1 ).sub( amount.mul( 2*Math.PI ).sub( Math.PI ).cos().add( 1 ).div( 2 ).div( 4 ).mul( angle.z.cos().oneMinus() ) ) ), amount.pow( 0.25 ) );

} ).setLayout( {
	name: 'jointRotateNormal2',
	type: 'vec3',
	inputs: [
		{ name: 'nor', type: 'vec3' },
		{ name: 'angle', type: 'vec3' },
		{ name: 'amount', type: 'float' },
	]
} );



var tslPositionNode = tsl.Fn( ( { skeleton, posture } )=>{

	var p = tsl.positionGeometry.toVar();



	// LEFT-UPPER BODY

	var armLeft = selectArmLeft( skeleton ).toVar();

	tsl.If( armLeft.greaterThan( 0 ), ()=>{

		p.assign( jointRotate( p, skeleton.wristLeftPos, posture.wristLeft, selectWristLeft( skeleton ) ) );
		p.assign( jointRotate( p, skeleton.forearmLeftPos, posture.forearmLeft, selectForearmLeft( skeleton ) ) );
		p.assign( jointRotate( p, skeleton.elbowLeftPos, posture.elbowLeft, selectElbowLeft( skeleton ) ) );
		p.assign( jointRotate2( p, skeleton.armLeftPos, posture.armLeft, armLeft ) );

	} );



	// RIGHT-UPPER BODY

	var armRight = selectArmRight( skeleton ).toVar();

	tsl.If( armRight.greaterThan( 0 ), ()=>{

		p.assign( jointRotate( p, skeleton.wristRightPos, posture.wristRight, selectWristRight( skeleton ) ) );
		p.assign( jointRotate( p, skeleton.forearmRightPos, posture.forearmRight, selectForearmRight( skeleton ) ) );
		p.assign( jointRotate( p, skeleton.elbowRightPos, posture.elbowRight, selectElbowRight( skeleton ) ) );
		p.assign( jointRotate2( p, skeleton.armRightPos, posture.armRight, armRight ) );

	} );



	// CENTRAL BODY AXIS

	p.assign( jointRotate( p, skeleton.headPos, posture.head, selectHead( skeleton ) ) );
	p.assign( jointRotate( p, skeleton.chestPos, posture.chest, selectChest( skeleton ) ) );
	p.assign( jointRotate( p, skeleton.waistPos, posture.waist, selectWaist( skeleton ) ) );



	// LEFT-LOWER BODY

	var hipLeft = selectHipLeft( skeleton ).toVar();

	tsl.If( hipLeft.greaterThan( 0 ), ()=>{

		p.assign( jointRotate( p, skeleton.footLeftPos, posture.footLeft, selectFootLeft( skeleton ) ) );
		p.assign( jointRotate( p, skeleton.ankleLeftPos, posture.ankleLeft, selectAnkleLeft( skeleton ) ) );
		p.assign( jointRotate( p, skeleton.legLeftPos, posture.legLeft, selectLegLeft( skeleton ) ) );
		p.assign( jointRotate( p, skeleton.kneeLeftPos, posture.kneeLeft, selectKneeLeft( skeleton ) ) );
		p.assign( jointRotateLeg( p, skeleton.hip2LeftPos, posture.hip2Left, selectHip2Left( skeleton ) ) );
		p.assign( jointRotateLeg( p, skeleton.hipLeftPos, posture.hipLeft, hipLeft ) );

	} );



	// RIGHT-LOWER BODY

	var hipRight = selectHipRight( skeleton ).toVar();

	tsl.If( hipRight.greaterThan( 0 ), ()=>{

		p.assign( jointRotate( p, skeleton.footRightPos, posture.footRight, selectFootRight( skeleton ) ) );
		p.assign( jointRotate( p, skeleton.ankleRightPos, posture.ankleRight, selectAnkleRight( skeleton ) ) );
		p.assign( jointRotate( p, skeleton.legRightPos, posture.legRight, selectLegRight( skeleton ) ) );
		p.assign( jointRotate( p, skeleton.kneeRightPos, posture.kneeRight, selectKneeRight( skeleton ) ) );
		p.assign( jointRotateLeg( p, skeleton.hip2RightPos, posture.hip2Right, selectHip2Right( skeleton ) ) );
		p.assign( jointRotateLeg( p, skeleton.hipRightPos, posture.hipRight, hipRight ) );

	} );

	return p;

} );



var tslNormalNode = tsl.Fn( ( { skeleton, posture } )=>{

	var p = tsl.normalGeometry.toVar();



	// LEFT-UPPER BODY

	var armLeft = selectArmLeft( skeleton ).toVar();

	tsl.If( armLeft.greaterThan( 0 ), ()=>{

		p.assign( jointRotateNormal( p, posture.wristLeft, selectWristLeft( skeleton ) ) );
		p.assign( jointRotateNormal( p, posture.forearmLeft, selectForearmLeft( skeleton ) ) );
		p.assign( jointRotateNormal( p, posture.elbowLeft, selectElbowLeft( skeleton ) ) );
		p.assign( jointRotateNormal2( p, posture.armLeft, armLeft ) );

	} );



	// RIGHT-UPPER BODY

	var armRight = selectArmRight( skeleton ).toVar();

	tsl.If( armRight.greaterThan( 0 ), ()=>{

		p.assign( jointRotateNormal( p, posture.wristRight, selectWristRight( skeleton ) ) );
		p.assign( jointRotateNormal( p, posture.forearmRight, selectForearmRight( skeleton ) ) );
		p.assign( jointRotateNormal( p, posture.elbowRight, selectElbowRight( skeleton ) ) );
		p.assign( jointRotateNormal2( p, posture.armRight, armRight ) );

	} );



	// CENTRAL BODY AXIS

	p.assign( jointRotateNormal( p, posture.head, selectHead( skeleton ) ) );
	p.assign( jointRotateNormal( p, posture.chest, selectChest( skeleton ) ) );
	p.assign( jointRotateNormal( p, posture.waist, selectWaist( skeleton ) ) );



	// LEFT-LOWER BODY

	var hipLeft = selectHipLeft( skeleton ).toVar();

	tsl.If( hipLeft.greaterThan( 0 ), ()=>{

		p.assign( jointRotateNormal( p, posture.footLeft, selectFootLeft( skeleton ) ) );
		p.assign( jointRotateNormal( p, posture.ankleLeft, selectAnkleLeft( skeleton ) ) );
		p.assign( jointRotateNormal( p, posture.legLeft, selectLegLeft( skeleton ) ) );
		p.assign( jointRotateNormal( p, posture.kneeLeft, selectKneeLeft( skeleton ) ) );
		p.assign( jointRotateNormalLeg( p, posture.hip2Left, selectHip2Left( skeleton ) ) );
		p.assign( jointRotateNormalLeg( p, posture.hipLeft, hipLeft ) );

	} );



	// RIGHT-LOWER BODY

	var hipRight = selectHipRight( skeleton ).toVar();

	tsl.If( hipRight.greaterThan( 0 ), ()=>{

		p.assign( jointRotateNormal( p, posture.footRight, selectFootRight( skeleton ) ) );
		p.assign( jointRotateNormal( p, posture.ankleRight, selectAnkleRight( skeleton ) ) );
		p.assign( jointRotateNormal( p, posture.legRight, selectLegRight( skeleton ) ) );
		p.assign( jointRotateNormal( p, posture.kneeRight, selectKneeRight( skeleton ) ) );
		p.assign( jointRotateNormalLeg( p, posture.hip2Right, selectHip2Right( skeleton ) ) );
		p.assign( jointRotateNormalLeg( p, posture.hipRight, hipRight ) );

	} );

	return tsl.transformNormalToView( p ).normalize( );

} );



// dubug function used to mark areas on the 3D model

var tslEmissiveNode = tsl.Fn( ( { skeleton, posture } )=>{

	var s = posture.select;
	var k = tsl.float( 0 )
		.add( selectHead( skeleton ).mul( tsl.select( s.equal( 1 ), 1, 0 ) ) )
		.add( selectChest( skeleton ).mul( tsl.select( s.equal( 2 ), 1, 0 ) ) )
		.add( selectWaist( skeleton ).mul( tsl.select( s.equal( 3 ), 1, 0 ) ) )

		.add( selectHipLeft( skeleton ).mul( tsl.select( s.equal( 11 ), 1, 0 ) ) )
		.add( selectLegLeft( skeleton ).mul( tsl.select( s.equal( 12 ), 1, 0 ) ) )
		.add( selectKneeLeft( skeleton ).mul( tsl.select( s.equal( 13 ), 1, 0 ) ) )
		.add( selectAnkleLeft( skeleton ).mul( tsl.select( s.equal( 14 ), 1, 0 ) ) )
		.add( selectFootLeft( skeleton ).mul( tsl.select( s.equal( 16 ), 1, 0 ) ) )
		.add( selectHip2Left( skeleton ).mul( tsl.select( s.equal( 15 ), 1, 0 ) ) )

		.add( selectArmLeft( skeleton ).mul( tsl.select( s.equal( 21 ), 1, 0 ) ) )
		.add( selectElbowLeft( skeleton ).mul( tsl.select( s.equal( 22 ), 1, 0 ) ) )
		.add( selectForearmLeft( skeleton ).mul( tsl.select( s.equal( 23 ), 1, 0 ) ) )
		.add( selectWristLeft( skeleton ).mul( tsl.select( s.equal( 24 ), 1, 0 ) ) )

		.toVar( );

	k.assign( tsl.select( posture.isolated,
		k.smoothstep( 0, 1 ).mul( 2*Math.PI ).sub( Math.PI ).cos().add( 1 ).div( 2 ).pow( 1/4 ).mul( 1.1 ).negate(),
		k.clamp( 0, 1 ).pow( 0.75 ).negate()
	) );


	return tsl.vec3( 0, k.div( 2 ), k.div( 1 ) );

} );



var tslColorNode = tsl.Fn( ()=>{

	var p = tsl.positionGeometry;

	var k = tsl.float( 0 )
		.add( p.x.mul( 72 ).cos().smoothstep( 0.9, 1 ) )
		.add( p.y.mul( 74 ).cos().smoothstep( 0.9, 1 ) )
		.add( p.z.mul( 74 ).add( p.y.mul( 4.5 ).add( 0.5 ).cos().mul( 1 ).add( 2.5 ) ).abs().smoothstep( 0.6, 0 ) )
		.smoothstep( 0.6, 1 )
		.oneMinus()
		.pow( 0.1 )
		;

	return tsl.vec3( k );

} );



function tslPosture( ) {

	return {

		// TORSO
		head: tsl.uniform( tsl.vec3( 0, 0, 0 ) ),
		chest: tsl.uniform( tsl.vec3( 0, 0, 0 ) ),
		waist: tsl.uniform( tsl.vec3( 0, 0, 0 ) ),

		// LEGS
		kneeLeft: tsl.uniform( tsl.vec3( 0, 0, 0 ) ),
		kneeRight: tsl.uniform( tsl.vec3( 0, 0, 0 ) ),
		ankleLeft: tsl.uniform( tsl.vec3( 0, 0, 0 ) ),
		ankleRight: tsl.uniform( tsl.vec3( 0, 0, 0 ) ),
		footLeft: tsl.uniform( tsl.vec3( 0, 0, 0 ) ),
		footRight: tsl.uniform( tsl.vec3( 0, 0, 0 ) ),
		hipLeft: tsl.uniform( tsl.vec3( 0, 0, 0 ) ),
		hip2Left: tsl.uniform( tsl.vec3( 0, 0, 0 ) ),
		hipRight: tsl.uniform( tsl.vec3( 0, 0, 0 ) ),
		hip2Right: tsl.uniform( tsl.vec3( 0, 0, 0 ) ),
		legLeft: tsl.uniform( tsl.vec3( 0, 0, 0 ) ),
		legRight: tsl.uniform( tsl.vec3( 0, 0, 0 ) ),

		// ARMS
		elbowLeft: tsl.uniform( tsl.vec3( 0, 0, 0 ) ),
		elbowRight: tsl.uniform( tsl.vec3( 0, 0, 0 ) ),
		forearmLeft: tsl.uniform( tsl.vec3( 0, 0, 0 ) ),
		forearmRight: tsl.uniform( tsl.vec3( 0, 0, 0 ) ),
		wristLeft: tsl.uniform( tsl.vec3( 0, 0, 0 ) ),
		wristRight: tsl.uniform( tsl.vec3( 0, 0, 0 ) ),
		armLeft: tsl.uniform( tsl.vec3( 0, 0, 0 ) ),
		armRight: tsl.uniform( tsl.vec3( 0, 0, 0 ) ),
	};

}

exports.createGui = createGui;
exports.credits = credits;
exports.matRotXYZ = matRotXYZ;
exports.matRotXZY = matRotXZY;
exports.matRotYXZ = matRotYXZ;
exports.matRotYZX = matRotYZX;
exports.matRotZXY = matRotZXY;
exports.matRotZYX = matRotZYX;
exports.processModel = processModel;
exports.scene = scene;
exports.tslColorNode = tslColorNode;
exports.tslEmissiveNode = tslEmissiveNode;
exports.tslNormalNode = tslNormalNode;
exports.tslPositionNode = tslPositionNode;
exports.tslPosture = tslPosture;
