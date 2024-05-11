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

function PlotPoints(canvas, points, domain, unit, tracker){
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "black";
    ctx.lineWidth = 3;

    tracker.style.left = `${canvas.width / 2 - domain*unit / 2 - tracker.width / 2}px`;
    tracker.style.top = `${canvas.height - points[0][1] * unit - tracker.height / 2}px`;

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

async function StartTracker(records, tracker, points, speed, unit){
    var num_cycles = 0;
    var cursor_pos = [0, 0];
    var results = []
    onmousemove = function(e){cursor_pos = [e.clientX, e.clientY]};
    
    await Countdown(3);

    for (var i = 0; i < points.length - 1; i++){
        var curr = points[i], next = points[i+1];
        const vector = ComputeTrackerVector(curr, next);
        
        while (curr[0] < next[0] && ((vector[1] > 0 && curr[1] <= next[1]) || (vector[1] < 0 && curr[1] >= next[1]) || (vector[1] == 0 && curr[1] == next[1]))) {
            const timestamp = num_cycles * 10;
            const tracker_pos = tracker.getBoundingClientRect();
            records.push({timestamp: timestamp, tracker_x: tracker_pos.left, tracker_y: tracker_pos.top, mouse_x: cursor_pos[0], mouse_y: cursor_pos[1]});
            results.push([cursor_pos[0], cursor_pos[1]]);

            curr[0] += vector[0];
            curr[1] += vector[1];
            tracker.style.left = `${curr[0] * unit - tracker.width / 2}px`;
            tracker.style.top = `${400-(curr[1] * unit + tracker.height / 2)}px`;
            
            await Sleep(10 / speed);
            num_cycles++;
        }
    }
    return results;
}

function ComputeTrackerVector(curr, next){
    return [(next[0] - curr[0]), (next[1] - curr[1])];
}

function Sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function Countdown(seconds) {
    const cd = document.getElementById("plot-title");
    for (var t = seconds; t > 0; t--) {
        cd.innerHTML = `&nbsp;Wykres
        <div style="float: right; color: rgb(255, 220, 0);">Rozpoczęcie testu za: ${t}s</div>`;
        await Sleep(1000);
    }
    cd.innerHTML = "&nbspWykres";
}

function ArrayToCSV(arr) {
    const header = Object.keys(arr[0]).join(',');
    const rows = arr.map(obj => Object.values(obj).join(','));
    return header + '\n' + rows.join('\n');
}

function DownloadCSV(csvContent, fileName) {
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);
}

function PlotResults(expected, observed, domain, amp, unit){
    const ctx = document.getElementById("result").getContext("2d");
    ctx.fillStyle = "black";
    ctx.lineWidth = 1;
    const canvas = document.getElementById("canvas").getBoundingClientRect();
    for (var point of observed){
        point[0] = (point[0] - canvas.left) / (domain * unit);
        point[1] = (point[1] - canvas.top) / (amp * unit);
    }

    ctx.clearRect(0, 0, 800, 400);
    ctx.beginPath();

    ctx.moveTo(0, 0);
    for (const point of observed){
        var next = [point[0] * unit, point[1] * unit];
        console.log(next[0], next[1]);
        ctx.lineTo(next[0], next[1]);
        ctx.moveTo(next[0], next[1]);
    };
    ctx.stroke();
}