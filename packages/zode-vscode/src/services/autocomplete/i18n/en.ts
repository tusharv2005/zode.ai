// English runtime translations for autocomplete (zodecode:autocomplete.* namespace)
// Source: src/i18n/locales/en/zodecode.json → "autocomplete" section

export const dict = {
  "zodecode:autocomplete.statusBar.enabled": "$(zode-logo) Autocomplete",
  "zodecode:autocomplete.statusBar.snoozed": "snoozed",
  "zodecode:autocomplete.statusBar.warning": "$(warning) Autocomplete",
  "zodecode:autocomplete.statusBar.tooltip.basic": "Zode Code Autocomplete",
  "zodecode:autocomplete.statusBar.tooltip.disabled": "Zode Code Autocomplete (disabled)",
  "zodecode:autocomplete.statusBar.tooltip.noUsableProvider":
    "**No autocomplete model configured**\n\nTo enable autocomplete, add a profile with one of these supported providers: {{providers}}.\n\n[Open Settings]({{command}})",
  "zodecode:autocomplete.statusBar.tooltip.sessionTotal": "Session total cost:",
  "zodecode:autocomplete.statusBar.tooltip.provider": "Provider:",
  "zodecode:autocomplete.statusBar.tooltip.model": "Model:",
  "zodecode:autocomplete.statusBar.tooltip.profile": "Profile: ",
  "zodecode:autocomplete.statusBar.tooltip.defaultProfile": "Default",
  "zodecode:autocomplete.statusBar.tooltip.completionSummary":
    "Performed {{count}} completions between {{startTime}} and {{endTime}}, for a total cost of {{cost}}.",
  "zodecode:autocomplete.statusBar.tooltip.providerInfo": "Autocompletions provided by {{model}} via {{provider}}.",
  "zodecode:autocomplete.statusBar.cost.zero": "$0.00",
  "zodecode:autocomplete.statusBar.cost.lessThanCent": "<$0.01",
  "zodecode:autocomplete.toggleMessage": "Zode Code Autocomplete {{status}}",
  "zodecode:autocomplete.progress.title": "Zode Code",
  "zodecode:autocomplete.progress.analyzing": "Analyzing your code...",
  "zodecode:autocomplete.progress.generating": "Generating suggested edits...",
  "zodecode:autocomplete.progress.processing": "Processing suggested edits...",
  "zodecode:autocomplete.progress.showing": "Displaying suggested edits...",
  "zodecode:autocomplete.input.title": "Zode Code: Quick Task",
  "zodecode:autocomplete.input.placeholder": "e.g., 'refactor this function to be more efficient'",
  "zodecode:autocomplete.commands.generateSuggestions": "Zode Code: Generate Suggested Edits",
  "zodecode:autocomplete.commands.displaySuggestions": "Display Suggested Edits",
  "zodecode:autocomplete.commands.cancelSuggestions": "Cancel Suggested Edits",
  "zodecode:autocomplete.commands.applyCurrentSuggestion": "Apply Current Suggested Edit",
  "zodecode:autocomplete.commands.applyAllSuggestions": "Apply All Suggested Edits",
  "zodecode:autocomplete.commands.category": "Zode Code",
  "zodecode:autocomplete.codeAction.title": "Zode Code: Suggested Edits",
  "zodecode:autocomplete.chatParticipant.fullName": "Zode Code Agent",
  "zodecode:autocomplete.chatParticipant.name": "Agent",
  "zodecode:autocomplete.chatParticipant.description": "I can help you with quick tasks and suggested edits.",
  "zodecode:autocomplete.incompatibilityExtensionPopup.message":
    "The Zode Code Autocomplete is being blocked by a conflict with GitHub Copilot. To fix this, you must disable Copilot's inline suggestions.",
  "zodecode:autocomplete.incompatibilityExtensionPopup.disableCopilot": "Disable Copilot",
  "zodecode:autocomplete.incompatibilityExtensionPopup.disableInlineAssist": "Disable Autocomplete",
  "zodecode:autocomplete.creditsExhausted.message":
    "Zode Code Autocomplete has been paused because your account has no remaining credits. Add credits to resume autocomplete.",
  "zodecode:autocomplete.creditsExhausted.addCredits": "Add Credits",
  "zodecode:autocomplete.authError.message":
    "Zode Code Autocomplete has been paused due to an authentication error. Please sign in again.",
}
