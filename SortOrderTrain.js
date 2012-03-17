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
              'khaki', 'lavender', 'lavenderblush', 'salmon', 'linen', 'darkred', 'crimson', 'magenta'];
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
var frontWidth = 10;
var frontHeight = 55;
var baseWidth = 60;
var baseHeight = 50;
var cabinWidth = 60;
var cabinHeight = 80;
var windowWidth = cabinWidth - 30;
var windowHeight = cabinHeight - 50;
var topWidth = cabinWidth + 10;
var topHeight = 10;

function BoxCar(/*int*/ x, /*int*/ y, /*Kinetic.Layer*/ layer, /*Number or Alphabetic character */value, /*boolean*/ isOutline) {
    this.layer = layer;
    this.x = x;
    this.y = y;
    this.value = value === '?' ? [] : [value]; //array because outlines might have more than 1 value if 1+ boxcars are on it
    
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
                var value = thiz.value[0];
                for (var i = 0; i < SortOrderTrain.outlns.length; i++) {
                    for (var j = 0; j < SortOrderTrain.outlns[i].value.length; j++) {
                        if (SortOrderTrain.outlns[i].value[j] === value) {
                            SortOrderTrain.outlns[i].value.splice(j, 1);
                        }
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
             * when the drag operation is completed, remove the gropu
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
                    if (console && console.log) console.log("nudged by =" + vector.x + ", " + vector.y);

                    group.x += vector.x;
                    group.y += vector.y;
                    
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
                    if (SortOrderTrain.outlns[i].value.length !== 1 || SortOrderTrain.outlns[i].value[0] !== SortOrderTrain.answers[i]) {
                        if (console && console.log) console.log('not equal! for i = ' + i + ' -- SortOrderTrain.outlns[i].value  =  ' + SortOrderTrain.outlns[i].value[0]);
                        if (console && console.log) console.log('SortOrderTrain.answers[i] = ' + SortOrderTrain.answers[i]);
                        allGood = false;
                        break;
                    }
                }
                if (allGood) {
                    SortOrderTrain.loco.moveTo(SortOrderTrain.boxLayer);
                    SortOrderTrain.bgLayer.draw();
                    
                    thiz.layer.listen(false);
                    SortOrderTrain.track = 'track3';
                    SortOrderTrain.stage.start();                                    
                }
                
            });      
        }
        
    };    
    
    this.colorize = function(/*String*/color, /*String or number*/ text) {
        this.group.getChild('box').fill = color;
        this.group.getChild('box').stroke = 'black';
        this.group.getChild('wheel1').stroke = 'black';
        this.group.getChild('wheel1').fill = 'black';
        this.group.getChild('wheel2').stroke = 'black';
        this.group.getChild('wheel2').fill = 'black';
        this.group.getChild('hitch').stroke = 'black';
        this.group.getChild('hitch').fill = 'black';
        this.group.getChild('text').text = text;
        this.layer.draw();
    };
    
    this.init();

}

var SortOrderTrain = {
    /* Kinetic.Stage - the stage */
    stage: null,
    /* int level (default to lowest) */
    level: 5, 
    /* the Kinetic.Layer to move things around on */
    topLayer: null,
    /* Kinetic.Layer to be the background */
    bgLayer: null, 
    /* Kinetic.Layer for the box cars */
    boxLayer: null,
    /* array of BoxCar objects */
    cars: [],
    /* array of Kinetic.Shape objects for place holder outlines */
    outlns: [],
    /* sorted array of answer values (either String or int) */
    answers: [],
    /* Kinetic.Group of shapes that make the locomotive */
    loco: null,
    /* Kinetic.Shape of the front most hill */
    hill3: null,
    /* Kinetic.Shape of the hill by the middle track */
    hill2: null,
    
    init: function() {
        SortOrderTrain.setMode();
        SortOrderTrain.setLevel();
        
        var stage = new Kinetic.Stage('game', 1000, 600);
        SortOrderTrain.stage = stage;
        /*
         * Create the background layer and sky, clouds,
         * hills, tracks, that never move.  The locomotive
         * will be here, too until it's time to move.
         */
        SortOrderTrain.bgLayer = new Kinetic.Layer();
        SortOrderTrain.loco = SortOrderTrain.createBackground(SortOrderTrain.bgLayer);
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
        
        SortOrderTrain.createBoxCarOutlines(SortOrderTrain.boxLayer, LOCO_X + frontWidth + baseWidth + cabinWidth + HITCH_LENGTH, LOCO_Y + 40 /* same as base */);
        SortOrderTrain.cars = SortOrderTrain.createBoxCars(SortOrderTrain.boxLayer);
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
        

        return SortOrderTrain.createLoco(layer);
    },
    
    
    createLoco: function(/*Kinetic.Layer*/ layer) {
        var loco = new Kinetic.Group();
        
        var front = new Kinetic.Rect({
            x: LOCO_X,
            y: LOCO_Y + 35,
            width: frontWidth,
            height: frontHeight,
            stroke: 'black',
            strokeWidth: 4,
            fill: COLORS[Math.floor(Math.random() * COLORS.length)]
        });
        loco.add(front);
        
        var base  = new Kinetic.Rect({
            x: LOCO_X + frontWidth,
            y: LOCO_Y + 40,
            width: baseWidth,
            height: baseHeight,
            stroke: 'black',
            strokeWidth: 4,
            fill: COLORS[Math.floor(Math.random() * COLORS.length)]
        });
        loco.add(base);
        
        var cabin = new Kinetic.Rect({
            x: LOCO_X + frontWidth + baseWidth,
            y: LOCO_Y + 10,
            width: cabinWidth,
            height: cabinHeight,
            stroke: 'black',
            strokeWidth: 4,
            fill: COLORS[Math.floor(Math.random() * COLORS.length)]
        });
        loco.add(cabin);

        var window = new Kinetic.Rect({
            x: LOCO_X + frontWidth + baseWidth + 15,
            y: LOCO_Y + 25,
            width: windowWidth,
            height: windowHeight,
            stroke: 'black',
            strokeWidth: 4,
            fill: COLORS[Math.floor(Math.random() * COLORS.length)]
        });
        loco.add(window);
        
        var top =  new Kinetic.Rect({
            x: LOCO_X + frontWidth + baseWidth - 5,
            y: LOCO_Y,
            width: topWidth,
            height: topHeight,
            stroke: 'black',
            strokeWidth: 4,
            fill: COLORS[Math.floor(Math.random() * COLORS.length)]
        });
        loco.add(top);

        var stackWidth = 20;
        var stackHeight = 30;
        var stack =  new Kinetic.Rect({
            x: LOCO_X + frontWidth + stackWidth / 2,
            y: LOCO_Y + 10,
            width: stackWidth,
            height: stackHeight,
            stroke: 'black',
            strokeWidth: 4,
            fill: COLORS[Math.floor(Math.random() * COLORS.length)]
        });
        loco.add(stack);

        var stackTopWidth = stackWidth + 10;
        var stackTopHeight = 15;
        var stackTop = new Kinetic.Rect({
            x: LOCO_X + frontWidth + stackWidth / 2 - 5,
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
                context.lineTo(LOCO_X + frontWidth, LOCO_Y + cabinHeight + 2 * WHEEL_RADIUS);
                context.lineTo(LOCO_X + frontWidth, LOCO_Y + cabinHeight + topHeight);
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
            x: LOCO_X + frontWidth + WHEEL_RADIUS + WHEEL_PADDING,
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
            x: LOCO_X + frontWidth + baseWidth + 30,
            y: LOCO_Y + cabinHeight + topHeight + WHEEL_PADDING,
            radius: WHEEL_RADIUS,
            fill: 'black',
            stroke: 'black'
        });
        loco.add(wheel2);
        
        layer.add(loco);

        return loco;
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
        
        return cars;
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
        var a = boxcar.group.getChild('box').getAbsolutePosition();

        for (var i = 0; i < SortOrderTrain.outlns.length; i++) {
            if (console && console.log) console.log('a.x = ' + a.x + ', a.y = ' + a.y);
            var o = SortOrderTrain.outlns[i];
            if (console && console.log) console.log('i = ' + i + ': o.x = ' + o.x + ', o.y = ' + o.y);
            if (a.x > o.x - 20 && a.x < o.x + 20 && a.y > o.y - 20 && a.y < o.y + 20) {
                /*
                 * Create vector with the difference in locations
                 * so the box car can be snapped into place
                 */
                var vector = {x: o.x - a.x, y: o.y - a.y};
                
                /*
                 * set the value of the outline to this box car's value
                 */
                o.value.push(boxcar.value[0]);
                if (console && console.log) console.log('outline[' + i + '].value pushed ' + boxcar.value[0]);
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
            }
        }
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
//        dx = dx * SortOrderTrain.level;
        /*
         * on the ipad the from frame.timeDiff is a little
         * slower, so let's make the dx more if it is.
         */
        dx = frame.timeDiff > 20 ? frame.timeDiff > 30 ? frame.timeDiff > 40 ? dx * 4 : dx * 3 : dx * 2 : dx;
        
        SortOrderTrain.moveTrain(dx);
    },
    
    moveTrain: function(/*int*/ dx) {
        var track = SortOrderTrain.track;
        SortOrderTrain.loco.x += dx;
        
        for (var i = 0; i < SortOrderTrain.cars.length; i++) {
            SortOrderTrain.cars[i].group.x += dx;               
            SortOrderTrain.outlns[i].group.x += dx; //move the outlines, too, for stop condition
        }
        SortOrderTrain.boxLayer.draw();
        
        if (track === 'track3' && SortOrderTrain.outlns[SortOrderTrain.outlns.length - 1].group.getChild('box').getAbsolutePosition().x + BOX_WIDTH < 0) {  
            if (console && console.log) console.log('stop condition for track3 met');
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
            if (console && console.log) console.log('stop condition for track2 met');
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
        } else if (track === 'track1' && SortOrderTrain.outlns[SortOrderTrain.outlns.length - 1].group.getChild('box').getAbsolutePosition().x + BOX_WIDTH < 0) {
            if (console && console.log) console.log('stop condition for track1 met');
            SortOrderTrain.stage.stop();
            
            SortOrderTrain.reInit();
        }
        
    },
    
    changeTrack: function() {
        var scaleX = 1;
        var scaleY = 1;
        if (SortOrderTrain.track === 'track2') {
            scaleY = 0.74;
            scaleX = -scaleY;
        } else if (SortOrderTrain.track === 'track1'){
            scaleY = 0.60;
            scaleX = scaleY;
        } 
        
        /*
         * Scaling them puts them on the correct track.
         * Using a negative x scale will invert (flip horizontally)! -- thanks to the forum for that one
         */
        SortOrderTrain.loco.scale.x = scaleX;
        SortOrderTrain.loco.scale.y = scaleY;

        for (var i = 0; i < SortOrderTrain.cars.length; i++) {
            SortOrderTrain.outlns[i].group.scale.x = scaleX;
            SortOrderTrain.outlns[i].group.scale.y = scaleY;
            
            SortOrderTrain.colorizeOutline(SortOrderTrain.outlns[i]);
            if (scaleX < 0) {
                /*
                 * Flip the text so it won't appear backward
                 */
                SortOrderTrain.outlns[i].group.getChild('text').scale.x = -1;
            } else {
                /*
                 * Set the text normally again
                 */
                SortOrderTrain.outlns[i].group.getChild('text').scale.x = 1;
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
          if (boxcar.value[0] === outline.value[0]) {
              
              var color = boxcar.group.getChild('box').fill;
              outline.colorize(color, outline.value[0]);
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
         * clear the box layer and remove all place holder outlines and box cars
         */
        SortOrderTrain.boxLayer.clear();
        SortOrderTrain.boxLayer.removeChildren();
        SortOrderTrain.initBoxLayer();
        SortOrderTrain.boxLayer.draw();
        
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