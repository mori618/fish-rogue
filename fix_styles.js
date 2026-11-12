const fs = require('fs');
const path = require('path');

const filePath = String.raw`c:\Users\b52af\OneDrive\デスクトップ\yuki\GAMES\fishing\styles.css`;

try {
    let content = fs.readFileSync(filePath, 'utf8');

    const startMarker = '.dynamic-mission-item.ticket-reward .mission-desc {';
    const endMarker = '.mission-item-row {';

    const startIndex = content.indexOf(startMarker);
    const endIndex = content.indexOf(endMarker);

    if (startIndex === -1) {
        console.error('Start marker not found');
        process.exit(1);
    }
    if (endIndex === -1) {
        console.error('End marker not found');
        process.exit(1);
    }

    // Find the closing brace of the start marker rule
    const closeBraceIndex = content.indexOf('}', startIndex);
    if (closeBraceIndex === -1 || closeBraceIndex > endIndex) {
         console.error('Close brace not found or invalid');
         process.exit(1);
    }

    const before = content.substring(0, closeBraceIndex + 1);
    const after = content.substring(endIndex);

    const newContent = `

/* Floating Status & Help Button */
.floating-status-right {
    position: absolute;
    top: 20px;
    right: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    z-index: 100;
    pointer-events: auto;
}

.btn-help {
    width: 48px;
    height: 48px;
    border-radius: 50% !important;
    background: rgba(0, 0, 0, 0.4) !important;
    backdrop-filter: blur(4px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.btn-help .material-icons {
    font-size: 28px;
}

/* Mission List Styles */
`;

    const finalContent = before + newContent + after;

    fs.writeFileSync(filePath, finalContent, 'utf8');
    console.log('Successfully fixed styles.css');

} catch (err) {
    console.error('Error:', err);
    process.exit(1);
}
