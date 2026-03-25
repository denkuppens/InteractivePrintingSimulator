// ***********************************************************************
// ***                             
// ***  Interactive Functional Inkjet Printing Simulator
// ***                             
// ***  Created by Dennis Kuppens - 2026 
// ***  Contact: https://linkedin.com/in/dennis-kuppens-5753a92                 
// ***
// *** Released under AGPL-3.0 license
// ***
// ***********************************************************************


var printheadNpi = 360; // Native nozzle per inch
var nrOfNozzles = 10;
var printheadDropsize = 4; // pL

var newCrossSectionHeight = 100;

var dotGain = 1.5; // the amount the drop spreads when it hits the substrate (multiplication of native dropsize diameter)

// Print resolution
var dpiX = 360 * 3; // dots per inch X direction. Best to use a multiple of the native printhead resolution.
var dpiY = 360 * 3; // dots per inch Y direction. Can be any resolution. 

// how much pixels to print
var gridSizeX = nrOfNozzles * (dpiX / printheadNpi); // or a fixed number
var gridSizeY = 10;

// Advanced parameters
var qualityFactor = 1; 	// IN BETA TESTING!

// viewing parameters
var drawResolution = 1; // how many pixels is 1 um (does not work at the moment)
var darkenDotsPerPass = true; // make dots darker per print pass or not

let mx = [];
let my = [];
let jet = [];
let jetted = [];
let pass = [];
let numX = 20;
let numY = 20;
let spacingX = 20;
let spacingY = 20;
let diam = 15;
let showPasses = 999;
let divImagePix;

var canvasWidth = 1600;
var canvasHeight = 1200;
let userImage = null;
let userImageLoadingComplete = false;
let textbox;

let mainP = new p5(mainCanvas, 'mainPane');
new p5(crossSectionCanvas, 'crossPane');

var m_numberOfPrintedDrops = 0;

function mainCanvas(p){
	p.setup = function(){
		setupMain(p);
	}
	
	p.draw = function(){
		drawMain(p);
	}
	
	p.mouseDragged = function(){
		mouseDragged(p);
	}
	
	p.mousePressed = function(){
		mousePressed(p);
	}
	
	p.mouseReleased = function(){
		mouseReleased(p);
	}
	
	p.windowResized = function(){
		windowResized(p);
	}
	
	p.keyPressed = function(){
		keyPressed(p);
	}

	p.handleImage = function(){
		handleImage(p);
	}

}



function crossSectionCanvas(p){
	
	p.setup = function(){
		p.frameRate(8);
		var clientHeight = document.getElementById('crossPane').clientHeight - 2;
		var clientWidth = document.getElementById('crossPane').clientWidth;
		crossPaneCanvas = p.createCanvas(clientWidth, clientHeight);
		crossPaneCanvas.parent('crossPane');
	}
	
	p.draw = function(){
		p.background(240);
		drawCrossSection(p);
	}	
	
	p.windowResized = function(){
		windowResizedCross(p);
	}
}




function dragElement(elmnt) {
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  if (document.getElementById(elmnt.id + "Header")) {
    /* if present, the header is where you move the DIV from:*/
    document.getElementById(elmnt.id + "Header").onmousedown = dragMouseDown;
  } else {
    /* otherwise, move the DIV from anywhere inside the DIV:*/
    elmnt.onmousedown = dragMouseDown;
  }

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
  }

  function closeDragElement() {
    /* stop moving when mouse button is released:*/
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

function toolTip(msg){
	p.text(msg, p.mouseX, p.mouseY);
}

function windowResized(p) {
  	let clientHeight = canvasHeight;
	let clientWidth = document.getElementById('mainPane').clientWidth;
	p.resizeCanvas(clientWidth, clientHeight);
}

function windowResizedCross(p) {
	let clientHeight = document.getElementById('crossPane').clientHeight - 2;
	let clientWidth = document.getElementById('crossPane').clientWidth;
	p.resizeCanvas(clientWidth, clientHeight);
}

function setupMain(p) {
    p.frameRate(8);
    //noLoop();


	
	var clientHeight = canvasHeight;
	var clientWidth = document.getElementById('mainPane').offsetWidth;
	var canvas = p.createCanvas(clientWidth, clientHeight);
	canvas.parent('mainPane');
    p.textFont('Courier New');


    // position all controls at the left side in a column
	let txtXPos = 10;
    let ctrlXPos = 20;
    let ctrlYPos = 0;
    let ctrlYSpacing = 34;
	ctrlYpos = document.getElementById('leftPane').getBoundingClientRect().top;
	ctrlXpos = document.getElementById('leftPane').getBoundingClientRect().left+20;
	txtXPos = ctrlXpos-20;
	
	animatePrintButton = p.createButton('Start Printing');
	animatePrintButton.parent("headerLeft");
	animatePrintButton.class('centerBtn');
    // animatePrintButton.position(ctrlXPos, ctrlYSpacing / 3, 'absolute');
	// animatePrintButton.style('fontFamily', 'Courier New');
	// animatePrintButton.style('fontSize', '15px');
	// animatePrintButton.style('font-weight', 'bold');
	// animatePrintButton.style('background-color', color('lime'));
	animatePrintButton.mousePressed(startAnimation);
	
	spanImg = new PsSpan(p, 'Image Parameters', 0, ctrlYPos);
	sliderImgWidthUm = new PsSliderWithText(p, 10, 2000, 500, 10, 'Img width ${value/1000} mm', ctrlXPos, ctrlYPos += ctrlYSpacing/1.2, '');
	sliderImgHeightUm = new PsSliderWithText(p, 10, 2000, 500, 10, 'Img height ${value/1000} mm', ctrlXPos, ctrlYPos += ctrlYSpacing, '');

	/*
	sliderImgHeightUm = createSlider(10, 2000, 500, 10);
	sliderImgHeightUm.parent("leftPane");
    sliderImgHeightUm.position(ctrlXPos, ctrlYPos += ctrlYSpacing);
    sliderImgHeightUm.size(150);
	*/
	
	//ctrlYPos -= ctrlYSpacing / 8;
	//divImagePix = createDiv('');
	//divImagePix.position(ctrlXPos, ctrlYPos += ctrlYSpacing);
	
	// sliderImgResolutionX = createSlider(100, 4800, 500);
    // sliderImgResolutionX.position(ctrlXPos, ctrlYPos += ctrlYSpacing + 5);
    // sliderImgResolutionX.size(150);	
	
	sliderImgResolutionX = new PsSliderWithText(p, 100, 4800, 500, 1, 'Img resolution x ${value} dpi', ctrlXPos, ctrlYPos += ctrlYSpacing + 5);
	
	// sliderImgResolutionY = createSlider(100, 4800, 500);
    // sliderImgResolutionY.position(ctrlXPos, ctrlYPos += ctrlYSpacing);
    // sliderImgResolutionY.size(150);		
	
	sliderImgResolutionY = new PsSliderWithText(p, 100, 4800, 500, 1, 'Img resolution y ${value} dpi', ctrlXPos, ctrlYPos += ctrlYSpacing);
	
    checkboxImgResolutionSameAsPrintResolution = p.createCheckbox("Same as print resolution", true);
	checkboxImgResolutionSameAsPrintResolution.parent('leftPane');
	checkboxImgResolutionSameAsPrintResolution.style('fontFamily', 'Courier New');
	checkboxImgResolutionSameAsPrintResolution.style('fontSize', 'small');
    checkboxImgResolutionSameAsPrintResolution.position(ctrlXPos, ctrlYPos += ctrlYSpacing - 10);	
	checkboxImgResolutionSameAsPrintResolution.changed(onCheckBoxImgResolutionSameAsPrintResolutionChanged);
	onCheckBoxImgResolutionSameAsPrintResolutionChanged();
	
	ctrlYPos += 4;
	
    checkboxGrid = p.createCheckbox("Show Image Grid", true);
	checkboxGrid.parent('leftPane');
	checkboxGrid.style('fontFamily', 'Courier New');
	checkboxGrid.style('fontSize', 'small');	
    checkboxGrid.position(ctrlXPos, ctrlYPos += ctrlYSpacing / 1.8);

    checkboxImagePix =p.createCheckbox("Show Image pixels", true);
	checkboxImagePix.parent('leftPane');
	checkboxImagePix.style('fontFamily', 'Courier New');
	checkboxImagePix.style('fontSize', 'small');	
    checkboxImagePix.position(ctrlXPos, ctrlYPos += ctrlYSpacing / 1.8);

	ctrlYPos -= 10;
    radioBtnShape = p.createRadio();
	radioBtnShape.parent('leftPane');
	radioBtnShape.style('fontFamily', 'Courier New');
	radioBtnShape.style('fontSize', 'small');
	radioBtnShape.style("line-height", "1");
	radioBtnShape.style("align-items","left");
    radioBtnShape.option(0, 'fill<br>');
    radioBtnShape.option(1, 'Vertical line<br>');
    radioBtnShape.option(2, 'Hor. line<br>');
    radioBtnShape.option(3, 'Rectangle<br>');
	radioBtnShape.option(4, 'Circle<br>');
    radioBtnShape.option(5, 'Checker_board<br>');
	radioBtnShape.option(6, 'Free draw<br>');
    radioBtnShape.selected('4');
    radioBtnShape.position(ctrlXPos, ctrlYPos += ctrlYSpacing);
    radioBtnShape.size(130);


    ctrlYPos += 110;

    // sliderLineWidth = createSlider(1, 10, 1);
    // sliderLineWidth.position(ctrlXPos, ctrlYPos += ctrlYSpacing);
    // sliderLineWidth.size(150);
	// sliderLineWidth.value(2);

	sliderLineWidth = new PsSliderWithText(p, 1, 10, 2, 1, 'Line width ${value}', ctrlXPos, ctrlYPos += ctrlYSpacing);



    checkboxInvertShape =p.createCheckbox("Invert Shape", false);
	checkboxInvertShape.parent('leftPane');
	checkboxInvertShape.style('fontFamily', 'Courier New');
	checkboxInvertShape.style('fontSize', 'small');	
    checkboxInvertShape.position(ctrlXPos, ctrlYPos += ctrlYSpacing / 1.6);

    // span = createSpan('PRINTHEAD PARAMETERS');
    // span.position(txtXPos, ctrlYPos += ctrlYSpacing);
	// span.style('fontFamily', 'Courier New');
	// span.style('font-weight', 'bold');
	// span.style('width', '200px');
	// span.style('background-color', '#B0B0B0');

	phSpan = new PsSpan(p, 'Printhead Parameters', 0, ctrlYPos += ctrlYSpacing, true);



    ctrlYPos -= ctrlYSpacing / 4;
	
    dropDwnPh = p.createSelect();
	dropDwnPh.parent('leftPane');
    dropDwnPh.option('Printhead');
    dropDwnPh.option('DMC Samba');
    dropDwnPh.option('Spectra SE');
    dropDwnPh.option('Spectra ME');
    dropDwnPh.option('Spectra LE');
    dropDwnPh.option('KM512 SHE');
    dropDwnPh.option('KM512 MHE');
    dropDwnPh.option('KM512 LHE');
	dropDwnPh.option('CANON C29 HM');
	dropDwnPh.option('Q-Class/10');
	dropDwnPh.option('Q-Class/30');
	dropDwnPh.option('Q-Class/80');
	dropDwnPh.option('KM1024i SHE');
	dropDwnPh.option('KM1024i MHE');
	dropDwnPh.option('KM1024i LHE');
	dropDwnPh.option('KM1800iSHC');
	dropDwnPh.option('EPSON I3200 300dpi');
	dropDwnPh.option('EPSON I3200 600dpi');
	dropDwnPh.option('EPSON I3200 1200dpi');
    dropDwnPh.option('SAMBA G3L');
	//dropDwnPh.option('Durst RockJET');
	dropDwnPh.option('Epson D3000-A1R');
	dropDwnPh.option('Epson F1440-A1');
	dropDwnPh.option('Epson I1600-U1');
	dropDwnPh.option('Epson I1600-E1');
	dropDwnPh.option('Epson I1600-A1');
	dropDwnPh.option('Epson I3200-U1');
	dropDwnPh.option('Epson I3200-E1');
	dropDwnPh.option('Epson I3200-A1');
	dropDwnPh.option('Epson L1440-U2');
	dropDwnPh.option('Epson L1440-A1');
	dropDwnPh.option('Epson S800-U3');
	dropDwnPh.option('Epson S800-U1');
	dropDwnPh.option('Epson S800-A1');
	dropDwnPh.option('Epson S1600-U1');
	dropDwnPh.option('Epson S3200-U1');
	dropDwnPh.option('Epson S3200-U3');
	dropDwnPh.option('Epson S3200-A1');
	dropDwnPh.option('Epson T1600-U3');
	dropDwnPh.option('Epson T3200-U3');
	dropDwnPh.option('Fujifilm Emerald QE-256/30');
	dropDwnPh.option('Fujifilm Emerald QE-256/80');
	dropDwnPh.option('Fujifilm Galaxy JA 256/30');
	dropDwnPh.option('Fujifilm Galaxy JA 256/50');
	dropDwnPh.option('Fujifilm Galaxy JA 256/80');
	dropDwnPh.option('Fujifilm Galaxy PH 256/30');
	dropDwnPh.option('Fujifilm Galaxy PH 256/50');
	dropDwnPh.option('Fujifilm Galaxy PH 256/80');
	dropDwnPh.option('Fujifilm Galaxy PH 256/30 HM');
	dropDwnPh.option('Fujifilm Galaxy PH 256/80 HM');
	dropDwnPh.option('Fujifilm Nova JA 256/80');
	dropDwnPh.option('Fujifilm Nova PH 256/80');
	dropDwnPh.option('Fujifilm Polaris PQ-512/15');
	dropDwnPh.option('Fujifilm Polaris PQ-512/35');
	dropDwnPh.option('Fujifilm Polaris PQ-512/85');
	dropDwnPh.option('Fujifilm Samba G3L');
	dropDwnPh.option('Fujifilm Samba G5L');
	dropDwnPh.option('Fujifilm Sapphire QS-256/10');
	dropDwnPh.option('Fujifilm Sapphire QS-256/30');
	dropDwnPh.option('Fujifilm Sapphire QS-256/80');
	dropDwnPh.option('Fujifilm SE-128 AA');
	dropDwnPh.option('Fujifilm SM-128 AA');
	dropDwnPh.option('Fujifilm SL-128 AA');
	dropDwnPh.option('Fujifilm Skyfire SF600');
	dropDwnPh.option('Fujifilm Starfire SG1024/L3F');
	dropDwnPh.option('Fujifilm Starfire SG1024/LA2Ci');
	dropDwnPh.option('Fujifilm Starfire SG1024/LC');
	dropDwnPh.option('Fujifilm Starfire SG1024/MA2C');
	dropDwnPh.option('Fujifilm Starfire SG1024/MA');
	dropDwnPh.option('Fujifilm Starfire SG1024/MC');
	dropDwnPh.option('Fujifilm Starfire SG1024/SA2C');
	dropDwnPh.option('Fujifilm Starfire SG1024/SA');
	dropDwnPh.option('Fujifilm Starfire SG1024/SC');
	dropDwnPh.option('Fujifilm Starfire SG1024/XSA');
	dropDwnPh.option('Fujifilm Starfire SG600');
	dropDwnPh.option('Konica Minolta KM512LNX');
	dropDwnPh.option('Konica Minolta KM512LHX');
	dropDwnPh.option('Konica Minolta KM512MNX');
	dropDwnPh.option('Konica Minolta KM512MHX');
	dropDwnPh.option('Konica Minolta KM512LNX-35');
	dropDwnPh.option('Konica Minolta KM512iMAB-C');
	dropDwnPh.option('Konica Minolta KM800');
	dropDwnPh.option('Konica Minolta KM800-D');
	dropDwnPh.option('Konica Minolta KM1024LHB');
	dropDwnPh.option('Konica Minolta KM1024LNB');
	dropDwnPh.option('Konica Minolta KM1024MHB');
	dropDwnPh.option('Konica Minolta KM1024MNB');
	dropDwnPh.option('Konica Minolta KM1024SHB');
	dropDwnPh.option('Konica Minolta KM1024aSHE');
	dropDwnPh.option('Konica Minolta KM1024aLHG-RC');
	dropDwnPh.option('Konica Minolta KM1024aSHG-RC');
	dropDwnPh.option('Konica Minolta KM1024iMAE-C');
	dropDwnPh.option('Konica Minolta KM1024iSAE-C');
	dropDwnPh.option('Konica Minolta KM1024iLHE');
	dropDwnPh.option('Konica Minolta KM1024iMHE');
	dropDwnPh.option('Konica Minolta KM1024iSHE');
	dropDwnPh.option('Konica Minolta KM1280iMHH');
	dropDwnPh.option('Konica Minolta KM1600');
	dropDwnPh.option('Konica Minolta KM1800iSHC');
	dropDwnPh.option('Kyocera KJ4A-AA');
	dropDwnPh.option('Kyocera KJ4A-TA');
	dropDwnPh.option('Kyocera KJ4A-RH');
	dropDwnPh.option('Kyocera KJ4A-0300');
	dropDwnPh.option('Kyocera KJ4B-0300');
	dropDwnPh.option('Kyocera KJ4B-1200');
	dropDwnPh.option('Kyocera KJ4B-EX 600');
	dropDwnPh.option('Kyocera KJ4B-EX600-RC');
	dropDwnPh.option('Kyocera KJ4B-EX1200-RC');
	dropDwnPh.option('Kyocera KJ4B-QA');
	dropDwnPh.option('Kyocera KJ4B-YH');
	dropDwnPh.option('Kyocera KJ4C-0360');
	dropDwnPh.option('Memjet VersaPass');
	dropDwnPh.option('Memjet DuraLink');
	dropDwnPh.option('Memjet DuraFlex');
	dropDwnPh.option('Memjet DuraBolt');
	dropDwnPh.option('Memjet DuraBolt');
	dropDwnPh.option('Memjet DuraBolt Bar');
	dropDwnPh.option('Ricoh GH2220');
	dropDwnPh.option('Ricoh MH2420');
	dropDwnPh.option('Ricoh MH2620');
	dropDwnPh.option('Ricoh MH2810F');
	dropDwnPh.option('Ricoh MH2910F');
	dropDwnPh.option('Ricoh MH2820');
	dropDwnPh.option('Ricoh MH5220');
	dropDwnPh.option('Ricoh MH5320');
	dropDwnPh.option('Ricoh MH5340');
	dropDwnPh.option('Ricoh MH5420');
	dropDwnPh.option('Ricoh MH5440');
	dropDwnPh.option('Ricoh MH5421');
	dropDwnPh.option('Ricoh MH5441');
	dropDwnPh.option('Ricoh MH5421F');
	dropDwnPh.option('Ricoh MH5421MF');
	dropDwnPh.option('Ricoh MH5422');
	dropDwnPh.option('Ricoh MH5442');
	dropDwnPh.option('Ricoh TH5241');
	dropDwnPh.option('Ricoh TH6310F');
	dropDwnPh.option('Toshiba/RISO Tec CF1B');
	dropDwnPh.option('Toshiba/RISO Tec CF1BL');
	dropDwnPh.option('Toshiba/RISO Tec CF1BXL');
	dropDwnPh.option('Toshiba/RISO Tec CF3');
	dropDwnPh.option('Toshiba/RISO Tec CF3R');
	dropDwnPh.option('Toshiba/RISO Tec CF6R');
	dropDwnPh.option('Toshiba/RISO Tec CX1');
	dropDwnPh.option('Seiko 508GS');
	dropDwnPh.option('Seiko RC1536-M');
	dropDwnPh.option('Seiko RC1536-L');
	dropDwnPh.option('Seiko RCE2560');
	dropDwnPh.option('Quantica NovoJet X');
	dropDwnPh.option('Quantica NovoJet 1');
	dropDwnPh.option('Xaar 128/80L');
	dropDwnPh.option('Xaar 128/40L');
	dropDwnPh.option('Xaar 128/80W');
	dropDwnPh.option('Xaar 128/40W');
	dropDwnPh.option('Xaar 501 GS8 O');
	dropDwnPh.option('Xaar 501 GS8 OR');
	dropDwnPh.option('Xaar 501 GS8 U');
	dropDwnPh.option('Xaar 501 GS8 UR');
	dropDwnPh.option('Xaar 502 GS15 O');
	dropDwnPh.option('Xaar 502 GS15 OR');
	dropDwnPh.option('Xaar 502 GS15 S180');
	dropDwnPh.option('Xaar 502 GS15 S360');
	dropDwnPh.option('Xaar 1003 GS6C');
	dropDwnPh.option('Xaar 1003 GS12C');
	dropDwnPh.option('Xaar 1003 GS40C');
	dropDwnPh.option('Xaar 1003 GS6U');
	dropDwnPh.option('Xaar 1003 GS12U');
	dropDwnPh.option('Xaar 1003 GS40U');
	dropDwnPh.option('Xaar 1003 AMx');
	dropDwnPh.option('Xaar 1003 AMp');
	dropDwnPh.option('Xaar 2001+ GS6C');
	dropDwnPh.option('Xaar 2001+ GS12C');
	dropDwnPh.option('Xaar 2001+ GS40C');
	dropDwnPh.option('Xaar 2001+ GS6U');
	dropDwnPh.option('Xaar 2001+ GS12U');
	dropDwnPh.option('Xaar 2001+ GS40U');
	dropDwnPh.option('Xaar 2002 6');
	dropDwnPh.option('Xaar 2002 12');
	dropDwnPh.option('Xaar 2002 40');
	dropDwnPh.option('Xaar Aquinox 6');
	dropDwnPh.option('Xaar Aquinox 12');
	dropDwnPh.option('Xaar Irix');
	dropDwnPh.option('Xaar Nitrox Core');
	dropDwnPh.option('Xaar Nitrox Pro');
	dropDwnPh.option('Xaar Nitrox Elite');
	dropDwnPh.option('Xerox MDF');
	dropDwnPh.option('Xerox W1 40kHz');
	dropDwnPh.option('Xerox WD1/WD2 64kHz');
	dropDwnPh.option('Xerox WD1/WD2 80kHz');
    dropDwnPh.position(ctrlXPos, ctrlYPos += ctrlYSpacing);
    dropDwnPh.changed(changePrintHead);

	


    // let presetText = createSpan('Preset: ');
    // presetText.position(ctrlXPos, ctrlYPos+5);
	// presetText.style('fontFamily', 'Courier New');
	// presetText.style('fontSize', 'small');
	
    //ctrlYPos += ctrlYSpacing / 2;
	//ctrlYPos -= ctrlYSpacing / 4;

    // sliderDropsize = createSlider(1.0, 200.0, 6, 0.1);
    // sliderDropsize.position(ctrlXPos, ctrlYPos += ctrlYSpacing);
    // sliderDropsize.size(150);
	// sliderDropSize.mouseOver(toolTip('Dropsize is fixed to a specific type of printhead.'));


	sliderDropsize = new PsSliderWithText(p, 1.0, 200.0, 6, 0.1, 'Drop volume: ${value}pL', ctrlXPos, ctrlYPos += ctrlYSpacing, 'Drop size of the printhead');

    // sliderPrintheadNpi = createSlider(50, 1200, 360);
    // sliderPrintheadNpi.position(ctrlXPos, ctrlYPos += ctrlYSpacing);
    // sliderPrintheadNpi.size(150);
	
	sliderPrintheadNpi = new PsSliderWithText(p, 50, 1200, 360, 1, 'Nozzles per Inch: ${value}', ctrlXPos, ctrlYPos += ctrlYSpacing);

	sliderPrintheadAngle = new PsSliderWithText(p, 0, 90, 0, 0.1, 'Printhead angle: ${value} deg', ctrlXPos, ctrlYPos += ctrlYSpacing, 'Changeing the angle virtually decreases the nozzle pitch');


    // sliderNrNozzles = createSlider(1, 15, 10);
    // sliderNrNozzles.position(ctrlXPos, ctrlYPos += ctrlYSpacing);
    // sliderNrNozzles.size(150);
	
	sliderNrNozzles = new PsSliderWithText(p, 1, 15, 10, 1, 'Show ${value} of ${printheadTotalNrOfNozzles} nozzles', ctrlXPos, ctrlYPos += ctrlYSpacing);
	
	sliderShowBigPasses = new PsSliderWithText(p, 1, 8, 2, 1, 'Nr of printheads ${value}', ctrlXPos, ctrlYPos += ctrlYSpacing);



    // spanPrintRes = createSpan('PRINT RESOLUTION');
    // spanPrintRes.position(txtXPos, ctrlYPos += ctrlYSpacing);
	// spanPrintRes.style('fontFamily', 'Courier New');
	// spanPrintRes.style('font-weight', 'bold');
	// spanPrintRes.style('background-color', '#B0B0B0');
	// spanPrintRes.style('width', '200px');
	
	spanPrintRes = new PsSpan(p, 'Print Resolution', 0, ctrlYPos += ctrlYSpacing);
	
    ctrlYPos += ctrlYSpacing / 12;

    // sliderXRes = createSlider(0, 15, 1);
    // sliderXRes.position(ctrlXPos, ctrlYPos += ctrlYSpacing);
    // sliderXRes.size(150);
	
	sliderXRes = new PsSliderWithText(p, 0, 15, 1, 1, 'X resolution: ${(value+1)*sliderPrintheadNpi.value()} dpi', ctrlXPos, ctrlYPos += ctrlYSpacing);

    // sliderYRes = createSlider(10, 4800, 720);
    // sliderYRes.position(ctrlXPos, ctrlYPos += ctrlYSpacing);
    // sliderYRes.size(150);

	sliderYRes = new PsSliderWithText(p, 10, 4800, 720, 1, 'Y resolution: ${value} dpi', ctrlXPos, ctrlYPos += ctrlYSpacing);


    checkboxLinkXYres =p.createCheckbox('link xy resolution', true);
	checkboxLinkXYres.parent('leftPane');
	checkboxLinkXYres.style('fontFamily', 'Courier New');
	checkboxLinkXYres.style('fontSize', 'small');
    checkboxLinkXYres.position(ctrlXPos, ctrlYPos += ctrlYSpacing - 15);

	// spanPrintStrat = createSpan('PRINT STRATEGY');
    // spanPrintStrat.position(txtXPos, ctrlYPos += ctrlYSpacing);
	// spanPrintStrat.style('fontFamily', 'Courier New');
	// spanPrintStrat.style('font-weight', 'bold');
	// spanPrintStrat.style('background-color', '#B0B0B0');
	// spanPrintStrat.style('width', '200px');
	
	spanPrintStrat = new PsSpan(p, 'Print Strategy', 0, ctrlYPos += ctrlYSpacing);
	
    ctrlYPos += ctrlYSpacing / 12;

	checkboxBiDirectional =p.createCheckbox("Bidirectional", true);
	checkboxBiDirectional.parent('leftPane');
    checkboxBiDirectional.position(ctrlXPos, ctrlYPos += ctrlYSpacing/2);
	checkboxBiDirectional.style('fontFamily', 'Courier New');
	checkboxBiDirectional.style('fontSize', 'small');
		
    checkboxDots =p.createCheckbox("Show printed dots", true);
	checkboxDots.parent('leftPane');
	checkboxDots.style('fontFamily', 'Courier New');
	checkboxDots.style('fontSize', 'small');	
    checkboxDots.position(ctrlXPos, ctrlYPos += ctrlYSpacing/1.7);

    checkboxNozzleNrs =p.createCheckbox("Show nozzle & pass nr", false);
	checkboxNozzleNrs.parent('leftPane');
	checkboxNozzleNrs.style('fontFamily', 'Courier New');
	checkboxNozzleNrs.style('fontSize', 'small');	
    checkboxNozzleNrs.position(ctrlXPos, ctrlYPos += ctrlYSpacing/1.7);
	
    checkboxDarkenDots =p.createCheckbox("Darken each pass", false);
	checkboxDarkenDots.parent('leftPane');
    checkboxDarkenDots.position(ctrlXPos, ctrlYPos += ctrlYSpacing/1.7);
	checkboxDarkenDots.style('fontFamily', 'Courier New');
	checkboxDarkenDots.style('fontSize', 'small');
	
	sliderShowPasses = new PsSliderWithText(p, 1, 32, 32, 1, 'Show steps up to ${value}', ctrlXPos, ctrlYPos += ctrlYSpacing);
	
	sliderQualityFactor = new PsSliderWithText(p, 1, 5, 1, 1, 'QualityFactor ${value}', ctrlXPos, ctrlYPos += ctrlYSpacing);
	
	checkboxCompensateDefectNzls =p.createCheckbox("Compensate", true);
	checkboxCompensateDefectNzls.parent('leftPane');
    checkboxCompensateDefectNzls.position(ctrlXPos, ctrlYPos += ctrlYSpacing/1.5);
	checkboxCompensateDefectNzls.style('fontFamily', 'Courier New');
	checkboxCompensateDefectNzls.style('fontSize', 'small');	
	
    // checkboxDemoAnimation =p.createCheckbox("Animate", false);
    // checkboxDemoAnimation.position(ctrlXPos, ctrlYPos += ctrlYSpacing/2);
	// checkboxDemoAnimation.style('fontFamily', 'Courier New');
	// checkboxDemoAnimation.style('fontSize', 'small');

	ctrlYPos -= 5;
		
    // spanWetting = createSpan('INK PARAMETERS');
	// spanWetting.style('fontFamily', 'Courier New');
	// spanWetting.style('font-weight', 'bold')
    // spanWetting.position(txtXPos, ctrlYPos += ctrlYSpacing);
	// spanWetting.style('background-color', '#B0B0B0');
	// spanWetting.style('width', '200px');
	
	spanWetting = new PsSpan(p, 'Ink Parameters', 0, ctrlYPos += ctrlYSpacing);
	
    ctrlYPos -= ctrlYSpacing / 4;

	colorPicker = p.createColorPicker('rgb(0,255,0)');
	colorPicker.parent('leftPane');
	colorPicker.position(ctrlXPos+80, ctrlYPos += ctrlYSpacing/1.2);
    
	colorText = p.createSpan('Color: ');
	colorText.parent('leftPane');
    colorText.position(ctrlXPos+10, ctrlYPos+10);
	colorText.style('fontFamily', 'Courier New');
	colorText.style('fontSize', 'small');
	ctrlYPos += 10;
	
    // sliderDotGain = createSlider(9, 100, 15);
    // sliderDotGain.position(ctrlXPos, ctrlYPos += ctrlYSpacing);
    // sliderDotGain.size(150);
	
	sliderSolidContent = new PsSliderWithText(p, 1, 100, 100, 1, 'Solid content ${value}%', ctrlXPos, ctrlYPos += ctrlYSpacing);
	
	spanWetting = new PsSpan(p, 'Ink/Substrate interaction', 0, ctrlYPos += ctrlYSpacing);
	
	
	sliderDotGain = new PsSliderWithText(p, 9, 100, 15, 1, 'Wetting Dot gain: ${(value/10)}x', ctrlXPos, ctrlYPos += ctrlYSpacing);

    // sliderSolidContent = createSlider(1, 100, 40);
    // sliderSolidContent.position(ctrlXPos, ctrlYPos += ctrlYSpacing);
    // sliderSolidContent.size(150);
	


	sliderPlanarization = new PsSliderWithText(p, 1, 50, 5, 1, 'Planarization time value ${value}', ctrlXPos, ctrlYPos += ctrlYSpacing);

	spanWetting = new PsSpan(p, 'Other options', 0, ctrlYPos += ctrlYSpacing);
	
    

	// animatePrintButton = createButton('Start Printing');
    // animatePrintButton.position(ctrlXPos, ctrlYPos += ctrlYSpacing);
	// animatePrintButton.style('fontFamily', 'Courier New');
	// animatePrintButton.style('fontSize', 'small');
	// animatePrintButton.mousePressed(startAnimation);
	
	checkboxLoopAnimation =p.createCheckbox("Loop animation", false);
	checkboxLoopAnimation.parent('leftPane');
    checkboxLoopAnimation.position(ctrlXPos, ctrlYPos += ctrlYSpacing/1.5);
	checkboxLoopAnimation.style('fontFamily', 'Courier New');
	checkboxLoopAnimation.style('fontSize', 'small');
	
	checkboxJetAnimation =p.createCheckbox("Drop jet animation", false);
	checkboxJetAnimation.parent('leftPane');
    checkboxJetAnimation.position(ctrlXPos, ctrlYPos += ctrlYSpacing/1.5);
	checkboxJetAnimation.style('fontFamily', 'Courier New');
	checkboxJetAnimation.style('fontSize', 'small');

	// sliderCrossSectionYPos = createSlider(1, 100, 10);
    // sliderCrossSectionYPos.position(ctrlXPos, ctrlYPos += ctrlYSpacing + 5);
    // sliderCrossSectionYPos.size(150);	
	sliderCrossSectionYPos = new PsSliderWithText(p, 1, 100, 10, 1, 'Cross section pos ${value}', ctrlXPos, ctrlYPos += ctrlYSpacing);

	// sliderPlanarization = createSlider(1, 50, 5);
    // sliderPlanarization.position(ctrlXPos, ctrlYPos += ctrlYSpacing + 5);
    // sliderPlanarization.size(150);		


	
	saveSettingsButton = p.createButton('Save');
	saveSettingsButton.parent("leftPane");
    // animatePrintButton.position(ctrlXPos, ctrlYSpacing / 3, 'absolute');
	// animatePrintButton.style('fontFamily', 'Courier New');
	// animatePrintButton.style('fontSize', '15px');
	// animatePrintButton.style('font-weight', 'bold');
	// animatePrintButton.style('background-color', color('lime'));
	saveSettingsButton.mousePressed(saveSettings);
	saveSettingsButton.position(ctrlXPos, ctrlYPos += ctrlYSpacing);
	
	loadSettingsButton = p.createButton('Load');
	loadSettingsButton.parent("leftPane");
    // animatePrintButton.position(ctrlXPos, ctrlYSpacing / 3, 'absolute');
	// animatePrintButton.style('fontFamily', 'Courier New');
	// animatePrintButton.style('fontSize', '15px');
	// animatePrintButton.style('font-weight', 'bold');
	// animatePrintButton.style('background-color', color('lime'));
	loadSettingsButton.mousePressed(loadSettings);
	loadSettingsButton.position(ctrlXPos, ctrlYPos += ctrlYSpacing);
	
	textbox = p.createElement('textarea');
	textbox.size(220, 300);
	textbox.attribute("readonly", "");
	textbox.style("caret-color", "transparent");
	textbox.style("font-size", "14px");
    textbox.style("padding", "8px");		
	
	imageFileInput = p.createFileInput(handleImage);
	imageFileInput.parent('leftPane');
	imageFileInput.position(ctrlXPos, ctrlYPos += ctrlYSpacing);
	
	spanEnd = new PsSpan(p, '.', 0, ctrlYPos += ctrlYSpacing);
	// update the default PH selection
	dropDwnPh.selected('KM512 SHE');
	changePrintHead();
}

const qfMask1pass = [[0]];

const qfMask2pass = [[0, 1],
				     [1, 0]];

const qfMask3pass = [[0, 1, 2],
				     [2, 0, 1],
					 [1, 2, 0]];

const qfMask4pass = [[0, 1, 2, 3],
				     [3, 0, 1, 2],
					 [2, 3, 0, 1],
					 [1, 2, 3, 0]];


const qfMask5pass = [[0, 2, 4, 1, 3],
				     [3, 0, 1, 4, 2],
					 [1, 4, 3, 2, 0],
					 [4, 3, 2, 0, 1],
					 [2, 1, 0, 3, 4]];
					 
let qualityFactorMask = qfMask1pass;


let centerX = 50;
let centerY = 70;
let printheadTotalNrOfNozzles = 10;

function saveSettings(){
	mainP.storeItem('imgWidth', sliderImgWidthUm.value());
	mainP.storeItem('imgHeight', sliderImgHeightUm.value());
	mainP.storeItem('printheadtype', dropDwnPh.value());
	mainP.storeItem('qualityFactor', sliderQualityFactor.value());
	mainP.storeItem('shape', radioBtnShape.value());
	mainP.storeItem('dotGain', sliderDotGain.value());
	
}

function loadSettings(){
	sliderImgWidthUm.value(mainP.getItem('imgWidth'));	
	sliderImgHeightUm.value(mainP.getItem('imgHeight'));	
	dropDwnPh.value(mainP.getItem('printheadtype'));
	sliderQualityFactor.value(mainP.getItem('qualityFactor'));
	radioBtnShape.selected(mainP.getItem('shape'));
	sliderDotGain.value(mainP.getItem('dotGain'));
	changePrintHead();
}

function onCheckBoxImgResolutionSameAsPrintResolutionChanged(){
	let checked = checkboxImgResolutionSameAsPrintResolution.checked();

	sliderImgResolutionX.enabled(!checked);
	sliderImgResolutionY.enabled(!checked);
	
	if(checked){
		sliderImgResolutionX.value( dpiX );
		sliderImgResolutionY.value( dpiY );
	}
}

let selectedPrintheadNpi = 50;

function changePrintHead() {
    ph = dropDwnPh.value();
    switch (ph) {
        case 'DMC Samba':
            sliderDropsize.value(2.4);
            sliderPrintheadNpi.value(75);
            sliderXRes.value(12);
			printheadTotalNrOfNozzles = 12;
            break;
        case 'Spectra SE':
            sliderDropsize.value(30);
            sliderPrintheadNpi.value(50);
            sliderXRes.value(8);
			printheadTotalNrOfNozzles = 128;
            break;
        case 'Spectra ME':
            sliderDropsize.value(50);
            sliderPrintheadNpi.value(50);
            sliderXRes.value(8);
			printheadTotalNrOfNozzles = 128;
            break;
        case 'Spectra LE':
            sliderDropsize.value(80);
            sliderPrintheadNpi.value(50);
            sliderXRes.value(8);
			printheadTotalNrOfNozzles = 128;
            break;
        case 'KM512 SHE':
            sliderDropsize.value(4);
            sliderPrintheadNpi.value(360);
            sliderXRes.value(2);
			printheadTotalNrOfNozzles = 512;
            break;
        case 'KM512 MHE':
            sliderDropsize.value(14);
            sliderPrintheadNpi.value(360);
            sliderXRes.value(2);
			printheadTotalNrOfNozzles = 512;
            break;
        case 'KM512 LHE':
            sliderDropsize.value(32);
            sliderPrintheadNpi.value(360);
            sliderXRes.value(1);
			printheadTotalNrOfNozzles = 512;
            break;
        case 'KM1024i SHE':
            sliderDropsize.value(6);
            sliderPrintheadNpi.value(360);
            sliderXRes.value(2);
			printheadTotalNrOfNozzles = 1024;
            break;
        case 'KM1024i MHE':
            sliderDropsize.value(14);
            sliderPrintheadNpi.value(360);
            sliderXRes.value(1);
			printheadTotalNrOfNozzles = 1024;
            break;
        case 'KM1024i LHE':
            sliderDropsize.value(32);
            sliderPrintheadNpi.value(360);
            sliderXRes.value(1);
			printheadTotalNrOfNozzles = 1024;
            break;
		case 'SAMBA G3L':
            sliderDropsize.value(2.4);
            sliderPrintheadNpi.value(1200);
            sliderXRes.value(0);	
			printheadTotalNrOfNozzles = 2048;
			break;
		case 'CANON C29 HM':
            sliderDropsize.value(29);
            sliderPrintheadNpi.value(150);
            sliderXRes.value(3);	
			printheadTotalNrOfNozzles = 256;
			break;
		case 'Q-Class/10':
            sliderDropsize.value(10);
            sliderPrintheadNpi.value(100);
            sliderXRes.value(7);	
			printheadTotalNrOfNozzles = 256;			
			break;
		case 'Q-Class/30':
            sliderDropsize.value(30);
            sliderPrintheadNpi.value(100);
            sliderXRes.value(5);	
			printheadTotalNrOfNozzles = 256;			
			break;
		case 'Q-Class/80':
            sliderDropsize.value(80);
            sliderPrintheadNpi.value(100);
            sliderXRes.value(3);	
			printheadTotalNrOfNozzles = 256;			
			break;
		case 'KM1800iSHC':
            sliderDropsize.value(4);
            sliderPrintheadNpi.value(600);
            sliderXRes.value(1);	
			printheadTotalNrOfNozzles = 1776;
			break;
	case 'EPSON I3200 300dpi':
	        sliderDropsize.value(5);
            sliderPrintheadNpi.value(300);
            sliderXRes.value(2);	
			printheadTotalNrOfNozzles = 3200;	
		break;
	case 'EPSON I3200 600dpi':
	        sliderDropsize.value(5);
            sliderPrintheadNpi.value(600);
            sliderXRes.value(1);	
			printheadTotalNrOfNozzles = 3200;	
		break;
	case 'EPSON I3200 1200dpi':
	        sliderDropsize.value(5);
            sliderPrintheadNpi.value(1200);
            sliderXRes.value(0);	
			printheadTotalNrOfNozzles = 3200;	
		break;
			
case ('Durst RockJET'):
  sliderDropsize.value(1);
  sliderPrintheadNpi.value();
  sliderXRes.value(1);
  printheadTotalNrOfNozzles = 144;
  break;
case ('Epson D3000-A1R'):
  sliderDropsize.value(3);
  sliderPrintheadNpi.value(600);
  sliderXRes.value(2);
  printheadTotalNrOfNozzles = 2952;
  break;
case ('Epson F1440-A1'):
  sliderDropsize.value(3.8);
  sliderPrintheadNpi.value(180);
  sliderXRes.value(5);
  printheadTotalNrOfNozzles = 1440;
  break;
case ('Epson I1600-U1'):
  sliderDropsize.value(3.8);
  sliderPrintheadNpi.value(300);
  sliderXRes.value(3);
  printheadTotalNrOfNozzles = 1600;
  break;
case ('Epson I1600-E1'):
  sliderDropsize.value(3.8);
  sliderPrintheadNpi.value(300);
  sliderXRes.value(3);
  printheadTotalNrOfNozzles = 1600;
  break;
case ('Epson I1600-A1'):
  sliderDropsize.value(3.8);
  sliderPrintheadNpi.value(300);
  sliderXRes.value(3);
  printheadTotalNrOfNozzles = 1600;
  break;
case ('Epson I3200-U1'):
  sliderDropsize.value(3.8);
  sliderPrintheadNpi.value(300);
  sliderXRes.value(3);
  printheadTotalNrOfNozzles = 3200;
  break;
case ('Epson I3200-E1'):
  sliderDropsize.value(3.8);
  sliderPrintheadNpi.value(300);
  sliderXRes.value(3);
  printheadTotalNrOfNozzles = 3200;
  break;
case ('Epson I3200-A1'):
  sliderDropsize.value(3.8);
  sliderPrintheadNpi.value(300);
  sliderXRes.value(3);
  printheadTotalNrOfNozzles = 3200;
  break;
case ('Epson L1440-U2'):
  sliderDropsize.value(4.5);
  sliderPrintheadNpi.value(180);
  sliderXRes.value(5);
  printheadTotalNrOfNozzles = 1440;
  break;
case ('Epson L1440-A1'):
  sliderDropsize.value(3.4);
  sliderPrintheadNpi.value(180);
  sliderXRes.value(5);
  printheadTotalNrOfNozzles = 1440;
  break;
case ('Epson S800-U3'):
  sliderDropsize.value(4.8);
  sliderPrintheadNpi.value(300);
  sliderXRes.value(3);
  printheadTotalNrOfNozzles = 800;
  break;
case ('Epson S800-U1'):
  sliderDropsize.value(3.2);
  sliderPrintheadNpi.value(300);
  sliderXRes.value(3);
  printheadTotalNrOfNozzles = 800;
  break;
case ('Epson S800-A1'):
  sliderDropsize.value(3.3);
  sliderPrintheadNpi.value(300);
  sliderXRes.value(3);
  printheadTotalNrOfNozzles = 800;
  break;
case ('Epson S1600-U1'):
  sliderDropsize.value(3.2);
  sliderPrintheadNpi.value(300);
  sliderXRes.value(3);
  printheadTotalNrOfNozzles = 1600;
  break;
case ('Epson S3200-U1'):
  sliderDropsize.value(3.2);
  sliderPrintheadNpi.value(300);
  sliderXRes.value(3);
  printheadTotalNrOfNozzles = 3200;
  break;
case ('Epson S3200-U3'):
  sliderDropsize.value(4.8);
  sliderPrintheadNpi.value(300);
  sliderXRes.value(3);
  printheadTotalNrOfNozzles = 3200;
  break;
case ('Epson S3200-A1'):
  sliderDropsize.value(3.3);
  sliderPrintheadNpi.value(300);
  sliderXRes.value(3);
  printheadTotalNrOfNozzles = 3200;
  break;
case ('Epson T1600-U3'):
  sliderDropsize.value(4.8);
  sliderPrintheadNpi.value(300);
  sliderXRes.value(3);
  printheadTotalNrOfNozzles = 1600;
  break;
case ('Epson T3200-U3'):
  sliderDropsize.value(4.8);
  sliderPrintheadNpi.value(300);
  sliderXRes.value(3);
  printheadTotalNrOfNozzles = 3200;
  break;
case ('Fujifilm Emerald QE-256/30'):
  sliderDropsize.value(30);
  sliderPrintheadNpi.value(100);
  sliderXRes.value(9);
  printheadTotalNrOfNozzles = 256;
  break;
case ('Fujifilm Emerald QE-256/80'):
  sliderDropsize.value(80);
  sliderPrintheadNpi.value(100);
  sliderXRes.value(9);
  printheadTotalNrOfNozzles = 256;
  break;
case ('Fujifilm Galaxy JA 256/30'):
  sliderDropsize.value(25);
  sliderPrintheadNpi.value(100);
  sliderXRes.value(9);
  printheadTotalNrOfNozzles = 256;
  break;
case ('Fujifilm Galaxy JA 256/50'):
  sliderDropsize.value(45);
  sliderPrintheadNpi.value(100);
  sliderXRes.value(9);
  printheadTotalNrOfNozzles = 256;
  break;
case ('Fujifilm Galaxy JA 256/80'):
  sliderDropsize.value(75);
  sliderPrintheadNpi.value(100);
  sliderXRes.value(9);
  printheadTotalNrOfNozzles = 256;
  break;
case ('Fujifilm Galaxy PH 256/30'):
  sliderDropsize.value(25);
  sliderPrintheadNpi.value(100);
  sliderXRes.value(9);
  printheadTotalNrOfNozzles = 256;
  break;
case ('Fujifilm Galaxy PH 256/50'):
  sliderDropsize.value(50);
  sliderPrintheadNpi.value(100);
  sliderXRes.value(9);
  printheadTotalNrOfNozzles = 256;
  break;
case ('Fujifilm Galaxy PH 256/80'):
  sliderDropsize.value(70);
  sliderPrintheadNpi.value(100);
  sliderXRes.value(9);
  printheadTotalNrOfNozzles = 256;
  break;
case ('Fujifilm Galaxy PH 256/30 HM'):
  sliderDropsize.value(25);
  sliderPrintheadNpi.value(100);
  sliderXRes.value(9);
  printheadTotalNrOfNozzles = 256;
  break;
case ('Fujifilm Galaxy PH 256/80 HM'):
  sliderDropsize.value(75);
  sliderPrintheadNpi.value(100);
  sliderXRes.value(9);
  printheadTotalNrOfNozzles = 256;
  break;
case ('Fujifilm Nova JA 256/80'):
  sliderDropsize.value(70);
  sliderPrintheadNpi.value(90);
  sliderXRes.value(10);
  printheadTotalNrOfNozzles = 256;
  break;
case ('Fujifilm Nova PH 256/80'):
  sliderDropsize.value(70);
  sliderPrintheadNpi.value(90);
  sliderXRes.value(10);
  printheadTotalNrOfNozzles = 256;
  break;
case ('Fujifilm Polaris PQ-512/15'):
  sliderDropsize.value(15);
  sliderPrintheadNpi.value(100);
  sliderXRes.value(9);
  printheadTotalNrOfNozzles = 512;
  break;
case ('Fujifilm Polaris PQ-512/35'):
  sliderDropsize.value(35);
  sliderPrintheadNpi.value(100);
  sliderXRes.value(9);
  printheadTotalNrOfNozzles = 512;
  break;
case ('Fujifilm Polaris PQ-512/85'):
  sliderDropsize.value(80);
  sliderPrintheadNpi.value(100);
  sliderXRes.value(9);
  printheadTotalNrOfNozzles = 512;
  break;
case ('Fujifilm Samba G3L'):
  sliderDropsize.value(2.4);
  sliderPrintheadNpi.value(1200);
  sliderXRes.value(1);
  printheadTotalNrOfNozzles = 2048;
  break;
case ('Fujifilm Samba G5L'):
  sliderDropsize.value(3.5);
  sliderPrintheadNpi.value(1200);
  sliderXRes.value(1);
  printheadTotalNrOfNozzles = 2048;
  break;
case ('Fujifilm Sapphire QS-256/10'):
  sliderDropsize.value(10);
  sliderPrintheadNpi.value(100);
  sliderXRes.value(9);
  printheadTotalNrOfNozzles = 256;
  break;
case ('Fujifilm Sapphire QS-256/30'):
  sliderDropsize.value(30);
  sliderPrintheadNpi.value(100);
  sliderXRes.value(9);
  printheadTotalNrOfNozzles = 256;
  break;
case ('Fujifilm Sapphire QS-256/80'):
  sliderDropsize.value(80);
  sliderPrintheadNpi.value(100);
  sliderXRes.value(9);
  printheadTotalNrOfNozzles = 256;
  break;
case ('Fujifilm SE-128 AA'):
  sliderDropsize.value(25);
  sliderPrintheadNpi.value(50);
  sliderXRes.value(18);
  printheadTotalNrOfNozzles = 128;
  break;
case ('Fujifilm SM-128 AA'):
  sliderDropsize.value(40);
  sliderPrintheadNpi.value(50);
  sliderXRes.value(18);
  printheadTotalNrOfNozzles = 128;
  break;
case ('Fujifilm SL-128 AA'):
  sliderDropsize.value(65);
  sliderPrintheadNpi.value(50);
  sliderXRes.value(18);
  printheadTotalNrOfNozzles = 128;
  break;
case ('Fujifilm Skyfire SF600'):
  sliderDropsize.value(5);
  sliderPrintheadNpi.value(600);
  sliderXRes.value(2);
  printheadTotalNrOfNozzles = 1536;
  break;
case ('Fujifilm Starfire SG1024/L3F'):
  sliderDropsize.value(80);
  sliderPrintheadNpi.value(400);
  sliderXRes.value(2);
  printheadTotalNrOfNozzles = 1024;
  break;
case ('Fujifilm Starfire SG1024/LA2Ci'):
  sliderDropsize.value(80);
  sliderPrintheadNpi.value(200);
  sliderXRes.value(4);
  printheadTotalNrOfNozzles = 1024;
  break;
case ('Fujifilm Starfire SG1024/LC'):
  sliderDropsize.value(72);
  sliderPrintheadNpi.value(400);
  sliderXRes.value(2);
  printheadTotalNrOfNozzles = 1024;
  break;
case ('Fujifilm Starfire SG1024/MA2C'):
  sliderDropsize.value(30);
  sliderPrintheadNpi.value(200);
  sliderXRes.value(4);
  printheadTotalNrOfNozzles = 1024;
  break;
case ('Fujifilm Starfire SG1024/MA'):
  sliderDropsize.value(30);
  sliderPrintheadNpi.value(400);
  sliderXRes.value(2);
  printheadTotalNrOfNozzles = 1024;
  break;
case ('Fujifilm Starfire SG1024/MC'):
  sliderDropsize.value(26);
  sliderPrintheadNpi.value(400);
  sliderXRes.value(2);
  printheadTotalNrOfNozzles = 1024;
  break;
case ('Fujifilm Starfire SG1024/SA2C'):
  sliderDropsize.value(12);
  sliderPrintheadNpi.value(200);
  sliderXRes.value(4);
  printheadTotalNrOfNozzles = 1024;
  break;
case ('Fujifilm Starfire SG1024/SA'):
  sliderDropsize.value(12);
  sliderPrintheadNpi.value(400);
  sliderXRes.value(2);
  printheadTotalNrOfNozzles = 1024;
  break;
case ('Fujifilm Starfire SG1024/SC'):
  sliderDropsize.value(12);
  sliderPrintheadNpi.value(400);
  sliderXRes.value(2);
  printheadTotalNrOfNozzles = 1024;
  break;
case ('Fujifilm Starfire SG1024/XSA'):
  sliderDropsize.value(6);
  sliderPrintheadNpi.value(400);
  sliderXRes.value(2);
  printheadTotalNrOfNozzles = 1024;
  break;
case ('Fujifilm Starfire SG600'):
  sliderDropsize.value(12);
  sliderPrintheadNpi.value(600);
  sliderXRes.value(2);
  printheadTotalNrOfNozzles = 1536;
  break;
case ('Konica Minolta KM512LNX'):
  sliderDropsize.value(42);
  sliderPrintheadNpi.value(360);
  sliderXRes.value(2);
  printheadTotalNrOfNozzles = 512;
  break;
case ('Konica Minolta KM512LHX'):
  sliderDropsize.value(42);
  sliderPrintheadNpi.value(360);
  sliderXRes.value(2);
  printheadTotalNrOfNozzles = 512;
  break;
case ('Konica Minolta KM512MNX'):
  sliderDropsize.value(14);
  sliderPrintheadNpi.value(360);
  sliderXRes.value(2);
  printheadTotalNrOfNozzles = 512;
  break;
case ('Konica Minolta KM512MHX'):
  sliderDropsize.value(14);
  sliderPrintheadNpi.value(360);
  sliderXRes.value(2);
  printheadTotalNrOfNozzles = 512;
  break;
case ('Konica Minolta KM512LNX-35'):
  sliderDropsize.value(35);
  sliderPrintheadNpi.value(360);
  sliderXRes.value(2);
  printheadTotalNrOfNozzles = 512;
  break;
case ('Konica Minolta KM512iMAB-C'):
  sliderDropsize.value(13);
  sliderPrintheadNpi.value(180);
  sliderXRes.value(5);
  printheadTotalNrOfNozzles = 512;
  break;
case ('Konica Minolta KM800'):
  sliderDropsize.value(5);
  sliderPrintheadNpi.value(180);
  sliderXRes.value(5);
  printheadTotalNrOfNozzles = 800;
  break;
case ('Konica Minolta KM800-D'):
  sliderDropsize.value(5);
  sliderPrintheadNpi.value(180);
  sliderXRes.value(5);
  printheadTotalNrOfNozzles = 800;
  break;
case ('Konica Minolta KM1024LHB'):
  sliderDropsize.value(42);
  sliderPrintheadNpi.value(360);
  sliderXRes.value(2);
  printheadTotalNrOfNozzles = 1024;
  break;
case ('Konica Minolta KM1024LNB'):
  sliderDropsize.value(42);
  sliderPrintheadNpi.value(360);
  sliderXRes.value(2);
  printheadTotalNrOfNozzles = 1024;
  break;
case ('Konica Minolta KM1024MHB'):
  sliderDropsize.value(14);
  sliderPrintheadNpi.value(360);
  sliderXRes.value(2);
  printheadTotalNrOfNozzles = 1024;
  break;
case ('Konica Minolta KM1024MNB'):
  sliderDropsize.value(14);
  sliderPrintheadNpi.value(360);
  sliderXRes.value(2);
  printheadTotalNrOfNozzles = 1024;
  break;
case ('Konica Minolta KM1024SHB'):
  sliderDropsize.value(6);
  sliderPrintheadNpi.value(360);
  sliderXRes.value(2);
  printheadTotalNrOfNozzles = 1024;
  break;
case ('Konica Minolta KM1024aSHE'):
  sliderDropsize.value(6);
  sliderPrintheadNpi.value(360);
  sliderXRes.value(2);
  printheadTotalNrOfNozzles = 1024;
  break;
case ('Konica Minolta KM1024aLHG-RC'):
  sliderDropsize.value(27);
  sliderPrintheadNpi.value(360);
  sliderXRes.value(2);
  printheadTotalNrOfNozzles = 1024;
  break;
case ('Konica Minolta KM1024aSHG-RC'):
  sliderDropsize.value(6);
  sliderPrintheadNpi.value(360);
  sliderXRes.value(2);
  printheadTotalNrOfNozzles = 1024;
  break;
case ('Konica Minolta KM1024iMAE-C'):
  sliderDropsize.value(14);
  sliderPrintheadNpi.value(360);
  sliderXRes.value(2);
  printheadTotalNrOfNozzles = 1024;
  break;
case ('Konica Minolta KM1024iSAE-C'):
  sliderDropsize.value(6);
  sliderPrintheadNpi.value(360);
  sliderXRes.value(2);
  printheadTotalNrOfNozzles = 1024;
  break;
case ('Konica Minolta KM1024iLHE'):
  sliderDropsize.value(30);
  sliderPrintheadNpi.value(360);
  sliderXRes.value(2);
  printheadTotalNrOfNozzles = 1024;
  break;
case ('Konica Minolta KM1024iMHE'):
  sliderDropsize.value(13);
  sliderPrintheadNpi.value(360);
  sliderXRes.value(2);
  printheadTotalNrOfNozzles = 1024;
  break;
case ('Konica Minolta KM1024iSHE'):
  sliderDropsize.value(6);
  sliderPrintheadNpi.value(360);
  sliderXRes.value(2);
  printheadTotalNrOfNozzles = 1024;
  break;
case ('Konica Minolta KM1280iMHH'):
  sliderDropsize.value(10);
  sliderPrintheadNpi.value(450);
  sliderXRes.value(2);
  printheadTotalNrOfNozzles = 1280;
  break;
case ('Konica Minolta KM1600'):
  sliderDropsize.value(5);
  sliderPrintheadNpi.value(180);
  sliderXRes.value(5);
  printheadTotalNrOfNozzles = 1600;
  break;
case ('Konica Minolta KM1800iSHC'):
  sliderDropsize.value(3.5);
  sliderPrintheadNpi.value(600);
  sliderXRes.value(2);
  printheadTotalNrOfNozzles = 1776;
  break;
case ('Kyocera KJ4A-AA'):
  sliderDropsize.value(3);
  sliderPrintheadNpi.value(600);
  sliderXRes.value(2);
  printheadTotalNrOfNozzles = 2656;
  break;
case ('Kyocera KJ4A-TA'):
  sliderDropsize.value(6);
  sliderPrintheadNpi.value(600);
  sliderXRes.value(2);
  printheadTotalNrOfNozzles = 2656;
  break;
case ('Kyocera KJ4A-RH'):
  sliderDropsize.value(3);
  sliderPrintheadNpi.value(600);
  sliderXRes.value(2);
  printheadTotalNrOfNozzles = 2656;
  break;
case ('Kyocera KJ4A-0300'):
  sliderDropsize.value(4);
  sliderPrintheadNpi.value(300);
  sliderXRes.value(3);
  printheadTotalNrOfNozzles = 2656;
  break;
case ('Kyocera KJ4B-0300'):
  sliderDropsize.value(5);
  sliderPrintheadNpi.value(300);
  sliderXRes.value(3);
  printheadTotalNrOfNozzles = 2656;
  break;
case ('Kyocera KJ4B-1200'):
  sliderDropsize.value(1.5);
  sliderPrintheadNpi.value(1200);
  sliderXRes.value(1);
  printheadTotalNrOfNozzles = 5312;
  break;
case ('Kyocera KJ4B-EX 600'):
  sliderDropsize.value(24);
  sliderPrintheadNpi.value(600);
  sliderXRes.value(2);
  printheadTotalNrOfNozzles = 10;
  break;
case ('Kyocera KJ4B-EX600-RC'):
  sliderDropsize.value(5);
  sliderPrintheadNpi.value(600);
  sliderXRes.value(2);
  printheadTotalNrOfNozzles = 2656;
  break;
case ('Kyocera KJ4B-EX1200-RC'):
  sliderDropsize.value(1.5);
  sliderPrintheadNpi.value(1200);
  sliderXRes.value(1);
  printheadTotalNrOfNozzles = 5116;
  break;
case ('Kyocera KJ4B-QA'):
  sliderDropsize.value(5);
  sliderPrintheadNpi.value(600);
  sliderXRes.value(2);
  printheadTotalNrOfNozzles = 2656;
  break;
case ('Kyocera KJ4B-YH'):
  sliderDropsize.value(5);
  sliderPrintheadNpi.value(600);
  sliderXRes.value(2);
  printheadTotalNrOfNozzles = 2656;
  break;
case ('Kyocera KJ4C-0360'):
  sliderDropsize.value(15);
  sliderPrintheadNpi.value(360);
  sliderXRes.value(2);
  printheadTotalNrOfNozzles = 1584;
  break;
case ('Memjet VersaPass'):
  sliderDropsize.value(1.2);
  sliderPrintheadNpi.value(1600);
  sliderXRes.value(1);
  printheadTotalNrOfNozzles = 70400;
  break;
case ('Memjet DuraLink'):
  sliderDropsize.value(2.1);
  sliderPrintheadNpi.value(1600);
  sliderXRes.value(1);
  printheadTotalNrOfNozzles = 70400;
  break;
case ('Memjet DuraFlex'):
  sliderDropsize.value(2.1);
  sliderPrintheadNpi.value(1600);
  sliderXRes.value(1);
  printheadTotalNrOfNozzles = 163477;
  break;
case ('Memjet DuraBolt'):
  sliderDropsize.value(2.1);
  sliderPrintheadNpi.value(1600);
  sliderXRes.value(1);
  printheadTotalNrOfNozzles = 204346;
  break;
case ('Memjet DuraBolt'):
  sliderDropsize.value(2.1);
  sliderPrintheadNpi.value(1600);
  sliderXRes.value(1);
  printheadTotalNrOfNozzles = 163477;
  break;
case ('Memjet DuraBolt Bar'):
  sliderDropsize.value(2.1);
  sliderPrintheadNpi.value(1600);
  sliderXRes.value(1);
  printheadTotalNrOfNozzles = 204346;
  break;
case ('Ricoh GH2220'):
  sliderDropsize.value(3);
  sliderPrintheadNpi.value(150);
  sliderXRes.value(6);
  printheadTotalNrOfNozzles = 384;
  break;
case ('Ricoh MH2420'):
  sliderDropsize.value(7);
  sliderPrintheadNpi.value(150);
  sliderXRes.value(6);
  printheadTotalNrOfNozzles = 384;
  break;
case ('Ricoh MH2620'):
  sliderDropsize.value(15);
  sliderPrintheadNpi.value(150);
  sliderXRes.value(6);
  printheadTotalNrOfNozzles = 384;
  break;
case ('Ricoh MH2810F'):
  sliderDropsize.value(27);
  sliderPrintheadNpi.value(150);
  sliderXRes.value(6);
  printheadTotalNrOfNozzles = 384;
  break;
case ('Ricoh MH2910F'):
  sliderDropsize.value(50);
  sliderPrintheadNpi.value(150);
  sliderXRes.value(6);
  printheadTotalNrOfNozzles = 384;
  break;
case ('Ricoh MH2820'):
  sliderDropsize.value(27);
  sliderPrintheadNpi.value(75);
  sliderXRes.value(12);
  printheadTotalNrOfNozzles = 384;
  break;
case ('Ricoh MH5220'):
  sliderDropsize.value(2.5);
  sliderPrintheadNpi.value(300);
  sliderXRes.value(3);
  printheadTotalNrOfNozzles = 1280;
  break;
case ('Ricoh MH5320'):
  sliderDropsize.value(5);
  sliderPrintheadNpi.value(300);
  sliderXRes.value(3);
  printheadTotalNrOfNozzles = 1280;
  break;
case ('Ricoh MH5340'):
  sliderDropsize.value(5);
  sliderPrintheadNpi.value(150);
  sliderXRes.value(6);
  printheadTotalNrOfNozzles = 1280;
  break;
case ('Ricoh MH5420'):
  sliderDropsize.value(7);
  sliderPrintheadNpi.value(300);
  sliderXRes.value(3);
  printheadTotalNrOfNozzles = 1280;
  break;
case ('Ricoh MH5440'):
  sliderDropsize.value(7);
  sliderPrintheadNpi.value(150);
  sliderXRes.value(6);
  printheadTotalNrOfNozzles = 1280;
  break;
case ('Ricoh MH5421'):
  sliderDropsize.value(7);
  sliderPrintheadNpi.value(300);
  sliderXRes.value(3);
  printheadTotalNrOfNozzles = 1280;
  break;
case ('Ricoh MH5441'):
  sliderDropsize.value(7);
  sliderPrintheadNpi.value(150);
  sliderXRes.value(6);
  printheadTotalNrOfNozzles = 1280;
  break;
case ('Ricoh MH5421F'):
  sliderDropsize.value(7);
  sliderPrintheadNpi.value(300);
  sliderXRes.value(3);
  printheadTotalNrOfNozzles = 1280;
  break;
case ('Ricoh MH5421MF'):
  sliderDropsize.value(7);
  sliderPrintheadNpi.value(300);
  sliderXRes.value(3);
  printheadTotalNrOfNozzles = 1280;
  break;
case ('Ricoh MH5422'):
  sliderDropsize.value(7);
  sliderPrintheadNpi.value(300);
  sliderXRes.value(3);
  printheadTotalNrOfNozzles = 1280;
  break;
case ('Ricoh MH5442'):
  sliderDropsize.value(7);
  sliderPrintheadNpi.value(150);
  sliderXRes.value(6);
  printheadTotalNrOfNozzles = 1280;
  break;
case ('Ricoh TH5241'):
  sliderDropsize.value(3);
  sliderPrintheadNpi.value(300);
  sliderXRes.value(3);
  printheadTotalNrOfNozzles = 1280;
  break;
case ('Ricoh TH6310F'):
  sliderDropsize.value(5);
  sliderPrintheadNpi.value(600);
  sliderXRes.value(2);
  printheadTotalNrOfNozzles = 1600;
  break;
case ('Toshiba/RISO Tec CF1B'):
  sliderDropsize.value(6);
  sliderPrintheadNpi.value(300);
  sliderXRes.value(3);
  printheadTotalNrOfNozzles = 636;
  break;
case ('Toshiba/RISO Tec CF1BL'):
  sliderDropsize.value(57);
  sliderPrintheadNpi.value(300);
  sliderXRes.value(3);
  printheadTotalNrOfNozzles = 636;
  break;
case ('Toshiba/RISO Tec CF1BXL'):
  sliderDropsize.value(36);
  sliderPrintheadNpi.value(300);
  sliderXRes.value(3);
  printheadTotalNrOfNozzles = 636;
  break;
case ('Toshiba/RISO Tec CF3'):
  sliderDropsize.value(3);
  sliderPrintheadNpi.value(600);
  sliderXRes.value(2);
  printheadTotalNrOfNozzles = 1278;
  break;
case ('Toshiba/RISO Tec CF3R'):
  sliderDropsize.value(3);
  sliderPrintheadNpi.value(300);
  sliderXRes.value(3);
  printheadTotalNrOfNozzles = 1278;
  break;
case ('Toshiba/RISO Tec CF6R'):
  sliderDropsize.value(6);
  sliderPrintheadNpi.value(300);
  sliderXRes.value(3);
  printheadTotalNrOfNozzles = 1278;
  break;
case ('Toshiba/RISO Tec CX1'):
  sliderDropsize.value(6);
  sliderPrintheadNpi.value(300);
  sliderXRes.value(3);
  printheadTotalNrOfNozzles = 1280;
  break;
case ('Seiko 508GS'):
  sliderDropsize.value(12);
  sliderPrintheadNpi.value(180);
  sliderXRes.value(5);
  printheadTotalNrOfNozzles = 508;
  break;
case ('Seiko RC1536-M'):
  sliderDropsize.value(13);
  sliderPrintheadNpi.value(360);
  sliderXRes.value(2);
  printheadTotalNrOfNozzles = 1536;
  break;
case ('Seiko RC1536-L'):
  sliderDropsize.value(25);
  sliderPrintheadNpi.value(360);
  sliderXRes.value(2);
  printheadTotalNrOfNozzles = 1536;
  break;
case ('Seiko RCE2560'):
  sliderDropsize.value(9);
  sliderPrintheadNpi.value(300);
  sliderXRes.value(3);
  printheadTotalNrOfNozzles = 2560;
  break;
case ('Quantica NovoJet X'):
  sliderDropsize.value(30);
  sliderPrintheadNpi.value(11.5);
  sliderXRes.value(75);
  printheadTotalNrOfNozzles = 24;
  break;
case ('Quantica NovoJet 1'):
  sliderDropsize.value(30);
  sliderPrintheadNpi.value(12);
  sliderXRes.value(75);
  printheadTotalNrOfNozzles = 96;
  break;
case ('Xaar 128/80L'):
  sliderDropsize.value(80);
  sliderPrintheadNpi.value(200);
  sliderXRes.value(4);
  printheadTotalNrOfNozzles = 128;
  break;
case ('Xaar 128/40L'):
  sliderDropsize.value(40);
  sliderPrintheadNpi.value(360);
  sliderXRes.value(2);
  printheadTotalNrOfNozzles = 128;
  break;
case ('Xaar 128/80W'):
  sliderDropsize.value(80);
  sliderPrintheadNpi.value(200);
  sliderXRes.value(4);
  printheadTotalNrOfNozzles = 128;
  break;
case ('Xaar 128/40W'):
  sliderDropsize.value(40);
  sliderPrintheadNpi.value(360);
  sliderXRes.value(2);
  printheadTotalNrOfNozzles = 128;
  break;
case ('Xaar 501 GS8 O'):
  sliderDropsize.value(8);
  sliderPrintheadNpi.value(180);
  sliderXRes.value(5);
  printheadTotalNrOfNozzles = 500;
  break;
case ('Xaar 501 GS8 OR'):
  sliderDropsize.value(8);
  sliderPrintheadNpi.value(180);
  sliderXRes.value(5);
  printheadTotalNrOfNozzles = 500;
  break;
case ('Xaar 501 GS8 U'):
  sliderDropsize.value(8);
  sliderPrintheadNpi.value(180);
  sliderXRes.value(5);
  printheadTotalNrOfNozzles = 500;
  break;
case ('Xaar 501 GS8 UR'):
  sliderDropsize.value(8);
  sliderPrintheadNpi.value(180);
  sliderXRes.value(5);
  printheadTotalNrOfNozzles = 500;
  break;
case ('Xaar 502 GS15 O'):
  sliderDropsize.value(15);
  sliderPrintheadNpi.value(180);
  sliderXRes.value(5);
  printheadTotalNrOfNozzles = 500;
  break;
case ('Xaar 502 GS15 OR'):
  sliderDropsize.value(15);
  sliderPrintheadNpi.value(180);
  sliderXRes.value(5);
  printheadTotalNrOfNozzles = 500;
  break;
case ('Xaar 502 GS15 S180'):
  sliderDropsize.value(15);
  sliderPrintheadNpi.value(180);
  sliderXRes.value(5);
  printheadTotalNrOfNozzles = 500;
  break;
case ('Xaar 502 GS15 S360'):
  sliderDropsize.value(15);
  sliderPrintheadNpi.value(180);
  sliderXRes.value(5);
  printheadTotalNrOfNozzles = 500;
  break;
case ('Xaar 1003 GS6C'):
  sliderDropsize.value(6);
  sliderPrintheadNpi.value(360);
  sliderXRes.value(2);
  printheadTotalNrOfNozzles = 1000;
  break;
case ('Xaar 1003 GS12C'):
  sliderDropsize.value(12);
  sliderPrintheadNpi.value(360);
  sliderXRes.value(2);
  printheadTotalNrOfNozzles = 1000;
  break;
case ('Xaar 1003 GS40C'):
  sliderDropsize.value(40);
  sliderPrintheadNpi.value(360);
  sliderXRes.value(2);
  printheadTotalNrOfNozzles = 1000;
  break;
case ('Xaar 1003 GS6U'):
  sliderDropsize.value(6);
  sliderPrintheadNpi.value(360);
  sliderXRes.value(2);
  printheadTotalNrOfNozzles = 1000;
  break;
case ('Xaar 1003 GS12U'):
  sliderDropsize.value(12);
  sliderPrintheadNpi.value(360);
  sliderXRes.value(2);
  printheadTotalNrOfNozzles = 1000;
  break;
case ('Xaar 1003 GS40U'):
  sliderDropsize.value(40);
  sliderPrintheadNpi.value(360);
  sliderXRes.value(2);
  printheadTotalNrOfNozzles = 1000;
  break;
case ('Xaar 1003 AMx'):
  sliderDropsize.value(6);
  sliderPrintheadNpi.value(360);
  sliderXRes.value(2);
  printheadTotalNrOfNozzles = 1000;
  break;
case ('Xaar 1003 AMp'):
  sliderDropsize.value(1);
  sliderPrintheadNpi.value(360);
  sliderXRes.value(2);
  printheadTotalNrOfNozzles = 1000;
  break;
case ('Xaar 2001+ GS6C'):
  sliderDropsize.value(6);
  sliderPrintheadNpi.value(360);
  sliderXRes.value(2);
  printheadTotalNrOfNozzles = 2000;
  break;
case ('Xaar 2001+ GS12C'):
  sliderDropsize.value(12);
  sliderPrintheadNpi.value(360);
  sliderXRes.value(2);
  printheadTotalNrOfNozzles = 2000;
  break;
case ('Xaar 2001+ GS40C'):
  sliderDropsize.value(40);
  sliderPrintheadNpi.value(360);
  sliderXRes.value(2);
  printheadTotalNrOfNozzles = 2000;
  break;
case ('Xaar 2001+ GS6U'):
  sliderDropsize.value(6);
  sliderPrintheadNpi.value(360);
  sliderXRes.value(2);
  printheadTotalNrOfNozzles = 2000;
  break;
case ('Xaar 2001+ GS12U'):
  sliderDropsize.value(12);
  sliderPrintheadNpi.value(360);
  sliderXRes.value(2);
  printheadTotalNrOfNozzles = 2000;
  break;
case ('Xaar 2001+ GS40U'):
  sliderDropsize.value(40);
  sliderPrintheadNpi.value(360);
  sliderXRes.value(2);
  printheadTotalNrOfNozzles = 2000;
  break;
case ('Xaar 2002 6'):
  sliderDropsize.value(6);
  sliderPrintheadNpi.value(720);
  sliderXRes.value(1);
  printheadTotalNrOfNozzles = 2000;
  break;
case ('Xaar 2002 12'):
  sliderDropsize.value(12);
  sliderPrintheadNpi.value(720);
  sliderXRes.value(1);
  printheadTotalNrOfNozzles = 2000;
  break;
case ('Xaar 2002 40'):
  sliderDropsize.value(40);
  sliderPrintheadNpi.value(720);
  sliderXRes.value(1);
  printheadTotalNrOfNozzles = 2000;
  break;
case ('Xaar Aquinox 6'):
  sliderDropsize.value(6);
  sliderPrintheadNpi.value(360);
  sliderXRes.value(2);
  printheadTotalNrOfNozzles = 2000;
  break;
case ('Xaar Aquinox 12'):
  sliderDropsize.value(12);
  sliderPrintheadNpi.value(360);
  sliderXRes.value(2);
  printheadTotalNrOfNozzles = 2000;
  break;
case ('Xaar Irix'):
  sliderDropsize.value(40);
  sliderPrintheadNpi.value(185);
  sliderXRes.value(5);
  printheadTotalNrOfNozzles = 128;
  break;
case ('Xaar Nitrox Core'):
  sliderDropsize.value(6);
  sliderPrintheadNpi.value(360);
  sliderXRes.value(2);
  printheadTotalNrOfNozzles = 1000;
  break;
case ('Xaar Nitrox Pro'):
  sliderDropsize.value(6);
  sliderPrintheadNpi.value(360);
  sliderXRes.value(2);
  printheadTotalNrOfNozzles = 1000;
  break;
case ('Xaar Nitrox Elite'):
  sliderDropsize.value(6);
  sliderPrintheadNpi.value(360);
  sliderXRes.value(2);
  printheadTotalNrOfNozzles = 1000;
  break;
case ('Xerox MDF'):
  sliderDropsize.value(15);
  sliderPrintheadNpi.value(150);
  sliderXRes.value(6);
  printheadTotalNrOfNozzles = 880;
  break;
case ('Xerox W1 40kHz'):
  sliderDropsize.value(5);
  sliderPrintheadNpi.value(1200);
  sliderXRes.value(1);
  printheadTotalNrOfNozzles = 5544;
  break;
case ('Xerox WD1/WD2 64kHz'):
  sliderDropsize.value(4);
  sliderPrintheadNpi.value(600);
  sliderXRes.value(2);
  printheadTotalNrOfNozzles = 5544;
  break;
case ('Xerox WD1/WD2 80kHz'):
  sliderDropsize.value(3.2);
  sliderPrintheadNpi.value(600);
  sliderXRes.value(2);
  printheadTotalNrOfNozzles = 5544;
  break;			
        default:
    }
	sliderNrNozzles.updateText();
	selectedPrintheadNpi = sliderPrintheadNpi.value();
}

function fullSurface(p, numX, numY, invert) {
    for (let x = 0; x < numX; x++) {
        for (let y = 0; y < numY; y++) {
            jet[x][y] = invert ? false : true;
        }
    }
}

function checkerBoard(p, numX, numY, invert) {
    for (let x = 0; x < numX; x++) {
        for (let y = 0; y < numY; y++) {
            jet[x][y] = invert ? true : false;
            if (((x % 2) + y) % 2 == 0) jet[x][y] = invert ? false : true;
        }
    }
}

function horizontalLine(p, numX, numY, lineWidth, invert) {
    let yMinPos = p.max(0, p.floor(numY / 2) + p.ceil(lineWidth / 2) - lineWidth);
    let yMaxpos = p.min(yMinPos + lineWidth, numY);

    if (lineWidth >= numY) {
        yMinPos = 0;
        yMaxpos = numY;
    }

    if (invert) fullSurface(p, numX, numY);
    for (let x = 0; x < numX; x++) {
        for (let y = yMinPos; y < yMaxpos; y++) {
            jet[x][y] = invert ? false : true;
        }
    }
}

function verticalLine(p, numX, numY, lineWidth, invert) {
    let xMinPos = p.max(0, p.floor(numX / 2) + p.ceil(lineWidth / 2) - lineWidth);
    let xMaxPos = p.min(xMinPos + lineWidth, numX);

    if (lineWidth >= numX) {
        xMinPos = 0;
        xMaxPos = numX;
    }

    if (invert) fullSurface(p, numX, numY);
    for (let x = xMinPos; x < xMaxPos; x++) {
        for (let y = 0; y < numY; y++) {
            jet[x][y] = invert ? false : true;
        }
    }
}

function printRectangle(p, numX, numY, lineWidth, invert) {
    if (invert) fullSurface(p, numX, numY);

    lineWidth = p.min(p.min(lineWidth, numX), numY);

    if (numX <= 1 || numY <= 1) {
        lineWidht = 1;
    }

    // top and bottom line
    for (let l = 0; l < lineWidth; l++) {
        for (let x = 0; x < numX; x++) {
            jet[x][l] = invert ? false : true;
            if (numY >= 1) jet[x][numY - 1 - l] = invert ? false : true;
        }
    }

    // left and right line
    for (let l = 0; l < lineWidth; l++) {
        for (let y = 0; y < numY; y++) {
            jet[l][y] = invert ? false : true;
            if (numX >= 1) jet[numX - 1 - l][y] = invert ? false : true;
        }
    }
}

function cross(p, lineWidth, invert) {

}

function printCircle(p, numX, numY, lineWidth, invert) {
	if (invert) fullSurface(p, numX, numY);
	
	let ellipseMode = true;
	
	if(!ellipseMode){
		let diam = p.min(numX, numY);
		numX = diam;
		numY = diam;
	}
	
	//let r=p.floor(p.min(numX-1, numY-1)/2) ;
	let r = p.floor((numX-1)/2);
	let ry = p.floor((numY-1)/2);
	for(let lw=0; lw<lineWidth; lw++)
	{
		for(let i = 0; i < 360; i += 1)
		{
			let angle = i;
			let x1 = p.round(r * p.cos(angle * p.PI / 180));
			let y1 = p.round(ry * p.sin(angle * p.PI / 180));
			let x2 = numX/2 + x1;
			let y2 = numY/2 + y1;
			x2 = parseInt(x2);
			y2 = parseInt(y2);
			if (x2 < 0) x2 = 0;
			if (x2 >= numX) x2 = numX-1;
			if (y2 < 0) y2 = 0;
			if (y2 >= numY) y2 = numY-1;
			jet[x2][y2] = invert ? false : true;
		}
		r = r-1;
		ry = ry-1;
	}
}

function plotEllipseRect(x0, y0, x1, y1)
{
   // https://zingl.github.io/bresenham.html
   let a = abs(x1-x0), b = abs(y1-y0), b1 = b&1; /* values of diameter */
   let dx = 4*(1-a)*b*b, dy = 4*(b1+1)*a*a; /* error increment */
   let err = dx+dy+b1*a*a, e2; /* error of 1.step */

   if (x0 > x1) { x0 = x1; x1 += a; } /* if called with swapped points */
   if (y0 > y1) y0 = y1; /* .. exchange them */
   y0 += (b+1)/2; y1 = y0-b1;   /* starting pixel */
   a *= 8*a; b1 = 8*b*b;

   do {
       jet[x1][y0]=true; /*   I. Quadrant */
       jet[x0][y0]=true; /*  II. Quadrant */
       jet[x0][y1]=true; /* III. Quadrant */
       jet[x1][y1]=true; /*  IV. Quadrant */
       e2 = 2*err;
       if (e2 <= dy) { y0++; y1--; err += dy += a; }  /* y step */ 
       if (e2 >= dx || 2*err > dy) { x0++; x1--; err += dx += b1; } /* x step */
   } while (x0 <= x1);
   
   while (y0-y1 < b) {  /* too early stop of flat ellipses a=1 */
       jet[x0-1][y0]=true; /* -> finish tip of ellipse */
       jet[x1+1][y0++]=true; 
       jet[x0-1][y1]=true;
       jet[x1+1][y1--]=true; 
   }
}

let drawPrintheadYpos = centerY;
//let enabledNozzles = [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true];
let enabledNozzlesPerHead = [[true, true, true, true, true, true, true, true, true, true, true, true, true, true, true]];

function enableNozzleWithMouse(p){
    printheadDropsize = sliderDropsize.value();
    printheadNpi = sliderPrintheadNpi.value();
    nrOfNozzles = sliderNrNozzles.value();

	let dpiX = printheadNpi * (sliderXRes.value() + 1);
	let passes = p.round(dpiX / printheadNpi);
	let dotSpacingX = 1000.0 / ((dpiX) / 25.4);
    let nozzleSpacingX = 1000.0 / (printheadNpi / 25.4);
	let nozzleDiam = p.pow( 3*printheadDropsize / (4 * p.PI), 1/3) * 2 * 10;
    let bigPasses = sliderShowBigPasses.value();
	
	let xpos = centerX + (sliderShowPasses.value()-1) * dotSpacingX - nozzleDiam/2 -2;
	if(!(p.mouseX > xpos 
		&& p.mouseX < xpos + (nrOfNozzles-1) * nozzleSpacingX + nozzleDiam + 4
		&& p.mouseY > drawPrintheadYpos-nozzleDiam/2 
		&& p.mouseY < drawPrintheadYpos+nozzleDiam/2)){
		// Mouse is outside the printhead rectange.
		return;
	}

	// Mouse inside the printhead rectange
	for (let ps = 0; ps < passes * sliderQualityFactor.value(); ps++){
		for(let bpass = 0; bpass < bigPasses; bpass++){
			for(let nozzle = 0; nozzle < nrOfNozzles; nozzle++){
				let x = (nrOfNozzles * bpass) + nozzle;
				if(ps == sliderShowPasses.value()-1){
					let xPos = centerX + x * (nozzleSpacingX * drawResolution) + ps * dotSpacingX;
					let yPos = drawPrintheadYpos - nozzleDiam/2;
					xPos = xPos - nozzleDiam/2;
					if(p.mouseX > xPos && p.mouseX < xPos+nozzleDiam 
						&& p.mouseY > yPos && p.mouseY < yPos + nozzleDiam)
					{
						//enabledNozzles[nozzle] = !enabledNozzles[nozzle];
						enabledNozzlesPerHead[0][nozzle] = !enabledNozzlesPerHead[0][nozzle]
					}
				}
			}
		}
	}
}

function drawPrinthead(p) {
    p.fill('black');
	p.strokeWeight(1);
    p.stroke('gray');
    printheadDropsize = sliderDropsize.value();
    printheadNpi = sliderPrintheadNpi.value();
    nrOfNozzles = sliderNrNozzles.value();

	if ( !animateDotsInPrintDirection ) drawPrintheadYpos = centerY;

	// to limit the resolution and nr of pixels to keep the UI responsive.
	if (printheadNpi * (sliderXRes.value() + 1) >= 4800 || sliderYRes.value() >=4800) 
		sliderXRes.value(p.floor(4800 / printheadNpi)-1);
	
	let dpiX = printheadNpi * (sliderXRes.value() + 1);
	let passes = p.round(dpiX / printheadNpi);
	let dotSpacingX = 1000.0 / ((dpiX) / 25.4);
    let nozzleSpacingX = 1000.0 / (printheadNpi / 25.4);
	let nozzleDiam = p.pow( 3*printheadDropsize / (4 * p.PI), 1/3) * 2 * 10;
    let bigPasses = sliderShowBigPasses.value();
	
	// Rectangle representing the printhead
	p.push();
		p.fill('Silver');
		p.strokeWeight(0.5);
		p.stroke('black');
		for (bSteps = 0; bSteps < bigPasses; bSteps++){
			let xpos = centerX + (sliderShowPasses.value()-1) * dotSpacingX - nozzleDiam/2 -2 + bSteps*(nrOfNozzles * nozzleSpacingX);
			p.rect(xpos, drawPrintheadYpos-nozzleDiam/2-14, (nrOfNozzles-1) * nozzleSpacingX +nozzleDiam+4 , nozzleDiam+18, 5);
			p.push();
				p.noStroke();
				p.fill('black');
				p.text('Printhead', xpos, drawPrintheadYpos-nozzleDiam/2-20);
			p.pop();
		}
	p.pop();
	
	let phAngle = sliderPrintheadAngle.value();
	if(phAngle > 0){
		// rotated version
		let orgNzlSpacing = 1000.0 / (selectedPrintheadNpi / 25.4); 
		let orgDpiX = printheadNpi * (sliderXRes.value() + 1);
		let orgdotSpacingX = 1000.0 / ((orgDpiX) / 25.4);
		let c = p.color('silver');
		c.setAlpha(127);
		p.fill(c);
		
		p.strokeWeight(0.5);
		p.stroke('black');
		for (bSteps = 0; bSteps < bigPasses; bSteps++){
			p.push();
				p.angleMode(p.DEGREES);
				let orgXpos = centerX + (sliderShowPasses.value()-1) * orgdotSpacingX - nozzleDiam/2 -2 + bSteps*(nrOfNozzles * nozzleSpacingX);
				let orgRectW = (nrOfNozzles-1) * orgNzlSpacing + nozzleDiam+4;
				let rectW = (nrOfNozzles-1) * nozzleSpacingX + nozzleDiam+4;
				let rectH = nozzleDiam+18;
				let rectY = drawPrintheadYpos-nozzleDiam/2-14;
				p.rectMode(p.CENTER);
				p.translate((orgXpos + (rectW/2)), (rectY+7 + (rectH/2)));
				p.rotate(phAngle);
				p.rect(0, -7, orgRectW, rectH, 5);
				p.circle(0,0, 5);
				
				p.noFill();
				p.stroke('rgb(240,240,240)');	
				

				for(let nozzle = 0; nozzle < nrOfNozzles; nozzle++){
					let x = nozzle;
					let c = p.color('black');

					if(enabledNozzlesPerHead[0][nozzle])
					//if(enabledNozzles[nozzle])
						c = p.color('black'); // to inducate the nozzle is enabled
					else
						c = p.color('red'); 	// to indicate the nozzle is disabled
					
					c.setAlpha(127);
					p.fill(c);
					let xPos = -(orgRectW/2) + nozzleDiam/2 + 2 + x * orgNzlSpacing;
					p.circle(xPos, -nozzleDiam/2+7, nozzleDiam);
				}
			
								
				

			p.pop();
		}
		
		p.angleMode(p.DEGREES);
				// calculate the new NPI value when rotated
		let newNpi = parseInt(selectedPrintheadNpi * (1/p.cos(phAngle)));
		console.log("New NPI " + newNpi);
		sliderPrintheadNpi.value(newNpi);
		p.angleMode(p.RADIANS);
		
	}
	
	
	// Draw the nozzles and the previouse nozzle positions in X for previouse passes as a ring
    p.push();
		p.noFill();
		p.stroke('rgb(240,240,240)');	
		for (let ps = 0; ps < passes * sliderQualityFactor.value(); ps++){
			for(let bpass = 0; bpass < bigPasses; bpass++){
				for(let nozzle = 0; nozzle < nrOfNozzles; nozzle++){
					let x = (nrOfNozzles * bpass) + nozzle;
					if(ps < sliderShowPasses.value()-1) p.noFill();
					else if(ps == sliderShowPasses.value()-1){
						
						if(enabledNozzlesPerHead[0][nozzle] || bpass > 0)
						//if(enabledNozzles[nozzle])
							p.fill('black'); // to inducate the nozzle is enabled
						else
							p.fill('red'); 	// to indicate the nozzle is disabled
					}
					else 
						p.noFill(); // show a white open circle
					
					let xPos = centerX + x * (nozzleSpacingX * drawResolution) + ps * dotSpacingX;
					p.circle(xPos * drawResolution, drawPrintheadYpos * drawResolution, nozzleDiam * drawResolution);
					// p.line(xPos * drawResolution, centerY * drawResolution, xPos * drawResolution, canvasHeight)
				}
			}
		}
	p.pop();

	// Draw nozzle nr above the nozzle
	p.noFill();
	p.stroke('yellow');
	for (bSteps = 0; bSteps < bigPasses; bSteps++){
		for (x = 0; x < nrOfNozzles; x++) {
			if(bSteps > 0) p.fill('darkGray');
			let xPos = centerX + x * (nozzleSpacingX * drawResolution) + bSteps*(nrOfNozzles * nozzleSpacingX) + (sliderShowPasses.value()-1) * dotSpacingX;
			// p.line(xPos * drawResolution, centerY * drawResolution, xPos * drawResolution, canvasHeight)
			p.push();
			p.fill('black')
			p.noStroke();
			if(x == 0 || bSteps == 0) p.text(x + 1, xPos * drawResolution - (nozzleDiam/2), drawPrintheadYpos * drawResolution - (nozzleDiam / 1.95) * drawResolution);
			p.pop();
		}
	}
	
	// Draw Nozzle spacing dimension
	p.push();
		p.stroke('black');
		p.fill('black');
		let xpos = centerX + (sliderShowPasses.value()-1) * dotSpacingX;
		p.line(xpos, drawPrintheadYpos+nozzleDiam/2+5, xpos+nozzleSpacingX, drawPrintheadYpos+nozzleDiam/2 + 5);
		p.line(xpos, drawPrintheadYpos+nozzleDiam/2, xpos, drawPrintheadYpos+nozzleDiam/2 + 10);
		p.line(xpos+nozzleSpacingX, drawPrintheadYpos+nozzleDiam/2, xpos+nozzleSpacingX, drawPrintheadYpos+nozzleDiam/2 + 10);
		p.noStroke();
		p.text(p.round(nozzleSpacingX, 1) + ' um', xpos - 15 + nozzleSpacingX/2, drawPrintheadYpos+nozzleDiam/2+20);
	p.pop();
	
	p.stroke('darkgray');
	p.strokeWeight(1);

    //drawSteps();
}
/*
function drawSteps() {
    p.fill('black');
    p.stroke('cyan');
    printheadNpi = sliderPrintheadNpi.value();
    nrOfNozzles = sliderNrNozzles.value();
    dpiX = printheadNpi * (sliderXRes.value() + 1);
    let passes = p.round(dpiX / printheadNpi);
    let dotSpacingX = 1000.0 / ((dpiX) / 25.4);
    let nozzleSpacingX = 1000.0 / (printheadNpi / 25.4);

    for (let x = 0; x < nrOfNozzles; x++) {
        for (let p = 0; p < passes; p++) {
            let xPos = centerX + x * (nozzleSpacingX * drawResolution) + (p * dotSpacingX);
            p.line(xPos * drawResolution, centerY * drawResolution, xPos * drawResolution, canvasHeight);
            //let xPos = (x*(p+1)*dotSpacingX + initalXpos);
        }
    }

}
*/
/* 
// This is a dot hitting substrate animation. Paste in editor.p5js.org


function setup() {
  frameRate(25);
  createCanvas(350, 220);
}

const dropDiam = 25;
let w = dropDiam;
let h = dropDiam;
const startYPos = 5;
let yPos = startYPos;
let state = 0;
const dotHeightFactor = 1.4;
const dotGain = 2.0;
let delayCounter = 0;

function draw() {
  background(220);
  
  fill('white');
  rect(210,88, 120, 100);
  
  fill('black');
  
  text('side view', 80, 200);
  text('top view', 250, 200);
  text('<-- dot gain -->', 230, 105);
  
  fill('lightgreen');
  
  switch(state){
    case 0:  // CIRCLE mode
      circle( 100, yPos, w);
      circle( 275, 140, w);
      yPos = yPos + 2;
      if( yPos >= 100 - dropDiam/2) state = 1;
      break;
    case 1:  // ELLIPSE mode
      ellipse(100, yPos, w, h);
      circle( 275, 140, w);
      w += 1;
      h -= 0.5;  
      yPos+=1.75;
      if(yPos >= 100-4){
        state = 2;
      }
       break;
    case 2:  // ARC mode
      arc(100, 100, w, h*dotHeightFactor, PI, 0, CHORD);
      circle( 275, 140, w);
      w = w+1;
      h = h-0.5; 

      if(w > dropDiam * dotGain){
        state = 3;
      }     
      break;
    case 3:
      if(delayCounter < 20){
          arc(100, 100, w, h*dotHeightFactor, PI, 0, CHORD);
          circle( 275, 140, w);
      } else{ 
        state = 99;
      }
      delayCounter++;
      break;
    case 99:  // reset
      w = dropDiam;
      h = dropDiam;
      yPos = startYPos;  
      delayCounter = 0;
      state = 0;
    default:
      break;
  
  }
  
  fill('white');
  rect(20, 100, 150, 80);

  fill('black');
  text('<-- dot gain -->', 55, 120);
  
}


*/

const dropletAnimation_startXPos = 500;
const dropletAnimation_startYPos = 300;
const dropletAnimation_dropW = 40;
const dropletAnimation_dropH = dropletAnimation_dropW;
let dropletAnimation_yPos = dropletAnimation_startYPos-50;
let dropletAnimation_frameCnt = 0;
let dropletAnimation_w = dropletAnimation_dropW;
let dropletAnimation_h = dropletAnimation_dropH;
const dropletAnimation_dropPosXY_const = [500, 300];
let dropletAnimation_dropPosXY = dropletAnimation_dropPosXY_const;


	let jdelayCounter = 0;
	let jstate = 0;
	let jyPos = 30;
	const jstartYPos = 30;
	const jdropDiam = 25;
	let jw = jdropDiam;
	let jh = jdropDiam;
	
function newJetAnnimation(p){
	const dotHeightFactor = 1.4;
	const dotGain = 1.8;

  p.push();
  p.fill('lightgray');
  //p.rect(dropletAnimation_startXPos-200, dropletAnimation_startYPos-200, 400, 200);
  p.stroke('black');
  p.fill('white');
  
  switch(jstate){
    case 0:  // CIRCLE mode
      p.circle( 100, jyPos, jw);
      p.circle( 300, 200, jw);
      jyPos = jyPos + 2;
      if( jyPos >= 100 - jdropDiam/2) jstate = 1;
      break;
    case 1:  // ELLIPSE mode
      p.ellipse(100, jyPos, jw, jh);
      p.circle( 300, 200, jw);
      jw += 1;
      jh -= 0.5;  
      jyPos+=1.75;
      if(jyPos >= 100-4){
        jstate = 2;
      }
       break;
    case 2:  // ARC mode
      p.arc(100, 100, jw, jh*dotHeightFactor, p.PI, 0, p.CHORD);
      p.circle( 300, 200, jw);
      jw = jw+1;
      jh = jh-0.5; 

      if(jw > jdropDiam * dotGain){
        jstate = 3;
      }     
      break;
    case 3:
      if(jdelayCounter < 20){
          p.arc(100, 100, jw, jh*dotHeightFactor, p.PI, 0, p.CHORD);
          p.circle( 300, 200, jw);
      } else{ 
        jstate = 99;
      }
      jdelayCounter++;
      break;
    case 99:  // reset
      jw = jdropDiam;
      jh = jdropDiam;
      jyPos = jstartYPos;  
      jdelayCounter = 0;
      jstate = 0;
    default:
      break;
  
  }
  p.rect(20, 100, 150, 100);
  p.pop();
}


let dropletAnimationYPos = 5;
let dropletAnimationState = 0;
let dropletAnimationDelayCounter = 0;
let dropletAnimationW = 25;
let dropletAnimationH = 25;
function drawDropletSubstrateAnimation(p){
	p.push();
	p.textSize(10);
	const dropDiam = 25;
	const dotHeightFactor = 1.4;
	const dotGain = 1.8;
	let xp = dropletAnimation_startXPos-200;
	let yp = dropletAnimation_startYPos-200;

	p.fill('lightgray');
	p.rect(xp, yp, 400, 230);
	p.fill('white');
	p.rect(xp+210, yp+88, 120, 100);
	p.fill('black');
	p.text('side view', xp+80, yp+200);
	p.text('top view', xp+250, yp+200);
	p.text('<-- dot gain -->', xp+230, yp+105);
	p.fill('Lime');
  
	switch(dropletAnimationState){
	case 0:  // CIRCLE mode
	  p.circle( xp+100,  yp+dropletAnimationYPos, dropletAnimationW);
	  p.circle( xp+275,  yp+140, dropletAnimationW);
	  dropletAnimationYPos = dropletAnimationYPos + 2;
	  if( dropletAnimationYPos >= 100.0 - dropDiam/2) dropletAnimationState = 1;
	  break;
	case 1:  // ELLIPSE mode
	  p.ellipse(xp+100,  yp+dropletAnimationYPos, dropletAnimationW, dropletAnimationH);
	  p.circle( xp+275,  yp+140, dropletAnimationW);
	  dropletAnimationW += 1;
	  dropletAnimationH -= 0.5;  
	  dropletAnimationYPos+=1.75;
	  if(dropletAnimationYPos >= 100-4){
		dropletAnimationState = 2;
	  }
	   break;
	case 2:  // ARC mode
	  p.arc(xp+100,  yp+100, dropletAnimationW, dropletAnimationH*dotHeightFactor, p.PI, 0, p.CHORD);
	  p.circle( xp+275,  yp+140, dropletAnimationW);
	  dropletAnimationW = dropletAnimationW+1;
	  dropletAnimationH = dropletAnimationH-0.5; 

	  if(dropletAnimationW > dropDiam * dotGain){
		dropletAnimationState = 3;
	  }     
	  break;
	case 3:
	  if(dropletAnimationDelayCounter < 20){
		  p.arc(xp+100,  yp+100, dropletAnimationW, dropletAnimationH*dotHeightFactor, p.PI, 0, p.CHORD);
		  p.circle( xp+275,  yp+140, dropletAnimationW);
	  } else{ 
		dropletAnimationState = 99;
	  }
	  dropletAnimationDelayCounter++;
	  break;
	case 99:  // reset
	  dropletAnimationW = dropDiam;
	  dropletAnimationH = dropDiam;
	  dropletAnimationYPos = 5;  
	  dropletAnimationDelayCounter = 0;
	  dropletAnimationState = 0;
	default:
	  break;

	}

	p.fill('white');
	p.rect(xp+20,  yp+100, 150, 80);

	p.fill('black');
	p.text('<-- dot gain -->', xp+55,  yp+120);

	p.pop();
  	
}

/*
function drawDropletSubstrateAnimation2(p){
  p.push();
  p.fill('lightgray');
  p.rect(dropletAnimation_startXPos-200, dropletAnimation_startYPos-200, 400, 200);
  
  p.stroke('black');
  p.fill(colorPicker.color());

  if(dropletAnimation_yPos < dropletAnimation_startYPos){
    p.circle(dropletAnimation_startXPos, dropletAnimation_yPos, dropletAnimation_dropW);
    dropletAnimation_yPos += 2;
  }
  else{
    p.arc(dropletAnimation_startXPos, dropletAnimation_startYPos, dropletAnimation_w, dropletAnimation_h, p.PI, 0, p.CHORD);
    dropletAnimation_w += 2;
    dropletAnimation_h -= 1; 
  
    if(dropletAnimation_h < 6){
      dropletAnimation_w = dropletAnimation_dropW;
      dropletAnimation_h = dropletAnimation_dropH;
	  dropletAnimation_yPos = dropletAnimation_startYPos-50;
	  dropletAnimation_frameCnt = 0;	// start animation from beginning
    }     
  }
  p.fill('gray');
  p.rect(dropletAnimation_startXPos-200, dropletAnimation_startYPos, 400, 100);
 
  dropletAnimation_frameCnt++;
  //p.fill('black');
  //p.text(dropletAnimation_frameCnt, 500, 210);
  p.pop();
} 
*/


let timer = 500; //ms
let nextChange = timer; //syncs the timer and change rate
let dgSliderUp = true;
let stpSliderUp = true;
let oldPassesValue=-1; 
let oldQualityFactor=-1;
let animationFrameCounter = 0;
let animateDotsInPrintDirection = false;
let prevNumY = -1;
let prevNumX = -1;
let prevShape = -1;
let prevInvShapeChecked = false;
let prevLineWidht = -1;

// wrap function to wrap a value withing a certain range both ways.
// example wrap(11, 10) returns 1;
// wrap(10, 10) returns 0;
// wrap(-1, 10) returns 9;
// wrap(21, 10) returns 1;
// function wrap(v, range){
	// if(v<0){
		// let normalizedVal = parseInt(v % range);
		// //normalizedVal += 0; // to prevent negative zero
		// console.log('normalizedVal ' + normalizedVal + ' output ' + (range-1+normalizedVal));
		// return normalizedVal < 0 ? range-1+normalizedVal : 0;	// wrap around in positive range
	// }

	// return v%range;
// }

//https://github.com/semibran/wrap-around/issues/1#issuecomment-1398028921
function wrap(n, m) {	// value, range
  return n >= 0 ? n % m : (n % m + m) % m
}

function resizeArray(array, newSize, defaultValue) {
    while(newSize > array.length)
        array.push(defaultValue);
    array.length = newSize;
}

function resize2DArray(array, newSize){
    while(newSize > array.length)
        array.push([false]);
    array.length = newSize;
}

function drawMain(p) {
	if(p.keyIsPressed){
		if( p.keyCode == p.CONTROL){
			p.cursor(p.CROSS);
		} 
	}
	else p.cursor(p.ARROW);
	

	
	switch(sliderQualityFactor.value()){
		case 1:
			qualityFactorMask = qfMask1pass;
		break;
		case 2:
			qualityFactorMask = qfMask2pass;
		break;
		case 3:
			qualityFactorMask = qfMask3pass;
		break;
		case 4:
			qualityFactorMask = qfMask4pass;
		break;
		case 5:
			qualityFactorMask = qfMask5pass;
		break;
		default:
			qualityFactorMask = qfMask1pass;
		break;
	}
	
	
	
    p.background(180)
	m_numberOfPrintedDrops = 0;
    
	nrOfNozzles = sliderNrNozzles.value();
    printheadDropsize = sliderDropsize.value();
    dotGain = sliderDotGain.value() / 10.0;
    printheadNpi = sliderPrintheadNpi.value();
    dpiX = printheadNpi * (sliderXRes.value() + 1);
    gridSizeX = nrOfNozzles * (dpiX / printheadNpi);
    darkenDotsPerPass = checkboxDarkenDots.checked();
    let passes = p.round(dpiX / printheadNpi);
    if (checkboxLinkXYres.checked()) {
        sliderYRes.value(dpiX);
    }
    dpiY = sliderYRes.value();
	
	if(checkboxImgResolutionSameAsPrintResolution.checked()){
		sliderImgResolutionX.value( dpiX );
		sliderImgResolutionY.value( dpiY );
	}
	
	let imgDpiX = sliderImgResolutionX.value();
	let imgDpmmX = imgDpiX / 25.4; // pixels per mm
	
	if(userImage != null && userImageLoadingComplete==true){
		if( userImage.width > 200 || userImage.height > 200){	// image is too large. Ignore
			alert("Imgage size is larger than 200x200 pixels, your image is " + userImage.width + "x" + userImage.height);
			userImage = null;
		}
		else if( !Number.isInteger(userImage.width) || !Number.isInteger(userImage.height)){
			alert("Imgage size is not valid, your image is " + userImage.width + "x" + userImage.height);
			userImage = null;
		}
		else {
			prevNumX = -1; // to make sure to refresh
			let imgWidthUm = p.floor((userImage.width / (imgDpiX / 25.4)) * 100.0) * 10; 
			let imgHeightUm = p.floor((userImage.height / (imgDpiX / 25.4)) * 100.0) * 10; 
			sliderImgWidthUm.value(imgWidthUm);
			sliderImgHeightUm.value(imgHeightUm);
		}
	}	
	
	let imgWidhtVal = sliderImgWidthUm.value();
	numX = p.ceil((imgWidhtVal / 1000) * (imgDpiX / 25.4), 0);	
	numY = p.ceil(( sliderImgHeightUm.value()/1000) * (sliderImgResolutionY.value() / 25.4), 0);

	qualityFactor = sliderQualityFactor.value();


    p.fill('black');
    let ctrlXPos = 25;
    let ctrlYPos = 0;
    let ctrlYSpacing = 30;


    ctrlYPos += ctrlYSpacing;

    let dotSpacingX = 1000.0 / ((dpiX) / 25.4);
    let dotSpacingY = 1000.0 / ((dpiY) / 25.4);
	let nozzleDiam = p.pow( 3*printheadDropsize / (4 * p.PI), 1/3) * 2 * 10;
	let dotSize = p.pow(3*printheadDropsize / (2*p.PI), 1/3) * 2 * 10 * dotGain;
    let initalYpos = centerY + 100; //nozzleDiam * 2.0;
    let initalXpos = centerX;
    let nozzleSpacingX = 1000.0 / (printheadNpi / 25.4);
    let textYoffset = 8;
	
	if(passes != oldPassesValue || qualityFactor != oldQualityFactor){
		oldPassesValue = passes;
		oldQualityFactor = qualityFactor
		sliderShowPasses.value(passes * qualityFactor);
	}
	
	if( sliderShowPasses.value() > passes * qualityFactor) sliderShowPasses.value(passes * qualityFactor);
	

	
	if(numY != prevNumY || numX != prevNumX)
	{
		if(numY != prevNumY){
			if(sliderCrossSectionYPos.value()>numY) sliderCrossSectionYPos.value(numY);
			prevNumY = numY;
		}
		
		resize2DArray(jet, numX);
		resize2DArray(jetted, numX);
		
		mx = [];
		my = [];
		pass = [];

		// Generate all possible jet postitions
		for (let x = 0; x < numX; x++) {
			//jet[x] = [];
			resizeArray(jet[x], numY, false);
			resizeArray(jetted[x], numY, false);
			mx.push(p.round(x * dotSpacingX + initalXpos));
			for (let y = 0; y < numY; y++) {
				my.push(p.round(y * dotSpacingY + initalYpos));
			}
		}
		
		prevNumX = numX;
		
		if(userImage != null && userImageLoadingComplete){
			drawUserImage(p);
			radioBtnShape.selected('6');
			userImage = null;	// only draw once
			userImageLoadingComplete = false;
		}
		else generatePattern(p);
	}
	

	// clear the canvas when the shape has changed, except for the free draw mode
	if(prevShape != radioBtnShape.value() || prevLineWidht != sliderLineWidth.value()){
		prevShape = radioBtnShape.value();
		prevLineWidht = sliderLineWidth.value();
		if(radioBtnShape.value() != 6) generatePattern(p);
	}
		
	if(sliderCrossSectionYPos.value() > numY){
		sliderCrossSectionYPos.value(numY);
	}
	
	p.textSize(13);
	textSpacing = 15;
	
    // Cylinder hight based on volume calculation
	let dotThickness = (1000 * printheadDropsize) / (p.PI * p.pow(dotSize/2.0, 2.0));
	
	// large area layer thickness calculation based on volume and print resolution
	let layerThickness = (printheadDropsize * 1000) / (dotSpacingX * dotSpacingY);
	
    p.textSize(12);
    p.fill('white');
    p.stroke('slategray');

	if(prevInvShapeChecked != checkboxInvertShape.checked()){
		prevInvShapeChecked = checkboxInvertShape.checked();
		for (let x = 0; x < numX; x++) {
			for (let y = 0; y < numY; y++) {
				jet[x][y] = !jet[x][y];
			}
		}
	}
	
    gridXoffset = dotSpacingX / 2;
    gridYoffset = dotSpacingY / 2;

    // draw grid
    if (checkboxGrid.checked()) {
        p.stroke("white");
        for (let x = 0; x < numX; x++) {
            for (let y = 0; y < numY; y++) {
                p.line(mx[x] - gridXoffset, my[0] - gridYoffset, mx[x] - gridXoffset, my[numY - 1] + gridYoffset); // vertical lines
                p.line(mx[0] - gridXoffset, my[y] - gridYoffset, mx[numX - 1] + gridXoffset, my[y] - gridYoffset); // horizontal lines
            }
        }
        // add last line at the right and bottom
        p.line(mx[numX - 1] + gridXoffset, my[0] - gridYoffset, mx[numX - 1] + gridXoffset, my[numY - 1] + gridYoffset); // vertical line
        p.line(mx[0] - gridXoffset, my[numY - 1] + gridYoffset, mx[numX - 1] + gridXoffset, my[numY - 1] + gridYoffset); // horizontal line
    }
    
	p.stroke('white');
    p.fill('black');
	

		
    // draw pattern
    if (checkboxImagePix.checked()) {
        for (let x = 0; x < numX; x++) {
            for (let y = 0; y < numY; y++) {
                if (jet[x][y]) {
                    p.rect(mx[x] - gridXoffset, my[y] - gridYoffset, dotSpacingX, dotSpacingY);
                }
            }
        }
    }

	// Draw pixel size value above the first pixel postion
	if(!checkboxDots.checked() && (checkboxImagePix.checked() || checkboxGrid.checked())){
		// add pixel size X
		p.push();
			p.stroke('black');
			p.fill('black')
			let pointA = p.createVector(mx[0]-dotSpacingX/2, my[0]-dotSpacingX/1.8);
			p.line(pointA.x, pointA.y, pointA.x+dotSpacingX, pointA.y);
			p.noStroke();
			p.text(p.round(dotSpacingX, 1) + ' um pix', pointA.x, pointA.y-4);
		p.pop();				
	}


    // Draw dots
	let tempY = animateDotsInPrintDirection ? parseInt(animationFrameCounter%numY) : numY;
	let swathnr = parseInt((animationFrameCounter/(numY)));
	let swathNr = parseInt((animationFrameCounter/(numY)));
	
	let showMaxY = animateDotsInPrintDirection ? parseInt(animationFrameCounter%numY) : numY;
		
						
	// NEW and better code to generate the dots below
	///////////////////////////////////////////////

	for(let xx = 0; xx<numX; xx++){
		for(let yy = 0; yy<numY; yy++){
			jetted[xx][yy] = false;
		}
	}

	
if(checkboxDots.checked()){
	p.stroke('slategray');
	let color = colorPicker.color();
    p.fill(color);

	let darkenValue = 0;
	for(let qf=0; qf<qualityFactor; qf++){
		for(let ps=0; ps<passes; ps++){
			if(ps + (qf*passes) >= sliderShowPasses.value()){
				continue;
			}
			
			if(animateDotsInPrintDirection){
				let ps_qf = ps + (passes * qf);
				if(swathNr == ps_qf){
					showMaxY = parseInt(animationFrameCounter%numY)+1;
					drawPrintheadYpos = my[showMaxY-1];
					if(checkboxBiDirectional.checked() && (ps + (qf*passes))%2 == 1){
						drawPrintheadYpos = my[numY-showMaxY];
					}
				}
				else if(swathNr > ps_qf) showMaxY = numY;
				else showMaxY = 0;
			}
			
			for(let head=0; head<sliderShowBigPasses.value(); head++){
				for(let nzl=0; nzl<nrOfNozzles; nzl++){
					if(head == 0 && !enabledNozzlesPerHead[0][nzl]){
					//if(!enabledNozzles[nzl]){
						continue;	// skip if this nozzle is disabled
					}
					
					let x = (head * nrOfNozzles * passes) + (nzl * passes) + ps + (qf * passes);
					
					if(x >= numX) 
						continue;	// ready because there are no more pixels to print

					let compQfactors = [];
					// Check nozzles next to the current one if there are disabled nozzles
					// to compensate by this nozzle
					let mostRightNzl = nzl + (qualityFactor-1);
					mostRightNzl %= nrOfNozzles; // wrap around if overflow
					let mostLeftNzl = nzl - (qualityFactor-1);
					mostLeftNzl = mostLeftNzl < 0 ? nrOfNozzles + mostLeftNzl : mostLeftNzl;
					
					if(checkboxCompensateDefectNzls.checked()){
						
						if( nzl==0 && head==0 )	// have the first nozzle print 100%
						{
							for(let i=1; i<qualityFactor; i++){
								compQfactors.push(wrap(qf + i, qualityFactor));
							}
						}
						
						// edge case
						if(false){/*
						//if(mostLeftNzl > mostRightNzl){
							for(let nn = mostLeftNzl; nn < nrOfNozzles; nn++){
								if( nn == nzl) continue;
								if( !enabledNozzles[nn] ){
									let dist = p.abs(nzl - nn);
									if (dist >= qualityFactor){
										dist = nrOfNozzles - dist;
									}
									compQfactors.push(wrap(qf + dist, qualityFactor));
									// for(let i=0; i<qf; i++){
										// compQfactors.push(wrap(qf + i + 1, qualityFactor));
									// }
								}
							}
							for(let nn=0; nn <= mostRightNzl; nn++){
								if( nn == nzl) continue;
								if( !enabledNozzles[nn]){
									let dist = p.abs(nzl - nn);
									if (dist >= qualityFactor){
										dist = nrOfNozzles - dist;
									}
									compQfactors.push(wrap(qf - dist, qualityFactor));
								}
							}
						*/}
						else
						{
							for(let nn = mostLeftNzl; nn <= mostRightNzl; nn++){
								if( nn == nzl) continue;
								if( !enabledNozzlesPerHead[0][nn] && head==0){
									let dist = p.abs(nzl - nn);
									if (dist >= qualityFactor){
										dist = nrOfNozzles - dist;
									}
									if(nzl < nn)
										compQfactors.push(wrap(qf-dist, qualityFactor));
										//compQfactors.push(wrap(qf-1, qualityFactor));
										// for(let i=0; i<qf; i++){
											// compQfactors.push(wrap(qf+i+1, qualityFactor));
										// }
									else
										compQfactors.push(wrap(qf+dist, qualityFactor));
										// for(let i=1; i<qualityFactor-qf; i++){
											// compQfactors.push(wrap(qf - i, qualityFactor));
										// }										
								}
							}						
						}
					}
					
					//if(nzl == 6) console.log('MLN: ' + mostLeftNzl + ' MRN: ' + mostRightNzl + ' nrNzls: ' + nrOfNozzles + ' comp: ' + compQfactors[0] + ' defectNzl: ' + enabledNozzles[nzl+1] + ' ' + enabledNozzles[nzl+2] + ' qf: ' + qf);


					for(let idY=0; idY<showMaxY; idY++){
						let y = idY;
//// debug - disable nzl 10 ///////						
// if(nzl == 1-1 && y == 1 && x == 10 && passes == 1){

	// console.log('breakpoint');
// }	
///// debug //////					
						
						if(checkboxBiDirectional.checked() && (ps + (qf*passes))%2 == 1){
							y = numY - 1 - idY; 
						}

						// Skip if there is already printed a dot at this xy coordinate or no pixel to print.
						if(!jet[x][y]) 
							continue;
						
						if(jetted[x][y])
							continue;
									
						// apply the qf mask over the xy position. The mask can be any size in x or y. 
						let qfX = x % qualityFactorMask[0].length;
						let qfY = y % qualityFactorMask.length;
				
						// Don't print a dot if the qf does not print the QF mask
						// unless a defect nozzle needs to be compensated
						let printDot = true;
						if(qualityFactorMask[qfY][qfX] != qf){
							printDot = false;
							
							// Check if this nozzle needs to compensate one- or more defect nozzles
							for(let i = 0; i <  compQfactors.length; i++){
								if(qualityFactorMask[qfY][qfX] == compQfactors[i]){
									printDot = true;
								}
							}
						}

		
						// Skip when there is nothing to compensate and 
						// prevent nozzles from over compensating in case there 
						// has been printed a droplet on this position already.
						if( !printDot )
							continue;
					
						// place the dot
						p.circle(mx[x], my[y], dotSize);
						
						if(jetted[x][y] == false) m_numberOfPrintedDrops++;
						
						jetted[x][y] = true;
					
						// add nozze nr
						if(checkboxNozzleNrs.checked()){
							p.push();
								if(nzl%2==0){
									p.fill('gray');
									p.stroke('gray');
								}
								else{
									p.fill('white');
									p.stroke('white');
								}
								let offset = nzl>=9 ? 8 : 4;
								p.text(nzl+1, mx[x]-offset, my[y]);
								p.text(qf, mx[x]-4, my[y]+8);
							p.pop();
						}
					}
				}
			}

			// Darken the fill color depending on the current print pass
			if(darkenDotsPerPass){
				darkenValue += parseInt( 195 / (passes * qualityFactor) );
				darkenValue = p.min(darkenValue, 195);
				let bl = p.constrain(p.blue(color) - darkenValue, 0, 255);
				let gr = p.constrain(p.green(color) - darkenValue, 0, 255);
				let rd = p.constrain(p.red(color) - darkenValue, 0, 255);
				p.fill(rd, gr, bl);
			}
		}			
	}
	}

	
		// add dot size diameter
		p.push();
			p.stroke('black');
			p.fill('black');
			let pointA = p.createVector(mx[0]-dotSize/2, my[0]-dotSize/1.7);
			p.line(pointA.x, pointA.y, pointA.x+dotSize, pointA.y);
			p.noStroke();
			p.text(p.round(dotSize, 1) + ' um dot', pointA.x, pointA.y-4);
		p.pop();		
    

	if(animateDotsInPrintDirection){
		let currPass = parseInt((animationFrameCounter/(numY)));
		animationFrameCounter++;
		if (animationFrameCounter > numY * passes * qualityFactor){
			animationFrameCounter = 0;
			if(!checkboxLoopAnimation.checked()){
			  animateDotsInPrintDirection = false;
			}
		}
		else{
			sliderShowPasses.value(currPass+1);
		}
	}
	
	let crossYPos = sliderCrossSectionYPos.value()-1;

	if(false){

		let nrPix = p.windowWidth; ///(mx[0]-dotSize/2) + (mx[numX-1]+dotSize/2);
		let vertexArray = [];
		extendArray(nrPix, vertexArray);
		clearArray(vertexArray);

		// Cross section of the dots. 
		
		const nozzleHeightFactor = 1.0;	
			
		
        p.stroke('slategray');
		let color = colorPicker.color();
		let y = crossYPos; //p.floor(numY / 2);	// cross section in the middle of height of image
        p.fill(color);
		let overlap = 0; // overlap in percentage per dot
		//let darkenValue = 0;
        for (let ps = 0; ps < passes; ps++) {
			if(ps < sliderShowPasses.value()){
				for (let x = ps; x < numX; x += passes){
					if( x < (sliderShowBigPasses.value() * nrOfNozzles * passes)){
						// First calculate the cross section of all drops on the x axis of the selected Y pos.
						if (jet[x][y]){
							addDotToVertexArray(p, mx[x], 900, dotSize, (nozzleHeightFactor*nozzleDiam/dotGain), vertexArray);
						}
						
						// Next calculate the cross sections of all colums on the Y axis to add any overlap to the X axis cross section.
						{
							let vertexArray_Y = [];
							extendArray(p.windowHeight, vertexArray_Y);
							clearArray(vertexArray_Y);
							let yEmpty = true;
							for(let y = 0; y < numY; y++){
								if (jet[x][y]){
									if(y == crossYPos) continue;	// skip this position to not add the volume of the same pixel twice at the row/column intersection.
									addDotToVertexArray(p, my[y], mx[x], dotSize, (nozzleHeightFactor*nozzleDiam/dotGain), vertexArray_Y);
									yEmpty = false;

								}
							}
							
							if(yEmpty) continue;
							
							let _start = mx[x] - p.round(dotSize/2);
							let _stop = _start + p.round(dotSize);	
							let totalDotHeight = 0;
							
							// Take the cross point in the middle of the pixel for x and y
							averageDotHeight = vertexArray_Y[_start + p.round(dotSize/2) + my[y]-mx[x]];

							// Add the overlap to the current x,y position in a simple linear (triangle) calculation
							let v = 0;
							let cnt = 0;
							for(let i=_start; i<_stop; i++){
								if(i < _start + dotSize/2){
									cnt++;
								}
								else{
									
									cnt--;
								}
								v = ((averageDotHeight*2) / dotSize) * cnt;
								vertexArray[i] += p.round(v);
							}

							// // Draw the Column cross section for debugging purposes
							// p.push();
								// p.beginShape();
									// let i = 0;
									// for(i=0; i<vertexArray_Y.length-1; i++){
											// let yVal = (vertexArray_Y[i-1] + vertexArray_Y[i] + vertexArray_Y[i+1])/3;
										// p.vertex(i - my[y]+mx[x], 850-yVal);
										// }
									// p.vertex(i, 850);
								// p.endShape(p.CLOSE);
							// p.pop();
						}
					}
				}

			}
        }
		
		// Draw the cross section
		p.fill(colorPicker.color());
		let averagedArray = [];
		averageArray(p, vertexArray, averagedArray, sliderPlanarization.value());
		p.beginShape();
		let i = 0;
		averagedArray[0] = 0;
		averagedArray[averagedArray.length-1] = 0;
		for(i=0; i<averagedArray.length-1; i++){
			p.vertex(i, 900-averagedArray[i]);
			}
		p.vertex(i, 900);
		p.endShape(p.CLOSE);
	}
	
	//loadPixels();
	//let smoothedPoints = [];
	//smoothPoints(smoothedPoints, mergedPoints);
	// console.log('nr MergedPoints ' + mergedPoints.length);
	// printLine(smoothedPoints);
	//printLine(smoothedPoints, 900);
	//updatePixels();
	
	p.stroke('black');
    p.fill('white');
	
	// Draw an arrow to indicate the cross section Location
	let triangleX = centerX - 40;
	let triangleY = my[crossYPos];
	p.triangle(triangleX, triangleY-12.5, triangleX, triangleY+12.5, triangleX+25, triangleY);
	p.push();
	p.stroke('gray');
	p.strokeWeight(1);
	p.line(triangleX+25, triangleY, mx[numX-1], triangleY);
	p.pop();
	p.stroke('white');
    p.fill('black');
	
    drawPrinthead(p);
	if(checkboxJetAnimation.checked()){
		drawDropletSubstrateAnimation(p);
	}

	InfoTextBox(p, p.width - 250, initalYpos);
}

function drawCrossSection(p){
	let baseLineYPos = p.height;
    let printheadDropsize = sliderDropsize.value();
    let dotGain = sliderDotGain.value() / 10.0;
	let dotSize = p.pow(3*printheadDropsize / (2*p.PI), 1/3) * 2 * 10 * dotGain;
	let nozzleDiam = p.pow( 3*printheadDropsize / (4 * p.PI), 1/3) * 2 * 10;
		
	let nrPix = p.windowWidth; ///(mx[0]-dotSize/2) + (mx[numX-1]+dotSize/2);
	let vertexArray = [];
	extendArray(nrPix, vertexArray);
	clearArray(vertexArray);
	
	// Cross section of the dots. 
	let crossYPos = sliderCrossSectionYPos.value()-1;
    if (true/*checkboxDots.checked()*/) {
        p.stroke('slategray');
		let color = colorPicker.color();
		let y = crossYPos;
        p.fill(color);
		//let darkenValue = 0;
		
		for(let x = 0; x < numX; x++){
			if (jetted[x][y]){
				addDotToVertexArray(p, mx[x], baseLineYPos, dotSize, (nozzleDiam/dotGain), vertexArray);
				
				let vertexArray_Y = [];
				extendArray(p.windowHeight, vertexArray_Y);
				clearArray(vertexArray_Y);
				let yEmpty = true;
				for(let y = 0; y < numY; y++){
					if (jetted[x][y]) {
						if(y == crossYPos) 
							continue;	// skip this position to not add the volume of the same pixel twice at the row/column intersection.
			
						addDotToVertexArray(p, my[y], mx[x], dotSize, (nozzleDiam/dotGain), vertexArray_Y);
						yEmpty = false;
					}
				}
				
				if(yEmpty) continue;
				
				let _start = mx[x] - p.round(dotSize/2);
				let _stop = _start + p.round(dotSize);	
				let totalDotHeight = 0;
				
				// Take the cross point in the middle of the pixel for x and y
				averageDotHeight = vertexArray_Y[_start + p.round(dotSize/2) + my[y]-mx[x]];

				// Add the overlap to the current x,y position in a simple linear (triangle) calculation
				let v = 0;
				let cnt = 0;
				for(let i=_start; i<_stop; i++){
					if(i < _start + dotSize/2){
						cnt++;
					}
					else{
						
						cnt--;
					}
					v = ((averageDotHeight*2) / dotSize) * cnt;
					vertexArray[i] += p.round(v);
				}					
				
			}
		}
		
	
		// draw a line every 10 pixes = 1 um
		p.push();
			p.stroke('gray');
			p.strokeWeight(0.25);
			for(let h=p.height; h>=0; h-=10){
				p.line(0,h, p.width, h);
			}
		p.pop();
		
		
		let solidContent = sliderSolidContent.value()/100;
		let maxYValue = 100;
		// Draw the cross section
		p.fill(colorPicker.color());
		let averagedArray = [];
		averageArray(p, vertexArray, averagedArray, sliderPlanarization.value());
		p.beginShape();
			let i = 0;
			averagedArray[0] = 0;
			averagedArray[averagedArray.length-1] = 0;
			for(i=0; i<averagedArray.length-1; i++){
				let yValue = p.round(averagedArray[i] * solidContent);
				p.vertex(i, baseLineYPos-yValue);
				maxYValue = p.max(maxYValue, yValue);
			}
			p.vertex(i, baseLineYPos);
		p.endShape(p.CLOSE);
	}
}

/*
CircleOverlap Where:
- d1 and d2 are the diameters of the 2 circles
- dist is distance between centers of 2 circles
- R1 and R2 are the radii of the two circles
- d is the distance between the centers of the two circles

The formula calculates the area of the overlapping region by taking into account the individual areas of the two circles and the geometry of the overlap. The key steps are:

    Calculate the arccos term for each circle, which gives the angle of the overlapping region.
    Multiply each arccos term by the square of the respective radius to get the area of the overlapping region for each circle.
    Subtract the area of the overlapping region, which is calculated using the square root term.

 This formula works for any two overlapping circles, regardless of their relative sizes and positions.
 Area of overlap = (R1^2 * arccos((d^2 + R1^2 - R2^2) / (2 * d * R1))) + (R2^2 * arccos((d^2 + R2^2 - R1^2) / (2 * d * R2))) - 0.5 * sqrt((-d + R1 + R2) * (d + R1 - R2) * (d - R1 + R2) * (d + R1 + R2))
*/
function CircleOverlap(d1, d2, dist){
	let R1 = d1 / 2;
	let R2 = d2 / 2;
	let d = dist;
	return (R1*R1 * Math.acos((d*d + R1*R1 - R2*R2)) / (2 * d * R1)) + (R2*R2 * Math.acos((d*d + R2*R2 - R1*R1) / (2 * d * R2))) - 0.5 * Math.sqrt((-d + R1 + R2) * (d + R1 - R2) * (d - R1 + R2) * (d + R1 + R2))
}

function dropOverlap(dotSize, dist){
	let dotRadius = dotSize/2;
	let dotArea = p.PI * dotRadius * dotRadius;
	let overlapArea = areaOfIntersection(100, 100, dotRadius, dist+100, 100, dotRadius);
	p.text(overlapArea, 400, 900);
	return overlapArea / dotArea;	// percentage of overlap of droplet
}

function areaOfIntersection(x0, y0, r0, x1, y1, r1)
{
  var rr0 = r0*r0;
  var rr1 = r1*r1;
  var c = Math.sqrt((x1-x0)*(x1-x0) + (y1-y0)*(y1-y0));
  var phi = (Math.acos((rr0+(c*c)-rr1) / (2*r0*c)))*2;
  var theta = (Math.acos((rr1+(c*c)-rr0) / (2*r1*c)))*2;
  var area1 = 0.5*theta*rr1 - 0.5*rr1*Math.sin(theta);
  var area2 = 0.5*phi*rr0 - 0.5*rr0*Math.sin(phi);
  return area1 + area2;
}

/**
 * Floating text box that shows the most important parameters
 * It sticks to the right of the screen and adapts to the width of the window. 
 */



function InfoTextBox(p, x, y){
	let dotGain = sliderDotGain.value() / 10.0;
	let printheadDropsize = sliderDropsize.value();
	let nozzleDiam = p.pow( 3*printheadDropsize / (4 * p.PI), 1/3) * 2 * 10;
	let dotSize = p.pow(3*printheadDropsize / (2*p.PI), 1/3) * 2 * 10 * dotGain;	
	let dpiX = printheadNpi * (sliderXRes.value() + 1);
	let dpiY = sliderYRes.value();
	let dotSpacingX = 1000.0 / ((dpiX) / 25.4);	
	let dotSpacingY = 1000.0 / ((dpiY) / 25.4);

    // Cylinder height based on volume calculation
	let dotThickness = (1000 * printheadDropsize) / (p.PI * p.pow(dotSize/2.0, 2.0));
	
	// large area layer thickness calculation based on volume and print resolution
	let layerThickness = (printheadDropsize * 1000) / (dotSpacingX * dotSpacingY);
	
	
	textbox.position(x, y);	
	let textboxString = "";
	
	textboxString = 'Image size:\n';
	textboxString += '  ' + p.round(sliderImgWidthUm.slider.value()/1000.0, 3) + ' x ' + p.round(sliderImgHeightUm.slider.value()/1000.0, 3) + ' mm' + '\n';
	textboxString += '  ' + numX + " x " + numY + " pix" + '\n';
	
	textboxString += 'Print Resolution:\n';
	textboxString += '   ' + sliderPrintheadNpi.value() * (sliderXRes.value() + 1) + ' x ' + sliderYRes.value() + ' dpi' + '\n';
	
	textboxString += 'Drop diameter: \n';
	textboxString +=  '   ' +  p.round(nozzleDiam,1) + ' um' + '\n';
	
	textboxString += 'Dot diameter:\n';
	textboxString += '   ' +  p.round(dotSize,1) + ' um' + '\n';
	
	textboxString += 'Drops printed: ' + p.round(getNumberOfPrintedDrops(),1) + '\n';
	
	textboxString += 'Printed volume:\n'
	textboxString += '   ' + p.round(getPrintedVolume(),1) + ' pL' + ', ' + p.round(getPrintedVolume()/1000000,6) + ' mL' + '\n'
	
	textboxString += 'Dot thickness (cylinder):\n';
	textboxString += '   ' + p.round(dotThickness, 1) + ' um [Dry ' + p.round(dotThickness * sliderSolidContent.value() * 0.01, 1) + 'um]' + '\n';
	
	textboxString += 'Layer thickness (surface):\n';
	textboxString += '   ' + p.round(layerThickness, 1) + ' um [Dry ' + p.round(layerThickness * sliderSolidContent.value() * 0.01, 1) + 'um]';
	
	textbox.value(textboxString);
}

function getPrintedVolume(){
	
	return printheadDropsize* getNumberOfPrintedDrops();
}

function getNumberOfPrintedDrops(){
	return m_numberOfPrintedDrops;
}

function startAnimation(){
	checkboxDots.checked(true);
	animateDotsInPrintDirection = true;
}

// Copy and paste this function in to your sketch:
function copyToClipboard(text) {
    var dummy = document.createElement("textarea");
    document.body.appendChild(dummy);
    dummy.value = text;
    dummy.select();
    document.execCommand("copy");
    document.body.removeChild(dummy);
}

let mouseState = 0; // 0 = normal, 1 = drawShape, 2 = change cross section

function mouseDragged(p){
	//console.log('mouse dragged ' + mouseState);
	if(mouseState==0){
		if(isMouseOverGrid(p)) mouseState = 1;
		else if(isMouseOverCrossSection(p)) mouseState = 2; 
	}
	let isDirty = false;
	
	if(mouseState==1) isDirty = drawPattern(p);
	else if(mouseState==2) changeCrossSectionLocation(p);
	
	// Set the shape style to 'free draw' once the user has changed the pattern
	if(isDirty){ 
		radioBtnShape.selected('6');
	}
}

function changeCrossSectionLocation(p){
	let dotSpacingX = 1000.0 / ((dpiX) / 25.4);
    let dotSpacingY = 1000.0 / ((dpiY) / 25.4);

	// check if mouse left or right from the grid
	//if(p.mouseX < mx[0] - dotSpacingX/2 && p.mouseX > (mx[0] - dotSpacingX/2 - 25) &&
	//	p.mouseY > my[0] - dotSpacingY/2 && p.mouseY < (my[numY-1] + dotSpacingY/2)){
		
		let yMin = my[0] - dotSpacingY / 2;
		let rowNr =  p.floor((p.mouseY - yMin) / dotSpacingY);
		sliderCrossSectionYPos.value(rowNr+1);	

}

function mousePressed(p){
	mouseDragged(p);
	enableNozzleWithMouse(p);
}

function mouseReleased(p) {
	mouseState = 0;
	console.log('mouse released ' + mouseState);
	mouseDrawLine(p);
}

function isMouseOverCrossSection(p){
	let dotSpacingX = 1000.0 / ((dpiX) / 25.4);
    let dotSpacingY = 1000.0 / ((dpiY) / 25.4);
	// Check if mouse is over the area of the cross section arrow indicator
	return (p.mouseX < mx[0] - dotSpacingX/2 && p.mouseX > (mx[0] - dotSpacingX/2 - 25) &&
		p.mouseY > my[0] - dotSpacingY/2 && p.mouseY < (my[numY-1] + dotSpacingY/2));
}

function isMouseOverGrid(p){
	let dotSpacingX = 1000.0 / ((dpiX) / 25.4);
    let dotSpacingY = 1000.0 / ((dpiY) / 25.4);
	//console.log('x ' + p.mouseX + ' y ' + p.mouseY);
	
	if(p.mouseX > mx[0] - dotSpacingX/2 && p.mouseX < (mx[numX-1] + dotSpacingX/2) &&
		p.mouseY > my[0] - dotSpacingY/2 && p.mouseY < (my[numY-1] + dotSpacingY/2)) 
		return true;
	else return false;
}

// Free drawing a pattern with the mouse.
// Press the mouse key to add pixels at the mouse position
// Press any key like Ctrl or Alt key to erase pixels at the mouse position
function drawPattern(p){
	let dotSpacingX = 1000.0 / ((dpiX) / 25.4);
    let dotSpacingY = 1000.0 / ((dpiY) / 25.4);
	let isDirty = false;
	
	// check if mouse is in the grid
	if(p.mouseX > mx[0] - dotSpacingX/2 && p.mouseX < (mx[numX-1] + dotSpacingX/2) &&
		p.mouseY > my[0] - dotSpacingY/2 && p.mouseY < (my[numY-1] + dotSpacingY/2)){
		let xMin = mx[0] - dotSpacingX / 2;		
		let yMin = my[0] - dotSpacingY / 2;

		let colNr =  p.floor((p.mouseX - xMin) / dotSpacingX);
		let rowNr =  p.floor((p.mouseY - yMin) / dotSpacingY);
		
		jet[colNr][rowNr] = p.keyIsPressed && p.keyCode == p.CONTROL ? false : true;
		isDirty = true;
	}
	return isDirty;
}

let ALTbtnState = 0; // 0 is not pressed, 1 is pressed.
let lineStartXY = [-1, -1];

function mouseDrawLine(p){
	
	console.log('keycode ' + p.keyCode);
	let dotSpacingX = 1000.0 / ((dpiX) / 25.4);
	let dotSpacingY = 1000.0 / ((dpiY) / 25.4);
 	if (p.keyIsPressed && p.keyCode == p.ALT && ALTbtnState == 0){
		ALTbtnState = 1;
		// check if mouse is in the grid
		if(isMouseOverGrid(p)){
			let xMin = mx[0] - dotSpacingX / 2;		
			let yMin = my[0] - dotSpacingY / 2;

			let colNr =  p.floor((p.mouseX - xMin) / dotSpacingX);
			let rowNr =  p.floor((p.mouseY - yMin) / dotSpacingY);
			lineStartXY[0] = colNr
			lineStartXY[1] = rowNr;
			
		}
	}
	else if(ALTbtnState == 1){
		ALTbtnState = 0;
		//jet[colNr][rowNr] = keyIsPressed && keyCode == CONTROL ? false : true ;
		// check if mouse is in the grid
		if(isMouseOverGrid(p)){
			let xMin = mx[0] - dotSpacingX / 2;		
			let yMin = my[0] - dotSpacingY / 2;

			let colNr =  p.floor((p.mouseX - xMin) / dotSpacingX);
			let rowNr =  p.floor((p.mouseY - yMin) / dotSpacingY);
			p.drawLine(lineStartXY[0], lineStartXY[1], colNr, rowNr);
		}
		else{
			ALTbtnState = 0;
			lineStartXY[0] = -1
			lineStartXY[1] = -1;
		}
	}
}

function generatePattern(p){
	let invert = checkboxInvertShape.checked();
	
	if(radioBtnShape.value() != 6){
		// clear the current pattern
		for (let x = 0; x < numX; x++) {
			for (let y = 0; y < numY; y++) {
				jet[x][y] = false;
			}
		}
	}
	
	// Generate the pattern depending on the radio button choice
	if (radioBtnShape.value() == 0) fullSurface(p, numX, numY, invert);
	if (radioBtnShape.value() == 1) verticalLine(p, numX, numY, sliderLineWidth.value(), invert);
	if (radioBtnShape.value() == 2) horizontalLine(p, numX, numY, sliderLineWidth.value(), invert);
	if (radioBtnShape.value() == 3) printRectangle(p, numX, numY, sliderLineWidth.value(), invert);
	if (radioBtnShape.value() == 4) printCircle(p, numX, numY, sliderLineWidth.value(), invert);
	if (radioBtnShape.value() == 5) checkerBoard(p, numX, numY, invert);	
}		

function clearArray(points){
	for(let i=0; i<points.length; i++) points[i]=0;
}

function extendArray(nrPositions, array){
	for(let i=0; i<nrPositions; i++) array.push(0);
}

function mergePoints(points1, points2)
{
	if(points1.length != points2.length){
		console.log('Not the same length ' + points1.length +'  '+points2.length);
		return;
	}
	
	for(let i = 0; i<points1.length; i++){
		points1[i] += points2[i];
		//console.log(i + ' ' + points1[i] + ' ' + points2[i]);
	}
}

function smoothPoints(smoothPoints, points){
  let a = 5;  // average range (smooth range in pix)
  // average values
  let average=0;
  let nrPoints = 0;
	
  for(let x=0; x<points.length; x++){
    average = 0;
	nrPoints = 0;
    for(let i=p.max(0, x-a); i<p.min(points.length, x+a+1); i++){
     average += points[i];
     nrPoints++;
    }

    average = parseInt(average / nrPoints);
    smoothPoints.push(average);
  }
}

function averageArray(p, arrayIn, arrayOut, range){
  // average values
  let average=0;
  let nrPoints = 0;
	
  for(let i=0; i<arrayIn.length; i++){
    average = 0;
	nrPoints = 0;
    for(let j=p.max(0, i-range); j<p.min(arrayIn.length, i+range+1); j++){
     average += arrayIn[j];
     nrPoints++;
    }

    average = p.round(average / nrPoints);
    arrayOut.push(average);
  }
}

function movingAverage(array, range){
	//let lastAverage = 0;
	for(let i=0; i<array.length; i++){
		let average=0;
		for(let j=i; j<p.min(i+range, array.length-1); j++){
			//if(array[j]<=0) 
			//	average += lastAverage;
			//else 
				average += array[j];
		}
		average = average / range;
		//if(average > 0) lastAverage = average;
		array[i]=p.round(average);
	}
}

function printLine(points, yPos){
  let c = color(50,50,50);
  for(let x=0; x<points.length; x++){
	  
	let y1 = yPos-points[x];
	let y0 = yPos-points[x]+1;
	for(let y = y0; y>y1; y--){
		set(x, y , c);
	}
  }
}
 
function drawArc(orgX, orgY, w, h, apoints){
  w = p.round(w/2,0);
  h = parseInt(h);
  w = parseInt(w);
  let hh = h * h;
  let ww = w * w;
  let hhww = hh * ww;
  let x0 = w;
  let dx = 0;
  let c = colorPicker.color();
  orgX = parseInt(orgX);
  orgY = parseInt(orgY);
  
   //beginShape();
    // for (let x = -w; x <= w; x++){
		// vertex(orgX + x, orgY);
  // }

  // now do both halves at the same time, away from the diameter
  for (let y = 1; y <= h; y++)
  {
      let x1 = x0 - (dx - 1);  // try slopes of dx - 1 or more
      for ( ; x1 > 0; x1--)
          if (x1*x1*hh + y*y*ww <= hhww)
              break;
      dx = x0 - x1;  // current approximation of the slope
      x0 = x1;
   
      for (let x = -x0; x <= x0; x++)
      {
		  //if(index>0 && index < points.length)
			apoints[orgX + x] = y;
			//vertex(orgX + x, orgY - y);
          //set(orgX + x, orgY - y, c);  // top half
          //set(orgX + x, orgY + y, c); // bottom half
      }
  }  
  
  //endShape(CLOSE);
  
  //updatePixels();
  // let str = 'drawArc:' + parseInt(orgX) + ' ' + parseInt(centerX) + ' ';
  // for (let i=0; i<points.length; i++){
	// str += points[i] + ',';
  // }
  // console.log( str );
}

function addDotToVertexArray(p, orgX, orgY, w, h, vertexArray){
	w = p.round(w/2,0);
	h = p.round(h);
	let hh = h * h;
	let ww = w * w;
	let hhww = hh * ww;
	let x0 = w;
	let dx = 0;
	let c = colorPicker.color();
	orgX = p.round(orgX);
	orgY = p.round(orgY);

	let tempArr = [];
	for (let i = 0; i<w*2; i++) tempArr.push(0);

	// Algorithm found here: https://stackoverflow.com/questions/10322341/simple-algorithm-for-drawing-p.filled-ellipse-in-c-c
	// now do both halves at the same time, away from the diameter
	for (let y = 1; y <= h; y++)
	{
		let x1 = x0 - (dx - 1);  // try slopes of dx - 1 or more
		for ( ; x1 > 0; x1--)
		  if (x1*x1*hh + y*y*ww <= hhww)
			  break;
		dx = x0 - x1;  // current approximation of the slope
		x0 = x1;

		for (let x = -x0; x <= x0; x++)
		{
			tempArr[x+w] = y;
		}
	}

	for (let i = 0; i<w*2; i++){
		vertexArray[orgX + i - w] += tempArr[i];
	}
}

function swap(a, b){
	let c;
	a = c;
	b = a;
	a = c;
}

function drawLine(x0, y0, x1, y1){
	console.log('draw line: ' + x0 + ' ' + y0 + ' ' + x1 + ' '  + y1);
    let steep = false; 
    if (abs(x0-x1) < abs(y0-y1)) { 
        swap(x0, y0); 
        swap(x1, y1); 
        steep = true; 
    } 
    if (x0 > x1){ 
        swap(x0, x1); 
        swap(y0, y1); 
    } 
    let dx = x1-x0; 
    let dy = y1-y0; 
    let derror2 = abs(dy)*2; 
    let error2 = 0; 
    let y = y0; 

    for (let x=x0; x<=x1; x++){ 
        if (steep) { 
			jet[y][x] = true;
        } else { 
			jet[x][y] = true;
        } 
		console.log('draw line: ' + x + ' ' + y);
        error2 += derror2; 
        if (error2 > dx){ 
            y += y1>y0 ? 1: -1; 
            error2 -= dx*2; 
        } 
    } 
}

function keyPressed(p) {
  if (p.keyCode === 188) {	// ',' comma key
	  let pass = sliderShowPasses.value();
	  sliderShowPasses.value(pass-1);
  }
  if (p.keyCode === 190) {	// '.' point key
	  let pass = sliderShowPasses.value();
	  sliderShowPasses.value(pass+1);
  }
}

// Create an image if the file is an image.
function handleImage(file) {
  userImage = null;
  if (file.type === 'image') {
	userImage = mainP.loadImage(file.data, '');
	userImageLoadingComplete = true;
  } else {
    userImage = null;
	userImageLoadingComplete = false;
  }
}

function drawUserImage(p){
	if (userImage == null) return;

	for (let x = 0; x < numX; x++) {
		for (let y = 0; y < numY; y++) {
			let color = userImage.get(x, y);
			jet[x][y] = p.brightness(color) < 90;
		}
	}
}
