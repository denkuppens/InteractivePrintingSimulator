
// left pane slider creator with text. Make sure you use ${value} in the initalText string to update the value of the slider.
class PsSliderWithText {	
	
  constructor(p, min, max, value, step, /*divId,*/ initialText, posX, posY, tooltip='') {


    this.container = p.createDiv('');
	this.container.style('border: none;');
	if(tooltip.length>0) this.container.class('tooltip');
	this.container.parent('leftPane');
	this.container.position(posX, posY);
	
		this.div = p.createDiv(initialText);
	//this.div.parent('leftPane');
	this.div.parent(this.container);
	this.div.class('smallText');
	this.div.position(0, -9);

	this.slider = p.createSlider(min, max, value, step);
	this.slider.parent(this.container);
	
	this.slider.size(150);
	
	this.posX = posX;
	this.posY = posY;
	this.initialText = initialText;
	this.updateText();
	this.slider.input( (params) => { this.updateText(); } );
	
	this.tooltipSpan = p.createSpan(tooltip);
	this.tooltipSpan.parent(this.container);
	this.tooltipSpan.class('tooltiptext');
  }
  
  	updateText(){
		let value = this.slider.value(); 
		this.div.html( eval ('`'+ this.initialText + '`'));
	}
	
	value(v){
		if (v == null) return this.slider.value();
		this.slider.value(v);
		this.updateText();
		return this.slider.value();
	}
	
	enabled(v) {
	   if (v == true){
		 // Re-enable the button
		 this.slider.removeAttribute('disabled');
		} else {
		 // Disable the button
		 this.slider.attribute('disabled', '');
	   }
	 }	
}

class PsSpan {
	constructor(p, txt, posX, posY) {
		this.span = p.createSpan(txt);
		this.span.parent("leftPane");
		this.span.position(posX, posY);
		this.span.class('PsSpan');
			
		/*
		this.span.style('fontFamily', 'Courier New');
		this.span.style('font-weight', 'bold');
		this.span.style('background-color', '#B0B0B0');
		this.span.style('width', '200px');
		*/
	}
}

class PsDialog{
	constructor(p, title, posX, posY){
	this.div = p.createDiv('');
	this.div.parent('mainPane');
	this.div.id("dialog");
	//this.div.class('smallText');
	this.div.position(posX, posY);
	
	this.headerDiv = p.createDiv(title);
	this.headerDiv.id("dialogHeader");
	this.headerDiv.parent(this.div);
	
	this.imageSize = p.createDiv("Image size<br>0.5 x 0.5 mm<br>22 x 22 pix");
	this.imageSize.id("imagesize");
	this.imageSize.class('smallTextSelectable');
	this.imageSize.parent(this.div);
	
	this.posX = posX;
	this.posY = posY;
	}
	
	
	updateText(){
		//let value = this.slider.value(); 
		//this.div.html( eval ('`'+ this.initialText + '`'));
	}
	
	 updateImageSize(width=0, height=0, pixx=0, pixy=0){
		this.imageSize.html("Image size<br>"+width+" x "+height+" mm<br>"+pixx+" x "+pixy+" pix");
	}
	
	value(v){
		//if (v == null) return this.slider.value();
		//this.slider.value(v);
		//this.updateText();
		//return this.slider.value();
	}
}
