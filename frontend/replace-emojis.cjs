const fs = require('fs');
const path = require('path');

function processFile(filePath, replacements) {
    if (!fs.existsSync(filePath)) { console.log('not found', filePath); return; }
    let content = fs.readFileSync(filePath, 'utf8');
    replacements.forEach(({from, to}) => {
        content = content.replace(new RegExp(from, 'g'), to);
    });
    fs.writeFileSync(filePath, content);
    console.log('Processed', filePath);
}

const dir = 'c:/Users/smayo/PROMETHEUS OS/frontend/src/views';
const svgs = {
    alert: '<svg viewBox=\"0 0 24 24\" width=\"16\" height=\"16\" stroke=\"currentColor\" stroke-width=\"2\" fill=\"none\"><circle cx=\"12\" cy=\"12\" r=\"10\"></circle><line x1=\"12\" y1=\"8\" x2=\"12\" y2=\"12\"></line><line x1=\"12\" y1=\"16\" x2=\"12.01\" y2=\"16\"></line></svg>',
    gear: '<svg viewBox=\"0 0 24 24\" width=\"16\" height=\"16\" stroke=\"currentColor\" stroke-width=\"2\" fill=\"none\"><circle cx=\"12\" cy=\"12\" r=\"3\"></circle><path d=\"M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z\"></path></svg>',
    speaker: '<svg viewBox=\"0 0 24 24\" width=\"16\" height=\"16\" stroke=\"currentColor\" stroke-width=\"2\" fill=\"none\"><polygon points=\"11 5 6 9 2 9 2 15 6 15 11 19 11 5\"></polygon><path d=\"M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07\"></path></svg>',
    book: '<svg viewBox=\"0 0 24 24\" width=\"16\" height=\"16\" stroke=\"currentColor\" stroke-width=\"2\" fill=\"none\"><path d=\"M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z\"></path><path d=\"M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z\"></path></svg>',
    check: '<svg viewBox=\"0 0 24 24\" width=\"16\" height=\"16\" stroke=\"currentColor\" stroke-width=\"2\" fill=\"none\"><polyline points=\"20 6 9 17 4 12\"></polyline></svg>',
    warning: '<svg viewBox=\"0 0 24 24\" width=\"16\" height=\"16\" stroke=\"currentColor\" stroke-width=\"2\" fill=\"none\"><path d=\"M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z\"></path><line x1=\"12\" y1=\"9\" x2=\"12\" y2=\"13\"></line><line x1=\"12\" y1=\"17\" x2=\"12.01\" y2=\"17\"></line></svg>',
    message: '<svg viewBox=\"0 0 24 24\" width=\"16\" height=\"16\" stroke=\"currentColor\" stroke-width=\"2\" fill=\"none\"><path d=\"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z\"></path></svg>',
};

processFile(path.join(dir, 'EmployeeWorkspace.vue'), [
    { from: '🚨', to: svgs.alert },
    { from: '⚙️', to: svgs.gear },
    { from: '📢', to: svgs.speaker },
    { from: '📘', to: svgs.book },
    { from: '✅', to: svgs.check },
    { from: '⚠️', to: svgs.warning },
    { from: '💬', to: svgs.message }
]);
