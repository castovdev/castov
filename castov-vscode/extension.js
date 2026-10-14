const vscode = require('vscode');
const crypto = require('crypto');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log('Castov extension is now active!');

    // Command: Encode Base64
    let encodeBase64 = vscode.commands.registerCommand('castov.encodeBase64', function () {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showInformationMessage('No editor is active.');
            return;
        }

        const document = editor.document;
        const selections = editor.selections;

        editor.edit(editBuilder => {
            selections.forEach(selection => {
                const text = document.getText(selection);
                if (text) {
                    const encoded = Buffer.from(text).toString('base64');
                    editBuilder.replace(selection, encoded);
                }
            });
        }).then(success => {
            if (success) vscode.window.showInformationMessage('Encoded to Base64 ✅');
        });
    });

    // Command: Decode Base64
    let decodeBase64 = vscode.commands.registerCommand('castov.decodeBase64', function () {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const document = editor.document;
        const selections = editor.selections;

        editor.edit(editBuilder => {
            selections.forEach(selection => {
                const text = document.getText(selection);
                if (text) {
                    try {
                        const decoded = Buffer.from(text, 'base64').toString('utf8');
                        editBuilder.replace(selection, decoded);
                    } catch {
                        vscode.window.showErrorMessage('Invalid Base64 string ❌');
                    }
                }
            });
        }).then(success => {
            if (success) vscode.window.showInformationMessage('Decoded Base64 ✅');
        });
    });

    // Command: Generate UUID
    let generateUUID = vscode.commands.registerCommand('castov.generateUUID', function () {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const selections = editor.selections;

        editor.edit(editBuilder => {
            selections.forEach(selection => {
                const uuid = crypto.randomUUID();
                editBuilder.replace(selection, uuid); // Replaces selection or inserts at cursor
            });
        }).then(success => {
            if (success) vscode.window.showInformationMessage('UUID Inserted ✅');
        });
    });

    context.subscriptions.push(encodeBase64, decodeBase64, generateUUID);
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};
