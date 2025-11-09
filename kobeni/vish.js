'use strict';
// Please note: Do not remove this line or asset references may break.
export let __workshopId = '2935714170';

/**
 * @param {Boolean} value - for property 'visible'
 * @return {Boolean} - update current property value
 */
export var scriptProperties = createScriptProperties()
	.addSlider({
		name: 'barAmount',
		label: 'Bar amount',
		value: 32,
		min: 0,
		max: 100,
		integer: true
	})
	.addSlider({
		name: 'barWidth',
		label: 'Bar width',
		value: 5,
		min: 0,
		max: 10,
		integer: false
	})
	.addSlider({
		name: 'offsetX',
		label: 'Distance between bars',
		value: 50,
		min: -100,
		max: 100,
		integer: false
	})
	.addSlider({
		name: 'scaleY',
		label: 'Height',
		value: 50,
		min: 0,
		max: 100,
		integer: false
	})
	.addSlider({
		name: 'decayScale',
		label: 'Bar decay',
		value: 0.5,
		min: 0,
		max: 1,
		integer: false
	})
	.addSlider({
		name: 'dampeningScale',
		label: 'Dampening',
		value: 0.5,
		min: 0,
		max: 1,
		integer: false
	})
	.addCombo({
		name: 'barAlignmentdir',
		label: 'Direction',
		options: [{
			label: 'Centre',
			value: 'centre'
		}, {
			label: 'Bottom',
			value: 'bottom'
		}, {
			label: 'Top',
			value: 'top'
		}]
	})
	.finish();

const audioBuffer = engine.registerAudioBuffers(engine.AUDIO_RESOLUTION_64);
var bars = [];
var previousScale = [];
var baseOrigin;
var baseColor;
var baseAlpha;

export function init() {
	thisLayer.alignment = scriptProperties.barAlignmentdir;
	bars.push(thisLayer);
	// store a copy so we don't hold a reference that might be mutated elsewhere
	baseOrigin = thisLayer.origin.copy();
	baseColor = thisLayer.color;
	baseAlpha = thisLayer.alpha;

	let thisIndex = thisScene.getLayerIndex(thisLayer);
	for (var i = 1; i < scriptProperties.barAmount; ++i) {
		let bar = thisScene.createLayer('models/bar.json');
		bar.alignment = thisLayer.alignment;
		thisScene.sortLayer(bar, thisIndex);
		// Inherit the parallax depth from the main layer so bars respect editor parallax
		// (was hard-coded to Vec2(0,0) which disabled parallax movement)
		if (thisLayer.parallaxDepth) {
			bar.parallaxDepth = thisLayer.parallaxDepth.copy();
		} else {
			bar.parallaxDepth = new Vec2(0, 0);
		}
		bar.color = baseColor;
		bar.alpha = baseAlpha;
		bars.push(bar);
	}

	// initialize previousScale to avoid undefined math in update
	for (let j = 0; j < scriptProperties.barAmount; ++j) {
		previousScale[j] = 0;
	}
}

export function update() {

	var origin = baseOrigin.copy();
	origin.x -= scriptProperties.offsetX;
	var scale = new Vec3(0 + scriptProperties.barWidth);

	for (var i = 0; i < scriptProperties.barAmount; ++i) {
		let bar = bars[i];
		//calculating bar height
		let audioPos = (i / scriptProperties.barAmount) * 64; //calculates where we are in the 0-64 range
		let dataIndex = Math.floor(audioPos);
		let dataOffset = audioPos - dataIndex; //gets the previous datapoint and calculates how far we are from it
		let audioScale = Math.min((audioBuffer.average[dataIndex] * (1 - dataOffset)) + (audioBuffer.average[dataIndex + 1] * dataOffset), 1); //gets a weighted average of the two data points based on where we are between them

		//applying decay and dampening
		if (previousScale[i] * (1 - scriptProperties.decayScale) >= audioScale) {
			previousScale[i] = previousScale[i] * (1 - scriptProperties.decayScale)
			audioScale = previousScale[i];
		} else {
			previousScale[i] = audioScale;
		}
		if (scriptProperties.dampeningScale != 0) {
			audioScale = Math.log10(((scriptProperties.dampeningScale * 9) * audioScale) + 1)
		}

		//setting bar parameters
		scale.y = scriptProperties.scaleY * audioScale * 5;
		origin.x += scriptProperties.offsetX;
		bar.scale = scale;
		bar.origin = origin;
	}
}
