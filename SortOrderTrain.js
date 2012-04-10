/******************************************************************************* 
 * 
 * Copyright 2012 Bess Siegal
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 ******************************************************************************/

var COLORS = ['red', 'orange', 'yellow', 'purple', 'goldenrod', 'pink', 'coral', 'gold', 'chocolate',
              'khaki', 'lavender', 'lavenderblush', 'salmon', 'darkred', 'crimson', 'magenta'];
var ALPHABET = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
var NUMBERS = []; //initialized on ready
var BOX_START = 150;
var BOX_WIDTH = 100;
var BOX_HEIGHT = 50;
var BOX_MARGIN = 50;
var WHEEL_RADIUS = 15;
var WHEEL_PADDING = 5;
var HITCH_LENGTH = 15;
var LOCO_X = 20;
var LOCO_Y = 388; //reference point for where the loco "top" is drawn
var FRONT_WIDTH = 10;
var BASE_WIDTH = 60;
var CABIN_WIDTH = 60;
var STACK_WIDTH = 20;

function BoxCar(/*int*/ x, /*int*/ y, /*Kinetic.Layer*/ layer, /*Number or Alphabetic character */value, /*boolean*/ isOutline) {
    this.layer = layer;
    this.x = x;
    this.y = y;
    this.value = value;
    
    this.init = function() {
        var group = new Kinetic.Group();
        this.group = group;
        
        var color = !isOutline ? COLORS[Math.floor(Math.random() * COLORS.length)] : '#f1f1f1';
        var stroke = !isOutline ? 'black' : 'darkgray';
        var otherFill = !isOutline ? 'black' : '#f1f1f1';
        /*
         * Add a box
         */
        var box = new Kinetic.Rect({
            x: this.x,
            y: this.y,
            width: BOX_WIDTH,
            height: BOX_HEIGHT,
            name: 'box',
            fill: color,
            stroke: stroke,
            strokeWidth: 4
        });
        group.add(box);
        
        /*
         * Add 1st wheel
         */
        var wheel1 = new Kinetic.Circle({
            x: this.x + WHEEL_RADIUS + WHEEL_PADDING,
            y: this.y + BOX_HEIGHT + WHEEL_PADDING,
            radius: WHEEL_RADIUS,
            name: 'wheel1',
            fill: otherFill,
            stroke: stroke
        });
        group.add(wheel1);
        
        /*
         * Add 2nd wheel
         */
        var wheel2 = new Kinetic.Circle({
            x: this.x + BOX_WIDTH - WHEEL_RADIUS - WHEEL_PADDING,
            y: this.y + BOX_HEIGHT + WHEEL_PADDING,
            radius: WHEEL_RADIUS,
            name: 'wheel2',
            fill: otherFill,
            stroke: stroke
        });
        group.add(wheel2);
        
        /*
         * Add the value as a text
         */
        var text = new Kinetic.Text({
            x: this.x + BOX_WIDTH / 2,
            y: this.y + BOX_HEIGHT / 2,
            name: 'text',
            stroke: otherFill,
            strokeWidth: 2,
            fill: '#F9F9F9',
            text: value,
            fontSize: 20,
            fontFamily: 'Calibri',
            textFill: '#888',
            textStroke: '#444',
            padding: 7,
            align: 'center',
            verticalAlign: 'middle'
        });
        group.add(text);
        
        /*
         * Add a hitch
         */
        var hitch = new Kinetic.Rect({
            x: this.x - HITCH_LENGTH,
            y: this.y + BOX_HEIGHT,
            width: HITCH_LENGTH,
            height: 4,
            name: 'hitch',
            fill: otherFill,
            stroke: stroke
        });
        group.add(hitch);
        
        this.layer.add(group);
        /*
         * Add event handlers to the group if it is not an outline
         */
        if (!isOutline) {
            group.on('mouseover', function(){
                document.body.style.cursor = 'pointer';
            });
            group.on('mouseout', function(){
                document.body.style.cursor = 'default';
            });      
            
            var thiz = this;            
            /*
             * remove group from the layer and add it to the
             * topLayer.  This will improve performance
             * because only one box car will be redrawn for each frame
             * and not everything.  Also, turn off event listening
             * on the boxLayer until dragend
             */
            group.on('mousedown touchstart', function(){
                /*
                 * First clear this value from all outlines that might have it
                 */
                var value = thiz.value;
                for (var i = 0; i < SortOrderTrain.outlns.length; i++) {
                    if (SortOrderTrain.outlns[i].value === value) {
                        SortOrderTrain.outlns[i].value = '?';
                    }
                }
                
                var layer = this.getLayer();
                group.moveTo(SortOrderTrain.topLayer);
                group.draggable(true);
                layer.listen(false);
                layer.draw();
                SortOrderTrain.topLayer.draw();
            });

            /*
             * when the drag operation is completed, remove the group
             * from the topLayer and add it back to the boxLayer.
             * Turn event listening back on for the boxLayer
             */
            group.on('dragend', function(){
                group.moveTo(thiz.layer);
                group.draggable(false);
                thiz.layer.listen(true);
                
                /*
                 * If it is near an outline snap it into place
                 */
                var vector = SortOrderTrain.checkOutline(thiz);
                if (vector) {
                    SortOrderTrain.consoleLog("nudged by =" + vector.x + ", " + vector.y);

                    group.attrs.x += vector.x;
                    group.attrs.y += vector.y;
                    
                }
                thiz.layer.draw();
                SortOrderTrain.topLayer.draw();
                
                /*
                 * If all the outline values match
                 * the answers, hide the outlines, move the
                 * loco to the same layer where the box cars will be
                 * animated and start the animation!
                 */
                var allGood = true;
                for (var i = 0; i < SortOrderTrain.outlns.length; i++) {
                    if (SortOrderTrain.outlns[i].value === '?' || SortOrderTrain.outlns[i].value !== SortOrderTrain.answers[i]) {
                        SortOrderTrain.consoleLog('not equal! for i = ' + i + ' -- SortOrderTrain.outlns[i].value  =  ' + SortOrderTrain.outlns[i].value);
                        SortOrderTrain.consoleLog('SortOrderTrain.answers[i] = ' + SortOrderTrain.answers[i]);
                        allGood = false;
                        break;
                    }
                }
                if (allGood) {
                    SortOrderTrain.loco.moveTo(SortOrderTrain.boxLayer);
                    SortOrderTrain.bgLayer.draw();
                    SortOrderTrain.boxLayer.draw();
                    
                    for (var i = 0; i < SortOrderTrain.puffs.length; i++) {
                        var puff = SortOrderTrain.puffs[i];
                        puff.transition(i * 250);
                    }

                    thiz.layer.listen(false);
                    SortOrderTrain.track = 'track3';
                    /*
                     * Wait until the smoke puffs are done, then start the train moving
                     */
                    setTimeout(function() {
                        SortOrderTrain.loco.moveTo(SortOrderTrain.boxLayer);
                        SortOrderTrain.bgLayer.draw();
                        SortOrderTrain.stage.start();                                                            
                    }, SortOrderTrain.puffs.length * 250);
                }
                
            });      
        }
        
    };    
    
    this.colorize = function(/*String*/color, /*String or number*/ text) {
        SortOrderTrain.consoleLog('colorize: color = ' + color);
        this.group.get('.box')[0].attrs.fill = color;
        this.group.get('.box')[0].attrs.stroke = 'black';
        this.group.get('.wheel1')[0].attrs.stroke = 'black';
        this.group.get('.wheel1')[0].attrs.fill = 'black';
        this.group.get('.wheel2')[0].attrs.stroke = 'black';
        this.group.get('.wheel2')[0].attrs.fill = 'black';
        this.group.get('.hitch')[0].attrs.stroke = 'black';
        this.group.get('.hitch')[0].attrs.fill = 'black';
        this.group.get('.text')[0].attrs.text = text;
        this.layer.draw();
    };
    
    this.init();

}

function Puff (/*Kinetic.Layer*/ layer, /*int*/ x, /*int*/ y) {
    this.layer = layer;
    this.x = x;
    this.y = y;
    this.init = function() {        
        var puff = new Kinetic.Shape({
            drawFunc: function(){
                var context = this.getContext();
                context.beginPath();
                context.moveTo(x + 5, y -15);
                context.bezierCurveTo(x - 3, y - 17, x + 3, y - 33, x + 17, y - 28);
                context.bezierCurveTo(x + 15, y - 32, x + 23, y - 25, x + 18, y - 23);
                context.bezierCurveTo(x + 35, y - 18, x + 28, y - 4, x + 16, y - 7);
                context.bezierCurveTo(x + 18, y + 5, x - 5, y - 5, x + 5, y - 15);
                context.closePath(); // complete custom shape
                this.fillStroke();
            },
            fill: 'white',
            alpha: 0
        });

        layer.add(puff);  
        
        this.puff = puff;
        
    };

    this.reset = function() {
        this.puff.attrs.x = 0;
        this.puff.attrs.y = 0;
        this.puff.attrs.scale.x = 1;
        this.puff.attrs.scale.y = 1;
        this.puff.attrs.alpha = 1;
        this.puff.moveToTop();
    };
    
    this.transition = function(/*int*/ ms) {
        var thiz = this;
        setTimeout(function() {
            thiz.reset();
            thiz.puff.transitionTo({
                y: -400,
                x: -20,
                alpha: 0,
                scale: {
                    x: 1.7,
                    y: 1.7
                },
                duration: 1
            });                
        }, ms);
    };
    
    this.init();
}

var SortOrderTrain = {
    debug: true,
    /* Kinetic.Stage - the stage */
    stage: null,
    /* int level (default to lowest) */
    level: 2, 
    /* the Kinetic.Layer to move things around on */
    topLayer: null,
    /* Kinetic.Layer to be the background */
    bgLayer: null, 
    /* Kinetic.Layer for the box cars */
    boxLayer: null,
    /* array of BoxCar objects with random values */
    cars: [],
    /* array of BoxCar objects where isOutline = true for place holder outlines */
    outlns: [],
    /* sorted array of answer values (either String or int) */
    answers: [],
    /* Kinetic.Group of shapes that make the locomotive */
    loco: null,
    /* Kinetic.Shape of the front most hill */
    hill3: null,
    /* Kinetic.Shape of the hill by the middle track */
    hill2: null,
    /* array of Puff objects */
    puffs: [],
    
    init: function() {
        SortOrderTrain.setMode();
        SortOrderTrain.setLevel();
        
        var stage = new Kinetic.Stage({container: 'game', width: 1000, height: 600});
        SortOrderTrain.stage = stage;
        /*
         * Create the background layer and sky, clouds,
         * hills, tracks, that never move.  The locomotive
         * will be here, too until it's time to move.
         */
        SortOrderTrain.bgLayer = new Kinetic.Layer();
        SortOrderTrain.createBackground(SortOrderTrain.bgLayer);
        stage.add(SortOrderTrain.bgLayer);

        /*
         * Create the layer for all the moveable box cars,
         * the box cars themselves, 
         * then add the layer to the stage.
         * 
         * We all so add the place holder outlines to this
         * layer even though they never move, because
         * they can cleared/redrawn the same time as the box cars.
         */
        SortOrderTrain.boxLayer = new Kinetic.Layer();        
        SortOrderTrain.initBoxLayer();
        stage.add(SortOrderTrain.boxLayer);
        
        /*
         * Create the layer the layer where things move
         * and add to stage
         */
        SortOrderTrain.topLayer = new Kinetic.Layer();
        stage.add(SortOrderTrain.topLayer);
        
        stage.onFrame(function(frame){
            SortOrderTrain.animateTrain(frame);
        });
       
    },    
    
    initBoxLayer: function() {
        SortOrderTrain.setMode();
        SortOrderTrain.setLevel();
        
        var x = LOCO_X + FRONT_WIDTH + BASE_WIDTH + CABIN_WIDTH + HITCH_LENGTH;
        var y = LOCO_Y + 40; /* same as base */
        
        /*
         * Create the outlines and cars
         */
        SortOrderTrain.createBoxCarOutlines(SortOrderTrain.boxLayer, x, y);
        SortOrderTrain.createBoxCars(SortOrderTrain.boxLayer);
    },
    
    createBackground: function(/*Kinetic.Layer*/ layer) {
        /*
         * get context for color gradients and pattern
         */
        var context = layer.getContext();        
        
        /*
         * sky with color gradient
         */
        
        var skyCanvasGradient = context.createLinearGradient(0, 0, 0, 300);
        skyCanvasGradient.addColorStop(0, '#004CB3'); // light blue
        skyCanvasGradient.addColorStop(1, '#8ED6FF'); // dark blue
        
        var sky = new Kinetic.Rect({
            x: 0,
            y: 0,
            width: 1000,
            height: 300,
            fill: skyCanvasGradient,
        });
        layer.add(sky);

        /*
         * Clouds
         */
        var cloudCanvasGradient = context.createLinearGradient(0, 75, 0, 100);
        cloudCanvasGradient.addColorStop(0, 'white'); 
        cloudCanvasGradient.addColorStop(1, '#f0f0f0'); // light gray
        
        var cloud = new Kinetic.Shape({
            drawFunc: function(){
                var context = this.getContext();
                context.beginPath();
                context.moveTo(100, 100); 
                context.lineTo(750, 100)
                context.bezierCurveTo(750, 90, 480, 80, 275, 80); 
                context.bezierCurveTo(510, 90, 500, 45, 375, 50); 
                context.bezierCurveTo(500, 40, 150, 0, 208, 25); 
                context.bezierCurveTo(125, 25, 65, 50, 130, 70); 
                context.bezierCurveTo(65, 75, 65, 85, 170, 90); 
                context.closePath(); // complete custom shape
                this.fillStroke();  
            },
            fill: cloudCanvasGradient
        });
        layer.add(cloud);
                
        cloudCanvasGradient = context.createLinearGradient(375, 170, 375, 200);
        cloudCanvasGradient.addColorStop(0, 'white'); 
        cloudCanvasGradient.addColorStop(1, '#f0f0f0'); // light gray
        cloud = new Kinetic.Shape({
            drawFunc: function(){
                var context = this.getContext();
                context.beginPath();
                context.moveTo(375, 200); 
                context.lineTo(950, 200) 
                context.bezierCurveTo(1000, 170, 520, 160, 750, 170);
                context.bezierCurveTo(670, 110, 500, 150, 570, 140); 
                context.bezierCurveTo(490, 100, 400, 185, 500, 165); 
                context.closePath(); // complete custom shape
                this.fillStroke();  
            },
            fill: cloudCanvasGradient
        });
        layer.add(cloud);
        
        cloudCanvasGradient = context.createLinearGradient(0, 230, 0, 250);
        cloudCanvasGradient.addColorStop(0, 'white'); 
        cloudCanvasGradient.addColorStop(1, '#f0f0f0'); // light gray
        cloud = new Kinetic.Shape({
            drawFunc: function(){
                var context = this.getContext();
                context.beginPath();
                context.moveTo(0, 250); 
                context.lineTo(180, 250) 
                context.bezierCurveTo(170, 240, 140, 210, 110, 230);
                context.bezierCurveTo(120, 220, 100, 180, 20, 210); 
                context.bezierCurveTo(75, 200, 20, 185, 0, 190); 
                context.closePath(); // complete custom shape
                this.fillStroke();  
            },
            fill: cloudCanvasGradient
        });
        layer.add(cloud);
        /*
         * grass with color gradient
         */
        var grassCanvasGradient = context.createLinearGradient(0, 0, 0, 200);
        grassCanvasGradient.addColorStop(0, '#57fb57'); // light green
        grassCanvasGradient.addColorStop(1, '#2abf2a'); // dark green
        
        var grass = new Kinetic.Rect({
            x: 0,
            y: 300,
            width: 1000,
            height: 200,
            fill: grassCanvasGradient
        });
        layer.add(grass);

        /*
         * gravel for parked box cars
         */
        var gravel = new Kinetic.Rect({
            x: 0,
            y: 500,
            width: 1000,
            height: 100
        });
        layer.add(gravel);

                        
        /*
         * hills and tracks
         */
        var hill1 = new Kinetic.Shape({
            drawFunc: function(){
                var context = this.getContext();
                context.beginPath();
                context.moveTo(350, 300);
                context.quadraticCurveTo(500, 0, 700, 300);
                context.closePath(); // complete custom shape
                this.fillStroke();  
            },
            fill: '#57fb57'
        });
        layer.add(hill1);
        
        var track1 = new Kinetic.Rect({
            x: 0,
            y: 300,
            width: 1000,
            height: 2,
            stroke: 'black',
            strokeWidth: 1
        });        
        layer.add(track1);

        var hill2 = new Kinetic.Shape({
            drawFunc: function(){
                var context = this.getContext();
                context.beginPath();
                context.moveTo(600, 368);
                context.quadraticCurveTo(700, 0, 900, 368);
                context.closePath(); // complete custom shape
                this.fillStroke();  
            },
            fill: '#48e848'
        });
        layer.add(hill2);
        SortOrderTrain.hill2 = hill2;        
                
        var track2 = new Kinetic.Rect({
            x: 0,
            y: 370,
            width: 1000,
            height: 3,
            stroke: 'black',
            strokeWidth: 2
        });        
        layer.add(track2);

        var hill3 = new Kinetic.Shape({
            drawFunc: function(){
                var context = this.getContext();
                context.beginPath();
                context.moveTo(0, 496);
                context.quadraticCurveTo(200, 20, 410, 496);
                context.closePath(); // complete custom shape
                this.fillStroke();  
            },
            fill: '#2abf2a'
        });
        layer.add(hill3);
        SortOrderTrain.hill3 = hill3;
        
        var track3 = new Kinetic.Rect({
            x: 0,
            y: 500,
            width: 1000,
            height: 4,
            stroke: 'black',
            strokeWidth: 3
        });        
        layer.add(track3);
        
        /*
         * gravel pattern for gravel and tracks
         */
        var imageObj = new Image();
        imageObj.onload = function() {
            var pattern = context.createPattern(imageObj, "repeat");
                 
            gravel.setFill(pattern);
            track1.setFill(pattern);
            track2.setFill(pattern);
            track3.setFill(pattern);
            
            layer.draw();
        };
        imageObj.src = "320px-Gravel_small_stones.jpg";
        

        
        SortOrderTrain.createSmokePuffs(layer, LOCO_X + FRONT_WIDTH + STACK_WIDTH / 4, LOCO_Y + 10);
        SortOrderTrain.createLoco(layer);
    },
    
    
    createLoco: function(/*Kinetic.Layer*/ layer) {
        var loco = new Kinetic.Group();
        
        var frontHeight = 55;
        var front = new Kinetic.Rect({
            x: LOCO_X,
            y: LOCO_Y + 35,
            width: FRONT_WIDTH,
            height: frontHeight,
            stroke: 'black',
            strokeWidth: 4,
            fill: COLORS[Math.floor(Math.random() * COLORS.length)]
        });
        loco.add(front);
        
        var baseHeight = 50;
        var base  = new Kinetic.Rect({
            x: LOCO_X + FRONT_WIDTH,
            y: LOCO_Y + 40,
            width: BASE_WIDTH,
            height: baseHeight,
            stroke: 'black',
            strokeWidth: 4,
            fill: COLORS[Math.floor(Math.random() * COLORS.length)]
        });
        loco.add(base);
        
        var cabinHeight = 80;
        var cabin = new Kinetic.Rect({
            x: LOCO_X + FRONT_WIDTH + BASE_WIDTH,
            y: LOCO_Y + 10,
            width: CABIN_WIDTH,
            height: cabinHeight,
            stroke: 'black',
            strokeWidth: 4,
            fill: COLORS[Math.floor(Math.random() * COLORS.length)]
        });
        loco.add(cabin);

        var windowWidth = CABIN_WIDTH - 30;
        var windowHeight = cabinHeight - 50;
        var window = new Kinetic.Rect({
            x: LOCO_X + FRONT_WIDTH + BASE_WIDTH + 15,
            y: LOCO_Y + 25,
            width: windowWidth,
            height: windowHeight,
            stroke: 'black',
            strokeWidth: 4,
            fill: COLORS[Math.floor(Math.random() * COLORS.length)]
        });
        loco.add(window);
        
        var topWidth = CABIN_WIDTH + 10;
        var topHeight = 10;
        var top =  new Kinetic.Rect({
            x: LOCO_X + FRONT_WIDTH + BASE_WIDTH - 5,
            y: LOCO_Y,
            width: topWidth,
            height: topHeight,
            stroke: 'black',
            strokeWidth: 4,
            fill: COLORS[Math.floor(Math.random() * COLORS.length)]
        });
        loco.add(top);

        var stackHeight = 30;
        var stack =  new Kinetic.Rect({
            x: LOCO_X + FRONT_WIDTH + STACK_WIDTH / 2,
            y: LOCO_Y + 10,
            width: STACK_WIDTH,
            height: stackHeight,
            stroke: 'black',
            strokeWidth: 4,
            fill: COLORS[Math.floor(Math.random() * COLORS.length)]
        });
        loco.add(stack);

        var stackTopWidth = STACK_WIDTH + 10;
        var stackTopHeight = 15;
        var stackTop = new Kinetic.Rect({
            x: LOCO_X + FRONT_WIDTH + STACK_WIDTH / 2 - 5,
            y: LOCO_Y - 5,
            width: stackTopWidth,
            height: stackTopHeight,
            stroke: 'black',
            strokeWidth: 4,
            fill: COLORS[Math.floor(Math.random() * COLORS.length)]
        });
        loco.add(stackTop);

        var fender = new Kinetic.Shape({
            drawFunc: function(){
                var context = this.getContext();
                context.beginPath();
                context.moveTo(LOCO_X + 0, LOCO_Y + cabinHeight + topHeight);
                context.lineTo(LOCO_X - 10, LOCO_Y + cabinHeight + 2 * WHEEL_RADIUS);
                context.lineTo(LOCO_X + FRONT_WIDTH, LOCO_Y + cabinHeight + 2 * WHEEL_RADIUS);
                context.lineTo(LOCO_X + FRONT_WIDTH, LOCO_Y + cabinHeight + topHeight);
                context.closePath();
                this.fillStroke();
                
            },
            stroke: 'black',
            strokeWidth: 4,
            fill: COLORS[Math.floor(Math.random() * COLORS.length)]
        });

        loco.add(fender);

        /*
         * Add 1st wheel
         */
        var wheel1 = new Kinetic.Circle({
            x: LOCO_X + FRONT_WIDTH + WHEEL_RADIUS + WHEEL_PADDING,
            y: LOCO_Y + cabinHeight + topHeight + WHEEL_PADDING,
            radius: WHEEL_RADIUS,
            fill: 'black',
            stroke: 'black'
        });
        loco.add(wheel1);
        
        /*
         * Add 2nd wheel
         */
        var wheel2 = new Kinetic.Circle({
            x: LOCO_X + FRONT_WIDTH + BASE_WIDTH + 30,
            y: LOCO_Y + cabinHeight + topHeight + WHEEL_PADDING,
            radius: WHEEL_RADIUS,
            fill: 'black',
            stroke: 'black'
        });
        loco.add(wheel2);
        
        layer.add(loco);

        SortOrderTrain.loco = loco;
    },
    
    createSmokePuffs: function(/*Kinetic.Layer*/ layer, /*int*/ x, /*int*/ y) {
        for (var i = 0; i < 3; i++) {
            SortOrderTrain.puffs.push(new Puff(layer, x, y));            
        }
    },
        
    createBoxCarOutlines: function(/*Kinetic.Layer*/ layer, /*int*/ startX, /*int*/ y) {
        var outlns = [];
        
        /*
         * we need the same number ouf outlines as box cars (which is same as level)
         */        
        for (var i = 0; i < SortOrderTrain.level; i++) {
            /*
             * place them at HITCH_LENGTH + BOX_WIDTH apart from each other
             */
            var x = startX + i * (HITCH_LENGTH + BOX_WIDTH); 

            /*
             * create the box car and add it to the layer
             */
            var outline = new BoxCar(x, y, layer, '?', true);
            
            outlns.push(outline);
        }
        SortOrderTrain.outlns = outlns;
    },
    
    createBoxCars: function(/*Kinetic.Layer*/ layer) {
        var cars = [];
        SortOrderTrain.answers = [];
        /*
         * copy the array based on the mode
         */
        var values = SortOrderTrain.mode === 'num' ? NUMBERS.slice() : ALPHABET.slice();
        
        SortOrderTrain.consoleLog('createBoxCars: level = ' + SortOrderTrain.level + '; BOX_START = ' + BOX_START + ', BOX_MARGIN = ' + BOX_MARGIN);
        for (var i = 0; i < SortOrderTrain.level; i++) {
            /*
             * randomly pick a value from the array, then remove it from the array so it cannot be picked again
             */
            var vIdx = Math.floor(Math.random() * values.length);
            var value = values.splice(vIdx, 1);
            SortOrderTrain.answers.push(value);
            /*
             * create the box car and add it to the layer
             */
            var boxCar = new BoxCar(i * (BOX_WIDTH + BOX_MARGIN + HITCH_LENGTH) + BOX_MARGIN + BOX_START, 520, layer, value);
            cars.push(boxCar);
        }
        /*
         * sort the answers
         */
        if (SortOrderTrain.mode === 'num') {
            SortOrderTrain.answers.sort(function(a, b) {
                return a - b;
            });
        } else {
            SortOrderTrain.answers.sort();            
        }
        
        SortOrderTrain.cars = cars;
    },
    
    checkOutline: function(/* BoxCar */ boxcar){
        /*
         * Test all the outlines.  If it is close to one
         * return the one it is closest to.
         * 
         * We use the absolue position of the box (rect)
         * of the box car, b/c absolute position of the group
         * doesn'tt seem to work and instead return relative to original position.
         */
        var a = boxcar.group.get('.box')[0].getAbsolutePosition();

        for (var i = 0; i < SortOrderTrain.outlns.length; i++) {
            SortOrderTrain.consoleLog('a.x = ' + a.x + ', a.y = ' + a.y);
            var o = SortOrderTrain.outlns[i];
            SortOrderTrain.consoleLog('i = ' + i + ': o.x = ' + o.x + ', o.y = ' + o.y);
            if (a.x > o.x - 20 && a.x < o.x + 20 && a.y > o.y - 20 && a.y < o.y + 20) {
                /*
                 * Create vector with the difference in locations
                 * so the box car can be snapped into place
                 */
                var vector = {x: o.x - a.x, y: o.y - a.y};
                
                /*
                 * If there was already a box car on this outline,
                 * transition it back to it's 0,0 position.
                 */
                if (o.value !== '?') {
                    for (var j = 0; j < SortOrderTrain.cars.length; j++) {
                        if (SortOrderTrain.cars[j].value === o.value) {
                            SortOrderTrain.cars[j].group.transitionTo({
                                y: 0,
                                x: 0,
                                duration: 0.3
                            });
                            break;
                        }
                    }
                }
                /*
                 * Then set the value of the outline to this box car's value
                 */
                o.value = boxcar.value;
                SortOrderTrain.consoleLog('outline[' + i + '].value = ' + boxcar.value);
                return vector;
            }
        }
        return null;
    },
    
    setMode: function() {
        SortOrderTrain.mode = $('#mode').val();
    },
    
    setLevel: function() {
        var lvl = parseInt($('#level').val());
        if (lvl <= 3) {
            BOX_MARGIN = 100;
        } else if (lvl <= 5) {
            BOX_START = 150;
            BOX_MARGIN = 50;
        } else {
            BOX_START = 0;
            if (lvl > 6) {
                BOX_MARGIN = 25;
            } else {
                BOX_MARGIN = 50;
            }
        }
        SortOrderTrain.consoleLog('setLevel: level = ' + lvl + '; BOX_START = ' + BOX_START + ', BOX_MARGIN = ' + BOX_MARGIN);
        SortOrderTrain.level = lvl;
    },

    animateTrain: function(/*Frame*/frame) {
        /*
         * Move the loco, outlines, and box cars.
         * It would be nice if they were all in a group
         * and moved together, but sometimes outline
         * shows on top of the box car, even after the boxcar has moveToTop.
         * Moving each separately for now.
         */
        var dx = SortOrderTrain.track === 'track3' ? -1.5 : SortOrderTrain.track === 'track2' ? 1 : -0.5;
        dx = dx * SortOrderTrain.level;
        /*
         * on the ipad the from frame.timeDiff is a little
         * slower, so let's make the dx more if it is.
         */
        dx = frame.timeDiff > 20 ? frame.timeDiff > 30 ? frame.timeDiff > 40 ? dx * 4 : dx * 3 : dx * 2 : dx;
        
        SortOrderTrain.moveTrain(dx);
    },
    
    moveTrain: function(/*int*/ dx) {
        var track = SortOrderTrain.track;
        SortOrderTrain.loco.attrs.x += dx;
        
        for (var i = 0; i < SortOrderTrain.cars.length; i++) {
            SortOrderTrain.cars[i].group.attrs.x += dx;               
            SortOrderTrain.outlns[i].group.attrs.x += dx; //move the outlines, too, for stop condition, and they will be the ones that move on other tracks
        }
        SortOrderTrain.boxLayer.draw();
        
        if (track === 'track3' && SortOrderTrain.outlns[SortOrderTrain.outlns.length - 1].group.get('.box')[0].getAbsolutePosition().x + BOX_WIDTH < 0) {  
            SortOrderTrain.consoleLog('stop condition for track3 met');
            /*
             * it has finished track 3, move to track2
             */
            SortOrderTrain.stage.stop();
            SortOrderTrain.hill3.moveTo(SortOrderTrain.topLayer);
            SortOrderTrain.topLayer.draw();
            SortOrderTrain.bgLayer.draw();
            
            SortOrderTrain.track = 'track2';
            SortOrderTrain.changeTrack();
            SortOrderTrain.stage.start();
        } else if (track === 'track2'  && SortOrderTrain.loco.getAbsolutePosition().x  - SortOrderTrain.outlns.length * (BOX_WIDTH + HITCH_LENGTH) > 1000) {
            SortOrderTrain.consoleLog('stop condition for track2 met');
            /*
             * it has finished track 2, move to track1
             */
            SortOrderTrain.stage.stop();
            SortOrderTrain.hill2.moveTo(SortOrderTrain.topLayer);
            SortOrderTrain.topLayer.draw();
            SortOrderTrain.bgLayer.draw();
            
            SortOrderTrain.track = 'track1';           
            SortOrderTrain.changeTrack();
            SortOrderTrain.stage.start();
        } else if (track === 'track1' && SortOrderTrain.outlns[SortOrderTrain.outlns.length - 1].group.get('.box')[0].getAbsolutePosition().x + BOX_WIDTH < 0) {
            SortOrderTrain.consoleLog('stop condition for track1 met');
            SortOrderTrain.stage.stop();
            
            SortOrderTrain.reInit();
        }
        
    },
    
    changeTrack: function() {
        var scaleX = 1;
        var scaleY = 1;
        var x = 0; //reduce the time off the screen by setting x
        if (SortOrderTrain.track === 'track2') {
            scaleY = 0.74;
            scaleX = -scaleY;
        } else if (SortOrderTrain.track === 'track1'){
            scaleY = 0.60;
            scaleX = scaleY;
            x = 1000;
        } 
        
        /*
         * Scaling them puts them on the correct track.
         * Using a negative x scale will invert (flip horizontally)! -- thanks to the forum for that one
         */
        SortOrderTrain.loco.attrs.x = x;
        SortOrderTrain.loco.attrs.scale.x = scaleX;
        SortOrderTrain.loco.attrs.scale.y = scaleY;
        
        
        for (var i = 0; i < SortOrderTrain.cars.length; i++) {
            SortOrderTrain.outlns[i].group.attrs.x = x;
            SortOrderTrain.outlns[i].group.attrs.scale.x = scaleX;
            SortOrderTrain.outlns[i].group.attrs.scale.y = scaleY;
                       
            if (scaleX < 0) {
                SortOrderTrain.colorizeOutline(SortOrderTrain.outlns[i]);
                /*
                 * Flip the text so it won't appear backward
                 */
                SortOrderTrain.outlns[i].group.get('.text')[0].attrs.scale.x = -1;

            } else {
                /*
                 * Set the text normally again
                 */
                SortOrderTrain.outlns[i].group.get('.text')[0].attrs.scale.x = 1;
            }
            SortOrderTrain.cars[i].group.hide(); //we still need the colors, so just hide them for now            

        }                
    },
        
    colorizeOutline: function(/*BoxCar*/ outline) {
        /*
         * Find the boxcar with the same value, then get that car's fill color
         */
      for (var i = 0; i < SortOrderTrain.cars.length; i++) {
          var boxcar = SortOrderTrain.cars[i];
          if (boxcar.value === outline.value) {
              
              var color = boxcar.group.get('.box')[0].attrs.fill;
              outline.colorize(color, outline.value);
              
              return;
          }
      }
        
    },
    
    reInit: function() {
        /*
         * stop animation, if any,
         * and let the boxLayer listen again
         */
        SortOrderTrain.stage.stop();
        SortOrderTrain.boxLayer.listen(true);
                
        /*
         * put the hills back and
         * put the loco back to original size, at original position
         * in the original layer
         */
        SortOrderTrain.hill3.moveTo(SortOrderTrain.bgLayer);
        SortOrderTrain.hill2.moveTo(SortOrderTrain.bgLayer);
        SortOrderTrain.topLayer.draw();

        SortOrderTrain.loco.setScale(1);
        SortOrderTrain.loco.moveTo(SortOrderTrain.bgLayer);
        SortOrderTrain.loco.setPosition(0, 0);
        SortOrderTrain.bgLayer.draw();

        /*
         * clear the box layer and remove all place holder outlines and box cars
         */
        SortOrderTrain.boxLayer.clear();
        SortOrderTrain.boxLayer.removeChildren();
        SortOrderTrain.initBoxLayer();
        SortOrderTrain.boxLayer.draw();
    },
    
    about: function(show) {
        if (show) {
            $('#about').slideDown();
        } else {
            $('#about').slideUp();
        }
    },
    
    toggleAbout: function() {
        if ($('#about').is(':visible')) {
            SortOrderTrain.about(false);
        } else {
            SortOrderTrain.about(true);
        }
    },
    
    consoleLog: function(msg) {
        if (SortOrderTrain.debug && console && console.log) {
            console.log(msg);
        }
    }

};

$(function() {
    $('html').click(function() {
        if ($('#about').is(':visible')) {
            $('#about').slideUp();
        }
    });

    NUMBERS = [];
    for (var i = 0; i < 100; i++) {
        NUMBERS[i] = i + 1;
    }
    SortOrderTrain.init();
});