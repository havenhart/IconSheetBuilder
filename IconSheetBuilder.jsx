#target photoshop

// default values that define the icon sheet
var xoffset = 1;                                    // x pixels of white space between icons
var yoffset = 1;                                    // y pixels of white space between icons
var iconSize = 32;                                  // the size of the icon
var iconsPerRow = 5;                                // number of icons to have per row of the icon sheet
var cancelScript = false;                           // flag to stop the script
var doc = app.activeDocument;                       
var originalUnits = app.preferences.rulerUnits;

function main(){
    try{        
        getIconSheetBuilder().show();

        if(!cancelScript){
            // hide the utility layers
            setUtilityLayersState(false);

            // get the history state up to this point
            var currentState = doc.activeHistoryState;
            
            // set units to pixels
            app.preferences.rulerUnits = Units.PIXELS;

            // get the groups in the file (these represent the icons)
            var IconGroups = doc.layerSets;

            // get the bounding box of the icons
            var iconCount = IconGroups.length;
            var bbdim = getIconBoundingBoxDimensions(iconCount,iconsPerRow);

            // crop the image to the icon bounding box
            doc.crop(new Array(0, 0, bbdim.width, bbdim.height));            

            // create the descriptor file
            var isl = generateISL(IconGroups);

            // save the descriptor file
            var pth = saveISL(isl);

            // save the icon sheet
            exportIconSheet(pth);

            // set the ruler units back to the user specified units
            app.preferences.rulerUnits = originalUnits;

            // set the history state to the point before this process started
            doc.activeHistoryState = currentState;

            // show the utility layers
            setUtilityLayersState(true);
        }
    }catch(e){        
        showDebugInfo('error', e);        
        app.preferences.rulerUnits = originalUnits;
        doc.activeHistoryState = currentState;
        setUtilityLayersState(true);

        if(e.number == 9999){
            return;
        }
    }
}

function showDebugInfo(caption, value){
    // just press the Escape button to close this box.
    var dbg = new Window('dialog','Icon Sheet Builder');
    addTextToDialog(dbg,caption,value);
    dbg.show();
}

function exportIconSheet(path){
    var sheet = File(path);
    if(sheet.exists){
        sheet.remove();
    }
    doc.exportDocument(sheet, ExportType.SAVEFORWEB, getExportOptions());    
}

function saveISL(isl){
        var file = new File();
        var iconFile = file.saveDlg("Save IconList","Text File:*.txt");    
        var pth = iconFile.fsName.replace('.txt','.png');
        if(pth.indexOf('.') == -1){ pth = pth + '.png'; }
        iconFile.open('w');
        iconFile.write(isl + '\n' + pth);
        iconFile.close();    
    return pth;
}

function generateISL(groups){
    var isl = xoffset + ',' + yoffset + ',' + iconSize + ',' + iconsPerRow + '\n';
    for(i = groups.length -1; i >= 0; i--){
        isl += (i < (groups.length - 1) ? ',' : '') + groups[i].name;
    }
    return isl;
}

function setUtilityLayersState(show){
    var iconZones = doc.artLayers.getByName('IconZones');
    var backdrop = doc.artLayers.getByName('Backdrop');

    iconZones.visible = show;
    backdrop.visible = show;
}

function getExportOptions(){
    var opt = new ExportOptionsSaveForWeb();
    opt.format = SaveDocumentType.PNG;
    opt.PNG8 = false;
    opt.transparency = true;
    opt.interlaced = false;
    opt.includeProfile = false;
    return opt;
}

function getIconBoundingBoxDimensions(icons,perRow){
    // the width and heigh of the future IconSheet
    var iconsWidth = 0;
    var iconsHeight = 0;

    // If there are more than iconsPerRow groups, there will be multiple rows of icons
    if(icons <= perRow){
        iconsWidth = (xoffset + iconSize + xoffset) * icons;
        iconsHeight = (yoffset + iconSize + yoffset);
    }else{
        var totalRows = Math.ceil(icons / perRow);
        iconsWidth = (xoffset + iconSize + xoffset) * perRow;
        iconsHeight = (yoffset + iconSize + yoffset) * totalRows;
    }
    return { width: iconsWidth, height: iconsHeight };
}


function getIconSheetBuilder(){
    var dlg = new Window('dialog','Icon Sheet Builder');

    var xos = addTextToDialog(dlg, 'X Offset', xoffset);
    var yos = addTextToDialog(dlg, 'Y Offset', yoffset);
    var ics = addTextToDialog(dlg, 'Icon Size', iconSize);
    var ipr = addTextToDialog(dlg, 'Per Row', iconsPerRow);

    var bgrp = dlg.add('group');
    bgrp.alignment = 'right';
    var obtn = bgrp.add('button',undefined,'OK');
    obtn.onClick = function() {
        xoffset = parseInt(xos.text);
        yoffset = parseInt(yos.text);
        iconSize = parseInt(ics.text);
        iconsPerRow = parseInt(ipr.text);
        this.close();
    }
    var cbtn = bgrp.add('button',undefined,'Cancel');
    cbtn.onClick = function() { 
        cancelScript = true; 
        this.close();
    }
    
    return dlg;
}

function addTextToDialog(dlg, caption, value){
    var group = dlg.add('group');
    group.add('statictext {text: "' + caption + ': ",characters:20,justify: "left"}');
    var txt = group.add('edittext', undefined, value);
    txt.characters = 20;
    return txt;
}

main();

