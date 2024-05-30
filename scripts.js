function DisplaySettings(func_type){
    const settings = [document.getElementById("freq"),
                    document.getElementById("amp"),
                    document.getElementById("a"),
                    document.getElementById("b"),
                    document.getElementById("c"),
                    document.getElementById("alpha")];

    switch (func_type){
        case "square":
            settings[0].style.display = "flex";
            settings[1].style.display = "flex";
            settings[2].style.display = "none";
            settings[3].style.display = "none";
            settings[4].style.display = "none";
            settings[5].style.display = "none";
            break;
            
        case "sine":
            settings[0].style.display = "flex";
            settings[1].style.display = "flex";
            settings[2].style.display = "none";
            settings[3].style.display = "none";
            settings[4].style.display = "none";
            settings[5].style.display = "none";
            break;
            
        case "parabola":
            settings[0].style.display = "none";
            settings[1].style.display = "none";
            settings[2].style.display = "flex";
            settings[3].style.display = "flex";
            settings[4].style.display = "flex";
            settings[5].style.display = "none";
            break;
            
        case "linear":
            settings[0].style.display = "none";
            settings[1].style.display = "none";
            settings[2].style.display = "flex";
            settings[3].style.display = "flex";
            settings[4].style.display = "none";
            settings[5].style.display = "none";
            break;
            
        case "spiral":
            settings[0].style.display = "none";
            settings[1].style.display = "none";
            settings[2].style.display = "none";
            settings[3].style.display = "none";
            settings[4].style.display = "none";
            settings[5].style.display = "flex";
            break;
    }
}

function PlotPoints(canvas, points, domain, unit, tracker = document.getElementById("tracker")){
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "black";
    ctx.lineWidth = 3;

    tracker.style.left = `${points[0][0] * unit - tracker.width / 2}px`;
    tracker.style.top = `${canvas.height - points[0][1] * unit - tracker.height / 2}px`;

    const start = [(canvas.width - domain*unit) / 2, canvas.height];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();

    let next = [start[0] + points[0][0] * unit, start[1] - points[0][1] * unit];
    ctx.moveTo(next[0], next[1]);
    for (const point of points){
        next = [start[0] + point[0] * unit, start[1] - point[1] * unit];
        ctx.lineTo(next[0], next[1]);
        ctx.moveTo(next[0], next[1]);
    };
    ctx.stroke();
}

function GeneratePoints(type="square", domain=10, freq=1, amp=1, coeff_a=1, coeff_b=1, coeff_c=1, alpha=0.2, axis=5, point_freq=1000){
    let points = [];
    let b = 0;
    const dx = domain / point_freq;

    switch(type){
        case "square":
            b = 2 * freq / domain;
            for (let x = 0; x <= domain; x += dx) points.push([x, SquareWave(x, amp, b, axis - amp / 2)]);
            break;
            
        case "sine":
            b = 2 * Math.PI * freq / domain;
            for (let x = 0; x <= domain; x += dx) points.push([x, SineWave(x, amp / 2, b, axis)]);
            break;
            
        case "parabola":
            for (let x = 0; x <= domain; x += dx) points.push([x, Parabola(x, coeff_a, coeff_b, coeff_c)]);
            break;
            
        case "linear":
            for (let x = 0; x <= domain; x += dx) points.push([x, Linear(x, coeff_a, coeff_b)]);
            break;

        case "spiral":
            for (let x = 0; x <= domain; x += dx) points.push([Math.cos(x) * Spiral(alpha, x) + domain / 2, Math.sin(x) * Spiral(alpha, x) + 5]);
    }
    return points;
}

function SquareWave(x, a, b, c){ return -2*a * Math.floor(b/2 * x) + a * Math.floor(b * x) + c; }
function SineWave(x, a, b, c){ return a * Math.sin(b * x) + c; }
function Parabola(x, a, b, c){ return a * Math.pow(x, 2) + b * x + c; }
function Linear(x, a, b){ return a * x + b; }
function Spiral(a, theta){ return Math.abs(a * theta); }

async function StartTracker(records, canvas, tracker, points, speed, unit){
    let num_cycles = 0;
    const canvas_pos = canvas.getBoundingClientRect();
    let cursor_pos = [0, 0];
    onmousemove = function(e){cursor_pos = [e.clientX, e.clientY]};
    
    await Countdown(3);
    for (var i = 0; i < points.length - 1; i++){
        let curr = [points[i][0], points[i][1]], next = points[i+1];
        let curr_dist = 0;
        const vector = ComputeTrackerVector(curr, next);
        const vector_len = Math.sqrt(Math.pow(vector[0], 2) + Math.pow(vector[1], 2));
        
        while (curr_dist < vector_len) {
            const timestamp = num_cycles * 10;
            const tracker_pos = tracker.getBoundingClientRect();

            records.push({timestamp: timestamp,
                tracker_x: tracker_pos.left + 7.5 - canvas_pos.left,
                tracker_y: (tracker_pos.top + 7.5 - canvas_pos.top) / unit,
                mouse_x: cursor_pos[0] - canvas_pos.left,
                mouse_y: (cursor_pos[1] - canvas_pos.top) / unit});

            curr[0] += vector[0] * speed / 2;
            curr[1] += vector[1] * speed / 2;
            curr_dist = Math.sqrt(Math.pow(curr[0] - points[i][0], 2) + Math.pow(curr[1] - points[i][1], 2));
            tracker.style.left = `${curr[0] * unit - tracker.width / 2}px`;
            tracker.style.top = `${400-(curr[1] * unit + tracker.height / 2)}px`;
            
            await Sleep(5);
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

function PlotResults(canvas, results, unit){
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    for (const record of results){
        const x = record.timestamp * 800 / results[results.length - 1].timestamp;
        const y_e = record.tracker_y * unit;
        const y_o = record.mouse_y * unit;

        ctx.fillStyle = "green";
        ctx.fillRect(x, y_e, 2, 2);
        ctx.fillStyle = "red";
        ctx.fillRect(x, y_o, 2, 2);
    };
    ctx.stroke();
}