import * as vscode from "vscode"

export class ZodeCodeActionProvider implements vscode.CodeActionProvider {
  static readonly metadata: vscode.CodeActionProviderMetadata = {
    providedCodeActionKinds: [vscode.CodeActionKind.QuickFix, vscode.CodeActionKind.RefactorRewrite],
  }

  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext,
  ): vscode.CodeAction[] {
    if (range.isEmpty) return []

    const actions: vscode.CodeAction[] = []

    const add = new vscode.CodeAction("Add to Zode Code", vscode.CodeActionKind.RefactorRewrite)
    add.command = { command: "zode-code.new.addToContext", title: "Add to Zode Code" }
    actions.push(add)

    const hasDiagnostics = context.diagnostics.length > 0

    if (hasDiagnostics) {
      const fix = new vscode.CodeAction("Fix with Zode Code", vscode.CodeActionKind.QuickFix)
      fix.command = { command: "zode-code.new.fixCode", title: "Fix with Zode Code" }
      fix.isPreferred = true
      actions.push(fix)
    }

    if (!hasDiagnostics) {
      const explain = new vscode.CodeAction("Explain with Zode Code", vscode.CodeActionKind.RefactorRewrite)
      explain.command = { command: "zode-code.new.explainCode", title: "Explain with Zode Code" }
      actions.push(explain)

      const improve = new vscode.CodeAction("Improve with Zode Code", vscode.CodeActionKind.RefactorRewrite)
      improve.command = { command: "zode-code.new.improveCode", title: "Improve with Zode Code" }
      actions.push(improve)
    }

    return actions
  }
}
