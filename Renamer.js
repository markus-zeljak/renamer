// Renamer v1.0.1 for Cavalry 2.7.2+
// Save this editable file in Cavalry's Scripts folder and open Scripts > Renamer.

(function () {
    var TOOL_VERSION = "1.0.1";
    var PREF_KEY = "codex.renamer.v2";
    var updating = false;
    var lastPlan = [];

    function normalizedMatch(value) {
        // An invisible whitespace-only filter hides the placeholder and matches unexpectedly.
        return typeof value === "string" && /\S/.test(value) ? value : "";
    }

    function loadSettings() {
        var value = {};
        try {
            if (api.hasPreferenceObject(PREF_KEY)) value = api.getPreferenceObject(PREF_KEY) || {};
        } catch (error) {
            console.log("Renamer: could not read saved settings: " + error);
        }
        return {
            match: normalizedMatch(value.match),
            pattern: typeof value.pattern === "string" ? value.pattern : "",
            start: Number.isSafeInteger(value.start) ? value.start : 0
        };
    }

    function saveSettings() {
        try {
            api.setPreferenceObject(PREF_KEY, {
                match: normalizedMatch(matchField.getText()),
                pattern: patternField.getText(),
                start: startField.getValue()
            });
        } catch (error) {
            console.log("Renamer: could not save settings: " + error);
        }
    }

    function renderName(pattern, oldName, ascending, descending) {
        return pattern.replace(/\{name\}|\{up\}|\{down\}/g, function (token) {
            if (token === "{name}") return oldName;
            if (token === "{up}") return String(ascending);
            return String(descending);
        });
    }

    function collectSelection() {
        var ids = api.getSelection();
        var layers = [];
        var ignored = 0;
        for (var i = 0; i < ids.length; i++) {
            try {
                // Selection can come from the Assets window. Only scene layers belong here.
                var type = api.getLayerType(ids[i]);
                var name = api.getNiceName(ids[i]);
                if (type && type !== "asset" && typeof name === "string" && name.length) {
                    layers.push({ id: ids[i], oldName: name });
                } else {
                    ignored++;
                }
            } catch (error) {
                ignored++;
            }
        }
        return { layers: layers, ignored: ignored };
    }

    function makePlan(selection, match, pattern, start) {
        var eligible = [];
        for (var i = 0; i < selection.layers.length; i++) {
            var layer = selection.layers[i];
            if (!match || layer.oldName.indexOf(match) !== -1) eligible.push(layer);
        }
        var plan = [];
        for (var j = 0; j < eligible.length; j++) {
            var oldName = eligible[j].oldName;
            var replacement = renderName(pattern, oldName,
                start + j, start + eligible.length - 1 - j);
            // Replace every literal match, preserving the rest of the name.
            // Joining keeps replacement text such as $& literal and avoids regex syntax.
            var newName = match ? oldName.split(match).join(replacement) : replacement;
            plan.push({ id: eligible[j].id, oldName: eligible[j].oldName, newName: newName });
        }
        return plan;
    }

    function collectActiveCompLayers(comp) {
        comp = comp || api.getActiveComp();
        var layers = [];
        var seen = {};
        if (!comp) return layers;
        function walk(parent) {
            var children = api.getChildren(parent) || [];
            for (var i = 0; i < children.length; i++) {
                var id = children[i];
                if (seen[id]) continue;
                seen[id] = true;
                try {
                    var type = api.getLayerType(id);
                    var name = api.getNiceName(id);
                    if (type && type !== "asset" && typeof name === "string" && name.length) {
                        layers.push({ id: id, oldName: name });
                    }
                    walk(id);
                } catch (error) {
                    console.log("Renamer skipped a composition child: " + error);
                }
            }
        }
        walk(comp);
        return layers;
    }

    var settings = loadSettings();
    ui.setTitle("Renamer");
    ui.setMargins(10, 10, 10, 10);
    ui.setSpaceBetween(7);
    ui.setMinimumWidth(310);
    ui.setMinimumHeight(285);

    var matchField = new ui.LineEdit();
    matchField.setToolTip("Replace every occurrence of this text in selected layer names. Case sensitive, literal text. Leave empty to rename the whole name.");
    if (settings.match) matchField.setText(settings.match);
    matchField.setPlaceholder("Match (optional)");
    matchField.setMinimumHeight(28);

    var patternField = new ui.LineEdit();
    patternField.setPlaceholder("Rename to");
    patternField.setToolTip("Replacement text when Match is set; leave empty to remove matching text. Otherwise the whole new name. Use {name}, {up}, and {down}; buttons add these tokens at the end.");
    patternField.setText(settings.pattern);
    patternField.setMinimumHeight(28);

    var nameButton = new ui.Button("Current name");
    nameButton.setToolTip("Insert {name}: the layer's existing name.");
    var upButton = new ui.Button("Number ↑");
    upButton.setToolTip("Insert {up}: ascending sequence in selection order.");
    var downButton = new ui.Button("Number ↓");
    downButton.setToolTip("Insert {down}: descending sequence in selection order.");
    var tokenRow = new ui.HLayout();
    tokenRow.setSpaceBetween(5);
    tokenRow.add(nameButton, upButton, downButton);
    tokenRow.addStretch();

    var startLabel = new ui.Label("Start ascending from");
    startLabel.setMinimumWidth(175);
    startLabel.setToolTip("First value for Number ↑. Number ↓ starts at this value plus the matched count minus one.");
    var startField = new ui.NumericField(settings.start);
    startField.setType(0);
    startField.setStep(1);
    startField.setFixedWidth(75);
    startField.setToolTip("First ascending number. Negative values are allowed.");
    var startRow = new ui.HLayout();
    startRow.setSpaceBetween(8);
    startRow.add(startLabel, startField);
    startRow.addStretch();

    var renameButton = new ui.Button("Rename");
    renameButton.setMinimumHeight(30);
    renameButton.setToolTip("Rename the matching selected layers. The current selection is checked again when clicked.");
    var moreButton = new ui.Button("⋯");
    moreButton.setFixedWidth(30);
    moreButton.setMinimumHeight(30);
    moreButton.setToolTip("More naming tools");
    var actionRow = new ui.HLayout();
    actionRow.setMargins(0, 0, 0, 0);
    actionRow.setSpaceBetween(6);
    actionRow.add(renameButton, moreButton);

    var previewLabel = new ui.Label("Preview");
    var previewList = new ui.List();
    previewList.showSearchBar(false);
    previewList.setSelectionMode("none");
    previewList.setRowsRenamable(false);
    previewList.setRowsDeletable(false);
    previewList.setRowsReorderable(false);
    previewList.setRowHeight(25);
    previewList.setPlaceholder("Matching selected layers appear here.");
    previewList.setFixedHeight(68);

    function updatePreview() {
        if (updating) return;
        updating = true;
        try {
            renameButton.setText("Rename");
            var selection = collectSelection();
            var pattern = patternField.getText();
            var match = normalizedMatch(matchField.getText());
            var start = startField.getValue();
            var validStart = Number.isSafeInteger(start);
            var hasRenameInput = pattern.length > 0 || match.length > 0;
            lastPlan = validStart ? makePlan(selection, match, pattern, start) : [];
            var rows = [];
            for (var i = 0; i < lastPlan.length; i++) {
                var item = lastPlan[i];
                rows.push({
                    uuid: String(i),
                    label: hasRenameInput ? item.oldName + "  →  " + (item.newName || "(empty name)") : item.oldName,
                    tooltip: hasRenameInput ? item.oldName + " → " + item.newName : item.oldName
                });
            }
            previewList.setPlaceholder(selection.layers.length ?
                "No selected layer matches the text." : "Select scene layers to preview.");
            previewList.setModel(rows);
            var canRename = hasRenameInput && validStart && lastPlan.length > 0;
            for (var j = 0; j < lastPlan.length; j++) {
                if (!lastPlan[j].newName) canRename = false;
            }
            renameButton.setEnabled(canRename);
            if (!selection.layers.length) {
                renameButton.setToolTip("Select scene layers to rename.");
            } else if (selection.ignored && !lastPlan.length) {
                renameButton.setToolTip("Only scene layers can be renamed.");
            } else if (!hasRenameInput) {
                renameButton.setToolTip("Enter text to match, a new name, or a token.");
            } else if (!validStart) {
                renameButton.setToolTip("Enter a whole starting number.");
            } else if (!lastPlan.length) {
                renameButton.setToolTip("No selected layer matches the text.");
            } else if (!canRename) {
                renameButton.setToolTip("A resulting name is empty.");
            } else {
                renameButton.setToolTip("Rename " + lastPlan.length + " selected layer" +
                    (lastPlan.length === 1 ? "" : "s") + ".");
            }
        } catch (error) {
            lastPlan = [];
            previewList.setModel([]);
            renameButton.setEnabled(false);
            previewList.setPlaceholder("Preview failed; see the JavaScript Console.");
            console.error("Renamer preview: " + error);
        } finally {
            updating = false;
        }
    }

    function appendToken(token) {
        patternField.setText(patternField.getText() + token);
        saveSettings();
        updatePreview();
    }

    nameButton.onClick = function () { appendToken("{name}"); };
    upButton.onClick = function () { appendToken("{up}"); };
    downButton.onClick = function () { appendToken("{down}"); };
    var normalizingMatch = false;
    matchField.onValueChanged = function () {
        if (normalizingMatch) return;
        var value = matchField.getText();
        if (value && !/\S/.test(value)) {
            normalizingMatch = true;
            matchField.setText("");
            normalizingMatch = false;
        }
        saveSettings();
        updatePreview();
    };
    patternField.onValueChanged = function () { saveSettings(); updatePreview(); };
    startField.onValueChanged = function () { saveSettings(); updatePreview(); };

    renameButton.onClick = function () {
        // Rebuild from the live selection so a stale preview cannot rename old IDs.
        updatePreview();
        if (!renameButton.isEnabled()) return;
        var plan = lastPlan.slice();
        var completed = 0;
        var failed = 0;
        for (var i = 0; i < plan.length; i++) {
            var item = plan[i];
            try {
                if (api.getNiceName(item.id) !== item.oldName) {
                    failed++;
                    continue;
                }
                if (item.newName === item.oldName) continue;
                api.rename(item.id, item.newName);
                if (api.getNiceName(item.id) === item.newName) completed++;
                else failed++;
            } catch (error) {
                failed++;
                console.error("Renamer could not rename " + item.oldName + ": " + error);
            }
        }
        updatePreview();
        renameButton.setText(completed ?
            "Renamed " + completed + (failed ? " · " + failed + " skipped" : "") :
            (failed ? "No names changed · " + failed + " skipped" : "No names changed"));
        if (failed) console.log("Renamer: " + failed + " selected layer(s) were skipped.");
    };

    function stripVersionSuffix(name, mode) {
        // The limited all-layers option ignores dash names entirely.
        if (mode === "numbers") {
            if (/[-–]/.test(name)) return name;
            return name.replace(/ [0-9]+$/, "");
        }
        // Remove consecutive trailing Cavalry-style numbers and dash versions.
        // The expression is end-anchored, so dashes or numbers in the body remain.
        var result = name;
        while (true) {
            var next = result.replace(/(?: ?(?:--|–|-)[ ]?[0-9]+| [0-9]+)$/, "");
            if (next === result || !next.length) return result;
            result = next;
        }
    }

    function stripBracketSuffix(name) {
        // Remove one complete trailing group, including spaces or nested brackets.
        if (name.charAt(name.length - 1) !== "]") return name;
        var depth = 0;
        for (var i = name.length - 1; i >= 0; i--) {
            var character = name.charAt(i);
            if (character === "]") depth++;
            else if (character === "[") {
                depth--;
                if (depth === 0) {
                    return i > 1 && i < name.length - 2 && name.charAt(i - 1) === " " ?
                        name.slice(0, i - 1) : name;
                }
            }
        }
        return name;
    }

    function applyCleanup(layers, mode) {
        var cleaned = 0;
        var skipped = 0;
        for (var i = 0; i < layers.length; i++) {
            var item = layers[i];
            var newName = mode === "bracket" ?
                stripBracketSuffix(item.oldName) : stripVersionSuffix(item.oldName, mode);
            if (newName === item.oldName || !newName.length) continue;
            try {
                if (api.getNiceName(item.id) !== item.oldName) {
                    skipped++;
                    continue;
                }
                api.rename(item.id, newName);
                if (api.getNiceName(item.id) === newName) cleaned++;
                else skipped++;
            } catch (error) {
                skipped++;
                console.error("Renamer could not clean up " + item.oldName + ": " + error);
            }
        }
        updatePreview();
        renameButton.setText(cleaned ?
            "Cleaned " + cleaned + (skipped ? " · " + skipped + " skipped" : "") :
            (skipped ? "No names changed · " + skipped + " skipped" : "No matching suffixes"));
    }

    var cleanupChoiceWindow;
    function showCleanupChoices() {
        var comp = api.getActiveComp();
        if (!comp) {
            new ui.Modal().showMessage("Open a composition before cleaning up names.");
            return;
        }
        if (cleanupChoiceWindow) cleanupChoiceWindow.close();
        var dialog = new ui.Container();
        dialog.setMinimumWidth(300);
        var layout = new ui.VLayout();
        layout.setMargins(12, 12, 12, 12);
        layout.setSpaceBetween(8);
        layout.add(new ui.Label("No layers selected"));
        layout.add(new ui.Label("Clean up the active composition:"));
        var numbersButton = new ui.Button("Only “ #”");
        numbersButton.setToolTip("Remove a trailing space and number. Skip any name containing –, -, or --.");
        var allButton = new ui.Button("All versioning");
        allButton.setToolTip("Remove trailing numbers and numbered – , - , or -- versions.");
        numbersButton.onClick = function () {
            dialog.close();
            if (api.getActiveComp() !== comp) return;
            applyCleanup(collectActiveCompLayers(comp), "numbers");
        };
        allButton.onClick = function () {
            dialog.close();
            if (api.getActiveComp() !== comp) return;
            applyCleanup(collectActiveCompLayers(comp), "all");
        };
        layout.add(numbersButton, allButton);
        dialog.setLayout(layout);
        cleanupChoiceWindow = dialog;
        dialog.show();
    }

    function cleanUpNumbers() {
        var selection = collectSelection();
        if (selection.layers.length) {
            applyCleanup(selection.layers, "all");
        } else {
            showCleanupChoices();
        }
    }

    function removeBracketSuffixes() {
        var selection = collectSelection();
        if (selection.layers.length) {
            applyCleanup(selection.layers, "bracket");
            return;
        }
        var comp = api.getActiveComp();
        if (!comp) {
            new ui.Modal().showMessage("Open a composition before cleaning up names.");
            return;
        }
        if (!new ui.Modal().showConfirmation(
            "Remove trailing bracket tags",
            "No layers are selected. Remove trailing tags such as [Duplicator] from all layers in the active composition?"
        )) return;
        if (api.getActiveComp() !== comp) return;
        applyCleanup(collectActiveCompLayers(comp), "bracket");
    }

    moreButton.onClick = function () {
        ui.clearContextMenu();
        ui.addMenuItem({ name: "Renamer v" + TOOL_VERSION, enabled: false });
        ui.addMenuItem({
            name: "Clean up numbers",
            onMouseRelease: cleanUpNumbers
        });
        ui.addMenuItem({
            name: "Remove trailing bracket tags",
            onMouseRelease: removeBracketSuffixes
        });
        ui.showContextMenu();
    };

    function AppCallbacks() {
        this.onSelectionChanged = updatePreview;
        this.onCompChanged = updatePreview;
        this.onSceneChanged = updatePreview;
        this.onLayerRemoved = updatePreview;
    }
    ui.addCallbackObject(new AppCallbacks());

    ui.add(matchField);
    ui.add(patternField);
    ui.add(tokenRow);
    ui.add(startRow);
    ui.add(actionRow);
    ui.add(previewLabel);
    // Reserve the controls' height; the preview alone gives up space on a short dock.
    ui.add(previewList);
    var previewHeight = 68;
    ui.onResize = function () {
        var size = ui.size();
        var height = size.height || size.y;
        var nextHeight = Math.max(0, Math.floor(height - 267));
        if (nextHeight !== previewHeight) {
            previewHeight = nextHeight;
            previewList.setFixedHeight(nextHeight);
        }
    };
    updatePreview();
    ui.show();
    ui.onResize();
}());
