console.log("Starting. . . " + new Date());
const fullCircle = Math.PI * 2;
const canvas = document.querySelector("canvas");
const view = canvas.getContext("2d");
var rect = canvas.getBoundingClientRect();
resize();
view.fillStyle = "white";
view.strokeStyle = "white";
view.lineCap = "round";
addEventListener("resize", resize);
addEventListener("mousemove", mouseMove);
addEventListener("mousedown", mouseDown);
addEventListener("mouseup", mouseUp);
addEventListener("contextmenu", (e) => {
  e.preventDefault();
});
let pause = false;
let backMode = false;
let forwardMode = false;
let playMode = true;
addEventListener("keyup", keyUp);
addEventListener("keydown", keyDown);
function keyDown(e) {
  if (e.code == "KeyB") {
    backMode = true;
    playMode = false;
    pause = true;
  }
}
function keyUp(e) {
  console.log(e);
  if (e.code == "KeyP") {
    pause = !pause;
    if (!pause) playMode = true;
  }
  if (e.code == "KeyS") {
    forwardMode = true;
  }
  if (e.code == "KeyB") {
    backMode = false;
    //table.back();
    //requestAnimationFrame(drawTable);
  }
  if (e.code == "KeyG") {
    table.cushions.gap += 1;
    table.cushions.init();
  }
  if (e.code == "KeyF") {
    table.cushions.gap -= 1;
    table.cushions.init();
  }
  if (e.code == "KeyL") {
    table.cushions.length += 1;
    table.cushions.init();
  }
  if (e.code == "KeyK") {
    table.cushions.length -= 1;
    table.cushions.init();
  }
}
class GameSettings {
  drawGeometry = true;
  ballSize = 80;
  pocketSize = 35;
  cornerOffset = 24;
  sideOffset = 50;
}
const gameSettings = new GameSettings();
var cue = null;
var selectedBall = null;

function resize() {
  const oldHeight = canvas.height;
  const oldWidth = canvas.width;
  if (window.innerWidth < window.innerHeight * 2) {
    // maximize width then calculate height
    canvas.width = window.innerWidth; // * 0.9;
    canvas.height = canvas.width * 0.5;
  } else {
    // maximize the height then calculate width
    canvas.height = window.innerHeight;// * 0.9;
    canvas.width = canvas.height * 2;
  }

  const top = (window.innerHeight - canvas.height) * 0.5;
  const left = (window.innerWidth - canvas.width) * 0.5;
  canvas.style.top = Math.floor(top) + "px";
  canvas.style.left = Math.floor(left) + "px";
  rect = canvas.getBoundingClientRect();
  view.fillStyle = "white";
  view.strokeStyle = "white";

  table?.resize(oldWidth, oldHeight);

  console.log(`canvas resized: ${window.innerWidth} x ${window.innerHeight}`);
}
function mouseDown(e) {
  const x = e.x - rect.left;
  const y = e.y - rect.top;
  if (e.button == 0) {
    const ball = isPointInsideBall(x, y);
    if (ball) {
      ball.stop();
      if (ball.id === 15) {
        cue = new Cue(ball, x, y);
        cue.click();
      }
    }
  } else if (e.button == 2 && !selectedBall) {
    selectedBall = isPointInsideBall(x, y);
    selectedBall?.stop();
  }
}
function mouseMove(e) {
  const x = e.x - rect.left;
  const y = e.y - rect.top;

  if (cue) {
    cue.move(x, y);
  }
  if (selectedBall) {
    selectedBall.x = x;
    selectedBall.y = y;
  }
}
function mouseUp(e) {
  if (cue) {
    cue.click();
  }

  //cue = null;
  selectedBall = null;
}
function isPointOnBouncer(x, y) {
  return table.bouncer.isOnEndPoint(x, y);
}
function isPointInsideBall(x, y) {
  for (const ball of table.balls.balls)
    if ((x - ball.x) ** 2 + (y - ball.y) ** 2 < ball.radiusSq) return ball;
  return null;
}
function interceptPoint(p1, p2, p3, p4) {
  // calculate x,y point where 2 lines cross, each line defined by 2 points
  if (p1.x === p2.x && p3.x === p4.x) {
    // lines are parallel - no intercept
    return null;
  }
  if (p1.x === p2.x) {
    // solve for when bounce line is vertical
    const m = (p4.y - p3.y) / (p4.x - p3.x);
    const c = p3.y - m * p3.x;
    const y = m * p1.x + c;
    return { x: p1.x, y };
  }

  if (p3.x === p4.x) {
    // solve for when ball direction is vertical
    const m = (p2.y - p1.y) / (p2.x - p1.x);
    const c = p1.y - m * p1.x;
    const y = m * p3.x + c;
    return { x: p3.x, y };
  }

  const m1 = (p2.y - p1.y) / (p2.x - p1.x);
  const b1 = p1.y - m1 * p1.x;

  const m2 = (p4.y - p3.y) / (p4.x - p3.x);
  const b2 = p3.y - m2 * p3.x;

  if (m1 === m2) return null;

  const x = (b2 - b1) / (m1 - m2);
  const y = m1 * x + b1;

  return { x, y };
}
class Snippet {
  constructor(fileName, size) {
    for (let i = 0; i < size; ++i) this.sound.push(Snippet.audio(fileName));
  }
  static sounds = [];
  static audio(src) {
    const a = new Audio(src);
    Snippet.sounds.push(a);
    return a;
  }
  sound = [];
  count = 0;
  play() {
    this.sound[++this.count % this.sound.length].play();
  }
}
class Sound {
  static CueHitBall = new Snippet("assets/cuehitball.wav", 1);
  static BallHitBall = new Snippet("assets/ballhitball.wav", 12);
  static BallInPocket = new Snippet("assets/ballinpocket.wav", 3);
  static BallHitCushion = new Snippet("assets/ballhitcushion.wav", 4);
  static BallHitCorner = new Snippet("assets/ballhitcorner.wav", 3);
}
class Cue {
  static NoMode = 0;
  static AngleMode = 1;
  static ShotMode = 2;
  constructor(ball, x, y) {
    this.startX = x;
    this.startY = y;
    this.endX = ball.x;
    this.endY = ball.y;
    this.ball = ball;
    this.mode = Cue.NoMode;
  }
  draw() {
    if (this.mode === Cue.AngleMode) {
      view.beginPath();
      view.fillStyle = "rgba(255, 255, 255, 0.5)";
      view.arc(
        this.startX,
        this.startY,
        this.ball.radius,
        0,
        fullCircle,
        false
      );
      view.fill();
      view.moveTo(this.startX, this.startY);
      view.lineTo(this.endX, this.endY);
      view.stroke();
    } else if (this.mode === Cue.ShotMode) {
      this.cueLength = canvas.width / 3;
      view.lineWidth = canvas.width / 150;

      const tip = { x: this.tipX, y: this.tipY };
      const collar = this.getCueSection(0.01);
      const shaft = this.getCueSection(0.05);
      const handle = this.getCueSection(0.65);
      const base = this.getCueSection(0.97);
      const bumper = this.getCueSection(1);

      this.drawCueSection(tip, collar, "deepskyblue");
      this.drawCueSection(collar, shaft, "white");
      this.drawCueSection(shaft, handle, "wheat");
      this.drawCueSection(base, bumper, "black");
      view.lineCap = "square";
      this.drawCueSection(handle, base, "maroon");
      view.lineCap = "round";

      view.lineWidth = 2;
      view.strokeStyle = "black";
    }
  }
  getCueSection(length) {
    return {
      x: this.tipX + this.unitVector.x * this.cueLength * length,
      y: this.tipY + this.unitVector.y * this.cueLength * length,
    };
  }
  drawCueSection(from, to, colour) {
    view.beginPath();
    view.strokeStyle = colour;
    view.moveTo(from.x, from.y);
    view.lineTo(to.x, to.y);
    view.stroke();
  }
  move(x, y) {
    if (this.mode === Cue.AngleMode) {
      this.startX = x;
      this.startY = y;
    } else if (this.mode === Cue.ShotMode) {
      this.oldY = this.startY;
      this.startY = y;
      let speed = this.oldY - this.startY;
      if (speed > 60) speed = 60;
      this.swing = y - this.baseY;

      // calculate if cue tip has hit cue ball
      this.tipX = this.hitX + this.unitVector.x * this.swing * 1.5;
      this.tipY = this.hitY + this.unitVector.y * this.swing * 1.5;

      // calculate cueVector (unit vector of hitPoint to cue tip)
      const dx = this.hitX - this.tipX;
      const dy = this.hitY - this.tipY;
      const dist = Math.sqrt(dx ** 2 + dy ** 2);
      this.cueVector = { x: dx / dist, y: dy / dist };

      // calculate dot product of hitVector and cueVector
      const dp =
        this.hitVector.x * this.cueVector.x +
        this.hitVector.y * this.cueVector.y;

      if (dp > 0) {
        Sound.CueHitBall.play();
        this.ball.dx = -this.unitVector.x * speed;
        this.ball.dy = -this.unitVector.y * speed;
        this.ball.stopped = false;
        this.click();
      }
    }
  }
  click() {
    table.clearHistory();
    this.mode += 1;
    if (this.mode === Cue.ShotMode) {
      // calculate unit vector of cue
      const dx = this.endX - this.startX;
      const dy = this.endY - this.startY;
      const length = Math.sqrt(dx ** 2 + dy ** 2);
      this.unitVector = { x: dx / length, y: dy / length };
      //console.log(this.unitVector);
      this.hitX = this.ball.x + this.unitVector.x * this.ball.radius;
      this.hitY = this.ball.y + this.unitVector.y * this.ball.radius;
      this.oldY = this.startY;
      this.baseY = this.startY - this.ball.radius * 1.5;

      // calculate hitVector (unit vector the ball will move in when hit)
      this.hitVector = {
        x: (this.hitX - this.ball.x) / this.ball.radius,
        y: (this.hitY - this.ball.y) / this.ball.radius,
      };
    }
    if (this.mode > Cue.ShotMode) this.mode = Cue.NoMode;
  }
}
class Bouncer {
  static idc = 0;
  constructor(line) {
    this.p1 = line.p1;
    this.p2 = line.p2;
    this.id = Bouncer.idc++;
    this.init();
  }
  init() {
    this.dx = this.p2.x - this.p1.x;
    this.dy = this.p2.y - this.p1.y;
    this.midPoint = {
      x: (this.p1.x + this.p2.x) / 2,
      y: (this.p1.y + this.p2.y) / 2,
    };
    this.length = Math.sqrt(this.dx ** 2 + this.dy ** 2);
    this.unitVector = { x: this.dx / this.length, y: this.dy / this.length };
    this.normalVector = { x: this.unitVector.y, y: -this.unitVector.x };
  }
  isOnEndPoint(x, y) {
    const dist1 = Math.sqrt((this.p1.x - x) ** 2 + (this.p1.y - y) ** 2);
    if (dist1 < 25) return this.p1;
    const dist2 = Math.sqrt((this.p2.x - x) ** 2 + (this.p2.y - y) ** 2);
    if (dist2 < 25) return this.p2;
    return false;
  }
  bounce(ball) {
    let isBounced = false;
    // calculate unit vector of ball's direction
    const dist = Math.sqrt(ball.dx ** 2 + ball.dy ** 2);
    const ballUnitVector = { x: ball.dx / dist, y: ball.dy / dist };
    const newx = ball.x + ball.dx;
    const newy = ball.y + ball.dy;

    // calculate dot product to see if ball CAN bounce off cushion
    // (depends on ball's direction of travel and angle of cushion)
    // ((is the ball travelling towards or away from the cushion?))
    const dp =
      ballUnitVector.x * this.normalVector.x +
      ballUnitVector.y * this.normalVector.y;
    if (dp > 0) {
      // CAN bounce

      // calculate 2 hit points (current/prev and new/next) of ball for this bouncer (depends on angle of bounce line)
      this.prevBallHitPoint = {
        x: ball.x + this.normalVector.x * ball.radius,
        y: ball.y + this.normalVector.y * ball.radius,
      };

      this.ballHitPoint = {
        x: newx + this.normalVector.x * ball.radius,
        y: newy + this.normalVector.y * ball.radius,
      };

      // test if ball's hit point has crossed bounce line by comparing vector
      // of midpoint to hit point and bouncer's normal
      // calculate unit vector of hitVector (mid point -> ball's hit point)
      // any point on the bounce line would do but midpoint is convenient
      const dxMidPointToBallHitPoint = this.midPoint.x - this.ballHitPoint.x;
      const dyMidPointToBallHitPoint = this.midPoint.y - this.ballHitPoint.y;
      const distHitVector = Math.sqrt(
        dxMidPointToBallHitPoint ** 2 + dyMidPointToBallHitPoint ** 2
      );
      this.hitVector = {
        x: dxMidPointToBallHitPoint / distHitVector,
        y: dyMidPointToBallHitPoint / distHitVector,
      };

      // calculate dot product of bouncer's normal vector and hit vector to
      // see if hitpoint of ball's new position will cross bounce line
      this.dpHitVector =
        this.normalVector.x * this.hitVector.x +
        this.normalVector.y * this.hitVector.y;

      if (this.dpHitVector < 0) {
        // the ball's new position has (would have) crossed the (infinite) bounce line
        // calculate if the hit point crossed the (infinite) bounce line between p1 and p2
        // by calculating the dot product of the current position's hit vector
        const dxMidToCurrentBallHitPoint =
          this.midPoint.x - this.prevBallHitPoint.x;
        const dyMidToCurrentBallHitPoint =
          this.midPoint.y - this.prevBallHitPoint.y;
        const distCurrentHitVector = Math.sqrt(
          dxMidToCurrentBallHitPoint ** 2 + dyMidToCurrentBallHitPoint ** 2
        );
        const currentHitVector = {
          x: dxMidToCurrentBallHitPoint / distCurrentHitVector,
          y: dyMidToCurrentBallHitPoint / distCurrentHitVector,
        };
        const dpCurrentHitVector =
          this.normalVector.x * currentHitVector.x +
          this.normalVector.y * currentHitVector.y;

        // and comparing it with the next hit vector's dot product
        //if they are different signs the line was crossed on this update
        if (dpCurrentHitVector > 0) {
          // the line was crossed, but was it crossed between p1 and p2?
          const intercept = interceptPoint(
            this.p1,
            this.p2,
            this.prevBallHitPoint,
            this.ballHitPoint
          );
          if (intercept) {
            // try alternate method of testing if point in rectangle (using DPs)
            const interceptVector = {
              x: intercept.x - this.p1.x,
              y: intercept.y - this.p1.y,
            };
            const sideVectorH = { x: this.p2.x - this.p1.x, y: 0 };
            const sideVectorV = { x: 0, y: this.p2.y - this.p1.y };

            // project side vectors against themselves to find extent of rectangle
            const dpH2 = dotProduct(sideVectorH, sideVectorH);
            const dpV2 = dotProduct(sideVectorV, sideVectorV);

            // project interceptVector onto sideVectorH
            const dpH = dotProduct(interceptVector, sideVectorH);
            const dpV = dotProduct(interceptVector, sideVectorV);

            const isInside1 =
              dpH >= 0 && dpH <= dpH2 && dpV >= 0 && dpV <= dpV2;

            // standard method of testing if point in rectangle
            const xmin = Math.min(this.p1.x, this.p2.x);
            const ymin = Math.min(this.p1.y, this.p2.y);
            const xmax = Math.max(this.p1.x, this.p2.x);
            const ymax = Math.max(this.p1.y, this.p2.y);
            const isInside2 =
              intercept.x >= xmin &&
              intercept.x <= xmax &&
              intercept.y >= ymin &&
              intercept.y <= ymax;

            if (isInside1 !== isInside2) {
              console.log("DISAGREE!!!!");
            } else {
              console.log("AGREE!!!!");
            }

            if (isInside1) {
              // first move the ball so it remains inside the play area but just touching the intercept point
              const newVector = {
                x: this.prevBallHitPoint.x - intercept.x,
                y: this.prevBallHitPoint.y - intercept.y,
              };
              ball.x += newVector.x;
              ball.y += newVector.y;

              //console.log("BOUNCE!!");
              isBounced = true;
              this.bounced = true;

              Sound.BallHitCushion.play();
              const ballVector = { x: ball.dx, y: ball.dy };

              const distParWall = dotProduct(ballVector, this.unitVector);
              const distPerpWall = -dotProduct(ballVector, this.normalVector);

              const vx = distParWall;
              const vy = distPerpWall;

              const mathVector = {
                x: this.normalVector.x * vy,
                y: this.normalVector.y * vy,
              };
              const bounceVector = {
                x: this.unitVector.x * vx + mathVector.x,
                y: this.unitVector.y * vx + mathVector.y,
              };

              // const newdx =
              //   distParWall * this.normalVector.y +
              //   distPerpWall * this.normalVector.x;
              // const newdy =
              //   distParWall * this.normalVector.x +
              //   distPerpWall * this.normalVector.y;

              ball.dx = bounceVector.x; // * dist;
              ball.dy = bounceVector.y; // * dist;
            }
          }
        }
      }
      // if (!isBounced) {
      //   // ball has not bounced off bouncer so check endpoints of bounce line to check for edge case
      //   const distP1 = (newx - this.p1.x) ** 2 + (newy - this.p1.y) ** 2;
      //   const distP2 = (newx - this.p2.x) ** 2 + (newy - this.p2.y) ** 2;
      //   const dist2 = ball.radiusSq;
      //   if (distP1 < dist2) {
      //     isBounced = true;
      //     console.log("CORNER");
      //     const temp = ball.dx;
      //     ball.dx = ball.dy;
      //     ball.dy = temp;
      //     if (ball.dx * ball.dy > 0) {
      //       ball.dx *= -1;
      //       ball.dy *= -1;
      //     }
      //   }
      //   if (distP2 < dist2) {
      //     isBounced = true;
      //     console.log("CORNER");
      //     const temp = ball.dx;
      //     ball.dx = ball.dy;
      //     ball.dy = temp;
      //     if (ball.dx * ball.dy > 0) {
      //       ball.dx *= -1;
      //       ball.dy *= -1;
      //     }
      //   }
      // }
    } else {
      // ball is travelling away from the bouncer
      this.ballHitPoint = null;
    }
    return isBounced;
  }
  draw() {
    view.beginPath();
    view.moveTo(this.p1.x, this.p1.y);
    view.lineTo(this.p2.x, this.p2.y);
    view.stroke();
    view.beginPath();
    view.strokeStyle = "red";
    view.moveTo(this.midPoint.x, this.midPoint.y);
    view.lineTo(
      this.midPoint.x + this.normalVector.x * this.length * 0.05,
      this.midPoint.y + this.normalVector.y * this.length * 0.05
    );
    view.stroke();
    view.strokeStyle = "black";

    const x = this.midPoint.x + this.normalVector.x * this.length * 0.08;
    const y = this.midPoint.y + this.normalVector.y * this.length * 0.08;
    this.text2({ x, y });

    // if (this.ballHitPoint) {
    //   this.circle(this.ballHitPoint);
    //   if (this.hitVector) {
    //     this.line("yellow");
    //     //if (this.dpHitVector) this.text();
    //   }
    // }
  }
  text() {
    view.beginPath();
    view.font = "12px Arial";
    view.fillText(this.dpHitVector.toFixed(3), this.ball.x, this.ball.y);
    view.stroke();
  }
  line(col = "yellow") {
    const oldStrokeStyle = view.strokeStyle;
    view.beginPath();
    view.strokeStyle = col;
    view.moveTo(this.ballHitPoint.x, this.ballHitPoint.y);
    view.lineTo(
      this.ballHitPoint.x + this.hitVector.x * 50,
      this.ballHitPoint.y + this.hitVector.y * 50
    );
    view.stroke();

    const x = this.ballHitPoint.x + this.hitVector.x * 60;
    const y = this.ballHitPoint.y + this.hitVector.y * 60;
    this.text2({ x, y });

    view.strokeStyle = oldStrokeStyle;
  }
  circle(point, col = "blue") {
    // const oldFillStyle = view.fillStyle;
    // view.beginPath();
    // view.fillStyle = col;
    // if (this.bounced) view.fillStyle = "red";
    // view.arc(point.x, point.y, 6, 0, fullCircle, false);
    // view.stroke();
    // view.fillStyle = oldFillStyle;
    //this.text2(point);
  }
  text2(point) {
    view.beginPath();
    view.font = "11px Arial";
    view.textAlign = "center";
    view.textBaseline = "middle";
    let str = this.id.toString();
    //if (this.dpHitVector) str += "   DP: " + this.dpHitVector.toFixed(3);
    view.fillText(str, point.x, point.y);
    view.stroke();
  }
}
class Corner {
  constructor(b1, b2) {
    if (b1.p1.x === b2.p1.x && b1.p1.y === b2.p1.y) {
      this.x = b1.p1.x;
      this.y = b1.p1.y;
    }
    if (b1.p1.x === b2.p2.x && b1.p1.y === b2.p2.y) {
      this.x = b1.p1.x;
      this.y = b1.p1.y;
    }
    if (b1.p2.x === b2.p1.x && b1.p2.y === b2.p1.y) {
      this.x = b1.p2.x;
      this.y = b1.p2.y;
    }
    if (b1.p2.x === b2.p2.x && b1.p2.y === b2.p2.y) {
      this.x = b1.p2.x;
      this.y = b1.p2.y;
    }
    const x = b1.normalVector.x + b2.normalVector.x;
    const y = b1.normalVector.y + b2.normalVector.y;
    const dist = Math.sqrt(x ** 2 + y ** 2);
    this.normalVector = { x: x / dist, y: y / dist };
    this.unitVector = { x: this.normalVector.y, y: -this.normalVector.x };
    this.unitVector2 = { x: -this.normalVector.y, y: this.normalVector.x };
    this.normalLength = canvas.height / 40;
    this.color = "yellow";
    this.hitColor = "red";
    this.hitCounter = 0;
  }
  bounce(ball) {
    if (this.hitCounter > 0) this.hitCounter -= 1;
    if (ball.active && !ball.stopped) {
      const newBall = { x: ball.x + ball.dx, y: ball.y + ball.dy };
      const dx = newBall.x - this.x;
      const dy = newBall.y - this.y;
      const dSq = dx ** 2 + dy ** 2;
      if (dSq <= ball.radiusSq) {
        // the corner's point will 'move' inside (or is touching) the ball
        console.log("CORNER");
        Sound.BallHitCorner.play();
        this.hitCounter = 60;

        // TODO: (optional) move the ball to the exact point in contact with cushion before bounce
        // new ball position (centre) should be along the ball's line of travel (x,y -> dx,dy)
        // calculate new ball pos (x,y) where ball circumference touches this corner's point (x,y)

        // work out slope and intercept of ball's line of motion
        const p1 = { x: ball.x, y: ball.y };
        const p2 = { x: ball.x + ball.dx, y: ball.y + ball.dy };
        const enabled = false;
        if (enabled && Math.abs(p2.x - p1.x) > 0.0001) {
          console.log("Reposition");
          const m = (p2.y - p1.y) / (p2.x - p1.x); // problem if p2.x == p1.x
          const i = p1.y - m * p1.x;

          const A = this.x;
          const B = -m;
          const C = this.y - i;
          const D = ball.radiusSq;

          // calculate factors for the quadratic equation
          const a = B ** 2 + 1;
          const b = -2 * A + 2 * B * C;
          const c = A ** 2 + C ** 2 - D;

          // solve x for both ontercept points
          const sr = Math.sqrt(b ** 2 - 4 * a * c);
          const x1 = (-b + sr) / (2 * a);
          const x2 = (-b - sr) / (2 * a);

          // work out the distances to both intercept points
          const y1 = m * x1 + i;
          const y2 = m * x2 + i;

          const dx1 = x1 - p1.x;
          const dy1 = y1 - p1.y;
          const d1Sq = dx1 ** 2 + dy1 ** 2;

          const dx2 = x2 - p1.x;
          const dy2 = y2 - p1.y;
          const d2Sq = dx2 ** 2 + dy2 ** 2;

          // set the ball's position to the nearest of the 2 intercept points
          if (d1Sq < d2Sq) {
            ball.x = x1;
            ball.y = y1;
          } else {
            ball.x = x2;
            ball.y = y2;
          }
        }

        // bounce the ball off the corner by setting the new direction of ball (dx,dy)
        const ballVector = { x: ball.dx, y: ball.dy };
        const dpUnitVector = dotProduct(ballVector, this.unitVector);
        const dpNormalVector = -dotProduct(ballVector, this.normalVector);

        const bounceVector = {
          x:
            this.unitVector.x * dpUnitVector +
            this.normalVector.x * dpNormalVector,
          y:
            this.unitVector.y * dpUnitVector +
            this.normalVector.y * dpNormalVector,
        };

        ball.dx = bounceVector.x;
        ball.dy = bounceVector.y;
        return true;
      }
    }
    return false;
  }
  draw() {
    const oldStyle = view.strokeStyle;
    if (this.hitCounter > 0) view.strokeStyle = this.hitColor;
    else view.strokeStyle = this.color;
    view.beginPath();
    view.moveTo(
      this.x + this.normalVector.x * this.normalLength,
      this.y + this.normalVector.y * this.normalLength
    );
    view.lineTo(this.x, this.y);
    view.lineTo(
      this.x + this.unitVector.x * this.normalLength * 2,
      this.y + this.unitVector.y * this.normalLength * 2
    );
    view.stroke();
    view.beginPath();
    view.strokeStyle = "blue";
    view.moveTo(this.x, this.y);
    view.lineTo(
      this.x + this.unitVector2.x * this.normalLength * 2,
      this.y + this.unitVector2.y * this.normalLength * 2
    );
    view.stroke();
    view.strokeStyle = oldStyle;
  }
}
class Cushions {
  // constructor(gap, width, length) {
  //   this.gap = canvas.height * gap;
  //   this.width = canvas.height * width;
  //   this.length = canvas.height * length;
  //   this.init2();
  // }
  static cornerThroat = 0.04;
  static cornerMouth = 0.19;
  static sideThroat = 0.03;
  static sideMouth = 0.07;
  static width = 0.105;
  constructor() {
    this.init2();
  }
  init2() {
    this.bouncers = [];
    this.lines = [];
    this.corners = [];

    const top = 0;
    const left = 0;
    const right = canvas.width;
    const bottom = canvas.height;
    const scale = canvas.height;
    const unit = canvas.height;
    const width = Math.floor(Cushions.width * scale);
    const cornerThroat = Math.floor(Cushions.cornerThroat * scale);
    const cornerMouth = Math.floor(Cushions.cornerMouth * scale);
    const sideThroat = Math.floor(Cushions.sideThroat * scale);
    const sideMouth = Math.floor(Cushions.sideMouth * scale);

    // Points

    // NW Top left
    const p01 = { x: cornerThroat, y: top };
    const p02 = { x: cornerMouth, y: width };
    const p03 = { x: unit - sideMouth, y: width };
    const p04 = { x: unit - sideThroat, y: top };

    // W Left
    const p05 = { x: left, y: top + cornerThroat };
    const p06 = { x: left + width, y: top + cornerMouth };
    const p07 = { x: left + width, y: bottom - cornerMouth };
    const p08 = { x: left, y: bottom - cornerThroat };

    // SW Bottom left
    const p09 = { x: p01.x, y: unit };
    const p10 = { x: p02.x, y: unit - p02.y };
    const p11 = { x: p03.x, y: unit - p03.y };
    const p12 = { x: p04.x, y: unit - p04.y };

    // NE Top right
    const p13 = { x: unit + sideThroat, y: top };
    const p14 = { x: unit + sideMouth, y: width };
    const p15 = { x: right - cornerMouth, y: width };
    const p16 = { x: right - cornerThroat, y: top };

    // E Right
    const p17 = { x: right, y: top + cornerThroat };
    const p18 = { x: right - width, y: top + cornerMouth };
    const p19 = { x: right - width, y: bottom - cornerMouth };
    const p20 = { x: right, y: bottom - cornerThroat };

    //SE Bottom right
    const p21 = { x: right - cornerThroat, y: bottom };
    const p22 = { x: right - cornerMouth, y: bottom - width };
    const p23 = { x: unit + sideMouth, y: bottom - width };
    const p24 = { x: unit + sideThroat, y: bottom };

    // Lines/Bouncers

    // NW Top left
    const b1 = new Bouncer({ p1: p01, p2: p02 });
    const b2 = new Bouncer({ p1: p02, p2: p03 });
    const b3 = new Bouncer({ p1: p03, p2: p04 });
    this.bouncers.push(b1);
    this.bouncers.push(b2);
    this.bouncers.push(b3);

    this.corners.push(new Corner(b1, b2));
    this.corners.push(new Corner(b2, b3));

    // W Left
    const b4 = new Bouncer({ p1: p06, p2: p05 });
    const b5 = new Bouncer({ p1: p07, p2: p06 });
    const b6 = new Bouncer({ p1: p08, p2: p07 });
    this.bouncers.push(b4);
    this.bouncers.push(b5);
    this.bouncers.push(b6);

    this.corners.push(new Corner(b4, b5));
    this.corners.push(new Corner(b5, b6));

    // se Bottom left
    const b7 = new Bouncer({ p1: p10, p2: p09 });
    const b8 = new Bouncer({ p1: p11, p2: p10 });
    const b9 = new Bouncer({ p1: p12, p2: p11 });
    this.bouncers.push(b7);
    this.bouncers.push(b8);
    this.bouncers.push(b9);

    this.corners.push(new Corner(b7, b8));
    this.corners.push(new Corner(b8, b9));

    // NE  Top right
    const b10 = new Bouncer({ p1: p13, p2: p14 });
    const b11 = new Bouncer({ p1: p14, p2: p15 });
    const b12 = new Bouncer({ p1: p15, p2: p16 });
    this.bouncers.push(b10);
    this.bouncers.push(b11);
    this.bouncers.push(b12);

    this.corners.push(new Corner(b10, b11));
    this.corners.push(new Corner(b11, b12));

    // E Right
    const b13 = new Bouncer({ p1: p17, p2: p18 });
    const b14 = new Bouncer({ p1: p18, p2: p19 });
    const b15 = new Bouncer({ p1: p19, p2: p20 });
    this.bouncers.push(b13);
    this.bouncers.push(b14);
    this.bouncers.push(b15);

    this.corners.push(new Corner(b13, b14));
    this.corners.push(new Corner(b14, b15));

    // Bottom right
    const b16 = new Bouncer({ p1: p21, p2: p22 });
    const b17 = new Bouncer({ p1: p22, p2: p23 });
    const b18 = new Bouncer({ p1: p23, p2: p24 });
    this.bouncers.push(b16);
    this.bouncers.push(b17);
    this.bouncers.push(b18);

    this.corners.push(new Corner(b16, b17));
    this.corners.push(new Corner(b17, b18));
  }
  init() {
    this.bouncers = [];
    this.lines = [];
    const offset = this.length / 18;

    const x0 = 0;
    const x1 = this.gap;
    const x2 = this.gap * 2;
    const x3 = this.gap + this.length;
    const x4 = canvas.width - x3;
    const x5 = canvas.width - x2;
    const x6 = canvas.width - x1;
    const x7 = canvas.width;

    const y1 = this.gap;
    const y2 = this.gap * 2;
    const y3 = canvas.height - y2;
    const y4 = canvas.height - y1;
    const y5 = canvas.height;

    this.lines.push({ p1: { x: x1, y: 0 }, p2: { x: x2, y: y1 } }); // L1
    this.lines.push({ p1: { x: x1, y: y2 }, p2: { x: 0, y: y1 } }); // L18

    this.lines.push({ p1: { x: x2, y: y1 }, p2: { x: x3, y: y1 } }); // L2
    this.lines.push({ p1: { x: x4, y: y1 }, p2: { x: x5, y: y1 } }); // L5
    this.lines.push({ p1: { x: x6, y: y2 }, p2: { x: x6, y: y3 } }); // L8
    this.lines.push({ p1: { x: x5, y: y4 }, p2: { x: x4, y: y4 } }); // L11
    this.lines.push({ p1: { x: x3, y: y4 }, p2: { x: x2, y: y4 } }); // L14
    this.lines.push({ p1: { x: x1, y: y3 }, p2: { x: x1, y: y2 } }); // L17

    this.lines.push({ p1: { x: x3, y: y1 }, p2: { x: x3 + offset, y: 0 } }); // L3
    this.lines.push({ p1: { x: x4 - offset, y: 0 }, p2: { x: x4, y: y1 } }); // L4
    this.lines.push({ p1: { x: x5, y: y1 }, p2: { x: x6, y: 0 } }); // L6
    this.lines.push({ p1: { x: x7, y: y1 }, p2: { x: x6, y: y2 } }); // L7
    this.lines.push({ p1: { x: x6, y: y3 }, p2: { x: x7, y: y4 } }); // L9
    this.lines.push({ p1: { x: x6, y: y5 }, p2: { x: x5, y: y4 } }); // L10
    this.lines.push({ p1: { x: x4, y: y4 }, p2: { x: x4 - offset, y: y5 } }); // L12
    this.lines.push({ p1: { x: x3 + offset, y: y5 }, p2: { x: x3, y: y4 } }); // L13
    this.lines.push({ p1: { x: x2, y: y4 }, p2: { x: x1, y: y5 } }); // L15
    this.lines.push({ p1: { x: 2, y: y4 }, p2: { x: x1, y: y3 } }); // L16

    for (const line of this.lines)
      this.bouncers.push(new Bouncer(line.p1, line.p2));
  }
  bounce(ball) {
    let bounced = false;
    for (const bouncer of this.bouncers)
      if (bouncer.bounce(ball)) {
        bounced = true;
        break;
      }
    if (!bounced)
      for (const corner of this.corners) if (corner.bounce(ball)) break;
  }
  draw() {
    // view.strokeStyle = "white";
    // for (const line of this.lines) {
    //   view.beginPath();
    //   view.moveTo(line.p1.x, line.p1.y);
    //   view.lineTo(line.p2.x, line.p2.y);
    //   view.stroke();
    // }
    // view.strokeStyle = "black";

    //for (line of this.lines) line.draw();
    for (const bouncer of this.bouncers) bouncer.draw();
    for (const corner of this.corners) corner.draw();
  }
}
class Cushion {
  constructor(x, y, dx, dy, length) {
    this.c1 = { x, y };
    this.c2 = { x: x + dx * length, y };
    this.c3 = { x, y: y + dy * length };
    this.midPoint = {
      x: (this.c3.x + this.c2.x) / 2,
      y: (this.c3.y + this.c2.y) / 2,
    };
    const dist = Math.sqrt(
      (this.midPoint.x - this.c1.x) ** 2 + (this.midPoint.y - this.c1.y) ** 2
    );
    this.unitVector = {
      x: (this.c1.x - this.midPoint.x) / dist,
      y: (this.c1.y - this.midPoint.y) / dist,
    };
    console.log("Cushion unit vector:");
    console.log(this.unitVector);

    this.normalVector = { x: -this.unitVector.y, y: this.unitVector.x };
  }
  draw() {
    view.beginPath();
    view.moveTo(this.c1.x, this.c1.y);
    view.lineTo(this.c2.x, this.c2.y);
    view.lineTo(this.c3.x, this.c3.y);
    view.closePath();
    view.stroke();

    if (this.hitPoint) this.circle(this.hitPoint);
    if (this.intercept) this.circle(this.intercept, "red");
  }
  bounce(ball) {
    // calculate unit vector of ball's direction
    const dist = Math.sqrt(ball.dx ** 2 + ball.dy ** 2);
    const unitVector = { x: ball.dx / dist, y: ball.dy / dist };

    // calculate dot product to see if ball CAN bounce off cushion
    const dp =
      unitVector.x * this.unitVector.x + unitVector.y * this.unitVector.y;
    if (dp > 0) {
      // CAN bounce
      //console.log("Ball CAN bounce off cushion");

      // calculate ball's hit point
      const hitX = ball.x + ball.radius * this.unitVector.x;
      const hitY = ball.y + ball.radius * this.unitVector.y;
      this.hitPoint = { x: hitX, y: hitY };

      // calculate if hit point has crossed cushion's bounce line

      // caculate hitVector: vector of hitPoint to midPoint
      const hitVector = {
        x: this.midPoint.x - this.hitPoint.x,
        y: this.midPoint.y - this.hitPoint.y,
      };

      // compare cushion's unit vector with hitVector
      // calculate hitDp: dot product of cushion's unit vector and hit vector
      const hitDp =
        this.unitVector.x * hitVector.x + this.unitVector.y * hitVector.y;

      // if hitDp aligns with cushion's unit vector then the line is crossed
      if (hitDp < 0) {
        console.log("Line crossed");

        // test to see if line crossed within the cushion's area
        // cushion's line is: c2 -> c3
        console.log("c2: " + this.c2.x + "," + this.c2.y);
        console.log("c3: " + this.c3.x + "," + this.c3.y);
        // ball's line is x,y -> x+dx, y+dy
        // calc slopes
        const cm = (this.c3.y - this.c2.y) / (this.c3.x - this.c2.x);
        console.log("cm: " + cm);
        const bm = ball.dy / ball.dx;
        console.log("bm: " + bm);

        if (Math.abs(cm - bm) > 0.0001) {
          // if lines are NOT parallel calc y intercepts
          const b1 = this.c3.y - cm * this.c3.x;
          const b2 = this.hitPoint.y - bm * this.hitPoint.x;

          const ix = (b2 - b1) / (cm - bm);
          const iy = cm * ix + b1;

          this.intercept = { x: ix, y: iy };

          console.log("intercept  x: " + ix + "    y: " + iy);

          // determine if intercept occurred inside the cushion's rectangular area
          const xmin = Math.min(this.c2.x, this.c3.x);
          const ymin = Math.min(this.c2.y, this.c3.y);
          const xmax = Math.max(this.c2.x, this.c3.x);
          const ymax = Math.max(this.c2.y, this.c3.y);
          if (ix > xmin && ix < xmax && iy > ymin && iy < ymax) {
            //console.log("CROSS");
            Sound.BallHitCushion.play();
            const oldDx = ball.dx;
            const oldDy = ball.dy;
            ball.dx = -oldDy;
            ball.dy = -oldDx;
          }
        }
      }
    }
  }
  circle(point, col = "black") {
    view.beginPath();
    view.fillStyle = col;
    view.arc(point.x, point.y, 6, 0, fullCircle, false);
    view.fill();
  }
}
class Ball {
  static friction = 0.985;
  static bounceLoss = 0.8;
  static c = 0;
  active = true;
  constructor(x, y, r, c = "red", balls) {
    this.id = Ball.c++;
    this.x = x;
    this.y = y;
    this.dx = 0;
    this.dy = 0;
    this.radius = r;
    this.radiusSq = r ** 2;
    //this.mass = 10 * r;
    this.color = c;
    this.balls = balls;
    this.stopped = true;
    this.history = [];
  }
   update() {
    if (!table.balls.stopped()) {
      const { history, ...copy } = this;
      this.history.push(copy);
    }
    if (this.active && !this.stopped) {
      // clamp velocity near zero
      if (this.dx ** 2 + this.dy ** 2 < 0.1) {
        this.stop();
        return;
      }

      // apply friction to slow down ball
      this.dx *= Ball.friction;
      this.dy *= Ball.friction;

      // bounce ball off cushions
      table.cushions.bounce(this);
      //table.bouncer.bounce(this);

      // move ball
      this.x += this.dx;
      this.y += this.dy;

      // wrap balls around screen
      //if (this.x < 0) this.x += canvas.width;
      //if (this.y < 0) this.y += canvas.height;
      //if (this.x > canvas.width) this.x -= canvas.width;
      //if (this.y > canvas.height) this.y -= canvas.height;

      // bounce ball off edges
      if (this.x - this.radius < 0) {
        this.dx = -this.dx * Ball.bounceLoss;
        this.x = this.radius;
        Sound.BallHitCushion.play();
      }
      if (this.x + this.radius > canvas.width) {
        this.dx = -this.dx * Ball.bounceLoss;
        this.x = canvas.width - this.radius;
        Sound.BallHitCushion.play();
      }
      if (this.y - this.radius < 0) {
        this.dy = -this.dy * Ball.bounceLoss;
        this.y = this.radius;
        Sound.BallHitCushion.play();
      }
      if (this.y + this.radius > canvas.height) {
        this.dy = -this.dy * Ball.bounceLoss;
        this.y = canvas.height - this.radius;
        Sound.BallHitCushion.play();
      }
    }
  }
  back() {
    if (this.history.length > 0) {
      Object.assign(this, this.history.pop());
    }
  }
  draw() {
    if (this.active) {
      //console.log(`drawing ball  x: ${this.x}  y: ${this.y}`);
      view.beginPath();
      view.arc(this.x, this.y, this.radius, 0, fullCircle, false);
      view.fillStyle = this.color;
      //if (this.id === 15) view.fillStyle = "rgba(255, 255, 255, 0.5)";
      view.fill();
      view.lineWidth = 1;
      view.strokeStyle = "black";
      //view.font = "20px Arial";
      //view.fillStyle = "skyblue";
      //view.textAlign = "center";
      //view.textBaseline = "middle";
      //view.fillText(this.id.toString(), this.x, this.y + 2);
      view.stroke();

      //view.save();
      //view.clip();

      const grad = view.createRadialGradient(this.x, this.y, 1, this.x, this.y, this.radius / 2);
      grad.addColorStop(0, "white");
      grad.addColorStop(1, "rgba(255,255,255,0)");
      view.fillStyle = grad;
      view.fillRect(this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2);

      //view.restore();

      // display ball's speed in ball
      // const speed = Math.sqrt(this.dx ** 2 + this.dy ** 2);
      // view.beginPath();
      // view.font = "12px Arial";
      // view.fillStyle = "white";
      // view.fillText(speed.toFixed(2), this.x, this.y);
      // view.stroke();
    }
  }
  stop() {
    this.dx = 0;
    this.dy = 0;
    this.stopped = true;
    this.balls.stopped();
  }
  clone(x, y, c, a = 0) {
    if (a === 0)
      return new Ball(
        this.x + x * this.radius * 2.1,
        this.y + y * this.radius * 2.1,
        this.radius,
        c,
        this.balls
      );
    else {
      var angle = (a * Math.PI) / 180;
      const offX = this.x + x * this.radius * 2.1;
      const offY = this.y + y * this.radius * 2.1;
      const rotX =
        (offX - this.x) * Math.cos(angle) -
        (offY - this.y) * Math.sin(angle) +
        this.x;
      const rotY =
        (offX - this.x) * Math.sin(angle) +
        (offY - this.y) * Math.cos(angle) +
        this.y;
      return new Ball(rotX, rotY, this.radius, c, this.balls);
    }
  }
  reset() {
    // performed for cue ball when pocketed
    //this.stop();
    this.dx = 0;
    this.dy = 0;
    this.x = canvas.width * 0.8;
    this.y = canvas.height * 0.5;
    this.stopped = true;
    this.active = true;
  }
  clearHistory() {
    this.history = [];
  }
}
class Balls {
  balls = [];
  static CueBall;
  constructor() {
    const radius = canvas.width / gameSettings.ballSize;;
    const x = 0.2 * canvas.width;
    const y = 0.5 * canvas.height;
    this.balls.push(new Ball(x, y, radius, "black", this));
    this.balls.push(this.balls[0].clone(0, -1, "gold"));
    this.balls.push(this.balls[0].clone(0, 1, "crimson"));
    this.balls.push(this.balls[1].clone(1, 0, "crimson", 30));
    this.balls.push(this.balls[3].clone(0, 1, "gold"));
    this.balls.push(this.balls[4].clone(1, 0, "gold", -30));
    this.balls.push(this.balls[1].clone(0, -1, "crimson", -60));
    this.balls.push(this.balls[6].clone(0, 1, "gold"));
    this.balls.push(this.balls[6].clone(0, 2, "crimson"));
    this.balls.push(this.balls[6].clone(0, 3, "gold"));
    this.balls.push(this.balls[6].clone(0, -1, "gold", -60));
    this.balls.push(this.balls[10].clone(0, 1, "crimson"));
    this.balls.push(this.balls[11].clone(0, 1, "crimson"));
    this.balls.push(this.balls[10].clone(0, 3, "gold"));
    this.balls.push(this.balls[10].clone(0, 4, "crimson"));
    Balls.CueBall = new Ball(canvas.width - x, y, radius, "PaleGoldenrod", this);
    this.balls.push(Balls.CueBall);
  }
  update() {
    for (const ball of this.balls) ball.update();

    const collisions = this.getCollisions(this.balls);
    if (collisions.length > 0) Sound.BallHitBall.play();
    this.staticCollisions(collisions);
    this.dynamicCollisions(collisions);
  }
  back() {
    for (const ball of this.balls) ball.back();
  }
  draw() {
    for (const ball of this.balls) ball.draw();
  }
  getCollisions(balls) {
    const collisions = [];
    for (let i = 0; i < balls.length; ++i)
      for (let j = i + 1; j < balls.length; ++j)
        if (this.isBallCollision(balls[i], balls[j])) {
          collisions.push({ b1: balls[i], b2: balls[j] });
        }

    return collisions;
  }
  isBallCollision(b1, b2) {
    if (b1.active == true && b2.active == true) {
      //  && b1.dx + b1.dy + b2.dx + b2.dy > 0
      const dist = (b1.x - b2.x) ** 2 + (b1.y - b2.y) ** 2;
      const minDist = (b1.radius + b2.radius) ** 2;
      return dist < minDist;
    } else return false;
  }
  staticCollisions(collisions) {
    for (const c of collisions) {
      const vx = c.b1.x - c.b2.x;
      const vy = c.b1.y - c.b2.y;
      const dist = Math.sqrt(vx ** 2 + vy ** 2);
      const overlap = 0.52 * (dist - c.b1.radius - c.b2.radius);

      const ox = overlap * vx / dist;
      const oy = overlap * vy / dist;

      c.b1.x -= ox; // (overlap * vx) / dist;
      c.b1.y -= oy; // (overlap * vy) / dist;

      c.b2.x += ox; // (overlap * vx) / dist;
      c.b2.y += oy; // (overlap * vy) / dist;
    }
  }
  dynamicCollisions(collisions) {
    for (const c of collisions) {
      // Wikipedia version
      const vx = c.b2.x - c.b1.x;
      const vy = c.b2.y - c.b1.y;
      const dist = Math.sqrt(vx ** 2 + vy ** 2);

      // normalized vector along the line of collision
      const nx = vx / dist;
      const ny = vy / dist;

      const kx = c.b1.dx - c.b2.dx;
      const ky = c.b1.dy - c.b2.dy;
      // const p = (2 * (nx * kx + ny * ky)) / (c.b1.mass + c.b2.mass);
      const p = nx * kx + ny * ky;

      // c.b1.dx -= p * c.b2.mass * nx;
      // c.b1.dy -= p * c.b2.mass * ny;
      // c.b2.dx += p * c.b1.mass * nx;
      // c.b2.dy += p * c.b1.mass * ny;

      c.b1.dx -= p * nx;
      c.b1.dy -= p * ny;
      c.b2.dx += p * nx;
      c.b2.dy += p * ny;

      c.b1.stopped = false;
      c.b2.stopped = false;

      //if (c.b1.radius > 15) c.b1.radius *= 0.98;
      //if (c.b2.radius > 15) c.b2.radius *= 0.98;
    }
  }
  stopped() {
    //console.log("Test to see if all balls stopped");
    for (const ball of this.balls) if (!ball.stopped) return false;
    //console.log("All stopped");
    if (!Balls.CueBall.active) Balls.CueBall.reset();
    return true;
  }
  clearHistory() {
    for (const ball of this.balls) ball.clearHistory();
    console.log("History cleared");
  }
}
class Pocket {
  constructor(x, y, r) {
    this.x = x;
    this.y = y;
    this.radius = r;
  }
  draw() {
    view.beginPath();
    view.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, false);
    //view.fillStyle = "rgb(128, 128, 128, 0.5)";
    view.stroke();
    //view.fillStyle = "black";
  }
  check(ball) {
    return (ball.x - this.x) ** 2 + (ball.y - this.y) ** 2 < this.radius ** 2;
  }
}
class Pockets {
  //static radius = canvas.width / 35;
  constructor() {
    this.pockets = [];
    this.radius = canvas.width / gameSettings.pocketSize;
    const cornerOffset = canvas.width / gameSettings.cornerOffset; // 85;
    const sideOffset = canvas.width / gameSettings.sideOffset; // 40;
    this.pockets.push(
      new Pocket(0 + cornerOffset, 0 + cornerOffset, this.radius)
    );
    this.pockets.push(
      new Pocket(canvas.width * 0.5, 0 + sideOffset, this.radius)
    );
    this.pockets.push(
      new Pocket(canvas.width - cornerOffset, cornerOffset, this.radius)
    );
    this.pockets.push(
      new Pocket(0 + cornerOffset, canvas.height - cornerOffset, this.radius)
    );
    this.pockets.push(
      new Pocket(canvas.width * 0.5, canvas.height - sideOffset, this.radius)
    );
    this.pockets.push(
      new Pocket(
        canvas.width - cornerOffset,
        canvas.height - cornerOffset,
        this.radius
      )
    );
  }
  update(balls) {
    for (const ball of balls) {
      if (ball.active) {
        for (const pocket of this.pockets) {
          if (pocket.check(ball)) {
            Sound.BallInPocket.play();
            ball.active = false;
            ball.stop();
            //}
          }
        }
      }
    }
  }
  draw() {
    for (const pocket of this.pockets) pocket.draw();
  }
}
class Table { 
  balls = new Balls();
  pockets = new Pockets();
  cushions = new Cushions();
  constructor() {
    this.image = new Image();
    this.image.src = 'assets/PoolTable5.png';   
  }
  resize(oldWidth, oldHeight) {
    for(const b of this.balls.balls) {
      b.x = b.x / oldWidth * canvas.width;
      b.y = b.y / oldHeight * canvas.height;
      b.radius = canvas.width / gameSettings.ballSize;
      b.radiusSq = b.radius ** 2;
    }
    this.reset();
  }
  reset() {
    this.pockets = new Pockets();
    this.cushions = new Cushions();
  }
  update() {
    this.pockets.update(this.balls.balls);
    this.balls.update();
  }
  back() {
    this.balls.back();
  }
  draw() {
    //view.clearRect(0, 0, canvas.width, canvas.height);
    view.drawImage(this.image, 0, 0, this.image.width, this.image.height, 0, 0, canvas.width, canvas.height);
    if (gameSettings.drawGeometry) {
      this.pockets.draw();
      this.cushions.draw();
    }
    //this.bouncer.draw();
    // adjust ball position of collisions
    this.balls.draw();
    cue?.draw();
  }
  clearHistory() {
    this.balls.clearHistory();
  }
}
//#region DatGui
const gui = new dat.GUI();
gui.add(gameSettings, "drawGeometry").name("Draw Geometry");
//#endregion
function animate() {
  if (playMode && !pause) {
    table.update();
    table.draw();
  }
  if (backMode) {
    table.back();
    table.draw();
  }
  if (forwardMode) {
    forwardMode = false;
    table.update();
    table.draw();
  }
  requestAnimationFrame(animate);
}
function drawTable() {
  table.draw();
}
var table = new Table();
animate();

function dotProduct(v1, v2) {
  return v1.x * v2.x + v1.y * v2.y;
}
// Rotate x,y around point cx, cy
function rotatePoint(x, y, cx, cy, angleInDegrees) {
  // Convert angle to radians
  var angleInRadians = (angleInDegrees * Math.PI) / 180;

  // Calculate the new coordinates after rotation
  const translatedX = x - cx;
  const translatedY = y - cy;
  const cos = Math.cos(angleInRadians);
  const sin = Math.sin(angleInRadians);
  const newX = translatedX * cos - translatedY * sin + cx;
  const newY = translatedX * sin + translatedY * cos + cy;

  // Return the rotated coordinates
  return { newX, newY };
}

function createRandomBalls() {
  const numBalls = 20;
  for (let i = 0; i < numBalls; ++i) {
    balls.push(
      new Ball(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        Math.random() * 50 + 15,
        "blue"
      )
    );
  }
}
 