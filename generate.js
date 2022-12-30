function makeSymbol(symbol){
    var symbolData = symbology[symbol];
    if (!('svg_uri' in symbolData)) {
        symbology[symbol]['html'] = symbol;
        //symbology[symbol]['cost_html'] = symbol;
    } else {
        symbology[symbol]['html'] = `<img src="${symbolData['svg_uri']}" title="${symbolData['english']}" alt="${symbol}" style="height: 1em; margin: 0px; display:inline;">`;
        //symbology[symbol]['cost_html'] = `<img src="${symbolData['svg_uri']}" title="${symbolData['english']}" alt="${symbol}" style="height: 1em; margin: 0px; margin-top: 0.1em;">`;
    }
}

function parseCost(costStr) {
    costStr = costStr.toUpperCase();
    if (!costStr.match(/^[A-Z0-9/\{\}]*$/)) {
        return "Only leters, numbers, slashes, and curly braces allowed.";
    }

    var symbolRegex = /\{.+?\}/g;

    let symbolMatches = [...costStr.matchAll(symbolRegex)];
    var nonSymbols = costStr.replaceAll(symbolRegex, '|').split('|');

    for (var i = 0; i < nonSymbols.length; i++) {
        if (nonSymbols[i].includes('/')) {
            return "Please wrap hybid costs in curly braces, e.g. {X/Y}";
        }

        var numericMatches = [... new Set(nonSymbols[i].match(/\d+/g))];
        var alphaMatches = [... new Set(nonSymbols[i].match(/[A-Z]/g))];
        var allMatches = numericMatches.concat(alphaMatches);

        allMatches.forEach(match => {
            nonSymbols[i] = nonSymbols[i].replaceAll(match, '{' + match + '}')
        });
    }

    var stitched = $.map(nonSymbols, function(v, i) {
        if (i < symbolMatches.length) {
            return [v, symbolMatches[i][0]];
        }
        return [v];
    });

    parsedCost = stitched.join('');

    return '';
}

function generate() {
    // TODO: rarity should be included somehow

    // Get the form element with jquery
    var form = $("form");

    // Enforce form requirements
    if (!form[0].checkValidity()) {
        // If the form is invalid, submit it. The form won't actually submit;
        // this will just cause the browser to display the native HTML5 error messages.
        $('<input type="submit">').hide().appendTo(form[0]).click().remove();
        return;
    }

    var outputData = `<div style="align-items: stretch; display: flex; flex-wrap: wrap; justify-content: space-evenly; line-height: 100%;">`;

    var formData = form.serializeArray().reduce(function(m,o){  m[o.name] = o.value; return m;}, {});

    // Add card image
    outputData += `<figure style="display: block; margin: 2px; position: relative; width: calc(50% - 4px);"><a href="${formData['imgurl']}"><img src="${formData['imgurl']}" alt="card image" style="height: 100%; margin: 0px; object-fit: cover; width: 100%;"></a></figure>`;

    // Start the text box
    outputData += `<div style="display: block; margin: 2px; position: relative; width: calc(50% - 4px); border: 1px solid black; border-top: 3px solid black; border-bottom: 3px solid black; border-radius: 4px; padding-left: 10px; padding-right: 10px;">`;

    // Build the card name / mana cost string and add it
    var titleStr = formData['cardname'];
    if (parsedCost != '') {
        var manacostRaw = parsedCost;
        for (symbol in symbology) {
            manacostRaw = manacostRaw.replaceAll(symbol, symbology[symbol]['html']);
        }
        titleStr += ' ' + manacostRaw;
    }
    outputData += `<h4 style="border-bottom: 1px solid #CCCCCC; margin-top: 0px; margin-bottom: 0px; padding-top: 10px; padding-bottom: 10px;">${titleStr}</h4>`;

    // Build the typeline string and add it
    var typeStr = formData['cardtype'];
    if (formData['cardsubtype'] != '') {
        typeStr += ' &mdash; ' + formData['cardsubtype'];
    }
    outputData += `<p style="border-bottom: 1px solid #CCCCCC; margin-top: 0px; margin-bottom: 0px; padding-top: 10px; padding-bottom: 10px;">${typeStr}</p>`;

    // Rules text
    if (formData['rulestext'] != '') {
        var rulesTextRaw = formData['rulestext'];

        for (symbol in symbology) {
            // rulesTextRaw = rulesTextRaw.replaceAll(' ' + symbol, '&nbsp;' + symbol);
            // rulesTextRaw = rulesTextRaw.replaceAll(symbol + ' ', symbol + '&nbsp;');
            rulesTextRaw = rulesTextRaw.replaceAll(symbol, symbology[symbol]['html']);
        }

        var rulesLines = rulesTextRaw.split('\n');

        for(var i=0; i < rulesLines.length; i++) {
            var style = [];
            if (i == 0) {
                style.push('margin-top: 0px; padding-top: 10px;');
            }

            if (i == rulesLines.length - 1) {
                style.push('margin-bottom: 0px; padding-bottom: 10px;');
            }

            var styleStr = '';
            if (style.length > 0) {
                styleStr = ' style="' + style.join(' ') + '"';
            }

            outputData += `<p${styleStr}>${rulesLines[i]}</p>`
        }
    }

    // Flavor text
    if (formData['flavortext'] != '') {
        var borderStyle = '';
        if (formData['rulestext'] != '') {
            borderStyle = 'border-top: 1px solid #CCCCCC; ';
        }

        outputData += `<p style="${borderStyle}margin-top: 0px; margin-bottom: 0px; padding-top: 10px; padding-bottom: 10px;"><i>${formData['flavortext']}</i></p>`
    }

    // Base P/T
    if (formData['basestats'] != '') {
        outputData += `<p style="border-top: 1px solid #CCCCCC; margin-top: 0px; margin-bottom: 0px; padding-top: 10px; padding-bottom: 10px;">${formData['basestats']}</p>`;
    }

    // Illustration credit
    if (formData['illustration'] != '') {
        outputData += `<p style="border-top: 1px solid #CCCCCC; margin-top: 0px; margin-bottom: 0px; padding-top: 10px; padding-bottom: 10px;">${formData['illustration']}</p>`;
    }

    // Finish up
    outputData += `</div></div><div style="text-align: right; font-size: min(1.87vw, 70%); opacity: 0.7; line-height: 100%;">card layout based on <a href="https://scryfall.com/">Scryfall</a> and @nex3's <a href="https://nex3.github.io/cohost-image-grid/">image grid generator</a></div>`

    navigator.clipboard.writeText(outputData);
}

var symbology;
var parsedCost = '';

$(document).ready(function(){
    $.getJSON("https://counterturns.github.io/cohost-mtg-card-layout/scryfall_symbology.json", function(json){
        symbology = json['data'].reduce(function(m,o){  m[o['symbol']] = o; return m;}, {});
        for (symbol in symbology){
            makeSymbol(symbol);
        }
    }).fail(function(){
        console.log("Failed to load symbology json.");
    });

    $('#manacost').bind('input', function() {
        this.setCustomValidity(parseCost($(this).val()));
    });
});