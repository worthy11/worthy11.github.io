function DisplaySettings(func_type){
    const settings = {
        "square": [0, 1],
        "sine": [0, 1],
        "parabola": [2, 3, 4],
        "linear": [2, 3],
        "spiral": [5, 6],
        "spiral-composite": [0, 1, 5, 6, 7]
    }
    const widgets = [document.getElementById("freq"),
                    document.getElementById("amp"),
                    document.getElementById("a"),
                    document.getElementById("b"),
                    document.getElementById("c"),
                    document.getElementById("alpha"),
                    document.getElementById("composite"),
                    document.getElementById("length")];

    for (let widget of widgets) widget.style.display = "none";
    for (let idx of settings[func_type]) widgets[idx].style.display = "flex";
}

function PlotPoints(canvas, data, domain, unit, tracker = document.getElementById("tracker")){
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "black";
    ctx.lineWidth = 3;
    const points = data[0];

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

function GeneratePoints(type="square", domain=10, freq=1, amp=1, coeff_a=1, coeff_b=1, coeff_c=1, alpha=0.2, composite=false, length=20, axis=5, point_freq=1000){
    let points = [], gradients = [];
    let b = 0;
    const dx = domain / point_freq;

    switch(type){
        case "square":
            b = 2 * freq / domain;
            for (let x = 0; x <= domain; x += dx) {
                points.push([x, SquareWave(x, amp, b, axis - amp / 2)]);
                gradients.push(SquareWave(x, amp, b, axis - amp / 2, true));
            }
            break;
            
        case "sine":
            b = 2 * Math.PI * freq / domain;
            for (let x = 0; x <= domain; x += dx) {
                points.push([x, SineWave(x, amp / 2, b, axis)]);
                gradients.push(SineWave(x, amp / 2, b, axis, true));
            }
            break;
            
        case "parabola":
            for (let x = 0; x <= domain; x += dx) {
                points.push([x, Parabola(x, coeff_a, coeff_b, coeff_c)]);
                gradients.push(Parabola(x, coeff_a, coeff_b, coeff_c, true));
            }
            break;
            
        case "linear":
            for (let x = 0; x <= domain; x += dx) {
                points.push([x, Linear(x, coeff_a, coeff_b)]);
                gradients.push(Linear(x, coeff_a, coeff_b, true));
            }
            break;

        case "spiral":
            if (composite) {
                const space = (1000 - length * freq) / (parseFloat(freq) + 1);
                let step = false; 
                let counter = 0;
                for (let x = 0; x <= domain; x += dx) {
                    if (step == false && counter >= space) {
                        step = true;
                        counter = 0;
                    } else if (step == true && counter >= length) {
                        step = false;
                        counter = 0;
                        if (x <= 7.5) x += 0.05;
                    }

                    if (step && x >= 6) {
                        const point = Spiral(alpha, x, true, amp / 10);
                        points.push([point[0] + domain / 2, point[1] + 5]);
                    } else {
                        const point = Spiral(alpha, x);
                        points.push([point[0] + domain / 2, point[1] + 5]);
                    }
                    gradients.push(Spiral(alpha, x, true, 0.5, true));
                    counter += 1;
                }
            } else {
                for (let x = 0; x <= domain; x += dx) {
                    const point = Spiral(alpha, x);
                    points.push([point[0] + domain / 2, point[1] + 5]);
                    gradients.push(Spiral(alpha, x, false, 0.5, true));
                }
            }
            break;
    }
    return [points, gradients];
}

function SquareWave(x, a, b, c, derivative=false){ 
    if (derivative) return 0;
    return -2*a * Math.floor(b/2 * x) + a * Math.floor(b * x) + c;
}
function SineWave(x, a, b, c, derivative=false){ 
    if (derivative) return a * b * Math.cos(b * x);
    return a * Math.sin(b * x) + c;
}
function Parabola(x, a, b, c, derivative=false){ 
    if (derivative) return 2 * a * x + b;
    return a * Math.pow(x, 2) + b * x + c;
}
function Linear(x, a, b, derivative=false){
    if (derivative) return a;
    return a * x + b;
}
function Spiral(a, x, composite=false, amp=0.5, derivative=false){ 
    let r = Math.abs(a * x);
    if (derivative) return Math.cos(x) * a * x + Math.sin(x) * a;
    if (composite) {
        r += amp;
        return [Math.cos(x) * r, Math.sin(x) * r];
    }
    return [Math.cos(x) * r, Math.sin(x) * r];
 }

async function StartTracker(records, canvas, tracker, data, speed, unit, spiral=false){
    const canvas_pos = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    let cursor_pos = [0, 0];
    onmousemove = function(e){cursor_pos = [e.clientX, e.clientY]};
    let timestamp = 0;

    const points = data[0];
    const gradients = data[1];
    
    await Countdown(3);
    for (var i = 0; i < points.length - 1; i++){
        let curr = [points[i][0], points[i][1]], next = points[i+1];
        let curr_dist = 0;
        const vector = ComputeTrackerVector(curr, next);
        const vector_len = Math.sqrt(Math.pow(vector[0], 2) + Math.pow(vector[1], 2));
        const m = gradients[i];

        // CONVERT FROM ANGULAR TO LINEAR VELOCITY
        let r = 40;
        if (spiral) r = Math.sqrt(Math.pow(canvas.width / 2 - points[i][0] * unit, 2) + Math.pow(canvas.height / 2 - points[i][1] * unit, 2));
        
        while (curr_dist < vector_len) {
            tracker.style.left = `${curr[0] * unit - tracker.width / 2}px`;
            tracker.style.top = `${canvas.height - (curr[1] * unit + tracker.height / 2)}px`;
            const tracker_pos = tracker.getBoundingClientRect();

            const tracker_x = tracker_pos.left + 7.5 - canvas_pos.left;
            const tracker_y = tracker_pos.top + 7.5 - canvas_pos.top;
            const mouse_x = cursor_pos[0] - canvas_pos.left;
            const mouse_y = cursor_pos[1] - canvas_pos.top;

            const true_x = (-m * tracker_x + tracker_y - mouse_y - 1/(m + 0.0000001) * mouse_x) / (-1/(m + 0.0000001) - m);
            const true_y = m * (true_x - tracker_x) + tracker_y;
            let error = Math.sqrt(Math.pow(mouse_x - true_x, 2) + Math.pow(mouse_y - true_y, 2));
            if (m * (mouse_x - tracker_x) + tracker_y < mouse_y) error *= -1;
            const delay = Math.sqrt(Math.pow(tracker_x - true_x, 2) + Math.pow(tracker_y - true_y, 2));

            records.push({timestamp: timestamp,
                tracker_y: tracker_y, // TRACKER Y-COORD RELATIVE TO Y=0
                mouse_y: mouse_y,     // MOUSE Y-COORD RELATIVE TO Y=0
                true_x: true_x, // NORMAL AND TANGENT INTERSECTION X-COORD
                true_y: true_y, // NORMAL AND TANGENT INTERSECTION Y-COORD
                error: error, // Y-COORD DIFFERENCE PERPENDICULAR TO TANGENT
                delay: delay, // X-COORD DIFFERENCE PARALLEL TO TANGENT
                unit: unit
            });

            curr[0] += vector[0] / (r / 80 + 0.0000001) * speed / 2;
            curr[1] += vector[1] / (r / 80 + 0.0000001) * speed / 2;
            curr_dist = Math.sqrt(Math.pow(curr[0] - points[i][0], 2) + Math.pow(curr[1] - points[i][1], 2));
            
            await Sleep(5);
            timestamp++;
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

function PlotResults(canvas, results){
    const ctx = canvas.getContext("2d");
    const ratio = canvas.height / (results[0].unit * 10);
    ctx.imageSmoothingEnabled = false;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.moveTo(0, 7 * canvas.height / 8);
    ctx.lineTo(canvas.width, 7 * canvas.height / 8);
    for (const record of results){
        const x = record.timestamp * canvas.width / results[results.length - 1].timestamp;
        const y_e = ratio * record.tracker_y;
        const y_o = ratio * record.mouse_y;
        const err = ratio * -record.error + 7 * canvas.height / 8;

        ctx.fillStyle = "green";
        ctx.fillRect(x, y_e, 2, 2);
        ctx.fillStyle = "red";
        ctx.fillRect(x, y_o, 2, 2);
        ctx.fillStyle = "blue";
        ctx.fillRect(x, err, 2, 2);
    };
    ctx.stroke();
}