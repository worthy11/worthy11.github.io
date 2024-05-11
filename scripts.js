function Initialize(ctx, unit, func_type, domain, freq, amp){
    DisplaySettings(func_type);
    var points = GeneratePoints(func_type, domain, freq, amp);
    PlotPoints(ctx, points, domain, unit, amp);
}

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

function PlotPoints(ctx, points, domain, unit, amp = 1){
    var start = [canvas.width / 2 - domain / 2 * unit, canvas.height / 2 + amp / 2 * unit];

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.moveTo(start[0], start[1]);
    for (const point of points){
        const next = [start[0] + point[0] * unit, start[1] - point[1] * unit];
        ctx.lineTo(next[0], next[1]);
        ctx.moveTo(next[0], next[1]);
    };
    ctx.stroke();
}

function GeneratePoints(type="square", domain=10, freq=1, amp=1, coeff_a=1, coeff_b=1, coeff_c=1){
    var points = [];
    const point_freq = 1000;
    var dx = domain / point_freq;

    switch(type){
        case "square":
            var b = 2 * freq / domain;
            for (let x = 0; x <= domain; x += dx) points.push([x, SquareWave(x, amp, b)]);
            break;
            
        case "sine":
            var b = 2 * Math.PI * freq / domain;
            for (let x = 0; x <= domain; x += dx) points.push([x, SineWave(x, amp, b)]);
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

function SquareWave(x, a, b){ return -2*a * Math.floor(b/2 * x) + a * Math.floor(b * x); } // freq = 
function SineWave(x, a, b){ return a * Math.sin(b * x); }
function Parabola(x, a, b, c){ return a * Math.pow(x, 2) + b * x + c; }
function Linear(x, a, b){ return a * x + b; }
