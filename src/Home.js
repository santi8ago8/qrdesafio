import React from 'react';

import _ from 'lodash';
import async from 'async';

async function delay(ms) {
    return new Promise((r) => {
        setTimeout(r, ms)
    })
}

function isEmpty(pixel) {
    let c = [pixel[0], pixel[1], pixel[2], pixel[3]];
    let ret = _.isEqual(c, [255, 255, 255, 255]) || _.isEqual(c, [0, 0, 0, 255]);
    return ret
}

function areEqualColor(a, b) {
    a = [a[0], a[1], a[2], a[3]];
    b = [b[0], b[1], b[2], b[3]];

    return _.isEqual(a, b);
}

function migrate(ctx, origin) {
    let id = ctx.createImageData(1, 1);
    let dest = id.data;
    dest[0] = origin[0];
    dest[1] = origin[1];
    dest[2] = origin[2];
    dest[3] = origin[3];
    return id
}

class Box {
    constructor(topLeft, topRight, botLeft, botRight, complete) {
        this.topLeft = topLeft;
        this.topRight = topRight;
        this.botLeft = botLeft;
        this.botRight = botRight;
        this.complete = complete;
        this.id = Math.random();
    }

    isFullColor() {
        return !isEmpty(this.botRight) && !isEmpty(this.topLeft) && !isEmpty(this.topRight) && !isEmpty(this.botLeft)

    }

    isTopLeft() {
        return (!isEmpty(this.botRight)) && isEmpty(this.topLeft) && isEmpty(this.topRight) && isEmpty(this.botLeft)
    }

    isLeft() {
        return isEmpty(this.topLeft) && isEmpty(this.botLeft)
    }

    isRight() {
        return isEmpty(this.topRight) && isEmpty(this.botRight)
    }

    isTop() {
        return isEmpty(this.topRight) && isEmpty(this.topLeft)
    }

    isBot() {
        return isEmpty(this.botRight) && isEmpty(this.botLeft)
    }

    isDownSibling(box) {
        return areEqualColor(this.botRight, box.topRight);
    }

    isDownSiblingLeftSide(box) {
        return areEqualColor(this.botRight, box.topRight) && isEmpty(box.topLeft) && isEmpty(box.botLeft);
    }

    drawDebug(ctx, x, y) {
        ctx.putImageData(migrate(ctx, this.topLeft), x, y);
        ctx.putImageData(migrate(ctx, this.topRight), x + 1, y);
        ctx.putImageData(migrate(ctx, this.botLeft), x, y + 1);
        ctx.putImageData(migrate(ctx, this.botRight), x + 1, y + 1);
    }

    isCompleteRounded(boxes) {
        let response = true;
        let count = 0
        if (this.finalX != undefined && this.finalY != undefined) {

            let conbs = [
                [-1, -1],
                [-1, 0],
                [-1, 1],
                [1, -1],
                [1, 0],
                [1, 1],
                [0, -1],
                [0, 1],
            ];

            //left
            conbs.forEach((a) => {
                let cc = {x: this.finalX + a[0], y: this.finalY + a[1]};
                let find = _.find(boxes, (b) => {
                    return cc.x == b.finalX && cc.y == b.finalY;
                });
                if (find) {
                    count++;
                }
            })
        }
        return count == 8;
    }

    findLeft(boxes) {
        let ret = [];
        _.forEach(boxes, (b) => {
            if (!this.isLeft() && areEqualColor(this.topLeft, b.topRight) && areEqualColor(this.botLeft, b.botRight)) {
                //es el potencial hermano, retornar.
                ret.push(b);
            }
        });
        ret.X = -1;
        ret.Y = 0;
        return ret;
    }

    findRight(boxes) {
        let ret = [];
        _.forEach(boxes, (b) => {
            if (!this.isRight() && areEqualColor(this.topRight, b.topLeft) && areEqualColor(this.botRight, b.botLeft)) {
                //es el potencial hermano, retornar.
                ret.push(b);
            }
        });
        ret.X = 1;
        ret.Y = 0;
        return ret;
    }

    findTop(boxes) {
        let ret = [];
        _.forEach(boxes, (b) => {
            if (!this.isTop() && areEqualColor(this.topLeft, b.botLeft) && areEqualColor(this.topRight, b.botRight)) {
                //es el potencial hermano, retornar.
                ret.push(b);
            }
        });
        ret.X = 0;
        ret.Y = -1;
        return ret;
    }

    findBot(boxes) {
        let ret = [];
        _.forEach(boxes, (b) => {
            if (!this.isBot() && areEqualColor(this.botLeft, b.topLeft) && areEqualColor(this.botRight, b.topRight)) {
                //es el potencial hermano, retornar.
                ret.push(b);
            }
        });
        ret.X = 0;
        ret.Y = 1;
        return ret;
    }

    findTopLeft(lefts, tops, boxes) {
        let keyColor = this.topLeft;
        let coincideKey = [];
        let ret = [];
        ret.X = -1
        ret.Y = -1
        _.forEach(boxes, (b) => {
            if (areEqualColor(keyColor, b.botRight)) {
                //es el potencial hermano, retornar.

                lefts.forEach((l) => {
                    tops.forEach((t) => {
                        if (areEqualColor(l.topLeft, b.botLeft) && areEqualColor(t.topLeft, b.topRight)) {
                            //console.log('si!')
                            ret.push(b);

                        }
                    })

                });

                coincideKey.push(b);
            }
        });
        return ret;
    }

    findBotLeft(lefts, bots, boxes) {
        let keyColor = this.botLeft;
        let coincideKey = [];
        let ret = [];
        ret.X = -1
        ret.Y = 1
        _.forEach(boxes, (b) => {
            if (areEqualColor(keyColor, b.topRight)) {
                //es el potencial hermano, retornar.

                lefts.forEach((l) => {
                    bots.forEach((bts) => {
                        if (areEqualColor(l.botLeft, b.topLeft) && areEqualColor(b.botRight, bts.botLeft)) {
                            //console.log('si!')
                            //ret = {left: l, bot: bts, botLeft: b};
                            ret.push(b)
                        }
                    })

                });

                coincideKey.push(b);
            }
        });
        return ret;
    }

    findTopRigth(rights, tops, boxes) {
        let keyColor = this.topRight;
        let coincideKey = [];
        let ret = [];
        ret.X = 1
        ret.Y = -1
        _.forEach(boxes, (b) => {
            if (areEqualColor(keyColor, b.botLeft)) {
                //es el potencial hermano, retornar.

                rights.forEach((r) => {
                    tops.forEach((t) => {
                        if (areEqualColor(r.topRight, b.botRight) && areEqualColor(t.topRight, b.topLeft)) {
                            //console.log('si!');
                            ret.push(b);
                            //ret = {right: r, top: t, topRight: b};
                        }
                    })

                });

                coincideKey.push(b);
            }
        });
        return ret;
    }


    findBotRight(rights, bots, boxes) {
        let keyColor = this.botRight;
        let coincideKey = [];
        let ret = [];
        ret.X = 1
        ret.Y = 1
        _.forEach(boxes, (b) => {
            if (areEqualColor(keyColor, b.topLeft)) {
                //es el potencial hermano, retornar.

                rights.forEach((r) => {
                    bots.forEach((bts) => {
                        if (areEqualColor(r.botRight, b.topRight) && areEqualColor(b.botLeft, bts.botRight)) {
                            //console.log('si!');
                            ret.push(b)
                        }
                    })

                });

                coincideKey.push(b);
            }
        });
        return ret;
    }


    isOneSealed() {
        return this.isSealedRight || this.isSealedLeft || this.isSealedTop || this.isSealedBot;
    }

    isAllSealed() {
        return this.isComplete;
    }

    findDown(arr, resp, depth) {

        if (depth >= 19) {
            return this;
        }
        let any = true;
        for (let i = 0; i < arr.length; i += 1) {
            const respElement = arr[i];
            if (respElement && this.isBotEq(respElement)) {
                //el //= respElement;
                let down = respElement.findDown(arr, resp, depth + 1);
                return down.findDown()
                if (any) {
                    resp.push(this);
                }
                return this;

            }
        }

    }

    isBotEq(sec) {
        return areEqualColor(this.botRight, sec.topRight) && !isEmpty(this.botRight);
    }

}

let nextStart;

class Home extends React.Component {
    render() {
        return (<div className="Home">
            <button onClick={this.startGame.bind(this)}>Start</button>
            <canvas id="canvas2" width="500" height="500"></canvas>
            <canvas id="canvas3" width="1100" height="1100"></canvas>

            <div style={{display: 'none'}}>
                <img src="challenge.png" id="image" alt={"t"}/>
                <canvas id="myc"></canvas>
            </div>
        </div>);
    }

    drawMatrix(m, ctx) {
        _.forEach(_.range(20), (i) => {
            _.forEach(_.range(20), (j) => {
                let b = m[i][j];
                if (b) {
                    ctx.putImageData(b.complete, i * 50, j * 50);
                }
            })
        });
    }

    drawBoxesSorteds(arr, ctx) {
        for (let i = 0; i < arr.length; i++) {
            const b = arr[i];
            if (b.finalX != undefined && b.finalY != undefined) {
                //console.log(b.finalX, b.finalY);
                ctx.putImageData(b.complete, b.finalX * 50, b.finalY * 50);
            }
        }
    }

    async startGame() {

        var img = document.querySelector('#image');
        var canvas = document.querySelector('#myc');
        var newCanvas = document.querySelector('#canvas2');
        var debugCanvas = document.querySelector('#canvas3');

        canvas.width = img.width;
        canvas.height = img.height;
        canvas.getContext('2d').drawImage(img, 0, 0, img.width, img.height);
        var context = newCanvas.getContext('2d');
        var contextDebug = debugCanvas.getContext('2d');

        let number = 50;
        let boxes = [];
        let boxes2 = [];
        for (let y = 1; y < 1000; y += number) {
            for (let x = 1; x < 1000; x += number) {


                var topLeft = canvas.getContext('2d').getImageData(x, y, 1, 1).data;
                var topRight = canvas.getContext('2d').getImageData(x + 45, y, 1, 1).data;
                var botLeft = canvas.getContext('2d').getImageData(x, y + 45, 1, 1).data;
                var botRight = canvas.getContext('2d').getImageData(x + 45, y + 45, 1, 1).data;

                var complete = canvas.getContext('2d').getImageData(x, y, 49, 49);
                let b = new Box(topLeft, topRight, botLeft, botRight, complete);
                boxes.push(b);
                boxes2.push(b);
                //b.drawDebug(contextDebug, x / 50, y / 50);

            }

        }


        //parte izquierda
        let matrix = [];
        _.forEach(_.range(20), (i) => {
            matrix.push(_.range(20));
        });
        let matrixRes = [];
        _.forEach(_.range(50), (i) => {
            matrixRes.push(_.range(50));
        });


        /*let i = 0;
        let j = 0;
        _.forEach(boxes, (b) => {
            if (b.isLeft()) {
                matrix[j++][0] = b;
                i += 50;
            }
        });
        this.drawMatrix(matrix, context);
        //buscar la primera
        _.forEach(_.range(20), (i) => {
            let b = matrix[i][0];
            if (b.isTopLeft()) { //lo tengo que poner en el primer lugar.
                let swap = matrix[0][0];
                matrix[0][0] = b;
                matrix[i][0] = swap
            }
        });
        this.drawMatrix(matrix, context);*/

        _.forEach(_.range(20), (i) => {
            _.forEach(_.range(20), (j) => {
                matrix[i][j] = null;
            })
        });


        //  nuevamenteo otra solución.

        let z = 0;

        boxes.forEach(function (b) {
            if (b.isLeft()) {
                matrix[0][z++] = b;
            }
        });

        //this.drawMatrix(matrix, context);
        //ordernar matrix[0]
        /* await delay(100);
         let toSort = matrix[0];
         z = 0;
         let first;
         toSort.forEach(function (b) {
             if (b.isTopLeft()) {
                 first = b;
                 var t = toSort[0];
                 toSort[0] = b;
                 toSort[z] = t
             }
             z++;
         });


         this.drawMatrix(matrix, context);

         let resp = [];
         first.findDown(toSort,resp,0)
         matrix[0]=resp;
         this.drawMatrix(matrix, context);

 */
        //voy por otra solucion recursiva, voy a agarrar uno y le voy a ir poniendo los hermanos al lado. luego voy moviendo la forma hasta que se centre
        let first = true;
        let areAllSealed = function () {
            let i = 0;
            _.forEach(boxes, (b) => {
                if (!b.isSealed && b.isFullColor()) {
                    i++;
                }
            })
            return i;
        };
        let getOneSealed = function () {
            if (first) {
                //buscar la punta
                return {cand: 400, pend: 400, obj: boxes2[6]}
            } else {
                let cand = [];
                let perd = [];
                _.forEach(boxes2, (box, i) => {
                    let allSealed = box.isAllSealed();
                    if (box.finalY != undefined && box.finalX != undefined) {
                        cand.push(box);
                    } else {
                        perd.push(box)
                    }
                });
                //console.log(cand.length, perd.length);
                return {
                    cand: cand.length,
                    pend: perd.length,
                    obj: _.sample(cand)
                };
            }
        };
        let i = 0;
        let j = 0;
        let pend = 0;
        while (j < 1) {
            while (i < 2500) {

                i++;
                /*
                 * Box
                */
                let deb = getOneSealed();
                let box = deb.obj;
                box.finalPos = true;
                //empiezo con los que tienen full color de todos lados porque me parece más simple, luego veo el costado.
                if (first) {
                    box.finalX = 1;
                    box.finalY = 4;
                    first = false;
                }

                let findLeft = box.findLeft(boxes2);
                let findRight = box.findRight(boxes2);
                let findTop = box.findTop(boxes2);
                let findBot = box.findBot(boxes2);
                let hermanos = _.concat([], findLeft, findRight, findTop, findBot);
                let findTopLeft = box.findTopLeft(findLeft, findTop, boxes2);
                let findBotLeft = box.findBotLeft(findLeft, findBot, boxes2);
                let findTopRigth = box.findTopRigth(findRight, findTop, boxes2);
                let findBotRight = box.findBotRight(findRight, findBot, boxes2);

                [findLeft, findRight, findTop, findBot, findTopLeft, findBotLeft, findTopRigth, findBotRight].forEach((a) => {


                    if (_.size(a) == 1) {
                        let el = _.first(a);
                        el.finalX = box.finalX + a.X;
                        el.finalY = box.finalY + a.Y;
                        el.finalPosition = true;
                    }
                });

                if (pend != deb.pend) {
                    this.drawBoxesSorteds(boxes, contextDebug);
                    pend = deb.pend;
                    await delay(0)

                }

                /*let {left, top, topLeft} = box.findTopLeft(findLeft, findTop, boxes);

                left.finalX = box.finalX - 1;
                left.finalY = box.finalY;
                left.isComplete = true;
                top.finalX = box.finalX;
                top.finalY = box.finalY - 1;
                top.isComplete = true;
                topLeft.finalX = box.finalX - 1;
                topLeft.finalY = box.finalY - 1;
                topLeft.isComplete = true;

                let {right, topRight} = box.findTopRigth(findRight, findTop, boxes);
                right.finalX = box.finalX + 1;
                right.finalY = box.finalY;
                right.isComplete = true;
                topRight.finalX = box.finalX + 1;
                topRight.finalY = box.finalY - 1;
                topRight.isComplete = true;

                let {botLeft, bot} = box.findBotLeft(findLeft, findBot, boxes);
                bot.finalX = box.finalX;
                bot.finalY = box.finalY + 1;
                bot.isComplete = true;
                /*botLeft.finalX = box.finalX - 1;
                botLeft.finalY = box.finalY + 1;
                botLeft.isComplete = true;

                let {botRight} = box.findBotRight(findRight, findBot, boxes);

                botRight.finalX = box.finalX + 1;
                botRight.finalY = box.finalY + 1;
                //botRight.isComplete = true;

                box.isComplete = true;*/
            }
            _.remove(boxes2, (b) => {
                return b.isCompleteRounded(boxes);
            });
            console.log(boxes2.length);
            j++

        }


        //cortar cuadrados y ponerlos.
        for (let x = 0; x < 1000; x += number) {
            for (let y = 0; y < 1000; y += number) {
                context.fillRect(10, 10, 5, 5);
                var complete = contextDebug.getImageData(x + 60, y + 60, 30, 30)
                //context.drawImage()
                context.putImageData(complete, x / 2, y / 2);


            }

        }

    }
}


export default Home;
