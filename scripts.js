function DisplaySettings(func_type){
    var settings = [document.getElementById("freq"),
                    document.getElementById("amp"),
                    document.getElementById("a"),
                    document.getElementById("b"),
                    document.getElementById("c")];

    switch (func_type){
        case "square":
            settings[0].style.display = "flex";
            settings[1].style.display = "flex";
            settings[2].style.display = "none";
            settings[3].style.display = "none";
            settings[4].style.display = "none";
            break;
            
        case "sine":
            settings[0].style.display = "flex";
            settings[1].style.display = "flex";
            settings[2].style.display = "none";
            settings[3].style.display = "none";
            settings[4].style.display = "none";
            break;
            
        case "parabola":
            settings[0].style.display = "none";
            settings[1].style.display = "none";
            settings[2].style.display = "flex";
            settings[3].style.display = "flex";
            settings[4].style.display = "flex";
            break;
            
        case "linear":
            settings[0].style.display = "none";
            settings[1].style.display = "none";
            settings[2].style.display = "flex";
            settings[3].style.display = "flex";
            settings[4].style.display = "none";
            break;
    }
}

function PlotPoints(ctx, points, domain, unit){
    var start = [(canvas.width - domain*unit) / 2, canvas.height];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();

    var next = [start[0] + points[0][0] * unit, start[1] - points[0][1] * unit];
    ctx.moveTo(next[0], next[1]);
    for (const point of points){
        var next = [start[0] + point[0] * unit, start[1] - point[1] * unit];
        ctx.lineTo(next[0], next[1]);
        ctx.moveTo(next[0], next[1]);
    };
    ctx.stroke();
}

function GeneratePoints(type="square", domain=10, freq=1, amp=1, coeff_a=1, coeff_b=1, coeff_c=1, axis=5, point_freq=1000){
    var points = [];
    var dx = domain / point_freq;

    switch(type){
        case "square":
            var b = 2 * freq / domain;
            for (let x = 0; x <= domain; x += dx) points.push([x, SquareWave(x, amp, b, axis - amp / 2)]);
            break;
            
        case "sine":
            var b = 2 * Math.PI * freq / domain;
            for (let x = 0; x <= domain; x += dx) points.push([x, SineWave(x, amp / 2, b, axis)]);
            break;
            
        case "parabola":
            for (let x = 0; x <= domain; x += dx) points.push([x, Parabola(x, coeff_a, coeff_b, coeff_c)]);
            break;
            
        case "linear":
            for (let x = 0; x <= domain; x += dx) points.push([x, Parabola(x, coeff_a, coeff_b)]);
            break;
    }
    return points;
}

function SquareWave(x, a, b, c){ return -2*a * Math.floor(b/2 * x) + a * Math.floor(b * x) + c; }
function SineWave(x, a, b, c){ return a * Math.sin(b * x) + c; }
function Parabola(x, a, b, c){ return a * Math.pow(x, 2) + b * x + c; }
function Linear(x, a, b){ return a * x + b; }

async function StartTracker(tracker, points, speed, unit){
    const eps = 0.00001;
    var num_cycles = 0;
    // document.onmousemove = HandleMouseMovement;
    onmousemove = function(e){console.log("mouse location:", e.clientX, e.clientY)};
    
    for (var i = 0; i < points.length - 1; i++){
        var curr = points[i], next = points[i+1];
        const vector = ComputeTrackerVector(curr, next);
        
        while ((curr[0] < next[0] - eps || curr[0] > next[0] + eps) || ((vector[1] >= 0 && curr[1] < next[1] - eps) || (vector[1] <= 0 && curr[1] > next[1] + eps))) {
            const timestamp = num_cycles * 10 // MS;
            const tracker_pos = tracker.getBoundingClientRect();
            const cursor_pos = [];
            
            curr[0] += vector[0] * speed;
            curr[1] += vector[1] * speed;
            tracker.style.left = `${Math.max(curr[0] * unit - 7.5, 0)}px`;
            tracker.style.top = `${400-(curr[1] * unit + 7.5)}px`;
            
            await Sleep(10);
            num_cycles++;
        }
    }
}

function ComputeTrackerVector(curr, next){
    return [(next[0] - curr[0]), (next[1] - curr[1])];
}

function Sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function HandleMouseMovement(event) {
    var dot, eventDoc, doc, body, pageX, pageY;

    event = event || window.event;

    if (event.pageX == null && event.clientX != null) {
        eventDoc = (event.target && event.target.ownerDocument) || document;
        doc = eventDoc.documentElement;
        body = eventDoc.body;

        event.pageX = event.clientX +
          (doc && doc.scrollLeft || body && body.scrollLeft || 0) -
          (doc && doc.clientLeft || body && body.clientLeft || 0);
          event.pageY = event.clientY +
          (doc && doc.scrollTop  || body && body.scrollTop  || 0) -
          (doc && doc.clientTop  || body && body.clientTop  || 0 );
    }

    return [event.pageX, event.pageY];
}