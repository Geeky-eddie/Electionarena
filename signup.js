'use strict';

console.clear();

const stage = new Stage({
	// highDPI: false,
	container: document.body
});


window.config = {
	trails: 0,
	rotation: 0,
	scale: 1,
	dotCount: 5,
	dotScale: 1,
	clusterCount: 7,
	clusterScale: 1
};

// Dynamic config
function updateConfig() {
	config.laserRadius = (stage.width < 800 ? 1.4 : 2) * config.dotScale;
	config.maxClusterDiameter = stage.width * (3/4) * config.clusterScale;
	config.clusterSpriteSize = config.maxClusterDiameter + config.laserRadius * 4;
}

updateConfig();



const gui = new dat.GUI();
gui.close();
gui.add(stage, 'speed', -4, 4);
gui.add(config, 'scale', 0.1, 2);
gui.add(config, 'dotCount', 3, 12).step(1);
gui.add(config, 'dotScale', 0.5, 10).onChange(handleResize);
gui.add(config, 'clusterCount', 2, 12).step(1);
gui.add(config, 'clusterScale', 0.1, 2).onChange(handleResize);
gui.add(config, 'trails', 0, 1);



const laserDotSprite = stage.createCachedSprite({
	width: config.laserRadius * 2 + 1,
	height: config.laserRadius * 2 + 1,
	// blendMode: 'lighten',
	draw(ctx, { width, height }) {
		const radius = width / 2;
		const smallRadius = radius * 0.5;
		ctx.fillStyle = '#0F0';
		ctx.beginPath();
		ctx.arc(radius, radius, radius, 0, Math.PI * 2);
		ctx.fill();
		ctx.fillStyle = '#0FF';
		ctx.beginPath();
		ctx.arc(radius, radius, smallRadius, 0, Math.PI * 2);
		ctx.fill();
	}
});

const laserDotClusterSprite = stage.createCachedSprite({
	width: config.clusterSpriteSize,
	height: config.clusterSpriteSize,
	// blendMode: 'lighten',
	draw(ctx, { rotation, width }) {
		const diameter = Math.sin(rotation) * config.maxClusterDiameter;
		const radius = diameter / 2;
		const count = config.dotCount;
		const divisor = count - 1;
		const canvasRadius = width / 2;
		
		for (let x=0; x<count; x++) {
			for (let y=0; y<count; y++) {
				const xPercent = x / divisor;
				const yPercent = y / divisor;
				const dist = Math.sqrt(Math.pow(0.5 - xPercent, 2) + Math.pow(0.5 - yPercent, 2));
				laserDotSprite.x = canvasRadius + xPercent * diameter - radius;
				laserDotSprite.y = canvasRadius + yPercent * diameter - radius;
				ctx.globalAlpha = 1 - dist;
				laserDotSprite.drawOnContext(ctx);
			}
		}
	}
});

const laserSprite = stage.createSprite({
	width: 0,
	height: 0,
	draw(ctx, { rotation }) {
		const diameter = stage.width * config.scale;
		const radius = diameter / 2;
		const count = config.clusterCount;
		const divisor = count - 1;
		
		laserDotClusterSprite.redraw();
		const clusterRadius = laserDotClusterSprite.width / 2;
		
		for (let x=0; x<count; x++) {
			for (let y=0; y<count; y++) {
				const xPercent = x / divisor;
				const yPercent = y / divisor;
				const dist = Math.sqrt(Math.pow(0.5 - xPercent, 2) + Math.pow(0.5 - yPercent, 2));
				laserDotClusterSprite.x = xPercent * diameter - radius - clusterRadius;
				laserDotClusterSprite.y = yPercent * diameter - radius - clusterRadius;
				laserDotClusterSprite.rotation = rotation;
				ctx.globalAlpha = 1 - dist;
				laserDotClusterSprite.drawOnContext(ctx);
			}
		}
	}
});


stage.onTick = function tick({ width, height, simTime }) {
	const config = window.config;

	laserSprite.x = width / 2;
	laserSprite.y = height / 2;
	laserSprite.rotation = config.rotation;
	
	config.rotation += simTime / 5000;
	if (config.rotation > 7 || config.rotation < -7) {
		config.rotation = config.rotation % (Math.PI * 2);
	}
};

stage.onDraw = function draw({ ctx, width, height }) {
	const config = window.config;
	ctx.fillStyle = `rgba(0,0,0,${(1 - Math.pow(config.trails, 0.1)).toFixed(2)})`;
	ctx.fillRect(0, 0, width, height);
	laserSprite.drawOnContext(ctx);
};


function handleResize() {
	updateConfig();
	laserDotSprite.resize(config.laserRadius * 2 + 1, config.laserRadius * 2 + 1);
	laserDotSprite.redraw();
	laserDotClusterSprite.resize(config.clusterSpriteSize, config.clusterSpriteSize);
	// Cluster sprite is currently redrawn every frame, no need to redraw on resize
}

stage.onResize = handleResize;